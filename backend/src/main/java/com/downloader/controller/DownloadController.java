package com.downloader.controller;

import com.downloader.entity.*;
import com.downloader.service.*;
import java.time.Duration;
import java.util.List;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/downloads")
@CrossOrigin(origins = "*")
public class DownloadController {

    private final DownloadService downloadService;

    @GetMapping
    public List<DownloadInfo> list() {
        return downloadService.list();
    }

    @PostMapping
    @SuppressWarnings("JvmTaintAnalysis")
    public DownloadInfo add(@RequestBody DownloadRequest request) {
        return downloadService.add(request);
    }

    @PostMapping("/{id}/pause")
    public void pause(@PathVariable String id) {
        downloadService.pause(id);
    }

    @PostMapping("/{id}/resume")
    public void resume(@PathVariable String id) {
        downloadService.resume(id);
    }

    @DeleteMapping("/{id}")
    public void cancel(@PathVariable String id) {
        downloadService.cancel(id);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<DownloadInfo>> streamAll() {
        return Flux.merge(progress(d -> true), heartbeat());
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<DownloadInfo>> streamOne(@PathVariable String id) {
        return Flux.merge(progress(d -> d.getId().equals(id)), heartbeat());
    }

    private Flux<ServerSentEvent<DownloadInfo>> progress(Predicate<DownloadInfo> filter) {
        return downloadService
            .flux()
            .filter(filter)
            .map(dd -> ServerSentEvent
                .builder(dd)
                .id(dd.getId() + ":" + dd.getVersion())
                .event("progress")
                .retry(Duration.ofSeconds(2))
                .build()
            );
    }

    private Flux<ServerSentEvent<DownloadInfo>> heartbeat() {
        return Flux
            .interval(Duration.ZERO, Duration.ofSeconds(25))
            .map(i -> ServerSentEvent.<DownloadInfo>builder().comment("heartbeat").build());
    }
}
