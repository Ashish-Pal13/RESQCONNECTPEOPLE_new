package com.resqconnect.tools;

import com.resqconnect.db.Connector;
import com.resqconnect.db.DatabaseUrl;
import com.resqconnect.db.DbException;
import com.resqconnect.util.Env;

import java.io.IOException;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

public final class Migrate {
    private static final long MIGRATION_LOCK_KEY = 727274190L;
    private static final Pattern FILE = Pattern.compile("^(\\d+)_.+\\.sql$");

    private Migrate() {
    }

    private record Pending(String file, String sql, String checksum) {
    }

    static Path migrationsDir(Env env) {
        String configured = env.get("MIGRATIONS_DIR");
        if (configured != null && !configured.isBlank()) {
            return Path.of(configured).toAbsolutePath();
        }
        Path local = Path.of("sql", "migrations");
        if (Files.isDirectory(local)) {
            return local.toAbsolutePath();
        }
        return Path.of("backend", "sql", "migrations").toAbsolutePath();
    }

    static long version(String file) {
        Matcher matcher = FILE.matcher(file);
        matcher.matches();
        return Long.parseLong(matcher.group(1));
    }

    static String checksum(String sql) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(sql.replace("\r\n", "\n").getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public static int run(Env env, Connector connector, boolean statusOnly, PrintStream out, PrintStream err) {
        String databaseUrl = env.get("DATABASE_URL", "");
        if (databaseUrl.isEmpty()) {
            err.println("Set DATABASE_URL in backend/.env before running migrations.");
            return 1;
        }
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
        boolean locked = false;
        int exitCode = 0;
        try {
            Path dir = migrationsDir(env);
            List<String> files = new ArrayList<>();
            try (Stream<Path> listing = Files.list(dir)) {
                listing.map(path -> path.getFileName().toString()).filter(name -> FILE.matcher(name).matches()).forEach(files::add);
            }
            files.sort(Comparator.comparingLong(Migrate::version).thenComparing(Comparator.naturalOrder()));
            Set<Long> versions = new HashSet<>();
            for (String file : files) {
                if (!versions.add(version(file))) {
                    throw new IllegalStateException("Two migration files share the same version number. Rename one so every number is unique.");
                }
            }
            session.query("SELECT pg_advisory_lock($1)", MIGRATION_LOCK_KEY);
            locked = true;
            session.query("CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(200) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
            session.query("ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum VARCHAR(64)");
            Map<String, String> applied = new HashMap<>();
            Set<String> appliedNames = new HashSet<>();
            for (Map<String, Object> row : session.query("SELECT name,checksum FROM schema_migrations").rows()) {
                appliedNames.add((String) row.get("name"));
                applied.put((String) row.get("name"), (String) row.get("checksum"));
            }
            List<Pending> pending = new ArrayList<>();
            for (String file : files) {
                String sql = Files.readString(dir.resolve(file), StandardCharsets.UTF_8);
                String sum = checksum(sql);
                if (appliedNames.contains(file)) {
                    String stored = applied.get(file);
                    if (stored == null || stored.isEmpty()) {
                        session.query("UPDATE schema_migrations SET checksum=$2 WHERE name=$1", file, sum);
                    } else if (!stored.equals(sum)) {
                        err.println("Warning: " + file + " was changed after it was applied. It will not run again; create a new migration for further changes.");
                    }
                    if (statusOnly) {
                        out.println("applied   " + file);
                    }
                    continue;
                }
                pending.add(new Pending(file, sql, sum));
                if (statusOnly) {
                    out.println("pending   " + file);
                }
            }
            if (statusOnly) {
                out.println(pending.size() + " pending migration(s)");
            } else {
                for (Pending migration : pending) {
                    try {
                        session.transaction(tx -> {
                            tx.execute(migration.sql());
                            tx.query("INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)", migration.file(), migration.checksum());
                            return null;
                        });
                        out.println("Applied " + migration.file());
                    } catch (RuntimeException e) {
                        throw new IllegalStateException("Migration " + migration.file() + " failed and was rolled back: " + rootMessage(e));
                    }
                }
                out.println(pending.isEmpty() ? "Database is already up to date" : pending.size() + " migration(s) applied");
            }
        } catch (IOException e) {
            err.println("Cannot read the migrations folder: " + e.getMessage());
            exitCode = 1;
        } catch (RuntimeException e) {
            err.println(e instanceof DbException db ? db.describe() : rootMessage(e));
            exitCode = 1;
        } finally {
            if (locked) {
                try {
                    session.query("SELECT pg_advisory_unlock($1)", MIGRATION_LOCK_KEY);
                } catch (RuntimeException unlockError) {
                    err.println("Could not release the migration lock: " + unlockError.getMessage());
                }
            }
            session.close();
        }
        return exitCode;
    }

    static String rootMessage(Throwable e) {
        Throwable current = e;
        while (current.getCause() != null && current.getMessage() == null) {
            current = current.getCause();
        }
        return current.getMessage() == null ? current.toString() : current.getMessage();
    }
}
