package com.downloader.service;

import com.downloader.entity.DownloadInfo;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.reactivestreams.Subscription;
import org.springframework.stereotype.Component;
import reactor.core.publisher.*;

@Slf4j
@Component
public class DownloadSink {

    private final Map<String, Subscription> activeConsumers = new ConcurrentHashMap<>();
    private static final Sinks.Many<DownloadInfo> sink = Sinks
        .many()
        .multicast()
        .directAllOrNothing();

    public void publish(DownloadInfo evt) {
        var result = sink.tryEmitNext(evt);

        if (result.isFailure()) {
            log.warn("Failed to emit event for download {}: {}", evt.getId(), result);

            // Retry once if it was a transient failure
            if (result == Sinks.EmitResult.FAIL_NON_SERIALIZED) {
                sink.emitNext(evt, Sinks.EmitFailureHandler.FAIL_FAST);
            }
        }
    }

    public Flux<DownloadInfo> flux() {
        var clientId = UUID.randomUUID().toString().substring(0, 8);
        return sink
            .asFlux()
            .onErrorContinue((error, item) -> {
                log.debug("Error processing event for client {}, continuing stream: {}", clientId, error.getMessage());
            })
            .doOnSubscribe(subscription -> {
                activeConsumers.put(clientId, subscription);
                log.debug("New SSE consumer connected: {} (total active: {})", clientId, activeConsumers.size());
            })
            .doOnNext(event -> {
                log.trace("Sending event to consumers {}: download={}", clientId, event.getId());
            })
            .doOnCancel(() -> {
                activeConsumers.remove(clientId);
                log.debug("SSE consumer disconnected: {} (remaining: {})", clientId, activeConsumers.size());
            })
            .doOnTerminate(() -> {
                activeConsumers.remove(clientId);
                log.debug("SSE consumer terminated: {} (remaining: {})", clientId, activeConsumers.size());
            })
            .doOnError(error -> {
                activeConsumers.remove(clientId);
                log.error("SSE consumer error: {} (remaining: {}): {}", clientId, activeConsumers.size(), error.getMessage());
            });
    }
}
