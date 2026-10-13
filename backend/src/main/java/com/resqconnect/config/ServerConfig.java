package com.resqconnect.config;

import com.resqconnect.api.Api;
import com.resqconnect.api.Passwords;
import com.resqconnect.db.DatabaseUrl;
import com.resqconnect.db.Db;
import com.resqconnect.db.JdbcDb;
import com.resqconnect.http.App;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import javax.sql.DataSource;

@Configuration(proxyBeanMethods = false)
public class ServerConfig {

    @Bean(destroyMethod = "close")
    public HikariDataSource dataSource(Settings settings) {
        DatabaseUrl url = DatabaseUrl.parse(settings.databaseUrl());
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url.jdbcUrl());
        if (url.user() != null) {
            dataSource.setUsername(url.user());
        }
        if (url.password() != null) {
            dataSource.setPassword(url.password());
        }
        dataSource.setMaximumPoolSize(settings.poolMax());
        dataSource.setMinimumIdle(0);
        dataSource.setConnectionTimeout(5000);
        dataSource.setIdleTimeout(30000);
        dataSource.setInitializationFailTimeout(-1);
        dataSource.setPoolName("resqconnect");
        return dataSource;
    }

    @Bean
    public Db db(DataSource dataSource) {
        return new JdbcDb(dataSource);
    }

    @Bean
    public Passwords passwords() {
        return new BcryptPasswords();
    }

    @Bean
    public App app(Settings settings, Db db, Passwords passwords) {
        return Api.create(settings, db, passwords);
    }

    @Bean
    public FilterRegistrationBean<AppFilter> appFilter(App app) {
        FilterRegistrationBean<AppFilter> registration = new FilterRegistrationBean<>(new AppFilter(app));
        registration.addUrlPatterns("/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.setName("resqconnectApp");
        return registration;
    }

    @Bean
    public StartupLogger startupLogger(Db db) {
        return new StartupLogger(db);
    }
}
