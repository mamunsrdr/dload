package com.downloader.service;

import com.downloader.entity.*;
import org.springframework.stereotype.*;
import reactor.core.publisher.*;

@Component
public class DownloadSink {

    private static final Sinks.Many<DownloadInfo> sink = Sinks.many().multicast().onBackpressureBuffer();

    public void publish(DownloadInfo evt) {
        sink.tryEmitNext(evt);
    }

    public Flux<DownloadInfo> flux() {
        return sink.asFlux();
    }
}
