# MelodyVault — Academic Java Architecture & Implementation Guide
**Project Title:** MelodyVault — Music Playlist and Personal Collection Management System  
**Academic Target:** B.Tech Computer Science & Engineering (Artificial Intelligence)  
**Document Classification:** Technical Architecture & Viva Defence Specification  
**Java Version:** Java 25 LTS (Adoptium OpenJDK 25.0.3+9)  
**Framework:** Spring Boot 3.4.2  
**Persistence Layer:** Spring Data JPA with Persistent H2 File Engine & PostgreSQL  
**API Specification:** OpenAPI 3.0 / Swagger UI (`http://localhost:8085/swagger-ui.html`)  

---

## 1. Architectural Overview & Tiered System Design

MelodyVault is architected as an enterprise-grade full-stack music platform and personal audio vault. The system employs a decoupled, tiered micro-architecture where high-concurrency client rendering, Web Audio graph processing, and private local file caching occur in the browser client, while business invariants, anti-abuse validations, local music file ingestion with ID3 parsing, synchronized lyrics management, interactive gaming engines, and recommendation systems are governed by a **Java 25 and Spring Boot 3.4.2 REST API backend running on port 8085**.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  React 19 + TypeScript + Vite + Tailwind CSS 4                                        |
|  - Web Audio API (Dual-channel playback, vocal cancellation, FFT AnalyserNode)        |
|  - Browser IndexedDB Storage (Audio blobs & extracted album artwork stored locally)   |
|  - 18 Interactive Music Games (Song Recognition, Lyrics, Trivia, Rapid Fire, Daily)  |
|  - Synchronized Karaoke Studio (LRC parser, auto-scroll, real-time highlight)         |
+------------------------------------------+--------------------------------------------+
                                           |
                                           | HTTP REST (JSON) / Byte Streams (Port 8085)
                                           v
+---------------------------------------------------------------------------------------+
|                            JAVA 25 + SPRING BOOT BACKEND                              |
|  com.melodyvault                                                                      |
|  ├── controller/                                                                      |
|  │   ├── LocalMusicController      # Audio streaming (Range 206) & APIC artwork       |
|  │   ├── LyricsController          # Synchronized lyrics fetch (LRCLIB) & edit API    |
|  │   ├── GameController            # 18-game engine, session lifecycle & scoring      |
|  │   ├── RecommendationController  # AI/Rule-based smart music recommendations        |
|  │   ├── CatalogueController       # Legal public domain & CC catalogue tracks        |
|  │   ├── XpController              # Anti-farming ledger and level progression        |
|  │   ├── PlaylistController        # Relational playlist CRUD                         |
|  │   ├── UserProfileController     # Listener profile & authenticated stats           |
|  │   └── HealthController          # System health and runtime telemetry              |
|  ├── service/                                                                         |
|  │   ├── LocalMusicScannerService  # ID3v2 APIC & metadata binary parser              |
|  │   ├── LyricsService             # Multi-source LRCLIB + Unicode caching engine     |
|  │   ├── GameEngineService         # Master registry for 18 games across 4 categories |
|  │   ├── GameScoringService        # Anti-farming XP computation & streak multiplier  |
|  │   ├── QuestionBankService       # Dynamic questions synthesized from music library |
|  │   ├── DailyChallengeService     # Deterministic 24-hour daily challenge generator  |
|  │   ├── RecommendationService     # Listener taste & affinity recommendation model   |
|  │   ├── CatalogueService          # Public catalogue management                      |
|  │   └── XpService                 # Anti-abuse validation & daily listening cap      |
|  ├── repository/                   # Spring Data JPA repositories                     |
|  ├── model/                        # JPA relational entities                          |
|  └── dto/                          # Strongly-typed Java Data Transfer Objects        |
+------------------------------------------+--------------------------------------------+
                                           |
                                           | JDBC Connection Pool (HikariCP)
                                           v
+---------------------------------------------------------------------------------------+
|                                  PERSISTENCE LAYER                                    |
|  Development: Persistent H2 Database Engine (./data/melodyvault_db.mv.db)             |
|  Production:  PostgreSQL (Supabase Managed Relational Database)                       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Java Package Structure & Comprehensive Class Catalog

The Java backend adheres to clean architecture principles under the `com.melodyvault` root package:

```
backend/src/main/java/com/melodyvault/
├── MelodyVaultApplication.java              # Spring Boot main entry point & component scanner
├── config/
│   ├── CorsConfig.java                      # Global CORS policy allowing localhost:3000/3001
│   ├── DataInitializer.java                 # Seeds public tracks and demo data on boot
│   └── OpenApiConfig.java                   # OpenAPI 3.0 / Swagger documentation configuration
├── controller/
│   ├── LocalMusicController.java            # Scans local music directory, streams byte ranges, serves APIC art
│   ├── LyricsController.java                # Synchronized LRC and plain lyrics retrieval and editor endpoints
│   ├── GameController.java                  # REST endpoints for 18 music games, rounds, answers, and daily challenges
│   ├── RecommendationController.java        # Personalized track recommendation endpoints
│   ├── CatalogueController.java             # Public domain catalogue retrieval and search
│   ├── PlaylistController.java              # Playlist CRUD operations
│   ├── StatisticsController.java            # Listening analytics and telemetry
│   ├── UserProfileController.java           # Personal listener profile
│   ├── XpController.java                    # XP transaction ledger and claims
│   └── HealthController.java                # Health check and runtime information
├── service/
│   ├── LocalMusicScannerService.java        # Scans C:\MelodyVault Sample Music, parses ID3 tags & APIC frames
│   ├── LyricsService.java                   # Connects to LRCLIB API, caches lyrics, handles multilingual Unicode
│   ├── GameEngineService.java               # Manages 18 games across 4 categories and active game sessions
│   ├── GameScoringService.java              # Validates answers, manages streak multipliers, issues verified XP
│   ├── QuestionBankService.java             # Synthesizes dynamic questions from real library metadata
│   ├── DailyChallengeService.java           # Generates 5-round deterministic daily challenge
│   ├── RecommendationService.java           # Rule-based and affinity music recommendations
│   ├── CatalogueService.java                # Manages public tracks
│   ├── PlaylistService.java                 # Playlist business logic
│   ├── UserProfileService.java              # User profile management
│   └── XpService.java                       # Anti-farming XP engine with daily caps and duplicate detection
├── repository/
│   ├── CatalogueTrackRepository.java
│   ├── ListeningStatRepository.java
│   ├── PlaylistRepository.java
│   ├── SongLyricsRepository.java
│   ├── UserProfileRepository.java
│   └── XpTransactionRepository.java
├── model/
│   ├── CatalogueTrack.java
│   ├── ListeningStat.java
│   ├── Playlist.java
│   ├── SongLyrics.java
│   ├── UserProfile.java
│   └── XpTransaction.java
├── dto/
│   ├── CatalogueTrackDto.java
│   ├── DailyChallengeDto.java
│   ├── GameAnswerRequest.java
│   ├── GameAnswerResult.java
│   ├── GameCompletionRequest.java
│   ├── GameCompletionResponse.java
│   ├── GameInfoDto.java
│   ├── GameQuestionDto.java
│   ├── GameSessionDto.java
│   ├── ListeningStatDto.java
│   ├── PlaylistDto.java
│   ├── RewardClaimRequest.java
│   ├── RewardClaimResponse.java
│   ├── SongLyricsDto.java
│   ├── UserProfileDto.java
│   └── XpTransactionDto.java
└── exception/
    ├── GlobalExceptionHandler.java
    └── ResourceNotFoundException.java
```

---

## 3. ID3v2 APIC Album Artwork Extraction & Audio Byte-Range Streaming

### 3.1 ID3v2 Binary Parsing Mechanism (`LocalMusicScannerService`)
In digital audio standards (ID3v2.3 and ID3v2.4), metadata and attached pictures are stored in header frames before the audio sync frames:
- **ID3 Header:** 10 bytes starting with `ID3`, followed by major/minor versions and a 4-byte synchsafe integer representing the total tag size:
  $$\text{TagSize} = (b_0 \ll 21) \mid (b_1 \ll 14) \mid (b_2 \ll 7) \mid b_3$$
- **APIC (Attached Picture) Frame:**
  - Header: 4-byte identifier `APIC` + 4-byte big-endian frame length.
  - Body: 1 byte text encoding, null-terminated MIME type string (`image/png` or `image/jpeg`), 1 byte picture type (`0x03` = Cover front), null-terminated description string, followed by raw binary image bytes.
- `LocalMusicScannerService.extractArtwork(String filename)` reads this binary structure and returns an `ExtractedArtwork` containing the MIME type and exact byte array, avoiding external dependencies.

### 3.2 HTTP 206 Partial Content Range Streaming (`LocalMusicController`)
To support smooth browser audio playback with seeking:
- Standard GET requests return the full file with `Accept-Ranges: bytes`.
- Range requests (`Range: bytes=start-end`) parse the range indices and stream a byte window using `RandomAccessFile.seek()`, returning `HTTP 206 Partial Content` with `Content-Range: bytes start-end/fileLength`.

---

## 4. The 18 Music Games Architecture & Scoring Engine

The gaming engine organizes 18 distinct playable music games into 4 categories:

| Category | Game ID | Title | Question Mechanism |
| :--- | :--- | :--- | :--- |
| **Song Recognition** | `guess_song` | Guess the Song | Audio snippet preview -> 4 title choices |
| | `guess_intro` | Guess the Intro | First 3 seconds of track playback |
| | `mystery_track` | Mystery Track | Step-by-step clues (year, genre, duration) |
| | `audio_recognition` | Audio Recognition | Sped-up or short audio preview |
| **Lyrics & Knowledge** | `guess_lyrics` | Guess the Lyrics | Complete missing words in famous lines |
| | `complete_title` | Complete the Song Title | Fill in blanks or complete track names |
| | `music_trivia` | Music Trivia | Curated music history and theory questions |
| | `who_is_artist` | Who Is the Artist? | Match tracks to singers/composers |
| | `guess_album` | Guess the Album | Connect songs to films or album releases |
| | `identify_language` | Identify the Language | Distinguish Tamil, Hindi, English, Telugu |
| **Memory & Competition**| `memory_match` | Music Memory Match | Card flip grid matching song-artist pairs |
| | `song_vs_song` | Song vs Song | Head-to-head comparison (earlier, longer) |
| | `artist_challenge` | Artist Challenge | Discography mastery challenges |
| | `genre_challenge` | Genre Challenge | Classify tracks into authentic genres |
| | `artwork_challenge` | Album Artwork Challenge | Identify songs from blurred/zoomed APIC art |
| **Daily & Special** | `daily_challenge` | Daily Music Challenge | Deterministic 5-round daily puzzle (+100 XP) |
| | `rapid_fire` | Rapid Fire | 60-second speed challenge |
| | `personality_quiz` | Music Personality Quiz | 4-question listener archetype classifier |

### 4.1 Scoring & Streak Multiplier Model
Questions are scored server-side in `GameScoringService`:
$$\text{Points} = \lfloor \text{BasePoints} \times M_{\text{streak}} \rfloor + B_{\text{speed}}$$
Where:
- $M_{\text{streak}} = 2.0$ for streak $\ge 5$, $1.5$ for streak $\ge 3$, else $1.0$.
- $B_{\text{speed}} = 5$ if answered within 5 seconds, else $0$.
- Anti-farming XP is capped at 50 XP per standard session and 100 XP for the daily challenge.

---

## 5. Synchronized Lyrics Engine (`LyricsService`)

1. **Multi-Tier Retrieval Strategy**:
   - Check local JPA repository `SongLyricsRepository` by `songId` or `(title, artist)`.
   - Query online LRCLIB REST API (`https://lrclib.net/api/get`) via Spring `RestClient`.
   - Built-in fallback database for offline demonstrations (e.g. ABBA, Billie Eilish, Anirudh).
2. **LRC Format Standard**:
   Timestamps in format `[mm:ss.xx]` are stored in JPA entity text blobs. The React frontend computes active lyric lines at 60fps using current playback seconds:
   $$\text{activeLine} = \max \{ i \mid t_{\text{current}} \ge t_{\text{line}, i} \}$$
3. **Multilingual Unicode Support**:
   Full UTF-8 support ensures Indian regional languages (Tamil, Telugu, Hindi, Malayalam) and western scripts render with perfect typographic fidelity.

---

## 6. Anti-Farming XP Engine & Invariants (`XpService`)

1. **Transaction Ledger Invariant**: Every XP reward creates an immutable `XpTransaction` record with a unique GUID. Duplicate attempts return HTTP 200 with `awardedXp = 0`.
2. **Daily Listening Cap**: Listening XP is capped at 150 XP per calendar day (`YYYY-MM-DD`).
3. **Genuine Progress Validation**: Playback XP requires continuous 80% listening progress without seeking directly to the end.
4. **Formula for Level Progression**:
   $$\text{Level} = \left\lfloor \frac{\text{TotalXP}}{100} \right\rfloor + 1$$
