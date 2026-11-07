package com.melodyvault.service;

import com.melodyvault.dto.DailyChallengeDto;
import com.melodyvault.dto.GameQuestionDto;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DailyChallengeService {

    private final QuestionBankService questionBankService;
    private final Map<String, Boolean> completedDates = new ConcurrentHashMap<>();

    public DailyChallengeService(QuestionBankService questionBankService) {
        this.questionBankService = questionBankService;
    }

    public DailyChallengeDto getTodayChallenge() {
        String today = LocalDate.now().toString();
        List<GameQuestionDto> questions = questionBankService.generateQuestionsForGame("daily_challenge", "Standard", 5);

        boolean completed = completedDates.getOrDefault(today, false);

        return new DailyChallengeDto(
                today,
                "Daily Sonic Master Challenge (" + today + ")",
                "Prove your music acumen with today's 5 handpicked challenges across lyrics, sound identification, and history.",
                questions,
                100, // 100 XP daily bonus
                completed
        );
    }

    public void markCompleted(String date) {
        completedDates.put(date, true);
    }
}

