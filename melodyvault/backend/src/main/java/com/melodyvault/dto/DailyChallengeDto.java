package com.melodyvault.dto;

import java.util.List;

public class DailyChallengeDto {
    private String date; // YYYY-MM-DD
    private String title;
    private String description;
    private List<GameQuestionDto> questions;
    private int bonusXp;
    private boolean completed;

    public DailyChallengeDto() {}

    public DailyChallengeDto(String date, String title, String description, List<GameQuestionDto> questions, int bonusXp, boolean completed) {
        this.date = date;
        this.title = title;
        this.description = description;
        this.questions = questions;
        this.bonusXp = bonusXp;
        this.completed = completed;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<GameQuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<GameQuestionDto> questions) { this.questions = questions; }
    public int getBonusXp() { return bonusXp; }
    public void setBonusXp(int bonusXp) { this.bonusXp = bonusXp; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
}

