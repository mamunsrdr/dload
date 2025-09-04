package com.downloader.service;

import com.downloader.entity.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.*;
import reactor.core.publisher.*;

@Slf4j
@Component
public class DownloadSink {

    private static final Sinks.Many<DownloadInfo> sink = Sinks
        .many()
        .multicast()
        .onBackpressureBuffer();

    public void publish(DownloadInfo evt) {
        var result = sink.tryEmitNext(evt);

        if (result.isFailure()) {
            log.warn("Failed to emit event for download {}: {}", evt.getId(), result);

            // Retry once if it was a transient failure
            if (result == Sinks.EmitResult.FAIL_NON_SERIALIZED) {
                sink.emitNext(evt, Sinks.EmitFailureHandler.FAIL_FAST);
            }
        } else {
            log.debug("Successfully emitted event for download {}: status={}, progress={}",
                evt.getId(), evt.getStatus(), evt.getProgress());
        }
    }

    public Flux<DownloadInfo> flux() {
        return sink.asFlux();
    }
}
