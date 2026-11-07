export interface SongMinimal {
  id: string;
  duration: number;
  lastPlayedAt: string | null;
  playCount: number;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatTotalDurationDetailed(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  return `${secs}s`;
}

export function calculatePlaylistStats(allSongs: SongMinimal[], songIds: string[]) {
  const songMap = new Map<string, SongMinimal>();
  for (const s of allSongs) {
    songMap.set(s.id, s);
  }

  let totalSeconds = 0;
  let validCount = 0;
  for (const id of songIds) {
    const s = songMap.get(id);
    if (s) {
      totalSeconds += s.duration || 0;
      validCount++;
    }
  }

  return {
    songCount: validCount,
    totalSeconds,
    formattedDuration: formatTotalDurationDetailed(totalSeconds),
  };
}

export interface LevelInfo {
  level: number;
  currentTierTitle: string;
  currentLevelBaseXP: number;
  nextTierXP: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  progressPercent: number;
}

export function calculateLevelFromXP(xp: number): LevelInfo {
  const safeXP = Math.max(0, Math.floor(xp || 0));
  // 250 XP per level
  const xpPerLevel = 250;
  const level = Math.floor(safeXP / xpPerLevel) + 1;
  const currentLevelBaseXP = (level - 1) * xpPerLevel;
  const nextTierXP = level * xpPerLevel;
  const xpInCurrentLevel = safeXP - currentLevelBaseXP;
  const xpNeededForNext = nextTierXP - currentLevelBaseXP;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100));

  let currentTierTitle = 'Acoustic Novice';
  if (level >= 10) currentTierTitle = 'Sonic Legend';
  else if (level >= 8) currentTierTitle = 'Melody Maestro';
  else if (level >= 6) currentTierTitle = 'Harmonic Virtuoso';
  else if (level >= 4) currentTierTitle = 'Audio Curator';
  else if (level >= 2) currentTierTitle = 'Vinyl Enthusiast';

  return {
    level,
    currentTierTitle,
    currentLevelBaseXP,
    nextTierXP,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercent,
  };
}

export function filterForgottenSongs(songs: SongMinimal[], daysThreshold: number, nowInput?: Date | string | number): SongMinimal[] {
  const now = nowInput ? new Date(nowInput).getTime() : Date.now();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

  return songs.filter((s) => {
    // If never played
    if (!s.lastPlayedAt || s.playCount === 0) {
      return true;
    }
    const playedTime = new Date(s.lastPlayedAt).getTime();
    if (isNaN(playedTime)) return true;
    return now - playedTime >= thresholdMs;
  });
}

export function isTimeCapsuleUnlocked(unlockDateISO: string, nowInput?: Date | string | number): boolean {
  if (!unlockDateISO) return false;
  const unlockTime = new Date(unlockDateISO).getTime();
  if (isNaN(unlockTime)) return false;
  const now = nowInput ? new Date(nowInput).getTime() : Date.now();
  return now >= unlockTime;
}

export function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
  if (
    startIndex < 0 ||
    startIndex >= list.length ||
    endIndex < 0 ||
    endIndex >= list.length ||
    startIndex === endIndex
  ) {
    return [...list];
  }
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}
