package com.melodyvault.dto;

import java.util.List;

public class GameInfoDto {
    private String id;
    private String title;
    private String description;
    private String category;
    private String iconName;
    private int xpReward;
    private int timeLimitSeconds;
    private List<String> supportedDifficulties;

    public GameInfoDto() {}

    public GameInfoDto(String id, String title, String description, String category, String iconName, int xpReward, int timeLimitSeconds, List<String> supportedDifficulties) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.iconName = iconName;
        this.xpReward = xpReward;
        this.timeLimitSeconds = timeLimitSeconds;
        this.supportedDifficulties = supportedDifficulties;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getIconName() { return iconName; }
    public void setIconName(String iconName) { this.iconName = iconName; }
    public int getXpReward() { return xpReward; }
    public void setXpReward(int xpReward) { this.xpReward = xpReward; }
    public int getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(int timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }
    public List<String> getSupportedDifficulties() { return supportedDifficulties; }
    public void setSupportedDifficulties(List<String> supportedDifficulties) { this.supportedDifficulties = supportedDifficulties; }
}

