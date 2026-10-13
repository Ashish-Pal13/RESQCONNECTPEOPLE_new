package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.http.RateLimiter;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.Json;
import com.resqconnect.util.Validator;

import java.util.Locale;
import java.util.Map;

public final class AuthRoutes {
    private final Db db;
    private final Security security;
    private final Passwords passwords;

    public AuthRoutes(Db db, Security security, Passwords passwords) {
        this.db = db;
        this.security = security;
        this.passwords = passwords;
    }

    public void register(Router router, RateLimiter authLimiter) {
        router.post("/api/auth/register", authLimiter, this::registerUser);
        router.post("/api/auth/login", authLimiter, this::login);
        router.post("/api/auth/admin-login", authLimiter, this::adminLogin);
        router.get("/api/auth/me", security.auth, req -> Res.json(200, Security.safeUser(req.user())));
    }

    private Map<String, Object> session(Map<String, Object> user) {
        return Json.obj("user", Security.safeUser(user), "token", security.tokenFor(user));
    }

    private Res registerUser(Req req) {
        Validator v = Validator.of(req.json());
        String name = v.text("name", 120);
        String email = v.email("email");
        String password = v.password("password");
        v.done();
        String hash = passwords.hash(password);
        Map<String, Object> row = db.query(
                "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id,name,email,username,role",
                name, email, hash, Security.USER).first();
        if (row == null) {
            return Res.error(409, "Email already registered");
        }
        return Res.json(201, session(row));
    }

    private Res login(Req req) {
        Validator v = Validator.of(req.json());
        String email = v.email("email");
        String password = v.plainString("password", 1, 128);
        v.done();
        Map<String, Object> user = db.query("SELECT * FROM users WHERE email=$1", email).first();
        if (user == null || !passwords.matches(password, (String) user.get("password_hash"))) {
            return Res.error(401, "Invalid email or password");
        }
        if (!Boolean.TRUE.equals(user.get("is_active"))) {
            return Res.error(403, "This account has been disabled. Please contact support.");
        }
        return Res.json(200, session(user));
    }

    private Res adminLogin(Req req) {
        Res invalid = Res.error(401, "Invalid username or password for the selected role.");
        Validator v = Validator.of(req.json());
        String role = v.choice("role", Security.STAFF);
        String username = v.text("username", 60);
        String password = v.plainString("password", 1, 128);
        if (v.hasIssues()) {
            return invalid;
        }
        Map<String, Object> user = db.query("SELECT * FROM users WHERE username=$1 AND role=$2",
                username.toLowerCase(Locale.ROOT), role).first();
        if (user == null || !Boolean.TRUE.equals(user.get("is_active")) || !passwords.matches(password, (String) user.get("password_hash"))) {
            return invalid;
        }
        return Res.json(200, session(user));
    }
}
