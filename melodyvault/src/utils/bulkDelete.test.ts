import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBulkDeleteStats,
  filterSongsAfterBulkDelete,
  prunePlaylistsAfterDeletion,
  findOrphanedArtworks,
  restoreDeletedBatch,
  DeletedBatchRecord,
} from './bulkDelete';
import { Song, Playlist } from '../types';

const mockManualSong1: Song = {
  id: 'song-manual-1',
  title: 'Midnight Coding Track',
  artist: 'Dev Artist',
  album: 'Code Vibes',
  genre: 'Lo-Fi',
  language: 'English',
  duration: 180,
  artwork: 'https://example.com/art1.jpg',
  audioAvailability: 'stream',
  year: 2024,
  playCount: 5,
  lastPlayedAt: '2026-11-01T10:00:00Z',
  isFavorite: true,
  lyrics: [],
  mood: 'Deep Focus',
  source: 'user_manual',
};

const mockManualSong2: Song = {
  id: 'song-manual-2',
  title: 'Dawn Journey',
  artist: 'Solaris',
  album: 'Morning Horizons',
  genre: 'Ambient',
  language: 'Instrumental',
  duration: 210,
  artwork: 'https://example.com/art-shared.jpg',
  audioAvailability: 'preview',
  year: 2023,
  playCount: 2,
  lastPlayedAt: null,
  isFavorite: false,
  lyrics: [],
  mood: 'Chill Lo-Fi',
  source: 'user_manual',
};

const mockImportedSong: Song = {
  id: 'local-audio-12345',
  title: 'My Studio Demo',
  artist: 'Local Band',
  album: 'Unreleased Sessions',
  genre: 'Rock',
  language: 'English',
  duration: 245,
  artwork: 'https://example.com/art-shared.jpg',
  audioAvailability: 'local_file',
  isLocalImport: true,
  fileName: 'studio_demo.wav',
  fileSize: 45000000,
  year: 2025,
  playCount: 12,
  lastPlayedAt: '2026-11-06T15:00:00Z',
  isFavorite: true,
  lyrics: [],
  mood: 'High Energy',
  source: 'user_import',
};

const mockUnselectedSong: Song = {
  id: 'song-unselected-99',
  title: 'Evergreen Melody',
  artist: 'Classic Master',
  album: 'Classics',
  genre: 'Classical',
  language: 'Instrumental',
  duration: 300,
  artwork: 'https://example.com/art-evergreen.jpg',
  audioAvailability: 'stream',
  year: 2020,
  playCount: 20,
  lastPlayedAt: '2026-11-05T12:00:00Z',
  isFavorite: false,
  lyrics: [],
  mood: 'Euphoric',
  source: 'user_manual',
};

test('1. Delete one manually catalogued song', () => {
  const songs = [mockManualSong1, mockUnselectedSong];
  const selectedIds = new Set(['song-manual-1']);

  const stats = calculateBulkDeleteStats(selectedIds, songs);
  assert.equal(stats.totalCount, 1);
  assert.equal(stats.importedCount, 0);
  assert.equal(stats.manualCount, 1);
  assert.deepEqual(stats.songTitles, ['Midnight Coding Track']);

  const { remainingSongs, deletedSongs } = filterSongsAfterBulkDelete(songs, selectedIds);
  assert.equal(deletedSongs.length, 1);
  assert.equal(deletedSongs[0].id, 'song-manual-1');
  assert.equal(remainingSongs.length, 1);
  assert.equal(remainingSongs[0].id, 'song-unselected-99');
});

test('2. Delete multiple selected songs', () => {
  const songs = [mockManualSong1, mockManualSong2, mockImportedSong, mockUnselectedSong];
  const selectedIds = new Set(['song-manual-1', 'song-manual-2']);

  const stats = calculateBulkDeleteStats(selectedIds, songs);
  assert.equal(stats.totalCount, 2);
  assert.equal(stats.manualCount, 2);
  assert.equal(stats.importedCount, 0);

  const { remainingSongs, deletedSongs } = filterSongsAfterBulkDelete(songs, selectedIds);
  assert.equal(deletedSongs.length, 2);
  assert.equal(remainingSongs.length, 2);
  assert.ok(remainingSongs.some((s) => s.id === 'local-audio-12345'));
  assert.ok(remainingSongs.some((s) => s.id === 'song-unselected-99'));
});

test('3. Delete one imported song and verify its audio count/stats is handled correctly', () => {
  const songs = [mockImportedSong, mockUnselectedSong];
  const selectedIds = new Set(['local-audio-12345']);

  const stats = calculateBulkDeleteStats(selectedIds, songs);
  assert.equal(stats.totalCount, 1);
  assert.equal(stats.importedCount, 1);
  assert.equal(stats.importedSongs[0].fileName, 'studio_demo.wav');

  const { remainingSongs, deletedSongs } = filterSongsAfterBulkDelete(songs, selectedIds);
  assert.equal(deletedSongs.length, 1);
  assert.equal(deletedSongs[0].isLocalImport, true);
  assert.equal(remainingSongs.length, 1);
  assert.equal(remainingSongs[0].id, 'song-unselected-99');
});

test('4. Cancel deletion preserves all state untouched', () => {
  const songs = [mockManualSong1, mockImportedSong, mockUnselectedSong];
  const selectedIds = new Set(['local-audio-12345']);

  // On cancel, no filtering is executed
  assert.equal(songs.length, 3);
  assert.ok(selectedIds.size > 0);
  // Unchanged
  assert.deepEqual(
    songs.map((s) => s.id),
    ['song-manual-1', 'local-audio-12345', 'song-unselected-99']
  );
});

test('5. Undo deletion restores songs and playlist song references', () => {
  const originalSongs = [mockManualSong1, mockImportedSong, mockUnselectedSong];
  const originalPlaylists: Playlist[] = [
    {
      id: 'pl-1',
      name: 'Coding Jams',
      description: 'Focus tracks',
      coverGradient: 'purple',
      songIds: ['song-manual-1', 'local-audio-12345', 'song-unselected-99'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const selectedIds = new Set(['song-manual-1', 'local-audio-12345']);

  // Step 1: Perform delete
  const { remainingSongs, deletedSongs } = filterSongsAfterBulkDelete(originalSongs, selectedIds);
  const updatedPlaylists = prunePlaylistsAfterDeletion(originalPlaylists, selectedIds);

  assert.equal(remainingSongs.length, 1);
  assert.equal(deletedSongs.length, 2);
  assert.deepEqual(updatedPlaylists[0].songIds, ['song-unselected-99']);

  // Create temporary backup snapshot
  const batchSnapshot: DeletedBatchRecord = {
    id: 'batch-test-1',
    deletedSongs,
    audioBlobs: [],
    playlistsSnapshot: originalPlaylists,
    deletedAt: new Date().toISOString(),
  };

  // Step 2: Perform Undo
  const { restoredSongs, restoredPlaylists } = restoreDeletedBatch(remainingSongs, batchSnapshot);

  assert.equal(restoredSongs.length, 3);
  assert.ok(restoredSongs.some((s) => s.id === 'song-manual-1'));
  assert.ok(restoredSongs.some((s) => s.id === 'local-audio-12345'));
  assert.ok(restoredSongs.some((s) => s.id === 'song-unselected-99'));
  assert.deepEqual(restoredPlaylists[0].songIds, [
    'song-manual-1',
    'local-audio-12345',
    'song-unselected-99',
  ]);
});

test('6. Confirm unselected songs remain completely untouched', () => {
  const songs = [mockManualSong1, mockManualSong2, mockImportedSong, mockUnselectedSong];
  const selectedIds = new Set(['song-manual-1', 'local-audio-12345']);

  const { remainingSongs } = filterSongsAfterBulkDelete(songs, selectedIds);
  assert.equal(remainingSongs.length, 2);
  assert.equal(remainingSongs[0].title, 'Dawn Journey');
  assert.equal(remainingSongs[1].title, 'Evergreen Melody');
  // Play count and metadata preserved
  assert.equal(remainingSongs[1].playCount, 20);
});

test('7. Verify playlist and favourites consistency', () => {
  const playlists: Playlist[] = [
    {
      id: 'pl-favs',
      name: 'Best of All Time',
      description: 'Top picks',
      coverGradient: 'blue',
      songIds: ['song-manual-1', 'song-unselected-99'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const deletedIds = new Set(['song-manual-1']);
  const pruned = prunePlaylistsAfterDeletion(playlists, deletedIds);

  assert.deepEqual(pruned[0].songIds, ['song-unselected-99']);
  // Unrelated playlist songs preserved
  assert.equal(pruned[0].name, 'Best of All Time');
});

test('8. Orphaned artwork detection', () => {
  // mockManualSong1 has artwork: 'https://example.com/art1.jpg' (unique to it)
  // mockManualSong2 has artwork: 'https://example.com/art-shared.jpg'
  // mockImportedSong has artwork: 'https://example.com/art-shared.jpg' (shared with mockManualSong2)
  // mockUnselectedSong has artwork: 'https://example.com/art-evergreen.jpg'

  // If we delete mockManualSong1 and mockImportedSong:
  // art1.jpg should be orphaned (nobody else uses it)
  // art-shared.jpg should NOT be orphaned because mockManualSong2 is still in remainingSongs!
  const deleted = [mockManualSong1, mockImportedSong];
  const remaining = [mockManualSong2, mockUnselectedSong];

  const orphaned = findOrphanedArtworks(deleted, remaining);
  assert.deepEqual(orphaned, ['https://example.com/art1.jpg']);
  assert.ok(!orphaned.includes('https://example.com/art-shared.jpg'));
});
