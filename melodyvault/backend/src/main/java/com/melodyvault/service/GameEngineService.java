package com.melodyvault.service;

import com.melodyvault.dto.GameInfoDto;
import com.melodyvault.dto.GameQuestionDto;
import com.melodyvault.dto.GameSessionDto;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameEngineService {

    private final QuestionBankService questionBankService;
    private final Map<String, GameSessionDto> activeSessions = new ConcurrentHashMap<>();
    private final List<GameInfoDto> gamesRegistry = new ArrayList<>();

    public GameEngineService(QuestionBankService questionBankService) {
        this.questionBankService = questionBankService;
        initRegistry();
    }

    private void initRegistry() {
        // Category 1: Song Recognition
        gamesRegistry.add(new GameInfoDto("guess_song", "Guess the Song", "Listen to an audio preview snippet and pick the correct track title.", "Song Recognition", "Music", 25, 30, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("guess_intro", "Guess the Intro", "Can you identify a track in the very first 3 seconds?", "Song Recognition", "PlayCircle", 30, 20, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("mystery_track", "Mystery Track", "Uncover clues piece-by-piece to deduce the hidden song.", "Song Recognition", "HelpCircle", 35, 45, List.of("Medium", "Hard", "Expert")));
        gamesRegistry.add(new GameInfoDto("audio_recognition", "Audio Recognition", "Identify songs from distorted or sped-up clips.", "Song Recognition", "Radio", 30, 25, List.of("Easy", "Medium", "Hard")));

        // Category 2: Lyrics & Knowledge
        gamesRegistry.add(new GameInfoDto("guess_lyrics", "Guess the Lyrics", "Complete missing words and famous lyric lines.", "Lyrics & Knowledge", "Mic2", 25, 30, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("complete_title", "Complete the Song Title", "Fill in the blank or unscramble iconic song titles.", "Lyrics & Knowledge", "Type", 20, 25, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("music_trivia", "Music Trivia", "Test your broad knowledge of music history, artists and albums.", "Lyrics & Knowledge", "BrainCircuit", 25, 30, List.of("Easy", "Medium", "Hard", "Expert")));
        gamesRegistry.add(new GameInfoDto("who_is_artist", "Who Is the Artist?", "Match hit tracks to their visionary vocalists and composers.", "Lyrics & Knowledge", "UserCheck", 20, 25, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("guess_album", "Guess the Album", "Connect songs to their original album or film soundtrack.", "Lyrics & Knowledge", "Disc", 20, 30, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("identify_language", "Identify the Language", "Identify multilingual tracks in Tamil, Hindi, English, and Telugu.", "Lyrics & Knowledge", "Languages", 20, 25, List.of("Easy", "Medium", "Hard")));

        // Category 3: Memory & Competition
        gamesRegistry.add(new GameInfoDto("memory_match", "Music Memory Match", "Flip cards and match song titles with corresponding artists.", "Memory & Competition", "Grid", 30, 60, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("song_vs_song", "Song vs Song", "Compare two tracks: who came first, who is longer, who has higher BPM?", "Memory & Competition", "Swords", 20, 25, List.of("Easy", "Medium")));
        gamesRegistry.add(new GameInfoDto("artist_challenge", "Artist Challenge", "Demonstrate mastery over your favorite artist's discography.", "Memory & Competition", "Flame", 30, 30, List.of("Medium", "Hard", "Expert")));
        gamesRegistry.add(new GameInfoDto("genre_challenge", "Genre Challenge", "Accurately sort tracks into their authentic musical genres.", "Memory & Competition", "Tag", 20, 25, List.of("Easy", "Medium", "Hard")));
        gamesRegistry.add(new GameInfoDto("artwork_challenge", "Album Artwork Challenge", "Recognize tracks from zoomed or blurred cover artwork.", "Memory & Competition", "Image", 25, 25, List.of("Easy", "Medium", "Hard")));

        // Category 4: Daily & Special
        gamesRegistry.add(new GameInfoDto("daily_challenge", "Daily Music Challenge", "A refreshed 5-question daily puzzle tailored to today's date.", "Daily & Special", "Calendar", 50, 45, List.of("Standard")));
        gamesRegistry.add(new GameInfoDto("rapid_fire", "Rapid Fire", "Answer as many rapid questions as you can in 60 seconds!", "Daily & Special", "Zap", 40, 60, List.of("Fast")));
        gamesRegistry.add(new GameInfoDto("personality_quiz", "Music Personality Quiz", "Discover your sonic listener persona and archetype.", "Daily & Special", "Sparkles", 20, 0, List.of("Reflective")));
    }

    public List<GameInfoDto> getAllGames() {
        return Collections.unmodifiableList(gamesRegistry);
    }

    public Optional<GameInfoDto> getGameById(String gameId) {
        return gamesRegistry.stream().filter(g -> g.getId().equalsIgnoreCase(gameId)).findFirst();
    }

    public GameSessionDto startSession(String gameId, String difficulty) {
        GameInfoDto info = getGameById(gameId).orElse(gamesRegistry.get(0));
        String diff = (difficulty != null && !difficulty.isBlank()) ? difficulty : "Medium";

        int roundCount = gameId.equals("rapid_fire") ? 8 : (gameId.equals("daily_challenge") ? 5 : 5);
        List<GameQuestionDto> questions = questionBankService.generateQuestionsForGame(gameId, diff, roundCount);

        String sessionId = "sess-" + UUID.randomUUID().toString();
        GameSessionDto session = new GameSessionDto(
                sessionId,
                info.getId(),
                info.getTitle(),
                diff,
                questions,
                Instant.now(),
                questions.size()
        );

        activeSessions.put(sessionId, session);
        return session;
    }

    public Optional<GameSessionDto> getSession(String sessionId) {
        return Optional.ofNullable(activeSessions.get(sessionId));
    }

    public void removeSession(String sessionId) {
        activeSessions.remove(sessionId);
    }
}

