package com.resqconnect.config;

import com.resqconnect.http.TrustProxy;
import com.resqconnect.util.Env;

import java.util.ArrayList;
import java.util.List;

public record Settings(String databaseUrl, String jwtSecret, List<String> clientOrigins, TrustProxy trustProxy,
                       int port, String frontendDist, int poolMax) {

    public static Settings from(Env env) {
        String jwtSecret = env.get("JWT_SECRET", "");
        String databaseUrl = env.get("DATABASE_URL", "");
        if (jwtSecret.length() < 32 || databaseUrl.isEmpty()) {
            throw new IllegalStateException("Configure DATABASE_URL and a JWT_SECRET of at least 32 characters");
        }
        List<String> origins = new ArrayList<>();
        for (String origin : env.get("CLIENT_ORIGIN", "http://localhost:5173").split(",")) {
            String trimmed = origin.trim();
            if (!trimmed.isEmpty()) {
                origins.add(trimmed);
            }
        }
        TrustProxy trustProxy = TrustProxy.parse(env.get("TRUST_PROXY"));
        int port = parseInt(env.get("PORT", "5000"), "PORT");
        int poolMax = parseInt(env.get("DB_POOL_MAX", "10"), "DB_POOL_MAX");
        return new Settings(databaseUrl, jwtSecret, List.copyOf(origins), trustProxy, port, env.get("FRONTEND_DIST"), poolMax);
    }

    private static int parseInt(String value, String name) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException(name + " must be a number, got \"" + value + "\"");
        }
    }
}
