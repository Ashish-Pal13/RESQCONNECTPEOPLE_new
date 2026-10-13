package com.resqconnect.db;

import java.util.Arrays;
import java.util.List;

public interface Db {
    QueryResult run(String sql, List<?> params);

    default QueryResult query(String sql, Object... params) {
        return run(sql, Arrays.asList(params));
    }

    void execute(String script);

    <T> T transaction(Work<T> work);

    <T> T session(Work<T> work);

    @FunctionalInterface
    interface Work<T> {
        T run(Db db) throws Exception;
    }
}
