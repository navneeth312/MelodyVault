package com.melodyvault.dto;

public class GameAnswerRequest {
    private String sessionId;
    private String questionId;
    private int selectedOptionIndex;
    private int timeTakenSeconds;

    public GameAnswerRequest() {}

    public GameAnswerRequest(String sessionId, String questionId, int selectedOptionIndex, int timeTakenSeconds) {
        this.sessionId = sessionId;
        this.questionId = questionId;
        this.selectedOptionIndex = selectedOptionIndex;
        this.timeTakenSeconds = timeTakenSeconds;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public int getSelectedOptionIndex() { return selectedOptionIndex; }
    public void setSelectedOptionIndex(int selectedOptionIndex) { this.selectedOptionIndex = selectedOptionIndex; }
    public int getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(int timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
}

