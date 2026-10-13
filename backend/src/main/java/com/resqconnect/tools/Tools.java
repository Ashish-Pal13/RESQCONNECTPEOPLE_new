package com.resqconnect.tools;

import com.resqconnect.config.BcryptPasswords;
import com.resqconnect.db.Connector;
import com.resqconnect.util.Env;

import java.util.Arrays;
import java.util.List;

public final class Tools {
    private Tools() {
    }

    public static void main(String[] args) {
        Env env = Env.load();
        List<String> options = Arrays.asList(args);
        String command = args.length > 0 ? args[0] : "";
        int code = switch (command) {
            case "migrate" -> Migrate.run(env, Connector.jdbc(), options.contains("--status"), System.out, System.err);
            case "seed" -> Seed.run(env, Connector.jdbc(), new BcryptPasswords(), options.contains("--reset-passwords"), System.out, System.err);
            case "db-create" -> CreateDatabase.run(env, Connector.jdbc(), System.out, System.err);
            default -> {
                System.err.println("Usage: migrate [--status] | seed [--reset-passwords] | db-create");
                yield 1;
            }
        };
        System.exit(code);
    }
}
