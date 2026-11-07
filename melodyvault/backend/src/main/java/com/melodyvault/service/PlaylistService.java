package com.melodyvault.service;

import com.melodyvault.dto.PlaylistDto;
import com.melodyvault.exception.ResourceNotFoundException;
import com.melodyvault.model.Playlist;
import com.melodyvault.repository.PlaylistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;

    public PlaylistService(PlaylistRepository playlistRepository) {
        this.playlistRepository = playlistRepository;
    }

    @Transactional(readOnly = true)
    public List<PlaylistDto> getAllPlaylists() {
        return playlistRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlaylistDto getPlaylistById(String id) {
        return playlistRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + id));
    }

    @Transactional
    public PlaylistDto createPlaylist(PlaylistDto dto) {
        String id = dto.getId() != null && !dto.getId().trim().isEmpty()
                ? dto.getId()
                : "pl-" + UUID.randomUUID().toString().substring(0, 8);

        Playlist entity = new Playlist(
                id,
                dto.getName(),
                dto.getDescription(),
                dto.getCoverGradient(),
                dto.getSongIds()
        );
        Playlist saved = playlistRepository.save(entity);
        return toDto(saved);
    }

    @Transactional
    public PlaylistDto updatePlaylist(String id, PlaylistDto dto) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + id));

        playlist.setName(dto.getName());
        if (dto.getDescription() != null) playlist.setDescription(dto.getDescription());
        if (dto.getCoverGradient() != null) playlist.setCoverGradient(dto.getCoverGradient());
        if (dto.getSongIds() != null) playlist.setSongIds(new ArrayList<>(dto.getSongIds()));
        playlist.setUpdatedAt(LocalDateTime.now());

        return toDto(playlistRepository.save(playlist));
    }

    @Transactional
    public void deletePlaylist(String id) {
        if (!playlistRepository.existsById(id)) {
            throw new ResourceNotFoundException("Playlist not found with id: " + id);
        }
        playlistRepository.deleteById(id);
    }

    @Transactional
    public PlaylistDto addSongToPlaylist(String playlistId, String songId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + playlistId));

        if (!playlist.getSongIds().contains(songId)) {
            playlist.getSongIds().add(songId);
            playlist.setUpdatedAt(LocalDateTime.now());
            playlist = playlistRepository.save(playlist);
        }
        return toDto(playlist);
    }

    @Transactional
    public PlaylistDto removeSongFromPlaylist(String playlistId, String songId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + playlistId));

        playlist.getSongIds().remove(songId);
        playlist.setUpdatedAt(LocalDateTime.now());
        return toDto(playlistRepository.save(playlist));
    }

    private PlaylistDto toDto(Playlist entity) {
        PlaylistDto dto = new PlaylistDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setCoverGradient(entity.getCoverGradient());
        dto.setSongIds(new ArrayList<>(entity.getSongIds()));
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        dto.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
        return dto;
    }
}

