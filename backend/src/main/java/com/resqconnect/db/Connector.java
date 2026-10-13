package com.resqconnect.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public interface Connector {
    interface Session extends Db, AutoCloseable {
        @Override
        void close();
    }

    Session open(DatabaseUrl url);

    static Connector jdbc() {
        return url -> {
            Properties properties = new Properties();
            if (url.user() != null) {
                properties.setProperty("user", url.user());
            }
            if (url.password() != null) {
                properties.setProperty("password", url.password());
            }
            properties.setProperty("connectTimeout", "5");
            Connection connection;
            try {
                connection = DriverManager.getConnection(url.jdbcUrl(), properties);
            } catch (SQLException e) {
                throw DbException.connection(e);
            }
            JdbcDb.Bound bound = new JdbcDb.Bound(connection);
            return new Session() {
                @Override
                public QueryResult run(String sql, java.util.List<?> params) {
                    return bound.run(sql, params);
                }

                @Override
                public void execute(String script) {
                    bound.execute(script);
                }

                @Override
                public <T> T transaction(Work<T> work) {
                    return bound.transaction(work);
                }

                @Override
                public <T> T session(Work<T> work) {
                    return bound.session(work);
                }

                @Override
                public void close() {
                    try {
                        connection.close();
                    } catch (SQLException e) {
                        System.err.println("Could not close the database connection: " + e.getMessage());
                    }
                }
            };
        };
    }
}
