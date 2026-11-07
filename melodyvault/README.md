# MelodyVault — Music Playlist & Personal Collection Management System
> **Your Music. Your Memories. Your Experience.**  
> *B.Tech Computer Science & Engineering (Artificial Intelligence) — Capstone Software Architecture*

---

## 🎵 Executive Summary

**MelodyVault** is a full-stack, enterprise-grade music management, gaming, and personal audio vault platform. It combines high-fidelity client-side audio manipulation with a robust **Java 25 + Spring Boot 3.4.2 REST API backend running on port 8085**.

The system addresses the limitations of standard music applications by combining:
1. **Preloaded Personal Sample Music Collection:** 19 real local audio tracks stored in `C:\MelodyVault Sample Music` (ABBA, Billie Eilish, Anirudh Ravichander, Beach Weather, Coke Studio Bharat, etc.) with automatic ID3v2 APIC embedded album artwork extraction.
2. **Dedicated Music Games Hub (`activeTab === 'games'`):** 18 distinct playable music games organized across 4 categories (Song Recognition, Lyrics & Knowledge, Memory & Competition, Daily & Special) with real-time scoring, streak multipliers, and verified anti-farming XP.
3. **Synchronized Lyrics & Multilingual Karaoke:** Real-time synchronized LRC line-by-line karaoke with LRCLIB online discovery, Unicode rendering for Telugu, Tamil, Hindi, and English, interactive line seeking, and manual/file LRC import.
4. **Out-of-the-Box Public Music Catalogue:** Instant access to authorized Public Domain and Creative Commons classical and ambient masterpieces streamed directly from the Java backend server.
5. **Private Personal Audio Vault:** Secure browser-local import and playback of user MP3 and WAV files stored in client-side **IndexedDB**, guaranteeing zero personal audio is uploaded to servers without explicit consent.
6. **Real Vocal Separation & Stem Studio:** In-browser Web Audio API center-cancellation DSP filter, offline dual-channel WAV backing track generation, and synchronized multi-stem playback.
7. **Central Anti-Farming XP Engine:** Gamified leveling, dynamic collection-adaptive quests, and tamper-resistant XP verification featuring a **150 XP daily listening cap** and duplicate claim prevention.

---

## 🏛️ System Architecture

MelodyVault is constructed as a decoupled, multi-tier system:

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  React 19 + TypeScript + Vite + Tailwind CSS 4                                        |
|  - Web Audio API (BiquadFilterNode center vocal cancellation, FFT AnalyserNode)       |
|  - IndexedDB Storage (Audio blobs & extracted album artwork stored locally)           |
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
+------------------------------------------+--------------------------------------------+
                                           |
                                           | HikariCP Connection Pool
                                           v
+---------------------------------------------------------------------------------------+
|                                  PERSISTENCE LAYER                                    |
|  Development: Persistent H2 Database Engine (./data/melodyvault_db.mv.db)             |
|  Production:  PostgreSQL (Supabase Managed Relational Database)                       |
+---------------------------------------------------------------------------------------+
```

---

## 🎮 The 18 Music Games Hub (`activeTab === 'games'`)

MelodyVault features a dedicated Games Hub with 18 playable games across 4 categories:

| Category | Games | Mechanics |
| :--- | :--- | :--- |
| **Song Recognition** | `Guess the Song`, `Guess the Intro`, `Mystery Track`, `Audio Recognition` | Audio preview snippets, 3-second opening identification, progressive hints |
| **Lyrics & Knowledge** | `Guess the Lyrics`, `Complete the Song Title`, `Music Trivia`, `Who Is the Artist?`, `Guess the Album`, `Identify the Language` | Missing lyric fill-ins, artist & album pairing, multilingual Tamil/Hindi/English classification |
| **Memory & Competition** | `Music Memory Match`, `Song vs Song`, `Artist Challenge`, `Genre Challenge`, `Album Artwork Challenge` | Card matching grid, release-year comparisons, blurred APIC cover recognition |
| **Daily & Special** | `Daily Music Challenge`, `Rapid Fire`, `Music Personality Quiz` | 24h deterministic challenge (+100 XP), 60-second speed quiz, listener archetype diagnosis |

---

## 📁 Academic Documentation & Viva Preparation

For detailed technical analysis and academic viva defence:
- [Academic Java Implementation Guide](file:///docs/JAVA_IMPLEMENTATION.md) — Exhaustive documentation of all Java classes, ID3 parser, REST endpoints, and architectural diagrams.
- [Academic Viva Voce Defence Guide](file:///docs/JAVA_VIVA_GUIDE.md) — Anticipated examiner questions, design pattern explanations, mathematical XP models, and viva responses for B.Tech CSE-AI.

---

## 🚀 Running the Project

### 1. Start Java 25 & Spring Boot Backend (Port 8085)
```bash
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot"
cd backend
.\mvnw.cmd spring-boot:run
```
Swagger UI is accessible at `http://localhost:8085/swagger-ui.html`.

### 2. Start React + TypeScript Frontend (Port 3000 / 3001)
```bash
npm install
npm run dev
```

### 3. Running Unit Tests
```bash
# Frontend Unit Tests (71 tests passing)
npm test

# Backend JUnit 5 Tests (14 tests passing)
cd backend
.\mvnw.cmd test
```
