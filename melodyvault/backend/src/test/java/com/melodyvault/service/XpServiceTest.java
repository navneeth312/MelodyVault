package com.melodyvault.service;

import com.melodyvault.dto.RewardClaimRequest;
import com.melodyvault.dto.RewardClaimResponse;
import com.melodyvault.model.UserProfile;
import com.melodyvault.model.XpTransaction;
import com.melodyvault.repository.UserProfileRepository;
import com.melodyvault.repository.XpTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class XpServiceTest {

    @Mock
    private XpTransactionRepository xpRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private XpService xpService;

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = new UserProfile("user-navneeth", "navneeth", "Navneeth (You)", "Bio", 100, 2, 3, 1);
    }

    @Test
    void testClaimReward_Success() {
        RewardClaimRequest req = new RewardClaimRequest();
        req.setId("evt-import-unique-1");
        req.setSource("import");
        req.setAction("Imported 1 new track");
        req.setSongId("track-100");
        req.setAmount(10);

        when(xpRepository.existsById("evt-import-unique-1")).thenReturn(false);
        when(xpRepository.sumTotalXp()).thenReturn(110);
        when(userProfileRepository.findById("user-navneeth")).thenReturn(Optional.of(profile));

        RewardClaimResponse response = xpService.claimReward(req);

        assertTrue(response.isSuccess());
        assertEquals(10, response.getAwardedXp());
        assertEquals(110, response.getTotalXp());
        verify(xpRepository, times(1)).save(any(XpTransaction.class));
    }

    @Test
    void testClaimReward_DuplicateRejected() {
        RewardClaimRequest req = new RewardClaimRequest();
        req.setId("evt-duplicate-id");
        req.setSource("import");
        req.setAction("Duplicate import");
        req.setAmount(10);

        when(xpRepository.existsById("evt-duplicate-id")).thenReturn(true);
        when(xpRepository.sumTotalXp()).thenReturn(100);

        RewardClaimResponse response = xpService.claimReward(req);

        assertFalse(response.isSuccess());
        assertEquals(0, response.getAwardedXp());
        assertTrue(response.getMessage().toLowerCase().contains("duplicate"));
        verify(xpRepository, never()).save(any(XpTransaction.class));
    }

    @Test
    void testCalculateLevel() {
        assertEquals(1, XpService.calculateLevel(0));
        assertEquals(2, XpService.calculateLevel(50));
        assertEquals(3, XpService.calculateLevel(200));
        assertEquals(5, XpService.calculateLevel(800));
    }

    @Test
    void testGetTierTitle() {
        assertEquals("Melody Novice", XpService.getTierTitle(1));
        assertEquals("Acoustic Explorer", XpService.getTierTitle(3));
        assertEquals("Harmonic Collector", XpService.getTierTitle(5));
        assertEquals("Vinyl Virtuoso", XpService.getTierTitle(10));
    }
}

