package com.resqconnect.config;

import com.resqconnect.db.Db;
import com.resqconnect.db.DbException;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;

public final class StartupLogger implements ApplicationListener<WebServerInitializedEvent> {
    private final Db db;

    public StartupLogger(Db db) {
        this.db = db;
    }

    @Override
    public void onApplicationEvent(WebServerInitializedEvent event) {
        System.out.println("RESQCONNECT API listening on " + event.getWebServer().getPort());
        Thread check = new Thread(() -> {
            try {
                db.query("SELECT 1");
                System.out.println("PostgreSQL connection OK");
            } catch (DbException e) {
                System.err.println("PostgreSQL is not reachable yet: " + e.describe());
            } catch (RuntimeException e) {
                System.err.println("PostgreSQL is not reachable yet: " + e.getMessage());
            }
        }, "db-startup-check");
        check.setDaemon(true);
        check.start();
    }
}
