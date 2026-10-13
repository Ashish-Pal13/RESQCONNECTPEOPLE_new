package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.domain.AssignmentPolicy;
import com.resqconnect.domain.Lists;
import com.resqconnect.domain.Notifications;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.ApiError;
import com.resqconnect.util.Validator;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class IncidentRoutes {
    static final List<String> URGENCY = List.of("Low", "Medium", "High", "Critical");

    private final Db db;
    private final Security security;

    public IncidentRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router) {
        router.get("/api/incidents", security.auth, Security.allow(Security.COORDINATOR, Security.USER), this::list);
        router.post("/api/incidents", security.auth, Security.allow(Security.COORDINATOR, Security.USER), this::create);
        router.patch("/api/incidents/:id", security.auth, Security.allow(Security.COORDINATOR), this::update);
    }

    private Res list(Req req) {
        Validator v = Validator.of(req.query());
        Lists.ListQuery q = Lists.listParams(v);
        List<String> statuses = new ArrayList<>(AdminRoutes.INCIDENT_STATUS);
        statuses.add("open");
        String status = v.optionalChoice("status", statuses);
        String urgency = v.optionalChoice("urgency", URGENCY);
        v.done();
        Lists.Params params = new Lists.Params();
        List<String> where = new ArrayList<>();
        if (!Security.is(req, Security.COORDINATOR)) {
            where.add("i.user_id=" + params.add(req.userId()));
        }
        if ("open".equals(status)) {
            where.add("i.status<>'Resolved'");
        } else if (status != null) {
            where.add("i.status=" + params.add(status));
        }
        if (urgency != null) {
            where.add("i.urgency=" + params.add(urgency));
        }
        if (!q.search().isEmpty()) {
            String p = params.add(Lists.likePattern(q.search()));
            List<String> parts = new ArrayList<>(List.of(
                    "i.type ILIKE " + p + " ESCAPE '\\'",
                    "i.location ILIKE " + p + " ESCAPE '\\'",
                    "i.description ILIKE " + p + " ESCAPE '\\'"));
            Long number = Lists.codeNumber(q.search(), "inc");
            if (number != null) {
                parts.add("i.id=" + params.add(number));
            }
            where.add("(" + String.join(" OR ", parts) + ")");
        }
        return Lists.sendList(db, q, "SELECT i.*,u.name AS reporter", "FROM incidents i LEFT JOIN users u ON u.id=i.user_id",
                where, params, "i.created_at DESC,i.id DESC");
    }

    private Res create(Req req) {
        Validator v = Validator.of(req.json());
        String type = v.text("type", 80);
        String location = v.text("location", 255);
        String urgency = v.choice("urgency", URGENCY);
        String description = v.text("description", 5000);
        v.done();
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> incident = tx.query(
                    "INSERT INTO incidents(user_id,type,location,urgency,description) VALUES($1,$2,$3,$4,$5) RETURNING *",
                    req.userId(), type, location, urgency, description).first();
            Notifications.notifyRoles(tx, List.of(Security.COORDINATOR), new Notifications.Message(
                    "incident_created",
                    "New " + ((String) incident.get("urgency")).toLowerCase(Locale.ROOT) + " emergency report",
                    "INC-" + incident.get("id") + " · " + incident.get("type") + " at " + incident.get("location")
                            + ", reported by " + req.userName(),
                    "/admin/incidents?highlight=" + incident.get("id")), req.userId());
            return incident;
        });
        return Res.json(201, row);
    }

    private Res update(Req req) {
        Validator v = Validator.of(req.json());
        String status = v.choice("status", AdminRoutes.INCIDENT_STATUS);
        v.done();
        long incidentId = Validator.parseId(req.params().get("id"));
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> before = tx.query("SELECT status,user_id FROM incidents WHERE id=$1 FOR UPDATE", incidentId).first();
            if (before == null) {
                throw new ApiError(404, "Report not found");
            }
            Map<String, Object> updated = tx.query("UPDATE incidents SET status=$1 WHERE id=$2 RETURNING *", status, incidentId).first();
            List<Map<String, Object>> cancelled = new ArrayList<>();
            if ("Resolved".equals(status) && !"Resolved".equals(before.get("status"))) {
                cancelled = tx.query("UPDATE assignments a SET status='Cancelled',status_reason=$2,updated_at=NOW() "
                                + "FROM volunteers v WHERE v.id=a.volunteer_id AND a.incident_id=$1 AND a.status=ANY($3::text[]) "
                                + "RETURNING a.id,a.task,v.user_id",
                        incidentId, "Incident INC-" + incidentId + " was resolved", AssignmentPolicy.OPEN_STATUSES).rows();
                Map<String, List<Map<String, Object>>> byVolunteer = new LinkedHashMap<>();
                for (Map<String, Object> a : cancelled) {
                    byVolunteer.computeIfAbsent(String.valueOf(a.get("user_id")), key -> new ArrayList<>()).add(a);
                }
                for (Map.Entry<String, List<Map<String, Object>>> entry : byVolunteer.entrySet()) {
                    List<Map<String, Object>> list = entry.getValue();
                    List<String> labels = new ArrayList<>();
                    for (Map<String, Object> a : list) {
                        labels.add("ASN-" + a.get("id") + " (" + a.get("task") + ")");
                    }
                    boolean many = list.size() > 1;
                    Notifications.notifyUsers(tx, List.of(entry.getKey()), new Notifications.Message(
                            "assignment_cancelled",
                            many ? "Assignments cancelled" : "Assignment cancelled",
                            String.join(", ", labels) + " " + (many ? "were" : "was") + " cancelled because INC-" + incidentId
                                    + " · " + updated.get("type") + " at " + updated.get("location")
                                    + " has been resolved. No further action is needed.",
                            "/dashboard/assignments?highlight=" + list.get(0).get("id")));
                }
            }
            Object reporter = before.get("user_id");
            if (!status.equals(before.get("status")) && reporter != null && !String.valueOf(reporter).equals(String.valueOf(req.userId()))) {
                Notifications.notifyUsers(tx, List.of(reporter), new Notifications.Message(
                        "incident_status",
                        "Emergency report status updated",
                        "INC-" + updated.get("id") + " · " + updated.get("type") + " at " + updated.get("location")
                                + " is now " + updated.get("status") + ".",
                        "/dashboard/incidents?highlight=" + updated.get("id")));
            }
            Map<String, Object> result = new LinkedHashMap<>(updated);
            result.put("cancelled_assignments", cancelled.size());
            return result;
        });
        return Res.json(200, row);
    }
}
