import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDemoSong,
  isPersonalSong,
  analyzeCollection,
  performSafeCleanup,
} from './collectionCleaner';
import { Song, Playlist } from '../types';

test('isDemoSong identifies sample songs with sN and song-N IDs', () => {
  const demoSongS = {
    id: 's1',
    title: 'Midnight Horizon',
    artist: 'Neon Mirage',
    audioAvailability: 'stream',
  } as Song;
  assert.equal(isDemoSong(demoSongS), true);

  const demoSongPrefix = {
    id: 'song-1',
    title: 'Midnight Horizon',
    artist: 'Neon Mirage',
    audioAvailability: 'stream',
  } as Song;
  assert.equal(isDemoSong(demoSongPrefix), true);
  assert.equal(isPersonalSong(demoSongPrefix), false);
});

test('isDemoSong preserves user imported tracks', () => {
  const importedTrack = {
    id: 'local-1794042383414-kp1pi2',
    title: 'Starlight Echoes',
    artist: 'Solaris',
    isLocalImport: true,
    audioAvailability: 'local_file',
    fileName: 'Solaris - Starlight Echoes.wav',
  } as Song;
  assert.equal(isDemoSong(importedTrack), false);
  assert.equal(isPersonalSong(importedTrack), true);
});

test('isDemoSong preserves manually added songs', () => {
  const manualSong = {
    id: 'song-1794042389999',
    title: 'My Custom Song',
    artist: 'Self',
    audioAvailability: 'metadata_only',
  } as Song;
  assert.equal(isDemoSong(manualSong), false);
  assert.equal(isPersonalSong(manualSong), true);
});

test('analyzeCollection accurately reports demo vs personal song counts', () => {
  const collection: Song[] = [
    { id: 's1', title: 'Demo 1', audioAvailability: 'stream' } as Song,
    { id: 's2', title: 'Demo 2', audioAvailability: 'preview' } as Song,
    {
      id: 'local-101',
      title: 'Import 1',
      isLocalImport: true,
      audioAvailability: 'local_file',
    } as Song,
  ];

  const analysis = analyzeCollection(collection);
  assert.equal(analysis.totalSongs, 3);
  assert.equal(analysis.demoSongsCount, 2);
  assert.equal(analysis.personalSongsCount, 1);
  assert.equal(analysis.hasDemoMusic, true);
});

test('performSafeCleanup removes demo tracks, prunes playlist references, and creates backup', () => {
  const collection: Song[] = [
    { id: 's1', title: 'Demo 1', audioAvailability: 'stream' } as Song,
    { id: 's2', title: 'Demo 2', audioAvailability: 'preview' } as Song,
    {
      id: 'local-101',
      title: 'Import 1',
      isLocalImport: true,
      audioAvailability: 'local_file',
    } as Song,
  ];

  const playlists: Playlist[] = [
    {
      id: 'p1',
      name: 'Coding',
      description: 'Test',
      coverGradient: 'from-purple-900',
      songIds: ['s1', 'local-101', 's2'],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const { cleanedSongs, cleanedPlaylists, backupRecord } = performSafeCleanup(
    collection,
    playlists,
    []
  );

  assert.equal(cleanedSongs.length, 1);
  assert.equal(cleanedSongs[0].id, 'local-101');
  assert.equal(cleanedPlaylists[0].songIds.length, 1);
  assert.deepEqual(cleanedPlaylists[0].songIds, ['local-101']);
  assert.equal(backupRecord.removedDemoSongsCount, 2);
  assert.equal(backupRecord.preservedPersonalSongsCount, 1);
});
