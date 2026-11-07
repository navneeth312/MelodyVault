package com.melodyvault.controller;

import com.melodyvault.dto.UserProfileDto;
import com.melodyvault.service.AuthService;
import com.melodyvault.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "User Profile", description = "Endpoints for managing user listener profiles and leaderboard opt-in")
public class UserProfileController {

    private final UserProfileService profileService;
    private final AuthService authService;

    public UserProfileController(UserProfileService profileService, AuthService authService) {
        this.profileService = profileService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get listener profile and progress by userId (defaults to Navneeth.U)")
    public ResponseEntity<UserProfileDto> getProfile(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get specific listener profile by userId")
    public ResponseEntity<UserProfileDto> getProfileById(@PathVariable String userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @RequestMapping(method = {RequestMethod.POST, RequestMethod.PUT})
    @Operation(summary = "Save or update personal listener profile information and sync to leaderboard")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "X-Creator-Token", required = false) String creatorTokenHeader,
            @CookieValue(value = "mv_creator_session", required = false) String creatorCookie,
            @RequestBody UserProfileDto dto) {
        
        // Enforce protection for Navneeth.U creator profile
        if (dto != null && "user-navneeth".equalsIgnoreCase(dto.getId())) {
            String activeToken = (creatorTokenHeader != null && !creatorTokenHeader.trim().isEmpty())
                    ? creatorTokenHeader.trim()
                    : creatorCookie;

            if (!authService.isValidCreatorToken(activeToken)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Forbidden",
                        "message", "Cannot modify Navneeth.U (Creator) profile without a verified creator session token"
                ));
            }
        }
        return ResponseEntity.ok(profileService.updateProfile(dto));
    }
}
