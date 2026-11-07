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
