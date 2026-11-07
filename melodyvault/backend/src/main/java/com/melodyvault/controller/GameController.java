package com.melodyvault.controller;

import com.melodyvault.dto.*;
import com.melodyvault.service.DailyChallengeService;
import com.melodyvault.service.GameEngineService;
import com.melodyvault.service.GameScoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games")
@Tag(name = "Music Games & Challenges Hub", description = "Endpoints for 18 interactive music games, sessions, scoring, and daily challenges")
public class GameController {

    private final GameEngineService gameEngineService;
    private final GameScoringService gameScoringService;
    private final DailyChallengeService dailyChallengeService;

    public GameController(GameEngineService gameEngineService, GameScoringService gameScoringService, DailyChallengeService dailyChallengeService) {
        this.gameEngineService = gameEngineService;
        this.gameScoringService = gameScoringService;
        this.dailyChallengeService = dailyChallengeService;
    }

    @GetMapping
    @Operation(summary = "List all 18 music games organized into 4 categories")
    public ResponseEntity<List<GameInfoDto>> getAllGames() {
        return ResponseEntity.ok(gameEngineService.getAllGames());
    }

    @GetMapping("/{gameId}")
    @Operation(summary = "Get specific game details and supported difficulty levels")
    public ResponseEntity<GameInfoDto> getGame(@PathVariable String gameId) {
        return gameEngineService.getGameById(gameId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{gameId}/start")
    @Operation(summary = "Start a new game session with chosen difficulty")
    public ResponseEntity<GameSessionDto> startSession(
            @PathVariable String gameId,
            @RequestParam(defaultValue = "Medium") String difficulty) {
        return ResponseEntity.ok(gameEngineService.startSession(gameId, difficulty));
    }

    @PostMapping("/answer")
    @Operation(summary = "Submit an answer for real-time validation and scoring")
    public ResponseEntity<GameAnswerResult> submitAnswer(@RequestBody GameAnswerRequest request) {
        return ResponseEntity.ok(gameScoringService.evaluateAnswer(request));
    }

    @PostMapping("/complete")
    @Operation(summary = "Finalize game session, record score, and award verified anti-farming XP")
    public ResponseEntity<GameCompletionResponse> completeSession(@RequestBody GameCompletionRequest request) {
        return ResponseEntity.ok(gameScoringService.completeSession(request));
    }

    @GetMapping("/daily-challenge")
    @Operation(summary = "Retrieve today's active Daily Music Challenge")
    public ResponseEntity<DailyChallengeDto> getDailyChallenge() {
        return ResponseEntity.ok(dailyChallengeService.getTodayChallenge());
    }

    @PostMapping("/daily-challenge/complete")
    @Operation(summary = "Mark today's Daily Music Challenge as completed")
    public ResponseEntity<Map<String, Object>> completeDailyChallenge() {
        String today = LocalDate.now().toString();
        dailyChallengeService.markCompleted(today);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "date", today,
                "bonusXp", 100,
                "message", "Daily challenge completed! 100 bonus XP awarded."
        ));
    }
}

