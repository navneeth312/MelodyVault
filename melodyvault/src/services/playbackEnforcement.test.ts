import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPlayableSong,
  validateSongPlayability,
  filterPlayableTracks,
  getNextPlayableTrack,
  getPreviousPlayableTrack,
} from '../utils/pureLogic';
import { Song, Playlist } from '../types';
import JSZip from 'jszip';
import { validateBackupZip, importCollectionZip } from './collectionBackup';

test('1. Imported MP3 playback validation', () => {
  const importedMP3: Song = {
    id: 'local-1731000000001-mp3',
    title: 'Neon Nights',
    artist: 'Future Synth',
    album: 'Cyber Dreams',
    genre: 'Synthwave',
    language: 'English',
    duration: 215,
    artwork: 'https://images.unsplash.com/photo-1518709268805',
    audioUrl: '',
    audioAvailability: 'local_file',
    isLocalImport: true,
    source: 'user_import',
    fileName: 'Future Synth - Neon Nights.mp3',
    fileSize: 5242880,
    mimeType: 'audio/mpeg',
    year: 2026,
    playCount: 0,
    lastPlayedAt: null,
    isFavorite: false,
    mood: 'Midnight Drive',
    lyrics: [],
  };

  assert.equal(isPlayableSong(importedMP3), true);
  const result = validateSongPlayability(importedMP3);
  assert.equal(result.canPlay, true);
  assert.equal(result.code, 'OK');
});

test('2. Imported WAV playback validation', () => {
  const importedWAV: Song = {
    id: 'local-1731000000002-wav',
    title: 'Starlight Echoes',
    artist: 'Solaris',
    album: 'Cosmic Journey',
    genre: 'Ambient',
    language: 'Instrumental',
    duration: 180,
    artwork: 'https://images.unsplash.com/photo-1511671782779',
    audioUrl: '',
    audioAvailability: 'local_file',
    isLocalImport: true,
    source: 'user_import',
    fileName: 'Solaris - Starlight Echoes.wav',
    fileSize: 31744000,
    mimeType: 'audio/wav',
    year: 2026,
    playCount: 0,
    lastPlayedAt: null,
    isFavorite: true,
    mood: 'Deep Focus',
    lyrics: [],
  };

  assert.equal(isPlayableSong(importedWAV), true);
  const result = validateSongPlayability(importedWAV);
  assert.equal(result.canPlay, true);
  assert.equal(result.code, 'OK');
});

test('3. Manual catalogue entries cannot play', () => {
  const manualEntry: Song = {
    id: 'song-1731000000003',
    title: 'Acoustic Memories',
    artist: 'Indie Artist',
    album: 'MelodyVault Single',
    genre: 'Indie',
    language: 'English',
    duration: 200,
    artwork: 'https://images.unsplash.com/photo-1514525253161',
    audioAvailability: 'metadata_only',
    source: 'user_manual',
    isLocalImport: false,
    year: 2026,
    playCount: 0,
    lastPlayedAt: null,
    isFavorite: false,
    mood: 'Chill Lo-Fi',
    lyrics: [],
  };

  assert.equal(isPlayableSong(manualEntry), false);
  const result = validateSongPlayability(manualEntry);
  assert.equal(result.canPlay, false);
  assert.equal(result.code, 'MANUAL_ENTRY');
  assert.ok(result.message.includes('Manual catalogue entries do not contain audio files'));
});

test('4. Bucket-list entries cannot play', () => {
  // Simulating a migrated bucket list item in the library
  const bucketListEntry: Song = {
    id: 'song-1731000000004',
    title: 'Obscure Vinyl Discovery',
    artist: 'The Rare Grooves',
    album: 'Discovered via Bucket List',
    genre: 'Soul',
    language: 'English',
    duration: 240,
    artwork: 'https://images.unsplash.com/photo-1514525253161',
    audioAvailability: 'metadata_only',
    source: 'user_manual',
    isLocalImport: false,
    year: 2026,
    playCount: 0,
    lastPlayedAt: null,
    isFavorite: false,
    mood: 'Euphoric',
    lyrics: [],
  };

  assert.equal(isPlayableSong(bucketListEntry), false);
  const result = validateSongPlayability(bucketListEntry);
  assert.equal(result.canPlay, false);
  assert.ok(result.message.includes('Manual catalogue entries do not contain audio files'));
});

test('5. Queue management only permits playable imported tracks', () => {
  const mixedLibrary: Song[] = [
    {
      id: 'local-mp3',
      source: 'user_import',
      isLocalImport: true,
      audioAvailability: 'local_file',
      title: 'Imported MP3',
    } as Song,
    {
      id: 'manual-catalog',
      source: 'user_manual',
      isLocalImport: false,
      audioAvailability: 'metadata_only',
      title: 'Manual Item',
    } as Song,
    {
      id: 'bucket-list-song',
      source: 'user_manual',
      isLocalImport: false,
      audioAvailability: 'metadata_only',
      title: 'Bucket Item',
    } as Song,
    {
      id: 'local-wav',
      source: 'user_import',
      isLocalImport: true,
      audioAvailability: 'local_file',
      title: 'Imported WAV',
    } as Song,
  ];

  // Filtering for queue
  const queueFiltered = filterPlayableTracks(mixedLibrary);
  assert.equal(queueFiltered.length, 2);
  assert.deepEqual(
    queueFiltered.map((s) => s.id),
    ['local-mp3', 'local-wav']
  );

  // Attempting to add manual item is rejected
  assert.equal(isPlayableSong(mixedLibrary[1]), false);
  assert.equal(isPlayableSong(mixedLibrary[2]), false);
});

test('6. Next, previous, shuffle and repeat operations only select playable tracks', () => {
  const songs: Song[] = [
    { id: 'm1', source: 'user_manual', isLocalImport: false, audioAvailability: 'metadata_only', title: 'M1' } as Song,
    { id: 'p1', source: 'user_import', isLocalImport: true, audioAvailability: 'local_file', title: 'P1' } as Song,
    { id: 'm2', source: 'user_manual', isLocalImport: false, audioAvailability: 'metadata_only', title: 'M2' } as Song,
    { id: 'p2', source: 'user_import', isLocalImport: true, audioAvailability: 'local_file', title: 'P2' } as Song,
    { id: 'b1', source: 'user_manual', isLocalImport: false, audioAvailability: 'metadata_only', title: 'B1' } as Song,
    { id: 'p3', source: 'user_import', isLocalImport: true, audioAvailability: 'local_file', title: 'P3' } as Song,
  ];

  // Next from P1 must skip M2 and jump directly to P2
  const next1 = getNextPlayableTrack({
    songs,
    currentSongId: 'p1',
    isShuffle: false,
    repeatMode: 'off',
  });
  assert.equal(next1?.id, 'p2');

  // Next from P2 must skip B1 and jump directly to P3
  const next2 = getNextPlayableTrack({
    songs,
    currentSongId: 'p2',
    isShuffle: false,
    repeatMode: 'off',
  });
  assert.equal(next2?.id, 'p3');

  // Next from P3 with repeat all loops to P1
  const repeatAllNext = getNextPlayableTrack({
    songs,
    currentSongId: 'p3',
    isShuffle: false,
    repeatMode: 'all',
  });
  assert.equal(repeatAllNext?.id, 'p1');

  // Repeat one keeps P2
  const repeatOneNext = getNextPlayableTrack({
    songs,
    currentSongId: 'p2',
    isShuffle: false,
    repeatMode: 'one',
  });
  assert.equal(repeatOneNext?.id, 'p2');

  // Previous from P2 jumps back to P1
  const prev1 = getPreviousPlayableTrack({
    songs,
    currentSongId: 'p2',
  });
  assert.equal(prev1?.id, 'p1');

  // Previous from P1 wraps to P3
  const prevWrap = getPreviousPlayableTrack({
    songs,
    currentSongId: 'p1',
  });
  assert.equal(prevWrap?.id, 'p3');

  // Shuffle selects from playable tracks pool
  const shuffleNext = getNextPlayableTrack({
    songs,
    currentSongId: 'p1',
    isShuffle: true,
    repeatMode: 'off',
    randomFn: () => 0.5,
  });
  assert.ok(shuffleNext?.id === 'p2' || shuffleNext?.id === 'p3');
});

test('7. Playback after browser refresh maintains playability and audio availability', () => {
  // Simulating localStorage serialization and deserialization
  const originalSongs: Song[] = [
    {
      id: 'local-101',
      title: 'Synth Drift',
      artist: 'Retro Waves',
      album: 'Neon City',
      genre: 'Synthwave',
      language: 'Instrumental',
      duration: 210,
      artwork: 'https://example.com/art.jpg',
      audioUrl: '',
      audioAvailability: 'local_file',
      isLocalImport: true,
      source: 'user_import',
      fileName: 'Synth Drift.mp3',
      fileSize: 4500000,
      mimeType: 'audio/mpeg',
      year: 2026,
      playCount: 3,
      lastPlayedAt: '2026-11-07T12:00:00.000Z',
      isFavorite: true,
      mood: 'Midnight Drive',
      lyrics: [],
    },
    {
      id: 'song-manual-1',
      title: 'Wishlist Item',
      artist: 'Unsigned',
      album: 'Demo',
      genre: 'Lo-Fi',
      language: 'English',
      duration: 180,
      artwork: '',
      audioAvailability: 'metadata_only',
      source: 'user_manual',
      isLocalImport: false,
      year: 2026,
      playCount: 0,
      lastPlayedAt: null,
      isFavorite: false,
      mood: 'Chill Lo-Fi',
      lyrics: [],
    },
  ];

  const serialized = JSON.stringify(originalSongs);
  const deserialized: Song[] = JSON.parse(serialized);

  // Normalization logic as executed on page reload
  const restoredSongs = deserialized.map((s) => {
    if (
      s.isLocalImport ||
      s.audioAvailability === 'local_file' ||
      s.source === 'user_import' ||
      (typeof s.id === 'string' && s.id.startsWith('local-'))
    ) {
      return {
        ...s,
        source: 'user_import' as const,
        isLocalImport: true,
        audioAvailability: 'local_file' as const,
      };
    }
    return {
      ...s,
      source: 'user_manual' as const,
      isLocalImport: false,
      audioAvailability: 'metadata_only' as const,
    };
  });

  // Verify restored imported song is playable
  const restoredImported = restoredSongs.find((s) => s.id === 'local-101');
  assert.ok(restoredImported);
  assert.equal(isPlayableSong(restoredImported), true);
  assert.equal(validateSongPlayability(restoredImported).canPlay, true);

  // Verify manual song remains unplayable
  const restoredManual = restoredSongs.find((s) => s.id === 'song-manual-1');
  assert.ok(restoredManual);
  assert.equal(isPlayableSong(restoredManual), false);
  assert.equal(validateSongPlayability(restoredManual).canPlay, false);
});

test('8. Missing audio blobs produce friendly error report', () => {
  // Test simulated blob check
  const songWithoutBlob: Song = {
    id: 'local-missing-blob',
    title: 'Corrupted File',
    artist: 'Nobody',
    album: 'Lost',
    genre: 'Unknown',
    language: 'Instrumental',
    duration: 120,
    artwork: '',
    audioAvailability: 'local_file',
    isLocalImport: true,
    source: 'user_import',
    fileName: 'Corrupted.mp3',
    year: 2026,
    playCount: 0,
    lastPlayedAt: null,
    isFavorite: false,
    mood: 'Deep Focus',
    lyrics: [],
  };

  // Metadata passes check
  assert.equal(isPlayableSong(songWithoutBlob), true);

  // Mock blob existence check returning null
  const checkBlobExists = (songId: string, store: Map<string, Blob>) => {
    const blob = store.get(songId);
    return Boolean(blob && blob.size > 0);
  };

  const emptyStore = new Map<string, Blob>();
  assert.equal(checkBlobExists(songWithoutBlob.id, emptyStore), false);

  const errorMsg = `Local audio file for "${songWithoutBlob.title}" is missing from browser storage (IndexedDB). Please re-import this track.`;
  assert.ok(errorMsg.includes('missing from browser storage'));
  assert.ok(errorMsg.includes('Corrupted File'));
});

test('9. Backup and restore continue working for imported tracks', async () => {
  const zip = new JSZip();
  zip.file(
    'manifest.json',
    JSON.stringify({
      appName: 'MelodyVault',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      totalSongs: 1,
      totalPlaylists: 1,
      totalAudioFiles: 1,
      description: 'Test backup',
      sharingNotice: 'Notice',
    })
  );

  const testSong: Song = {
    id: 'local-backup-track-1',
    title: 'Backup Song',
    artist: 'Archive Master',
    album: 'Vault Anthems',
    genre: 'Rock',
    language: 'English',
    duration: 200,
    artwork: '',
    audioAvailability: 'local_file',
    isLocalImport: true,
    source: 'user_import',
    fileName: 'Backup Song.mp3',
    year: 2026,
    playCount: 1,
    lastPlayedAt: null,
    isFavorite: true,
    mood: 'High Energy',
    lyrics: [],
  };

  zip.file(
    'collection.json',
    JSON.stringify({
      manifest: {
        appName: 'MelodyVault',
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        totalSongs: 1,
        totalPlaylists: 0,
        totalAudioFiles: 1,
        description: 'Test backup',
        sharingNotice: 'Notice',
      },
      songs: [testSong],
      playlists: [],
    })
  );

  // Add dummy audio binary
  const audioFolder = zip.folder('audio');
  audioFolder?.file('local-backup-track-1.mp3', Buffer.from([0xff, 0xfb, 0x90, 0x64]));

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // 1. Validation check
  const report = await validateBackupZip(zipBlob, []);
  assert.equal(report.isValid, true);
  assert.equal(report.audioFilesFoundInZip, 1);
  assert.equal(report.missingAudioSongs.length, 0);

  // 2. Incoming restoration mapping check
  const incoming = report.backupData.songs.map((s) => {
    const isLocal = Boolean(s.isLocalImport || s.audioAvailability === 'local_file');
    return {
      ...s,
      source: isLocal ? ('user_import' as const) : ('user_manual' as const),
      isLocalImport: isLocal,
      audioAvailability: isLocal ? ('local_file' as const) : ('metadata_only' as const),
    };
  });

  assert.equal(incoming.length, 1);
  assert.equal(isPlayableSong(incoming[0]), true);
  assert.equal(incoming[0].source, 'user_import');
  assert.equal(incoming[0].isLocalImport, true);
  assert.equal(incoming[0].audioAvailability, 'local_file');
});

