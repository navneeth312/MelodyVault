package com.melodyvault.config;

import com.melodyvault.model.CatalogueTrack;
import com.melodyvault.model.Playlist;
import com.melodyvault.model.UserProfile;
import com.melodyvault.repository.CatalogueTrackRepository;
import com.melodyvault.repository.PlaylistRepository;
import com.melodyvault.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Initializes application database and strictly purges unwanted demo catalogue tracks.
 * Personal local collection tracks in C:\MelodyVault Sample Music are untouched.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CatalogueTrackRepository trackRepository;
    private final PlaylistRepository playlistRepository;
    private final UserProfileRepository profileRepository;

    public DataInitializer(CatalogueTrackRepository trackRepository,
                           PlaylistRepository playlistRepository,
                           UserProfileRepository profileRepository) {
        this.trackRepository = trackRepository;
        this.playlistRepository = playlistRepository;
        this.profileRepository = profileRepository;
    }

    @Override
    public void run(String... args) {
        purgeUnwantedCatalogueTracks();
        seedInitialPlaylists();
        seedUserProfile();
    }

    /**
     * Completely and permanently purges the 6 unwanted tracks from database:
     * 1. Canon in D Major
     * 2. Clair de Lune
     * 3. Gymnopédie No. 1
     * 4. Prelude in C Major (BWV 846)
     * 5. The Four Seasons: Spring (Allegro)
     * 6. Moonlight Sonata (Adagio sostenuto)
     */
    private void purgeUnwantedCatalogueTracks() {
        List<String> unwantedIds = Arrays.asList(
                "cat-track-1", "cat-track-2", "cat-track-3",
                "cat-track-4", "cat-track-5", "cat-track-6"
        );
        for (String id : unwantedIds) {
            if (trackRepository.existsById(id)) {
                trackRepository.deleteById(id);
                log.info("Purged unwanted catalogue track ID: {}", id);
            }
        }

        List<String> unwantedTitles = Arrays.asList(
                "Canon in D Major",
                "Clair de Lune",
                "Gymnopédie No. 1",
                "Gymnopedie No. 1",
                "Prelude in C Major (BWV 846)",
                "Prelude in C Major",
                "The Four Seasons: Spring (Allegro)",
                "The Four Seasons: Spring",
                "Moonlight Sonata (Adagio sostenuto)",
                "Moonlight Sonata"
        );

        for (CatalogueTrack track : trackRepository.findAll()) {
            boolean matches = unwantedTitles.stream()
                    .anyMatch(t -> t.equalsIgnoreCase(track.getTitle()) || track.getTitle().toLowerCase().contains(t.toLowerCase()));
            if (matches) {
                trackRepository.delete(track);
                log.info("Purged unwanted catalogue track by title: {}", track.getTitle());
            }
        }

        // Clean any playlist songId references
        for (Playlist playlist : playlistRepository.findAll()) {
            if (playlist.getSongIds() != null && !playlist.getSongIds().isEmpty()) {
                List<String> cleaned = playlist.getSongIds().stream()
                        .filter(sid -> !unwantedIds.contains(sid))
                        .toList();
                if (cleaned.size() != playlist.getSongIds().size()) {
                    playlist.setSongIds(cleaned);
                    playlistRepository.save(playlist);
                    log.info("Cleaned unwanted track references from playlist: {}", playlist.getName());
                }
            }
        }
    }

    private void seedInitialPlaylists() {
        if (playlistRepository.count() > 0) return;

        List<Playlist> seedPlaylists = Arrays.asList(
                new Playlist(
                        "pl-favorites-1",
                        "Favorite Vault Anthems",
                        "Personal collection favorites and high-rotation tracks.",
                        "from-purple-600 via-indigo-600 to-violet-700",
                        Collections.emptyList()
                ),
                new Playlist(
                        "pl-focus-2",
                        "Midnight Focus & Flow",
                        "Atmospheric harmonies and calm instrumental soundscapes.",
                        "from-violet-700 via-purple-800 to-slate-900",
                        Collections.emptyList()
                )
        );

        playlistRepository.saveAll(seedPlaylists);
        log.info("Successfully seeded initial clean playlists.");
    }

    private void seedUserProfile() {
        if (profileRepository.existsById("user-navneeth")) return;

        UserProfile profile = new UserProfile(
                "user-navneeth",
                "navneeth",
                "Navneeth (You)",
                "Curating pristine personal music collections with lossless audio in MelodyVault.",
                0,
                1,
                1,
                0
        );
        profileRepository.save(profile);
        log.info("Successfully initialized Navneeth listener profile.");
    }
}
