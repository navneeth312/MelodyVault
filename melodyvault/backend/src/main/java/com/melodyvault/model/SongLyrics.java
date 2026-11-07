package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "song_lyrics")
public class SongLyrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String songId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String artist;

    @Column(columnDefinition = "TEXT")
    private String plainLyrics;

    @Column(columnDefinition = "TEXT")
    private String syncedLyrics;

    private String source;

    private boolean synced;

    private Instant updatedAt;

    public SongLyrics() {
        this.updatedAt = Instant.now();
    }

    public SongLyrics(String songId, String title, String artist, String plainLyrics, String syncedLyrics, String source, boolean synced) {
        this.songId = songId;
        this.title = title;
        this.artist = artist;
        this.plainLyrics = plainLyrics;
        this.syncedLyrics = syncedLyrics;
        this.source = source;
        this.synced = synced;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSongId() { return songId; }
    public void setSongId(String songId) { this.songId = songId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getPlainLyrics() { return plainLyrics; }
    public void setPlainLyrics(String plainLyrics) { this.plainLyrics = plainLyrics; }

    public String getSyncedLyrics() { return syncedLyrics; }
    public void setSyncedLyrics(String syncedLyrics) { this.syncedLyrics = syncedLyrics; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public boolean isSynced() { return synced; }
    public void setSynced(boolean synced) { this.synced = synced; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

