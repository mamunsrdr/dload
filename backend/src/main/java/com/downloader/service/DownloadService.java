package com.downloader.service;

import com.downloader.entity.*;
import com.downloader.task.DownloadTask;
import com.downloader.task.direct.DirectDownloadTask;
import java.io.File;
import java.util.*;
import java.util.concurrent.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Slf4j
@Service
@RequiredArgsConstructor
public class DownloadService {

    private static final Map<String, DownloadInfo> downloads = new ConcurrentHashMap<>();
    private static final Map<String, DownloadTask> tasks = new ConcurrentHashMap<>();
    private static final Map<String, Future<?>> executions = new ConcurrentHashMap<>();

    private final ExecutorService executor;
    private final DownloadSink downloadSink;
    private final OkHttpClient httpClient;
    private final FilenameResolver filenameResolver;

    public Flux<DownloadInfo> flux() {
        return downloadSink.flux();
    }

    public List<DownloadInfo> list() {
        return downloads.values().stream().toList();
    }

    public DownloadInfo add(DownloadRequest request) {
        var filename = filenameResolver.resolveFilename(request.url(), request.filename());
        var downloadInfo = DownloadInfo
            .builder()
            .id(UUID.randomUUID().toString())
            .url(request.url())
            .filename(filename)
            .outputPath(request.outputPath())
            .filePath(request.outputPath() + File.separator + filename)
            .version(0)
            .status(DownloadStatus.QUEUED)
            .build();

        downloads.put(downloadInfo.getId(), downloadInfo);

        startDownloadTask(downloadInfo);

        return downloadInfo;
    }

    public void pause(String id) {
        Optional
            .ofNullable(tasks.get(id))
            .ifPresent(task -> {
                log.info("Paused download task: {}", id);
                task.pause();
                removeDownloadTask(id);
            });
    }

    public void resume(String id) {
        Optional
            .ofNullable(downloads.get(id))
            .filter(info -> info.getStatus() == DownloadStatus.PAUSED)
            .ifPresent(info -> {
                log.info("Resuming download task: {}", id);
                startDownloadTask(info);
            });
    }

    public void cancel(String id) {
        Optional
            .ofNullable(executions.get(id))
            .ifPresent(exec -> {
                log.info("Canceling download task: {}", id);
                exec.cancel(true);
                downloads.remove(id);
                var task = removeDownloadTask(id);
                task.cleanup();
            });
    }

    private void startDownloadTask(DownloadInfo downloadInfo) {
        var downloadTask = buildDownloadTask(downloadInfo);
        tasks.put(downloadInfo.getId(), downloadTask);
        executions.put(downloadInfo.getId(), executor.submit(downloadTask));
    }

    private DownloadTask removeDownloadTask(String id) {
        executions.remove(id);
        return tasks.remove(id);
    }

    private DownloadTask buildDownloadTask(DownloadInfo downloadInfo) {
        return DirectDownloadTask
            .builder()
            .downloadInfo(downloadInfo)
            .downloadSink(downloadSink)
            .httpClient(httpClient)
            .build();
    }
}
