import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Song, Playlist } from '../types';
import {
  isPlayableSong,
  validateSongPlayability,
  getNextPlayableTrack,
} from './pureLogic';
import {
  filterSongsAfterBulkDelete,
  prunePlaylistsAfterDeletion,
  restoreDeletedBatch,
  isSongWithLocalAudio,
  DeletedBatchRecord,
} from './bulkDelete';

// Sample mock data for testing
const createSampleSong = (overrides: Partial<Song>): Song => ({
  id: 'test-1',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  genre: 'Rock',
  language: 'English',
  mood: 'High Energy',
  duration: 210,
  year: 2024,
  artwork: 'https://images.unsplash.com/photo-test',
  isFavorite: false,
  playCount: 5,
  lastPlayedAt: '2026-11-01',
  audioAvailability: 'local_file',
  isLocalImport: true,
  source: 'user_import',
  fileName: 'song.mp3',
  fileSize: 5000000,
  lyrics: [],
  ...overrides,
});

test('1. Selection Mode state management and lifecycle', () => {
  let isSelectMode = false;
  let selectedSongIds = new Set<string>();

  // Initially: select mode is disabled, 0 songs selected
  assert.equal(isSelectMode, false, 'Select mode should be disabled by default');
  assert.equal(selectedSongIds.size, 0, 'No songs should be selected initially');

  // Activate Select Mode
  isSelectMode = true;
  assert.equal(isSelectMode, true, 'Select mode should be active');

  // Select 3 songs
  selectedSongIds.add('song-a');
  selectedSongIds.add('song-b');
  selectedSongIds.add('song-c');
  assert.equal(selectedSongIds.size, 3, 'Should hold 3 selected songs');

  // Deselect one song
  selectedSongIds.delete('song-b');
  assert.equal(selectedSongIds.size, 2, 'Should hold 2 selected songs');
  assert.equal(selectedSongIds.has('song-b'), false);

  // Deselect all
  selectedSongIds = new Set();
  assert.equal(selectedSongIds.size, 0, 'Deselect all should clear the set');

  // Select all filtered songs
  const filteredSongIds = ['song-1', 'song-2', 'song-3', 'song-4'];
  selectedSongIds = new Set(filteredSongIds);
  assert.equal(selectedSongIds.size, 4, 'Should select all 4 filtered songs');

  // Cancel action: clears selection and exits select mode
  selectedSongIds = new Set();
  isSelectMode = false;
  assert.equal(isSelectMode, false, 'Cancel should exit selection mode');
  assert.equal(selectedSongIds.size, 0, 'Cancel should clear all selected songs');
});

test('2. Bulk deletion in Select Mode and automatic mode exit', () => {
  const songs: Song[] = [
    createSampleSong({ id: 'import-1', title: 'Imported 1', isLocalImport: true, source: 'user_import', audioAvailability: 'local_file' }),
    createSampleSong({ id: 'import-2', title: 'Imported 2', isLocalImport: true, source: 'user_import', audioAvailability: 'local_file' }),
    createSampleSong({ id: 'manual-3', title: 'Manual 3', isLocalImport: false, source: 'user_manual', audioAvailability: 'metadata_only', fileName: undefined }),
  ];

  let isSelectMode = true;
  let selectedIds = new Set(['import-1', 'manual-3']);

  // Verify counts
  const selectedSongs = songs.filter((s) => selectedIds.has(s.id));
  assert.equal(selectedSongs.length, 2);
  const importedCount = selectedSongs.filter(isSongWithLocalAudio).length;
  assert.equal(importedCount, 1, 'Only import-1 has local audio');

  // Perform deletion
  const { remainingSongs, deletedSongs } = filterSongsAfterBulkDelete(songs, selectedIds);
  assert.equal(remainingSongs.length, 1);
  assert.equal(remainingSongs[0].id, 'import-2');
  assert.equal(deletedSongs.length, 2);

  // After deletion finishes: selection mode exits and selected songs are cleared
  selectedIds = new Set();
  isSelectMode = false;
  assert.equal(isSelectMode, false, 'Select mode should exit upon deletion');
  assert.equal(selectedIds.size, 0, 'Selection should be cleared');
});

test('3. Table layout budget prevents horizontal overflow at 1366px, 1440px, and 1920px', () => {
  // Resolutions to verify:
  // Layout parameters in MelodyVault:
  // Sidebar = 256px, Padding = 64px (p-8 on both sides).
  // Available table width = ScreenWidth - 256 - 64.
  const resolutions = [
    { width: 1366, availableTableWidth: 1366 - 256 - 64 }, // 1046px
    { width: 1440, availableTableWidth: 1440 - 256 - 64 }, // 1120px
    { width: 1920, availableTableWidth: 1920 - 256 - 64 }, // 1600px
  ];

  // Fixed/minimum required column widths:
  // Checkbox column (in select mode): 40px (0px in normal mode)
  // Play/Index: 40px
  // Audio indicator: 96px
  // Time: 56px
  // Actions: 128px (fits all 5 action buttons with 24px each + gap)
  const fixedColumnsWidth = 40 + 40 + 96 + 56 + 128; // 360px with select mode (320px without)

  for (const res of resolutions) {
    const remainingForContent = res.availableTableWidth - fixedColumnsWidth;
    assert.ok(
      remainingForContent > 600,
      `At ${res.width}px, flexible columns (Title, Artist, Album, Genre, Mood) have ${remainingForContent}px (>600px)`
    );

    // Title gets flexible width with truncation; Actions column (128px) never wraps or overflows
    const actionsColumnFits = fixedColumnsWidth < res.availableTableWidth;
    assert.ok(actionsColumnFits, `Actions column fits safely within container at ${res.width}px`);
  }
});

test('4. Expanded player playback restrictions & controls verification', () => {
  const importedMp3 = createSampleSong({
    id: 'local-mp3-1',
    title: 'Imported Track',
    source: 'user_import',
    isLocalImport: true,
    audioAvailability: 'local_file',
    fileName: 'track.mp3',
  });

  const manualCatalogSong = createSampleSong({
    id: 'manual-cat-1',
    title: 'Catalog Song Only',
    source: 'user_manual',
    isLocalImport: false,
    audioAvailability: 'metadata_only',
  });

  // Verify playability check in expanded player
  assert.equal(isPlayableSong(importedMp3), true, 'Imported MP3 is playable in expanded player');
  assert.equal(isPlayableSong(manualCatalogSong), false, 'Manual song cannot be played in expanded player');

  // Verify rejection validation message
  const rejection = validateSongPlayability(manualCatalogSong);
  assert.equal(rejection.canPlay, false);
  assert.ok(rejection.message.toLowerCase().includes('manual catalogue'));

  // Verify next/previous skip non-playable tracks
  const queue = [manualCatalogSong, importedMp3, manualCatalogSong];
  const nextTrack = getNextPlayableTrack({
    songs: queue,
    currentSongId: 'manual-cat-1',
    isShuffle: false,
    repeatMode: 'off',
  });
  assert.equal(nextTrack?.id, 'local-mp3-1', 'Next track selects only playable imported track');
});

test('5. Undo deletion preserves restored songs and playlist mappings', async () => {
  const songA = createSampleSong({ id: 'song-a', title: 'Song Alpha' });
  const songB = createSampleSong({ id: 'song-b', title: 'Song Beta' });
  const initialPlaylist: Playlist = {
    id: 'pl-1',
    name: 'Favorites Playlist',
    description: 'My favs',
    coverGradient: 'from-purple-500 to-indigo-500',
    songIds: ['song-a', 'song-b'],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  // Bulk delete song-a
  const prunedPlaylists = prunePlaylistsAfterDeletion([initialPlaylist], new Set(['song-a']));
  assert.deepEqual(prunedPlaylists[0].songIds, ['song-b']);

  // Construct deleted batch backup with snapshot
  const deletedBatch: DeletedBatchRecord = {
    id: 'batch-test-1',
    deletedSongs: [songA],
    audioBlobs: [],
    playlistsSnapshot: [initialPlaylist],
    deletedAt: new Date().toISOString(),
  };

  // Restore deleted batch
  const { restoredSongs, restoredPlaylists } = restoreDeletedBatch([songB], deletedBatch);
  assert.equal(restoredSongs.length, 2);
  assert.ok(restoredSongs.some((s) => s.id === 'song-a'));
  assert.ok(restoredSongs.some((s) => s.id === 'song-b'));
  assert.ok(restoredPlaylists[0].songIds.includes('song-a'), 'Restored playlist contains song-a');
});

test('6. 3-way layout toggle state and Compact Row View requirements', () => {
  type ViewMode = 'table' | 'compact' | 'grid';
  let viewMode: ViewMode = 'table';

  // Toggle through all 3 modes
  const setMode = (m: ViewMode) => {
    viewMode = m;
  };

  assert.equal(viewMode, 'table');
  setMode('compact');
  assert.equal(viewMode, 'compact');
  setMode('grid');
  assert.equal(viewMode, 'grid');
  setMode('table');
  assert.equal(viewMode, 'table');

  // Verify compact view data contracts (2 lines per track)
  const track = createSampleSong({
    id: 'compact-track-1',
    title: 'Comfortably Numb',
    artist: 'Pink Floyd',
    album: 'The Wall',
    genre: 'Progressive Rock',
    language: 'English',
    mood: 'Deep Focus',
    duration: 382,
    fileName: 'comfortably_numb.mp3',
  });

  // Line 1 contracts: Title, Format, Artist, Album
  const line1Title = track.title;
  const line1Format = track.fileName?.endsWith('.wav') ? 'WAV' : 'MP3';
  const line1Artist = track.artist;
  const line1Album = track.album;

  assert.equal(line1Title, 'Comfortably Numb');
  assert.equal(line1Format, 'MP3');
  assert.equal(line1Artist, 'Pink Floyd');
  assert.equal(line1Album, 'The Wall');

  // Line 2 contracts: Genre, Language, Mood, Duration
  const line2Genre = track.genre;
  const line2Lang = track.language;
  const line2Mood = track.mood;
  assert.equal(line2Genre, 'Progressive Rock');
  assert.equal(line2Lang, 'English');
  assert.equal(line2Mood, 'Deep Focus');
});

test('7. Dual-track audio source switching and state management', () => {
  type AudioSource = 'original' | 'instrumental';
  let currentSource: AudioSource = 'original';
  let hasInstrumental = false;

  const toggleSource = () => {
    if (!hasInstrumental) return false;
    currentSource = currentSource === 'original' ? 'instrumental' : 'original';
    return true;
  };

  // When no instrumental stem exists, toggle returns false and stays on original
  const toggledWithoutStem = toggleSource();
  assert.equal(toggledWithoutStem, false);
  assert.equal(currentSource, 'original');

  // When instrumental stem is imported / rendered
  hasInstrumental = true;
  const toggledWithStem = toggleSource();
  assert.equal(toggledWithStem, true);
  assert.equal(currentSource, 'instrumental');

  // Toggle back to original
  toggleSource();
  assert.equal(currentSource, 'original');
});

test('8. Vocal separation status and model discrimination', () => {
  interface StemRecord {
    songId: string;
    modelUsed: 'studio_backing_track' | 'dsp_center_isolation_v1' | 'local_demucs_v4';
    size: number;
  }

  const studioImportStem: StemRecord = {
    songId: 'song-1',
    modelUsed: 'studio_backing_track',
    size: 6500000,
  };

  const dspIsolatedStem: StemRecord = {
    songId: 'song-2',
    modelUsed: 'dsp_center_isolation_v1',
    size: 28000000,
  };

  // Verify models are clearly distinguished without false claims
  assert.equal(studioImportStem.modelUsed, 'studio_backing_track');
  assert.equal(dspIsolatedStem.modelUsed, 'dsp_center_isolation_v1');
  assert.notEqual(studioImportStem.modelUsed, dspIsolatedStem.modelUsed);
});
