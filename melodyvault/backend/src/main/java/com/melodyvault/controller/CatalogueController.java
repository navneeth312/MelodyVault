package com.melodyvault.controller;

import com.melodyvault.dto.CatalogueTrackDto;
import com.melodyvault.service.CatalogueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogue")
@Tag(name = "Music Catalogue", description = "Endpoints for discovering, searching, and playing authorized public catalogue tracks")
public class CatalogueController {

    private final CatalogueService catalogueService;

    public CatalogueController(CatalogueService catalogueService) {
        this.catalogueService = catalogueService;
    }

    @GetMapping("/tracks")
    @Operation(summary = "Get all authorized public catalogue tracks")
    public ResponseEntity<List<CatalogueTrackDto>> getAllTracks() {
        return ResponseEntity.ok(catalogueService.getAllTracks());
    }

    @GetMapping("/search")
    @Operation(summary = "Search catalogue tracks by keyword, genre, or language")
    public ResponseEntity<List<CatalogueTrackDto>> searchTracks(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "all") String genre,
            @RequestParam(required = false, defaultValue = "all") String language) {
        return ResponseEntity.ok(catalogueService.searchTracks(query, genre, language));
    }

    @GetMapping("/tracks/{id}")
    @Operation(summary = "Retrieve specific catalogue track metadata and streaming URL")
    public ResponseEntity<CatalogueTrackDto> getTrackById(@PathVariable String id) {
        return ResponseEntity.ok(catalogueService.getTrackById(id));
    }

    @PostMapping("/tracks/{id}/play")
    @Operation(summary = "Log an authorized playback event for a catalogue track")
    public ResponseEntity<Void> logPlay(@PathVariable String id) {
        catalogueService.incrementPlayCount(id);
        return ResponseEntity.ok().build();
    }
}

