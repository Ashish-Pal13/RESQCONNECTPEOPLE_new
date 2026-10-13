package com.resqconnect.http;

import com.resqconnect.util.Json;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class Res {
    private int status;
    private final Map<String, List<String>> headers = new LinkedHashMap<>();
    private byte[] body = new byte[0];
    private Path file;
    private long fileStart;
    private long fileLength;

    public Res(int status) {
        this.status = status;
    }

    public static Res json(int status, Object value) {
        Res res = new Res(status);
        res.header("Content-Type", "application/json; charset=utf-8");
        res.body = Json.write(value).getBytes(StandardCharsets.UTF_8);
        return res;
    }

    public static Res error(int status, String message) {
        return json(status, Json.obj("error", message));
    }

    public static Res empty(int status) {
        return new Res(status);
    }

    public static Res file(int status, Path file, long start, long length) {
        Res res = new Res(status);
        res.file = file;
        res.fileStart = start;
        res.fileLength = length;
        return res;
    }

    public int status() {
        return status;
    }

    public void status(int status) {
        this.status = status;
    }

    public Res header(String name, String value) {
        headers.remove(findKey(name));
        List<String> values = new ArrayList<>();
        values.add(value);
        headers.put(name, values);
        return this;
    }

    public Res addHeader(String name, String value) {
        String key = findKey(name);
        if (key == null) {
            header(name, value);
        } else {
            headers.get(key).add(value);
        }
        return this;
    }

    public boolean hasHeader(String name) {
        return findKey(name) != null;
    }

    private String findKey(String name) {
        for (String key : headers.keySet()) {
            if (key.equalsIgnoreCase(name)) {
                return key;
            }
        }
        return null;
    }

    public Map<String, List<String>> headers() {
        return headers;
    }

    public byte[] body() {
        return body;
    }

    public Res body(byte[] bytes) {
        this.body = bytes;
        return this;
    }

    public Path file() {
        return file;
    }

    public long fileStart() {
        return fileStart;
    }

    public long fileLength() {
        return fileLength;
    }

    public long contentLength() {
        return file != null ? fileLength : body.length;
    }
}
