package com.resqconnect.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public final class Js {
    private static final Pattern DECIMAL = Pattern.compile("[+-]?(?:(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?|Infinity)");
    private static final Pattern HEX = Pattern.compile("0[xX][0-9a-fA-F]+");
    private static final Pattern OCTAL = Pattern.compile("0[oO][0-7]+");
    private static final Pattern BINARY = Pattern.compile("0[bB][01]+");

    private Js() {
    }

    public static boolean isWhitespace(char c) {
        return c == ' ' || c == '\t' || c == '\n' || c == '\u000B' || c == '\f' || c == '\r'
                || c == ' ' || c == ' ' || (c >= ' ' && c <= ' ')
                || c == ' ' || c == ' ' || c == ' ' || c == ' '
                || c == '　' || c == '﻿';
    }

    public static String trim(String s) {
        int start = 0;
        int end = s.length();
        while (start < end && isWhitespace(s.charAt(start))) {
            start++;
        }
        while (end > start && isWhitespace(s.charAt(end - 1))) {
            end--;
        }
        return s.substring(start, end);
    }

    public static String collapseWhitespace(String s) {
        StringBuilder out = new StringBuilder(s.length());
        boolean inSpace = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (isWhitespace(c)) {
                if (!inSpace) {
                    out.append(' ');
                }
                inSpace = true;
            } else {
                out.append(c);
                inSpace = false;
            }
        }
        return out.toString();
    }

    public static String removeWhitespace(String s) {
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (!isWhitespace(c)) {
                out.append(c);
            }
        }
        return out.toString();
    }

    public static double toNumber(Object value) {
        if (value == Json.UNDEFINED) {
            return Double.NaN;
        }
        if (value == null) {
            return 0;
        }
        if (value instanceof Boolean b) {
            return b ? 1 : 0;
        }
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        if (value instanceof String s) {
            return stringToNumber(s);
        }
        if (value instanceof List<?> list) {
            List<String> parts = new ArrayList<>();
            for (Object item : list) {
                parts.add(item == null ? "" : item instanceof List<?> || item instanceof Map<?, ?> ? "x" : String.valueOf(item));
            }
            return stringToNumber(String.join(",", parts));
        }
        return Double.NaN;
    }

    private static double stringToNumber(String raw) {
        String s = trim(raw);
        if (s.isEmpty()) {
            return 0;
        }
        try {
            if (HEX.matcher(s).matches()) {
                return new java.math.BigInteger(s.substring(2), 16).doubleValue();
            }
            if (OCTAL.matcher(s).matches()) {
                return new java.math.BigInteger(s.substring(2), 8).doubleValue();
            }
            if (BINARY.matcher(s).matches()) {
                return new java.math.BigInteger(s.substring(2), 2).doubleValue();
            }
            if (DECIMAL.matcher(s).matches()) {
                if (s.endsWith("Infinity")) {
                    return s.startsWith("-") ? Double.NEGATIVE_INFINITY : Double.POSITIVE_INFINITY;
                }
                return Double.parseDouble(s);
            }
        } catch (NumberFormatException e) {
            return Double.NaN;
        }
        return Double.NaN;
    }

    public static boolean isInteger(double d) {
        return !Double.isNaN(d) && !Double.isInfinite(d) && Math.floor(d) == d;
    }

    public static String typeName(Object value) {
        if (value == Json.UNDEFINED) {
            return "undefined";
        }
        if (value == null) {
            return "null";
        }
        if (value instanceof String) {
            return "string";
        }
        if (value instanceof Number n) {
            return Double.isNaN(n.doubleValue()) ? "nan" : "number";
        }
        if (value instanceof Boolean) {
            return "boolean";
        }
        if (value instanceof List<?>) {
            return "array";
        }
        return "object";
    }

    public static String numberToString(double d) {
        if (Double.isNaN(d)) {
            return "NaN";
        }
        if (Double.isInfinite(d)) {
            return d > 0 ? "Infinity" : "-Infinity";
        }
        if (d == Math.rint(d) && Math.abs(d) < 1e21) {
            return new java.math.BigDecimal(d).toPlainString();
        }
        String text = Double.toString(d);
        int e = text.indexOf('E');
        if (e < 0) {
            return text;
        }
        String mantissa = text.substring(0, e);
        if (mantissa.endsWith(".0")) {
            mantissa = mantissa.substring(0, mantissa.length() - 2);
        }
        String exponent = text.substring(e + 1);
        return mantissa + "e" + (exponent.startsWith("-") ? exponent : "+" + exponent);
    }
}
