package com.resqconnect.api;

import com.resqconnect.util.Json;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

public final class Jwt {
    public static final String ISSUER = "resqconnect";
    public static final long LIFETIME_SECONDS = 8 * 60 * 60;
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    public static final class InvalidToken extends Exception {
        private static final long serialVersionUID = 1L;
        private final boolean expired;

        InvalidToken(String message, boolean expired) {
            super(message);
            this.expired = expired;
        }

        public boolean expired() {
            return expired;
        }
    }

    private final byte[] secret;

    public Jwt(String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String sign(String subject, String role, long nowSeconds) {
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", subject);
        payload.put("role", role);
        payload.put("iat", nowSeconds);
        payload.put("exp", nowSeconds + LIFETIME_SECONDS);
        payload.put("iss", ISSUER);
        String signingInput = encode(Json.write(header)) + "." + encode(Json.write(payload));
        return signingInput + "." + ENCODER.encodeToString(hmac(signingInput));
    }

    private static String encode(String json) {
        return ENCODER.encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }

    private byte[] hmac(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(input.getBytes(StandardCharsets.US_ASCII));
        } catch (Exception e) {
            throw new IllegalStateException("HmacSHA256 is not available", e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> verify(String token, long nowSeconds) throws InvalidToken {
        if (token == null || token.isEmpty()) {
            throw new InvalidToken("jwt must be provided", false);
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) {
            throw new InvalidToken("jwt malformed", false);
        }
        Map<String, Object> header;
        Map<String, Object> payload;
        try {
            Object h = Json.parse(new String(DECODER.decode(parts[0]), StandardCharsets.UTF_8));
            Object p = Json.parse(new String(DECODER.decode(parts[1]), StandardCharsets.UTF_8));
            if (!(h instanceof Map<?, ?>) || !(p instanceof Map<?, ?>)) {
                throw new InvalidToken("invalid token", false);
            }
            header = (Map<String, Object>) h;
            payload = (Map<String, Object>) p;
        } catch (IllegalArgumentException | Json.ParseException e) {
            throw new InvalidToken("invalid token", false);
        }
        if (!"HS256".equals(header.get("alg"))) {
            throw new InvalidToken("invalid algorithm", false);
        }
        byte[] expected = hmac(parts[0] + "." + parts[1]);
        byte[] actual;
        try {
            actual = DECODER.decode(parts[2]);
        } catch (IllegalArgumentException e) {
            throw new InvalidToken("invalid signature", false);
        }
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new InvalidToken("invalid signature", false);
        }
        Object nbf = payload.get("nbf");
        if (nbf != null) {
            if (!(nbf instanceof Number n)) {
                throw new InvalidToken("invalid nbf value", false);
            }
            if (n.doubleValue() > nowSeconds) {
                throw new InvalidToken("jwt not active", false);
            }
        }
        Object exp = payload.get("exp");
        if (exp != null) {
            if (!(exp instanceof Number n)) {
                throw new InvalidToken("invalid exp value", false);
            }
            if (nowSeconds >= n.doubleValue()) {
                throw new InvalidToken("jwt expired", true);
            }
        }
        if (!ISSUER.equals(payload.get("iss"))) {
            throw new InvalidToken("jwt issuer invalid. expected: " + ISSUER, false);
        }
        return payload;
    }
}
