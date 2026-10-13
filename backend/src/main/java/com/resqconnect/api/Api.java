package com.resqconnect.api;

import com.resqconnect.config.Settings;
import com.resqconnect.db.Db;
import com.resqconnect.http.App;
import com.resqconnect.http.RateLimiter;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.http.StaticFiles;
import com.resqconnect.util.Json;

public final class Api {
    private static final long WINDOW_MS = 15 * 60 * 1000L;

    private Api() {
    }

    public static App create(Settings settings, Db db, Passwords passwords) {
        Security security = new Security(db, new Jwt(settings.jwtSecret()));
        RateLimiter authLimiter = new RateLimiter(30, WINDOW_MS, "Too many sign-in attempts. Try again in 15 minutes.");
        RateLimiter contactLimiter = new RateLimiter(10, WINDOW_MS, "Too many messages. Try again in 15 minutes.");
        Router router = new Router();
        router.get("/api/health", req -> {
            try {
                db.query("SELECT 1");
                return Res.json(200, Json.obj("ok", true, "database", "connected"));
            } catch (RuntimeException e) {
                return Res.json(503, Json.obj("ok", false, "database", "unavailable"));
            }
        });
        new AuthRoutes(db, security, passwords).register(router, authLimiter);
        new ContactRoutes(db, security).register(router, contactLimiter);
        new AdminRoutes(db, security).register(router);
        new IncidentRoutes(db, security).register(router);
        new VolunteerRoutes(db, security).register(router);
        new AssignmentRoutes(db, security).register(router);
        new ResourceRoutes(db, security).register(router);
        new TicketRoutes(db, security).register(router);
        new NotificationRoutes(db, security).register(router);
        return new App(settings, router, StaticFiles.locate(settings.frontendDist()));
    }
}
