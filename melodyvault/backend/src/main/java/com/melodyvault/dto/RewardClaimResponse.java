package com.melodyvault.dto;

public class RewardClaimResponse {
    private boolean success;
    private int awardedXp;
    private int totalXp;
    private int newLevel;
    private boolean levelUp;
    private String message;

    public RewardClaimResponse() {}

    public RewardClaimResponse(boolean success, int awardedXp, int totalXp, int newLevel, boolean levelUp, String message) {
        this.success = success;
        this.awardedXp = awardedXp;
        this.totalXp = totalXp;
        this.newLevel = newLevel;
        this.levelUp = levelUp;
        this.message = message;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public int getAwardedXp() { return awardedXp; }
    public void setAwardedXp(int awardedXp) { this.awardedXp = awardedXp; }

    public int getTotalXp() { return totalXp; }
    public void setTotalXp(int totalXp) { this.totalXp = totalXp; }

    public int getNewLevel() { return newLevel; }
    public void setNewLevel(int newLevel) { this.newLevel = newLevel; }

    public boolean isLevelUp() { return levelUp; }
    public void setLevelUp(boolean levelUp) { this.levelUp = levelUp; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

