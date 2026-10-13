package com.resqconnect.tools;

import com.resqconnect.db.Connector;
import com.resqconnect.db.DatabaseUrl;
import com.resqconnect.db.DbException;
import com.resqconnect.util.Env;

import java.io.PrintStream;

public final class CreateDatabase {
    private CreateDatabase() {
    }

    public static int run(Env env, Connector connector, PrintStream out, PrintStream err) {
        String databaseUrl = env.get("DATABASE_URL", "");
        if (databaseUrl.isEmpty()) {
            err.println("Set DATABASE_URL in backend/.env first.");
            return 1;
        }
        DatabaseUrl target;
        try {
            target = DatabaseUrl.parse(databaseUrl);
        } catch (IllegalArgumentException e) {
            err.println(e.getMessage());
            return 1;
        }
        String name = target.database();
        if (!name.matches("^[A-Za-z_][A-Za-z0-9_]{0,62}$")) {
            err.println("The database name \"" + name + "\" in DATABASE_URL is not valid.");
            return 1;
        }
        DatabaseUrl admin = target.withDatabase(env.get("MAINTENANCE_DB", "postgres"));
        try (Connector.Session session = connector.open(admin)) {
            boolean exists = session.query("SELECT 1 FROM pg_database WHERE datname=$1", name).rowCount() > 0;
            if (exists) {
                out.println("Database \"" + name + "\" already exists.");
            } else {
                session.execute("CREATE DATABASE \"" + name + "\"");
                out.println("Database \"" + name + "\" created.");
            }
            return 0;
        } catch (DbException e) {
            err.println("42501".equals(e.sqlState())
                    ? "This PostgreSQL user is not allowed to create databases. Create it in pgAdmin instead."
                    : "Cannot connect to PostgreSQL: " + e.describe());
            return 1;
        }
    }
}
