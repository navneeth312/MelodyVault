package com.melodyvault.dto;

public class XpTransactionDto {
    private String id;
    private String source;
    private String action;
    private String songId;
    private String songTitle;
    private int amount;
    private String timestamp;
    private String dayDate;

    public XpTransactionDto() {}

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

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getDayDate() { return dayDate; }
    public void setDayDate(String dayDate) { this.dayDate = dayDate; }
}

