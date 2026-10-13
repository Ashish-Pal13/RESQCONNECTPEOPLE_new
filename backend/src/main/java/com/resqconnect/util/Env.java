package com.resqconnect.util;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class Env {
    private final Map<String, String> values;

    private Env(Map<String, String> values) {
        this.values = values;
    }

    public static Env load() {
        return load(Path.of(".env"));
    }

    public static Env load(Path file) {
        Map<String, String> merged = new LinkedHashMap<>();
        if (Files.isRegularFile(file)) {
            try {
                merged.putAll(parse(Files.readAllLines(file, StandardCharsets.UTF_8)));
            } catch (IOException e) {
                System.err.println("Could not read " + file.toAbsolutePath() + ": " + e.getMessage());
            }
        }
        merged.putAll(System.getenv());
        return new Env(merged);
    }

    public static Env of(Map<String, String> values) {
        return new Env(new LinkedHashMap<>(values));
    }

    static Map<String, String> parse(List<String> lines) {
        Map<String, String> result = new LinkedHashMap<>();
        for (String original : lines) {
            String line = original.strip();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            if (line.startsWith("export ")) {
                line = line.substring(7).strip();
            }
            int eq = line.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String key = line.substring(0, eq).strip();
            if (!key.matches("[\\w.-]+")) {
                continue;
            }
            String rest = line.substring(eq + 1).strip();
            String value;
            if (!rest.isEmpty() && (rest.charAt(0) == '"' || rest.charAt(0) == '\'' || rest.charAt(0) == '`')) {
                char quote = rest.charAt(0);
                int end = -1;
                for (int i = rest.length() - 1; i > 0; i--) {
                    if (rest.charAt(i) == quote) {
                        end = i;
                        break;
                    }
                }
                if (end > 0) {
                    value = rest.substring(1, end);
                    if (quote == '"') {
                        value = value.replace("\\n", "\n").replace("\\r", "\r");
                    }
                } else {
                    value = cutComment(rest);
                }
            } else {
                value = cutComment(rest);
            }
            result.put(key, value);
        }
        return result;
    }

    private static String cutComment(String value) {
        int hash = value.indexOf('#');
        return (hash >= 0 ? value.substring(0, hash) : value).strip();
    }

    public String get(String key) {
        return values.get(key);
    }

    public String get(String key, String fallback) {
        String value = values.get(key);
        return value == null || value.isEmpty() ? fallback : value;
    }
}
