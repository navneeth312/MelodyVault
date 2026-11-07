package com.melodyvault.service;

import com.melodyvault.dto.GameInfoDto;
import com.melodyvault.dto.GameSessionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class GameEngineServiceTest {

    private QuestionBankService questionBankService;
    private GameEngineService gameEngineService;

    @BeforeEach
    void setUp() {
        questionBankService = Mockito.mock(QuestionBankService.class);
        when(questionBankService.generateQuestionsForGame(anyString(), anyString(), anyInt()))
                .thenReturn(Collections.emptyList());
        gameEngineService = new GameEngineService(questionBankService);
    }

    @Test
    @DisplayName("Should contain all 18 music games")
    void shouldContainAll18Games() {
        List<GameInfoDto> games = gameEngineService.getAllGames();
        assertEquals(18, games.size(), "Should register exactly 18 distinct games");

        Set<String> categories = games.stream().map(GameInfoDto::getCategory).collect(Collectors.toSet());
        assertTrue(categories.contains("Song Recognition"));
        assertTrue(categories.contains("Lyrics & Knowledge"));
        assertTrue(categories.contains("Memory & Competition"));
        assertTrue(categories.contains("Daily & Special"));
    }

    @Test
    @DisplayName("Should start session and track active session")
    void shouldStartSession() {
        GameSessionDto session = gameEngineService.startSession("guess_song", "Hard");
        assertNotNull(session);
        assertNotNull(session.getSessionId());
        assertEquals("guess_song", session.getGameId());
        assertEquals("Hard", session.getDifficulty());

        assertTrue(gameEngineService.getSession(session.getSessionId()).isPresent());
        gameEngineService.removeSession(session.getSessionId());
        assertFalse(gameEngineService.getSession(session.getSessionId()).isPresent());
    }
}

