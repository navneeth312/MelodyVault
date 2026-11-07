package com.melodyvault.service;

import com.melodyvault.dto.RewardClaimRequest;
import com.melodyvault.dto.RewardClaimResponse;
import com.melodyvault.dto.XpTransactionDto;
import com.melodyvault.model.UserProfile;
import com.melodyvault.model.XpTransaction;
import com.melodyvault.repository.UserProfileRepository;
import com.melodyvault.repository.XpTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class XpService {

    public static final int DAILY_LISTENING_XP_CAP = 150;

    private final XpTransactionRepository xpRepository;
    private final UserProfileRepository userProfileRepository;

    public XpService(XpTransactionRepository xpRepository, UserProfileRepository userProfileRepository) {
        this.xpRepository = xpRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<XpTransactionDto> getLedger() {
        return xpRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary() {
        String today = LocalDate.now().toString();
        int totalXp = xpRepository.sumTotalXp();
        int todayListeningXp = xpRepository.sumDailyListeningXp(today);
        int level = calculateLevel(totalXp);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalXp", totalXp);
        summary.put("level", level);
        summary.put("tierTitle", getTierTitle(level));
        summary.put("todayListeningXp", todayListeningXp);
        summary.put("dailyListeningCap", DAILY_LISTENING_XP_CAP);
        summary.put("remainingListeningXpToday", Math.max(0, DAILY_LISTENING_XP_CAP - todayListeningXp));
        return summary;
    }

    @Transactional
    public RewardClaimResponse claimReward(RewardClaimRequest request) {
        // Anti-farming Rule 1: Reject duplicate transaction ID
        if (xpRepository.existsById(request.getId())) {
            int currentTotal = xpRepository.sumTotalXp();
            return new RewardClaimResponse(
                    false,
                    0,
                    currentTotal,
                    calculateLevel(currentTotal),
                    false,
                    "Duplicate reward transaction rejected. Event already recorded."
            );
        }

        int requestedAmount = request.getAmount();
        int finalAwardAmount = requestedAmount;

        // Anti-farming Rule 2: Enforce daily listening cap for listening events
        String today = LocalDate.now().toString();
        if ("first_listen".equalsIgnoreCase(request.getSource()) || "listening".equalsIgnoreCase(request.getSource())) {
            int todaySoFar = xpRepository.sumDailyListeningXp(today);
            int availableCap = Math.max(0, DAILY_LISTENING_XP_CAP - todaySoFar);
            if (availableCap <= 0) {
                int currentTotal = xpRepository.sumTotalXp();
                return new RewardClaimResponse(
                        false,
                        0,
                        currentTotal,
                        calculateLevel(currentTotal),
                        false,
                        "Daily listening XP cap of " + DAILY_LISTENING_XP_CAP + " XP reached for today."
                );
            }
            finalAwardAmount = Math.min(requestedAmount, availableCap);
        }

        // Record immutable transaction in ledger
        XpTransaction tx = new XpTransaction(
                request.getId(),
                request.getSource(),
                request.getAction(),
                request.getSongId(),
                request.getSongTitle(),
                finalAwardAmount
        );
        xpRepository.save(tx);

        // Update User Profile
        UserProfile profile = userProfileRepository.findById("user-navneeth")
                .orElseGet(() -> new UserProfile("user-navneeth", "navneeth", "Navneeth (You)", "Personal music collection", 0, 1, 1, 0));

        int oldLevel = profile.getLevel();
        int newTotalXp = xpRepository.sumTotalXp();
        int newLevel = calculateLevel(newTotalXp);
        boolean levelUp = newLevel > oldLevel;

        profile.setTotalXp(newTotalXp);
        profile.setLevel(newLevel);
        userProfileRepository.save(profile);

        return new RewardClaimResponse(
                true,
                finalAwardAmount,
                newTotalXp,
                newLevel,
                levelUp,
                levelUp
                        ? "Leveled up to Level " + newLevel + " (" + getTierTitle(newLevel) + ")!"
                        : "+" + finalAwardAmount + " XP awarded: " + request.getAction()
        );
    }

    public static int calculateLevel(int totalXp) {
        if (totalXp <= 0) return 1;
        return Math.max(1, (int) Math.floor(Math.sqrt(totalXp / 50.0)) + 1);
    }

    public static String getTierTitle(int level) {
        if (level >= 30) return "Sonic Sovereign";
        if (level >= 20) return "Audiophile Legend";
        if (level >= 15) return "Symphonic Master";
        if (level >= 10) return "Vinyl Virtuoso";
        if (level >= 5)  return "Harmonic Collector";
        if (level >= 3)  return "Acoustic Explorer";
        return "Melody Novice";
    }

    private XpTransactionDto toDto(XpTransaction tx) {
        XpTransactionDto dto = new XpTransactionDto();
        dto.setId(tx.getId());
        dto.setSource(tx.getSource());
        dto.setAction(tx.getAction());
        dto.setSongId(tx.getSongId());
        dto.setSongTitle(tx.getSongTitle());
        dto.setAmount(tx.getAmount());
        dto.setTimestamp(tx.getTimestamp() != null ? tx.getTimestamp().toString() : null);
        dto.setDayDate(tx.getDayDate());
        return dto;
    }
}

