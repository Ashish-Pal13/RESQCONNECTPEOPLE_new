package com.resqconnect.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class Json {
    public static final Object UNDEFINED = new Object() {
        @Override
        public String toString() {
            return "undefined";
        }
    };
    private static final long MAX_SAFE_INTEGER = 9007199254740991L;
    private static final int MAX_DEPTH = 512;

    private final String text;
    private int pos;

    private Json(String text) {
        this.text = text;
    }

    public static final class ParseException extends Exception {
        private static final long serialVersionUID = 1L;
        public ParseException(String message) {
            super(message);
        }
    }

    public static Object parse(String text) throws ParseException {
        Json parser = new Json(text);
        parser.skipWhitespace();
        Object value = parser.readValue(0);
        parser.skipWhitespace();
        if (parser.pos != text.length()) {
            throw new ParseException("Unexpected data after JSON value at position " + parser.pos);
        }
        return value;
    }

    private void skipWhitespace() {
        while (pos < text.length()) {
            char c = text.charAt(pos);
            if (c == ' ' || c == '\t' || c == '\n' || c == '\r') {
                pos++;
            } else {
                break;
            }
        }
    }

    private ParseException error(String message) {
        return new ParseException(message + " at position " + pos);
    }

    private Object readValue(int depth) throws ParseException {
        if (depth > MAX_DEPTH) {
            throw error("JSON nested too deeply");
        }
        if (pos >= text.length()) {
            throw error("Unexpected end of JSON input");
        }
        char c = text.charAt(pos);
        switch (c) {
            case '{':
                return readObject(depth);
            case '[':
                return readArray(depth);
            case '"':
                return readString();
            case 't':
                expectWord("true");
                return Boolean.TRUE;
            case 'f':
                expectWord("false");
                return Boolean.FALSE;
            case 'n':
                expectWord("null");
                return null;
            default:
                if (c == '-' || (c >= '0' && c <= '9')) {
                    return readNumber();
                }
                throw error("Unexpected token " + c);
        }
    }

    private void expectWord(String word) throws ParseException {
        if (!text.startsWith(word, pos)) {
            throw error("Unexpected token");
        }
        pos += word.length();
    }

    private Map<String, Object> readObject(int depth) throws ParseException {
        Map<String, Object> map = new LinkedHashMap<>();
        pos++;
        skipWhitespace();
        if (pos < text.length() && text.charAt(pos) == '}') {
            pos++;
            return map;
        }
        while (true) {
            skipWhitespace();
            if (pos >= text.length() || text.charAt(pos) != '"') {
                throw error("Expected property name");
            }
            String key = readString();
            skipWhitespace();
            if (pos >= text.length() || text.charAt(pos) != ':') {
                throw error("Expected ':'");
            }
            pos++;
            skipWhitespace();
            Object value = readValue(depth + 1);
            map.remove(key);
            map.put(key, value);
            skipWhitespace();
            if (pos >= text.length()) {
                throw error("Unexpected end of JSON input");
            }
            char c = text.charAt(pos);
            if (c == ',') {
                pos++;
                continue;
            }
            if (c == '}') {
                pos++;
                return map;
            }
            throw error("Expected ',' or '}'");
        }
    }

    private List<Object> readArray(int depth) throws ParseException {
        List<Object> list = new ArrayList<>();
        pos++;
        skipWhitespace();
        if (pos < text.length() && text.charAt(pos) == ']') {
            pos++;
            return list;
        }
        while (true) {
            skipWhitespace();
            list.add(readValue(depth + 1));
            skipWhitespace();
            if (pos >= text.length()) {
                throw error("Unexpected end of JSON input");
            }
            char c = text.charAt(pos);
            if (c == ',') {
                pos++;
                continue;
            }
            if (c == ']') {
                pos++;
                return list;
            }
            throw error("Expected ',' or ']'");
        }
    }

    private String readString() throws ParseException {
        pos++;
        StringBuilder out = new StringBuilder();
        while (true) {
            if (pos >= text.length()) {
                throw error("Unterminated string");
            }
            char c = text.charAt(pos++);
            if (c == '"') {
                return out.toString();
            }
            if (c < 0x20) {
                throw error("Bad control character in string");
            }
            if (c != '\\') {
                out.append(c);
                continue;
            }
            if (pos >= text.length()) {
                throw error("Unterminated string");
            }
            char e = text.charAt(pos++);
            switch (e) {
                case '"' -> out.append('"');
                case '\\' -> out.append('\\');
                case '/' -> out.append('/');
                case 'b' -> out.append('\b');
                case 'f' -> out.append('\f');
                case 'n' -> out.append('\n');
                case 'r' -> out.append('\r');
                case 't' -> out.append('\t');
                case 'u' -> {
                    if (pos + 4 > text.length()) {
                        throw error("Bad Unicode escape");
                    }
                    int code = 0;
                    for (int i = 0; i < 4; i++) {
                        int digit = Character.digit(text.charAt(pos + i), 16);
                        if (digit < 0) {
                            throw error("Bad Unicode escape");
                        }
                        code = code * 16 + digit;
                    }
                    pos += 4;
                    out.append((char) code);
                }
                default -> throw error("Bad escaped character");
            }
        }
    }

    private Object readNumber() throws ParseException {
        int start = pos;
        if (text.charAt(pos) == '-') {
            pos++;
        }
        if (pos >= text.length()) {
            throw error("No number after minus sign");
        }
        if (text.charAt(pos) == '0') {
            pos++;
        } else if (text.charAt(pos) >= '1' && text.charAt(pos) <= '9') {
            while (pos < text.length() && Character.isDigit(text.charAt(pos)) && text.charAt(pos) < 128) {
                pos++;
            }
        } else {
            throw error("Invalid number");
        }
        boolean integral = true;
        if (pos < text.length() && text.charAt(pos) == '.') {
            integral = false;
            pos++;
            int digits = pos;
            while (pos < text.length() && text.charAt(pos) >= '0' && text.charAt(pos) <= '9') {
                pos++;
            }
            if (pos == digits) {
                throw error("Unterminated fractional number");
            }
        }
        if (pos < text.length() && (text.charAt(pos) == 'e' || text.charAt(pos) == 'E')) {
            integral = false;
            pos++;
            if (pos < text.length() && (text.charAt(pos) == '+' || text.charAt(pos) == '-')) {
                pos++;
            }
            int digits = pos;
            while (pos < text.length() && text.charAt(pos) >= '0' && text.charAt(pos) <= '9') {
                pos++;
            }
            if (pos == digits) {
                throw error("Exponent part is missing a number");
            }
        }
        String number = text.substring(start, pos);
        double d = Double.parseDouble(number);
        if (integral && Math.abs(d) <= MAX_SAFE_INTEGER) {
            return Long.parseLong(number);
        }
        if (Js.isInteger(d) && Math.abs(d) <= MAX_SAFE_INTEGER) {
            return (long) d;
        }
        return d;
    }

    public static String write(Object value) {
        StringBuilder out = new StringBuilder();
        writeValue(out, value);
        return out.toString();
    }

    private static void writeValue(StringBuilder out, Object value) {
        if (value == null || value == UNDEFINED) {
            out.append("null");
        } else if (value instanceof String s) {
            writeString(out, s);
        } else if (value instanceof Boolean b) {
            out.append(b ? "true" : "false");
        } else if (value instanceof Long || value instanceof Integer || value instanceof Short || value instanceof Byte
                || value instanceof java.math.BigInteger) {
            out.append(value);
        } else if (value instanceof Number n) {
            double d = n.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d)) {
                out.append("null");
            } else {
                out.append(Js.numberToString(d));
            }
        } else if (value instanceof Map<?, ?> map) {
            out.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getValue() == UNDEFINED) {
                    continue;
                }
                if (!first) {
                    out.append(',');
                }
                first = false;
                writeString(out, String.valueOf(entry.getKey()));
                out.append(':');
                writeValue(out, entry.getValue());
            }
            out.append('}');
        } else if (value instanceof Iterable<?> list) {
            out.append('[');
            boolean first = true;
            for (Object item : list) {
                if (!first) {
                    out.append(',');
                }
                first = false;
                writeValue(out, item);
            }
            out.append(']');
        } else {
            writeString(out, value.toString());
        }
    }

    private static void writeString(StringBuilder out, String s) {
        out.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\b' -> out.append("\\b");
                case '\f' -> out.append("\\f");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else if (Character.isHighSurrogate(c)) {
                        if (i + 1 < s.length() && Character.isLowSurrogate(s.charAt(i + 1))) {
                            out.append(c).append(s.charAt(i + 1));
                            i++;
                        } else {
                            out.append(String.format("\\u%04x", (int) c));
                        }
                    } else if (Character.isLowSurrogate(c)) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        out.append('"');
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> obj(Object... keyValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put((String) keyValues[i], keyValues[i + 1]);
        }
        return map;
    }
}
