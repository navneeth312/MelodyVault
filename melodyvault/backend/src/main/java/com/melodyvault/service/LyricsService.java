package com.melodyvault.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.melodyvault.dto.SongLyricsDto;
import com.melodyvault.model.SongLyrics;
import com.melodyvault.repository.SongLyricsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

@Service
public class LyricsService {

    private static final Logger log = LoggerFactory.getLogger(LyricsService.class);
    private final SongLyricsRepository lyricsRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public LyricsService(SongLyricsRepository lyricsRepository) {
        this.lyricsRepository = lyricsRepository;
        this.restClient = RestClient.builder()
                .baseUrl("https://lrclib.net")
                .defaultHeader("User-Agent", "MelodyVault/2.0 (github.com/MelodyVault)")
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Transactional(readOnly = true)
    public Optional<SongLyricsDto> getLyrics(String songId, String title, String artist, Integer duration) {
        // 1. Check local DB first
        Optional<SongLyrics> existing = lyricsRepository.findBySongId(songId);
        if (existing.isPresent()) {
            return existing.map(this::toDto);
        }

        // 2. Try match by title & artist
        if (title != null && artist != null) {
            Optional<SongLyrics> byTitleArtist = lyricsRepository.findByTitleIgnoreCaseAndArtistIgnoreCase(title.trim(), artist.trim());
            if (byTitleArtist.isPresent()) {
                return byTitleArtist.map(this::toDto);
            }
        }

        // 3. Try fetch from LRCLIB
        if (title != null && !title.isBlank() && artist != null && !artist.isBlank() && !artist.equalsIgnoreCase("Unknown Artist")) {
            SongLyrics fetched = fetchFromLrclib(songId, title, artist, duration);
            if (fetched != null) {
                lyricsRepository.save(fetched);
                return Optional.of(toDto(fetched));
            }
        }

        // 4. Fallback to builtin curated lyrics if known
        SongLyrics builtin = getBuiltinLyrics(songId, title, artist);
        if (builtin != null) {
            lyricsRepository.save(builtin);
            return Optional.of(toDto(builtin));
        }

        return Optional.empty();
    }

    private SongLyrics fetchFromLrclib(String songId, String title, String artist, Integer duration) {
        try {
            String uri = String.format("/api/get?artist_name=%s&track_name=%s",
                    URLEncoder.encode(artist.trim(), StandardCharsets.UTF_8),
                    URLEncoder.encode(title.trim(), StandardCharsets.UTF_8));
            if (duration != null && duration > 0) {
                uri += "&duration=" + duration;
            }

            ResponseEntity<String> response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .toEntity(String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String plainLyrics = root.hasNonNull("plainLyrics") ? root.get("plainLyrics").asText() : "";
                String syncedLyrics = root.hasNonNull("syncedLyrics") ? root.get("syncedLyrics").asText() : "";

                boolean isSynced = syncedLyrics != null && !syncedLyrics.isBlank();
                if ((plainLyrics != null && !plainLyrics.isBlank()) || isSynced) {
                    return new SongLyrics(
                            songId, title, artist,
                            plainLyrics != null ? plainLyrics : "",
                            syncedLyrics != null ? syncedLyrics : "",
                            "LRCLIB",
                            isSynced
                    );
                }
            }
        } catch (Exception e) {
            log.warn("LRCLIB lookup failed for '{}' by '{}': {}", title, artist, e.getMessage());
        }
        return null;
    }

    @Transactional
    public SongLyricsDto saveOrUpdateLyrics(String songId, String title, String artist, String plainLyrics, String syncedLyrics, String source) {
        SongLyrics lyrics = lyricsRepository.findBySongId(songId)
                .orElse(new SongLyrics(songId, title, artist, plainLyrics, syncedLyrics, source, syncedLyrics != null && !syncedLyrics.isBlank()));

        lyrics.setTitle(title);
        lyrics.setArtist(artist);
        lyrics.setPlainLyrics(plainLyrics != null ? plainLyrics : "");
        lyrics.setSyncedLyrics(syncedLyrics != null ? syncedLyrics : "");
        lyrics.setSynced(lyrics.getSyncedLyrics() != null && !lyrics.getSyncedLyrics().isBlank());
        lyrics.setSource(source != null ? source : "USER_SAVED");
        lyrics.setUpdatedAt(Instant.now());

        SongLyrics saved = lyricsRepository.save(lyrics);
        return toDto(saved);
    }

    private SongLyrics getBuiltinLyrics(String songId, String title, String artist) {
        String cleanTitle = (title != null ? title.toLowerCase() : "");
        String cleanArtist = (artist != null ? artist.toLowerCase() : "");

        if (cleanTitle.contains("winner takes it all") || cleanArtist.contains("abba")) {
            String lrc = """
                    [00:15.20] I don't wanna talk about things we've gone through
                    [00:23.10] Though it's hurting me, now it's history
                    [00:30.80] I've played all my cards and that's what you've done too
                    [00:38.20] Nothing more to say, no more ace to play
                    [00:46.00] The winner takes it all, the loser's standing small
                    [00:54.00] Beside the victory, that's her destiny
                    [01:03.00] I was in your arms, thinking I belonged there
                    [01:10.50] I figured it made sense, building me a fence
                    [01:18.00] Building me a home, thinking I'd be strong there
                    [01:25.80] But I was a fool playing by the rules
                    [01:33.40] The gods may throw a dice, their minds as cold as ice
                    [01:41.20] And someone way down here loses someone dear
                    [01:49.00] The winner takes it all, the loser has to fall
                    [01:56.80] It's simple and it's plain, why should I complain?
                    """;
            return new SongLyrics(songId, "The Winner Takes It All", "ABBA",
                    lrc.replaceAll("\\[\\d+:\\d+\\.\\d+\\]\\s*", ""), lrc, "BUILTIN_CURATED", true);
        } else if (cleanTitle.contains("wildflower") || cleanArtist.contains("billie eilish")) {
            String lrc = """
                    [00:10.00] Things fall apart and time breaks your heart
                    [00:18.00] I wasn't there, but I know
                    [00:25.50] She was your girl, you showed her the world
                    [00:33.20] But did she hold you like I hold you now?
                    [00:41.00] I see her in the back of my mind
                    [00:49.00] Did you cross the line?
                    [00:56.00] You say no one could love you like I do
                    [01:04.00] But every time you look at me
                    [01:12.00] I wonder if you see her wildflower bloom
                    """;
            return new SongLyrics(songId, "WILDFLOWER", "Billie Eilish",
                    lrc.replaceAll("\\[\\d+:\\d+\\.\\d+\\]\\s*", ""), lrc, "BUILTIN_CURATED", true);
        } else if (cleanTitle.contains("hukum") || cleanTitle.contains("thalaivar")) {
            String lrc = """
                    [00:12.00] Hukum... Tiger ka Hukum
                    [00:20.00] Alappara kelappurrom... Thalaivar nerandharam!
                    [00:28.00] Kaatu kulla yaaru raja? Singam thaan da raja!
                    [00:36.00] Thalaivar vandha adhiradi thaan...
                    [00:44.00] Vettai aada vandhuten da, edhiri illa oruvanum!
                    [00:52.00] Ketta payan sir indha Tiger!
                    """;
            return new SongLyrics(songId, "Hukum - Thalaivar Alappara", "Anirudh Ravichander",
                    lrc.replaceAll("\\[\\d+:\\d+\\.\\d+\\]\\s*", ""), lrc, "BUILTIN_CURATED", true);
        } else if (cleanTitle.contains("sailor song") || cleanArtist.contains("gigi perez")) {
            String lrc = """
                    [00:08.00] I saw her in the right light, kissed her in the midnight
                    [00:16.00] Wondering if she'd ever come around
                    [00:24.00] She said 'I want a lover, won't settle for another'
                    [00:32.00] Out on the sea where the waves break down
                    [00:40.00] Oh won't you be my sailor, guiding me home
                    """;
            return new SongLyrics(songId, "Sailor Song", "Gigi Perez",
                    lrc.replaceAll("\\[\\d+:\\d+\\.\\d+\\]\\s*", ""), lrc, "BUILTIN_CURATED", true);
        }

        return null;
    }

    private SongLyricsDto toDto(SongLyrics lyrics) {
        return new SongLyricsDto(
                lyrics.getSongId(),
                lyrics.getTitle(),
                lyrics.getArtist(),
                lyrics.getPlainLyrics(),
                lyrics.getSyncedLyrics(),
                lyrics.getSource(),
                lyrics.isSynced(),
                lyrics.getUpdatedAt()
        );
    }
}

