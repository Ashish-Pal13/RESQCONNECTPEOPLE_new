package com.resqconnect.db;

import javax.sql.DataSource;
import java.sql.Array;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class JdbcDb implements Db {
    private static final DateTimeFormatter ISO_MILLIS = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

    @FunctionalInterface
    public interface ConnectionSource {
        Connection get() throws SQLException;
    }

    private final ConnectionSource source;

    public JdbcDb(DataSource dataSource) {
        this(dataSource::getConnection);
    }

    public JdbcDb(ConnectionSource source) {
        this.source = source;
    }

    private Connection open() {
        try {
            return source.get();
        } catch (SQLException e) {
            throw DbException.connection(e);
        }
    }

    @Override
    public QueryResult run(String sql, List<?> params) {
        try (Connection connection = open()) {
            return runOn(connection, sql, params);
        } catch (SQLException e) {
            throw DbException.from(e);
        }
    }

    @Override
    public void execute(String script) {
        try (Connection connection = open()) {
            executeScript(connection, script);
        } catch (SQLException e) {
            throw DbException.from(e);
        }
    }

    @Override
    public <T> T transaction(Work<T> work) {
        try (Connection connection = open()) {
            return new Bound(connection).transaction(work);
        } catch (SQLException e) {
            throw DbException.from(e);
        }
    }

    @Override
    public <T> T session(Work<T> work) {
        try (Connection connection = open()) {
            return new Bound(connection).session(work);
        } catch (SQLException e) {
            throw DbException.from(e);
        }
    }

    static final class Bound implements Db {
        private final Connection connection;

        Bound(Connection connection) {
            this.connection = connection;
        }

        @Override
        public QueryResult run(String sql, List<?> params) {
            try {
                return runOn(connection, sql, params);
            } catch (SQLException e) {
                throw DbException.from(e);
            }
        }

        @Override
        public void execute(String script) {
            try {
                executeScript(connection, script);
            } catch (SQLException e) {
                throw DbException.from(e);
            }
        }

        @Override
        public <T> T transaction(Work<T> work) {
            try {
                boolean previous = connection.getAutoCommit();
                connection.setAutoCommit(false);
                try {
                    T result = work.run(this);
                    connection.commit();
                    return result;
                } catch (Throwable failure) {
                    try {
                        connection.rollback();
                    } catch (SQLException rollbackError) {
                        System.err.println("Rollback failed: " + rollbackError.getMessage());
                    }
                    throw rethrow(failure);
                } finally {
                    try {
                        connection.setAutoCommit(previous);
                    } catch (SQLException ignored) {
                        System.err.println("Could not restore auto-commit: " + ignored.getMessage());
                    }
                }
            } catch (SQLException e) {
                throw DbException.from(e);
            }
        }

        @Override
        public <T> T session(Work<T> work) {
            try {
                return work.run(this);
            } catch (Throwable failure) {
                throw rethrow(failure);
            }
        }
    }

    static RuntimeException rethrow(Throwable failure) {
        if (failure instanceof RuntimeException runtime) {
            return runtime;
        }
        if (failure instanceof Error error) {
            throw error;
        }
        if (failure instanceof SQLException sql) {
            return DbException.from(sql);
        }
        return new RuntimeException(failure);
    }

    private static void executeScript(Connection connection, String script) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute(script);
        }
    }

    static QueryResult runOn(Connection connection, String sql, List<?> params) throws SQLException {
        SqlText.Prepared prepared = SqlText.toJdbc(sql, params);
        try (PreparedStatement statement = connection.prepareStatement(prepared.sql())) {
            List<Object> values = prepared.params();
            for (int i = 0; i < values.size(); i++) {
                bind(connection, statement, i + 1, values.get(i));
            }
            boolean hasRows = statement.execute();
            if (hasRows) {
                try (ResultSet resultSet = statement.getResultSet()) {
                    List<Map<String, Object>> rows = mapRows(resultSet);
                    return new QueryResult(rows, rows.size());
                }
            }
            return new QueryResult(List.of(), Math.max(0, statement.getUpdateCount()));
        }
    }

    static void bind(Connection connection, PreparedStatement statement, int index, Object value) throws SQLException {
        if (value == null) {
            statement.setNull(index, Types.NULL);
        } else if (value instanceof String s) {
            statement.setString(index, s);
        } else if (value instanceof Long l) {
            statement.setLong(index, l);
        } else if (value instanceof Integer i) {
            statement.setInt(index, i);
        } else if (value instanceof Boolean b) {
            statement.setBoolean(index, b);
        } else if (value instanceof Double d) {
            statement.setDouble(index, d);
        } else if (value instanceof List<?> list) {
            statement.setArray(index, toArray(connection, list));
        } else {
            statement.setString(index, value.toString());
        }
    }

    private static Array toArray(Connection connection, List<?> list) throws SQLException {
        boolean allNumbers = !list.isEmpty();
        for (Object item : list) {
            if (!(item instanceof Long) && !(item instanceof Integer)) {
                allNumbers = false;
                break;
            }
        }
        if (allNumbers) {
            Long[] numbers = new Long[list.size()];
            for (int i = 0; i < list.size(); i++) {
                numbers[i] = ((Number) list.get(i)).longValue();
            }
            return connection.createArrayOf("int8", numbers);
        }
        String[] texts = new String[list.size()];
        for (int i = 0; i < list.size(); i++) {
            texts[i] = list.get(i) == null ? null : String.valueOf(list.get(i));
        }
        return connection.createArrayOf("text", texts);
    }

    static List<Map<String, Object>> mapRows(ResultSet resultSet) throws SQLException {
        ResultSetMetaData meta = resultSet.getMetaData();
        int columns = meta.getColumnCount();
        int[] types = new int[columns + 1];
        String[] labels = new String[columns + 1];
        for (int i = 1; i <= columns; i++) {
            types[i] = meta.getColumnType(i);
            labels[i] = meta.getColumnLabel(i);
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        while (resultSet.next()) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 1; i <= columns; i++) {
                row.put(labels[i], readValue(resultSet, i, types[i]));
            }
            rows.add(row);
        }
        return rows;
    }

    private static Object readValue(ResultSet resultSet, int index, int type) throws SQLException {
        switch (type) {
            case Types.INTEGER, Types.SMALLINT, Types.TINYINT -> {
                int value = resultSet.getInt(index);
                return resultSet.wasNull() ? null : value;
            }
            case Types.BIT, Types.BOOLEAN -> {
                boolean value = resultSet.getBoolean(index);
                return resultSet.wasNull() ? null : value;
            }
            case Types.REAL, Types.FLOAT, Types.DOUBLE -> {
                double value = resultSet.getDouble(index);
                return resultSet.wasNull() ? null : value;
            }
            case Types.TIMESTAMP, Types.TIMESTAMP_WITH_TIMEZONE -> {
                Object raw = resultSet.getObject(index);
                if (raw == null) {
                    return null;
                }
                return formatTimestamp(resultSet, index, raw);
            }
            default -> {
                return resultSet.getString(index);
            }
        }
    }

    private static String formatTimestamp(ResultSet resultSet, int index, Object raw) throws SQLException {
        if (raw instanceof OffsetDateTime odt) {
            return ISO_MILLIS.format(odt.toInstant());
        }
        if (raw instanceof java.sql.Timestamp timestamp) {
            return ISO_MILLIS.format(timestamp.toInstant());
        }
        if (raw instanceof LocalDateTime local) {
            return ISO_MILLIS.format(local.toInstant(ZoneOffset.UTC));
        }
        if (raw instanceof Instant instant) {
            return ISO_MILLIS.format(instant);
        }
        OffsetDateTime odt = resultSet.getObject(index, OffsetDateTime.class);
        return odt == null ? null : ISO_MILLIS.format(odt.toInstant());
    }

    public static String isoMillis(Instant instant) {
        return ISO_MILLIS.format(instant);
    }
}
