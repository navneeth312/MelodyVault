package com.melodyvault.controller;

import com.melodyvault.dto.RewardClaimRequest;
import com.melodyvault.dto.RewardClaimResponse;
import com.melodyvault.dto.XpTransactionDto;
import com.melodyvault.service.XpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/xp")
@Tag(name = "Anti-Farming XP Engine", description = "Endpoints for claiming verified XP rewards, reviewing immutable ledgers, and level progression")
public class XpController {

    private final XpService xpService;

    public XpController(XpService xpService) {
        this.xpService = xpService;
    }

    @GetMapping("/ledger")
    @Operation(summary = "Get the persistent, immutable XP transaction history ledger")
    public ResponseEntity<List<XpTransactionDto>> getLedger() {
        return ResponseEntity.ok(xpService.getLedger());
    }

    @GetMapping("/summary")
    @Operation(summary = "Get current XP total, calculated level, tier title, and daily listening cap tracking")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(xpService.getSummary());
    }

    @PostMapping("/reward")
    @Operation(summary = "Claim a validated XP reward (enforces duplicate prevention and 150 XP/day listening cap)")
    public ResponseEntity<RewardClaimResponse> claimReward(@Valid @RequestBody RewardClaimRequest request) {
        return ResponseEntity.ok(xpService.claimReward(request));
    }
}

