import React, { useState, useMemo } from 'react';
import {
  Gamepad2,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Layers,
  Disc3,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { CHALLENGE_QUESTIONS } from '../data/sampleData';
import { audioEngine } from '../services/audioEngine';
import { ChallengeItem } from '../types';
import { SongArtwork } from '../components/common/SongArtwork';

type ChallengeTab =
  | 'guess_song'
  | 'guess_lyrics'
  | 'trivia'
  | 'song_vs_song'
  | 'memory_match'
  | 'daily';

interface MemoryCard {
  id: number;
  matchId: string;
  label: string;
  artwork: string;
  isFlipped: boolean;
  isMatched: boolean;
}

/**
 * Deterministic pseudo-random integer derived from string seed.
 * Guarantees zero option flickering across React renders.
 */
function getDeterministicHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministically places the correct option and chooses up to 3 distractors.
 * Guarantees stable option positions across renders, updates, and audio events.
 */
function buildDeterministicOptions(
  correct: string,
  rawDistractors: string[],
  seedKey: string
): { options: string[]; correctIndex: number } {
  const hash = getDeterministicHash(seedKey);
  const cleanCorrect = (correct || '').trim();

  // Deduplicate and filter out the correct answer from distractors
  const uniqueDistractors: string[] = [];
  for (const d of rawDistractors) {
    const clean = (d || '').trim();
    if (clean && clean.toLowerCase() !== cleanCorrect.toLowerCase() && !uniqueDistractors.includes(clean)) {
      uniqueDistractors.push(clean);
    }
  }

  // Ensure at least 3 distractors using safe acoustic/music fallbacks if needed
  const genericFallbacks = [
    'Acoustic Resonance',
    'Midnight Melody',
    'Harmonic Progression',
    'Audiophile Edition',
    'Rhythmic Cadence',
  ];
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

export const MusicChallengesView: React.FC = () => {
  const { awardXP, songs } = useMusic();
  const [activeMode, setActiveMode] = useState<ChallengeTab>('guess_song');

  // Quiz state for question-based modes
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [scoreTally, setScoreTally] = useState({ correct: 0, total: 0 });
  const [claimedQuestionIds, setClaimedQuestionIds] = useState<Set<string>>(() => new Set());

  // Stable personal songs list
  const personalSongs = useMemo(() => {
    return songs.filter((s) => s.source === 'user_import' && s.isLocalImport);
  }, [songs]);

  // Deterministically generate dynamic challenge pool
  const dynamicQuestions: ChallengeItem[] = useMemo(() => {
    if (personalSongs.length < 2) {
      return CHALLENGE_QUESTIONS;
    }

    const generated: ChallengeItem[] = [];

    // 1. Guess the Song (Identify Personal Vault Track from Artist/Album)
    personalSongs.forEach((track, idx) => {
      const others = personalSongs.filter((t) => t.id !== track.id);
      const distractorTitles = others.map((t) => t.title);
      const { options, correctIndex } = buildDeterministicOptions(
        track.title,
        distractorTitles,
        `song-${track.id}-${idx}`
      );

      generated.push({
        id: `dyn-song-${track.id}`,
        type: 'guess_song',
        title: 'Identify Your Personal Vault Track',
        prompt: `Which song from your Personal Vault was performed by "${track.artist}"${
          track.album && track.album !== 'Unknown Album' ? ` on the album "${track.album}"` : ''
        }?`,
        options,
        correctIndex,
        explanation: `"${track.title}" is by ${track.artist}${track.year ? ` (${track.year})` : ''}.`,
        xpReward: 40,
        songId: track.id,
        audioSnippet: [440, 523, 659, 784],
      });
    });

    // 2. Guess the Artist (Artist Identification)
    personalSongs.forEach((track, idx) => {
      const others = personalSongs.filter((t) => t.artist.toLowerCase() !== track.artist.toLowerCase());
      const distractorArtists = Array.from(new Set(others.map((t) => t.artist)));
      const { options, correctIndex } = buildDeterministicOptions(
        track.artist,
        distractorArtists,
        `artist-${track.id}-${idx}`
      );

      generated.push({
        id: `dyn-artist-${track.id}`,
        type: 'guess_lyrics',
        title: 'Vault Artist Identification',
        prompt: `Who is the artist behind your imported track "${track.title}"?`,
        options,
        correctIndex,
        explanation: `"${track.title}" is performed by ${track.artist}.`,
        xpReward: 45,
        songId: track.id,
      });
    });

    // 3. Audio Showdown (Song vs Song between real personal tracks)
    if (personalSongs.length >= 2) {
      for (let i = 0; i < Math.min(4, personalSongs.length - 1); i++) {
        const t1 = personalSongs[i];
        const t2 = personalSongs[i + 1];
        generated.push({
          id: `dyn-showdown-${t1.id}-${t2.id}`,
          type: 'song_vs_song',
          title: 'Personal Vault Showdown',
          prompt: `Which personal track is your top pick for deep listening: "${t1.title}" (${t1.artist}) VS "${t2.title}" (${t2.artist})?`,
          options: [`${t1.title} (${t1.artist})`, `${t2.title} (${t2.artist})`],
          correctIndex: 0,
          explanation: `Your preference has been registered in your listener profile!`,
          xpReward: 30,
        });
      }
    }

    // 4. Daily Challenge (Real personal track listening quest)
    if (personalSongs.length > 0) {
      const dailyTrack = personalSongs[0];
      generated.push({
        id: `dyn-daily-${dailyTrack.id}`,
        type: 'daily',
        title: 'Daily Personal Vault Focus',
        prompt: `Complete a listening session for "${dailyTrack.title}" by ${dailyTrack.artist} in your Personal Vault. What genre is it catalogued under?`,
        options: [
          dailyTrack.genre || 'Personal Audio',
          'Classical Opera',
          'Traditional Polka',
          'Synthwave Lo-Fi',
        ],
        correctIndex: 0,
        explanation: `"${dailyTrack.title}" is catalogued under ${dailyTrack.genre || 'Personal Audio'}.`,
        xpReward: 50,
        songId: dailyTrack.id,
      });
    }

    // Factual theory and acoustic questions
    const triviaQuestions = CHALLENGE_QUESTIONS.filter((q) => q.type === 'trivia');
    generated.push(...triviaQuestions);

    return generated;
  }, [personalSongs]);

  // Active questions for selected quiz tab
  const activeQuestions = useMemo(() => {
    return dynamicQuestions.filter((q) => {
      if (activeMode === 'daily') return q.type === 'daily';
      return q.type === activeMode;
    });
  }, [dynamicQuestions, activeMode]);

  // Stable active question selection
  const safeIndex = activeQuestions.length > 0
    ? currentQuestionIndex % activeQuestions.length
    : 0;
  const question: ChallengeItem | undefined = activeQuestions[safeIndex];

  // Memory Match game state builder
  const buildMemoryCards = (): MemoryCard[] => {
    const samplePool = personalSongs.length >= 2 ? personalSongs : songs;
    const sample = samplePool.slice(0, 6);
    const cards: MemoryCard[] = [];
    sample.forEach((s, idx) => {
      cards.push({
        id: idx * 2,
        matchId: s.id,
        label: s.title,
        artwork: s.artwork,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: idx * 2 + 1,
        matchId: s.id,
        label: s.artist,
        artwork: s.artwork,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Deterministic shuffle using card matchId
    return cards.sort((a, b) => {
      const hashA = getDeterministicHash(`${a.matchId}-${a.id}`);
      const hashB = getDeterministicHash(`${b.matchId}-${b.id}`);
      return hashA - hashB;
    });
  };

  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() => buildMemoryCards());
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatchesFound, setMemoryMatchesFound] = useState(0);
  const [isMemoryWon, setIsMemoryWon] = useState(false);

  const handlePlaySnippet = () => {
    if (question?.audioSnippet) {
      audioEngine.playAudioSnippet(question.audioSnippet);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted || !question) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === question.correctIndex;
    if (isCorrect) {
      if (!claimedQuestionIds.has(question.id)) {
        awardXP(question.xpReward, `Correct challenge answer: ${question.title}!`);
        setClaimedQuestionIds((prev) => new Set(prev).add(question.id));
      }
      setScoreTally((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setScoreTally((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCurrentQuestionIndex((prev) => (prev + 1) % (activeQuestions.length || 1));
  };

  const handleModeChange = (mode: ChallengeTab) => {
    setActiveMode(mode);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCurrentQuestionIndex(0);
  };

  // Memory Match Card Click
  const handleCardClick = (cardIndex: number) => {
    const card = memoryCards[cardIndex];
    if (card.isFlipped || card.isMatched || selectedCards.length === 2) return;

    const newCards = [...memoryCards];
    newCards[cardIndex].isFlipped = true;
    setMemoryCards(newCards);

    const newSelected = [...selectedCards, cardIndex];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMemoryMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newSelected;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.matchId === secondCard.matchId) {
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        setSelectedCards([]);
        setMemoryMatchesFound((prev) => {
          const nextMatches = prev + 1;
          const targetMatches = Math.min(6, Math.floor(newCards.length / 2));
          if (nextMatches >= targetMatches && targetMatches > 0) {
            setIsMemoryWon(true);
            awardXP(120, 'Completed Music Memory Match game!');
          }
          return nextMatches;
        });
      } else {
        setTimeout(() => {
          setMemoryCards((prevCards) => {
            const resetCards = [...prevCards];
            resetCards[firstIdx].isFlipped = false;
            resetCards[secondIdx].isFlipped = false;
            return resetCards;
          });
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  const resetMemoryGame = () => {
    setMemoryCards(buildMemoryCards());
    setSelectedCards([]);
    setMemoryMoves(0);
    setMemoryMatchesFound(0);
    setIsMemoryWon(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            <span>Music Challenges & Trivia</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic quizzes generated directly from your Personal Music Vault tracks and embedded metadata.
          </p>
        </div>

        {/* Score tally */}
        <div className="flex items-center gap-3 bg-[#131422] border border-[#212338] px-4 py-2 rounded-xl text-xs font-mono">
          <span className="text-slate-400">Score:</span>
          <span className="text-purple-400 font-bold">
            {scoreTally.correct} / {scoreTally.total}
          </span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#212338] pb-3">
        {[
          { id: 'guess_song', label: 'Guess the Song' },
          { id: 'guess_lyrics', label: 'Guess the Artist' },
          { id: 'trivia', label: 'Music Trivia' },
          { id: 'song_vs_song', label: 'Song vs Song' },
          { id: 'memory_match', label: 'Music Memory Match' },
          { id: 'daily', label: 'Daily Challenge' },
        ].map((tab) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleModeChange(tab.id as ChallengeTab)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Game Mode */}
      {activeMode === 'memory_match' ? (
        /* Memory Match Game */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#12131f] border border-[#212338] p-4 rounded-2xl">
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              <span>Moves: <strong className="text-white">{memoryMoves}</strong></span>
              <span>Matched: <strong className="text-purple-400">{memoryMatchesFound} / {Math.floor(memoryCards.length / 2)}</strong></span>
            </div>
            <button
              onClick={resetMemoryGame}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1b2d] hover:bg-[#252842] text-xs font-semibold text-slate-200 rounded-lg border border-[#2e3150] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Grid</span>
            </button>
          </div>

          {isMemoryWon ? (
            <div className="p-8 text-center bg-gradient-to-br from-purple-950/40 to-[#12131f] border border-purple-500/40 rounded-3xl space-y-4">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Memory Master Achieved!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                You matched all musical pairs in {memoryMoves} moves! +120 XP awarded to your Music Quest.
              </p>
              <button
                onClick={resetMemoryGame}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
              >
                Play Again
              </button>
            </div>
          ) : memoryCards.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2 bg-[#12131f] border border-[#212338] rounded-3xl">
              <Layers className="w-8 h-8 mx-auto text-purple-400/50" />
              <div className="font-semibold text-white text-xs">No Songs for Memory Match</div>
              <p className="text-[11px] text-slate-400">
                Import songs into your Personal Music Vault to play Memory Match cards with real artwork.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {memoryCards.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square rounded-2xl cursor-pointer transition-all duration-300 select-none overflow-hidden ${
                    card.isFlipped || card.isMatched
                      ? 'scale-95 ring-2 ring-purple-500 shadow-lg shadow-purple-900/30'
                      : 'hover:scale-[1.02]'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-[#18192c] border border-purple-500/70 rounded-2xl shadow-lg">
                      <SongArtwork
                        src={card.artwork}
                        alt={card.label}
                        className="w-12 h-12 rounded-xl object-cover shadow ring-1 ring-purple-400/40 mb-1"
                        iconClassName="w-6 h-6 text-purple-400"
                      />
                      <div className="text-[11px] font-bold text-white truncate w-full px-1">
                        {card.label}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1a1b2e] via-[#141525] to-[#0f101c] border border-[#27293d] hover:border-purple-500/50 flex flex-col items-center justify-center p-2 group transition-all">
                      <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-purple-900/50 group-hover:border-purple-500/50 transition-all">
                        <Disc3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-[9px] font-mono text-purple-300/60 mt-1 uppercase tracking-widest font-semibold">
                        Melody
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !question ? (
        /* Empty State for Dynamic Quiz Modes */
        <div className="bg-[#12131f] border border-[#212338] rounded-3xl p-12 text-center space-y-3">
          <Layers className="w-10 h-10 mx-auto text-purple-400/60" />
          <h3 className="text-sm font-bold text-white">Dynamic Personal Questions Need Tracks</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Import at least 2 songs into your Personal Music Vault (`C:\MelodyVault Sample Music`) to automatically generate dynamic personal questions for this category.
          </p>
        </div>
      ) : (
        /* Quiz Modes (Guess Song, Lyrics/Artist, Trivia, Song vs Song, Daily) */
        <div className="bg-[#12131f] border border-[#212338] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Question {safeIndex + 1} of {activeQuestions.length}
            </span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>+{question.xpReward} XP</span>
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-white leading-relaxed">
              {question.prompt}
            </h3>

            {question.audioSnippet && (
              <button
                onClick={handlePlaySnippet}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-purple-400" />
                <span>Play Sound Snippet</span>
              </button>
            )}
          </div>

          {/* Options Grid: Locked on submission, zero flickering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;

              let buttonStyle = 'bg-[#171828] border-[#25273d] text-slate-200 hover:border-purple-500/50';
              if (isAnswerSubmitted) {
                if (isCorrect) {
                  buttonStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50';
                } else if (isSelected) {
                  buttonStyle = 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/50';
                } else {
                  buttonStyle = 'bg-[#141522] border-[#1e2030] text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                buttonStyle = 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500/50';
              }

              return (
                <button
                  key={`${question.id}-opt-${idx}`}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`p-4 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${buttonStyle}`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation & Next Question */}
          {isAnswerSubmitted && (
            <div className="p-4 rounded-2xl bg-[#161726] border border-[#27293d] space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2 text-xs">
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 leading-relaxed">
                  {question.explanation}
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                >
                  Next Challenge &rarr;
                </button>
              </div>
            </div>
          )}

          {!isAnswerSubmitted && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
