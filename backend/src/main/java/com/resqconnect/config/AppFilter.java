package com.resqconnect.config;

import com.resqconnect.http.App;
import com.resqconnect.http.Req;
import com.resqconnect.http.Res;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class AppFilter implements Filter {
    private final App app;

    public AppFilter(App app) {
        this.app = app;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        Map<String, String> headers = new LinkedHashMap<>();
        Enumeration<String> names = httpRequest.getHeaderNames();
        while (names != null && names.hasMoreElements()) {
            String name = names.nextElement();
            List<String> values = new ArrayList<>(Collections.list(httpRequest.getHeaders(name)));
            headers.put(name, String.join(", ", values));
        }
        boolean[] tooLarge = {false};
        byte[] body;
        try (InputStream in = httpRequest.getInputStream()) {
            body = Req.readLimited(in, Req.BODY_LIMIT, tooLarge);
        }
        Req req = new Req(httpRequest.getMethod(), httpRequest.getRequestURI(), httpRequest.getQueryString(), headers, body,
                tooLarge[0], httpRequest.getRemoteAddr());
        Res res = app.handle(req);
        write(req, res, httpResponse);
    }

    private static void write(Req req, Res res, HttpServletResponse response) throws IOException {
        response.setStatus(res.status());
        for (Map.Entry<String, List<String>> header : res.headers().entrySet()) {
            boolean first = true;
            for (String value : header.getValue()) {
                if (first) {
                    response.setHeader(header.getKey(), value);
                    first = false;
                } else {
                    response.addHeader(header.getKey(), value);
                }
            }
        }
        boolean noBody = req.method().equals("HEAD") || res.status() == 204 || res.status() == 304;
        if (res.status() != 204 && res.status() != 304) {
            response.setContentLengthLong(res.contentLength());
        }
        if (noBody) {
            return;
        }
        try {
            OutputStream out = response.getOutputStream();
            if (res.file() != null) {
                try (InputStream in = Files.newInputStream(res.file())) {
                    long skipped = in.skip(res.fileStart());
                    while (skipped < res.fileStart()) {
                        long more = in.skip(res.fileStart() - skipped);
                        if (more <= 0) {
                            break;
                        }
                        skipped += more;
                    }
                    byte[] buffer = new byte[64 * 1024];
                    long remaining = res.fileLength();
                    while (remaining > 0) {
                        int read = in.read(buffer, 0, (int) Math.min(buffer.length, remaining));
                        if (read < 0) {
                            break;
                        }
                        out.write(buffer, 0, read);
                        remaining -= read;
                    }
                }
            } else {
                out.write(res.body());
            }
            out.flush();
        } catch (IOException clientGone) {
            response.flushBuffer();
        }
    }
}
