package com.melodyvault.controller;

import com.melodyvault.dto.UserProfileDto;
import com.melodyvault.service.AuthService;
import com.melodyvault.service.LeaderboardService;
import com.melodyvault.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class VisitorIsolationSecurityTest {

    private AuthService authService;
    private UserProfileService profileService;
    private LeaderboardService leaderboardService;
    private UserProfileController profileController;
    private LeaderboardController leaderboardController;

    @BeforeEach
    void setUp() {
        authService = Mockito.mock(AuthService.class);
        profileService = Mockito.mock(UserProfileService.class);
        leaderboardService = Mockito.mock(LeaderboardService.class);

        profileController = new UserProfileController(profileService, authService);
        leaderboardController = new LeaderboardController(leaderboardService, authService);
    }

    @Test
    @DisplayName("Visitor Isolation: Visitor attempting to modify Navneeth.U creator profile is rejected with 403 Forbidden")
    void testVisitorCannotModifyCreatorProfile() {
        when(authService.isValidCreatorToken(null)).thenReturn(false);

        UserProfileDto creatorDto = new UserProfileDto();
        creatorDto.setId("user-navneeth");
        creatorDto.setDisplayName("Fake Navneeth");

        ResponseEntity<?> response = profileController.updateProfile(null, null, creatorDto);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(profileService, never()).updateProfile(any());
    }

    @Test
    @DisplayName("Visitor Isolation: Authenticated Creator can modify Navneeth.U profile")
    void testAuthenticatedCreatorCanModifyProfile() {
        when(authService.isValidCreatorToken("valid_cookie_token")).thenReturn(true);

        UserProfileDto creatorDto = new UserProfileDto();
        creatorDto.setId("user-navneeth");
        creatorDto.setDisplayName("Navneeth.U");

        when(profileService.updateProfile(any())).thenReturn(creatorDto);

        ResponseEntity<?> response = profileController.updateProfile("valid_cookie_token", null, creatorDto);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(profileService, times(1)).updateProfile(any());
    }

    @Test
    @DisplayName("Visitor Isolation: Visitor can freely manage their own independent profile")
    void testVisitorCanManageOwnProfile() {
        UserProfileDto visitorDto = new UserProfileDto();
        visitorDto.setId("user-visitor-42");
        visitorDto.setDisplayName("Sarah Chen");

        when(profileService.updateProfile(any())).thenReturn(visitorDto);

        ResponseEntity<?> response = profileController.updateProfile(null, null, visitorDto);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(profileService, times(1)).updateProfile(any());
    }

    @Test
    @DisplayName("Visitor Isolation: Visitor attempting to sync score as user-navneeth is rejected with 403 Forbidden")
    void testVisitorCannotImpersonateCreatorOnLeaderboard() {
        when(authService.isValidCreatorToken(null)).thenReturn(false);

        Map<String, Object> payload = Map.of(
                "userId", "user-navneeth",
                "displayName", "Navneeth Impersonator",
                "totalXp", 99999
        );

        ResponseEntity<?> response = leaderboardController.syncScore(null, null, payload);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(leaderboardService, never()).syncScore(any(), any(), any(), anyInt(), anyInt(), anyBoolean());
    }
}

