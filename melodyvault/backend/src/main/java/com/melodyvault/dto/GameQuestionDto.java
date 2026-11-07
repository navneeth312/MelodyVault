package com.melodyvault.dto;

import java.util.List;

public class GameQuestionDto {
    private String questionId;
    private String gameId;
    private String prompt;
    private String mediaUrl;
    private String mediaType; // "audio", "image", "text", "lyrics"
    private List<String> options;
    private int correctAnswerIndex;
    private String explanation;
    private String difficulty;
    private int points;

    public GameQuestionDto() {}

    public GameQuestionDto(String questionId, String gameId, String prompt, String mediaUrl, String mediaType,
                           List<String> options, int correctAnswerIndex, String explanation, String difficulty, int points) {
        this.questionId = questionId;
        this.gameId = gameId;
        this.prompt = prompt;
        this.mediaUrl = mediaUrl;
        this.mediaType = mediaType;
        this.options = options;
        this.correctAnswerIndex = correctAnswerIndex;
        this.explanation = explanation;
        this.difficulty = difficulty;
        this.points = points;
    }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    public int getCorrectAnswerIndex() { return correctAnswerIndex; }
    public void setCorrectAnswerIndex(int correctAnswerIndex) { this.correctAnswerIndex = correctAnswerIndex; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
}

