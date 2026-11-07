package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA Entity tracking immutable XP transactions for the anti-farming ledger.
 */
@Entity
@Table(name = "xp_transactions", indexes = {
    @Index(name = "idx_xp_day_date", columnList = "day_date"),
    @Index(name = "idx_xp_source", columnList = "source")
})
public class XpTransaction {

    @Id
    @Column(name = "id", length = 128, nullable = false)
    private String id; // unique event id

    @Column(name = "source", nullable = false)
    private String source; // e.g., "import", "first_listen", "quest_completion"

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "song_id", length = 64)
    private String songId;

    @Column(name = "song_title")
    private String songTitle;

    @Column(name = "amount", nullable = false)
    private int amount;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "day_date", length = 10, nullable = false)
    private String dayDate; // yyyy-MM-dd

    public XpTransaction() {}

    public XpTransaction(String id, String source, String action, String songId, String songTitle, int amount) {
        this.id = id;
        this.source = source;
        this.action = action;
        this.songId = songId;
        this.songTitle = songTitle;
        this.amount = amount;
        this.timestamp = LocalDateTime.now();
        this.dayDate = java.time.LocalDate.now().toString();
    }

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

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getDayDate() { return dayDate; }
    public void setDayDate(String dayDate) { this.dayDate = dayDate; }
}

