import React, { useState } from 'react';
import {
  Gamepad2,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  Layers,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { CHALLENGE_QUESTIONS } from '../data/sampleData';
import { audioEngine } from '../services/audioEngine';

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

export const MusicChallengesView: React.FC = () => {
  const { awardXP, songs } = useMusic();
  const [activeMode, setActiveMode] = useState<ChallengeTab>('guess_song');

  // Quiz state for question-based modes
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [scoreTally, setScoreTally] = useState({ correct: 0, total: 0 });

  // Memory Match game state
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() => initMemoryCards());
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatchesFound, setMemoryMatchesFound] = useState(0);
  const [isMemoryWon, setIsMemoryWon] = useState(false);

  function initMemoryCards(): MemoryCard[] {
    const sample = songs.slice(0, 6);
    const cards: MemoryCard[] = [];
    sample.forEach((s, idx) => {
      // 2 cards per song: Title card and Artwork card
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
    // Shuffle
    return cards.sort(() => Math.random() - 0.5);
  }

  // Active question for quiz modes
  const activeQuestions = CHALLENGE_QUESTIONS.filter((q) => {
    if (activeMode === 'daily') return q.type === 'daily';
    return q.type === activeMode;
  });

  const question = activeQuestions[currentQuestionIndex % (activeQuestions.length || 1)] || CHALLENGE_QUESTIONS[0];

  const handlePlaySnippet = () => {
    if (question.audioSnippet) {
      audioEngine.playAudioSnippet(question.audioSnippet);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === question.correctIndex;
    if (isCorrect) {
      awardXP(question.xpReward, `Correct challenge answer!`);
      setScoreTally((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setScoreTally((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCurrentQuestionIndex((prev) => (prev + 1) % activeQuestions.length);
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
        // Match found!
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        setSelectedCards([]);
        setMemoryMatchesFound((prev) => {
          const nextMatches = prev + 1;
          if (nextMatches === 6) {
            setIsMemoryWon(true);
            awardXP(120, 'Completed Music Memory Match game!');
          }
          return nextMatches;
        });
      } else {
        // No match: flip back after 900ms
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
    setMemoryCards(initMemoryCards());
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
            Test your musical ear, lyric recognition, and memory. Earn XP to level up your listener tier!
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
          { id: 'guess_lyrics', label: 'Guess the Lyrics' },
          { id: 'trivia', label: 'Music Trivia' },
          { id: 'song_vs_song', label: 'Song vs Song' },
          { id: 'memory_match', label: 'Music Memory Match' },
          { id: 'daily', label: 'Daily Challenge' },
        ].map((tab) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveMode(tab.id as ChallengeTab);
                setSelectedOption(null);
                setIsAnswerSubmitted(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
              <span>Matched: <strong className="text-purple-400">{memoryMatchesFound} / 6</strong></span>
            </div>
            <button
              onClick={resetMemoryGame}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1b2d] hover:bg-[#252842] text-xs font-semibold text-slate-200 rounded-lg border border-[#2e3150]"
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
                You matched all 6 musical pairs in {memoryMoves} moves! +120 XP awarded to your Music Quest.
              </p>
              <button
                onClick={resetMemoryGame}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Play Again
              </button>
            </div>
          ) : memoryCards.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-purple-400/50" />
              <div className="font-semibold text-white text-xs">No Songs for Memory Match</div>
              <p className="text-[11px] text-slate-400">
                Import at least 2 songs into your personal music vault to play memory match cards.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {memoryCards.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square rounded-2xl cursor-pointer transition-all duration-300 p-2 flex flex-col items-center justify-center text-center select-none border ${
                    card.isFlipped || card.isMatched
                      ? 'bg-[#1a1c30] border-purple-500/60 shadow-lg scale-95'
                      : 'bg-[#141524] border-[#25273d] hover:border-purple-500/40'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? (
                    <div className="space-y-1.5">
                      <img
                        src={card.artwork}
                        alt="artwork"
                        className="w-10 h-10 rounded-lg object-cover mx-auto shadow"
                      />
                      <div className="text-[11px] font-bold text-white truncate max-w-[90px]">
                        {card.label}
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Quiz Modes (Guess Song, Lyrics, Trivia, Song vs Song, Daily) */
        <div className="bg-[#12131f] border border-[#212338] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          {/* Question Banner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                Reward: +{question.xpReward} XP
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Challenge Mode: {activeMode.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <h3 className="text-base md:text-lg font-bold text-white leading-snug">
              {question.prompt}
            </h3>

            {/* Audio Snippet Button for Guess the Song */}
            {question.audioSnippet && (
              <button
                onClick={handlePlaySnippet}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-xs font-semibold border border-purple-500/30 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-purple-400" />
                <span>Play Melody Snippet (Synthesizer)</span>
              </button>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;

              let style = 'bg-[#161726] border-[#252840] hover:border-purple-500/50 text-slate-200';
              if (isAnswerSubmitted) {
                if (isCorrect) {
                  style = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                } else if (isSelected) {
                  style = 'bg-rose-950/40 border-rose-500 text-rose-200';
                } else {
                  style = 'bg-[#141524] border-[#222438] opacity-50';
                }
              } else if (isSelected) {
                style = 'bg-purple-950/40 border-purple-500 text-purple-200';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${style}`}
                >
                  <span>{opt}</span>
                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Feedback */}
          {isAnswerSubmitted && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                selectedOption === question.correctIndex
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="font-bold">
                {selectedOption === question.correctIndex ? 'Correct!' : 'Incorrect'}
              </div>
              <p className="text-slate-300">{question.explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Next Challenge →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
