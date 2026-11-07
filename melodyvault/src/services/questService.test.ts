import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { questService } from './questService';
import { xpService } from './xpService';
import { Song } from '../types';

// Mock localStorage
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

const createMockSong = (overrides: Partial<Song>): Song => ({
  id: 'song-1',
  title: 'Song 1',
  artist: 'Artist 1',
  album: 'Album 1',
  genre: 'Rock',
  language: 'English',
  mood: 'High Energy',
  duration: 180,
  year: 2024,
  artwork: 'https://images.unsplash.com/test',
  isFavorite: false,
  playCount: 0,
  lastPlayedAt: null,
  audioAvailability: 'local_file',
  isLocalImport: true,
  source: 'user_import',
  fileName: 'song1.mp3',
  lyrics: [],
  ...overrides,
});

beforeEach(() => {
  storageMap.clear();
  xpService._resetForTesting();
  questService._resetForTesting();
});

test('QUEST-1: Daily and weekly quests adapt targets to collection size', () => {
  // Small collection: 2 songs
  const smallCollection = [
    createMockSong({ id: 's1' }),
    createMockSong({ id: 's2' }),
  ];

  const questsSmall = questService.syncQuests(smallCollection);
  const explorerQuest = questsSmall.find((q) => q.category === 'explorer');
  assert.ok(explorerQuest, 'Explorer quest should be generated');
  assert.equal(explorerQuest.targetCount, 2, 'Explorer target should scale down to collection count (2)');

  // Large collection: 10 songs
  const largeCollection = Array.from({ length: 10 }).map((_, i) =>
    createMockSong({ id: `large-s${i}` })
  );

  questService._resetForTesting();
  const questsLarge = questService.syncQuests(largeCollection);
  const explorerLarge = questsLarge.find((q) => q.category === 'explorer');
  assert.equal(explorerLarge?.targetCount, 3, 'Explorer target should cap at 3 for larger collections');
});

test('QUEST-2: Only playable imported tracks advance quest progress', () => {
  const importedTrack = createMockSong({ id: 'imported-track', isLocalImport: true, source: 'user_import', audioAvailability: 'local_file' });
  const manualTrack = createMockSong({ id: 'manual-track', isLocalImport: false, source: 'user_manual', audioAvailability: 'metadata_only' });

  questService.syncQuests([importedTrack]);

  // Listen to manual catalog track (should not count)
  const manualResult = questService.recordSongListen(manualTrack);
  assert.equal(manualResult.updatedQuests.length, 0, 'Non-imported track must not advance quests');

  // Listen to genuine imported track (should count)
  const importedResult = questService.recordSongListen(importedTrack);
  assert.ok(importedResult.updatedQuests.length > 0, 'Genuine imported track must advance quests');
});

test('QUEST-3: Distinct-song quests enforce unique song contributions', () => {
  const songA = createMockSong({ id: 'song-a' });
  const songB = createMockSong({ id: 'song-b' });

  questService.syncQuests([songA, songB]);

  // First listen to Song A
  questService.recordSongListen(songA);
  let explorer = questService.getActiveQuests().find((q) => q.category === 'explorer');
  assert.equal(explorer?.currentCount, 1);

  // Second listen to Song A (should NOT increment distinct count)
  questService.recordSongListen(songA);
  explorer = questService.getActiveQuests().find((q) => q.category === 'explorer');
  assert.equal(explorer?.currentCount, 1, 'Repeated play of same song must not increment distinct count');

  // Listen to Song B (should increment distinct count)
  questService.recordSongListen(songB);
  explorer = questService.getActiveQuests().find((q) => q.category === 'explorer');
  assert.equal(explorer?.currentCount, 2);
  assert.equal(explorer?.isCompleted, true);
});

test('QUEST-4: Completed quest can be claimed and awards XP through centralized ledger', () => {
  const songA = createMockSong({ id: 'song-a' });
  const songB = createMockSong({ id: 'song-b' });
  questService.syncQuests([songA, songB]);

  // Complete explorer quest
  questService.recordSongListen(songA);
  questService.recordSongListen(songB);

  const explorer = questService.getActiveQuests().find((q) => q.category === 'explorer')!;
  assert.equal(explorer.isCompleted, true);
  assert.equal(explorer.isClaimed, false);

  // Claim reward
  const claimResult = questService.claimQuestReward(explorer.id);
  assert.equal(claimResult.success, true);
  assert.equal(claimResult.xpAwarded, 30);
  assert.equal(xpService.getTotalXP(), 30);

  // Verify quest state
  const updatedExplorer = questService.getActiveQuests().find((q) => q.id === explorer.id)!;
  assert.equal(updatedExplorer.isClaimed, true);
  assert.ok(updatedExplorer.claimedAt);

  // Verify history record
  const history = questService.getHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].questId, explorer.id);
});

test('QUEST-5: Duplicate quest reward claim attempts are strictly rejected', () => {
  const songA = createMockSong({ id: 'song-a' });
  questService.syncQuests([songA]);
  questService.recordSongListen(songA);

  const explorer = questService.getActiveQuests().find((q) => q.category === 'explorer')!;
  const firstClaim = questService.claimQuestReward(explorer.id);
  assert.equal(firstClaim.success, true);

  // Attempt duplicate claim
  const secondClaim = questService.claimQuestReward(explorer.id);
  assert.equal(secondClaim.success, false);
  assert.equal(secondClaim.xpAwarded, 0);
  assert.equal(xpService.getTotalXP(), 30, 'Duplicate claim must not award additional XP');
});

test('QUEST-6: Deleted tracks are pruned from active quest contributions', () => {
  const songA = createMockSong({ id: 'song-a' });
  const songB = createMockSong({ id: 'song-b' });
  questService.syncQuests([songA, songB]);

  questService.recordSongListen(songA);
  questService.recordSongListen(songB);

  let explorer = questService.getActiveQuests().find((q) => q.category === 'explorer')!;
  assert.equal(explorer.currentCount, 2);

  // Now simulate that songB was deleted from library collection
  questService.syncQuests([songA]);

  explorer = questService.getActiveQuests().find((q) => q.category === 'explorer')!;
  assert.equal(explorer.contributingSongIds.includes('song-b'), false, 'Deleted song ID must be pruned');
  assert.equal(explorer.currentCount, 1, 'Current count must decrement after track deletion');
});

