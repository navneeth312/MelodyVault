package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity representing an authorized, legally playable Public Catalogue Track.
 * Stored in PostgreSQL (Supabase) / H2.
 */
@Entity
@Table(name = "catalogue_tracks")
public class CatalogueTrack {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "artist", nullable = false)
    private String artist;

    @Column(name = "album")
    private String album;

    @Column(name = "genre", nullable = false)
    private String genre;

    @Column(name = "language", nullable = false)
    private String language;

    @Column(name = "duration", nullable = false)
    private int duration;

    @Column(name = "release_year")
    private int releaseYear;

    @Column(name = "artwork_url", length = 1024)
    private String artworkUrl;

    @Column(name = "audio_url", length = 1024, nullable = false)
    private String audioUrl;

    @Column(name = "licence_type", nullable = false)
    private String licenceType;

    @Column(name = "attribution", length = 1024)
    private String attribution;

    @Lob
    @Column(name = "lyrics")
    private String lyrics;

    @Column(name = "is_playable", nullable = false)
    private boolean isPlayable = true;

    @Column(name = "play_count", nullable = false)
    private int playCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public CatalogueTrack() {}

    public CatalogueTrack(String id, String title, String artist, String album, String genre,
                          String language, int duration, int releaseYear, String artworkUrl,
                          String audioUrl, String licenceType, String attribution, String lyrics) {
        this.id = id;
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.genre = genre;
        this.language = language;
        this.duration = duration;
        this.releaseYear = releaseYear;
        this.artworkUrl = artworkUrl;
        this.audioUrl = audioUrl;
        this.licenceType = licenceType;
        this.attribution = attribution;
        this.lyrics = lyrics;
        this.isPlayable = true;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
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

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public int getReleaseYear() { return releaseYear; }
    public void setReleaseYear(int releaseYear) { this.releaseYear = releaseYear; }

    public String getArtworkUrl() { return artworkUrl; }
    public void setArtworkUrl(String artworkUrl) { this.artworkUrl = artworkUrl; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    public String getLicenceType() { return licenceType; }
    public void setLicenceType(String licenceType) { this.licenceType = licenceType; }

    public String getAttribution() { return attribution; }
    public void setAttribution(String attribution) { this.attribution = attribution; }

    public String getLyrics() { return lyrics; }
    public void setLyrics(String lyrics) { this.lyrics = lyrics; }

    public boolean isPlayable() { return isPlayable; }
    public void setPlayable(boolean playable) { isPlayable = playable; }

    public int getPlayCount() { return playCount; }
    public void setPlayCount(int playCount) { this.playCount = playCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

