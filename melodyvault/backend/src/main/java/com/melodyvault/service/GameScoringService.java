package com.melodyvault.service;

import com.melodyvault.dto.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameScoringService {

    private final GameEngineService gameEngineService;
    private final XpService xpService;

    // Track session state (streak, score)
    private final Map<String, SessionState> sessionStates = new ConcurrentHashMap<>();

    private static class SessionState {
        int score = 0;
        int streak = 0;
        int correctAnswers = 0;
    }

    public GameScoringService(GameEngineService gameEngineService, XpService xpService) {
        this.gameEngineService = gameEngineService;
        this.xpService = xpService;
    }

    public GameAnswerResult evaluateAnswer(GameAnswerRequest request) {
        Optional<GameSessionDto> optSession = gameEngineService.getSession(request.getSessionId());
        if (optSession.isEmpty()) {
            return new GameAnswerResult(false, 0, 0, 0, 0, "Session expired or invalid.");
        }

        GameSessionDto session = optSession.get();
        GameQuestionDto question = session.getQuestions().stream()
                .filter(q -> q.getQuestionId().equals(request.getQuestionId()))
                .findFirst()
                .orElse(null);

        if (question == null) {
            return new GameAnswerResult(false, 0, 0, 0, 0, "Question not found in session.");
        }

        SessionState state = sessionStates.computeIfAbsent(request.getSessionId(), k -> new SessionState());

        boolean isCorrect = (request.getSelectedOptionIndex() == question.getCorrectAnswerIndex());
        int points = 0;

        if (isCorrect) {
            state.correctAnswers++;
            state.streak++;
            // Streak multiplier: 1x up to 2, 1.5x at 3+, 2x at 5+
            double multiplier = state.streak >= 5 ? 2.0 : (state.streak >= 3 ? 1.5 : 1.0);
            // Speed bonus: if answered in < 5 seconds, +5 points
            int speedBonus = (request.getTimeTakenSeconds() > 0 && request.getTimeTakenSeconds() <= 5) ? 5 : 0;
            points = (int) (question.getPoints() * multiplier) + speedBonus;
            state.score += points;
        } else {
            state.streak = 0;
        }

        return new GameAnswerResult(
                isCorrect,
                question.getCorrectAnswerIndex(),
                points,
                state.score,
                state.streak,
                question.getExplanation()
        );
    }

    public GameCompletionResponse completeSession(GameCompletionRequest request) {
        SessionState state = sessionStates.remove(request.getSessionId());
        gameEngineService.removeSession(request.getSessionId());

        int score = (state != null) ? state.score : request.getFinalScore();
        int correct = (state != null) ? state.correctAnswers : request.getCorrectCount();

        // Calculate anti-farming XP reward: Base 15 XP + up to 25 based on score, capped at 50 XP
        int xpEarned = Math.min(50, Math.max(10, 15 + (score / 10)));
        if (correct == 0) xpEarned = 5; // participation XP

        // Claim XP via XpService
        RewardClaimRequest rewardReq = new RewardClaimRequest();
        rewardReq.setId("game-" + request.getGameId() + "-" + UUID.randomUUID().toString().substring(0, 8));
        rewardReq.setSource("gaming");
        rewardReq.setAction("GAME_COMPLETE_" + request.getGameId().toUpperCase());
        rewardReq.setAmount(xpEarned);

        RewardClaimResponse rewardResp = xpService.claimReward(rewardReq);

        return new GameCompletionResponse(
                request.getGameId(),
                score,
                rewardResp.getAwardedXp(),
                rewardResp.getTotalXp(),
                rewardResp.getNewLevel(),
                rewardResp.isLevelUp(),
                (state != null ? state.streak : 0),
                "Game completed! Awarded " + rewardResp.getAwardedXp() + " XP."
        );
    }
}
