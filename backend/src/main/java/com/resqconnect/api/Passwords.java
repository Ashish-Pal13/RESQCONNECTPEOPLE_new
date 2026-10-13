package com.resqconnect.api;

public interface Passwords {
    String hash(String password);

    boolean matches(String password, String hash);
}
