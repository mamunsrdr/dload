package com.downloader.task.direct;

import com.downloader.entity.*;
import com.downloader.service.DownloadSink;
import com.downloader.task.DownloadTask;
import java.io.*;
import java.nio.file.*;
import java.util.concurrent.atomic.AtomicLong;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import okio.Okio;
import org.apache.commons.io.FileUtils;

import static com.downloader.config.AppConstants.FILEPART_FORMAT;

@Slf4j
public class DirectDownloadTask implements DownloadTask {

    private static final int BUFFER_SIZE = 512 * 1024; //512KB
    private static final int MAX_SPEED_SAMPLES = 10;
    private static final long PROGRESS_UPDATE_INTERVAL_MS = 400;
    private static final long SPEED_CALCULATION_INTERVAL_MS = 1000;

    private volatile boolean paused = false;

    private final DownloadInfo downloadInfo;
    private final OkHttpClient httpClient;
    private final DownloadSink downloadSink;

    private final AtomicLong lastProgressUpdateTime;
    private final AtomicLong lastSpeedCalculationTime;
    private final AtomicLong lastDownloadedSize;
    private final AtomicLong speedSum;
    private final AtomicLong speedSampleCount;

    @Builder
    public DirectDownloadTask(DownloadInfo downloadInfo, OkHttpClient httpClient, DownloadSink downloadSink) {
        this.downloadInfo = downloadInfo;
        this.httpClient = httpClient;
        this.downloadSink = downloadSink;
        this.lastProgressUpdateTime = new AtomicLong(System.currentTimeMillis());
        this.lastSpeedCalculationTime = new AtomicLong(System.currentTimeMillis());
        this.lastDownloadedSize = new AtomicLong(downloadInfo.getDownloadedSize());
        this.speedSum = new AtomicLong(0);
        this.speedSampleCount = new AtomicLong(0);
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
            FileUtils.touch(downloadFile);
            var finalOutputFile = new File(downloadInfo.getFilePath());
            long existingFileSize = downloadFile.length();
            downloadInfo.setDownloadedSize(existingFileSize);
            lastDownloadedSize.set(downloadInfo.getDownloadedSize());

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
                    var buffer = new byte[BUFFER_SIZE];
                    int bytesRead;
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

                        updateProgress();
                        updateDownloadSpeedAndTimeRemaining();
                        emitProgressWithInterval();
                    }
                    sink.flush();
                    Files.move(downloadFile.toPath(), finalOutputFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    downloadInfo.setStatus(DownloadStatus.COMPLETED);
                    emitNextVersion();
                    log.info("Download completed: {}", downloadInfo.getFilename());
                }
            }

        } catch (Exception e) {
            log.error(e.getMessage());
            if (!(e instanceof InterruptedIOException)) {
                setErrorDetails(e);
                emitNextVersion();
            }
            deleteFileIfExists();
        }
    }

    private void updateProgress() {
        if (downloadInfo.getTotalSize() == 0) {
            downloadInfo.setProgress(0);
        } else {
            var percent = (double) downloadInfo.getDownloadedSize() / downloadInfo.getTotalSize() * 100;
            downloadInfo.setProgress(Math.round(percent * 10) / 10.0);
        }
    }

    private void emitProgressWithInterval() {
        var currentTime = System.currentTimeMillis();
        if (currentTime - lastProgressUpdateTime.get() >= PROGRESS_UPDATE_INTERVAL_MS) {
            emitNextVersion();
            lastProgressUpdateTime.set(currentTime);
        }
    }

    private void updateDownloadSpeedAndTimeRemaining() {
        var currentTime = System.currentTimeMillis();
        var timeDelta = currentTime - lastSpeedCalculationTime.get();
        if (timeDelta >= SPEED_CALCULATION_INTERVAL_MS) {
            var currentSize = downloadInfo.getDownloadedSize();
            var lastSize = lastDownloadedSize.get();

            //calculate speed
            long bytesDelta = currentSize - lastSize;
            long speedBytesPerSecond = (bytesDelta * 1000) / timeDelta;
            //calculate average speed and update
            updateSpeedWithRollingAverage(speedBytesPerSecond);

            // Calculate estimated time remaining
            updateEstimatedTime(downloadInfo.getSpeed(), currentSize);

            lastDownloadedSize.set(currentSize);
            lastSpeedCalculationTime.set(currentTime);
        }
    }

    private void updateEstimatedTime(long speedBytesPerSecond, long currentSize) {
        if (downloadInfo.getTotalSize() > 0 && speedBytesPerSecond > 0) {
            long remainingBytes = downloadInfo.getTotalSize() - currentSize;
            long timeRemainingSeconds = remainingBytes / speedBytesPerSecond;
            downloadInfo.setTimeRemaining(timeRemainingSeconds);
        }
    }

    private void updateSpeedWithRollingAverage(long currentSpeedBytesPerSecond) {
        if (speedSampleCount.get() < MAX_SPEED_SAMPLES) {
            long averageSpeed = speedSum.addAndGet(currentSpeedBytesPerSecond) / speedSampleCount.incrementAndGet();
            downloadInfo.setSpeed(averageSpeed);
        } else {
            long currentSum = speedSum.get();
            long oldAverage = currentSum / MAX_SPEED_SAMPLES;
            long newSum = currentSum - oldAverage + currentSpeedBytesPerSecond;
            speedSum.set(newSum);

            long rollingAverage = newSum / MAX_SPEED_SAMPLES;
            downloadInfo.setSpeed(rollingAverage);
        }
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
        return new File(FILEPART_FORMAT.formatted(downloadInfo.getFilePath()));
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
        var partfile = buildPartFile();
        try {
            if (FileUtils.deleteQuietly(partfile)) {
                log.info("Deleted file: {}", partfile.toPath());
            }
        } catch (Exception e) {
            log.error("Failed to delete file: {}", partfile.toPath(), e);
        }
    }
}
