package com.resqconnect.http;

import java.io.ByteArrayOutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class Req {
    public static final int BODY_LIMIT = 50 * 1024;

    private final String method;
    private final String path;
    private final String rawQuery;
    private final Map<String, String> headers;
    private final byte[] body;
    private final boolean bodyTooLarge;
    private final String remoteAddress;

    private Map<String, Object> query;
    private Object json = new LinkedHashMap<String, Object>();
    private Map<String, String> params = Map.of();
    private Map<String, Object> user;
    private Long userId;
    private String ip;
    private String rateLimitPolicy;
    private String rateLimitValue;

    public void rateLimitHeaders(String policy, String value) {
        this.rateLimitPolicy = policy;
        this.rateLimitValue = value;
    }

    public String rateLimitPolicy() {
        return rateLimitPolicy;
    }

    public String rateLimitValue() {
        return rateLimitValue;
    }

    public Req(String method, String path, String rawQuery, Map<String, String> headers, byte[] body, boolean bodyTooLarge, String remoteAddress) {
        this.method = method.toUpperCase(Locale.ROOT);
        this.path = path == null || path.isEmpty() ? "/" : path;
        this.rawQuery = rawQuery;
        Map<String, String> lower = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            lower.merge(entry.getKey().toLowerCase(Locale.ROOT), entry.getValue(), (a, b) -> a + ", " + b);
        }
        this.headers = lower;
        this.body = body == null ? new byte[0] : body;
        this.bodyTooLarge = bodyTooLarge;
        this.remoteAddress = remoteAddress;
        this.ip = remoteAddress;
    }

    public static byte[] readLimited(java.io.InputStream in, int limit, boolean[] tooLarge) throws java.io.IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int total = 0;
        int read;
        while ((read = in.read(buffer)) != -1) {
            if (total + read > limit) {
                tooLarge[0] = true;
                out.write(buffer, 0, Math.max(0, limit - total));
                break;
            }
            out.write(buffer, 0, read);
            total += read;
        }
        return out.toByteArray();
    }

    public String method() {
        return method;
    }

    public String path() {
        return path;
    }

    public String header(String name) {
        return headers.get(name.toLowerCase(Locale.ROOT));
    }

    public byte[] body() {
        return body;
    }

    public boolean bodyTooLarge() {
        return bodyTooLarge;
    }

    public String remoteAddress() {
        return remoteAddress;
    }

    public String ip() {
        return ip;
    }

    public void ip(String ip) {
        this.ip = ip;
    }

    public Object json() {
        return json;
    }

    public void json(Object json) {
        this.json = json;
    }

    public Map<String, String> params() {
        return params;
    }

    public void params(Map<String, String> params) {
        this.params = params;
    }

    public Map<String, Object> user() {
        return user;
    }

    public Long userId() {
        return userId;
    }

    public String userRole() {
        return user == null ? null : (String) user.get("role");
    }

    public String userName() {
        return user == null ? null : (String) user.get("name");
    }

    public void user(Map<String, Object> user, Long userId) {
        this.user = user;
        this.userId = userId;
    }

    public Map<String, Object> query() {
        if (query == null) {
            query = parseQuery(rawQuery);
        }
        return query;
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> parseQuery(String raw) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (raw == null || raw.isEmpty()) {
            return result;
        }
        int count = 0;
        for (String part : raw.split("&")) {
            if (part.isEmpty()) {
                continue;
            }
            if (++count > 1000) {
                break;
            }
            int eq = part.indexOf('=');
            String key = decode(eq < 0 ? part : part.substring(0, eq));
            String value = eq < 0 ? "" : decode(part.substring(eq + 1));
            if (key.isEmpty()) {
                continue;
            }
            Object existing = result.get(key);
            if (existing == null) {
                result.put(key, value);
            } else if (existing instanceof List<?> list) {
                ((List<Object>) list).add(value);
            } else {
                List<Object> list = new ArrayList<>();
                list.add(existing);
                list.add(value);
                result.put(key, list);
            }
        }
        return result;
    }

    private static String decode(String value) {
        String plus = value.replace('+', ' ');
        try {
            return URLDecoder.decode(plus.replace("%u", "%25u"), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return plus;
        }
    }
}
