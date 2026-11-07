package com.melodyvault.service;

import com.melodyvault.dto.CatalogueTrackDto;
import com.melodyvault.service.LocalMusicScannerService.DiscoveredTrackDto;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendationService {

    private final CatalogueService catalogueService;
    private final LocalMusicScannerService localMusicScannerService;

    public static class RecommendationDto {
        private String id;
        private String title;
        private String artist;
        private String album;
        private String genre;
        private String artworkUrl;
        private String recommendationReason;
        private double confidenceScore;

        public RecommendationDto() {}

        public RecommendationDto(String id, String title, String artist, String album, String genre,
                                 String artworkUrl, String recommendationReason, double confidenceScore) {
            this.id = id;
            this.title = title;
            this.artist = artist;
            this.album = album;
            this.genre = genre;
            this.artworkUrl = artworkUrl;
            this.recommendationReason = recommendationReason;
            this.confidenceScore = confidenceScore;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getArtist() { return artist; }
        public void setArtist(String artist) { this.artist = artist; }
        public String getAlbum() { return album; }
        public void setAlbum(String album) { this.album = album; }
        public String getGenre() { return genre; }
        public void setGenre(String genre) { this.genre = genre; }
        public String getArtworkUrl() { return artworkUrl; }
        public void setArtworkUrl(String artworkUrl) { this.artworkUrl = artworkUrl; }
        public String getRecommendationReason() { return recommendationReason; }
        public void setRecommendationReason(String recommendationReason) { this.recommendationReason = recommendationReason; }
        public double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
    }

    public RecommendationService(CatalogueService catalogueService, LocalMusicScannerService localMusicScannerService) {
        this.catalogueService = catalogueService;
        this.localMusicScannerService = localMusicScannerService;
    }

    public List<RecommendationDto> getRecommendations(int limit) {
        List<RecommendationDto> recommendations = new ArrayList<>();
        List<DiscoveredTrackDto> localTracks = localMusicScannerService.scanSampleMusicFolder();
        List<CatalogueTrackDto> catTracks = catalogueService.getAllTracks();

        // 1. Recommend high-affinity local imported tracks
        for (DiscoveredTrackDto track : localTracks) {
            String reason = "From your verified personal local vault collection";
            if (track.getLanguage() != null && track.getLanguage().equalsIgnoreCase("Tamil")) {
                reason = "High affinity match with your energetic soundtrack preferences";
            } else if (track.getGenre() != null && track.getGenre().contains("Pop")) {
                reason = "Matches your melodic vocal and acoustic affinity";
            }

            recommendations.add(new RecommendationDto(
                    track.getId(),
                    track.getTitle(),
                    track.getArtist(),
                    track.getAlbum(),
                    track.getGenre(),
                    track.getArtworkUrl(),
                    reason,
                    0.92
            ));
        }

        // 2. Recommend curated legal catalogue tracks
        for (CatalogueTrackDto cat : catTracks) {
            recommendations.add(new RecommendationDto(
                    cat.getId(),
                    cat.getTitle(),
                    cat.getArtist(),
                    cat.getAlbum(),
                    cat.getGenre(),
                    cat.getArtworkUrl(),
                    "Trending in curated legal public domain & CC catalogue",
                    0.85
            ));
        }

        Collections.shuffle(recommendations);
        return recommendations.subList(0, Math.min(limit, recommendations.size()));
    }
}
