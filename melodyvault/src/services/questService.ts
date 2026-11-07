import { Song } from '../types';
import { isPlayableSong } from '../utils/pureLogic';
import { xpService } from './xpService';

export type QuestPeriod = 'daily' | 'weekly';
export type QuestCategory = 'explorer' | 'discovery' | 'session' | 'playlist' | 'weekly_tracks' | 'import' | 'days_streak' | 'genres';

export interface DynamicQuest {
  id: string; // e.g., 'daily_explorer_2026-11-07'
  period: QuestPeriod;
  category: QuestCategory;
  title: string;
  description: string;
  iconName: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
  claimedAt?: string;
  resetDateISO: string;
  contributingSongIds: string[]; // Set of track IDs that have contributed
}

export interface QuestHistoryRecord {
  id: string;
  questId: string;
  title: string;
  period: QuestPeriod;
  completedAt: string;
  claimedAt: string;
  xpAwarded: number;
}

const QUEST_STATE_KEY = 'melodyvault_v1_dynamic_quests';
const QUEST_HISTORY_KEY = 'melodyvault_v1_quest_history';
const ACTIVE_DAYS_KEY = 'melodyvault_v1_active_listening_days';

export class QuestService {
  private activeQuests: DynamicQuest[] = [];
  private history: QuestHistoryRecord[] = [];
  private activeDaysThisWeek: string[] = []; // Array of YYYY-MM-DD
  private totalPlaybackMinutesToday: number = 0;

  constructor() {
    this.loadState();
  }

  private getDateString(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getDailyResetISO(): string {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.toISOString();
  }

  private getWeeklyResetISO(): string {
    const now = new Date();
    // Monday as start of week, next Monday 00:00:00 as reset
    const day = now.getDay();
    const diff = (7 - (day === 0 ? 7 : day) + 1) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + diff);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday.toISOString();
  }

  private getWeekIdentifier(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNum}`;
  }

  public loadState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem(QUEST_STATE_KEY);
      if (stored) {
        this.activeQuests = JSON.parse(stored);
      }
      const storedHist = localStorage.getItem(QUEST_HISTORY_KEY);
      if (storedHist) {
        this.history = JSON.parse(storedHist);
      }
      const storedDays = localStorage.getItem(ACTIVE_DAYS_KEY);
      if (storedDays) {
        this.activeDaysThisWeek = JSON.parse(storedDays);
      }
    } catch (e) {
      console.warn('Failed to load quest state', e);
    }
  }

  private saveState() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(QUEST_STATE_KEY, JSON.stringify(this.activeQuests));
      localStorage.setItem(QUEST_HISTORY_KEY, JSON.stringify(this.history));
      localStorage.setItem(ACTIVE_DAYS_KEY, JSON.stringify(this.activeDaysThisWeek));
    } catch (e) {
      console.warn('Failed to save quest state', e);
    }
  }

  /**
   * Refreshes or dynamically generates daily and weekly quests based on collection size.
   * Cleans up quests if daily/weekly periods have expired.
   */
  public syncQuests(songs: Song[]): DynamicQuest[] {
    const playableSongs = songs.filter(isPlayableSong);
    const collectionCount = playableSongs.length;
    const today = this.getDateString();
    const currentWeek = this.getWeekIdentifier();

    // Check if daily quests need reset
    const hasCurrentDaily = this.activeQuests.some(
      (q) => q.period === 'daily' && q.id.includes(today)
    );
    // Check if weekly quests need reset
    const hasCurrentWeekly = this.activeQuests.some(
      (q) => q.period === 'weekly' && q.id.includes(currentWeek)
    );

    let needsSave = false;

    // Prune expired daily quests
    if (!hasCurrentDaily) {
      this.activeQuests = this.activeQuests.filter((q) => q.period !== 'daily');
      const newDailies = this.generateDailyQuests(playableSongs, today);
      this.activeQuests.push(...newDailies);
      needsSave = true;
    }

    // Prune expired weekly quests
    if (!hasCurrentWeekly) {
      this.activeQuests = this.activeQuests.filter((q) => q.period !== 'weekly');
      const newWeeklies = this.generateWeeklyQuests(playableSongs, currentWeek);
      this.activeQuests.push(...newWeeklies);
      this.activeDaysThisWeek = [today];
      needsSave = true;
    }

    // Handle deleted tracks: remove non-existent track IDs from contributing lists
    const existingSongIds = new Set(playableSongs.map((s) => s.id));
    for (const quest of this.activeQuests) {
      const originalCount = quest.contributingSongIds.length;
      quest.contributingSongIds = quest.contributingSongIds.filter((id) => existingSongIds.has(id));
      if (quest.contributingSongIds.length !== originalCount) {
        // Recalculate count if based on unique songs
        if (['explorer', 'discovery', 'weekly_tracks'].includes(quest.category)) {
          quest.currentCount = quest.contributingSongIds.length;
          if (quest.currentCount < quest.targetCount && !quest.isClaimed) {
            quest.isCompleted = false;
          }
        }
        needsSave = true;
      }
    }

    if (needsSave) {
      this.saveState();
    }

    return [...this.activeQuests];
  }

  private generateDailyQuests(playableSongs: Song[], today: string): DynamicQuest[] {
    const count = playableSongs.length;
    const quests: DynamicQuest[] = [];

    // 1. Music Explorer: Listen to N different imported songs
    const explorerTarget = count === 0 ? 1 : Math.min(3, Math.max(1, count));
    quests.push({
      id: `daily_explorer_${today}`,
      period: 'daily',
      category: 'explorer',
      title: 'Music Explorer',
      description: `Listen to ${explorerTarget} different imported track${explorerTarget > 1 ? 's' : ''} in your collection.`,
      iconName: 'Compass',
      targetCount: explorerTarget,
      currentCount: 0,
      xpReward: 30,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getDailyResetISO(),
      contributingSongIds: [],
    });

    // 2. Collection Discovery: Listen to unlistened / unrewarded track
    const discoveryTarget = count > 1 ? 2 : 1;
    quests.push({
      id: `daily_discovery_${today}`,
      period: 'daily',
      category: 'discovery',
      title: 'Collection Discovery',
      description: `Discover and listen to ${discoveryTarget} track${discoveryTarget > 1 ? 's' : ''} that haven't received a first-listen reward.`,
      iconName: 'Sparkles',
      targetCount: discoveryTarget,
      currentCount: 0,
      xpReward: 35,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getDailyResetISO(),
      contributingSongIds: [],
    });

    // 3. Listening Session: Accumulate 10 minutes of genuine playback
    const sessionTarget = count === 0 ? 5 : 10;
    quests.push({
      id: `daily_session_${today}`,
      period: 'daily',
      category: 'session',
      title: 'Listening Session',
      description: `Accumulate ${sessionTarget} minutes of genuine music playback.`,
      iconName: 'Clock',
      targetCount: sessionTarget,
      currentCount: 0,
      xpReward: 40,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getDailyResetISO(),
      contributingSongIds: [],
    });

    // 4. Playlist Explorer: Listen to tracks from playlists
    quests.push({
      id: `daily_playlist_${today}`,
      period: 'daily',
      category: 'playlist',
      title: 'Playlist Explorer',
      description: 'Listen to 2 tracks from any of your playlists.',
      iconName: 'FolderPlus',
      targetCount: 2,
      currentCount: 0,
      xpReward: 25,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getDailyResetISO(),
      contributingSongIds: [],
    });

    return quests;
  }

  private generateWeeklyQuests(playableSongs: Song[], weekId: string): DynamicQuest[] {
    const count = playableSongs.length;
    const quests: DynamicQuest[] = [];

    // 1. Weekly Voyager: Listen to 5-10 tracks
    const weeklyTarget = count === 0 ? 3 : Math.min(10, Math.max(3, count));
    quests.push({
      id: `weekly_voyager_${weekId}`,
      period: 'weekly',
      category: 'weekly_tracks',
      title: 'Weekly Music Journey',
      description: `Listen to ${weeklyTarget} different imported tracks throughout the week.`,
      iconName: 'Trophy',
      targetCount: weeklyTarget,
      currentCount: 0,
      xpReward: 100,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getWeeklyResetISO(),
      contributingSongIds: [],
    });

    // 2. Vault Expansion: Import 3 new unique tracks
    quests.push({
      id: `weekly_import_${weekId}`,
      period: 'weekly',
      category: 'import',
      title: 'Vault Expansion',
      description: 'Import 3 new unique audio files (MP3/WAV) into your library.',
      iconName: 'UploadCloud',
      targetCount: 3,
      currentCount: 0,
      xpReward: 80,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getWeeklyResetISO(),
      contributingSongIds: [],
    });

    // 3. Habitual Listener: Listen on 4 different days
    quests.push({
      id: `weekly_days_${weekId}`,
      period: 'weekly',
      category: 'days_streak',
      title: 'Habitual Listener',
      description: 'Listen to music on at least 4 different days this week.',
      iconName: 'Flame',
      targetCount: 4,
      currentCount: 1, // Current day initialized
      xpReward: 120,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getWeeklyResetISO(),
      contributingSongIds: [],
    });

    // 4. Genre Odyssey: Explore distinct genres
    const uniqueGenres = new Set(playableSongs.map((s) => s.genre).filter(Boolean));
    const genreTarget = Math.max(2, Math.min(3, uniqueGenres.size || 2));
    quests.push({
      id: `weekly_genres_${weekId}`,
      period: 'weekly',
      category: 'genres',
      title: 'Genre Odyssey',
      description: `Listen to tracks across ${genreTarget} different genres in your collection.`,
      iconName: 'Compass',
      targetCount: genreTarget,
      currentCount: 0,
      xpReward: 90,
      isCompleted: false,
      isClaimed: false,
      resetDateISO: this.getWeeklyResetISO(),
      contributingSongIds: [],
    });

    return quests;
  }

  /**
   * Records a song listen event to advance quests.
   * Enforces imported-only eligibility.
   */
  public recordSongListen(song: Song, isInPlaylist = false): { updatedQuests: DynamicQuest[]; completedQuests: DynamicQuest[] } {
    if (!isPlayableSong(song)) {
      return { updatedQuests: [], completedQuests: [] };
    }

    const today = this.getDateString();
    if (!this.activeDaysThisWeek.includes(today)) {
      this.activeDaysThisWeek.push(today);
    }

    const updatedQuests: DynamicQuest[] = [];
    const completedQuests: DynamicQuest[] = [];

    for (const quest of this.activeQuests) {
      if (quest.isCompleted) continue;

      let changed = false;

      switch (quest.category) {
        case 'explorer':
        case 'weekly_tracks': {
          if (!quest.contributingSongIds.includes(song.id)) {
            quest.contributingSongIds.push(song.id);
            quest.currentCount = quest.contributingSongIds.length;
            changed = true;
          }
          break;
        }

        case 'discovery': {
          // If song hasn't received first_listen reward yet
          const hasReward = xpService.hasReward(`first_listen_${song.id}`);
          if (!hasReward && !quest.contributingSongIds.includes(song.id)) {
            quest.contributingSongIds.push(song.id);
            quest.currentCount = quest.contributingSongIds.length;
            changed = true;
          }
          break;
        }

        case 'playlist': {
          if (isInPlaylist && !quest.contributingSongIds.includes(song.id)) {
            quest.contributingSongIds.push(song.id);
            quest.currentCount = quest.contributingSongIds.length;
            changed = true;
          }
          break;
        }

        case 'days_streak': {
          quest.currentCount = this.activeDaysThisWeek.length;
          changed = true;
          break;
        }

        case 'genres': {
          if (song.genre && !quest.contributingSongIds.includes(song.genre)) {
            quest.contributingSongIds.push(song.genre);
            quest.currentCount = quest.contributingSongIds.length;
            changed = true;
          }
          break;
        }
      }

      if (changed) {
        if (quest.currentCount >= quest.targetCount) {
          quest.currentCount = quest.targetCount;
          quest.isCompleted = true;
          completedQuests.push(quest);
        }
        updatedQuests.push(quest);
      }
    }

    if (updatedQuests.length > 0) {
      this.saveState();
    }

    return { updatedQuests, completedQuests };
  }

  /**
   * Advances listening session duration in minutes.
   */
  public addListeningMinutes(minutes: number) {
    if (minutes <= 0) return;
    this.totalPlaybackMinutesToday += minutes;

    let changed = false;
    for (const quest of this.activeQuests) {
      if (quest.category === 'session' && !quest.isCompleted) {
        quest.currentCount = Math.min(quest.targetCount, Math.floor(quest.currentCount + minutes));
        if (quest.currentCount >= quest.targetCount) {
          quest.isCompleted = true;
        }
        changed = true;
      }
    }

    if (changed) {
      this.saveState();
    }
  }

  /**
   * Advances import quests when a new unique track is imported.
   */
  public recordSongImport(songId: string): DynamicQuest[] {
    const updated: DynamicQuest[] = [];
    for (const quest of this.activeQuests) {
      if (quest.category === 'import' && !quest.isCompleted) {
        if (!quest.contributingSongIds.includes(songId)) {
          quest.contributingSongIds.push(songId);
          quest.currentCount = quest.contributingSongIds.length;
          if (quest.currentCount >= quest.targetCount) {
            quest.isCompleted = true;
          }
          updated.push(quest);
        }
      }
    }
    if (updated.length > 0) {
      this.saveState();
    }
    return updated;
  }

  /**
   * Claims a completed quest reward with anti-farming duplicate checks.
   */
  public claimQuestReward(questId: string): { success: boolean; xpAwarded: number; reason?: string } {
    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) {
      return { success: false, xpAwarded: 0, reason: 'Quest not found' };
    }
    if (!quest.isCompleted) {
      return { success: false, xpAwarded: 0, reason: 'Quest is not yet completed' };
    }
    if (quest.isClaimed) {
      return { success: false, xpAwarded: 0, reason: 'Quest reward already claimed' };
    }

    const rewardId = `quest_${quest.id}`;
    const awardResult = xpService.awardReward({
      id: rewardId,
      source: 'quest_completion',
      action: `Completed ${quest.period} quest: "${quest.title}"`,
      amount: quest.xpReward,
    });

    if (!awardResult.awarded) {
      return { success: false, xpAwarded: 0, reason: awardResult.reason || 'Reward denied by anti-farming rules' };
    }

    quest.isClaimed = true;
    quest.claimedAt = new Date().toISOString();

    const historyRecord: QuestHistoryRecord = {
      id: `hist_${quest.id}_${Date.now()}`,
      questId: quest.id,
      title: quest.title,
      period: quest.period,
      completedAt: new Date().toISOString(),
      claimedAt: quest.claimedAt,
      xpAwarded: quest.xpReward,
    };
    this.history.unshift(historyRecord);

    this.saveState();

    return { success: true, xpAwarded: quest.xpReward };
  }

  public getActiveQuests(): DynamicQuest[] {
    return [...this.activeQuests];
  }

  public getHistory(): QuestHistoryRecord[] {
    return [...this.history];
  }

  public _resetForTesting() {
    this.activeQuests = [];
    this.history = [];
    this.activeDaysThisWeek = [];
    this.totalPlaybackMinutesToday = 0;
    localStorage.removeItem(QUEST_STATE_KEY);
    localStorage.removeItem(QUEST_HISTORY_KEY);
    localStorage.removeItem(ACTIVE_DAYS_KEY);
  }
}

export const questService = new QuestService();

