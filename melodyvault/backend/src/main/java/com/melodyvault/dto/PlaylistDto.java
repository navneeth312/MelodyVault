package com.melodyvault.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class PlaylistDto {
    private String id;

    @NotBlank(message = "Playlist name cannot be empty")
    private String name;

    private String description;
    private String coverGradient;
    private List<String> songIds = new ArrayList<>();
    private String createdAt;
    private String updatedAt;

    public PlaylistDto() {}

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

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}

