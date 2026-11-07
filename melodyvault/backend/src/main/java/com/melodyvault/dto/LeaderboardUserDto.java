package com.melodyvault.dto;

import java.time.Instant;

public class LeaderboardUserDto {
    private int rank;
    private String userId;
    private String displayName;
    private String avatarUrl;
    private int totalXp;
    private int level;
    private String tierTitle;
    private boolean currentUser;
    private Instant updatedAt;

    public LeaderboardUserDto() {}

    public LeaderboardUserDto(int rank, String userId, String displayName, String avatarUrl, int totalXp, int level, String tierTitle, boolean currentUser, Instant updatedAt) {
        this.rank = rank;
        this.userId = userId;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.totalXp = totalXp;
        this.level = level;
        this.tierTitle = tierTitle;
        this.currentUser = currentUser;
        this.updatedAt = updatedAt;
    }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

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

    public String getTierTitle() { return tierTitle; }
    public void setTierTitle(String tierTitle) { this.tierTitle = tierTitle; }

    public boolean isCurrentUser() { return currentUser; }
    public void setCurrentUser(boolean currentUser) { this.currentUser = currentUser; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

