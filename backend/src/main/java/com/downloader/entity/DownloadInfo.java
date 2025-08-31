package com.downloader.entity;

import lombok.*;

@Data
@Builder(toBuilder = true)
public class DownloadInfo {
    private String id;
    private String url;
    private String filename;
    private String filePath;
    private String outputPath;
    private DownloadStatus status;
    private long speed;
    private double progress;
    private long totalSize;
    private long downloadedSize;
    private long timeRemaining;
    private String error;
    long version;

    public void updateProgress() {
        if (totalSize == 0) {
            progress = 0;
        } else {
            var percent = (double) downloadedSize / totalSize * 100;
            progress = Math.round(percent * 10) / 10.0;
        }
    }
}
