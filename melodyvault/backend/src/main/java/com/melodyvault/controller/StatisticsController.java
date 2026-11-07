package com.melodyvault.controller;

import com.melodyvault.dto.ListeningStatDto;
import com.melodyvault.service.ListeningStatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@Tag(name = "Listening Statistics", description = "Endpoints for telemetry, listening streaks, and duration analytics")
public class StatisticsController {

    private final ListeningStatService statService;

    public StatisticsController(ListeningStatService statService) {
        this.statService = statService;
    }

    @GetMapping
    @Operation(summary = "Get aggregated listening telemetry and historical summaries")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(statService.getSummary());
    }

    @PostMapping("/listen")
    @Operation(summary = "Record a completed or in-progress listening session")
    public ResponseEntity<Void> recordListen(@RequestBody ListeningStatDto dto) {
        statService.recordListen(dto);
        return ResponseEntity.ok().build();
    }
}

