package com.melodyvault.service;

import com.melodyvault.dto.CatalogueTrackDto;
import com.melodyvault.model.CatalogueTrack;
import com.melodyvault.repository.CatalogueTrackRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogueServiceTest {

    @Mock
    private CatalogueTrackRepository trackRepository;

    @InjectMocks
    private CatalogueService catalogueService;

    private CatalogueTrack sampleTrack;

    @BeforeEach
    void setUp() {
        sampleTrack = new CatalogueTrack(
                "cat-test-1",
                "Symphonic Movement Opus 1",
                "Classical Archive Ensemble",
                "Archive Classics",
                "Classical",
                "Instrumental",
                304,
                1905,
                "https://images.unsplash.com/test",
                "/audio/test.wav",
                "Public Domain",
                "Attribution text",
                "Lyrics text"
        );
    }

    @Test
    void testGetAllTracks() {
        when(trackRepository.findAll()).thenReturn(List.of(sampleTrack));

        List<CatalogueTrackDto> result = catalogueService.getAllTracks();

        assertEquals(1, result.size());
        assertEquals("Symphonic Movement Opus 1", result.get(0).getTitle());
        assertEquals("Classical Archive Ensemble", result.get(0).getArtist());
        assertTrue(result.get(0).isPlayable());
    }

    @Test
    void testGetTrackById_Found() {
        when(trackRepository.findById("cat-test-1")).thenReturn(Optional.of(sampleTrack));

        CatalogueTrackDto result = catalogueService.getTrackById("cat-test-1");

        assertNotNull(result);
        assertEquals("cat-test-1", result.getId());
        assertEquals("Symphonic Movement Opus 1", result.getTitle());
    }

    @Test
    void testSearchTracks_ByQuery() {
        when(trackRepository.searchTracks("archive")).thenReturn(List.of(sampleTrack));

        List<CatalogueTrackDto> result = catalogueService.searchTracks("archive", "all", "all");

        assertEquals(1, result.size());
        assertEquals("Classical Archive Ensemble", result.get(0).getArtist());
    }
}

