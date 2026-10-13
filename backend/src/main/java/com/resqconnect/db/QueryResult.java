package com.resqconnect.db;

import java.util.List;
import java.util.Map;

public record QueryResult(List<Map<String, Object>> rows, int rowCount) {
    public Map<String, Object> first() {
        return rows.isEmpty() ? null : rows.get(0);
    }
}
