package com.downloader.controller;

import com.downloader.entity.*;
import com.downloader.service.*;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/downloads")
@CrossOrigin(origins = "*")
public class DownloadController {

    private final DownloadService downloadService;
    private final NetworkInfoService networkInfoService;

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

    @GetMapping("/network")
    public NetworkInfo getNetworkInfo() {
        return networkInfoService.getNetworkInfo();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<ServerSentEvent<DownloadInfo>>> streamAll() {
        var progress = downloadService
            .flux()
            .map(dd -> ServerSentEvent
                .builder(dd)
                .id(dd.getId() + ":" + dd.getVersion())
                .event("progress")
                .retry(Duration.ofSeconds(2))
                .build()
            );
        var stream = Flux.merge(progress, heartbeat());
        return ResponseEntity
            .ok()
            .header("Cache-Control", "no-cache")
            .header("Connection", "keep-alive")
            .header("X-Accel-Buffering", "no")
            .contentType(MediaType.TEXT_EVENT_STREAM)
            .body(stream);
    }


    private Flux<ServerSentEvent<DownloadInfo>> heartbeat() {
        return Flux
            .interval(Duration.ZERO, Duration.ofSeconds(25))
            .map(i -> ServerSentEvent.<DownloadInfo>builder().comment("heartbeat").build());
    }
}
