package com.resqconnect.config;

import com.resqconnect.api.Passwords;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.nio.charset.StandardCharsets;

public final class BcryptPasswords implements Passwords {
    private static final int COST = 12;
    private static final int MAX_BYTES = 72;

    @Override
    public String hash(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt(COST));
    }

    @Override
    public boolean matches(String password, String hash) {
        if (password == null || hash == null || hash.isEmpty()) {
            return false;
        }
        try {
            return BCrypt.checkpw(limitBytes(password), hash);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    static String limitBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length <= MAX_BYTES) {
            return password;
        }
        int bytes = 0;
        int end = 0;
        while (end < password.length()) {
            int codePoint = password.codePointAt(end);
            int size = new String(Character.toChars(codePoint)).getBytes(StandardCharsets.UTF_8).length;
            if (bytes + size > MAX_BYTES) {
                break;
            }
            bytes += size;
            end += Character.charCount(codePoint);
        }
        return password.substring(0, end);
    }
}
