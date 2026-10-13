package com.resqconnect.api;

import com.resqconnect.db.Db;
import com.resqconnect.domain.Lists;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import com.resqconnect.http.Router;
import com.resqconnect.util.ApiError;
import com.resqconnect.util.Validator;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ResourceRoutes {
    static final List<String> PRIORITY = List.of("Normal", "High", "Urgent");

    private final Db db;
    private final Security security;

    public ResourceRoutes(Db db, Security security) {
        this.db = db;
        this.security = security;
    }

    public void register(Router router) {
        router.get("/api/resources", security.auth, Security.allow(Security.COORDINATOR), this::list);
        router.post("/api/resources", security.auth, Security.allow(Security.COORDINATOR), this::create);
    }

    private Res list(Req req) {
        Validator v = Validator.of(req.query());
        Lists.ListQuery q = Lists.listParams(v);
        String priority = v.optionalChoice("priority", PRIORITY);
        Long incidentId = v.integer("incident_id", Validator.id().optional());
        v.done();
        Lists.Params params = new Lists.Params();
        List<String> where = new ArrayList<>();
        if (priority != null) {
            where.add("r.priority=" + params.add(priority));
        }
        if (incidentId != null && incidentId != 0) {
            where.add("r.incident_id=" + params.add(incidentId));
        }
        if (!q.search().isEmpty()) {
            String p = params.add(Lists.likePattern(q.search()));
            List<String> parts = new ArrayList<>(List.of(
                    "r.resource ILIKE " + p + " ESCAPE '\\'",
                    "r.notes ILIKE " + p + " ESCAPE '\\'",
                    "i.type ILIKE " + p + " ESCAPE '\\'",
                    "i.location ILIKE " + p + " ESCAPE '\\'"));
            Long number = Lists.codeNumber(q.search(), "inc");
            if (number != null) {
                parts.add("r.incident_id=" + params.add(number));
            }
            where.add("(" + String.join(" OR ", parts) + ")");
        }
        return Lists.sendList(db, q, "SELECT r.*,i.type AS incident_type,i.location AS incident_location,i.status AS incident_status",
                "FROM resources r JOIN incidents i ON i.id=r.incident_id", where, params, "r.created_at DESC,r.id DESC");
    }

    private Res create(Req req) {
        Validator v = Validator.of(req.json());
        Long incidentId = v.integer("incident_id", Validator.id());
        String resource = v.text("resource", 120);
        Long quantity = v.integer("quantity", Validator.IntRule.integer().positive().max(1000000000L));
        String priority = v.choice("priority", PRIORITY, "Normal");
        String notes = v.optionalText("notes", 2000);
        v.done();
        Map<String, Object> row = db.transaction(tx -> {
            Map<String, Object> incident = tx.query("SELECT status FROM incidents WHERE id=$1 FOR SHARE", incidentId).first();
            if (incident == null) {
                throw new ApiError(400, "Please select a valid incident.");
            }
            if ("Resolved".equals(incident.get("status"))) {
                throw new ApiError(400, "This emergency report has already been resolved.");
            }
            return tx.query("INSERT INTO resources(incident_id,resource,quantity,priority,notes) VALUES($1,$2,$3,$4,$5) RETURNING *",
                    incidentId, resource, quantity, priority, notes).first();
        });
        return Res.json(201, row);
    }
}
