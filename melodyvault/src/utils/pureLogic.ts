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

export interface PlayableSongCandidate {
  id?: string;
  source?: string;
  isLocalImport?: boolean;
  audioAvailability?: string;
  title?: string;
  duration?: number;
  audioUrl?: string | null;
  streamUrl?: string;
}

/**
 * Centrally validates if a song has valid attributes for playback:
 * 1. Personal imported audio file: source === 'user_import', isLocalImport === true, audioAvailability === 'local_file'
 * 2. Authorized public catalogue track: source === 'public_catalogue', has audioUrl/streamUrl
 */
export function isPlayableSong<T extends PlayableSongCandidate>(song: T | null | undefined): song is T & {
  source: 'user_import' | 'public_catalogue';
  audioAvailability: 'local_file' | 'stream';
} {
  if (!song) return false;
  if (
    song.source === 'user_import' &&
    song.isLocalImport === true &&
    song.audioAvailability === 'local_file'
  ) {
    return true;
  }
  if (
    song.source === 'public_catalogue' &&
    (song.audioAvailability === 'stream' || song.audioAvailability === 'local_file') &&
    Boolean(song.audioUrl || song.streamUrl)
  ) {
    return true;
  }
  return false;
}

export interface PlayabilityValidationResult {
  canPlay: boolean;
  code: 'OK' | 'NO_SONG' | 'NOT_IMPORTED' | 'BUCKET_LIST' | 'MANUAL_ENTRY' | 'DEMO_TRACK';
  message: string;
}

/**
 * Validates a song's playability and returns a descriptive explanation if playback is prohibited.
 */
export function validateSongPlayability(song: PlayableSongCandidate | null | undefined): PlayabilityValidationResult {
  if (!song) {
    return {
      canPlay: false,
      code: 'NO_SONG',
      message: 'No song selected for playback.',
    };
  }

  if (isPlayableSong(song)) {
    return {
      canPlay: true,
      code: 'OK',
      message: song.source === 'public_catalogue'
        ? 'Authorized public catalogue track ready for playback.'
        : 'Valid imported audio file ready for local playback.',
    };
  }

  // Specific descriptive reasons
  if (song.source === 'sample_demo' || (song.id && (/^(song-|s)\d{1,3}$/.test(song.id)))) {
    return {
      canPlay: false,
      code: 'DEMO_TRACK',
      message: `Cannot play "${song.title || 'this track'}": Demo catalog items cannot be played. Only locally imported MP3 and WAV files are supported.`,
    };
  }

  if (song.source === 'user_manual' || (song.id && !song.isLocalImport)) {
    return {
      canPlay: false,
      code: 'MANUAL_ENTRY',
      message: `Cannot play "${song.title || 'this track'}": Manual catalogue entries do not contain audio files. Only locally imported MP3 and WAV files can be played.`,
    };
  }

  return {
    canPlay: false,
    code: 'NOT_IMPORTED',
    message: `Cannot play "${song.title || 'this track'}": Only locally imported MP3 and WAV files with stored audio can be played.`,
  };
}

/**
 * Filters a list of tracks so only playable imported tracks remain.
 */
export function filterPlayableTracks<T extends PlayableSongCandidate>(songs: T[]): T[] {
  return songs.filter(isPlayableSong);
}

/**
 * Gets the next playable track in a collection, considering shuffle and repeat mode.
 */
export function getNextPlayableTrack<T extends PlayableSongCandidate>({
  songs,
  currentSongId,
  isShuffle,
  repeatMode,
  randomFn = Math.random,
}: {
  songs: T[];
  currentSongId: string | null;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  randomFn?: () => number;
}): T | null {
  const playable = filterPlayableTracks(songs);
  if (playable.length === 0) return null;

  if (repeatMode === 'one' && currentSongId) {
    const current = playable.find((s) => s.id === currentSongId);
    if (current) return current;
  }

  if (isShuffle) {
    if (playable.length === 1) return playable[0];
    const pool = currentSongId ? playable.filter((s) => s.id !== currentSongId) : playable;
    const choicePool = pool.length > 0 ? pool : playable;
    const idx = Math.floor(randomFn() * choicePool.length);
    return choicePool[idx];
  }

  if (!currentSongId) return playable[0];
  const currentIndex = playable.findIndex((s) => s.id === currentSongId);
  if (currentIndex >= 0 && currentIndex < playable.length - 1) {
    return playable[currentIndex + 1];
  }
  if (currentIndex === -1) {
    // Current song is not in the playable list (e.g. non-playable catalogue track).
    // Find first playable track occurring after currentSongId in the original queue.
    const fullIndex = songs.findIndex((s) => s.id === currentSongId);
    if (fullIndex >= 0) {
      const nextInFull = songs.slice(fullIndex + 1).find(isPlayableSong);
      if (nextInFull) return nextInFull;
    }
    return playable[0];
  }
  if (repeatMode === 'all') {
    return playable[0];
  }
  return null;
}

/**
 * Gets the previous playable track in a collection.
 */
export function getPreviousPlayableTrack<T extends PlayableSongCandidate>({
  songs,
  currentSongId,
}: {
  songs: T[];
  currentSongId: string | null;
}): T | null {
  const playable = filterPlayableTracks(songs);
  if (playable.length === 0) return null;
  if (!currentSongId) return playable[0];

  const currentIndex = playable.findIndex((s) => s.id === currentSongId);
  if (currentIndex > 0) {
    return playable[currentIndex - 1];
  }
  if (currentIndex === -1) {
    const fullIndex = songs.findIndex((s) => s.id === currentSongId);
    if (fullIndex > 0) {
      const prevPlayable = [...songs.slice(0, fullIndex)].reverse().find(isPlayableSong);
      if (prevPlayable) return prevPlayable;
    }
    return playable[playable.length - 1];
  }
  return playable[playable.length - 1];
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
