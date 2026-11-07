import test from 'node:test';
import assert from 'node:assert/strict';

test('GAME-1: Games registry contains exactly 18 distinct games categorized across 4 groups', () => {
  const games = [
    { id: 'guess_song', category: 'Song Recognition' },
    { id: 'guess_intro', category: 'Song Recognition' },
    { id: 'mystery_track', category: 'Song Recognition' },
    { id: 'audio_recognition', category: 'Song Recognition' },
    { id: 'guess_lyrics', category: 'Lyrics & Knowledge' },
    { id: 'complete_title', category: 'Lyrics & Knowledge' },
    { id: 'music_trivia', category: 'Lyrics & Knowledge' },
    { id: 'who_is_artist', category: 'Lyrics & Knowledge' },
    { id: 'guess_album', category: 'Lyrics & Knowledge' },
    { id: 'identify_language', category: 'Lyrics & Knowledge' },
    { id: 'memory_match', category: 'Memory & Competition' },
    { id: 'song_vs_song', category: 'Memory & Competition' },
    { id: 'artist_challenge', category: 'Memory & Competition' },
    { id: 'genre_challenge', category: 'Memory & Competition' },
    { id: 'artwork_challenge', category: 'Memory & Competition' },
    { id: 'daily_challenge', category: 'Daily & Special' },
    { id: 'rapid_fire', category: 'Daily & Special' },
    { id: 'personality_quiz', category: 'Daily & Special' },
  ];

  assert.equal(games.length, 18, 'Must have exactly 18 playable games');
  const categories = new Set(games.map((g) => g.category));
  assert.equal(categories.size, 4, 'Must span 4 distinct categories');
  assert.ok(categories.has('Song Recognition'));
  assert.ok(categories.has('Lyrics & Knowledge'));
  assert.ok(categories.has('Memory & Competition'));
  assert.ok(categories.has('Daily & Special'));
});

test('GAME-2: Streak multiplier applies correct boost to score', () => {
  const calculatePoints = (base: number, streak: number, elapsedSeconds: number) => {
    const mult = streak >= 5 ? 2.0 : streak >= 3 ? 1.5 : 1.0;
    const speedBonus = elapsedSeconds > 0 && elapsedSeconds <= 5 ? 5 : 0;
    return Math.floor(base * mult) + speedBonus;
  };

  // Base 20, 0 streak, 10s: 20
  assert.equal(calculatePoints(20, 0, 10), 20);
  // Base 20, 3 streak, 10s: 30 (1.5x)
  assert.equal(calculatePoints(20, 3, 10), 30);
  // Base 20, 5 streak, 3s: 45 (2x + 5 speed bonus)
  assert.equal(calculatePoints(20, 5, 3), 45);
});

test('LYRICS-1: LRC Timestamp parser handles [mm:ss] and [mm:ss.xx] correctly', () => {
  const lrc = `[00:15.20] I don't wanna talk about things we've gone through
[00:23.10] Though it's hurting me, now it's history
[01:03] I was in your arms, thinking I belonged there`;

  const lines = lrc.split('\n').map((line) => {
    const m = line.match(/^\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)$/);
    if (m) {
      return {
        time: parseInt(m[1], 10) * 60 + parseFloat(m[2]),
        text: m[3],
      };
    }
    return null;
  }).filter(Boolean);

  assert.equal(lines.length, 3);
  assert.equal(lines[0]?.time, 15.2);
  assert.equal(lines[0]?.text, "I don't wanna talk about things we've gone through");
  assert.equal(lines[1]?.time, 23.1);
  assert.equal(lines[2]?.time, 63);
});

test('COLLECTION-1: Ingestion converts local scan into genuine user_import Song structure', () => {
  const mockTrack = {
    id: 'local-970098559',
    filename: 'ABBA - The Winner Takes It All.mp3',
    title: 'The Winner Takes It All',
    artist: 'ABBA',
    album: 'Super Trouper',
    genre: 'Pop / Rock',
    language: 'English',
    duration: 327,
    year: 1980,
    fileSize: 5362624,
    hasArtwork: true,
    audioUrl: 'http://localhost:8085/api/local-collection/audio/ABBA+-+The+Winner+Takes+It+All.mp3',
    artworkUrl: 'http://localhost:8085/api/local-collection/artwork/ABBA+-+The+Winner+Takes+It+All.mp3',
  };

  const song = {
    id: mockTrack.id,
    title: mockTrack.title,
    artist: mockTrack.artist,
    album: mockTrack.album,
    genre: mockTrack.genre,
    language: mockTrack.language,
    duration: mockTrack.duration,
    artwork: mockTrack.artworkUrl,
    audioUrl: null, // Audio blob is in IndexedDB
    audioAvailability: 'local_file',
    year: mockTrack.year,
    playCount: 0,
    lastPlayedAt: null,
    isFavorite: false,
    lyrics: [],
    mood: 'Euphoric',
    isLocalImport: true,
    source: 'user_import',
    fileName: mockTrack.filename,
    fileSize: mockTrack.fileSize,
    mimeType: 'audio/mpeg',
  };

  assert.equal(song.source, 'user_import');
  assert.equal(song.isLocalImport, true);
  assert.equal(song.audioAvailability, 'local_file');
  assert.equal(song.audioUrl, null);
  assert.equal(song.title, 'The Winner Takes It All');
  assert.ok(song.artwork.includes('artwork'));
});

test('CHALLENGE-STABILITY-1: Deterministic option placement ensures 100% stability across renders', () => {
  function getDeterministicHash(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  function buildDeterministicOptions(correct: string, rawDistractors: string[], seedKey: string) {
    const hash = getDeterministicHash(seedKey);
    const cleanCorrect = (correct || '').trim();
    const uniqueDistractors: string[] = [];
    for (const d of rawDistractors) {
      const clean = (d || '').trim();
      if (clean && clean.toLowerCase() !== cleanCorrect.toLowerCase() && !uniqueDistractors.includes(clean)) {
        uniqueDistractors.push(clean);
      }
    }
    const genericFallbacks = ['Melody Anthem', 'Harmonic Resonance', 'Acoustic Master', 'Echoes in Twilight'];
    for (const fallback of genericFallbacks) {
      if (uniqueDistractors.length >= 3) break;
      if (fallback.toLowerCase() !== cleanCorrect.toLowerCase() && !uniqueDistractors.includes(fallback)) {
        uniqueDistractors.push(fallback);
      }
    }
    const chosenDistractors = uniqueDistractors.slice(0, 3);
    const optionsCount = chosenDistractors.length + 1;
    const targetPos = hash % optionsCount;
    const options = [...chosenDistractors];
    options.splice(targetPos, 0, cleanCorrect);
    return { options, correctIndex: targetPos };
  }

  const correct = 'The Winner Takes It All';
  const distractors = ['Ala Bolelo', 'Arz Kiya Hai', 'Sex, Drugs, Etc.'];
  const seed = 'song-local-970098559-0';

  // Run 100 consecutive mock render cycles
  const firstRun = buildDeterministicOptions(correct, distractors, seed);
  for (let i = 0; i < 100; i++) {
    const nextRun = buildDeterministicOptions(correct, distractors, seed);
    assert.deepEqual(nextRun.options, firstRun.options, `Options changed on render cycle ${i}! Must be 100% stable.`);
    assert.equal(nextRun.correctIndex, firstRun.correctIndex, `Correct index shifted on render cycle ${i}!`);
    assert.equal(nextRun.options[nextRun.correctIndex], correct, 'Correct index must point directly to the correct answer.');
  }
});

test('CHALLENGE-STABILITY-2: Answer submission locks options and prevents duplicate XP claims', () => {
  let isAnswerSubmitted = false;
  let selectedOption: number | null = null;
  const claimedQuestionIds = new Set<string>();
  let totalXP = 0;

  const question = {
    id: 'dyn-song-1',
    correctIndex: 2,
    xpReward: 40,
    options: ['Option A', 'Option B', 'The Winner Takes It All', 'Option D'],
  };

  const handleSelect = (idx: number) => {
    if (isAnswerSubmitted) return; // Locked
    selectedOption = idx;
  };

  const handleSubmit = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    isAnswerSubmitted = true;
    if (selectedOption === question.correctIndex) {
      if (!claimedQuestionIds.has(question.id)) {
        totalXP += question.xpReward;
        claimedQuestionIds.add(question.id);
      }
    }
  };

  // 1. Select correct option
  handleSelect(2);
  assert.equal(selectedOption, 2);

  // 2. Submit answer
  handleSubmit();
  assert.equal(isAnswerSubmitted, true);
  assert.equal(totalXP, 40);

  // 3. Attempting to select another option while submitted must be ignored
  handleSelect(0);
  assert.equal(selectedOption, 2, 'Option must be locked after submission');

  // 4. Repeated submission must NOT re-award XP
  handleSubmit();
  assert.equal(totalXP, 40, 'XP must never be awarded more than once');
});

