package com.melodyvault.dto;

import java.time.Instant;
import java.util.List;

public class GameSessionDto {
    private String sessionId;
    private String gameId;
    private String gameTitle;
    private String difficulty;
    private List<GameQuestionDto> questions;
    private Instant startedAt;
    private int totalRounds;

    public GameSessionDto() {}

    public GameSessionDto(String sessionId, String gameId, String gameTitle, String difficulty, List<GameQuestionDto> questions, Instant startedAt, int totalRounds) {
        this.sessionId = sessionId;
        this.gameId = gameId;
        this.gameTitle = gameTitle;
        this.difficulty = difficulty;
        this.questions = questions;
        this.startedAt = startedAt;
        this.totalRounds = totalRounds;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public String getGameTitle() { return gameTitle; }
    public void setGameTitle(String gameTitle) { this.gameTitle = gameTitle; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public List<GameQuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<GameQuestionDto> questions) { this.questions = questions; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public int getTotalRounds() { return totalRounds; }
    public void setTotalRounds(int totalRounds) { this.totalRounds = totalRounds; }
}

