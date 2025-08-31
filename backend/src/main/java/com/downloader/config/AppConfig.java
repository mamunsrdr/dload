package com.downloader.config;

import java.util.concurrent.*;
import okhttp3.OkHttpClient;
import org.springframework.context.annotation.*;

@Configuration
public class AppConfig {

    @Bean
    public ExecutorService executors() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }

    @Bean
    public OkHttpClient httpClient() {
        return new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build();
    }
}
