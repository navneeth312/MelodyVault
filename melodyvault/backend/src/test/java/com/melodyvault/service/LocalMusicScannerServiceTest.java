package com.melodyvault.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class LocalMusicScannerServiceTest {

    private final LocalMusicScannerService defaultScanner = new LocalMusicScannerService();

    @Test
    @DisplayName("Directory Discovery: Portable demo music directory resolves and discovers all 19 tracks")
    void shouldDiscoverAll19DemoTracks() {
        File musicDir = defaultScanner.getMusicDirectory();
        assertNotNull(musicDir, "Music directory must not be null");
        assertTrue(musicDir.exists(), "Resolved demo music directory must exist: " + musicDir.getAbsolutePath());

        List<LocalMusicScannerService.DiscoveredTrackDto> tracks = defaultScanner.scanSampleMusicFolder();
        assertNotNull(tracks);
        assertEquals(19, tracks.size(), "Should discover exactly 19 demo tracks in portable demo directory");

        // Verify representative tracks exist
        assertTrue(tracks.stream().anyMatch(t -> t.getTitle().contains("Winner Takes It All") || t.getFilename().contains("ABBA")));
        assertTrue(tracks.stream().anyMatch(t -> t.getTitle().contains("Feel of Baththa") || t.getFilename().contains("Baththa")));
        assertTrue(tracks.stream().anyMatch(t -> t.getTitle().contains("Veezha Veera") || t.getFilename().contains("Veezha")));

        // Verify scanner status consistency
        Map<String, Object> status = defaultScanner.getScannerStatus();
        assertTrue((Boolean) status.get("folderExists"));
        assertEquals(19, status.get("trackCount"));
        assertEquals(musicDir.getAbsolutePath(), status.get("configuredFolder"));
    }

    @Test
    @DisplayName("Audio Access: Retrieves valid audio file for existing track in resolved directory")
    void shouldRetrieveValidAudioFile() {
        File audioFile = defaultScanner.getAudioFile("ABBA - The Winner Takes It All.mp3");
        assertNotNull(audioFile, "Should find ABBA track in demo directory");
        assertTrue(audioFile.exists());
        assertTrue(audioFile.isFile());
        assertTrue(audioFile.length() > 0);
    }

    @Test
    @DisplayName("Artwork Access: Extracts ID3 APIC album artwork for track with embedded art")
    void shouldExtractArtworkForValidTrack() throws IOException {
        LocalMusicScannerService.ExtractedArtwork artwork = defaultScanner.extractArtwork("The Feel of Baththa.mp3");
        assertNotNull(artwork, "Should extract artwork from Baththa track");
        assertNotNull(artwork.getData());
        assertTrue(artwork.getData().length > 0);
        assertNotNull(artwork.getMimeType());
    }

    @Test
    @DisplayName("Missing Directory: Safely returns empty results without crashing when directory does not exist")
    void shouldHandleMissingDirectorySafely() throws IOException {
        File missingDir = new File("non_existent_melodyvault_folder_xyz_123");
        LocalMusicScannerService missingScanner = new LocalMusicScannerService(missingDir);

        Map<String, Object> status = missingScanner.getScannerStatus();
        assertFalse((Boolean) status.get("folderExists"));
        assertEquals(0, status.get("trackCount"));

        List<LocalMusicScannerService.DiscoveredTrackDto> tracks = missingScanner.scanSampleMusicFolder();
        assertNotNull(tracks);
        assertTrue(tracks.isEmpty());

        assertNull(missingScanner.getAudioFile("ABBA - The Winner Takes It All.mp3"));
        assertNull(missingScanner.extractArtwork("ABBA - The Winner Takes It All.mp3"));
    }

    @Test
    @DisplayName("Path Traversal Security: Strictly rejects traversal attempts, slashes, and non-audio extensions")
    void shouldRejectPathTraversalAndInvalidRequests() throws IOException {
        // Path traversal attempts
        assertNull(defaultScanner.getAudioFile("../../../windows/win.ini"));
        assertNull(defaultScanner.getAudioFile("..\\..\\windows\\system.ini"));
        assertNull(defaultScanner.extractArtwork("../../../windows/win.ini"));

        // Nested directory slashes
        assertNull(defaultScanner.getAudioFile("sub/folder/track.mp3"));
        assertNull(defaultScanner.getAudioFile("sub\\folder\\track.mp3"));
        assertNull(defaultScanner.extractArtwork("sub/folder/artwork.jpg"));

        // Null and blank strings
        assertNull(defaultScanner.getAudioFile(null));
        assertNull(defaultScanner.getAudioFile("   "));
        assertNull(defaultScanner.extractArtwork(null));
        assertNull(defaultScanner.extractArtwork(""));

        // Unsupported or dangerous extensions
        assertNull(defaultScanner.getAudioFile("malicious_script.exe"));
        assertNull(defaultScanner.getAudioFile("database.mv.db"));
    }
}
