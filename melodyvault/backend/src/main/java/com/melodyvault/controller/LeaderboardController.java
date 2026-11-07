package com.melodyvault.controller;

import com.melodyvault.dto.LeaderboardUserDto;
import com.melodyvault.service.AuthService;
import com.melodyvault.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
@Tag(name = "Shared Global Leaderboard", description = "Endpoints for verified multiplayer leaderboard rankings, opt-in/opt-out, and score sync")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final AuthService authService;

    public LeaderboardController(LeaderboardService leaderboardService, AuthService authService) {
        this.leaderboardService = leaderboardService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get the global verified leaderboard sorted by genuine total XP descending")
    public ResponseEntity<List<LeaderboardUserDto>> getLeaderboard(
            @RequestParam(required = false) String currentUserId) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(currentUserId));
    }

    @PostMapping("/sync")
    @Operation(summary = "Synchronize an authenticated user's genuine XP and level with the shared leaderboard")
    public ResponseEntity<?> syncScore(
            @RequestHeader(value = "X-Creator-Token", required = false) String creatorTokenHeader,
            @CookieValue(value = "mv_creator_session", required = false) String creatorCookie,
            @RequestBody Map<String, Object> payload) {
        
        String userId = (String) payload.getOrDefault("userId", "user-navneeth");

        // Visitor isolation: Disallow visitor impersonation of Navneeth.U creator identity
        if ("user-navneeth".equalsIgnoreCase(userId)) {
            String activeToken = (creatorTokenHeader != null && !creatorTokenHeader.trim().isEmpty())
                    ? creatorTokenHeader.trim()
                    : creatorCookie;

            if (!authService.isValidCreatorToken(activeToken)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Forbidden",
                        "message", "Cannot modify or sync Navneeth.U (Creator) score without verified creator authentication."
                ));
            }
        }

        String displayName = (String) payload.getOrDefault("displayName", "Navneeth.U");
        String avatarUrl = (String) payload.getOrDefault("avatarUrl", "/avatars/navneeth_u.jpg");
        int totalXp = payload.containsKey("totalXp") ? ((Number) payload.get("totalXp")).intValue() : 0;
        int level = payload.containsKey("level") ? ((Number) payload.get("level")).intValue() : 1;
        boolean optedIn = payload.containsKey("optedIn") ? (Boolean) payload.get("optedIn") : true;

        LeaderboardUserDto synced = leaderboardService.syncScore(userId, displayName, avatarUrl, totalXp, level, optedIn);
        return ResponseEntity.ok(synced);
    }

    @PostMapping("/opt-in")
    @Operation(summary = "Toggle user opt-in participation on the public leaderboard")
    public ResponseEntity<Map<String, Object>> toggleOptIn(@RequestBody Map<String, Object> payload) {
        String userId = (String) payload.get("userId");
        boolean optIn = (Boolean) payload.getOrDefault("optedIn", true);
        if (userId != null) {
            leaderboardService.toggleOptIn(userId, optIn);
        }
        return ResponseEntity.ok(Map.of("success", true, "userId", userId, "optedIn", optIn));
    }

    @GetMapping("/rank/{userId}")
    @Operation(summary = "Get a user's exact ranking on the shared leaderboard")
    public ResponseEntity<LeaderboardUserDto> getUserRank(@PathVariable String userId) {
        return leaderboardService.getUserRank(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
