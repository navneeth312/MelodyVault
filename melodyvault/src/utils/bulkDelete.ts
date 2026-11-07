import { Song, Playlist } from '../types';

export interface BulkDeleteStats {
  totalCount: number;
  selectedSongs: Song[];
  songTitles: string[];
  importedCount: number;
  importedSongs: Song[];
  manualCount: number;
  demoCount: number;
}

export interface DeletedBatchRecord {
  id: string;
  deletedSongs: Song[];
  audioBlobs: Array<{
    songId: string;
    blob: Blob;
    filename: string;
  }>;
  playlistsSnapshot: Playlist[];
  deletedAt: string;
}

/**
 * Checks if a song represents a local audio import that has an IndexedDB binary.
 */
export function isSongWithLocalAudio(song: Song): boolean {
  return (
    song.audioAvailability === 'local_file' ||
    song.isLocalImport === true ||
    (typeof song.audioUrl === 'string' && song.audioUrl.startsWith('blob:'))
  );
}

/**
 * Calculates statistics for currently selected songs.
 */
export function calculateBulkDeleteStats(
  selectedIds: Set<string>,
  allSongs: Song[]
): BulkDeleteStats {
  const selectedSongs = allSongs.filter((s) => selectedIds.has(s.id));
  const importedSongs = selectedSongs.filter(isSongWithLocalAudio);
  const manualSongs = selectedSongs.filter(
    (s) => s.source === 'user_manual' && !isSongWithLocalAudio(s)
  );
  const demoSongs = selectedSongs.filter(
    (s) => s.source === 'sample_demo' || (!s.source && !isSongWithLocalAudio(s))
  );

  return {
    totalCount: selectedSongs.length,
    selectedSongs,
    songTitles: selectedSongs.map((s) => s.title),
    importedCount: importedSongs.length,
    importedSongs,
    manualCount: manualSongs.length,
    demoCount: demoSongs.length,
  };
}

/**
 * Filters the song list removing only selected song IDs.
 * Guarantees unselected songs remain completely untouched.
 */
export function filterSongsAfterBulkDelete(
  songs: Song[],
  selectedIds: Set<string>
): { remainingSongs: Song[]; deletedSongs: Song[] } {
  const remainingSongs: Song[] = [];
  const deletedSongs: Song[] = [];

  for (const song of songs) {
    if (selectedIds.has(song.id)) {
      deletedSongs.push(song);
    } else {
      remainingSongs.push(song);
    }
  }

  return { remainingSongs, deletedSongs };
}

/**
 * Prunes deleted song IDs from all playlists without modifying playlist metadata.
 */
export function prunePlaylistsAfterDeletion(
  playlists: Playlist[],
  deletedIds: Set<string>
): Playlist[] {
  return playlists.map((playlist) => {
    const nextSongIds = playlist.songIds.filter((id) => !deletedIds.has(id));
    // If no songs changed, return original reference
    if (nextSongIds.length === playlist.songIds.length) {
      return playlist;
    }
    return {
      ...playlist,
      songIds: nextSongIds,
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Identifies artwork URLs that are orphaned (no remaining song references them).
 */
export function findOrphanedArtworks(
  deletedSongs: Song[],
  remainingSongs: Song[]
): string[] {
  const remainingArtworkSet = new Set(remainingSongs.map((s) => s.artwork));
  const orphaned: string[] = [];

  for (const song of deletedSongs) {
    if (song.artwork && !remainingArtworkSet.has(song.artwork)) {
      orphaned.push(song.artwork);
    }
  }

  return Array.from(new Set(orphaned));
}

/**
 * Restores a previously deleted batch of songs and their playlist associations.
 */
export function restoreDeletedBatch(
  currentSongs: Song[],
  deletedBatch: DeletedBatchRecord
): { restoredSongs: Song[]; restoredPlaylists: Playlist[] } {
  // Re-insert songs (avoiding accidental duplicates if already present)
  const existingIds = new Set(currentSongs.map((s) => s.id));
  const songsToAdd = deletedBatch.deletedSongs.filter((s) => !existingIds.has(s.id));
  const restoredSongs = [...songsToAdd, ...currentSongs];

  // Restore playlist song associations based on snapshot
  const snapshotMap = new Map(deletedBatch.playlistsSnapshot.map((p) => [p.id, p]));
  const restoredPlaylists = deletedBatch.playlistsSnapshot.map((snap) => {
    return {
      ...snap,
      updatedAt: new Date().toISOString(),
    };
  });

  return { restoredSongs, restoredPlaylists };
}
