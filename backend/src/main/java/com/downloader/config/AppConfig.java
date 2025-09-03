package com.downloader.config;

import java.util.Arrays;
import java.util.concurrent.*;
import okhttp3.*;
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
            .followRedirects(true)
            .followSslRedirects(true)
            .retryOnConnectionFailure(true)
            .connectionPool(new ConnectionPool(10, 5, TimeUnit.MINUTES))
            .protocols(Arrays.asList(Protocol.HTTP_2, Protocol.HTTP_1_1))
            .addNetworkInterceptor(chain -> {
                var request = chain
                    .request()
                    .newBuilder()
                    .header("Connection", "keep-alive")
                    .header("Accept-Encoding", "identity")
                    .build();
                return chain.proceed(request);
            })
            .build();
    }
}
