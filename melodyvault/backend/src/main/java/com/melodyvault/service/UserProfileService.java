package com.melodyvault.service;

import com.melodyvault.dto.UserProfileDto;
import com.melodyvault.model.UserProfile;
import com.melodyvault.repository.UserProfileRepository;
import com.melodyvault.repository.XpTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserProfileService {

    private final UserProfileRepository profileRepository;
    private final XpTransactionRepository xpRepository;
    private final LeaderboardService leaderboardService;

    public UserProfileService(UserProfileRepository profileRepository, XpTransactionRepository xpRepository, LeaderboardService leaderboardService) {
        this.profileRepository = profileRepository;
        this.xpRepository = xpRepository;
        this.leaderboardService = leaderboardService;
    }

    @Transactional
    public UserProfileDto getProfile(String userId) {
        String effectiveId = (userId != null && !userId.trim().isEmpty()) ? userId.trim() : "user-navneeth";

        UserProfile profile = profileRepository.findById(effectiveId)
                .orElseGet(() -> {
                    boolean isNavneeth = effectiveId.equals("user-navneeth");
                    return profileRepository.save(new UserProfile(
                            effectiveId,
                            isNavneeth ? "navneeth" : "user_" + effectiveId.substring(0, Math.min(8, effectiveId.length())),
                            isNavneeth ? "Navneeth.U" : "Listener",
                            isNavneeth ? "/avatars/navneeth_u.jpg" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                            isNavneeth ? "Curating pristine personal music collections with lossless audio in MelodyVault." : "Music enthusiast enjoying MelodyVault.",
                            0,
                            1,
                            1,
                            0,
                            true
                    ));
                });

        // For Navneeth, compute XP from repository ledger if local
        if (effectiveId.equals("user-navneeth")) {
            int actualTotalXp = xpRepository.sumTotalXp();
            int actualLevel = XpService.calculateLevel(actualTotalXp);
            if (profile.getTotalXp() != actualTotalXp || profile.getLevel() != actualLevel) {
                profile.setTotalXp(actualTotalXp);
                profile.setLevel(actualLevel);
                profile.setLastActiveAt(LocalDateTime.now());
                profile = profileRepository.save(profile);

                // Sync to leaderboard
                if (profile.isJoinedLeaderboard()) {
                    leaderboardService.syncScore(profile.getId(), profile.getDisplayName(), profile.getAvatarUrl(), profile.getTotalXp(), profile.getLevel(), true);
                }
            }
        }

        return toDto(profile);
    }

    @Transactional
    public UserProfileDto updateProfile(UserProfileDto dto) {
        String effectiveId = (dto.getId() != null && !dto.getId().trim().isEmpty()) ? dto.getId().trim() : "user-navneeth";

        UserProfile profile = profileRepository.findById(effectiveId)
                .orElseGet(() -> new UserProfile(effectiveId, dto.getUsername() != null ? dto.getUsername() : "user", dto.getDisplayName() != null ? dto.getDisplayName() : "Listener", dto.getAvatarUrl(), dto.getBio(), dto.getTotalXp(), dto.getLevel(), dto.getStreakDays(), dto.getBadgesCount(), dto.isJoinedLeaderboard()));

        if (dto.getDisplayName() != null && !dto.getDisplayName().trim().isEmpty()) {
            profile.setDisplayName(dto.getDisplayName().trim());
        }
        if (dto.getAvatarUrl() != null && !dto.getAvatarUrl().trim().isEmpty()) {
            profile.setAvatarUrl(dto.getAvatarUrl().trim());
        }
        if (dto.getBio() != null) {
            profile.setBio(dto.getBio().trim());
        }
        if (dto.getTotalXp() > 0) {
            profile.setTotalXp(dto.getTotalXp());
        }
        if (dto.getLevel() > 0) {
            profile.setLevel(dto.getLevel());
        }
        profile.setJoinedLeaderboard(dto.isJoinedLeaderboard());
        profile.setLastActiveAt(LocalDateTime.now());

        UserProfile saved = profileRepository.save(profile);

        // Sync to leaderboard
        leaderboardService.syncScore(saved.getId(), saved.getDisplayName(), saved.getAvatarUrl(), saved.getTotalXp(), saved.getLevel(), saved.isJoinedLeaderboard());

        return toDto(saved);
    }

    private UserProfileDto toDto(UserProfile profile) {
        UserProfileDto dto = new UserProfileDto();
        dto.setId(profile.getId());
        dto.setUsername(profile.getUsername());
        dto.setDisplayName(profile.getDisplayName());
        dto.setAvatarUrl(profile.getAvatarUrl());
        dto.setBio(profile.getBio());
        dto.setTotalXp(profile.getTotalXp());
        dto.setLevel(profile.getLevel());
        dto.setStreakDays(profile.getStreakDays());
        dto.setBadgesCount(profile.getBadgesCount());
        dto.setJoinedLeaderboard(profile.isJoinedLeaderboard());
        dto.setTierTitle(XpService.getTierTitle(profile.getLevel()));
        return dto;
    }
}
