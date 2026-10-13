package com.resqconnect.util;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public final class Validator {
    public static final long MAX_SAFE_INTEGER = 9007199254740991L;
    private static final Pattern EMAIL = Pattern.compile(
            "^(?!\\.)(?!.*\\.\\.)([A-Z0-9_'+\\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\\-]*\\.)+[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE);

    private final Map<String, Object> data;
    private final List<Map<String, Object>> issues = new ArrayList<>();
    private boolean aborted;
    private boolean rootInvalid;

    private Validator(Map<String, Object> data) {
        this.data = data;
    }

    @SuppressWarnings("unchecked")
    public static Validator of(Object input) {
        if (input instanceof Map<?, ?> map) {
            return new Validator((Map<String, Object>) map);
        }
        Validator v = new Validator(new LinkedHashMap<>());
        String type = Js.typeName(input);
        v.fail("", "undefined".equals(type) ? "Required" : "Expected object, received " + type);
        v.rootInvalid = true;
        return v;
    }

    public boolean aborted() {
        return aborted;
    }

    public boolean hasIssues() {
        return !issues.isEmpty();
    }

    public Object raw(String key) {
        return data.containsKey(key) ? data.get(key) : Json.UNDEFINED;
    }

    public void issue(String field, String message) {
        Map<String, Object> issue = new LinkedHashMap<>();
        issue.put("field", field);
        issue.put("message", message);
        issues.add(issue);
    }

    private void fail(String field, String message) {
        issue(field, message);
        aborted = true;
    }

    public void done() {
        if (!issues.isEmpty()) {
            throw ApiError.invalidInput(issues);
        }
    }

    private String asString(String key, Object value) {
        if (value == Json.UNDEFINED) {
            fail(key, "Required");
            return null;
        }
        if (!(value instanceof String s)) {
            fail(key, "Expected string, received " + Js.typeName(value));
            return null;
        }
        return s;
    }

    private void lengths(String key, String s, int min, int max) {
        if (s.length() < min) {
            issue(key, "String must contain at least " + min + " character(s)");
        }
        if (s.length() > max) {
            issue(key, "String must contain at most " + max + " character(s)");
        }
    }

    public String text(String key, int max) {
        if (rootInvalid) {
            return null;
        }
        String s = asString(key, raw(key));
        if (s == null) {
            return null;
        }
        s = Js.trim(s);
        lengths(key, s, 1, max);
        return s;
    }

    public String optionalText(String key, int max) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (value == Json.UNDEFINED) {
            return "";
        }
        String s = asString(key, value);
        if (s == null) {
            return null;
        }
        s = Js.trim(s);
        lengths(key, s, 0, max);
        return s;
    }

    public String optionalTrimmed(String key, int max) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (value == Json.UNDEFINED) {
            return null;
        }
        String s = asString(key, value);
        if (s == null) {
            return null;
        }
        s = Js.trim(s);
        lengths(key, s, 0, max);
        return s;
    }

    public String optionalText(String key, int minimum, int max) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (value == Json.UNDEFINED) {
            return null;
        }
        String s = asString(key, value);
        if (s == null) {
            return null;
        }
        s = Js.trim(s);
        lengths(key, s, minimum, max);
        return s;
    }

    public String plainString(String key, int min, int max) {
        if (rootInvalid) {
            return null;
        }
        String s = asString(key, raw(key));
        if (s == null) {
            return null;
        }
        lengths(key, s, min, max);
        return s;
    }

    public String optionalPlainString(String key) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (value == Json.UNDEFINED) {
            return null;
        }
        return asString(key, value);
    }

    public String email(String key) {
        if (rootInvalid) {
            return null;
        }
        String s = asString(key, raw(key));
        if (s == null) {
            return null;
        }
        s = Js.trim(s);
        if (!EMAIL.matcher(s).matches()) {
            issue(key, "Invalid email");
        }
        if (s.length() > 255) {
            issue(key, "String must contain at most 255 character(s)");
        }
        return s.toLowerCase(Locale.ROOT);
    }

    public String password(String key) {
        if (rootInvalid) {
            return null;
        }
        String s = asString(key, raw(key));
        if (s == null) {
            return null;
        }
        lengths(key, s, 8, 128);
        if (s.getBytes(StandardCharsets.UTF_8).length > 72) {
            issue(key, "Password must be at most 72 bytes");
        }
        return s;
    }

    public String phone(String key, boolean optional) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (optional && value == Json.UNDEFINED) {
            return null;
        }
        String s = asString(key, value);
        if (s == null) {
            return null;
        }
        s = Js.trim(s);
        lengths(key, s, 6, 30);
        boolean ok = !s.isEmpty();
        for (int i = 0; i < s.length() && ok; i++) {
            char c = s.charAt(i);
            ok = (c >= '0' && c <= '9') || c == '+' || c == '(' || c == ')' || c == '-' || Js.isWhitespace(c);
        }
        if (!ok) {
            issue(key, "Phone may contain digits, spaces, +, - and brackets only");
        }
        return s;
    }

    private static String joinValues(List<String> options) {
        List<String> quoted = new ArrayList<>();
        for (String option : options) {
            quoted.add("'" + option + "'");
        }
        return String.join(" | ", quoted);
    }

    public String choice(String key, List<String> options) {
        return choice(key, options, false, null);
    }

    public String optionalChoice(String key, List<String> options) {
        return choice(key, options, true, null);
    }

    public String choice(String key, List<String> options, String defaultValue) {
        return choice(key, options, false, defaultValue);
    }

    private String choice(String key, List<String> options, boolean optional, String defaultValue) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (value == Json.UNDEFINED) {
            if (defaultValue != null) {
                value = defaultValue;
            } else if (optional) {
                return null;
            } else {
                fail(key, "Required");
                return null;
            }
        }
        if (!(value instanceof String s)) {
            fail(key, "Expected " + joinValues(options) + ", received " + Js.typeName(value));
            return null;
        }
        if (!options.contains(s)) {
            fail(key, "Invalid enum value. Expected " + joinValues(options) + ", received '" + s + "'");
            return null;
        }
        return s;
    }

    public String oneOf(String key, List<String> options, String message) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (value == Json.UNDEFINED) {
            fail(key, "Required");
            return null;
        }
        if (!(value instanceof String s)) {
            fail(key, message);
            return null;
        }
        String trimmed = Js.trim(s);
        if (!options.contains(trimmed)) {
            fail(key, message);
            return null;
        }
        return trimmed;
    }

    public static final class IntRule {
        private Long min;
        private Long max;
        private boolean positive;
        private boolean optional;
        private Object defaultValue;

        public static IntRule integer() {
            return new IntRule();
        }

        public IntRule min(long value) {
            this.min = value;
            return this;
        }

        public IntRule max(long value) {
            this.max = value;
            return this;
        }

        public IntRule positive() {
            this.positive = true;
            return this;
        }

        public IntRule optional() {
            this.optional = true;
            return this;
        }

        public IntRule defaultValue(Object value) {
            this.defaultValue = value;
            return this;
        }
    }

    public static IntRule id() {
        return IntRule.integer().positive().max(MAX_SAFE_INTEGER);
    }

    public Long integer(String key, IntRule rule) {
        if (rootInvalid) {
            return null;
        }
        return coerceInteger(key, raw(key), rule);
    }

    private Long coerceInteger(String key, Object value, IntRule rule) {
        if (value == Json.UNDEFINED) {
            if (rule.defaultValue != null) {
                value = rule.defaultValue;
            } else if (rule.optional) {
                return null;
            }
        }
        double d = Js.toNumber(value);
        if (Double.isNaN(d)) {
            fail(key, "Expected number, received nan");
            return null;
        }
        if (!Js.isInteger(d)) {
            issue(key, "Expected integer, received float");
        }
        if (rule.min != null && d < rule.min) {
            issue(key, "Number must be greater than or equal to " + rule.min);
        }
        if (rule.positive && !(d > 0)) {
            issue(key, "Number must be greater than 0");
        }
        if (rule.max != null && d > rule.max) {
            issue(key, "Number must be less than or equal to " + rule.max);
        }
        return (long) d;
    }

    public Long pageSize(String key, List<Integer> allowed, Object defaultValue) {
        if (rootInvalid) {
            return null;
        }
        Object value = raw(key);
        if (value == Json.UNDEFINED) {
            if (defaultValue == null) {
                return null;
            }
            value = defaultValue;
        }
        double d = Js.toNumber(value);
        if (Double.isNaN(d)) {
            fail(key, "Expected number, received nan");
            return null;
        }
        if (!Js.isInteger(d)) {
            issue(key, "Expected integer, received float");
        }
        boolean ok = false;
        for (Integer size : allowed) {
            if (size.doubleValue() == d) {
                ok = true;
                break;
            }
        }
        if (!ok) {
            List<String> sizes = new ArrayList<>();
            for (Integer size : allowed) {
                sizes.add(String.valueOf(size));
            }
            issue(key, "pageSize must be one of " + String.join(", ", sizes));
        }
        return (long) d;
    }

    public static long parseId(String raw) {
        double d = Js.toNumber(raw);
        List<Map<String, Object>> found = new ArrayList<>();
        Validator v = new Validator(new LinkedHashMap<>());
        if (Double.isNaN(d)) {
            v.issue("", "Expected number, received nan");
        } else {
            if (!Js.isInteger(d)) {
                v.issue("", "Expected integer, received float");
            }
            if (!(d > 0)) {
                v.issue("", "Number must be greater than 0");
            }
            if (d > MAX_SAFE_INTEGER) {
                v.issue("", "Number must be less than or equal to " + MAX_SAFE_INTEGER);
            }
        }
        found.addAll(v.issues);
        if (!found.isEmpty()) {
            throw ApiError.invalidInput(found);
        }
        return (long) d;
    }
}
