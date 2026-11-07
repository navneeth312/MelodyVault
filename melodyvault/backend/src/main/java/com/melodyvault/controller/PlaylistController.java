package com.melodyvault.controller;

import com.melodyvault.dto.PlaylistDto;
import com.melodyvault.service.PlaylistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
@Tag(name = "Playlists", description = "Endpoints for creating, managing, and curating playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping
    @Operation(summary = "Get all playlists")
    public ResponseEntity<List<PlaylistDto>> getAllPlaylists() {
        return ResponseEntity.ok(playlistService.getAllPlaylists());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a playlist by ID")
    public ResponseEntity<PlaylistDto> getPlaylistById(@PathVariable String id) {
        return ResponseEntity.ok(playlistService.getPlaylistById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new playlist")
    public ResponseEntity<PlaylistDto> createPlaylist(@Valid @RequestBody PlaylistDto dto) {
        PlaylistDto created = playlistService.createPlaylist(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing playlist")
    public ResponseEntity<PlaylistDto> updatePlaylist(@PathVariable String id, @Valid @RequestBody PlaylistDto dto) {
        return ResponseEntity.ok(playlistService.updatePlaylist(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a playlist")
    public ResponseEntity<Void> deletePlaylist(@PathVariable String id) {
        playlistService.deletePlaylist(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/songs/{songId}")
    @Operation(summary = "Add a song to a playlist")
    public ResponseEntity<PlaylistDto> addSongToPlaylist(@PathVariable String id, @PathVariable String songId) {
        return ResponseEntity.ok(playlistService.addSongToPlaylist(id, songId));
    }

    @DeleteMapping("/{id}/songs/{songId}")
    @Operation(summary = "Remove a song from a playlist")
    public ResponseEntity<PlaylistDto> removeSongFromPlaylist(@PathVariable String id, @PathVariable String songId) {
        return ResponseEntity.ok(playlistService.removeSongFromPlaylist(id, songId));
    }
}

