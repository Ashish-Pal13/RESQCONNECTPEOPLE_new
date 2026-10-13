package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.domain.Lists;
import com.resqconnect.domain.Notifications;
import com.resqconnect.domain.Phone;
import com.resqconnect.http.RateLimiter;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.Validator;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ContactRoutes {
    private final Db db;
    private final Security security;

    public ContactRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router, RateLimiter contactLimiter) {
        router.post("/api/contact", contactLimiter, this::create);
        router.get("/api/contact", security.auth, Security.allow(Security.COORDINATOR), this::list);
    }

    private Res list(Req req) {
        Validator v = Validator.of(req.query());
        Lists.ListQuery q = Lists.listParams(v);
        v.done();
        Lists.Params params = new Lists.Params();
        List<String> where = new ArrayList<>();
        if (!q.search().isEmpty()) {
            String p = params.add(Lists.likePattern(q.search()));
            List<String> parts = new ArrayList<>(List.of(
                    "c.name ILIKE " + p + " ESCAPE '\\'",
                    "c.email ILIKE " + p + " ESCAPE '\\'",
                    "c.subject ILIKE " + p + " ESCAPE '\\'",
                    "c.message ILIKE " + p + " ESCAPE '\\'",
                    "c.phone ILIKE " + p + " ESCAPE '\\'"));
            Long number = Lists.codeNumber(q.search(), "#?");
            if (number != null) {
                parts.add("c.id=" + params.add(number));
            }
            where.add("(" + String.join(" OR ", parts) + ")");
        }
        return Lists.sendList(db, q, "SELECT c.*", "FROM contact_messages c", where, params, "c.created_at DESC,c.id DESC");
    }

    private Res create(Req req) {
        Validator v = Validator.of(req.json());
        String name = v.text("name", 120);
        String email = v.email("email");
        String subject = v.text("subject", 180);
        String message = v.text("message", 5000);
        String phoneCountry = v.optionalTrimmed("phone_country", 5);
        String phone = v.optionalTrimmed("phone", 32);
        v.done();
        String storedPhone = null;
        String storedCountry = null;
        if (phone != null && !phone.isEmpty()) {
            Phone.Result result = Phone.validate(phoneCountry == null || phoneCountry.isEmpty() ? Phone.DEFAULT_COUNTRY : phoneCountry, phone);
            if (result.error() != null) {
                v.issue("phone", result.error());
                v.done();
            }
            storedPhone = result.e164();
            storedCountry = result.country();
        }
        String finalPhone = storedPhone;
        String finalCountry = storedCountry;
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> m = tx.query(
                    "INSERT INTO contact_messages(name,email,subject,message,phone,phone_country) VALUES($1,$2,$3,$4,$5,$6) "
                            + "RETURNING id,name,email,subject,message,phone,phone_country,created_at",
                    name, email, subject, message, finalPhone, finalCountry).first();
            String phoneText = m.get("phone") != null
                    ? " (" + Phone.format((String) m.get("phone"), (String) m.get("phone_country")) + ")" : "";
            Notifications.notifyRoles(tx, List.of(Security.COORDINATOR), new Notifications.Message(
                    "contact_message", "New contact message", m.get("name") + phoneText + ": " + m.get("subject"),
                    "/admin/messages?highlight=" + m.get("id")), null);
            return m;
        });
        return Res.json(201, row);
    }
}
