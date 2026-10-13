package com.resqconnect.db;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public record DatabaseUrl(String host, int port, String database, String user, String password, String query) {

    public static DatabaseUrl parse(String value) {
        URI uri;
        try {
            uri = new URI(value.trim());
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("DATABASE_URL is not a valid URL. Use postgresql://USER:PASSWORD@localhost:5432/RESQCONNECTPEOPLE and URL-encode special characters in the password.");
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (!scheme.equals("postgresql") && !scheme.equals("postgres")) {
            throw new IllegalArgumentException("DATABASE_URL must start with postgresql://");
        }
        String host = uri.getHost();
        if (host == null || host.isEmpty()) {
            host = "localhost";
        }
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path = uri.getRawPath() == null ? "" : uri.getRawPath();
        String database = decode(path.startsWith("/") ? path.substring(1) : path);
        String user = null;
        String password = null;
        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            int colon = userInfo.indexOf(':');
            user = decode(colon >= 0 ? userInfo.substring(0, colon) : userInfo);
            password = colon >= 0 ? decode(userInfo.substring(colon + 1)) : null;
        }
        return new DatabaseUrl(host, port, database, user, password, uri.getRawQuery());
    }

    private static String decode(String value) {
        return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
    }

    public DatabaseUrl withDatabase(String name) {
        return new DatabaseUrl(host, port, name, user, password, query);
    }

    public String jdbcUrl() {
        String hostPart = host.contains(":") && !host.startsWith("[") ? "[" + host + "]" : host;
        StringBuilder url = new StringBuilder("jdbc:postgresql://").append(hostPart).append(':').append(port).append('/')
                .append(database.isEmpty() ? "postgres" : database);
        if (query != null && !query.isEmpty()) {
            url.append('?').append(query);
        }
        return url.toString();
    }
}
