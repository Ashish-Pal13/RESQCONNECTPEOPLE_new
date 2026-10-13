package com.resqconnect.http;

import com.resqconnect.config.Settings;
import com.resqconnect.db.DbException;
import com.resqconnect.util.ApiError;
import com.resqconnect.util.Json;

import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

public final class App {
    private static final String CSP = "default-src 'self';base-uri 'self';font-src 'self' https://fonts.gstatic.com data:;"
            + "form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';"
            + "script-src-attr 'none';style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;upgrade-insecure-requests";

    private final Settings settings;
    private final Router router;
    private final StaticFiles staticFiles;

    public App(Settings settings, Router router, StaticFiles staticFiles) {
        this.settings = settings;
        this.router = router;
        this.staticFiles = staticFiles;
    }

    public Res handle(Req req) {
        Res res;
        boolean corsAllowed = false;
        try {
            req.ip(settings.trustProxy().clientIp(req.remoteAddress(), req.header("x-forwarded-for")));
            String origin = req.header("origin");
            corsAllowed = origin == null || settings.clientOrigins().contains(origin);
            if (corsAllowed && req.method().equals("OPTIONS")) {
                res = Res.empty(204);
                if (origin != null) {
                    res.header("Access-Control-Allow-Origin", origin);
                }
                res.header("Vary", "Origin");
                res.header("Access-Control-Allow-Methods", "GET,POST,PATCH");
                res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
                res.header("Access-Control-Expose-Headers", "X-Result-Truncated");
                res.header("Content-Length", "0");
                securityHeaders(res);
                return res;
            }
            parseBody(req);
            res = dispatch(req);
        } catch (Throwable error) {
            res = errorResponse(error);
        }
        if (req.rateLimitPolicy() != null && !res.hasHeader("RateLimit-Policy")) {
            res.header("RateLimit-Policy", req.rateLimitPolicy());
            res.header("RateLimit", req.rateLimitValue());
        }
        if (corsAllowed) {
            String origin = req.header("origin");
            if (origin != null) {
                res.header("Access-Control-Allow-Origin", origin);
            }
            res.addHeader("Vary", "Origin");
            res.header("Access-Control-Expose-Headers", "X-Result-Truncated");
        }
        securityHeaders(res);
        return res;
    }

    private static void securityHeaders(Res res) {
        res.header("Content-Security-Policy", CSP);
        res.header("Cross-Origin-Opener-Policy", "same-origin");
        res.header("Cross-Origin-Resource-Policy", "same-origin");
        res.header("Origin-Agent-Cluster", "?1");
        res.header("Referrer-Policy", "no-referrer");
        res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        res.header("X-Content-Type-Options", "nosniff");
        res.header("X-DNS-Prefetch-Control", "off");
        res.header("X-Download-Options", "noopen");
        res.header("X-Frame-Options", "SAMEORIGIN");
        res.header("X-Permitted-Cross-Domain-Policies", "none");
        res.header("X-XSS-Protection", "0");
    }

    private static boolean isJson(String contentType) {
        if (contentType == null) {
            return false;
        }
        String type = contentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
        return type.equals("application/json");
    }

    private static boolean hasBody(Req req) {
        return req.header("transfer-encoding") != null || (req.header("content-length") != null && !req.header("content-length").trim().isEmpty());
    }

    private static void parseBody(Req req) {
        if (!isJson(req.header("content-type")) || !hasBody(req)) {
            return;
        }
        if (req.bodyTooLarge()) {
            throw new ApiError(413, "Request body too large");
        }
        byte[] bytes = req.body();
        if (bytes.length == 0) {
            return;
        }
        String text;
        try {
            text = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPLACE)
                    .onUnmappableCharacter(CodingErrorAction.REPLACE)
                    .decode(java.nio.ByteBuffer.wrap(bytes)).toString();
        } catch (CharacterCodingException e) {
            throw new ApiError(400, "Malformed JSON body");
        }
        if (!text.isEmpty() && text.charAt(0) == '﻿') {
            text = text.substring(1);
        }
        int i = 0;
        while (i < text.length() && (text.charAt(i) == ' ' || text.charAt(i) == '\t' || text.charAt(i) == '\n' || text.charAt(i) == '\r')) {
            i++;
        }
        if (i >= text.length() || (text.charAt(i) != '{' && text.charAt(i) != '[')) {
            throw new ApiError(400, "Malformed JSON body");
        }
        try {
            req.json(Json.parse(text));
        } catch (Json.ParseException e) {
            throw new ApiError(400, "Malformed JSON body");
        }
    }

    private static boolean isApiPath(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.equals("/api") || lower.startsWith("/api/");
    }

    private Res dispatch(Req req) throws Exception {
        if (isApiPath(req.path())) {
            Router.Match match = router.match(req.method(), req.path());
            if (match == null) {
                return Res.error(404, "Endpoint not found");
            }
            req.params(match.params());
            return Router.run(match.steps(), req);
        }
        Res file = staticFiles.serve(req);
        if (file != null) {
            return file;
        }
        return Res.error(404, "Endpoint not found");
    }

    static Res errorResponse(Throwable error) {
        if (error instanceof ApiError api) {
            if (api.details() != null) {
                return Res.json(api.status(), Json.obj("error", api.getMessage(), "details", api.details()));
            }
            return Res.error(api.status(), api.getMessage());
        }
        DbException db = findDbException(error);
        if (db != null) {
            if (db.connectionProblem()) {
                System.err.println("Database unavailable: " + db.describe());
                return Res.error(503, "The database is temporarily unavailable. Please try again shortly.");
            }
            String state = db.sqlState() == null ? "" : db.sqlState();
            if (state.equals("23503")) {
                return Res.error(400, "Referenced record does not exist");
            }
            if (state.equals("23505")) {
                return Res.error(409, "Record already exists");
            }
            if (List.of("22003", "22P02").contains(state)) {
                return Res.error(400, "Invalid value");
            }
        }
        System.err.println("Unhandled error: " + error);
        error.printStackTrace();
        return Res.error(500, "Internal server error");
    }

    private static DbException findDbException(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof DbException db) {
                return db;
            }
            current = current.getCause();
        }
        return null;
    }
}
