package com.resqconnect.http;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

public final class StaticFiles {
    private static final Map<String, String> TYPES = Map.ofEntries(
            Map.entry("html", "text/html; charset=utf-8"),
            Map.entry("htm", "text/html; charset=utf-8"),
            Map.entry("js", "application/javascript; charset=utf-8"),
            Map.entry("mjs", "application/javascript; charset=utf-8"),
            Map.entry("css", "text/css; charset=utf-8"),
            Map.entry("json", "application/json; charset=utf-8"),
            Map.entry("map", "application/json; charset=utf-8"),
            Map.entry("txt", "text/plain; charset=utf-8"),
            Map.entry("xml", "application/xml"),
            Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("gif", "image/gif"),
            Map.entry("webp", "image/webp"),
            Map.entry("avif", "image/avif"),
            Map.entry("svg", "image/svg+xml"),
            Map.entry("ico", "image/vnd.microsoft.icon"),
            Map.entry("mp4", "video/mp4"),
            Map.entry("webm", "video/webm"),
            Map.entry("mp3", "audio/mpeg"),
            Map.entry("woff", "font/woff"),
            Map.entry("woff2", "font/woff2"),
            Map.entry("ttf", "font/ttf"),
            Map.entry("otf", "font/otf"),
            Map.entry("pdf", "application/pdf"),
            Map.entry("wasm", "application/wasm"));
    private static final DateTimeFormatter HTTP_DATE = DateTimeFormatter.RFC_1123_DATE_TIME;

    private final Path root;

    public StaticFiles(Path root) {
        this.root = root == null ? null : root.toAbsolutePath().normalize();
    }

    public static StaticFiles locate(String configured) {
        Path[] candidates = configured != null && !configured.isBlank()
                ? new Path[]{Path.of(configured)}
                : new Path[]{Path.of("..", "frontend", "dist"), Path.of("frontend", "dist")};
        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate.resolve("index.html"))) {
                return new StaticFiles(candidate);
            }
        }
        return new StaticFiles(null);
    }

    public boolean enabled() {
        return root != null;
    }

    public Path root() {
        return root;
    }

    public Res serve(Req req) throws IOException {
        if (root == null) {
            return null;
        }
        if (!req.method().equals("GET") && !req.method().equals("HEAD")) {
            return null;
        }
        Path file = resolve(req.path());
        if (file != null) {
            return send(req, file, "public, max-age=3600");
        }
        return send(req, root.resolve("index.html"), "public, max-age=0");
    }

    private Path resolve(String rawPath) {
        String decoded;
        try {
            decoded = URLDecoder.decode(rawPath.replace("+", "%2B"), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return null;
        }
        if (decoded.indexOf('\0') >= 0) {
            return null;
        }
        for (String segment : decoded.split("/")) {
            if (segment.startsWith(".") && !segment.isEmpty()) {
                return null;
            }
        }
        String relative = decoded.startsWith("/") ? decoded.substring(1) : decoded;
        if (relative.isEmpty()) {
            return null;
        }
        Path candidate = root.resolve(relative).normalize();
        if (!candidate.startsWith(root) || !Files.isRegularFile(candidate)) {
            return null;
        }
        return candidate;
    }

    private Res send(Req req, Path file, String cacheControl) throws IOException {
        BasicFileAttributes attributes = Files.readAttributes(file, BasicFileAttributes.class);
        long size = attributes.size();
        Instant modified = attributes.lastModifiedTime().toInstant();
        String etag = "W/\"" + Long.toHexString(size) + "-" + Long.toHexString(modified.toEpochMilli()) + "\"";
        String lastModified = HTTP_DATE.format(ZonedDateTime.ofInstant(modified, ZoneOffset.UTC));
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        String type = TYPES.getOrDefault(dot >= 0 ? name.substring(dot + 1).toLowerCase(Locale.ROOT) : "", "application/octet-stream");

        String ifNoneMatch = req.header("if-none-match");
        boolean notModified = false;
        if (ifNoneMatch != null) {
            for (String tag : ifNoneMatch.split(",")) {
                String t = tag.trim();
                if (t.equals("*") || t.equals(etag) || t.equals(etag.substring(2))) {
                    notModified = true;
                }
            }
        } else if (req.header("if-modified-since") != null) {
            try {
                Instant since = ZonedDateTime.parse(req.header("if-modified-since"), HTTP_DATE).toInstant();
                notModified = !modified.isAfter(since.plusMillis(999));
            } catch (Exception ignored) {
                notModified = false;
            }
        }
        if (notModified) {
            Res res = Res.empty(304);
            res.header("Cache-Control", cacheControl);
            res.header("Last-Modified", lastModified);
            res.header("ETag", etag);
            return res;
        }

        long start = 0;
        long length = size;
        int status = 200;
        String range = req.header("range");
        if (range != null && range.startsWith("bytes=") && !range.contains(",")) {
            String spec = range.substring(6).trim();
            int dash = spec.indexOf('-');
            try {
                if (dash >= 0) {
                    String from = spec.substring(0, dash).trim();
                    String to = spec.substring(dash + 1).trim();
                    long first;
                    long last;
                    if (from.isEmpty()) {
                        long suffix = Long.parseLong(to);
                        first = Math.max(0, size - suffix);
                        last = size - 1;
                    } else {
                        first = Long.parseLong(from);
                        last = to.isEmpty() ? size - 1 : Math.min(Long.parseLong(to), size - 1);
                    }
                    if (first >= size || first > last) {
                        Res res = Res.empty(416);
                        res.header("Content-Range", "bytes */" + size);
                        res.header("Accept-Ranges", "bytes");
                        return res;
                    }
                    start = first;
                    length = last - first + 1;
                    status = 206;
                }
            } catch (NumberFormatException ignored) {
                start = 0;
                length = size;
                status = 200;
            }
        }
        Res res = Res.file(status, file, start, length);
        res.header("Accept-Ranges", "bytes");
        res.header("Cache-Control", cacheControl);
        res.header("Last-Modified", lastModified);
        res.header("ETag", etag);
        res.header("Content-Type", type);
        if (status == 206) {
            res.header("Content-Range", "bytes " + start + "-" + (start + length - 1) + "/" + size);
        }
        return res;
    }
}
