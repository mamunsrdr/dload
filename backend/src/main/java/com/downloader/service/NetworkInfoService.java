package com.downloader.service;

import com.downloader.entity.NetworkInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
public class NetworkInfoService {

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public NetworkInfoService(OkHttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public NetworkInfo getNetworkInfo() {
        Request request = new Request.Builder()
                .url("https://ipinfo.io/json")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new RuntimeException("Failed to fetch network information: " + response.code());
            }

            return Optional
                .ofNullable(response.body())
                .map(this::parseNetworkInfo)
                .orElse(new NetworkInfo("unknown", "unknown", "unknown", "unknown"));
        } catch (IOException e) {
            throw new RuntimeException("Failed to fetch network information", e);
        }
    }

    private NetworkInfo parseNetworkInfo(@NotNull ResponseBody responseBody) {
        try {
            return objectMapper.readValue(responseBody.string(), NetworkInfo.class);
        } catch (IOException e) {
            log.error("Failed to parse network information", e);
            return null;
        }
    }
}
