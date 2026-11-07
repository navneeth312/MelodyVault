package com.melodyvault.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class RewardClaimRequest {
    @NotBlank(message = "Transaction ID is required")
    private String id;

    @NotBlank(message = "Source is required")
    private String source;

    @NotBlank(message = "Action is required")
    private String action;

    private String songId;
    private String songTitle;

    @Min(value = 1, message = "Reward amount must be positive")
    private int amount;

    public RewardClaimRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getSongId() { return songId; }
    public void setSongId(String songId) { this.songId = songId; }

    public String getSongTitle() { return songTitle; }
    public void setSongTitle(String songTitle) { this.songTitle = songTitle; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
}

