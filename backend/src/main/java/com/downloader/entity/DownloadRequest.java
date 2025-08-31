package com.downloader.entity;


import com.downloader.config.AppConstants;
import java.util.Objects;

public record DownloadRequest(
    String url,
    String filename,
    String outputPath
) {
    public DownloadRequest {
        url = Objects.requireNonNull(url, "url must not be null");
        outputPath = Objects.requireNonNullElse(outputPath, AppConstants.DOWNLOAD_PATH);
    }
}
