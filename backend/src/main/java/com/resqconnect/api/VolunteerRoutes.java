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

public final class VolunteerRoutes {
    static final List<String> VERIFICATION = List.of("Not Required", "Pending Verification", "Active - Verified", "Rejected");
    static final List<String> CATEGORIES = List.of("General", "Trained");
    static final List<String> AVAILABILITY = List.of("Available", "Unavailable");
    private static final String REVIEW_REASON = "(SELECT h.reason FROM verification_history h WHERE h.volunteer_id=v.id "
            + "ORDER BY h.created_at DESC,h.id DESC LIMIT 1) AS last_review_reason";

    private final Db db;
    private final Security security;

    public VolunteerRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router) {
        router.get("/api/volunteers", security.auth, this::list);
        router.post("/api/volunteers", security.auth, Security.allow(Security.USER), this::apply);
        router.patch("/api/volunteers/me", security.auth, Security.allow(Security.USER), this::updateMine);
        router.patch("/api/volunteers/:id/verify", security.auth, Security.allow(Security.STAFF), this::verify);
        router.get("/api/verification-history", security.auth, Security.allow(Security.STAFF), this::history);
    }

    private Res list(Req req) {
        Validator v = Validator.of(req.query());
        Lists.ListQuery q = Lists.listParams(v);
        String category = v.optionalChoice("category", CATEGORIES);
        String availability = v.optionalChoice("availability", AVAILABILITY);
        String verification = v.optionalChoice("verification", VERIFICATION);
        String eligible = v.optionalChoice("eligible", List.of("true"));
        v.done();
        Lists.Params params = new Lists.Params();
        List<String> where = new ArrayList<>();
        if (!Security.is(req, Security.COORDINATOR, Security.VERIFIER)) {
            where.add("v.user_id=" + params.add(req.userId()));
        }
        if (category != null) {
            where.add("v.category=" + params.add(category));
        }
        if (availability != null) {
            where.add("v.availability=" + params.add(availability));
        }
        if (verification != null) {
            where.add("v.verification=" + params.add(verification));
        }
        if (eligible != null) {
            where.add("v.availability='Available' AND (v.category='General' OR v.verification='Active - Verified')");
        }
        if (!q.search().isEmpty()) {
            String p = params.add(Lists.likePattern(q.search()));
            List<String> parts = new ArrayList<>(List.of(
                    "u.name ILIKE " + p + " ESCAPE '\\'",
                    "v.location ILIKE " + p + " ESCAPE '\\'",
                    "v.skills ILIKE " + p + " ESCAPE '\\'"));
            Long number = Lists.codeNumber(q.search(), "rc-?[tg]");
            if (number != null) {
                parts.add("v.id=" + params.add(number));
            }
            where.add("(" + String.join(" OR ", parts) + ")");
        }
        return Lists.sendList(db, q, "SELECT v.*,u.name,u.email," + REVIEW_REASON, "FROM volunteers v JOIN users u ON u.id=v.user_id",
                where, params, "v.created_at DESC,v.id DESC");
    }

    private Res apply(Req req) {
        Validator v = Validator.of(req.json());
        String category = v.choice("category", CATEGORIES);
        String location = v.text("location", 255);
        String skills = v.text("skills", 1000);
        String phone = v.phone("phone", false);
        String training = v.optionalText("training", 1000);
        String certificate = v.optionalText("certificate", 1000);
        String availability = v.choice("availability", AVAILABILITY, "Available");
        if (!v.aborted() && "Trained".equals(category)) {
            if (training == null || training.isEmpty()) {
                v.issue("training", "Training details are required for trained volunteers");
            }
            if (certificate == null || certificate.isEmpty()) {
                v.issue("certificate", "Certificate reference is required for trained volunteers");
            }
        }
        v.done();
        String status = "Trained".equals(category) ? "Pending Verification" : "Not Required";
        Map<String, Object> volunteer = db.transaction(tx -> {
            Map<String, Object> row = tx.query("INSERT INTO volunteers(user_id,category,location,skills,phone,training,certificate,availability,verification) "
                            + "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) "
                            + "ON CONFLICT(user_id) DO UPDATE SET category=EXCLUDED.category,location=EXCLUDED.location,skills=EXCLUDED.skills,"
                            + "phone=EXCLUDED.phone,training=EXCLUDED.training,certificate=EXCLUDED.certificate,availability=EXCLUDED.availability,"
                            + "verification=EXCLUDED.verification WHERE volunteers.verification='Rejected' RETURNING *",
                    req.userId(), category, location, skills, phone, training, certificate, availability, status).first();
            if (row == null) {
                throw new ApiError(409, "Volunteer profile already exists");
            }
            if ("Trained".equals(row.get("category"))) {
                Notifications.notifyRoles(tx, List.of(Security.COORDINATOR, Security.VERIFIER), new Notifications.Message(
                        "volunteer_application", "New trained volunteer application",
                        req.userName() + " applied as a trained volunteer in " + row.get("location") + ".",
                        "/admin/verification?highlight=" + row.get("id")), null);
            }
            return row;
        });
        return Res.json(201, volunteer);
    }

    private Res updateMine(Req req) {
        Validator v = Validator.of(req.json());
        String availability = v.optionalChoice("availability", AVAILABILITY);
        String location = v.optionalText("location", 1, 255);
        String skills = v.optionalText("skills", 1, 1000);
        String phone = v.phone("phone", true);
        v.done();
        Map<String, Object> row = db.query("UPDATE volunteers SET availability=COALESCE($1,availability),location=COALESCE($2,location),"
                        + "skills=COALESCE($3,skills),phone=COALESCE($4,phone) WHERE user_id=$5 RETURNING *",
                availability, location, skills, phone, req.userId()).first();
        if (row == null) {
            return Res.error(404, "Volunteer profile not found");
        }
        return Res.json(200, row);
    }

    private Res verify(Req req) {
        Validator v = Validator.of(req.json());
        String decision = v.choice("decision", List.of("Approved", "Rejected"));
        String reason = v.optionalText("reason", 2000);
        v.done();
        if ("Rejected".equals(decision) && reason.isEmpty()) {
            return Res.error(400, "Please enter a reason for rejection.");
        }
        long volunteerId = Validator.parseId(req.params().get("id"));
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> updated = tx.query("UPDATE volunteers SET verification=$1 WHERE id=$2 AND category=$3 AND verification=$4 RETURNING *",
                    "Approved".equals(decision) ? "Active - Verified" : "Rejected", volunteerId, "Trained", "Pending Verification").first();
            if (updated == null) {
                throw new ApiError(404, "Pending application not found");
            }
            tx.query("INSERT INTO verification_history(volunteer_id,reviewer_id,decision,reason) VALUES($1,$2,$3,$4)",
                    Long.parseLong(String.valueOf(updated.get("id"))), req.userId(), decision, reason.isEmpty() ? "Approved" : reason);
            Notifications.Message message = "Approved".equals(decision)
                    ? new Notifications.Message("verification_approved", "Volunteer application approved",
                    "Your trained volunteer application was approved. You can now receive trained-responder assignments.", "/dashboard/volunteer")
                    : new Notifications.Message("verification_rejected", "Volunteer application not approved", "Reason: " + reason, "/dashboard/volunteer");
            Notifications.notifyUsers(tx, List.of(updated.get("user_id")), message);
            return updated;
        });
        return Res.json(200, row);
    }

    private Res history(Req req) {
        Validator v = Validator.of(req.query());
        Lists.ListQuery q = Lists.listParams(v);
        v.done();
        return Lists.sendList(db, q, "SELECT h.*,r.name AS reviewer,vu.name AS volunteer_name,v.category AS volunteer_category",
                "FROM verification_history h LEFT JOIN users r ON r.id=h.reviewer_id LEFT JOIN volunteers v ON v.id=h.volunteer_id "
                        + "LEFT JOIN users vu ON vu.id=v.user_id",
                List.of(), new Lists.Params(), "h.created_at DESC,h.id DESC");
    }
}
