package com.melodyvault.service;

import com.melodyvault.dto.LeaderboardUserDto;
import com.melodyvault.model.LeaderboardEntry;
import com.melodyvault.repository.LeaderboardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;

    public LeaderboardService(LeaderboardRepository leaderboardRepository) {
        this.leaderboardRepository = leaderboardRepository;
        initDefaultEntry();
    }

    private void initDefaultEntry() {
        // Ensure Navneeth.U's authentic initial entry exists
        if (leaderboardRepository.findByUserId("user-navneeth").isEmpty()) {
            leaderboardRepository.save(new LeaderboardEntry(
                    "user-navneeth",
                    "Navneeth.U",
                    "/avatars/navneeth_u.jpg",
                    120, // initial verified milestone XP from sample achievements
                    2,
                    true
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<LeaderboardUserDto> getLeaderboard(String currentUserId) {
        List<LeaderboardEntry> entries = leaderboardRepository.findByOptedInTrueOrderByTotalXpDesc();
        List<LeaderboardUserDto> result = new ArrayList<>();

        int currentRank = 1;
        for (LeaderboardEntry entry : entries) {
            boolean isCurrent = currentUserId != null && currentUserId.equals(entry.getUserId());
            result.add(new LeaderboardUserDto(
                    currentRank++,
                    entry.getUserId(),
                    entry.getDisplayName(),
                    entry.getAvatarUrl() != null && !entry.getAvatarUrl().isEmpty() ? entry.getAvatarUrl() : "/avatars/navneeth_u.jpg",
                    entry.getTotalXp(),
                    entry.getLevel(),
                    XpService.getTierTitle(entry.getLevel()),
                    isCurrent,
                    entry.getUpdatedAt()
            ));
        }
        return result;
    }

    @Transactional
    public LeaderboardUserDto syncScore(String userId, String displayName, String avatarUrl, int totalXp, int level, boolean optedIn) {
        if (userId == null || userId.trim().isEmpty()) {
            userId = "user-" + Math.abs(displayName.hashCode());
        }

        final String finalUserId = userId;
        LeaderboardEntry entry = leaderboardRepository.findByUserId(userId)
                .orElseGet(() -> new LeaderboardEntry(finalUserId, displayName, avatarUrl, totalXp, level, optedIn));

        if (displayName != null && !displayName.trim().isEmpty()) {
            entry.setDisplayName(displayName.trim());
        }
        if (avatarUrl != null && !avatarUrl.trim().isEmpty()) {
            entry.setAvatarUrl(avatarUrl);
        }
        entry.setTotalXp(totalXp);
        entry.setLevel(level);
        entry.setOptedIn(optedIn);
        entry.setUpdatedAt(Instant.now());

        LeaderboardEntry saved = leaderboardRepository.save(entry);

        // Calculate rank
        List<LeaderboardEntry> all = leaderboardRepository.findByOptedInTrueOrderByTotalXpDesc();
        int rank = 1;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getUserId().equals(saved.getUserId())) {
                rank = i + 1;
                break;
            }
        }

        return new LeaderboardUserDto(
                rank,
                saved.getUserId(),
                saved.getDisplayName(),
                saved.getAvatarUrl(),
                saved.getTotalXp(),
                saved.getLevel(),
                XpService.getTierTitle(saved.getLevel()),
                true,
                saved.getUpdatedAt()
        );
    }

    @Transactional
    public void toggleOptIn(String userId, boolean optIn) {
        leaderboardRepository.findByUserId(userId).ifPresent(e -> {
            e.setOptedIn(optIn);
            e.setUpdatedAt(Instant.now());
            leaderboardRepository.save(e);
        });
    }

    @Transactional(readOnly = true)
    public Optional<LeaderboardUserDto> getUserRank(String userId) {
        List<LeaderboardUserDto> list = getLeaderboard(userId);
        return list.stream().filter(u -> u.getUserId().equals(userId)).findFirst();
    }
}

