package com.melodyvault.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA Entity for securely storing hashed Creator session tokens.
 * Persisted in the database to survive backend restarts.
 * Raw tokens are never stored in the database.
 */
@Entity
@Table(name = "creator_sessions", indexes = {
        @Index(name = "idx_creator_session_token_hash", columnList = "token_hash", unique = true),
        @Index(name = "idx_creator_session_expires", columnList = "expires_at")
})
public class CreatorSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "remember_device", nullable = false)
    private boolean rememberDevice;

    @Column(name = "revoked", nullable = false)
    private boolean revoked;

    public CreatorSession() {
    }

    public CreatorSession(String tokenHash, Instant createdAt, Instant expiresAt, boolean rememberDevice) {
        this.tokenHash = tokenHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.rememberDevice = rememberDevice;
        this.revoked = false;
    }

    public Long getId() {
        return id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isRememberDevice() {
        return rememberDevice;
    }

    public void setRememberDevice(boolean rememberDevice) {
        this.rememberDevice = rememberDevice;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public void setRevoked(boolean revoked) {
        this.revoked = revoked;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !revoked && !isExpired();
    }
}

