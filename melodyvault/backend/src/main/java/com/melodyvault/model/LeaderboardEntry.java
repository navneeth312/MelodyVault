package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "leaderboard_entries")
public class LeaderboardEntry {

    @Id
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Lob
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "total_xp", nullable = false)
    private int totalXp = 0;

    @Column(name = "level", nullable = false)
    private int level = 1;

    @Column(name = "opted_in", nullable = false)
    private boolean optedIn = true;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public LeaderboardEntry() {
        this.updatedAt = Instant.now();
    }

    public LeaderboardEntry(String userId, String displayName, String avatarUrl, int totalXp, int level, boolean optedIn) {
        this.userId = userId;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.totalXp = totalXp;
        this.level = level;
        this.optedIn = optedIn;
        this.updatedAt = Instant.now();
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public int getTotalXp() { return totalXp; }
    public void setTotalXp(int totalXp) { this.totalXp = totalXp; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public boolean isOptedIn() { return optedIn; }
    public void setOptedIn(boolean optedIn) { this.optedIn = optedIn; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

