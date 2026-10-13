package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.Json;
import com.resqconnect.util.Validator;

import java.util.List;
import java.util.Map;

public final class NotificationRoutes {
    private static final String COLUMNS = "id,type,title,message,link,is_read,read_at,created_at";

    private final Db db;
    private final Security security;

    public NotificationRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router) {
        router.get("/api/notifications", security.auth, this::list);
        router.get("/api/notifications/unread-count", security.auth, req -> Res.json(200, Json.obj("unread_count", unreadCount(req.userId()))));
        router.patch("/api/notifications/read-all", security.auth, this::readAll);
        router.patch("/api/notifications/:id/read", security.auth, this::readOne);
    }

    private long unreadCount(Long userId) {
        Object count = db.query("SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id=$1 AND NOT is_read", userId).first().get("count");
        return ((Number) count).longValue();
    }

    private Res list(Req req) {
        Validator v = Validator.of(req.query());
        Long limit = v.integer("limit", Validator.IntRule.integer().min(1).max(50).defaultValue(20L));
        v.done();
        List<Map<String, Object>> rows = db.query("SELECT " + COLUMNS + " FROM notifications WHERE recipient_id=$1 "
                + "ORDER BY created_at DESC,id DESC LIMIT $2", req.userId(), limit).rows();
        return Res.json(200, Json.obj("data", rows, "unread_count", unreadCount(req.userId())));
    }

    private Res readAll(Req req) {
        int updated = db.query("UPDATE notifications SET is_read=TRUE,read_at=NOW() WHERE recipient_id=$1 AND NOT is_read", req.userId()).rowCount();
        return Res.json(200, Json.obj("updated", updated, "unread_count", 0));
    }

    private Res readOne(Req req) {
        long id = Validator.parseId(req.params().get("id"));
        Map<String, Object> row = db.query("UPDATE notifications SET is_read=TRUE,read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND recipient_id=$2 "
                + "RETURNING " + COLUMNS, id, req.userId()).first();
        if (row == null) {
            return Res.error(404, "Notification not found");
        }
        return Res.json(200, Json.obj("data", row, "unread_count", unreadCount(req.userId())));
    }
}
