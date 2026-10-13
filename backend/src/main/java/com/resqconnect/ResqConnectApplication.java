package com.resqconnect;

import com.resqconnect.config.Settings;
import com.resqconnect.util.Env;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
public class ResqConnectApplication {

    public static void main(String[] args) {
        Settings settings;
        try {
            settings = Settings.from(Env.load());
        } catch (IllegalStateException | IllegalArgumentException e) {
            System.err.println(e.getMessage());
            System.exit(1);
            return;
        }
        SpringApplication application = new SpringApplication(ResqConnectApplication.class);
        Map<String, Object> defaults = new HashMap<>();
        defaults.put("server.port", settings.port());
        application.setDefaultProperties(defaults);
        application.addInitializers((ConfigurableApplicationContext context) ->
                context.getBeanFactory().registerSingleton("settings", settings));
        application.run(args);
    }
}
