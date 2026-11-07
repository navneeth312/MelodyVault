import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { xpService, XPService } from './xpService';

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

beforeEach(() => {
  storageMap.clear();
  xpService._resetForTesting();
});

test('XP-1: Unique song import awards +10 XP', () => {
  const result = xpService.awardUniqueImport('song-1', 'Bohemian Rhapsody');
  assert.equal(result.awarded, true);
  assert.equal(result.amount, 10);
  assert.equal(xpService.getTotalXP(), 10);
});

test('XP-2: Duplicate song import is rejected with 0 XP', () => {
  const first = xpService.awardUniqueImport('song-dup', 'Track 1');
  assert.equal(first.awarded, true);
  assert.equal(first.amount, 10);

  // Attempting duplicate import of same songId
  const duplicate = xpService.awardUniqueImport('song-dup', 'Track 1');
  assert.equal(duplicate.awarded, false);
  assert.equal(duplicate.amount, 0);
  assert.equal(xpService.getTotalXP(), 10, 'Total XP should not increase on duplicate import');
});

test('XP-3: First meaningful listen awards +15 XP after 80% genuine playback', () => {
  const songId = 'song-listen-1';
  const duration = 100; // 100 seconds, 80% is 80 seconds

  xpService.startListeningSession(songId, duration, true);

  // Simulate genuine continuous playback for 80 seconds
  let awardedResult = { awarded: false, amount: 0 };
  for (let sec = 1; sec <= 82; sec++) {
    const res = xpService.updateListeningProgress(songId, sec, duration, 'Song 1');
    if (res.awarded) {
      awardedResult = res;
    }
  }

  assert.equal(awardedResult.awarded, true, 'Reward should be unlocked once 80% is reached');
  assert.equal(awardedResult.amount, 15);
  assert.equal(xpService.getTotalXP(), 15);
});

test('XP-4: Seeking directly to the end is rejected (Anti-farming)', () => {
  const songId = 'song-seek-abuse';
  const duration = 200;

  xpService.startListeningSession(songId, duration, true);

  // User listens for 2 seconds then immediately seeks to second 195
  xpService.updateListeningProgress(songId, 1, duration, 'Cheater Track');
  xpService.updateListeningProgress(songId, 2, duration, 'Cheater Track');
  const jumpResult = xpService.updateListeningProgress(songId, 195, duration, 'Cheater Track');

  assert.equal(jumpResult.awarded, false, 'Seeking cannot fake 80% listening progress');
  assert.equal(xpService.getTotalXP(), 0);
});

test('XP-5: Repeated play of the same song does not re-award first-listen XP', () => {
  const songId = 'song-repeat';
  const duration = 10; // 80% is 8s

  xpService.startListeningSession(songId, duration, true);
  for (let s = 1; s <= 9; s++) {
    xpService.updateListeningProgress(songId, s, duration, 'Repeat Song');
  }
  assert.equal(xpService.getTotalXP(), 15);

  // User replays the song from the beginning
  xpService.startListeningSession(songId, duration, true);
  for (let s = 1; s <= 9; s++) {
    const replayRes = xpService.updateListeningProgress(songId, s, duration, 'Repeat Song');
    assert.equal(replayRes.awarded, false, 'Replaying cannot re-award first-listen XP');
  }
  assert.equal(xpService.getTotalXP(), 15);
});

test('XP-6: Daily listening XP cap (150 XP max per day) is strictly enforced', () => {
  // Simulate listening to 10 songs (10 * 15 = 150 XP)
  for (let i = 1; i <= 10; i++) {
    const id = `song-cap-${i}`;
    xpService.startListeningSession(id, 10, true);
    for (let s = 1; s <= 9; s++) {
      xpService.updateListeningProgress(id, s, 10, `Track ${i}`);
    }
  }
  assert.equal(xpService.getTotalXP(), 150);
  assert.equal(xpService.getListeningXPToday(), 150);

  // 11th song listen on the same day must be capped at 0
  const id11 = 'song-cap-11';
  xpService.startListeningSession(id11, 10, true);
  let result11 = { awarded: false, amount: 0 };
  for (let s = 1; s <= 9; s++) {
    const res = xpService.updateListeningProgress(id11, s, 10, 'Track 11');
    if (res.awarded) result11 = res;
  }

  assert.equal(result11.awarded, false, 'Must not award listening XP beyond 150 XP daily cap');
  assert.equal(xpService.getTotalXP(), 150);
});

test('XP-7: Persistent ledger records complete transaction history', () => {
  xpService.awardUniqueImport('track-alpha', 'Alpha Song');
  const ledger = xpService.getLedger();

  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].id, 'import_track-alpha');
  assert.equal(ledger[0].source, 'unique_import');
  assert.equal(ledger[0].songId, 'track-alpha');
  assert.equal(ledger[0].amount, 10);
  assert.ok(ledger[0].timestamp);
  assert.ok(ledger[0].dayDate);
});

test('XP-8: Legacy XP migration preserves progress safely without resetting level', () => {
  const freshService = new XPService();
  freshService._resetForTesting();

  // Legacy user with 450 XP
  freshService.migrateExistingXP(450);

  assert.equal(freshService.getTotalXP(), 450);
  const levelInfo = freshService.getLevelInfo();
  assert.ok(levelInfo.level > 1, 'Level must be computed accurately from migrated XP');

  // Second migration call does not duplicate
  freshService.migrateExistingXP(450);
  assert.equal(freshService.getTotalXP(), 450, 'Duplicate migration call must be idempotent');
});

