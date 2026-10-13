package com.resqconnect.domain;

import com.resqconnect.db.Db;
import com.resqconnect.http.Res;
import com.resqconnect.util.Js;
import com.resqconnect.util.Json;
import com.resqconnect.util.Validator;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class Lists {
    public static final List<Integer> PAGE_SIZES = List.of(5, 10, 20, 50, 100);
    public static final int LEGACY_LIST_LIMIT = 500;

    public record ListQuery(Long page, Long pageSize, String search) {
        public boolean paged() {
            return page != null || pageSize != null;
        }
    }

    public static final class Params {
        private final List<Object> values = new ArrayList<>();

        public String add(Object value) {
            values.add(value);
            return "$" + values.size();
        }

        public List<Object> values() {
            return values;
        }
    }

    private Lists() {
    }

    public static ListQuery listParams(Validator v) {
        Long page = v.integer("page", Validator.IntRule.integer().min(1).max(100000).optional());
        Long pageSize = v.pageSize("pageSize", PAGE_SIZES, null);
        String search = v.optionalText("search", 100);
        return new ListQuery(page, pageSize, search == null ? "" : search);
    }

    public static String escapeLike(String value) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\\' || c == '%' || c == '_') {
                out.append('\\');
            }
            out.append(c);
        }
        return out.toString();
    }

    public static String likePattern(String search) {
        return "%" + escapeLike(search) + "%";
    }

    public static Long codeNumber(String search, String prefix) {
        Pattern pattern = Pattern.compile("^(?:" + prefix + ")?-?0*(\\d{1,15})$", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(Js.removeWhitespace(search));
        return matcher.matches() ? Long.parseLong(matcher.group(1)) : null;
    }

    public static Res sendList(Db db, ListQuery q, String select, String from, List<String> where, Params params, String order) {
        String clause = where.isEmpty() ? "" : " WHERE " + String.join(" AND ", where);
        if (!q.paged()) {
            List<Map<String, Object>> rows = new ArrayList<>(db.run(select + " " + from + clause + " ORDER BY " + order
                    + " LIMIT " + (LEGACY_LIST_LIMIT + 1), params.values()).rows());
            Res res = Res.json(200, rows);
            if (rows.size() > LEGACY_LIST_LIMIT) {
                res = Res.json(200, rows.subList(0, LEGACY_LIST_LIMIT));
                res.header("X-Result-Truncated", "true");
            }
            return res;
        }
        long pageSize = q.pageSize() == null ? 20 : q.pageSize();
        Object totalValue = db.run("SELECT COUNT(*)::int AS total " + from + clause, params.values()).first().get("total");
        long total = ((Number) totalValue).longValue();
        long totalPages = Math.max(1, (total + pageSize - 1) / pageSize);
        long page = Math.min(q.page() == null ? 1 : q.page(), totalPages);
        List<Map<String, Object>> rows = db.run(select + " " + from + clause + " ORDER BY " + order
                + " LIMIT " + params.add(pageSize) + " OFFSET " + params.add((page - 1) * pageSize), params.values()).rows();
        return Res.json(200, Json.obj("data", rows, "pagination",
                Json.obj("page", page, "pageSize", pageSize, "total", total, "totalPages", totalPages)));
    }
}
