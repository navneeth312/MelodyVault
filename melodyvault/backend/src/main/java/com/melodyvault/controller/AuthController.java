package com.melodyvault.controller;

import com.melodyvault.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for creator verification, persistent database-backed sessions, and access control")
public class AuthController {

    private final AuthService authService;
    private final boolean cookieSecure;

    public AuthController(
            AuthService authService,
            @Value("${melodyvault.security.cookie-secure:false}") boolean cookieSecure) {
        this.authService = authService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/verify-creator")
    @Operation(summary = "Verify Creator passkey to authenticate as Navneeth.U with optional persistent session")
    public ResponseEntity<Map<String, Object>> verifyCreator(
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request,
            HttpServletResponse servletResponse) {
        
        Map<String, Object> response = new HashMap<>();

        if (!authService.isCreatorAuthConfigured()) {
            response.put("success", false);
            response.put("configured", false);
            response.put("message", "Creator authentication is currently disabled: no CREATOR_PASSWORD configured in environment. The Navneeth.U profile is protected and locked.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        String clientIp = getClientIp(request);
        if (authService.isRateLimited(clientIp)) {
            response.put("success", false);
            response.put("configured", true);
            response.put("message", "Too many failed Creator passkey attempts. Rate limit exceeded; please wait 60 seconds.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
        }

        String password = null;
        boolean rememberDevice = true;

        if (body != null) {
            Object passObj = body.get("password");
            if (passObj instanceof String) {
                password = (String) passObj;
            }
            Object remObj = body.get("rememberDevice");
            if (remObj instanceof Boolean) {
                rememberDevice = (Boolean) remObj;
            }
        }

        if (password != null && authService.verifyCreatorPassword(password)) {
            authService.clearFailedAttempts(clientIp);
            String token = authService.generateCreatorToken(rememberDevice);

            // Configure secure HttpOnly session cookie
            boolean isSecure = cookieSecure || request.isSecure();
            long maxAgeSeconds = rememberDevice ? (30L * 24L * 3600L) : (24L * 3600L);
            ResponseCookie sessionCookie = ResponseCookie.from("mv_creator_session", token)
                    .httpOnly(true)
                    .secure(isSecure)
                    .path("/")
                    .maxAge(maxAgeSeconds)
                    .sameSite("Lax")
                    .build();
            servletResponse.addHeader(HttpHeaders.SET_COOKIE, sessionCookie.toString());

            // Strict security requirement: NEVER return raw token in JSON response!
            response.put("success", true);
            response.put("configured", true);
            response.put("userId", "user-navneeth");
            response.put("displayName", "Navneeth.U");
            response.put("avatar", "/avatars/navneeth_u.jpg");
            response.put("rememberDevice", rememberDevice);
            response.put("message", "Creator authenticated successfully.");
            return ResponseEntity.ok(response);
        } else {
            authService.recordFailedAttempt(clientIp);
            response.put("success", false);
            response.put("configured", true);
            response.put("message", "Invalid Creator passkey. Access restricted to Navneeth.U.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @GetMapping("/session")
    @Operation(summary = "Validate current Creator session from HttpOnly cookie or authorization header")
    public ResponseEntity<Map<String, Object>> getSession(
            @RequestHeader(value = "X-Creator-Token", required = false) String tokenHeader,
            @CookieValue(value = "mv_creator_session", required = false) String tokenCookie) {
        
        Map<String, Object> response = new HashMap<>();
        boolean configured = authService.isCreatorAuthConfigured();
        response.put("configured", configured);

        String activeToken = (tokenHeader != null && !tokenHeader.trim().isEmpty())
                ? tokenHeader.trim()
                : tokenCookie;

        boolean valid = authService.isValidCreatorToken(activeToken);
        response.put("authenticated", valid);
        if (valid) {
            response.put("userId", "user-navneeth");
            response.put("displayName", "Navneeth.U");
            response.put("avatar", "/avatars/navneeth_u.jpg");
            response.put("tag", "Vault Creator & Lead Architect");
        } else {
            response.put("userId", null);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-token")
    @Operation(summary = "Validate an existing Creator session token")
    public ResponseEntity<Map<String, Object>> verifyToken(
            @RequestHeader(value = "X-Creator-Token", required = false) String tokenHeader,
            @CookieValue(value = "mv_creator_session", required = false) String tokenCookie) {
        
        String activeToken = (tokenHeader != null && !tokenHeader.trim().isEmpty())
                ? tokenHeader.trim()
                : tokenCookie;

        Map<String, Object> response = new HashMap<>();
        boolean valid = authService.isValidCreatorToken(activeToken);
        response.put("valid", valid);
        response.put("userId", valid ? "user-navneeth" : null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out current Creator device session")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(value = "X-Creator-Token", required = false) String tokenHeader,
            @CookieValue(value = "mv_creator_session", required = false) String tokenCookie,
            HttpServletRequest request,
            HttpServletResponse servletResponse) {
        
        String activeToken = (tokenHeader != null && !tokenHeader.trim().isEmpty())
                ? tokenHeader.trim()
                : tokenCookie;

        if (activeToken != null) {
            authService.revokeCreatorToken(activeToken);
        }

        boolean isSecure = cookieSecure || request.isSecure();
        ResponseCookie clearCookie = ResponseCookie.from("mv_creator_session", "")
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        servletResponse.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout-all")
    @Operation(summary = "Log out all Creator sessions across all devices (requires active authentication)")
    public ResponseEntity<Map<String, Object>> logoutAll(
            @RequestHeader(value = "X-Creator-Token", required = false) String tokenHeader,
            @CookieValue(value = "mv_creator_session", required = false) String tokenCookie,
            HttpServletRequest request,
            HttpServletResponse servletResponse) {
        
        String activeToken = (tokenHeader != null && !tokenHeader.trim().isEmpty())
                ? tokenHeader.trim()
                : tokenCookie;

        // Security requirement: Protect Logout All Devices so only an authenticated Creator can revoke all Creator sessions
        if (!authService.isValidCreatorToken(activeToken)) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Authentication required to revoke all device sessions.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }

        int revokedCount = authService.revokeAllCreatorTokens();

        boolean isSecure = cookieSecure || request.isSecure();
        ResponseCookie clearCookie = ResponseCookie.from("mv_creator_session", "")
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        servletResponse.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("revokedSessionsCount", revokedCount);
        response.put("message", "All creator device sessions have been revoked.");
        return ResponseEntity.ok(response);
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
