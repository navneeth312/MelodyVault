import { Song, Playlist, UserProfile } from '../types';

const BACKEND_HOST = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_HOST) || 'http://localhost:8085';
const API_BASE_URL = `${BACKEND_HOST}/api`;

export interface CatalogueTrackApiResponse {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  language: string;
  duration: number;
  releaseYear: number;
  artworkUrl: string;
  audioUrl: string;
  licenceType: string;
  attribution: string;
  lyrics?: string;
  isPlayable: boolean;
  playCount: number;
}

export interface PlaylistApiResponse {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface XpLedgerItemApiResponse {
  id: string;
  source: string;
  action: string;
  songId?: string;
  songTitle?: string;
  amount: number;
  timestamp: string;
  dayDate: string;
}

export interface XpSummaryApiResponse {
  totalXp: number;
  level: number;
  tierTitle: string;
  todayListeningXp: number;
  dailyListeningCap: number;
  remainingListeningXpToday: number;
}

export interface RewardClaimApiResponse {
  success: boolean;
  awardedXp: number;
  totalXp: number;
  newLevel: number;
  levelUp: boolean;
  message: string;
}

export interface DiscoveredTrackApiResponse {
  id: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  language: string;
  duration: number;
  year: number;
  fileSize: number;
  hasArtwork: boolean;
  audioUrl: string;
  artworkUrl: string;
  format: string;
}

export interface SongLyricsApiResponse {
  songId: string;
  title: string;
  artist: string;
  plainLyrics: string;
  syncedLyrics: string;
  source: string;
  synced: boolean;
  updatedAt: string;
}

export interface GameInfoApiResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string;
  xpReward: number;
  timeLimitSeconds: number;
  supportedDifficulties: string[];
}

export interface GameQuestionApiResponse {
  questionId: string;
  gameId: string;
  prompt: string;
  mediaUrl?: string;
  mediaType: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: string;
  points: number;
}

export interface GameSessionApiResponse {
  sessionId: string;
  gameId: string;
  gameTitle: string;
  difficulty: string;
  questions: GameQuestionApiResponse[];
  startedAt: string;
  totalRounds: number;
}

export interface GameAnswerResultApiResponse {
  correct: boolean;
  correctOptionIndex: number;
  pointsEarned: number;
  currentScore: number;
  streak: number;
  explanation: string;
}

export interface GameCompletionApiResponse {
  gameId: string;
  finalScore: number;
  xpEarned: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  streakBonus: number;
  message: string;
}

export interface DailyChallengeApiResponse {
  date: string;
  title: string;
  description: string;
  questions: GameQuestionApiResponse[];
  bonusXp: number;
  completed: boolean;
}

export interface RecommendationApiResponse {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  artworkUrl: string;
  recommendationReason: string;
  confidenceScore: number;
}

export interface ScannerStatusApiResponse {
  trackCount: number;
  configuredFolder: string;
  isScanning: boolean;
  folderExists: boolean;
}

export interface LeaderboardEntryApiResponse {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string;
  totalXp: number;
  level: number;
  tierTitle: string;
  currentUser: boolean;
  updatedAt: string;
}

class BackendApiService {
  private isBackendOnline: boolean | null = null;
  private lastHealthCheckTime = 0;
  private readonly HEALTH_CHECK_INTERVAL_MS = 15000;

  /**
   * Checks if the Java Spring Boot REST API is running at localhost:8080.
   */
  public async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (this.isBackendOnline !== null && now - this.lastHealthCheckTime < this.HEALTH_CHECK_INTERVAL_MS) {
      return this.isBackendOnline;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      this.isBackendOnline = res.ok;
      this.lastHealthCheckTime = now;
      return this.isBackendOnline;
    } catch {
      this.isBackendOnline = false;
      this.lastHealthCheckTime = now;
      return false;
    }
  }

  /**
   * Fetches the authorized Public Music Catalogue from Java backend.
   */
  public async getCatalogueTracks(): Promise<CatalogueTrackApiResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/catalogue/tracks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const tracks = await res.json();
      return tracks.map((t: any) => ({
        ...t,
        audioUrl: t.audioUrl?.startsWith('http')
          ? t.audioUrl
          : `${BACKEND_HOST}${t.audioUrl?.startsWith('/') ? '' : '/'}${t.audioUrl || ''}`,
      }));
    } catch (err) {
      console.warn('Failed to fetch catalogue from Java backend:', err);
      return [];
    }
  }

  /**
   * Searches the Public Music Catalogue by query, genre, and language.
   */
  public async searchCatalogue(
    query?: string,
    genre = 'all',
    language = 'all'
  ): Promise<CatalogueTrackApiResponse[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (genre && genre !== 'all') params.append('genre', genre);
      if (language && language !== 'all') params.append('language', language);

      const res = await fetch(`${API_BASE_URL}/catalogue/search?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to search catalogue:', err);
      return [];
    }
  }

  /**
   * Logs a catalogue play event on the backend.
   */
  public async logCataloguePlay(trackId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/catalogue/tracks/${trackId}/play`, { method: 'POST' });
    } catch {
      // Non-critical telemetry logging
    }
  }

  /**
   * Retrieves playlists stored in the backend.
   */
  public async getPlaylists(): Promise<PlaylistApiResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/playlists`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch playlists from Java backend:', err);
      return [];
    }
  }

  /**
   * Creates or updates a playlist on the backend.
   */
  public async savePlaylist(playlist: Playlist): Promise<PlaylistApiResponse | null> {
    try {
      const isUpdate = !!playlist.id;
      const url = isUpdate ? `${API_BASE_URL}/playlists/${playlist.id}` : `${API_BASE_URL}/playlists`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlist),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to sync playlist to backend:', err);
      return null;
    }
  }

  /**
   * Deletes a playlist on the backend.
   */
  public async deletePlaylist(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/playlists/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches the immutable XP transaction ledger.
   */
  public async getXpLedger(): Promise<XpLedgerItemApiResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/xp/ledger`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Fetches XP summary and level progress from Java engine.
   */
  public async getXpSummary(): Promise<XpSummaryApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/xp/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Claims a validated XP reward through the Java backend anti-farming engine.
   */
  public async claimReward(
    id: string,
    source: string,
    action: string,
    amount: number,
    songId?: string,
    songTitle?: string
  ): Promise<RewardClaimApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/xp/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, source, action, amount, songId, songTitle }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to claim reward via Java backend:', err);
      return null;
    }
  }

  /**
   * Logs a listening session to the backend for statistics and telemetry.
   */
  public async recordListenStat(
    songId: string,
    songTitle: string,
    artist: string,
    genre: string,
    durationSeconds: number,
    completed: boolean
  ): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/statistics/listen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId, songTitle, artist, genre, durationSeconds, completed }),
      });
    } catch {
      // Non-critical
    }
  }

  /**
   * Fetches user profile from the Java backend (by userId, defaults to user-navneeth).
   */
  public async getUserProfile(userId?: string): Promise<any | null> {
    try {
      const url = userId ? `${API_BASE_URL}/profile?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/profile`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }

  public getCreatorToken(): string | null {
    return null;
  }

  public setCreatorToken(_token: string | null): void {
    try {
      // Security requirement: Never store session tokens in localStorage or sessionStorage.
      // Clean up any legacy token that may have been stored previously.
      localStorage.removeItem('mv_creator_token');
    } catch {
      // Ignore in environments without window.localStorage
    }
  }

  public async verifyCreatorPassword(password: string, rememberDevice = true): Promise<{ success: boolean; displayName?: string; message: string; configured?: boolean; userId?: string; avatar?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-creator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, rememberDevice }),
      });
      const data = await res.json();
      // Ensure any legacy token in storage is cleared; auth relies purely on HttpOnly cookies
      this.setCreatorToken(null);
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to connect to authentication server.' };
    }
  }

  public async checkCreatorSession(): Promise<{ authenticated: boolean; configured: boolean; userId?: string | null; displayName?: string; avatar?: string; tag?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/session`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) return { authenticated: false, configured: false };
      return await res.json();
    } catch {
      return { authenticated: false, configured: false };
    }
  }

  public async logoutCreator(): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setCreatorToken(null);
    }
    return true;
  }

  public async logoutAllCreatorDevices(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout-all`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      this.setCreatorToken(null);
    }
  }

  /**
   * Saves or updates a user profile on the backend.
   */
  public async saveUserProfile(profile: {
    id: string;
    username?: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    totalXp?: number;
    level?: number;
    streakDays?: number;
    badgesCount?: number;
    joinedLeaderboard?: boolean;
  }): Promise<any | null> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to save user profile to backend:', err);
      return null;
    }
  }

  /**
   * Fetches the real-time local sample music folder status.
   */
  public async getScannerStatus(): Promise<ScannerStatusApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/local-collection/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches genuine leaderboard entries from the Java backend.
   */
  public async getLeaderboard(currentUserId?: string): Promise<LeaderboardEntryApiResponse[]> {
    try {
      const url = currentUserId
        ? `${API_BASE_URL}/leaderboard?currentUserId=${encodeURIComponent(currentUserId)}`
        : `${API_BASE_URL}/leaderboard`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch leaderboard from Java backend:', err);
      return [];
    }
  }

  /**
   * Syncs user XP and profile to the shared leaderboard.
   */
  public async syncLeaderboard(payload: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    totalXp: number;
    level: number;
    tierTitle?: string;
  }): Promise<LeaderboardEntryApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to sync leaderboard:', err);
      return null;
    }
  }

  /**
   * Opts in or out of the shared global leaderboard.
   */
  public async toggleLeaderboardOptIn(userId: string, optedIn: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/opt-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, optedIn }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Scans C:\MelodyVault Sample Music for real audio tracks and extracted ID3 artwork.
   */
  public async getLocalCollectionTracks(): Promise<DiscoveredTrackApiResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/local-collection/scan`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const tracks = await res.json();
      return tracks.map((t: DiscoveredTrackApiResponse) => ({
        ...t,
        audioUrl: `${BACKEND_HOST}${t.audioUrl}`,
        artworkUrl: `${BACKEND_HOST}${t.artworkUrl}`,
      }));
    } catch (err) {
      console.warn('Failed to scan local collection from Java backend:', err);
      return [];
    }
  }

  /**
   * Fetches synchronized or plain lyrics from Java LyricsService / LRCLIB.
   */
  public async getLyrics(
    songId: string,
    title?: string,
    artist?: string,
    duration?: number
  ): Promise<SongLyricsApiResponse | null> {
    try {
      const params = new URLSearchParams();
      if (title) params.append('title', title);
      if (artist) params.append('artist', artist);
      if (duration) params.append('duration', String(Math.round(duration)));

      const res = await fetch(`${API_BASE_URL}/lyrics/${encodeURIComponent(songId)}?${params.toString()}`);
      if (res.status === 204 || res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch lyrics:', err);
      return null;
    }
  }

  /**
   * Saves or edits lyrics for a track.
   */
  public async saveLyrics(
    songId: string,
    title: string,
    artist: string,
    plainLyrics: string,
    syncedLyrics: string,
    source = 'MANUAL_EDIT'
  ): Promise<SongLyricsApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/lyrics/${encodeURIComponent(songId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, plainLyrics, syncedLyrics, source }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to save lyrics:', err);
      return null;
    }
  }

  /**
   * Fetches the 18 playable games across 4 categories.
   */
  public async getGames(): Promise<GameInfoApiResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/games`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch games list:', err);
      return [];
    }
  }

  /**
   * Starts a new game session with selected difficulty.
   */
  public async startGameSession(gameId: string, difficulty = 'Medium'): Promise<GameSessionApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/games/${encodeURIComponent(gameId)}/start?difficulty=${encodeURIComponent(difficulty)}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        ...data,
        questions: (data.questions || []).map((q: any) => ({
          ...q,
          mediaUrl: q.mediaUrl?.startsWith('/') ? `${BACKEND_HOST}${q.mediaUrl}` : q.mediaUrl,
        })),
      };
    } catch (err) {
      console.warn('Failed to start game session:', err);
      return null;
    }
  }

  /**
   * Submits an answer for real-time validation and scoring.
   */
  public async submitGameAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIndex: number,
    timeTakenSeconds: number
  ): Promise<GameAnswerResultApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/games/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId, selectedOptionIndex, timeTakenSeconds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to submit game answer:', err);
      return null;
    }
  }

  /**
   * Completes a game session and claims anti-farming XP.
   */
  public async completeGameSession(payload: {
    sessionId: string;
    gameId: string;
    finalScore: number;
    correctCount: number;
    totalCount: number;
    timeElapsedSeconds: number;
  }): Promise<GameCompletionApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/games/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to complete game session:', err);
      return null;
    }
  }

  /**
   * Fetches today's Daily Music Challenge.
   */
  public async getDailyChallenge(): Promise<DailyChallengeApiResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/games/daily-challenge`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        ...data,
        questions: (data.questions || []).map((q: any) => ({
          ...q,
          mediaUrl: q.mediaUrl?.startsWith('/') ? `${BACKEND_HOST}${q.mediaUrl}` : q.mediaUrl,
        })),
      };
    } catch (err) {
      console.warn('Failed to fetch daily challenge:', err);
      return null;
    }
  }

  /**
   * Completes today's Daily Music Challenge.
   */
  public async completeDailyChallenge(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/games/daily-challenge/complete`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches personalized track recommendations.
   */
  public async getRecommendations(limit = 10): Promise<RecommendationApiResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch recommendations:', err);
      return [];
    }
  }
}

export const apiService = new BackendApiService();
