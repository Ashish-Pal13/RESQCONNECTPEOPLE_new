package com.resqconnect.db;

import java.sql.SQLException;
import java.util.Set;

public class DbException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private static final Set<String> CONNECTION_STATES = Set.of(
            "57P01", "57P02", "57P03", "53300", "08000", "08001", "08003", "08004", "08006", "28P01", "28000", "3D000");

    private final String sqlState;
    private final boolean connectionProblem;

    public DbException(String message, String sqlState, boolean connectionProblem, Throwable cause) {
        super(message, cause);
        this.sqlState = sqlState;
        this.connectionProblem = connectionProblem;
    }

    public static DbException from(SQLException e) {
        String state = e.getSQLState();
        boolean connection = state != null && (CONNECTION_STATES.contains(state) || state.startsWith("08"));
        return new DbException(e.getMessage(), state, connection, e);
    }

    public static DbException connection(SQLException e) {
        return new DbException(e.getMessage(), e.getSQLState(), true, e);
    }

    public String sqlState() {
        return sqlState;
    }

    public boolean connectionProblem() {
        return connectionProblem;
    }

    public String describe() {
        if ("3D000".equals(sqlState)) {
            return "The database in DATABASE_URL does not exist. Create it first with backend/sql/create_database.sql.";
        }
        if ("28P01".equals(sqlState) || "28000".equals(sqlState)) {
            return "PostgreSQL rejected the username or password in DATABASE_URL.";
        }
        String message = getMessage() == null ? "" : getMessage();
        if (message.contains("Connection to") && message.contains("refused") || message.contains("ConnectException")) {
            return "Could not reach PostgreSQL. Check that the PostgreSQL service is running and that the host and port in DATABASE_URL are correct.";
        }
        if (message.contains("UnknownHostException")) {
            return "The database host in DATABASE_URL could not be found.";
        }
        return message.isEmpty() ? "Unknown database error" : message;
    }
}
