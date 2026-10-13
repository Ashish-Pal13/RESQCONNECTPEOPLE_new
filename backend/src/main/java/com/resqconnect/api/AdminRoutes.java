package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.domain.AssignmentPolicy;
import com.resqconnect.domain.Lists;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.Json;
import com.resqconnect.util.Validator;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class AdminRoutes {
    static final List<String> INCIDENT_STATUS = List.of("Under Review", "In Progress", "Resolved");

    private final Db db;
    private final Security security;

    public AdminRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router) {
        router.get("/api/admin/summary", security.auth, Security.allow(Security.STAFF), this::summary);
        router.get("/api/admin/analytics", security.auth, Security.allow(Security.COORDINATOR), this::analytics);
        router.get("/api/admin/users/stats", security.auth, Security.allow(Security.COORDINATOR), this::userStats);
        router.get("/api/admin/users", security.auth, Security.allow(Security.COORDINATOR), this::users);
    }

    private Res summary(Req req) {
        Map<String, Object> row = db.query("SELECT "
                + "(SELECT COUNT(*) FROM incidents)::int AS total_incidents,"
                + "(SELECT COUNT(*) FROM incidents WHERE status<>'Resolved')::int AS open_incidents,"
                + "(SELECT COUNT(*) FROM incidents WHERE status='Resolved')::int AS resolved_incidents,"
                + "(SELECT COUNT(*) FROM volunteers)::int AS volunteers,"
                + "(SELECT COUNT(*) FROM volunteers WHERE category='General')::int AS general_volunteers,"
                + "(SELECT COUNT(*) FROM volunteers WHERE category='Trained')::int AS trained_volunteers,"
                + "(SELECT COUNT(*) FROM volunteers WHERE category='Trained' AND verification='Pending Verification')::int AS pending_verification,"
                + "(SELECT COUNT(*) FROM volunteers WHERE verification='Active - Verified')::int AS verified_trained,"
                + "(SELECT COUNT(*) FROM assignments)::int AS assignments,"
                + "(SELECT COUNT(*) FROM assignments WHERE status=ANY($1::text[]))::int AS active_assignments,"
                + "(SELECT COUNT(*) FROM assignments WHERE status='Completed')::int AS completed_assignments,"
                + "(SELECT COUNT(*) FROM resources)::int AS resources,"
                + "(SELECT COUNT(*) FROM users WHERE role='user')::int AS users,"
                + "(SELECT COUNT(*) FROM tickets)::int AS tickets,"
                + "(SELECT COUNT(*) FROM tickets WHERE status='Open')::int AS open_tickets,"
                + "(SELECT COUNT(*) FROM contact_messages)::int AS contact_messages",
                (Object) AssignmentPolicy.OPEN_STATUSES).first();
        return Res.json(200, row);
    }

    private static Map<String, Object> byStatus(List<Map<String, Object>> rows, List<String> statuses) {
        Map<String, Object> counts = new LinkedHashMap<>();
        for (String status : statuses) {
            long count = 0;
            for (Map<String, Object> row : rows) {
                if (status.equals(row.get("status"))) {
                    count = ((Number) row.get("count")).longValue();
                    break;
                }
            }
            counts.put(status, count);
        }
        return counts;
    }

    private static long sum(Map<String, Object> counts) {
        long total = 0;
        for (Object value : counts.values()) {
            total += ((Number) value).longValue();
        }
        return total;
    }

    private Res analytics(Req req) {
        List<Map<String, Object>> incidents = db.query("SELECT status,COUNT(*)::int AS count FROM incidents GROUP BY status").rows();
        List<Map<String, Object>> assignments = db.query("SELECT status,COUNT(*)::int AS count FROM assignments GROUP BY status").rows();
        Map<String, Object> volunteers = db.query("SELECT COUNT(*)::int AS total,"
                + " COUNT(*) FILTER (WHERE category='General')::int AS general,"
                + " COUNT(*) FILTER (WHERE category='Trained')::int AS trained,"
                + " COUNT(*) FILTER (WHERE verification='Active - Verified')::int AS verified,"
                + " COUNT(*) FILTER (WHERE verification='Pending Verification')::int AS pending"
                + " FROM volunteers").first();
        Map<String, Object> incidentCounts = byStatus(incidents, INCIDENT_STATUS);
        Map<String, Object> assignmentCounts = byStatus(assignments, AssignmentPolicy.STATUSES);
        return Res.json(200, Json.obj(
                "incidents", Json.obj("total", sum(incidentCounts), "by_status", incidentCounts),
                "assignments", Json.obj("total", sum(assignmentCounts), "by_status", assignmentCounts),
                "volunteers", volunteers));
    }

    private Res userStats(Req req) {
        return Res.json(200, db.query("SELECT COUNT(*)::int AS total_users,"
                + " COUNT(*) FILTER (WHERE u.is_active)::int AS active_users,"
                + " COUNT(*) FILTER (WHERE u.created_at>=NOW()-INTERVAL '7 days')::int AS registered_last_7_days,"
                + " COUNT(*) FILTER (WHERE u.created_at>=NOW()-INTERVAL '30 days')::int AS registered_last_30_days,"
                + " COUNT(v.id)::int AS with_volunteer_profile"
                + " FROM users u LEFT JOIN volunteers v ON v.user_id=u.id WHERE u.role='user'").first());
    }

    private Res users(Req req) {
        Validator v = Validator.of(req.query());
        Long pageValue = v.integer("page", Validator.IntRule.integer().min(1).max(100000).defaultValue(1L));
        Long pageSizeValue = v.pageSize("pageSize", Lists.PAGE_SIZES, 20L);
        String search = v.optionalText("search", 100);
        String role = v.choice("role", List.of("user", "coordinator", "verifier", "all"), "user");
        String volunteer = v.choice("volunteer", List.of("all", "yes", "no"), "all");
        String status = v.choice("status", List.of("all", "active", "disabled"), "all");
        v.done();
        List<String> where = new ArrayList<>();
        Lists.Params params = new Lists.Params();
        if (!"all".equals(role)) {
            where.add("u.role=" + params.add(role));
        }
        if (!"all".equals(status)) {
            where.add("u.is_active=" + params.add("active".equals(status)));
        }
        if ("yes".equals(volunteer)) {
            where.add("v.id IS NOT NULL");
        }
        if ("no".equals(volunteer)) {
            where.add("v.id IS NULL");
        }
        if (!search.isEmpty()) {
            String p = params.add(Lists.likePattern(search));
            where.add("(u.name ILIKE " + p + " ESCAPE '\\' OR u.email ILIKE " + p + " ESCAPE '\\')");
        }
        String from = "FROM users u LEFT JOIN volunteers v ON v.user_id=u.id" + (where.isEmpty() ? "" : " WHERE " + String.join(" AND ", where));
        long total = ((Number) db.run("SELECT COUNT(*)::int AS total " + from, params.values()).first().get("total")).longValue();
        long pageSize = pageSizeValue;
        long totalPages = Math.max(1, (total + pageSize - 1) / pageSize);
        long page = Math.min(pageValue, totalPages);
        List<Map<String, Object>> rows = db.run("SELECT u.id,u.name,u.email,u.role,u.is_active,u.created_at,v.phone,v.verification AS volunteer_status "
                + from + " ORDER BY u.created_at DESC,u.id DESC LIMIT " + params.add(pageSize) + " OFFSET " + params.add((page - 1) * pageSize),
                params.values()).rows();
        return Res.json(200, Json.obj("data", rows, "pagination",
                Json.obj("page", page, "pageSize", pageSize, "total", total, "totalPages", totalPages)));
    }
}
