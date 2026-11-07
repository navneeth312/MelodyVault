import { Song, Playlist, SongMemory } from '../types';

export interface CollectionAnalysis {
  totalSongs: number;
  demoSongsCount: number;
  personalSongsCount: number;
  importedSongsCount: number;
  manualSongsCount: number;
  demoSongs: Song[];
  personalSongs: Song[];
  hasDemoMusic: boolean;
}

export interface CleanupBackupRecord {
  backupId: string;
  cleanedAt: string;
  removedDemoSongsCount: number;
  preservedPersonalSongsCount: number;
  previousSongs: Song[];
  previousPlaylists: Playlist[];
  previousMemories: SongMemory[];
}

/**
 * Deterministically checks if a song is a demonstration/sample track
 * versus a personally imported or manually created user track.
 */
export function isDemoSong(song: Song): boolean {
  if (!song) return false;

  // Explicit classification takes top priority
  if (song.source === 'user_import' || song.source === 'user_manual') {
    return false;
  }
  if (song.source === 'sample_demo') {
    return true;
  }

  // Any track imported by local file picker or IndexedDB
  if (song.isLocalImport === true || song.audioAvailability === 'local_file') {
    return false;
  }

  // Bundled sample songs have IDs like 'song-1'...'song-28' or 's1'...'s28'
  if (typeof song.id === 'string') {
    if (/^(song-|s)\d{1,3}$/.test(song.id)) {
      return true;
    }
    if (song.id.startsWith('local-')) return false;
    // User manual additions have timestamp-based IDs: song-1731... (length >= 14)
    if (song.id.startsWith('song-') && song.id.length >= 14) {
      return false;
    }
  }

  // If it's a stream or procedural preview without local file flags, it is demo catalog
  if (song.audioAvailability === 'stream' || song.audioAvailability === 'preview' || song.audioAvailability === 'metadata_only') {
    return true;
  }

  return false;
}

export function isPersonalSong(song: Song): boolean {
  return !isDemoSong(song);
}

/**
 * Analyzes the current collection to report demo vs personal songs.
 */
export function analyzeCollection(
  songs: Song[],
  playlists: Playlist[] = []
): CollectionAnalysis {
  const demoSongs: Song[] = [];
  const personalSongs: Song[] = [];
  let importedSongsCount = 0;
  let manualSongsCount = 0;

  for (const song of songs) {
    if (isDemoSong(song)) {
      demoSongs.push(song);
    } else {
      personalSongs.push(song);
      if (song.isLocalImport || song.audioAvailability === 'local_file' || song.id.startsWith('local-')) {
        importedSongsCount++;
      } else {
        manualSongsCount++;
      }
    }
  }

  return {
    totalSongs: songs.length,
    demoSongsCount: demoSongs.length,
    personalSongsCount: personalSongs.length,
    importedSongsCount,
    manualSongsCount,
    demoSongs,
    personalSongs,
    hasDemoMusic: demoSongs.length > 0,
  };
}

/**
 * Performs a safe cleanup:
 * - Retains only personal tracks.
 * - Updates playlists by removing references to deleted demo tracks while preserving playlists themselves.
 * - Creates a reversible snapshot backup.
 */
export function performSafeCleanup(
  songs: Song[],
  playlists: Playlist[],
  memories: SongMemory[] = []
): {
  cleanedSongs: Song[];
  cleanedPlaylists: Playlist[];
  cleanedMemories: SongMemory[];
  backupRecord: CleanupBackupRecord;
} {
  const analysis = analyzeCollection(songs, playlists);

  // Filter songs: keep strictly personal tracks
  const cleanedSongs = analysis.personalSongs.map((s) => ({
    ...s,
    source: (s.isLocalImport ? 'user_import' : 'user_manual') as any,
  }));

  const personalSongIdSet = new Set(cleanedSongs.map((s) => s.id));

  // Preserve user playlists, but prune deleted demo song IDs
  const cleanedPlaylists = playlists.map((pl) => ({
    ...pl,
    songIds: pl.songIds.filter((id) => personalSongIdSet.has(id)),
    updatedAt: new Date().toISOString(),
  }));

  // Preserve memories that match personal songs (or user notes)
  const cleanedMemories = memories.filter((m) => personalSongIdSet.has(m.songId));

  const backupRecord: CleanupBackupRecord = {
    backupId: `cleanup-backup-${Date.now()}`,
    cleanedAt: new Date().toISOString(),
    removedDemoSongsCount: analysis.demoSongsCount,
    preservedPersonalSongsCount: analysis.personalSongsCount,
    previousSongs: songs,
    previousPlaylists: playlists,
    previousMemories: memories,
  };

  return {
    cleanedSongs,
    cleanedPlaylists,
    cleanedMemories,
    backupRecord,
  };
}
