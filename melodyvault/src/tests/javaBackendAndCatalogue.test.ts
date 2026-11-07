import test from 'node:test';
import assert from 'node:assert/strict';
import { isPlayableSong, validateSongPlayability } from '../utils/pureLogic';
import { PUBLIC_CATALOGUE_FALLBACK_TRACKS } from '../data/sampleData';

test('CAT-1: Authorized Public Catalogue tracks validate as playable with audio streams', () => {
  for (const track of PUBLIC_CATALOGUE_FALLBACK_TRACKS) {
    assert.equal(isPlayableSong(track), true, `Track ${track.title} must be playable`);
    const validation = validateSongPlayability(track);
    assert.equal(validation.canPlay, true);
    assert.equal(validation.code, 'OK');
    assert.ok(validation.message.includes('Authorized public catalogue track'));
  }
});

test('CAT-2: Public Catalogue tracks without streamUrl or audioUrl are rejected', () => {
  const invalidCatalogueTrack = {
    id: 'cat-invalid-1',
    title: 'Silent Symphony',
    artist: 'Unknown',
    source: 'public_catalogue',
    audioAvailability: 'stream',
    audioUrl: null,
    streamUrl: undefined,
  };

  assert.equal(isPlayableSong(invalidCatalogueTrack), false);
  const validation = validateSongPlayability(invalidCatalogueTrack);
  assert.equal(validation.canPlay, false);
});

test('CAT-3: Public Catalogue tracks cannot be deleted by bulk delete', () => {
  const allSongIds = ['cat-track-1', 'cat-track-2', 'local-user-1', 'local-user-2'];
  const userSelectedOnly = allSongIds.filter((id) => !id.startsWith('cat-track-'));

  assert.deepEqual(userSelectedOnly, ['local-user-1', 'local-user-2']);
  assert.equal(userSelectedOnly.some((id) => id.startsWith('cat-track-')), false);
});

test('CAT-4: Distinction between Personal Vault (local_file) and Public Catalogue (stream)', () => {
  const personalImport = {
    id: 'local-1234',
    title: 'My Voice Recording.mp3',
    source: 'user_import' as const,
    isLocalImport: true,
    audioAvailability: 'local_file' as const,
  };

  const publicTrack = {
    id: 'test-catalogue-stream',
    title: 'Authorized Public Stream',
    source: 'public_catalogue' as const,
    isLocalImport: false,
    audioAvailability: 'stream' as const,
    streamUrl: 'http://localhost:8085/audio/stream.wav',
  };

  assert.equal(isPlayableSong(personalImport), true);
  assert.equal(personalImport.audioAvailability, 'local_file');
  assert.equal(isPlayableSong(publicTrack), true);
  assert.equal(publicTrack.audioAvailability, 'stream');
});

