package com.melodyvault.service;

import com.melodyvault.model.CreatorSession;
import com.melodyvault.repository.CreatorSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service for Creator (Navneeth.U) authentication and database-persisted session validation.
 * Fail-closed design: No hardcoded default credentials.
 * If CREATOR_PASSWORD environment variable (or property) is unset,
 * creator authentication is disabled and protected profiles are locked.
 * Sessions are stored securely hashed (SHA-256) in the database and survive backend restarts.
 */
@Service
public class AuthService {

    private final String creatorPassword;
    private final boolean creatorAuthConfigured;
    private final CreatorSessionRepository sessionRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    // Brute-force rate limiting: max 5 failed attempts per IP within 60 seconds
    private final Map<String, List<Instant>> failedAttempts = new ConcurrentHashMap<>();
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long RATE_LIMIT_WINDOW_SECONDS = 60;

    public AuthService(
            @Value("${melodyvault.security.creator-password:#{null}}") String configuredPassword,
            CreatorSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;

        String envPassword = System.getenv("CREATOR_PASSWORD");
        if (envPassword != null && !envPassword.trim().isEmpty()) {
            this.creatorPassword = envPassword.trim();
            this.creatorAuthConfigured = true;
        } else if (configuredPassword != null && !configuredPassword.trim().isEmpty()) {
            this.creatorPassword = configuredPassword.trim();
            this.creatorAuthConfigured = true;
        } else {
            // Strictly fail-closed: No default password. Creator authentication is disabled until configured.
            this.creatorPassword = null;
            this.creatorAuthConfigured = false;
        }
    }

    public boolean isCreatorAuthConfigured() {
        return creatorAuthConfigured;
    }

    /**
     * Constant-time password comparison to prevent timing attacks.
     */
    public boolean verifyCreatorPassword(String password) {
        if (!creatorAuthConfigured || creatorPassword == null || password == null) {
            return false;
        }
        byte[] expected = creatorPassword.getBytes(StandardCharsets.UTF_8);
        byte[] actual = password.trim().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, actual);
    }

    /**
     * Checks if client has exceeded maximum failed login attempts within the sliding window.
     */
    public boolean isRateLimited(String clientKey) {
        if (clientKey == null || clientKey.isBlank()) return false;
        Instant cutoff = Instant.now().minusSeconds(RATE_LIMIT_WINDOW_SECONDS);
        List<Instant> attempts = failedAttempts.computeIfAbsent(clientKey, k -> new CopyOnWriteArrayList<>());
        attempts.removeIf(instant -> instant.isBefore(cutoff));
        return attempts.size() >= MAX_FAILED_ATTEMPTS;
    }

    /**
     * Records a failed login attempt for rate limiting.
     */
    public void recordFailedAttempt(String clientKey) {
        if (clientKey == null || clientKey.isBlank()) return;
        failedAttempts.computeIfAbsent(clientKey, k -> new CopyOnWriteArrayList<>()).add(Instant.now());
    }

    /**
     * Clears failed login attempts for a client on successful login.
     */
    public void clearFailedAttempts(String clientKey) {
        if (clientKey != null) {
            failedAttempts.remove(clientKey);
        }
    }

    /**
     * Generates a cryptographically secure random session token,
     * persists its SHA-256 hash in the database, and returns the raw token
     * solely for transmission in the Set-Cookie response header.
     */
    @Transactional
    public String generateCreatorToken(boolean rememberDevice) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = "mv_creator_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);

        // Expiry: 30 days for rememberDevice (persistent), 24 hours for normal session
        long durationHours = rememberDevice ? (30L * 24L) : 24L;
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(durationHours * 3600L);

        CreatorSession session = new CreatorSession(tokenHash, now, expiresAt, rememberDevice);
        sessionRepository.save(session);

        return rawToken;
    }

    /**
     * Validates a session token against persisted hashed records in the database.
     */
    @Transactional(readOnly = true)
    public boolean isValidCreatorToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            return false;
        }
        String tokenHash = hashToken(rawToken.trim());
        Optional<CreatorSession> sessionOpt = sessionRepository.findByTokenHash(tokenHash);
        if (sessionOpt.isEmpty()) {
            return false;
        }
        CreatorSession session = sessionOpt.get();
        return session.isValid();
    }

    /**
     * Revokes a specific session (individual device logout).
     */
    @Transactional
    public void revokeCreatorToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            return;
        }
        String tokenHash = hashToken(rawToken.trim());
        sessionRepository.findByTokenHash(tokenHash).ifPresent(session -> {
            session.setRevoked(true);
            sessionRepository.save(session);
        });
    }

    /**
     * Revokes all active Creator sessions across all devices.
     */
    @Transactional
    public int revokeAllCreatorTokens() {
        return sessionRepository.revokeAllActiveSessions();
    }

    /**
     * Cleans up expired sessions from the database.
     */
    @Transactional
    public int cleanupExpiredSessions() {
        return sessionRepository.deleteExpiredSessions(Instant.now());
    }

    /**
     * Computes SHA-256 hex digest of a session token.
     */
    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 message digest algorithm not available", e);
        }
    }
}
