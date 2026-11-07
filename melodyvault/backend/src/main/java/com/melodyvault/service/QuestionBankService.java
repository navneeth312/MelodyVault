package com.melodyvault.service;

import com.melodyvault.dto.CatalogueTrackDto;
import com.melodyvault.dto.GameQuestionDto;
import com.melodyvault.service.LocalMusicScannerService.DiscoveredTrackDto;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class QuestionBankService {

    private final CatalogueService catalogueService;
    private final LocalMusicScannerService localMusicScannerService;

    public QuestionBankService(CatalogueService catalogueService, LocalMusicScannerService localMusicScannerService) {
        this.catalogueService = catalogueService;
        this.localMusicScannerService = localMusicScannerService;
    }

    public List<GameQuestionDto> generateQuestionsForGame(String gameId, String difficulty, int count) {
        List<GameQuestionDto> questions = new ArrayList<>();
        List<DiscoveredTrackDto> localTracks = localMusicScannerService.scanSampleMusicFolder();
        List<CatalogueTrackDto> catalogueTracks = catalogueService.getAllTracks();

        Random random = new Random();

        switch (gameId) {
            case "guess_song":
            case "guess_intro":
            case "audio_recognition":
                questions.addAll(buildAudioRecognitionQuestions(localTracks, catalogueTracks, gameId, difficulty, count, random));
                break;

            case "guess_lyrics":
                questions.addAll(buildLyricsQuestions(count, random));
                break;

            case "complete_title":
                questions.addAll(buildCompleteTitleQuestions(localTracks, count, random));
                break;

            case "music_trivia":
                questions.addAll(buildTriviaQuestions(count, random));
                break;

            case "who_is_artist":
                questions.addAll(buildWhoIsArtistQuestions(localTracks, catalogueTracks, count, random));
                break;

            case "guess_album":
                questions.addAll(buildGuessAlbumQuestions(localTracks, count, random));
                break;

            case "identify_language":
                questions.addAll(buildIdentifyLanguageQuestions(localTracks, count, random));
                break;

            case "artwork_challenge":
                questions.addAll(buildArtworkChallengeQuestions(localTracks, count, random));
                break;

            case "genre_challenge":
                questions.addAll(buildGenreChallengeQuestions(localTracks, count, random));
                break;

            case "song_vs_song":
                questions.addAll(buildSongVsSongQuestions(localTracks, count, random));
                break;

            case "mystery_track":
                questions.addAll(buildMysteryTrackQuestions(localTracks, count, random));
                break;

            case "rapid_fire":
                questions.addAll(buildRapidFireQuestions(localTracks, count, random));
                break;

            case "personality_quiz":
                questions.addAll(buildPersonalityQuizQuestions());
                break;

            case "artist_challenge":
                questions.addAll(buildArtistChallengeQuestions(localTracks, count, random));
                break;

            case "memory_match":
                questions.addAll(buildMemoryMatchQuestions(localTracks, count, random));
                break;

            default:
                questions.addAll(buildAudioRecognitionQuestions(localTracks, catalogueTracks, "guess_song", difficulty, count, random));
                break;
        }

        return questions;
    }

    private List<GameQuestionDto> buildAudioRecognitionQuestions(List<DiscoveredTrackDto> tracks, List<CatalogueTrackDto> catalogue,
                                                                 String gameId, String difficulty, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        if (tracks.isEmpty() && catalogue.isEmpty()) return list;

        List<String> allTitles = new ArrayList<>();
        for (DiscoveredTrackDto t : tracks) allTitles.add(t.getTitle());
        for (CatalogueTrackDto c : catalogue) allTitles.add(c.getTitle());

        int num = Math.min(count, tracks.size());
        List<DiscoveredTrackDto> shuffled = new ArrayList<>(tracks);
        Collections.shuffle(shuffled, rand);

        for (int i = 0; i < num; i++) {
            DiscoveredTrackDto track = shuffled.get(i);
            String correct = track.getTitle();

            Set<String> optionsSet = new LinkedHashSet<>();
            optionsSet.add(correct);

            // Add 3 distractors
            List<String> pool = new ArrayList<>(allTitles);
            pool.remove(correct);
            Collections.shuffle(pool, rand);
            for (String title : pool) {
                if (optionsSet.size() >= 4) break;
                optionsSet.add(title);
            }

            List<String> options = new ArrayList<>(optionsSet);
            Collections.shuffle(options, rand);
            int correctIndex = options.indexOf(correct);

            String prompt = gameId.equals("guess_intro")
                    ? "Listen to the opening preview! What song is this?"
                    : "Listen to the audio clip and identify the song title:";

            list.add(new GameQuestionDto(
                    "q-" + UUID.randomUUID().toString().substring(0, 8),
                    gameId,
                    prompt,
                    track.getAudioUrl(),
                    "audio",
                    options,
                    correctIndex,
                    "'" + correct + "' is performed by " + track.getArtist() + " from album " + track.getAlbum(),
                    difficulty,
                    difficulty.equalsIgnoreCase("hard") ? 30 : 20
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildLyricsQuestions(int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> pool = List.of(
                new String[]{"The winner takes it all, the loser's standing ...", "small", "tall", "proud", "free", "small", "From ABBA's legendary hit 'The Winner Takes It All' (1980)."},
                new String[]{"Did she hold you like I hold you now? I wonder if you see her ... bloom", "wildflower", "sunflower", "rose garden", "morning star", "wildflower", "From Billie Eilish's introspective ballad 'WILDFLOWER' (2024)."},
                new String[]{"Kaatu kulla yaaru raja? ... thaan da raja!", "Singam", "Puli", "Yaana", "Siruthai", "Singam", "From Anirudh Ravichander's blockbuster track 'Hukum - Thalaivar Alappara'."},
                new String[]{"She said 'I want a lover, won't settle for another' out on the ... where the waves break down", "sea", "ocean", "river", "shore", "sea", "From Gigi Perez's viral indie single 'Sailor Song'."},
                new String[]{"I've played all my cards and that's what you've done too, nothing more to say, no more ... to play", "ace", "hand", "game", "card", "ace", "From ABBA's 'The Winner Takes It All'."}
        );

        for (int i = 0; i < Math.min(count, pool.size()); i++) {
            String[] q = pool.get(i);
            List<String> options = new ArrayList<>(List.of(q[1], q[2], q[3], q[4]));
            Collections.shuffle(options, rand);
            int correctIdx = options.indexOf(q[5]);

            list.add(new GameQuestionDto(
                    "lyr-" + i,
                    "guess_lyrics",
                    q[0],
                    null,
                    "lyrics",
                    options,
                    correctIdx,
                    q[6],
                    "medium",
                    25
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildCompleteTitleQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> titleItems = List.of(
                new String[]{"Hukum - Thalaivar ...", "Alappara", "Jailer", "Vettaiyan", "Kaaval", "Alappara", "Full title is 'Hukum - Thalaivar Alappara' by Anirudh Ravichander."},
                new String[]{"Beach Weather - Sex, Drugs, ...", "Etc.", "Rock 'n' Roll", "Love", "Money", "Etc.", "Beach Weather's viral indie alt hit is titled 'Sex, Drugs, Etc.'"},
                new String[]{"The Winner ... It All", "Takes", "Loses", "Gives", "Has", "Takes", "ABBA's masterpiece is 'The Winner Takes It All'."},
                new String[]{"One Sun ... (From Jailer 2)", "One Moon", "One Star", "Two Skies", "One Light", "One Moon", "Composed for Jailer 2 soundtrack."},
                new String[]{"Sidney Gish - Impostor ...", "Syndrome", "Complex", "Phobia", "Fighter", "Syndrome", "Sidney Gish's clever indie track is 'Impostor Syndrome'."}
        );

        for (int i = 0; i < Math.min(count, titleItems.size()); i++) {
            String[] item = titleItems.get(i);
            List<String> opts = new ArrayList<>(List.of(item[1], item[2], item[3], item[4]));
            Collections.shuffle(opts, rand);
            int correctIdx = opts.indexOf(item[5]);

            list.add(new GameQuestionDto(
                    "ct-" + i,
                    "complete_title",
                    "Complete the song title: " + item[0],
                    null,
                    "text",
                    opts,
                    correctIdx,
                    item[6],
                    "easy",
                    15
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildTriviaQuestions(int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> trivia = List.of(
                new String[]{"Which legendary Swedish pop group recorded 'The Winner Takes It All' in 1980?", "ABBA", "Boney M", "Roxette", "Ace of Base", "ABBA", "ABBA was formed in Stockholm in 1972 by Agnetha, Björn, Benny, and Anni-Frid."},
                new String[]{"Which mega-composer created the electrifying score for Jailer and Leo?", "Anirudh Ravichander", "A.R. Rahman", "Harris Jayaraj", "Yuvan Shankar Raja", "Anirudh Ravichander", "Anirudh is celebrated as the Rockstar of South Indian contemporary cinema soundtracks."},
                new String[]{"Which Billie Eilish album features the ballad 'WILDFLOWER'?", "HIT ME HARD AND SOFT", "Happier Than Ever", "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?", "Don't Smile at Me", "HIT ME HARD AND SOFT", "'HIT ME HARD AND SOFT' was released in May 2024 to critical acclaim."},
                new String[]{"In digital audio, what does the MP3 ID3 'APIC' frame store?", "Attached Picture (Album Cover)", "Audio Pitch Controller", "Artist Profile Index", "Album Producer Information", "Attached Picture (Album Cover)", "APIC is the ID3v2 standard tag frame for embedding PNG/JPEG artwork directly into audio files."}
        );

        for (int i = 0; i < Math.min(count, trivia.size()); i++) {
            String[] item = trivia.get(i);
            List<String> opts = new ArrayList<>(List.of(item[1], item[2], item[3], item[4]));
            Collections.shuffle(opts, rand);
            int correctIdx = opts.indexOf(item[5]);

            list.add(new GameQuestionDto(
                    "triv-" + i,
                    "music_trivia",
                    item[0],
                    null,
                    "text",
                    opts,
                    correctIdx,
                    item[6],
                    "medium",
                    20
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildWhoIsArtistQuestions(List<DiscoveredTrackDto> tracks, List<CatalogueTrackDto> catalogue, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> artistPairs = List.of(
                new String[]{"WILDFLOWER", "Billie Eilish", "Olivia Rodrigo", "Taylor Swift", "Lana Del Rey"},
                new String[]{"The Winner Takes It All", "ABBA", "Fleetwood Mac", "Blondie", "The Cranberries"},
                new String[]{"Hukum - Thalaivar Alappara", "Anirudh Ravichander", "G.V. Prakash", "Santhosh Narayanan", "D. Imman"},
                new String[]{"Sex, Drugs, Etc.", "Beach Weather", "The Neighbourhood", "Arctic Monkeys", "Glass Animals"},
                new String[]{"Sailor Song", "Gigi Perez", "Clairo", "Phoebe Bridgers", "Gracie Abrams"}
        );

        for (int i = 0; i < Math.min(count, artistPairs.size()); i++) {
            String[] pair = artistPairs.get(i);
            String correct = pair[1];
            List<String> opts = new ArrayList<>(List.of(pair[1], pair[2], pair[3], pair[4]));
            Collections.shuffle(opts, rand);
            int correctIdx = opts.indexOf(correct);

            list.add(new GameQuestionDto(
                    "art-" + i,
                    "who_is_artist",
                    "Who is the artist behind the song '" + pair[0] + "'?",
                    null,
                    "text",
                    opts,
                    correctIdx,
                    "'" + pair[0] + "' is performed by " + correct + ".",
                    "easy",
                    15
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildGuessAlbumQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> albumPairs = List.of(
                new String[]{"One Sun One Moon", "Jailer 2", "Leo", "Vikram", "Kaithi", "Jailer 2"},
                new String[]{"The Winner Takes It All", "Super Trouper", "Arrival", "Voulez-Vous", "The Visitors", "Super Trouper"},
                new String[]{"WILDFLOWER", "HIT ME HARD AND SOFT", "Happier Than Ever", "Guitar Songs", "Don't Smile at Me", "HIT ME HARD AND SOFT"},
                new String[]{"Sex, Drugs, Etc.", "Pineapple Sunrise", "Chit Chat", "Basement", "Wildfire", "Pineapple Sunrise"}
        );

        for (int i = 0; i < Math.min(count, albumPairs.size()); i++) {
            String[] pair = albumPairs.get(i);
            String correct = pair[5];
            List<String> opts = new ArrayList<>(List.of(pair[1], pair[2], pair[3], pair[4]));
            Collections.shuffle(opts, rand);
            int correctIdx = opts.indexOf(correct);

            list.add(new GameQuestionDto(
                    "alb-" + i,
                    "guess_album",
                    "Which album or soundtrack features the track '" + pair[0] + "'?",
                    null,
                    "text",
                    opts,
                    correctIdx,
                    "'" + pair[0] + "' is from the album/soundtrack '" + correct + "'.",
                    "medium",
                    20
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildIdentifyLanguageQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> langPairs = List.of(
                new String[]{"Hukum - Thalaivar Alappara", "Tamil", "Telugu", "Malayalam", "Kannada", "Tamil"},
                new String[]{"Arz Kiya Hai (Coke Studio Bharat)", "Hindi", "Punjabi", "Urdu", "Bengali", "Hindi"},
                new String[]{"Pavazha Malli", "Tamil", "Hindi", "Telugu", "English", "Tamil"},
                new String[]{"The Winner Takes It All", "English", "Swedish", "French", "German", "English"},
                new String[]{"Kehne Lagaa - Rushil Aswal", "Hindi", "Gujarati", "Marathi", "Bengali", "Hindi"}
        );

        for (int i = 0; i < Math.min(count, langPairs.size()); i++) {
            String[] pair = langPairs.get(i);
            String correct = pair[5];
            List<String> opts = new ArrayList<>(List.of(pair[1], pair[2], pair[3], pair[4]));
            Collections.shuffle(opts, rand);
            int correctIdx = opts.indexOf(correct);

            list.add(new GameQuestionDto(
                    "lang-" + i,
                    "identify_language",
                    "What primary language is the song '" + pair[0] + "' sung in?",
                    null,
                    "text",
                    opts,
                    correctIdx,
                    "'" + pair[0] + "' is performed in " + correct + ".",
                    "easy",
                    15
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildArtworkChallengeQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<DiscoveredTrackDto> withArt = tracks.stream().filter(DiscoveredTrackDto::isHasArtwork).toList();
        if (withArt.isEmpty()) return list;

        int num = Math.min(count, withArt.size());
        List<DiscoveredTrackDto> shuffled = new ArrayList<>(withArt);
        Collections.shuffle(shuffled, rand);

        for (int i = 0; i < num; i++) {
            DiscoveredTrackDto track = shuffled.get(i);
            String correct = track.getTitle();

            Set<String> opts = new LinkedHashSet<>();
            opts.add(correct);
            List<DiscoveredTrackDto> pool = new ArrayList<>(tracks);
            Collections.shuffle(pool, rand);
            for (DiscoveredTrackDto dt : pool) {
                if (opts.size() >= 4) break;
                opts.add(dt.getTitle());
            }

            List<String> options = new ArrayList<>(opts);
            Collections.shuffle(options, rand);
            int correctIdx = options.indexOf(correct);

            list.add(new GameQuestionDto(
                    "artw-" + i,
                    "artwork_challenge",
                    "Identify the song from this embedded album artwork:",
                    track.getArtworkUrl(),
                    "image",
                    options,
                    correctIdx,
                    "This cover artwork belongs to '" + correct + "' by " + track.getArtist(),
                    "medium",
                    25
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildGenreChallengeQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> genrePairs = List.of(
                new String[]{"Beach Weather - Sex, Drugs, Etc.", "Alternative / Indie Rock", "Carnatic Classical", "Electronic Dance", "Country", "Alternative / Indie Rock"},
                new String[]{"Hukum - Thalaivar Alappara", "Kollywood Mass Soundtrack", "Synthwave", "Heavy Metal", "Reggae", "Kollywood Mass Soundtrack"},
                new String[]{"The Winner Takes It All", "Classic Pop / Disco", "Death Metal", "Hip Hop", "Dubstep", "Classic Pop / Disco"},
                new String[]{"Arz Kiya Hai", "Indie Indian Folk / Fusion", "Opera", "Hard Rock", "Ska", "Indie Indian Folk / Fusion"}
        );

        for (int i = 0; i < Math.min(count, genrePairs.size()); i++) {
            String[] pair = genrePairs.get(i);
            String correct = pair[5];
            List<String> opts = new ArrayList<>(List.of(pair[1], pair[2], pair[3], pair[4]));
            Collections.shuffle(opts, rand);
            int correctIdx = opts.indexOf(correct);

            list.add(new GameQuestionDto(
                    "gen-" + i,
                    "genre_challenge",
                    "What genre best describes '" + pair[0] + "'?",
                    null,
                    "text",
                    opts,
                    correctIdx,
                    "'" + pair[0] + "' falls under " + correct + ".",
                    "easy",
                    15
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildSongVsSongQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> comparisons = List.of(
                new String[]{"Which song was released EARLIER?", "The Winner Takes It All (1980)", "WILDFLOWER (2024)", "The Winner Takes It All (1980)", "ABBA released 'The Winner Takes It All' in 1980, 44 years before Billie Eilish's 'WILDFLOWER'."},
                new String[]{"Which track has a LONGER duration?", "Magale (~5:12)", "Roddy Theme (~1:45)", "Magale (~5:12)", "Magale is an extensive soulful melody over 5 minutes long."},
                new String[]{"Which artist has produced music for Rajinikanth movies?", "Anirudh Ravichander", "Billie Eilish", "Anirudh Ravichander", "Anirudh scored Petta, Darbar, and Jailer."}
        );

        for (int i = 0; i < Math.min(count, comparisons.size()); i++) {
            String[] item = comparisons.get(i);
            List<String> opts = List.of(item[1], item[2]);
            int correctIdx = opts.indexOf(item[3]);

            list.add(new GameQuestionDto(
                    "vs-" + i,
                    "song_vs_song",
                    item[0],
                    null,
                    "text",
                    opts,
                    correctIdx,
                    item[4],
                    "medium",
                    20
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildMysteryTrackQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        List<String[]> mysteries = List.of(
                new String[]{"Clues: 1. Swedish 4-piece pop band. 2. Released in 1980. 3. Theme of heartbreak and divorce.", "The Winner Takes It All", "Dancing Queen", "Mamma Mia", "Waterloo", "The Winner Takes It All"},
                new String[]{"Clues: 1. Sung by Billie Eilish. 2. Produced by FINNEAS. 3. Track 4 on 'HIT ME HARD AND SOFT'.", "WILDFLOWER", "CHIHIRO", "LUNCH", "BIRDS OF A FEATHER", "WILDFLOWER"},
                new String[]{"Clues: 1. Composed by Anirudh. 2. Stars 'Superstar' Rajinikanth. 3. Catchphrase: 'Tiger ka Hukum'.", "Hukum - Thalaivar Alappara", "Naa Ready", "Badass", "Kaavaalaa", "Hukum - Thalaivar Alappara"}
        );

        for (int i = 0; i < Math.min(count, mysteries.size()); i++) {
            String[] item = mysteries.get(i);
            List<String> opts = new ArrayList<>(List.of(item[1], item[2], item[3], item[4]));
            Collections.shuffle(opts, rand);
            int correctIdx = opts.indexOf(item[5]);

            list.add(new GameQuestionDto(
                    "myst-" + i,
                    "mystery_track",
                    item[0],
                    null,
                    "text",
                    opts,
                    correctIdx,
                    "The mystery track is '" + item[5] + "'.",
                    "hard",
                    30
            ));
        }
        return list;
    }

    private List<GameQuestionDto> buildRapidFireQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> all = new ArrayList<>();
        all.addAll(buildTriviaQuestions(5, rand));
        all.addAll(buildLyricsQuestions(5, rand));
        Collections.shuffle(all, rand);
        return all.subList(0, Math.min(count, all.size()));
    }

    private List<GameQuestionDto> buildPersonalityQuizQuestions() {
        return List.of(
                new GameQuestionDto("pq-1", "personality_quiz", "What is your primary mood when you put your headphones on?",
                        null, "text", List.of("Energized & ready to conquer the day", "Reflective, mellow & sentimental", "Analytical & focused on sonic detail", "Adventurous, exploring unknown rhythms"),
                        0, "Reveals your emotional listening orientation.", "quiz", 10),
                new GameQuestionDto("pq-2", "personality_quiz", "What musical element catches your attention first?",
                        null, "text", List.of("Catchy vocal hook & lyrics", "Deep basslines & percussion drive", "Intricate instrumentals & guitar solos", "Atmospheric production & sound design"),
                        0, "Identifies your acoustic focus.", "quiz", 10),
                new GameQuestionDto("pq-3", "personality_quiz", "How do you prefer discovering new music?",
                        null, "text", List.of("Browsing curated charts & viral hits", "Diving deep into artist discographies", "Unearthing indie & global underground tracks", "High-fidelity lossless audiophile remasters"),
                        0, "Maps your music discovery pattern.", "quiz", 10),
                new GameQuestionDto("pq-4", "personality_quiz", "Which playback setting is non-negotiable for you?",
                        null, "text", List.of("Karaoke synchronized lyrics so I can sing along", "Custom EQ tuned for punchy sub-bass", "Seamless crossfade and infinite queue", "Lossless bit-perfect playback with no compression"),
                        0, "Defines your application usage profile.", "quiz", 10)
        );
    }

    private List<GameQuestionDto> buildArtistChallengeQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        list.add(new GameQuestionDto(
                "ach-1", "artist_challenge", "Which song is performed by Anirudh Ravichander?",
                null, "text", List.of("Hukum - Thalaivar Alappara", "The Winner Takes It All", "WILDFLOWER", "Sex, Drugs, Etc."),
                0, "Anirudh Ravichander composed and sung 'Hukum - Thalaivar Alappara'.", "easy", 20
        ));
        list.add(new GameQuestionDto(
                "ach-2", "artist_challenge", "Which song is performed by Billie Eilish?",
                null, "text", List.of("WILDFLOWER", "Sailor Song", "Bindaas", "Pavazha Malli"),
                0, "Billie Eilish created 'WILDFLOWER'.", "easy", 20
        ));
        return list;
    }

    private List<GameQuestionDto> buildMemoryMatchQuestions(List<DiscoveredTrackDto> tracks, int count, Random rand) {
        List<GameQuestionDto> list = new ArrayList<>();
        list.add(new GameQuestionDto(
                "mm-1", "memory_match", "Memory Match Grid initialized with 8 pairs of song titles and artists.",
                null, "memory", List.of("ABBA", "The Winner Takes It All", "Billie Eilish", "WILDFLOWER", "Anirudh", "Hukum", "Beach Weather", "Sex, Drugs, Etc."),
                0, "Memory Match challenges your recall by pairing songs with their respective artists.", "medium", 30
        ));
        return list;
    }
}

