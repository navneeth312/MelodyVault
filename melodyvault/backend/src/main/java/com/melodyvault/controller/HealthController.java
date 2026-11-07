package com.melodyvault.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "System Health", description = "Endpoints for telemetry and server diagnostics")
public class HealthController {

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @GetMapping
    @Operation(summary = "Health check endpoint for React frontend to detect Java backend status")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "MelodyVault Java 25 & Spring Boot REST API");
        status.put("version", "1.0.0");
        status.put("activeProfile", activeProfile);
        status.put("javaVersion", System.getProperty("java.version"));
        status.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(status);
    }
}

