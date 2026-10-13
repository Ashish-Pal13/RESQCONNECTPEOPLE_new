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

public final class AssignmentRoutes {
    private static final String SELECT = "SELECT a.*,u.name AS volunteer_name,v.category AS volunteer_category,"
            + "i.type AS incident_type,i.location AS incident_location,i.status AS incident_status";
    private static final String FROM = "FROM assignments a JOIN volunteers v ON v.id=a.volunteer_id JOIN users u ON u.id=v.user_id "
            + "JOIN incidents i ON i.id=a.incident_id";
    private static final Map<String, String> UPDATE_TITLES = Map.of(
            "Accepted", "Assignment accepted",
            "Declined", "Assignment declined",
            "In Progress", "Assignment in progress",
            "Completed", "Assignment completed");
    private static final Map<String, String> VERBS = Map.of(
            "Accepted", "accepted",
            "Declined", "declined",
            "In Progress", "started work on",
            "Completed", "completed");

    private final Db db;
    private final Security security;

    public AssignmentRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router) {
        router.get("/api/assignments", security.auth, Security.allow(Security.COORDINATOR, Security.USER), this::list);
        router.post("/api/assignments", security.auth, Security.allow(Security.COORDINATOR), this::create);
        router.patch("/api/assignments/:id", security.auth, Security.allow(Security.COORDINATOR, Security.USER), this::update);
    }

    private Res list(Req req) {
        Validator v = Validator.of(req.query());
        Lists.ListQuery q = Lists.listParams(v);
        List<String> statuses = new ArrayList<>(AssignmentPolicy.STATUSES);
        statuses.add("open");
        String status = v.optionalChoice("status", statuses);
        Long incidentId = v.integer("incident_id", Validator.id().optional());
        v.done();
        Lists.Params params = new Lists.Params();
        List<String> where = new ArrayList<>();
        if (!Security.is(req, Security.COORDINATOR)) {
            where.add("v.user_id=" + params.add(req.userId()));
        }
        if ("open".equals(status)) {
            where.add("a.status=ANY(" + params.add(AssignmentPolicy.OPEN_STATUSES) + "::text[])");
        } else if (status != null) {
            where.add("a.status=" + params.add(status));
        }
        if (incidentId != null && incidentId != 0) {
            where.add("a.incident_id=" + params.add(incidentId));
        }
        if (!q.search().isEmpty()) {
            String p = params.add(Lists.likePattern(q.search()));
            List<String> parts = new ArrayList<>(List.of(
                    "a.task ILIKE " + p + " ESCAPE '\\'",
                    "u.name ILIKE " + p + " ESCAPE '\\'",
                    "i.type ILIKE " + p + " ESCAPE '\\'",
                    "i.location ILIKE " + p + " ESCAPE '\\'"));
            Long number = Lists.codeNumber(q.search(), "asn");
            if (number != null) {
                parts.add("a.id=" + params.add(number));
            }
            where.add("(" + String.join(" OR ", parts) + ")");
        }
        return Lists.sendList(db, q, SELECT, FROM, where, params, "a.created_at DESC,a.id DESC");
    }

    private Res create(Req req) {
        Validator v = Validator.of(req.json());
        Long incidentId = v.integer("incident_id", Validator.id());
        Long volunteerId = v.integer("volunteer_id", Validator.id());
        String task = v.text("task", 120);
        String status = v.optionalPlainString("status");
        if (status != null && !status.equals("Notified")) {
            v.issue("status", "New assignments always start as Notified. The volunteer accepts and updates progress from their dashboard.");
        }
        String instructions = v.optionalText("instructions", 2000);
        v.done();
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> volunteer = tx.query("SELECT user_id,category,verification,availability FROM volunteers WHERE id=$1 FOR SHARE", volunteerId).first();
            Map<String, Object> incident = tx.query("SELECT status,type,location FROM incidents WHERE id=$1 FOR SHARE", incidentId).first();
            if (volunteer == null || incident == null) {
                throw new ApiError(400, "Please select a valid incident and volunteer.");
            }
            if ("Trained".equals(volunteer.get("category")) && !"Active - Verified".equals(volunteer.get("verification"))) {
                throw new ApiError(400, "This trained volunteer has not been verified.");
            }
            if (!"Available".equals(volunteer.get("availability"))) {
                throw new ApiError(400, "This volunteer is currently unavailable.");
            }
            if ("Resolved".equals(incident.get("status"))) {
                throw new ApiError(400, "This emergency report has already been resolved.");
            }
            int duplicates = tx.query("SELECT 1 FROM assignments WHERE incident_id=$1 AND volunteer_id=$2 AND duplicate_of IS NULL "
                    + "AND NOT (status=ANY($3::text[]))", incidentId, volunteerId, AssignmentPolicy.INACTIVE_STATUSES).rowCount();
            if (duplicates > 0) {
                throw new ApiError(409, "This volunteer is already assigned to this incident.");
            }
            Map<String, Object> assignment = tx.query("INSERT INTO assignments(incident_id,volunteer_id,task,instructions,status) "
                    + "VALUES($1,$2,$3,$4,$5) RETURNING *", incidentId, volunteerId, task, instructions, "Notified").first();
            Notifications.notifyUsers(tx, List.of(volunteer.get("user_id")), new Notifications.Message(
                    "assignment_created", "New assignment",
                    "ASN-" + assignment.get("id") + " · " + assignment.get("task") + " for INC-" + incidentId
                            + " (" + incident.get("type") + ", " + incident.get("location") + "). Please accept or decline it.",
                    "/dashboard/assignments?highlight=" + assignment.get("id")));
            return assignment;
        });
        return Res.json(201, row);
    }

    private Res update(Req req) {
        long assignmentId = Validator.parseId(req.params().get("id"));
        Validator v = Validator.of(req.json());
        String status = v.choice("status", AssignmentPolicy.STATUSES);
        String reason = v.optionalText("reason", 200);
        v.done();
        String actor = Security.is(req, Security.COORDINATOR) ? AssignmentPolicy.COORDINATOR : AssignmentPolicy.VOLUNTEER;
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> current = tx.query("SELECT a.*,v.user_id AS volunteer_user_id,u.name AS volunteer_name,"
                    + "i.type AS incident_type,i.location AS incident_location "
                    + "FROM assignments a JOIN volunteers v ON v.id=a.volunteer_id JOIN users u ON u.id=v.user_id JOIN incidents i ON i.id=a.incident_id "
                    + "WHERE a.id=$1 FOR UPDATE OF a", assignmentId).first();
            if (current == null || (AssignmentPolicy.VOLUNTEER.equals(actor)
                    && !String.valueOf(current.get("volunteer_user_id")).equals(String.valueOf(req.userId())))) {
                throw new ApiError(404, "Assignment not found");
            }
            AssignmentPolicy.Problem problem = AssignmentPolicy.check(actor, (String) current.get("status"), status);
            if (problem != null) {
                throw new ApiError(problem.status(), problem.error());
            }
            String statusReason = "";
            if ("Cancelled".equals(status)) {
                statusReason = reason.isEmpty() ? "Cancelled by coordinator" : "Cancelled by coordinator: " + reason;
            }
            if ("Declined".equals(status)) {
                statusReason = reason.isEmpty() ? "Declined by volunteer" : "Declined by volunteer: " + reason;
            }
            Map<String, Object> updated = tx.query("UPDATE assignments SET status=$1,status_reason=$2,updated_at=NOW() WHERE id=$3 RETURNING *",
                    status, statusReason, assignmentId).first();
            String label = "ASN-" + updated.get("id") + " (" + updated.get("task") + ") for INC-" + updated.get("incident_id");
            if (AssignmentPolicy.COORDINATOR.equals(actor)) {
                Notifications.notifyUsers(tx, List.of(current.get("volunteer_user_id")), new Notifications.Message(
                        "assignment_cancelled", "Assignment cancelled",
                        label + " was cancelled by a coordinator." + (reason.isEmpty() ? "" : " Reason: " + reason) + " No further action is needed.",
                        "/dashboard/assignments?highlight=" + updated.get("id")));
            } else {
                Notifications.notifyRoles(tx, List.of(Security.COORDINATOR), new Notifications.Message(
                        "assignment_" + status.toLowerCase(Locale.ROOT).replaceAll("\\s+", "_"),
                        UPDATE_TITLES.get(status),
                        req.userName() + " " + VERBS.get(status) + " " + label + "."
                                + ("Declined".equals(status) && !reason.isEmpty() ? " Reason: " + reason : ""),
                        "/admin/assignments?highlight=" + updated.get("id")), null);
            }
            Map<String, Object> result = new LinkedHashMap<>(updated);
            result.put("volunteer_name", current.get("volunteer_name"));
            result.put("incident_type", current.get("incident_type"));
            result.put("incident_location", current.get("incident_location"));
            return result;
        });
        return Res.json(200, row);
    }
}
