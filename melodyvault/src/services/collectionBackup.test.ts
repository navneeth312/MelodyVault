import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { validateBackupZip } from './collectionBackup';
import { Song } from '../types';

test('validateBackupZip detects missing collection.json', async () => {
  const zip = new JSZip();
  zip.file('dummy.txt', 'hello');
  const blob = await zip.generateAsync({ type: 'blob' });

  const report = await validateBackupZip(blob, []);
  assert.equal(report.isValid, false);
  assert.ok(report.errors.some((e) => e.includes('missing "collection.json"')));
});

test('validateBackupZip detects invalid app name in manifest', async () => {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify({ appName: 'WrongApp', version: '1.0.0' }));
  zip.file('collection.json', JSON.stringify({ songs: [], playlists: [] }));
  const blob = await zip.generateAsync({ type: 'blob' });

  const report = await validateBackupZip(blob, []);
  assert.equal(report.isValid, false);
  assert.ok(report.errors.some((e) => e.includes('Invalid application name')));
});

test('validateBackupZip detects missing audio binaries for local files', async () => {
  const zip = new JSZip();
  zip.file(
    'manifest.json',
    JSON.stringify({ appName: 'MelodyVault', version: '1.1.0' })
  );
  zip.file(
    'collection.json',
    JSON.stringify({
      songs: [
        {
          id: 'local-test-1',
          title: 'Missing Track',
          artist: 'Ghost',
          isLocalImport: true,
          audioAvailability: 'local_file',
        },
      ],
      playlists: [],
    })
  );
  // Notice we do NOT add audio/local-test-1.wav
  const blob = await zip.generateAsync({ type: 'blob' });

  const report = await validateBackupZip(blob, []);
  assert.equal(report.isValid, true); // It's valid metadata, but has warnings & missing audio
  assert.equal(report.missingAudioSongs.length, 1);
  assert.equal(report.missingAudioSongs[0].title, 'Missing Track');
  assert.ok(report.warnings.some((w) => w.includes('do not have audio files')));
});

test('validateBackupZip detects duplicates against current songs', async () => {
  const zip = new JSZip();
  zip.file(
    'manifest.json',
    JSON.stringify({ appName: 'MelodyVault', version: '1.1.0' })
  );
  zip.file(
    'collection.json',
    JSON.stringify({
      songs: [
        {
          id: 'song-existing',
          title: 'Existing Song',
          artist: 'Existing Artist',
        },
        {
          id: 'song-new',
          title: 'Brand New Song',
          artist: 'New Artist',
        },
      ],
      playlists: [],
    })
  );

  const currentSongs = [
    {
      id: 'song-existing',
      title: 'Existing Song',
      artist: 'Existing Artist',
    } as Song,
  ];

  const blob = await zip.generateAsync({ type: 'blob' });
  const report = await validateBackupZip(blob, currentSongs);

  assert.equal(report.duplicateSongs.length, 1);
  assert.equal(report.newSongsCount, 1);
  assert.equal(report.totalSongsInBackup, 2);
});
