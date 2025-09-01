package com.downloader.config;

import java.util.Arrays;
import java.util.concurrent.*;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.concurrent.ConcurrentTaskExecutor;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final Environment environment;
    private final ExecutorService executorService;

    @Override
    public void configureAsyncSupport(@NotNull AsyncSupportConfigurer configurer) {
        configurer.setTaskExecutor(new ConcurrentTaskExecutor(executorService));
    }

    @Override
    public void addCorsMappings(@NotNull CorsRegistry registry) {
        Arrays.stream(environment.getActiveProfiles())
              .filter("dev"::equals)
              .findFirst()
              .ifPresent(profile -> addApiCorsMappings(registry));

    }

    private void addApiCorsMappings(CorsRegistry registry) {
        registry
            .addMapping("/api/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "DELETE", "PUT", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("Cache-Control", "Content-Language", "Content-Type", "Expires", "Last-Modified", "Pragma")
            .allowCredentials(false);
    }
}
