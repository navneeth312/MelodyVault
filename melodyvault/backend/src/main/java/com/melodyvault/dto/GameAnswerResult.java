package com.melodyvault.dto;

public class GameAnswerResult {
    private boolean correct;
    private int correctOptionIndex;
    private int pointsEarned;
    private int currentScore;
    private int streak;
    private String explanation;

    public GameAnswerResult() {}

    public GameAnswerResult(boolean correct, int correctOptionIndex, int pointsEarned, int currentScore, int streak, String explanation) {
        this.correct = correct;
        this.correctOptionIndex = correctOptionIndex;
        this.pointsEarned = pointsEarned;
        this.currentScore = currentScore;
        this.streak = streak;
        this.explanation = explanation;
    }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
    public int getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(int correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }
    public int getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(int pointsEarned) { this.pointsEarned = pointsEarned; }
    public int getCurrentScore() { return currentScore; }
    public void setCurrentScore(int currentScore) { this.currentScore = currentScore; }
    public int getStreak() { return streak; }
    public void setStreak(int streak) { this.streak = streak; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}

