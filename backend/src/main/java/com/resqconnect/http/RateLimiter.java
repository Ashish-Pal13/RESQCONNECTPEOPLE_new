package com.resqconnect.http;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

public final class RateLimiter implements Router.Step {
    private static final class Window {
        int hits;
        long resetAt;
    }

    private final int limit;
    private final long windowMs;
    private final String message;
    private final LongSupplier clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private long lastSweep;

    public RateLimiter(int limit, long windowMs, String message) {
        this(limit, windowMs, message, System::currentTimeMillis);
    }

    public RateLimiter(int limit, long windowMs, String message, LongSupplier clock) {
        this.limit = limit;
        this.windowMs = windowMs;
        this.message = message;
        this.clock = clock;
    }

    @Override
    public Res apply(Req req) {
        long now = clock.getAsLong();
        sweep(now);
        String key = req.ip() == null ? "unknown" : req.ip();
        Window window = windows.compute(key, (k, existing) -> {
            Window w = existing;
            if (w == null || now >= w.resetAt) {
                w = new Window();
                w.resetAt = now + windowMs;
            }
            w.hits++;
            return w;
        });
        int hits;
        long resetAt;
        synchronized (window) {
            hits = window.hits;
            resetAt = window.resetAt;
        }
        long resetSeconds = Math.max(0, (long) Math.ceil((resetAt - now) / 1000.0));
        int remaining = Math.max(0, limit - hits);
        if (hits > limit) {
            Res res = Res.error(429, message);
            addHeaders(res, remaining, resetSeconds);
            res.header("Retry-After", String.valueOf(resetSeconds));
            return res;
        }
        req.rateLimitHeaders(policy(), "limit=" + limit + ", remaining=" + remaining + ", reset=" + resetSeconds);
        return null;
    }

    private String policy() {
        return limit + ";w=" + (windowMs / 1000);
    }

    private void addHeaders(Res res, int remaining, long resetSeconds) {
        res.header("RateLimit-Policy", policy());
        res.header("RateLimit", "limit=" + limit + ", remaining=" + remaining + ", reset=" + resetSeconds);
    }

    private void sweep(long now) {
        if (now - lastSweep < 60_000) {
            return;
        }
        lastSweep = now;
        Iterator<Map.Entry<String, Window>> it = windows.entrySet().iterator();
        while (it.hasNext()) {
            if (now >= it.next().getValue().resetAt) {
                it.remove();
            }
        }
    }
}
