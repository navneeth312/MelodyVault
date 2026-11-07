package com.melodyvault.controller;

import com.melodyvault.service.LocalMusicScannerService;
import com.melodyvault.service.LocalMusicScannerService.DiscoveredTrackDto;
import com.melodyvault.service.LocalMusicScannerService.ExtractedArtwork;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/local-collection")
@Tag(name = "Local Music Collection", description = "Endpoints for scanning and streaming personal audio from C:\\MelodyVault Sample Music")
public class LocalMusicController {

    private static final Logger log = LoggerFactory.getLogger(LocalMusicController.class);
    private final LocalMusicScannerService scannerService;

    public LocalMusicController(LocalMusicScannerService scannerService) {
        this.scannerService = scannerService;
    }

    @RequestMapping(value = "/scan", method = {RequestMethod.GET, RequestMethod.POST})
    @Operation(summary = "Scan configured demo music directory for all local audio files and extract metadata")
    public ResponseEntity<List<DiscoveredTrackDto>> scanCollection() {
        log.info("Scanning local music directory: {}", scannerService.getMusicDirectoryPath());
        List<DiscoveredTrackDto> tracks = scannerService.scanSampleMusicFolder();
        return ResponseEntity.ok(tracks);
    }

    @GetMapping("/status")
    @Operation(summary = "Get the local music scanner status and discovered track count")
    public ResponseEntity<java.util.Map<String, Object>> getScannerStatus() {
        return ResponseEntity.ok(scannerService.getScannerStatus());
    }

    @GetMapping("/artwork/{filename}")
    @Operation(summary = "Serve extracted ID3 APIC album artwork for a local audio file")
    public ResponseEntity<byte[]> getArtwork(@PathVariable String filename) {
        try {
            String decoded = URLDecoder.decode(filename, StandardCharsets.UTF_8);
            ExtractedArtwork artwork = scannerService.extractArtwork(decoded);
            if (artwork == null || artwork.getData() == null || artwork.getData().length == 0) {
                return ResponseEntity.notFound().build();
            }

            MediaType mediaType = MediaType.IMAGE_PNG;
            if (artwork.getMimeType() != null && artwork.getMimeType().toLowerCase().contains("jpeg")) {
                mediaType = MediaType.IMAGE_JPEG;
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(3600, java.util.concurrent.TimeUnit.SECONDS).cachePublic())
                    .body(artwork.getData());
        } catch (Exception e) {
            log.error("Error serving artwork for {}: {}", filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/audio/{filename}")
    @Operation(summary = "Stream local audio file with HTTP Range support for seamless playback")
    public ResponseEntity<Resource> streamAudio(
            @PathVariable String filename,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {
        try {
            String decoded = URLDecoder.decode(filename, StandardCharsets.UTF_8);
            File audioFile = scannerService.getAudioFile(decoded);
            if (audioFile == null || !audioFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(audioFile);
            long fileLength = audioFile.length();
            String lower = decoded.toLowerCase();
            MediaType mediaType = MediaType.parseMediaType("audio/mpeg");
            if (lower.endsWith(".wav")) mediaType = MediaType.parseMediaType("audio/wav");
            else if (lower.endsWith(".flac")) mediaType = MediaType.parseMediaType("audio/flac");
            else if (lower.endsWith(".m4a")) mediaType = MediaType.parseMediaType("audio/mp4");

            if (rangeHeader == null || rangeHeader.isEmpty()) {
                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .contentLength(fileLength)
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .body(resource);
            }

            // Simple range handling
            String[] ranges = rangeHeader.replace("bytes=", "").split("-");
            long start = Long.parseLong(ranges[0]);
            long end = (ranges.length > 1 && !ranges[1].isEmpty()) ? Long.parseLong(ranges[1]) : fileLength - 1;
            if (end >= fileLength) end = fileLength - 1;
            long rangeLength = end - start + 1;

            byte[] buffer = new byte[(int) rangeLength];
            try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(audioFile, "r")) {
                raf.seek(start);
                raf.readFully(buffer);
            }

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileLength)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentLength(rangeLength)
                    .body(new org.springframework.core.io.ByteArrayResource(buffer));

        } catch (Exception e) {
            log.error("Error streaming audio for {}: {}", filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

