package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity for Authenticated Listener Profiles.
 */
@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id = "user-navneeth";

    @Column(name = "username", nullable = false)
    private String username = "navneeth";

    @Column(name = "display_name", nullable = false)
    private String displayName = "Navneeth.U";

    @Lob
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl = "/avatars/navneeth_u.jpg";

    @Column(name = "bio", length = 512)
    private String bio = "Curating pristine personal music collections with lossless audio in MelodyVault.";

    @Column(name = "total_xp", nullable = false)
    private int totalXp = 0;

    @Column(name = "level", nullable = false)
    private int level = 1;

    @Column(name = "streak_days", nullable = false)
    private int streakDays = 1;

    @Column(name = "badges_count", nullable = false)
    private int badgesCount = 0;

    @Column(name = "joined_leaderboard")
    private Boolean joinedLeaderboard = true;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt = LocalDateTime.now();

    public UserProfile() {}

    public UserProfile(String id, String username, String displayName, String bio, int totalXp, int level, int streakDays, int badgesCount) {
        this(id, username, displayName, "/avatars/navneeth_u.jpg", bio, totalXp, level, streakDays, badgesCount, true);
    }

    public UserProfile(String id, String username, String displayName, String avatarUrl, String bio, int totalXp, int level, int streakDays, int badgesCount, boolean joinedLeaderboard) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.totalXp = totalXp;
        this.level = level;
        this.streakDays = streakDays;
        this.badgesCount = badgesCount;
        this.joinedLeaderboard = joinedLeaderboard;
        this.lastActiveAt = LocalDateTime.now();
    }

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

    public boolean isJoinedLeaderboard() { return joinedLeaderboard == null || joinedLeaderboard; }
    public void setJoinedLeaderboard(Boolean joinedLeaderboard) { this.joinedLeaderboard = (joinedLeaderboard == null) ? true : joinedLeaderboard; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }
}
