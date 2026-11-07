package com.melodyvault.service;

import com.melodyvault.model.CreatorSession;
import com.melodyvault.repository.CreatorSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthServiceTest {

    private CreatorSessionRepository sessionRepository;
    private AuthService configuredAuthService;
    private AuthService unconfiguredAuthService;
    private final Map<String, CreatorSession> dbStore = new HashMap<>();

    @BeforeEach
    void setUp() {
        dbStore.clear();
        sessionRepository = Mockito.mock(CreatorSessionRepository.class);

        when(sessionRepository.save(any(CreatorSession.class))).thenAnswer(invocation -> {
            CreatorSession s = invocation.getArgument(0);
            dbStore.put(s.getTokenHash(), s);
            return s;
        });

        when(sessionRepository.findByTokenHash(any(String.class))).thenAnswer(invocation -> {
            String hash = invocation.getArgument(0);
            return Optional.ofNullable(dbStore.get(hash));
        });

        when(sessionRepository.revokeAllActiveSessions()).thenAnswer(invocation -> {
            int count = 0;
            for (CreatorSession s : dbStore.values()) {
                if (!s.isRevoked()) {
                    s.setRevoked(true);
                    count++;
                }
            }
            return count;
        });

        configuredAuthService = new AuthService("test_creator_secret_123", sessionRepository);
        unconfiguredAuthService = new AuthService(null, sessionRepository);
    }

    @Test
    @DisplayName("Verify creator password success with configured passkey (constant-time check)")
    void testVerifyCreatorPasswordSuccess() {
        assertTrue(configuredAuthService.isCreatorAuthConfigured());
        assertTrue(configuredAuthService.verifyCreatorPassword("test_creator_secret_123"));
    }

    @Test
    @DisplayName("Verify creator password failure with incorrect passkey")
    void testVerifyCreatorPasswordFailure() {
        assertFalse(configuredAuthService.verifyCreatorPassword("wrongpass"));
        assertFalse(configuredAuthService.verifyCreatorPassword(""));
        assertFalse(configuredAuthService.verifyCreatorPassword(null));
    }

    @Test
    @DisplayName("Fail closed: Unconfigured auth service rejects all passwords and marks not configured")
    void testFailClosedWhenUnconfigured() {
        assertFalse(unconfiguredAuthService.isCreatorAuthConfigured());
        assertFalse(unconfiguredAuthService.verifyCreatorPassword("any_password"));
        assertFalse(unconfiguredAuthService.verifyCreatorPassword(""));
        assertFalse(unconfiguredAuthService.verifyCreatorPassword(null));
    }

    @Test
    @DisplayName("Rate limiting: Client blocked after 5 failed login attempts")
    void testRateLimiting() {
        String clientIp = "192.168.1.100";
        assertFalse(configuredAuthService.isRateLimited(clientIp));

        for (int i = 0; i < 5; i++) {
            configuredAuthService.recordFailedAttempt(clientIp);
        }

        assertTrue(configuredAuthService.isRateLimited(clientIp));

        // Successful login clears failed attempts
        configuredAuthService.clearFailedAttempts(clientIp);
        assertFalse(configuredAuthService.isRateLimited(clientIp));
    }

    @Test
    @DisplayName("Generate and validate creator token: Persists SHA-256 hash in database entity")
    void testCreatorTokenValidation() {
        String rawToken = configuredAuthService.generateCreatorToken(true);
        assertNotNull(rawToken);
        assertTrue(rawToken.startsWith("mv_creator_"));

        // Verify raw token is NOT stored in the database, only SHA-256 hash
        String hash = AuthService.hashToken(rawToken);
        assertEquals(64, hash.length());
        assertNotNull(dbStore.get(hash));
        assertNull(dbStore.get(rawToken)); // raw token must NEVER be stored

        assertTrue(configuredAuthService.isValidCreatorToken(rawToken));
        assertFalse(configuredAuthService.isValidCreatorToken("invalid_token"));
        assertFalse(configuredAuthService.isValidCreatorToken(null));

        // Revoke token
        configuredAuthService.revokeCreatorToken(rawToken);
        assertFalse(configuredAuthService.isValidCreatorToken(rawToken));
    }

    @Test
    @DisplayName("Token Expiry: Normal session expires in 24 hours, Remember Me in 30 days")
    void testTokenExpiryDurations() {
        String normalToken = configuredAuthService.generateCreatorToken(false);
        String rememberToken = configuredAuthService.generateCreatorToken(true);

        CreatorSession normalSession = dbStore.get(AuthService.hashToken(normalToken));
        CreatorSession rememberSession = dbStore.get(AuthService.hashToken(rememberToken));

        assertNotNull(normalSession);
        assertNotNull(rememberSession);

        long normalHours = (normalSession.getExpiresAt().getEpochSecond() - normalSession.getCreatedAt().getEpochSecond()) / 3600;
        long rememberDays = (rememberSession.getExpiresAt().getEpochSecond() - rememberSession.getCreatedAt().getEpochSecond()) / (3600 * 24);

        assertEquals(24, normalHours);
        assertEquals(30, rememberDays);
    }

    @Test
    @DisplayName("Revoke all creator tokens across all devices")
    void testRevokeAllCreatorTokens() {
        String token1 = configuredAuthService.generateCreatorToken(false);
        String token2 = configuredAuthService.generateCreatorToken(true);
        assertTrue(configuredAuthService.isValidCreatorToken(token1));
        assertTrue(configuredAuthService.isValidCreatorToken(token2));

        int revokedCount = configuredAuthService.revokeAllCreatorTokens();
        assertEquals(2, revokedCount);
        assertFalse(configuredAuthService.isValidCreatorToken(token1));
        assertFalse(configuredAuthService.isValidCreatorToken(token2));
    }
}
