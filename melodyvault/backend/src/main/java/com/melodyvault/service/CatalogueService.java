package com.melodyvault.service;

import com.melodyvault.dto.CatalogueTrackDto;
import com.melodyvault.exception.ResourceNotFoundException;
import com.melodyvault.model.CatalogueTrack;
import com.melodyvault.repository.CatalogueTrackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CatalogueService {

    private final CatalogueTrackRepository trackRepository;

    public CatalogueService(CatalogueTrackRepository trackRepository) {
        this.trackRepository = trackRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalogueTrackDto> getAllTracks() {
        return trackRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CatalogueTrackDto> searchTracks(String query, String genre, String language) {
        List<CatalogueTrack> tracks;

        if (query != null && !query.trim().isEmpty()) {
            tracks = trackRepository.searchTracks(query.trim());
        } else if (genre != null && !genre.equalsIgnoreCase("all")) {
            tracks = trackRepository.findByGenreIgnoreCase(genre);
        } else if (language != null && !language.equalsIgnoreCase("all")) {
            tracks = trackRepository.findByLanguageIgnoreCase(language);
        } else {
            tracks = trackRepository.findByIsPlayableTrueOrderByPlayCountDesc();
        }

        return tracks.stream()
                .filter(t -> genre == null || genre.equalsIgnoreCase("all") || t.getGenre().equalsIgnoreCase(genre))
                .filter(t -> language == null || language.equalsIgnoreCase("all") || t.getLanguage().equalsIgnoreCase(language))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CatalogueTrackDto getTrackById(String id) {
        return trackRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with id: " + id));
    }

    @Transactional
    public void incrementPlayCount(String id) {
        trackRepository.findById(id).ifPresent(track -> {
            track.setPlayCount(track.getPlayCount() + 1);
            trackRepository.save(track);
        });
    }

    public CatalogueTrackDto toDto(CatalogueTrack entity) {
        CatalogueTrackDto dto = new CatalogueTrackDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setArtist(entity.getArtist());
        dto.setAlbum(entity.getAlbum());
        dto.setGenre(entity.getGenre());
        dto.setLanguage(entity.getLanguage());
        dto.setDuration(entity.getDuration());
        dto.setReleaseYear(entity.getReleaseYear());
        dto.setArtworkUrl(entity.getArtworkUrl());
        dto.setAudioUrl(entity.getAudioUrl());
        dto.setLicenceType(entity.getLicenceType());
        dto.setAttribution(entity.getAttribution());
        dto.setLyrics(entity.getLyrics());
        dto.setPlayable(entity.isPlayable());
        dto.setPlayCount(entity.getPlayCount());
        return dto;
    }
}

