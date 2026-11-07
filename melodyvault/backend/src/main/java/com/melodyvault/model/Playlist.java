package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Entity representing a User Playlist stored on the Java backend.
 */
@Entity
@Table(name = "playlists")
public class Playlist {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", length = 1024)
    private String description;

    @Column(name = "cover_gradient")
    private String coverGradient = "from-purple-600 to-indigo-600";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "playlist_songs", joinColumns = @JoinColumn(name = "playlist_id"))
    @Column(name = "song_id")
    @OrderColumn(name = "song_order")
    private List<String> songIds = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Playlist() {}

    public Playlist(String id, String name, String description, String coverGradient, List<String> songIds) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.coverGradient = coverGradient != null ? coverGradient : "from-purple-600 to-indigo-600";
        this.songIds = songIds != null ? new ArrayList<>(songIds) : new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCoverGradient() { return coverGradient; }
    public void setCoverGradient(String coverGradient) { this.coverGradient = coverGradient; }

    public List<String> getSongIds() { return songIds; }
    public void setSongIds(List<String> songIds) { this.songIds = songIds; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

