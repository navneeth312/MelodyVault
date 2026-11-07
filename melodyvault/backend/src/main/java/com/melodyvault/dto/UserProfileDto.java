package com.melodyvault.dto;

public class UserProfileDto {
    private String id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private int totalXp;
    private int level;
    private int streakDays;
    private int badgesCount;
    private boolean joinedLeaderboard = true;
    private String tierTitle;

    public UserProfileDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public int getTotalXp() { return totalXp; }
    public void setTotalXp(int totalXp) { this.totalXp = totalXp; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public int getStreakDays() { return streakDays; }
    public void setStreakDays(int streakDays) { this.streakDays = streakDays; }

    public int getBadgesCount() { return badgesCount; }
    public void setBadgesCount(int badgesCount) { this.badgesCount = badgesCount; }

    public boolean isJoinedLeaderboard() { return joinedLeaderboard; }
    public void setJoinedLeaderboard(boolean joinedLeaderboard) { this.joinedLeaderboard = joinedLeaderboard; }

    public String getTierTitle() { return tierTitle; }
    public void setTierTitle(String tierTitle) { this.tierTitle = tierTitle; }
}
