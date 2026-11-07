package com.melodyvault.service;

import com.melodyvault.dto.LeaderboardUserDto;
import com.melodyvault.model.LeaderboardEntry;
import com.melodyvault.repository.LeaderboardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LeaderboardServiceTest {

    private LeaderboardRepository repository;
    private LeaderboardService service;

    @BeforeEach
    void setUp() {
        repository = mock(LeaderboardRepository.class);
        when(repository.findByUserId("user-navneeth")).thenReturn(Optional.empty());
        when(repository.save(any(LeaderboardEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new LeaderboardService(repository);
    }

    @Test
    @DisplayName("Leaderboard ranks users strictly in descending order of genuine XP")
    void shouldRankInDescendingXpOrder() {
        List<LeaderboardEntry> list = new ArrayList<>();
        list.add(new LeaderboardEntry("user-navneeth", "Navneeth.U", "/avatars/navneeth_u.jpg", 450, 5, true));
        list.add(new LeaderboardEntry("user-alex", "Alex", "avatar1.png", 320, 4, true));
        list.add(new LeaderboardEntry("user-sam", "Sam", "avatar2.png", 180, 2, true));

        when(repository.findByOptedInTrueOrderByTotalXpDesc()).thenReturn(list);

        List<LeaderboardUserDto> leaderboard = service.getLeaderboard("user-navneeth");
        assertEquals(3, leaderboard.size());

        assertEquals(1, leaderboard.get(0).getRank());
        assertEquals("Navneeth.U", leaderboard.get(0).getDisplayName());
        assertTrue(leaderboard.get(0).isCurrentUser());
        assertEquals(450, leaderboard.get(0).getTotalXp());

        assertEquals(2, leaderboard.get(1).getRank());
        assertEquals("Alex", leaderboard.get(1).getDisplayName());
        assertFalse(leaderboard.get(1).isCurrentUser());

        assertEquals(3, leaderboard.get(2).getRank());
        assertEquals("Sam", leaderboard.get(2).getDisplayName());
    }

    @Test
    @DisplayName("If another user earns more XP, they naturally rank higher (no forced #1)")
    void shouldRankHigherEarnedXpNaturally() {
        List<LeaderboardEntry> list = new ArrayList<>();
        list.add(new LeaderboardEntry("user-challenger", "Challenger Pro", "avatar3.png", 600, 6, true));
        list.add(new LeaderboardEntry("user-navneeth", "Navneeth.U", "/avatars/navneeth_u.jpg", 450, 5, true));

        when(repository.findByOptedInTrueOrderByTotalXpDesc()).thenReturn(list);

        List<LeaderboardUserDto> leaderboard = service.getLeaderboard("user-navneeth");
        assertEquals(1, leaderboard.get(0).getRank());
        assertEquals("Challenger Pro", leaderboard.get(0).getDisplayName());
        assertFalse(leaderboard.get(0).isCurrentUser());

        assertEquals(2, leaderboard.get(1).getRank());
        assertEquals("Navneeth.U", leaderboard.get(1).getDisplayName());
        assertTrue(leaderboard.get(1).isCurrentUser());
    }

    @Test
    @DisplayName("Syncing score updates user entry and returns assigned rank")
    void shouldSyncScoreSuccessfully() {
        when(repository.findByUserId("user-navneeth")).thenReturn(Optional.of(
                new LeaderboardEntry("user-navneeth", "Navneeth.U", "/avatars/navneeth_u.jpg", 200, 3, true)
        ));
        when(repository.findByOptedInTrueOrderByTotalXpDesc()).thenReturn(List.of(
                new LeaderboardEntry("user-navneeth", "Navneeth.U", "/avatars/navneeth_u.jpg", 500, 5, true)
        ));

        LeaderboardUserDto result = service.syncScore("user-navneeth", "Navneeth.U", "/avatars/navneeth_u.jpg", 500, 5, true);
        assertNotNull(result);
        assertEquals(500, result.getTotalXp());
        assertEquals(5, result.getLevel());
        assertEquals(1, result.getRank());
        assertTrue(result.isCurrentUser());
    }
}

