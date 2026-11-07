package com.melodyvault.controller;

import com.melodyvault.dto.SongLyricsDto;
import com.melodyvault.service.LyricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lyrics")
@Tag(name = "Lyrics & Synchronized Karaoke", description = "Endpoints for fetching and saving synchronized lyrics")
public class LyricsController {

    private final LyricsService lyricsService;

    public LyricsController(LyricsService lyricsService) {
        this.lyricsService = lyricsService;
    }

    @GetMapping("/{songId}")
    @Operation(summary = "Get synchronized or plain lyrics by songId with fallback online discovery")
    public ResponseEntity<SongLyricsDto> getLyrics(
            @PathVariable String songId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) Integer duration) {

        return lyricsService.getLyrics(songId, title, artist, duration)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/{songId}")
    @Operation(summary = "Save or update lyrics for a song (manual editing or imported LRC/TXT)")
    public ResponseEntity<SongLyricsDto> saveLyrics(
            @PathVariable String songId,
            @RequestBody Map<String, String> payload) {

        String title = payload.getOrDefault("title", "Unknown Title");
        String artist = payload.getOrDefault("artist", "Unknown Artist");
        String plainLyrics = payload.getOrDefault("plainLyrics", "");
        String syncedLyrics = payload.getOrDefault("syncedLyrics", "");
        String source = payload.getOrDefault("source", "MANUAL_EDIT");

        SongLyricsDto saved = lyricsService.saveOrUpdateLyrics(songId, title, artist, plainLyrics, syncedLyrics, source);
        return ResponseEntity.ok(saved);
    }
}

