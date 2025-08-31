package com.downloader.task.direct;

import com.downloader.entity.*;
import com.downloader.service.DownloadSink;
import com.downloader.task.DownloadTask;
import java.io.*;
import java.nio.file.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import okio.*;
import org.apache.commons.io.FileUtils;

import static com.downloader.config.AppConstants.FILEPART_FORMAT;

@Slf4j
public class DirectDownloadTask implements DownloadTask {

    private final DownloadInfo downloadInfo;
    private final OkHttpClient httpClient;
    private final DownloadSink downloadSink;
    private volatile boolean paused = false;

    @Builder
    public DirectDownloadTask(DownloadInfo downloadInfo, OkHttpClient httpClient, DownloadSink downloadSink) {
        this.downloadInfo = downloadInfo;
        this.httpClient = httpClient;
        this.downloadSink = downloadSink;
    }

    @Override
    public void pause() {
        paused = true;
        downloadInfo.setStatus(DownloadStatus.PAUSED);
        emitNextVersion();
    }

    @Override
    public void cleanup() {
        deleteFileIfExists();
    }

    @Override
    public void run() {
        downloadInfo.setStatus(DownloadStatus.DOWNLOADING);
        try {
            log.info("Download started: {}", downloadInfo.getFilename());
            var downloadFile = buildPartFile();
            long existingFileSize = downloadFile.length();
            downloadInfo.setDownloadedSize(existingFileSize);

            try (var response = httpClient.newCall(buildGetRequest(existingFileSize)).execute()) {
                if (!response.isSuccessful()) {
                    throw new IOException("Server returned HTTP response code: %s".formatted(response.code()));
                }

                var body = response.body();
                if (body == null || body.contentLength() <= 0) {
                    throw new IOException("No content is returned from server: %s".formatted(downloadInfo.getFilename()));
                }
                long contentLength = body.contentLength();
                downloadInfo.setTotalSize(existingFileSize + contentLength);
                emitNextVersion();

                try (var sink = Okio.buffer(Okio.appendingSink(downloadFile)); var inputStream = body.byteStream()) {
                    var buffer = new byte[8192];
                    int bytesRead;
                    var lastEmitTime = System.currentTimeMillis();
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        if (paused) {
                            sink.flush();
                            log.info("Download paused: {}", downloadInfo.getFilename());
                            return;
                        }
                        if (Thread.currentThread().isInterrupted()) {
                            sink.flush();
                            log.info("Download cancelled: {}", downloadInfo.getFilename());
                            return;
                        }
                        sink.write(buffer, 0, bytesRead);

                        downloadInfo.setDownloadedSize(downloadInfo.getDownloadedSize() + bytesRead);
                        downloadInfo.updateProgress();

                        lastEmitTime = emitProgressWithInterval(lastEmitTime);
                    }
                    sink.flush();
                    FileUtils.moveFile(downloadFile, new File(downloadInfo.getFilePath()), StandardCopyOption.REPLACE_EXISTING);
                    downloadInfo.setStatus(DownloadStatus.COMPLETED);
                    emitNextVersion();
                    log.info("Download completed: {}", downloadInfo.getFilename());
                }
            }

        } catch (Exception e) {
            log.error(e.getMessage());
            setErrorDetails(e);
            emitNextVersion();
            deleteFileIfExists();
        }
    }

    private long emitProgressWithInterval(long lastEmitTime) {
        var now = System.currentTimeMillis();
        if (now - lastEmitTime >= 500) {
            emitNextVersion();
            return now;
        }
        return lastEmitTime;
    }

    private Request buildGetRequest(long existingFileSize) {
        var builder = new Request.Builder()
            .get()
            .url(downloadInfo.getUrl())
            .addHeader("User-Agent", "Mozilla/5.0");

        if (existingFileSize > 0) {
            builder.addHeader("Range", "bytes=%d-".formatted(existingFileSize));
        }

        return builder.build();
    }

    @SneakyThrows
    private File buildPartFile() {
        var file = new File(FILEPART_FORMAT.formatted(downloadInfo.getFilePath()));
        FileUtils.touch(file);
        return file;
    }

    private void setErrorDetails(Exception e) {
        downloadInfo.setStatus(DownloadStatus.FAILED);
        downloadInfo.setSpeed(0);
        downloadInfo.setProgress(0);
        downloadInfo.setTimeRemaining(0);
        downloadInfo.setError(e.getMessage());
    }

    private void emitNextVersion() {
        downloadInfo.setVersion(downloadInfo.getVersion() + 1);
        downloadSink.publish(snapshot());
    }

    private DownloadInfo snapshot() {
        return downloadInfo.toBuilder().build();
    }

    private void deleteFileIfExists() {
        var filePath = buildPartFile().toPath();
        try {
            if (Files.deleteIfExists(filePath)) {
                log.info("Deleted file: {}", filePath);
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
        }
    }
}
