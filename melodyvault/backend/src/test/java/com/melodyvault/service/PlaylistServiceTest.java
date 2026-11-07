package com.melodyvault.service;

import com.melodyvault.dto.PlaylistDto;
import com.melodyvault.model.Playlist;
import com.melodyvault.repository.PlaylistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaylistServiceTest {

    @Mock
    private PlaylistRepository playlistRepository;

    @InjectMocks
    private PlaylistService playlistService;

    private Playlist playlist;

    @BeforeEach
    void setUp() {
        playlist = new Playlist(
                "pl-1",
                "Ambient Focus",
                "Calm soundscapes",
                "from-purple-600 to-indigo-600",
                new ArrayList<>(List.of("track-1", "track-2"))
        );
    }

    @Test
    void testCreatePlaylist() {
        PlaylistDto input = new PlaylistDto();
        input.setName("New Playlist");
        input.setDescription("A test playlist");
        input.setSongIds(List.of("track-1"));

        when(playlistRepository.save(any(Playlist.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlaylistDto result = playlistService.createPlaylist(input);

        assertNotNull(result);
        assertEquals("New Playlist", result.getName());
        assertEquals(1, result.getSongIds().size());
    }

    @Test
    void testAddSongToPlaylist() {
        when(playlistRepository.findById("pl-1")).thenReturn(Optional.of(playlist));
        when(playlistRepository.save(any(Playlist.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlaylistDto result = playlistService.addSongToPlaylist("pl-1", "track-3");

        assertEquals(3, result.getSongIds().size());
        assertTrue(result.getSongIds().contains("track-3"));
    }

    @Test
    void testRemoveSongFromPlaylist() {
        when(playlistRepository.findById("pl-1")).thenReturn(Optional.of(playlist));
        when(playlistRepository.save(any(Playlist.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlaylistDto result = playlistService.removeSongFromPlaylist("pl-1", "track-1");

        assertEquals(1, result.getSongIds().size());
        assertFalse(result.getSongIds().contains("track-1"));
    }
}

