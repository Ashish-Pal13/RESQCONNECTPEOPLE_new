package com.resqconnect.tools;

import com.resqconnect.api.Passwords;
import com.resqconnect.db.Connector;
import com.resqconnect.db.DatabaseUrl;
import com.resqconnect.db.DbException;
import com.resqconnect.util.Env;

import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class Seed {
    private record Account(String role, String name, String prefix, String username, String password, String email) {
    }

    private Seed() {
    }

    private static Account account(Env env, String role, String name, String prefix) {
        String username = env.get(prefix + "_USERNAME", "").trim().toLowerCase(Locale.ROOT);
        String password = env.get(prefix + "_PASSWORD", "");
        String email = env.get(prefix + "_EMAIL", username + "@resqconnect.local").trim().toLowerCase(Locale.ROOT);
        return new Account(role, name, prefix, username, password, email);
    }

    private static String passwordProblem(Account a) {
        if (a.password().length() < 12) {
            return a.prefix() + "_PASSWORD must be at least 12 characters";
        }
        if (a.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            return a.prefix() + "_PASSWORD must be at most 72 bytes";
        }
        return null;
    }

    public static int run(Env env, Connector connector, Passwords passwords, boolean resetPasswords, PrintStream out, PrintStream err) {
        List<Account> accounts = List.of(
                account(env, "coordinator", "Emergency Coordinator", "COORDINATOR"),
                account(env, "verifier", "Volunteer Verification Admin", "VERIFIER"));
        List<String> problems = new ArrayList<>();
        String databaseUrl = env.get("DATABASE_URL", "");
        if (databaseUrl.isEmpty()) {
            problems.add("DATABASE_URL is required");
        }
        for (Account a : accounts) {
            if (!a.username().matches("^[a-z0-9._-]{3,60}$")) {
                problems.add(a.prefix() + "_USERNAME must be 3-60 characters (letters, digits, . _ -)");
            }
            if (!a.email().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                problems.add(a.prefix() + "_EMAIL must be a valid email address");
            }
        }
        if (!accounts.get(0).username().isEmpty() && accounts.get(0).username().equals(accounts.get(1).username())) {
            problems.add("COORDINATOR_USERNAME and VERIFIER_USERNAME must be different");
        }
        if (!problems.isEmpty()) {
            err.println("Fix your backend/.env:\n- " + String.join("\n- ", problems));
            return 1;
        }
        int exitCode = 0;
        Connector.Session session;
        try {
            session = connector.open(DatabaseUrl.parse(databaseUrl));
        } catch (DbException e) {
            err.println("Cannot connect to PostgreSQL: " + e.describe());
            return 1;
        } catch (IllegalArgumentException e) {
            err.println(e.getMessage());
            return 1;
        }
        try (session) {
            for (Account a : accounts) {
                Map<String, Object> existing = session.query("SELECT id,role FROM users WHERE username=$1", a.username()).first();
                if (existing != null) {
                    if (!a.role().equals(existing.get("role"))) {
                        err.println("Skipped " + a.username() + ": an account with this username already exists with the role \"" + existing.get("role") + "\". It was not changed.");
                        continue;
                    }
                    if (!resetPasswords) {
                        out.println(a.name() + " account already exists (username: " + a.username() + "). Password unchanged.");
                        continue;
                    }
                    String problem = passwordProblem(a);
                    if (problem != null) {
                        err.println("Cannot reset " + a.username() + ": " + problem);
                        exitCode = 1;
                        continue;
                    }
                    session.query("UPDATE users SET password_hash=$1 WHERE id=$2", passwords.hash(a.password()),
                            Long.parseLong(String.valueOf(existing.get("id"))));
                    out.println(a.name() + " password reset (username: " + a.username() + ").");
                    continue;
                }
                String problem = passwordProblem(a);
                if (problem != null) {
                    err.println("Cannot create " + a.username() + ": " + problem);
                    exitCode = 1;
                    continue;
                }
                String hash = passwords.hash(a.password());
                try {
                    int created = session.query("INSERT INTO users(name,email,username,password_hash,role,is_active) VALUES($1,$2,$3,$4,$5,TRUE) "
                            + "ON CONFLICT(username) DO NOTHING RETURNING id", a.name(), a.email(), a.username(), hash, a.role()).rowCount();
                    out.println(created > 0
                            ? a.name() + " account created (username: " + a.username() + ")."
                            : a.name() + " account already exists (username: " + a.username() + "). Password unchanged.");
                } catch (DbException e) {
                    if ("23505".equals(e.sqlState())) {
                        err.println("Cannot create " + a.username() + ": the email " + a.email() + " is already used by another account. Set "
                                + a.prefix() + "_EMAIL to an unused address.");
                        exitCode = 1;
                        continue;
                    }
                    throw e;
                }
            }
        } catch (DbException e) {
            String state = e.sqlState() == null ? "" : e.sqlState();
            if (e.connectionProblem()) {
                err.println("Cannot connect to PostgreSQL: " + e.describe());
            } else if (state.equals("42703") || state.equals("42P01")) {
                err.println("The database schema is out of date. Run \"gradlew migrate\" first.");
            } else {
                err.println(e.getMessage());
            }
            exitCode = 1;
        }
        return exitCode;
    }
}
