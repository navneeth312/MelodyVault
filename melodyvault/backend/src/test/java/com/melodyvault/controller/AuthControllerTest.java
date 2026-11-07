package com.melodyvault.controller;

import com.melodyvault.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class AuthControllerTest {

    private AuthService authService;
    private AuthController authController;

    @BeforeEach
    void setUp() {
        authService = Mockito.mock(AuthService.class);
        authController = new AuthController(authService, false);
    }

    @Test
    @DisplayName("Verify creator: Never return session token in JSON response")
    void testVerifyCreatorNeverReturnsTokenInJson() {
        when(authService.isCreatorAuthConfigured()).thenReturn(true);
        when(authService.isRateLimited(anyString())).thenReturn(false);
        when(authService.verifyCreatorPassword("correct_secret")).thenReturn(true);
        when(authService.generateCreatorToken(anyBoolean())).thenReturn("mv_creator_mock_token_123");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        Map<String, Object> body = Map.of("password", "correct_secret", "rememberDevice", true);
        ResponseEntity<Map<String, Object>> result = authController.verifyCreator(body, request, response);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertTrue((Boolean) result.getBody().get("success"));
        assertEquals("user-navneeth", result.getBody().get("userId"));

        // CRITICAL SECURITY ASSERTION: Token must NEVER be present in JSON body
        assertFalse(result.getBody().containsKey("token"), "Session token must NEVER be returned in JSON response body");

        // Verify Set-Cookie header contains HttpOnly cookie
        String setCookieHeader = response.getHeader(HttpHeaders.SET_COOKIE);
        assertNotNull(setCookieHeader);
        assertTrue(setCookieHeader.contains("mv_creator_session=mv_creator_mock_token_123"));
        assertTrue(setCookieHeader.contains("HttpOnly"));
        assertTrue(setCookieHeader.contains("SameSite=Lax"));
    }

    @Test
    @DisplayName("Verify creator: Rejects when creator authentication is not configured (fail closed)")
    void testVerifyCreatorDisabledWhenUnconfigured() {
        when(authService.isCreatorAuthConfigured()).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        ResponseEntity<Map<String, Object>> result = authController.verifyCreator(
                Map.of("password", "any_secret"), request, response);

        assertEquals(HttpStatus.FORBIDDEN, result.getStatusCode());
        assertFalse((Boolean) result.getBody().get("configured"));
    }

    @Test
    @DisplayName("Verify creator: Rate limited after 5 failed attempts")
    void testVerifyCreatorRateLimited() {
        when(authService.isCreatorAuthConfigured()).thenReturn(true);
        when(authService.isRateLimited(anyString())).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        ResponseEntity<Map<String, Object>> result = authController.verifyCreator(
                Map.of("password", "any_secret"), request, response);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, result.getStatusCode());
        assertTrue(result.getBody().get("message").toString().contains("Rate limit"));
    }

    @Test
    @DisplayName("Logout All Devices: Unauthenticated request is rejected with 401 Unauthorized")
    void testLogoutAllUnauthenticatedRejection() {
        when(authService.isValidCreatorToken(null)).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        ResponseEntity<Map<String, Object>> result = authController.logoutAll(null, null, request, response);

        assertEquals(HttpStatus.UNAUTHORIZED, result.getStatusCode());
        assertFalse((Boolean) result.getBody().get("success"));
        verify(authService, never()).revokeAllCreatorTokens();
    }

    @Test
    @DisplayName("Logout All Devices: Authenticated request succeeds and revokes all sessions")
    void testLogoutAllAuthenticatedSuccess() {
        when(authService.isValidCreatorToken("valid_token")).thenReturn(true);
        when(authService.revokeAllCreatorTokens()).thenReturn(3);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        ResponseEntity<Map<String, Object>> result = authController.logoutAll(
                "valid_token", null, request, response);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertTrue((Boolean) result.getBody().get("success"));
        assertEquals(3, result.getBody().get("revokedSessionsCount"));
        verify(authService, times(1)).revokeAllCreatorTokens();
    }
}

