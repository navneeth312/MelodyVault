package com.melodyvault.dto;

public class GameCompletionRequest {
    private String sessionId;
    private String gameId;
    private int finalScore;
    private int correctCount;
    private int totalCount;
    private int timeElapsedSeconds;

    public GameCompletionRequest() {}

    public GameCompletionRequest(String sessionId, String gameId, int finalScore, int correctCount, int totalCount, int timeElapsedSeconds) {
        this.sessionId = sessionId;
        this.gameId = gameId;
        this.finalScore = finalScore;
        this.correctCount = correctCount;
        this.totalCount = totalCount;
        this.timeElapsedSeconds = timeElapsedSeconds;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public int getFinalScore() { return finalScore; }
    public void setFinalScore(int finalScore) { this.finalScore = finalScore; }
    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }
    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }
    public int getTimeElapsedSeconds() { return timeElapsedSeconds; }
    public void setTimeElapsedSeconds(int timeElapsedSeconds) { this.timeElapsedSeconds = timeElapsedSeconds; }
}

