package com.downloader.entity;

import com.fasterxml.jackson.annotation.*;
import lombok.*;

@Data
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DownloadInfo {
    private String id;
    @JsonIgnore
    private String url;
    private String filename;
    @JsonIgnore
    private String filePath;
    @JsonIgnore
    private String outputPath;
    private DownloadStatus status;
    private long speed;
    private double progress;
    private long totalSize;
    private long downloadedSize;
    private long timeRemaining;
    private String error;
    @JsonIgnore
    long version;
}
