package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.domain.Lists;
import com.resqconnect.domain.Notifications;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.ApiError;
import com.resqconnect.util.Validator;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class TicketRoutes {
    static final List<String> STATUS = List.of("Open", "In Progress", "Resolved", "Closed");
    static final List<String> CATEGORIES = List.of("Account", "Emergency Report", "Volunteer", "Technical Issue", "Other");

    private final Db db;
    private final Security security;

    public TicketRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router) {
        router.get("/api/tickets", security.auth, Security.allow(Security.COORDINATOR, Security.USER), this::list);
        router.post("/api/tickets", security.auth, Security.allow(Security.USER), this::create);
        router.patch("/api/tickets/:id", security.auth, Security.allow(Security.COORDINATOR), this::update);
    }

    private Res list(Req req) {
        Validator v = Validator.of(req.query());
        Lists.ListQuery q = Lists.listParams(v);
        String status = v.optionalChoice("status", STATUS);
        String category = v.optionalChoice("category", CATEGORIES);
        v.done();
        Lists.Params params = new Lists.Params();
        List<String> where = new ArrayList<>();
        boolean coordinator = Security.is(req, Security.COORDINATOR);
        if (!coordinator) {
            where.add("t.user_id=" + params.add(req.userId()));
        }
        if (status != null) {
            where.add("t.status=" + params.add(status));
        }
        if (category != null) {
            where.add("t.category=" + params.add(category));
        }
        if (!q.search().isEmpty()) {
            String p = params.add(Lists.likePattern(q.search()));
            List<String> parts = new ArrayList<>(List.of(
                    "t.subject ILIKE " + p + " ESCAPE '\\'",
                    "t.message ILIKE " + p + " ESCAPE '\\'"));
            if (coordinator) {
                parts.add("u.name ILIKE " + p + " ESCAPE '\\'");
                parts.add("u.email ILIKE " + p + " ESCAPE '\\'");
            }
            Long number = Lists.codeNumber(q.search(), "#?");
            if (number != null) {
                parts.add("t.id=" + params.add(number));
            }
            where.add("(" + String.join(" OR ", parts) + ")");
        }
        return Lists.sendList(db, q, coordinator ? "SELECT t.*,u.name,u.email" : "SELECT t.*",
                "FROM tickets t JOIN users u ON u.id=t.user_id", where, params, "t.created_at DESC,t.id DESC");
    }

    private Res create(Req req) {
        Validator v = Validator.of(req.json());
        String subject = v.text("subject", 180);
        String category = v.oneOf("category", CATEGORIES, "Choose a valid category: " + String.join(", ", CATEGORIES) + ".");
        String message = v.text("message", 5000);
        v.done();
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> ticket = tx.query("INSERT INTO tickets(user_id,subject,category,message) VALUES($1,$2,$3,$4) RETURNING *",
                    req.userId(), subject, category, message).first();
            Notifications.notifyRoles(tx, List.of(Security.COORDINATOR), new Notifications.Message(
                    "ticket_created", "New support ticket",
                    "Ticket #" + ticket.get("id") + " · " + ticket.get("category") + ": " + ticket.get("subject") + " (from " + req.userName() + ")",
                    "/admin/tickets?highlight=" + ticket.get("id")), null);
            return ticket;
        });
        return Res.json(201, row);
    }

    private Res update(Req req) {
        Validator v = Validator.of(req.json());
        String status = v.optionalChoice("status", STATUS);
        String reply = v.optionalTrimmed("admin_reply", 5000);
        if (!v.aborted() && status == null && reply == null) {
            v.issue("", "Provide a status or a reply");
        }
        v.done();
        long ticketId = Validator.parseId(req.params().get("id"));
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> before = tx.query("SELECT status,admin_reply FROM tickets WHERE id=$1 FOR UPDATE", ticketId).first();
            if (before == null) {
                throw new ApiError(404, "Ticket not found");
            }
            Map<String, Object> updated = tx.query("UPDATE tickets SET status=COALESCE($1,status),admin_reply=COALESCE($2,admin_reply),updated_at=NOW() "
                    + "WHERE id=$3 RETURNING *", status, reply, ticketId).first();
            boolean replied = !Objects.equals(updated.get("admin_reply"), before.get("admin_reply")) && !"".equals(updated.get("admin_reply"));
            boolean statusChanged = !Objects.equals(updated.get("status"), before.get("status"));
            if (replied || statusChanged) {
                List<String> parts = new ArrayList<>();
                if (replied) {
                    parts.add("An administrator replied");
                }
                if (statusChanged) {
                    parts.add("Status changed to " + updated.get("status"));
                }
                Notifications.notifyUsers(tx, List.of(updated.get("user_id")), new Notifications.Message(
                        "ticket_updated", "Support ticket #" + updated.get("id") + " updated",
                        String.join(" · ", parts) + " — " + updated.get("subject"),
                        "/dashboard/tickets?highlight=" + updated.get("id")));
            }
            return updated;
        });
        return Res.json(200, row);
    }
}
