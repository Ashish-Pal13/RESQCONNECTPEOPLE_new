package com.resqconnect.domain;

import com.resqconnect.db.Db;
import com.resqconnect.util.Js;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class Notifications {
    public record Message(String type, String title, String message, String link) {
    }

    private Notifications() {
    }

    static String clip(String value, int max) {
        String text = Js.trim(Js.collapseWhitespace(value == null ? "" : value));
        return text.length() > max ? text.substring(0, max - 1) + "…" : text;
    }

    public static int notifyUsers(Db db, List<?> userIds, Message payload) {
        Set<Long> ids = new LinkedHashSet<>();
        for (Object id : userIds) {
            Long value = toId(id);
            if (value != null) {
                ids.add(value);
            }
        }
        if (ids.isEmpty()) {
            return 0;
        }
        return db.query("INSERT INTO notifications(recipient_id,type,title,message,link) "
                        + "SELECT u.id,$2,$3,$4,$5 FROM users u WHERE u.id=ANY($1::bigint[]) AND u.is_active",
                new ArrayList<>(ids), payload.type(), clip(payload.title(), 160), clip(payload.message(), 500),
                payload.link() == null ? "" : payload.link()).rowCount();
    }

    public static int notifyRoles(Db db, List<String> roles, Message payload, Long excludeUserId) {
        List<Map<String, Object>> rows = db.query(
                "SELECT id FROM users WHERE role=ANY($1::text[]) AND is_active AND ($2::bigint IS NULL OR id<>$2)",
                roles, excludeUserId).rows();
        List<Object> ids = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            ids.add(row.get("id"));
        }
        return notifyUsers(db, ids, payload);
    }

    public static Long toId(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Long l) {
            return l == 0 ? null : l;
        }
        if (value instanceof Number n) {
            long l = n.longValue();
            return l == 0 ? null : l;
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return null;
        }
        try {
            long l = Long.parseLong(text);
            return l == 0 ? null : l;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
