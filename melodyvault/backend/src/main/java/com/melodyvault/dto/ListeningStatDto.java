package com.melodyvault.dto;

public class ListeningStatDto {
    private String songId;
    private String songTitle;
    private String artist;
    private String genre;
    private int durationSeconds;
    private boolean completed;

    public ListeningStatDto() {}

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
}

