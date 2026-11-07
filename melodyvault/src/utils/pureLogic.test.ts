import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDuration,
  formatTotalDurationDetailed,
  calculatePlaylistStats,
  calculateLevelFromXP,
  filterForgottenSongs,
  isTimeCapsuleUnlocked,
  reorderArray,
  isPlayableSong,
  validateSongPlayability,
  filterPlayableTracks,
  getNextPlayableTrack,
  getPreviousPlayableTrack,
} from './pureLogic';

test('formatDuration formats mm:ss correctly', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(234), '3:54');
});

test('formatTotalDurationDetailed formats multi-minute/hour songs', () => {
  assert.equal(formatTotalDurationDetailed(0), '0 min');
  assert.equal(formatTotalDurationDetailed(150), '2 min 30s');
  assert.equal(formatTotalDurationDetailed(3660), '1 hr 1 min');
});

test('calculatePlaylistStats correctly aggregates song count and total seconds', () => {
  const songs = [
    { id: 's1', duration: 180, lastPlayedAt: null, playCount: 0 },
    { id: 's2', duration: 240, lastPlayedAt: null, playCount: 0 },
    { id: 's3', duration: 200, lastPlayedAt: null, playCount: 0 },
  ];
  const stats = calculatePlaylistStats(songs, ['s1', 's2']);
  assert.equal(stats.songCount, 2);
  assert.equal(stats.totalSeconds, 420);
  assert.equal(stats.formattedDuration, '7 min');
});

test('calculateLevelFromXP handles tiers and progression accurately', () => {
  const lvl1 = calculateLevelFromXP(50);
  assert.equal(lvl1.level, 1);
  assert.equal(lvl1.currentTierTitle, 'Acoustic Novice');
  assert.equal(lvl1.progressPercent, 20);

  const lvl3 = calculateLevelFromXP(550);
  assert.equal(lvl3.level, 3);
  assert.equal(lvl3.currentTierTitle, 'Vinyl Enthusiast');

  const lvl10 = calculateLevelFromXP(2600);
  assert.equal(lvl10.level, 11);
  assert.equal(lvl10.currentTierTitle, 'Sonic Legend');
});

test('filterForgottenSongs catches unplayed songs or songs older than threshold', () => {
  const baseTime = new Date('2026-11-01T00:00:00.000Z').getTime();
  const songs = [
    { id: 's1', duration: 100, lastPlayedAt: null, playCount: 0 }, // never played
    { id: 's2', duration: 100, lastPlayedAt: '2026-10-15T00:00:00.000Z', playCount: 5 }, // 17 days ago
    { id: 's3', duration: 100, lastPlayedAt: '2026-10-31T12:00:00.000Z', playCount: 12 }, // < 1 day ago
  ];

  const forgotten14Days = filterForgottenSongs(songs, 14, baseTime);
  const ids = forgotten14Days.map((s) => s.id);
  assert.ok(ids.includes('s1'));
  assert.ok(ids.includes('s2'));
  assert.ok(!ids.includes('s3'));
});

test('isTimeCapsuleUnlocked handles past vs future lock dates', () => {
  const now = new Date('2026-11-07T12:00:00.000Z');
  assert.equal(isTimeCapsuleUnlocked('2026-11-01T00:00:00.000Z', now), true);
  assert.equal(isTimeCapsuleUnlocked('2026-12-31T23:59:59.000Z', now), false);
});

test('reorderArray swaps positions properly without mutating original', () => {
  const list = ['A', 'B', 'C', 'D'];
  const reordered = reorderArray(list, 0, 2);
  assert.deepEqual(reordered, ['B', 'C', 'A', 'D']);
  assert.deepEqual(list, ['A', 'B', 'C', 'D']);
});

test('isPlayableSong returns true only when source===user_import, isLocalImport===true, audioAvailability===local_file', () => {
  // Valid imported MP3
  const validMP3 = {
    id: 'local-mp3-1',
    source: 'user_import',
    isLocalImport: true,
    audioAvailability: 'local_file',
    title: 'Track.mp3',
  };
  assert.equal(isPlayableSong(validMP3), true);

  // Valid imported WAV
  const validWAV = {
    id: 'local-wav-1',
    source: 'user_import',
    isLocalImport: true,
    audioAvailability: 'local_file',
    title: 'Track.wav',
  };
  assert.equal(isPlayableSong(validWAV), true);

  // Manual entry without local audio
  const manualEntry = {
    id: 'song-1731000000000',
    source: 'user_manual',
    isLocalImport: false,
    audioAvailability: 'metadata_only',
    title: 'Manual Single',
  };
  assert.equal(isPlayableSong(manualEntry), false);

  // Bucket list migrated track
  const bucketTrack = {
    id: 'song-1731000000001',
    source: 'user_manual',
    isLocalImport: false,
    audioAvailability: 'metadata_only',
    title: 'Wishlist Item',
  };
  assert.equal(isPlayableSong(bucketTrack), false);

  // Demo / stream track
  const demoTrack = {
    id: 'song-1',
    source: 'sample_demo',
    audioAvailability: 'stream',
    title: 'Demo Track',
  };
  assert.equal(isPlayableSong(demoTrack), false);

  // Missing or undefined
  assert.equal(isPlayableSong(null), false);
  assert.equal(isPlayableSong(undefined), false);
});

test('validateSongPlayability returns descriptive rejection messages', () => {
  const valid = {
    id: 'local-1',
    source: 'user_import',
    isLocalImport: true,
    audioAvailability: 'local_file',
    title: 'Local Beats',
  };
  assert.equal(validateSongPlayability(valid).canPlay, true);

  const manual = {
    id: 'song-1731000000000',
    source: 'user_manual',
    isLocalImport: false,
    audioAvailability: 'metadata_only',
    title: 'Catalog Song',
  };
  const manualResult = validateSongPlayability(manual);
  assert.equal(manualResult.canPlay, false);
  assert.equal(manualResult.code, 'MANUAL_ENTRY');
  assert.ok(manualResult.message.includes('Manual catalogue entries do not contain audio files'));

  const demo = {
    id: 'song-1',
    source: 'sample_demo',
    title: 'Demo Song',
  };
  const demoResult = validateSongPlayability(demo);
  assert.equal(demoResult.canPlay, false);
  assert.equal(demoResult.code, 'DEMO_TRACK');
});

test('getNextPlayableTrack and getPreviousPlayableTrack only select playable imported tracks', () => {
  const songs = [
    { id: 'm1', source: 'user_manual', isLocalImport: false, audioAvailability: 'metadata_only', title: 'Manual 1' },
    { id: 'i1', source: 'user_import', isLocalImport: true, audioAvailability: 'local_file', title: 'Import 1' },
    { id: 'm2', source: 'user_manual', isLocalImport: false, audioAvailability: 'metadata_only', title: 'Manual 2' },
    { id: 'i2', source: 'user_import', isLocalImport: true, audioAvailability: 'local_file', title: 'Import 2' },
    { id: 'm3', source: 'user_manual', isLocalImport: false, audioAvailability: 'metadata_only', title: 'Manual 3' },
    { id: 'i3', source: 'user_import', isLocalImport: true, audioAvailability: 'local_file', title: 'Import 3' },
  ];

  // Next from i1 should jump to i2 (skipping m2)
  const nextFromI1 = getNextPlayableTrack({
    songs,
    currentSongId: 'i1',
    isShuffle: false,
    repeatMode: 'off',
  });
  assert.equal(nextFromI1?.id, 'i2');

  // Next from i2 should jump to i3 (skipping m3)
  const nextFromI2 = getNextPlayableTrack({
    songs,
    currentSongId: 'i2',
    isShuffle: false,
    repeatMode: 'off',
  });
  assert.equal(nextFromI2?.id, 'i3');

  // Next from last track with repeat 'all' wraps around to i1
  const wrapNext = getNextPlayableTrack({
    songs,
    currentSongId: 'i3',
    isShuffle: false,
    repeatMode: 'all',
  });
  assert.equal(wrapNext?.id, 'i1');

  // Next from last track with repeat 'off' returns null
  const endNext = getNextPlayableTrack({
    songs,
    currentSongId: 'i3',
    isShuffle: false,
    repeatMode: 'off',
  });
  assert.equal(endNext, null);

  // Previous from i2 should jump back to i1 (skipping m2)
  const prevFromI2 = getPreviousPlayableTrack({
    songs,
    currentSongId: 'i2',
  });
  assert.equal(prevFromI2?.id, 'i1');

  // Previous from i1 wraps around to i3
  const prevFromI1 = getPreviousPlayableTrack({
    songs,
    currentSongId: 'i1',
  });
  assert.equal(prevFromI1?.id, 'i3');

  // Shuffle selects from playable songs pool
  const shuffleNext = getNextPlayableTrack({
    songs,
    currentSongId: 'i1',
    isShuffle: true,
    repeatMode: 'off',
    randomFn: () => 0, // pick index 0 of pool
  });
  assert.ok(shuffleNext?.id === 'i2' || shuffleNext?.id === 'i3');
  assert.notEqual(shuffleNext?.id, 'i1');
  assert.notEqual(shuffleNext?.id, 'm1');
  assert.notEqual(shuffleNext?.id, 'm2');
});

