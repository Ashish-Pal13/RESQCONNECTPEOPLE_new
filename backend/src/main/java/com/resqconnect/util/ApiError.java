package com.resqconnect.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ApiError extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private final int status;
    private final transient List<Map<String, Object>> details;

    public ApiError(int status, String message) {
        this(status, message, null);
    }

    public ApiError(int status, String message, List<Map<String, Object>> details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public int status() {
        return status;
    }

    public List<Map<String, Object>> details() {
        return details;
    }

    public static ApiError invalidInput(List<Map<String, Object>> issues) {
        List<String> parts = new ArrayList<>();
        for (Map<String, Object> issue : issues) {
            String field = (String) issue.get("field");
            String message = (String) issue.get("message");
            parts.add(field.isEmpty() ? message : field + " - " + message);
        }
        return new ApiError(400, "Invalid input: " + String.join("; ", parts), issues);
    }
}
