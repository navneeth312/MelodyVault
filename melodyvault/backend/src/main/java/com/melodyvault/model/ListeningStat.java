package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity tracking individual listening sessions for analytics.
 */
@Entity
@Table(name = "listening_stats", indexes = {
    @Index(name = "idx_stat_song_id", columnList = "song_id"),
    @Index(name = "idx_stat_date_str", columnList = "date_str")
})
public class ListeningStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "song_id", length = 64, nullable = false)
    private String songId;

    @Column(name = "song_title", nullable = false)
    private String songTitle;

    @Column(name = "artist", nullable = false)
    private String artist;

    @Column(name = "genre")
    private String genre;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "completed", nullable = false)
    private boolean completed = false;

    @Column(name = "listened_at")
    private LocalDateTime listenedAt = LocalDateTime.now();

    @Column(name = "date_str", length = 10, nullable = false)
    private String dateString; // yyyy-MM-dd

    public ListeningStat() {}

    public ListeningStat(String songId, String songTitle, String artist, String genre, int durationSeconds, boolean completed) {
        this.songId = songId;
        this.songTitle = songTitle;
        this.artist = artist;
        this.genre = genre;
        this.durationSeconds = durationSeconds;
        this.completed = completed;
        this.listenedAt = LocalDateTime.now();
        this.dateString = java.time.LocalDate.now().toString();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSongId() { return songId; }
    public void setSongId(String songId) { this.songId = songId; }

    public String getSongTitle() { return songTitle; }
    public void setSongTitle(String songTitle) { this.songTitle = songTitle; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public LocalDateTime getListenedAt() { return listenedAt; }
    public void setListenedAt(LocalDateTime listenedAt) { this.listenedAt = listenedAt; }

    public String getDateString() { return dateString; }
    public void setDateString(String dateString) { this.dateString = dateString; }
}

