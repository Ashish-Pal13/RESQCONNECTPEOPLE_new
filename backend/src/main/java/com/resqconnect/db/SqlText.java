package com.resqconnect.db;

import java.util.ArrayList;
import java.util.List;

public final class SqlText {
    public record Prepared(String sql, List<Object> params) {
    }

    private SqlText() {
    }

    public static Prepared toJdbc(String sql, List<?> params) {
        StringBuilder out = new StringBuilder(sql.length());
        List<Object> ordered = new ArrayList<>();
        int i = 0;
        int n = sql.length();
        while (i < n) {
            char c = sql.charAt(i);
            if (c == '\'' || c == '"') {
                int end = i + 1;
                while (end < n) {
                    if (sql.charAt(end) == c) {
                        if (end + 1 < n && sql.charAt(end + 1) == c) {
                            end += 2;
                            continue;
                        }
                        break;
                    }
                    end++;
                }
                end = Math.min(end, n - 1);
                out.append(sql, i, end + 1);
                i = end + 1;
                continue;
            }
            if (c == '-' && i + 1 < n && sql.charAt(i + 1) == '-') {
                int end = sql.indexOf('\n', i);
                end = end < 0 ? n : end;
                out.append(sql, i, end);
                i = end;
                continue;
            }
            if (c == '$' && i + 1 < n && Character.isDigit(sql.charAt(i + 1))) {
                int end = i + 1;
                while (end < n && Character.isDigit(sql.charAt(end))) {
                    end++;
                }
                int index = Integer.parseInt(sql.substring(i + 1, end));
                if (index < 1 || index > params.size()) {
                    throw new IllegalArgumentException("SQL refers to $" + index + " but only " + params.size() + " parameter(s) were given");
                }
                ordered.add(params.get(index - 1));
                out.append('?');
                i = end;
                continue;
            }
            if (c == '?') {
                throw new IllegalArgumentException("Use $1, $2 ... placeholders instead of ? in SQL");
            }
            out.append(c);
            i++;
        }
        return new Prepared(out.toString(), ordered);
    }
}
