package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.ApiError;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.LongSupplier;

public final class Security {
    public static final String COORDINATOR = "coordinator";
    public static final String VERIFIER = "verifier";
    public static final String USER = "user";
    public static final List<String> STAFF = List.of(COORDINATOR, VERIFIER);

    private final Db db;
    private final Jwt jwt;
    private final LongSupplier clockSeconds;

    public Security(Db db, Jwt jwt) {
        this(db, jwt, () -> System.currentTimeMillis() / 1000);
    }

    public Security(Db db, Jwt jwt, LongSupplier clockSeconds) {
        this.db = db;
        this.jwt = jwt;
        this.clockSeconds = clockSeconds;
    }

    public String tokenFor(Map<String, Object> user) {
        return jwt.sign(String.valueOf(user.get("id")), (String) user.get("role"), clockSeconds.getAsLong());
    }

    public static Map<String, Object> safeUser(Map<String, Object> user) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", user.get("id"));
        out.put("name", user.get("name"));
        out.put("email", user.get("email"));
        out.put("username", user.get("username"));
        out.put("role", user.get("role"));
        return out;
    }

    public static boolean is(Req req, String... roles) {
        String role = req.userRole();
        for (String r : roles) {
            if (r.equals(role)) {
                return true;
            }
        }
        return false;
    }

    public final Router.Step auth = this::authenticate;

    private Res authenticate(Req req) {
        String bearer = req.header("authorization");
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            return Res.error(401, "Authentication required");
        }
        Map<String, Object> payload;
        try {
            payload = jwt.verify(bearer.substring(7), clockSeconds.getAsLong());
        } catch (Jwt.InvalidToken e) {
            return Res.error(401, e.expired() ? "Your session has expired. Please sign in again." : "Invalid or expired token");
        }
        Object sub = payload.get("sub");
        String subject = sub instanceof String s ? s : sub == null ? "undefined" : String.valueOf(sub);
        if (!subject.matches("^\\d+$")) {
            return Res.error(401, "Invalid or expired token");
        }
        long id;
        try {
            id = Long.parseLong(subject);
        } catch (NumberFormatException e) {
            throw new ApiError(400, "Invalid value");
        }
        Map<String, Object> user = db.query("SELECT id,name,email,username,role,is_active FROM users WHERE id=$1", id).first();
        if (user == null) {
            return Res.error(401, "Account not found");
        }
        if (!Boolean.TRUE.equals(user.get("is_active"))) {
            return Res.error(401, "This account has been disabled.");
        }
        req.user(user, Long.parseLong(String.valueOf(user.get("id"))));
        return null;
    }

    public static Router.Step allow(String... roles) {
        return req -> is(req, roles) ? null : Res.error(403, "You do not have permission to perform this action.");
    }

    public static Router.Step allow(List<String> roles) {
        return allow(roles.toArray(new String[0]));
    }
}
