package com.downloader.service;

import java.io.IOException;
import java.net.*;
import java.nio.charset.*;
import java.util.*;
import java.util.regex.Pattern;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
@RequiredArgsConstructor
public class FilenameResolver {

    private static final Pattern FILENAME_STAR = Pattern.compile("(?i)filename\\*=(?:([^']+)'[^']*')?([^;]+)");
    private static final Pattern FILENAME_QUOTED = Pattern.compile("(?i)filename=\"?([^\";]+)\"?");

    private final OkHttpClient okHttpClient;

    public String resolveFilename(String url, String overrideFilename) {
        return Optional
            .ofNullable(overrideFilename)
            .or(() -> resolveFromRequest(url))
            .or(() -> parseFromUrl(url))
            .map(this::sanitizeFilename)
            .orElse("file-%s.html".formatted(UUID.randomUUID().toString()));
    }

    private Optional<String> resolveFromRequest(String url) {
        var request = new Request.Builder().url(url).get().build();
        try {
            try (var response = okHttpClient.newCall(request).execute()) {
                var filename = extractFileNameFromHeaders(response.headers("Content-Disposition"));
                return Optional.ofNullable(filename);
            }
        } catch (IOException e) {
            log.error(e.getMessage());
            return Optional.empty();
        }
    }

    private String extractFileNameFromHeaders(List<String> filenameHeaders) {
        for (var header : filenameHeaders) {
            String filename = Optional
                .ofNullable(parseEncodedFilename(header))
                .or(() -> Optional.ofNullable(parseQuotedFilename(header)))
                .orElse(null);
            if (filename != null) {
                return filename;
            }
        }
        return null;
    }

    private Optional<String> parseFromUrl(String url) {
        var path = UriComponentsBuilder.fromUriString(url).build().getPath();
        return Optional.ofNullable(StringUtils.trimToNull(FilenameUtils.getName(path)));
    }

    //Content-Disposition: attachment; filename*=UTF-8''%E4%BE%8B%E5%AD%90.txt
    private String parseEncodedFilename(String header) {
        var matcher = FILENAME_STAR.matcher(header);
        if (matcher.find()) {
            var charset = Optional
                .ofNullable(matcher.group(1))
                .map(Charset::forName)
                .orElse(StandardCharsets.UTF_8);

            var filenameOpt = Optional
                .ofNullable(matcher.group(2))
                .map(name -> URLDecoder.decode(name, charset));

            if (filenameOpt.isPresent()) {
                return filenameOpt.get();
            }
        }
        return null;
    }

    //Content-Disposition: attachment; filename="example.txt"
    private String parseQuotedFilename(String header) {
        var mQuoted = FILENAME_QUOTED.matcher(header);
        if (mQuoted.find()) {
            var name = mQuoted.group(1);
            if (name != null && !name.isBlank()) {
                return name;
            }
        }
        return null;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        return filename
            .replaceAll("[/\\x00<>:\"\\\\|?*]", "_")
            .replaceAll("^\\.", "_")
            .trim();
    }
}
