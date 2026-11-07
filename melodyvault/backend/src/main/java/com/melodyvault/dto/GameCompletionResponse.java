package com.melodyvault.dto;

public class GameCompletionResponse {
    private String gameId;
    private int finalScore;
    private int xpEarned;
    private int totalXp;
    private int level;
    private boolean levelUp;
    private int streakBonus;
    private String message;

    public GameCompletionResponse() {}

    public GameCompletionResponse(String gameId, int finalScore, int xpEarned, int totalXp, int level, boolean levelUp, int streakBonus, String message) {
        this.gameId = gameId;
        this.finalScore = finalScore;
        this.xpEarned = xpEarned;
        this.totalXp = totalXp;
        this.level = level;
        this.levelUp = levelUp;
        this.streakBonus = streakBonus;
        this.message = message;
    }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public int getFinalScore() { return finalScore; }
    public void setFinalScore(int finalScore) { this.finalScore = finalScore; }
    public int getXpEarned() { return xpEarned; }
    public void setXpEarned(int xpEarned) { this.xpEarned = xpEarned; }
    public int getTotalXp() { return totalXp; }
    public void setTotalXp(int totalXp) { this.totalXp = totalXp; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public boolean isLevelUp() { return levelUp; }
    public void setLevelUp(boolean levelUp) { this.levelUp = levelUp; }
    public int getStreakBonus() { return streakBonus; }
    public void setStreakBonus(int streakBonus) { this.streakBonus = streakBonus; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

