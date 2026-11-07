import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFilenameMetadata, parseWAVInfo } from './audioMetadataParser';

test('parseFilenameMetadata parses "Artist - Title.mp3"', () => {
  const result = parseFilenameMetadata('Daft Punk - One More Time.mp3');
  assert.equal(result.artist, 'Daft Punk');
  assert.equal(result.title, 'One More Time');
});

test('parseFilenameMetadata parses numbered tracks "01 - Artist - Title.wav"', () => {
  const result = parseFilenameMetadata('03 - The Beatles - Come Together.wav');
  assert.equal(result.artist, 'The Beatles');
  assert.equal(result.title, 'Come Together');
});

test('parseFilenameMetadata handles tracks without artist separator "01. Bohemian Rhapsody.mp3"', () => {
  const result = parseFilenameMetadata('01. Bohemian Rhapsody.mp3');
  assert.equal(result.artist, 'Unknown Artist');
  assert.equal(result.title, 'Bohemian Rhapsody');
});

test('parseFilenameMetadata converts underscores into spaces', () => {
  const result = parseFilenameMetadata('Miles_Davis_-_So_What.mp3');
  assert.equal(result.artist, 'Miles Davis');
  assert.equal(result.title, 'So What');
});

test('parseWAVInfo safely returns empty object on non-wav buffer', () => {
  const emptyBuf = new ArrayBuffer(20);
  const result = parseWAVInfo(emptyBuf);
  assert.deepEqual(result, {});
});
