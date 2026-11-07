# MelodyVault — Academic Viva Voce Defence & Technical Interview Guide
**Project Title:** MelodyVault — Music Playlist and Personal Collection Management System  
**Candidate Degree:** Bachelor of Technology in Computer Science & Engineering (Artificial Intelligence)  
**System Architecture:** Decoupled Full-Stack Web Architecture (React 19 Frontend + Java 25 & Spring Boot Backend)  
**Document Purpose:** Comprehensive preparation guide for external examiners, technical panellists, and academic viva defence.

---

## 1. Executive Summary & Project Statement

### Q1. What is MelodyVault and what core problem does it solve?
**Model Answer:**  
MelodyVault is an integrated music entertainment and personal collection management system. Most modern music streaming platforms (Spotify, Apple Music) restrict users from organizing and playing their own private offline audio files alongside legal catalogues, nor do they provide gamified audio ear-training or source separation tools. 

MelodyVault bridges this gap through a dual-architecture:
1. **Private Local Audio Vault:** High-performance, browser-sandboxed local audio storage in **IndexedDB** that plays MP3/WAV files with embedded ID3 APIC cover artwork extraction without uploading private audio to external cloud servers.
2. **Enterprise Java 25 + Spring Boot Backend:** An enterprise REST API that manages authorized legal public catalogue streams, synchronized karaoke lyrics (LRCLIB), anti-farming gamification XP ledgers, and an arcade of **18 music games** across 4 categories.

---

## 2. Software Architecture & Design Patterns

### Q2. What software architecture does MelodyVault follow?
**Model Answer:**  
MelodyVault follows a **Decoupled Tiered Micro-Architecture** combined with **Domain-Driven Design (DDD)** and the **Layered Architectural Pattern**:
- **Presentation Layer (Client):** React 19, TypeScript, Tailwind CSS, Web Audio API, and IndexedDB.
- **Controller Layer (Backend):** Spring Boot `@RestController` classes handling HTTP requests, mapping DTOs, and producing standard JSON and byte streams.
- **Business Service Layer:** Spring `@Service` classes implementing core domain rules:
  - `LocalMusicScannerService`: ID3 tag parsing and APIC binary extraction.
  - `GameEngineService` & `GameScoringService`: 18-game state machine and anti-abuse scoring.
  - `XpService`: Anti-farming ledger and daily cap enforcement.
  - `LyricsService`: LRCLIB REST client and multi-source caching.
- **Data Access Layer:** Spring Data JPA repositories abstracting database persistence via Hibernate.
- **Persistence Layer:** Persistent H2 database for local zero-configuration execution and PostgreSQL for cloud deployment.

### Q3. Which Object-Oriented Design Patterns are implemented in the Java backend?
**Model Answer:**
1. **Repository Pattern:** Interfaces like `CatalogueTrackRepository` and `XpTransactionRepository` extend `JpaRepository`, abstracting CRUD queries and decoupling business logic from SQL dialects.
2. **Data Transfer Object (DTO) Pattern:** Decouples internal JPA entities from API contracts (e.g. `GameSessionDto`, `DiscoveredTrackDto`, `RewardClaimResponse`), preventing unintended entity leaks.
3. **Strategy Pattern:** Used in `QuestionBankService` where different question generation algorithms are selected dynamically based on `gameId` (`Song Recognition`, `Lyrics`, `Trivia`, `Memory Match`, etc.).
4. **Singleton Pattern:** Managed by Spring's Inversion of Control (IoC) container for stateless services (`XpService`, `LyricsService`, `LocalMusicScannerService`).
5. **Builder Pattern:** Used in Spring's `RestClient.builder()` within `LyricsService` to construct HTTP clients with custom headers and timeout strategies.

---

## 3. Java 25 Modern Language Features

### Q4. Which modern Java features (up to Java 25 LTS) are utilized?
**Model Answer:**
1. **Enhanced Pattern Matching for `switch`:** Cleanly branches question generation logic in `QuestionBankService` across the 18 distinct game modes without boilerplate `if-else` ladders.
2. **Multiline Text Blocks (`"""`):** Used in `LyricsService` for multiline LRC strings and SQL native projection queries, enhancing readability and maintainability.
3. **HTTP Client & Spring `RestClient`:** Uses modern synchronous/asynchronous HTTP abstraction with fluent APIs for external API integrations (LRCLIB).
4. **Thread-Safe Concurrent Collections:** Utilizes `ConcurrentHashMap` in `GameEngineService` and `GameScoringService` for safe multi-session game state tracking without explicit synchronized blocks.
5. **Virtual Threads Readiness (Project Loom):** The backend is packaged on Java 25 (`Adoptium 25.0.3`), enabling lightweight thread scalability for I/O-bound streaming and external lyrics queries.

---

## 4. Audio Engineering & ID3v2 Parsing

### Q5. How does MelodyVault extract embedded album artwork from MP3 files without external libraries?
**Model Answer:**  
In `LocalMusicScannerService.java`, we implemented a direct binary parser for the ID3v2 specification:
1. **Header Inspection:** Reads the first 10 bytes to confirm the magic bytes `'I', 'D', '3'` and parses the 4-byte synchsafe integer representing the tag size:
   $$\text{TagSize} = (b_0 \ll 21) \mid (b_1 \ll 14) \mid (b_2 \ll 7) \mid b_3$$
2. **Frame Iteration:** Traverses frames until identifying the `APIC` (Attached Picture) frame.
3. **Binary Slicing:** Extracts the text encoding byte, skips the null-terminated MIME type string (e.g. `image/png` or `image/jpeg`), skips the picture type byte (`0x03` = Front Cover), skips the null-terminated description, and isolates the raw JPEG/PNG image binary.
4. **HTTP Delivery:** Serves the extracted binary through `LocalMusicController.getArtwork()` with appropriate `Content-Type` headers and HTTP caching.

### Q6. How does audio streaming work with seeking support?
**Model Answer:**  
`LocalMusicController.streamAudio()` implements the **HTTP 206 Partial Content** standard:
- When a browser media element initiates playback or seeks, it sends a `Range: bytes=start-end` header.
- The controller uses `java.io.RandomAccessFile.seek(start)` to read only the requested slice of bytes.
- It returns HTTP status 206 with headers `Accept-Ranges: bytes` and `Content-Range: bytes start-end/fileLength`, enabling instantaneous seeking without buffering the full audio file into memory.

---

## 5. Gamification & Anti-Farming XP Algorithm

### Q7. Explain the mathematical model of the XP Engine and how anti-farming is guaranteed.
**Model Answer:**  
The gamification system is governed by mathematical invariants implemented in `XpService.java` and `GameScoringService.java`:
1. **Anti-Farming Ledger Invariant:** Every XP transaction is assigned a unique transaction identifier (`id`). The database enforces uniqueness; duplicate claim requests are rejected with $0$ XP.
2. **Listening Progress Invariant:** A track awards $+15$ XP only after verified continuous playback reaches $\ge 80\%$ duration. Seeking directly to the end is intercepted and discarded.
3. **Daily Listening Cap:** Listening rewards are strictly limited to $150\text{ XP}$ per calendar day:
   $$\sum_{t \in \text{Today}} \text{XP}_{\text{listen}}(t) \le 150$$
4. **Gaming Scoring Model:**
   $$\text{Score} = \lfloor \text{BasePoints} \times M_{\text{streak}} \rfloor + B_{\text{speed}}$$
   Where $M_{\text{streak}} \in \{1.0, 1.5, 2.0\}$ and speed bonus $B_{\text{speed}} = 5$ for answers completed under 5 seconds.
5. **Level Function:**
   $$\text{Level} = \left\lfloor \frac{\text{TotalXP}}{100} \right\rfloor + 1$$

---

## 6. The 18 Music Games Architecture

### Q8. How are the 18 games organized and how are questions dynamically generated?
**Model Answer:**  
The 18 games are registered in `GameEngineService` across 4 categories:
1. **Song Recognition (4 games):** `guess_song`, `guess_intro`, `mystery_track`, `audio_recognition`.
2. **Lyrics & Knowledge (6 games):** `guess_lyrics`, `complete_title`, `music_trivia`, `who_is_artist`, `guess_album`, `identify_language`.
3. **Memory & Competition (5 games):** `memory_match`, `song_vs_song`, `artist_challenge`, `genre_challenge`, `artwork_challenge`.
4. **Daily & Special (3 games):** `daily_challenge`, `rapid_fire`, `personality_quiz`.

`QuestionBankService` dynamically queries the active music catalogue and the scanned local library (`C:\MelodyVault Sample Music`). It extracts real metadata (artist names, album titles, release years, audio previews, and APIC artwork) to generate real, dynamic, and musically accurate multiple-choice questions without mockups or synthetic placeholders.

---

## 7. Data Privacy & Hybrid Storage Model

### Q9. Why are local audio files stored in browser IndexedDB instead of uploading them to Supabase/PostgreSQL?
**Model Answer:**  
This is a critical architectural decision based on **Copyright Compliance, Security, and Network Efficiency**:
1. **Legal & Copyright Safety:** Commercial audio tracks owned by the user (e.g. MP3s from their personal collection) cannot legally be uploaded to shared public cloud storage.
2. **Zero Cloud Bandwidth Overhead:** Storing multi-megabyte audio files locally in IndexedDB allows instantaneous offline playback with zero server egress costs.
3. **Privacy First:** The user's private music files remain strictly within their local sandbox. The Java backend acts only as a local ingestion bridge on `localhost:8085`.

---

## 8. Summary of Technical Verification & Test Metrics

- **Backend Unit Tests:** 14/14 JUnit 5 tests passing (`mvn test`), covering controllers, services, ID3 scanner, and game engine.
- **Frontend Unit Tests:** 71/71 tests passing (`npm test`), covering playback validation, bulk deletion, time capsules, XP rules, and game mechanics.
- **Type Safety:** 0 TypeScript compiler errors (`npm run lint` / `tsc --noEmit`).
- **Production Bundle:** Vite build compiles in under 600ms (`dist/index.html` 1.41 kB, bundled JS 192 kB gzip).

