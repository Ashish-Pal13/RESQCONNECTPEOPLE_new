package com.resqconnect.http;

import com.resqconnect.util.ApiError;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class Router {
    @FunctionalInterface
    public interface Step {
        Res apply(Req req) throws Exception;
    }

    private record Route(String method, String[] segments, Step[] steps) {
    }

    public record Match(Map<String, String> params, Step[] steps) {
    }

    private final List<Route> routes = new ArrayList<>();

    public Router get(String path, Step... steps) {
        return add("GET", path, steps);
    }

    public Router post(String path, Step... steps) {
        return add("POST", path, steps);
    }

    public Router patch(String path, Step... steps) {
        return add("PATCH", path, steps);
    }

    public Router add(String method, String path, Step... steps) {
        routes.add(new Route(method, split(path), steps));
        return this;
    }

    private static String[] split(String path) {
        String trimmed = path.startsWith("/") ? path.substring(1) : path;
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed.isEmpty() ? new String[0] : trimmed.split("/", -1);
    }

    public Match match(String method, String path) {
        String[] parts = split(path);
        for (Route route : routes) {
            boolean methodOk = route.method.equals(method) || ("HEAD".equals(method) && "GET".equals(route.method));
            if (!methodOk || route.segments.length != parts.length) {
                continue;
            }
            Map<String, String> params = new LinkedHashMap<>();
            boolean ok = true;
            for (int i = 0; i < parts.length && ok; i++) {
                String expected = route.segments[i];
                String actual = parts[i];
                if (expected.startsWith(":")) {
                    if (actual.isEmpty()) {
                        ok = false;
                    } else {
                        params.put(expected.substring(1), decodeParam(actual));
                    }
                } else {
                    ok = expected.toLowerCase(Locale.ROOT).equals(actual.toLowerCase(Locale.ROOT));
                }
            }
            if (ok) {
                return new Match(params, route.steps);
            }
        }
        return null;
    }

    private static String decodeParam(String raw) {
        if (raw.indexOf('%') < 0) {
            return raw;
        }
        try {
            return URLDecoder.decode(raw.replace("+", "%2B"), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new ApiError(400, "Bad request");
        }
    }

    public static Res run(Step[] steps, Req req) throws Exception {
        for (Step step : steps) {
            Res res = step.apply(req);
            if (res != null) {
                return res;
            }
        }
        return Res.error(404, "Endpoint not found");
    }
}
