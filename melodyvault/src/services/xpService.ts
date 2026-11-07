import { calculateLevelFromXP, LevelInfo } from '../utils/pureLogic';

export type XPRewardSource =
  | 'unique_import'
  | 'first_listen'
  | 'quest_completion'
  | 'challenge_completion'
  | 'badge_unlocked'
  | 'playlist_created'
  | 'memory_journal';

export interface XPRewardRecord {
  id: string; // Unique transaction ID, e.g. 'import_local-123' or 'listen_local-123'
  source: XPRewardSource;
  action: string;
  songId?: string;
  amount: number;
  timestamp: string; // ISO date string
  dayDate: string; // YYYY-MM-DD
}

export interface PlaybackListenTracker {
  songId: string;
  duration: number;
  listenedSeconds: Set<number>; // Set of second buckets listened to
  lastRecordedCurrentTime: number;
  lastRecordedWallClockTime: number;
  hasBeenAwarded: boolean;
}

const XP_LEDGER_KEY = 'melodyvault_v1_xp_ledger';
const DAILY_LISTENING_XP_CAP = 150; // Maximum XP that can be earned per day from listening
const XP_FOR_UNIQUE_IMPORT = 10;
const XP_FOR_FIRST_LISTEN = 15;

export class XPService {
  private ledger: XPRewardRecord[] = [];
  private currentListenTracker: PlaybackListenTracker | null = null;
  private totalXP: number = 0;

  constructor() {
    this.loadLedger();
  }

  private getTodayString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  public loadLedger(): XPRewardRecord[] {
    try {
      if (typeof localStorage === 'undefined') {
        this.ledger = [];
        this.totalXP = 0;
        return [];
      }
      const stored = localStorage.getItem(XP_LEDGER_KEY);
      if (stored) {
        this.ledger = JSON.parse(stored);
        this.totalXP = this.ledger.reduce((acc, r) => acc + (r.amount || 0), 0);
      } else {
        this.ledger = [];
        this.totalXP = 0;
      }
    } catch (e) {
      console.warn('Failed to load XP ledger from storage', e);
      this.ledger = [];
      this.totalXP = 0;
    }
    return this.ledger;
  }

  private saveLedger() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(XP_LEDGER_KEY, JSON.stringify(this.ledger));
    } catch (e) {
      console.warn('Failed to save XP ledger to storage', e);
    }
  }

  public getLedger(): XPRewardRecord[] {
    return [...this.ledger];
  }

  public getTotalXP(): number {
    return this.totalXP;
  }

  public getLevelInfo(): LevelInfo {
    return calculateLevelFromXP(this.totalXP);
  }

  public hasReward(rewardId: string): boolean {
    return this.ledger.some((r) => r.id === rewardId);
  }

  public getListeningXPToday(): number {
    const today = this.getTodayString();
    return this.ledger
      .filter((r) => r.dayDate === today && r.source === 'first_listen')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  public getDailyListeningCap(): number {
    return DAILY_LISTENING_XP_CAP;
  }

  /**
   * Core centralized reward awarding method with anti-farming guarantees.
   */
  public awardReward({
    id,
    source,
    action,
    songId,
    amount,
  }: {
    id: string;
    source: XPRewardSource;
    action: string;
    songId?: string;
    amount: number;
  }): { awarded: boolean; amount: number; reason?: string } {
    if (amount <= 0) {
      return { awarded: false, amount: 0, reason: 'Zero or negative amount' };
    }

    // 1. Anti-farming: Check duplicate reward transaction ID
    if (this.hasReward(id)) {
      return { awarded: false, amount: 0, reason: 'Reward already claimed (anti-farming: duplicate transaction ID)' };
    }

    // 2. Anti-farming: Check daily listening cap
    if (source === 'first_listen') {
      const todayListeningXP = this.getListeningXPToday();
      if (todayListeningXP >= DAILY_LISTENING_XP_CAP) {
        return {
          awarded: false,
          amount: 0,
          reason: `Daily listening XP cap reached (${DAILY_LISTENING_XP_CAP} XP/day)`,
        };
      }
      // If adding would exceed cap, cap it to remaining allowance
      const allowed = Math.min(amount, DAILY_LISTENING_XP_CAP - todayListeningXP);
      if (allowed <= 0) {
        return { awarded: false, amount: 0, reason: 'Daily listening cap reached' };
      }
      amount = allowed;
    }

    // Record the reward transaction
    const today = this.getTodayString();
    const record: XPRewardRecord = {
      id,
      source,
      action,
      songId,
      amount,
      timestamp: new Date().toISOString(),
      dayDate: today,
    };

    this.ledger.push(record);
    this.totalXP += amount;
    this.saveLedger();

    return { awarded: true, amount };
  }

  /**
   * Award +10 XP for a successfully imported unique audio file.
   * Duplicate or failed imports receive zero XP.
   */
  public awardUniqueImport(songId: string, title: string): { awarded: boolean; amount: number } {
    if (!songId) return { awarded: false, amount: 0 };
    const rewardId = `import_${songId}`;
    return this.awardReward({
      id: rewardId,
      source: 'unique_import',
      action: `Imported unique audio track "${title}"`,
      songId,
      amount: XP_FOR_UNIQUE_IMPORT,
    });
  }

  /**
   * Begins tracking playback for genuine listening.
   * Resets tracker on song change.
   */
  public startListeningSession(songId: string, duration: number, isPlayable: boolean) {
    if (!isPlayable || !songId || duration <= 0) {
      this.currentListenTracker = null;
      return;
    }

    const rewardId = `first_listen_${songId}`;
    const alreadyAwarded = this.hasReward(rewardId);

    this.currentListenTracker = {
      songId,
      duration,
      listenedSeconds: new Set<number>(),
      lastRecordedCurrentTime: 0,
      lastRecordedWallClockTime: Date.now(),
      hasBeenAwarded: alreadyAwarded,
    };
  }

  /**
   * Records genuine playback progress.
   * Enforces:
   * 1. Seeking forward does not credit unlistened seconds.
   * 2. Must genuinely play 80% of duration.
   * 3. Rapid play/pause spam cannot credit seconds.
   */
  public updateListeningProgress(
    songId: string,
    currentTime: number,
    duration: number,
    songTitle: string
  ): { awarded: boolean; amount: number } {
    if (!this.currentListenTracker || this.currentListenTracker.songId !== songId) {
      return { awarded: false, amount: 0 };
    }

    if (this.currentListenTracker.hasBeenAwarded) {
      return { awarded: false, amount: 0 };
    }

    const now = Date.now();
    const tracker = this.currentListenTracker;
    const wallClockDeltaSec = (now - tracker.lastRecordedWallClockTime) / 1000;
    const mediaTimeDeltaSec = Math.abs(currentTime - tracker.lastRecordedCurrentTime);

    // Update trackers for next tick
    tracker.lastRecordedWallClockTime = now;
    tracker.lastRecordedCurrentTime = currentTime;

    // Anti-farming check: If user jumped/seeked (media delta is much larger than elapsed wall-clock time),
    // do not credit the jump as genuine listening!
    if (mediaTimeDeltaSec > 2.5 && wallClockDeltaSec < 1.5) {
      return { awarded: false, amount: 0 };
    }

    // Only record genuine continuous playback increments (e.g. media clock advances normally)
    if (mediaTimeDeltaSec <= 2.5) {
      const secondBucket = Math.floor(currentTime);
      if (secondBucket >= 0 && secondBucket <= duration) {
        tracker.listenedSeconds.add(secondBucket);
      }
    }

    // Requirement: Track at least 80% genuine playback progress
    const requiredSeconds = Math.floor(duration * 0.8);
    if (tracker.listenedSeconds.size >= requiredSeconds && requiredSeconds > 0) {
      tracker.hasBeenAwarded = true;
      const rewardId = `first_listen_${songId}`;
      return this.awardReward({
        id: rewardId,
        source: 'first_listen',
        action: `First meaningful listen to "${songTitle}" (80%+ completed)`,
        songId,
        amount: XP_FOR_FIRST_LISTEN,
      });
    }

    return { awarded: false, amount: 0 };
  }

  /**
   * Migrates legacy XP without resetting progress or awarding duplicate historical rewards.
   */
  public migrateExistingXP(legacyXP: number) {
    if (this.totalXP === 0 && legacyXP > 0) {
      const initialRecord: XPRewardRecord = {
        id: 'legacy_xp_migration',
        source: 'unique_import',
        action: 'Preserved user journey progress migration',
        amount: legacyXP,
        timestamp: new Date().toISOString(),
        dayDate: this.getTodayString(),
      };
      this.ledger.push(initialRecord);
      this.totalXP = legacyXP;
      this.saveLedger();
    }
  }

  /**
   * Resets ledger only for testing purposes.
   */
  public _resetForTesting() {
    this.ledger = [];
    this.totalXP = 0;
    this.currentListenTracker = null;
    localStorage.removeItem(XP_LEDGER_KEY);
  }
}

export const xpService = new XPService();

