import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Clock,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Music,
  Share2,
} from 'lucide-react';
import {
  apiService,
  GameSessionApiResponse,
  GameQuestionApiResponse,
  GameAnswerResultApiResponse,
  GameCompletionApiResponse,
} from '../../services/apiService';
import { useMusic } from '../../context/MusicContext';

interface InteractiveGameModalProps {
  gameId: string;
  gameTitle: string;
  difficulty: string;
  onClose: () => void;
  onLevelUpdated?: (newLevel: number) => void;
}

export const InteractiveGameModal: React.FC<InteractiveGameModalProps> = ({
  gameId,
  gameTitle,
  difficulty,
  onClose,
  onLevelUpdated,
}) => {
  const { showToast } = useMusic();

  const [session, setSession] = useState<GameSessionApiResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<GameAnswerResultApiResponse | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(30);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [completionData, setCompletionData] = useState<GameCompletionApiResponse | null>(null);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memorySolved, setMemorySolved] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());

  // Start game session on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      try {
        let sess: GameSessionApiResponse | null = null;
        if (gameId === 'daily_challenge') {
          const dc = await apiService.getDailyChallenge();
          if (dc) {
            sess = {
              sessionId: 'dc-' + Date.now(),
              gameId: 'daily_challenge',
              gameTitle: dc.title,
              difficulty: 'Standard',
              questions: dc.questions,
              startedAt: new Date().toISOString(),
              totalRounds: dc.questions.length,
            };
          }
        } else {
          sess = await apiService.startGameSession(gameId, difficulty);
        }

        if (isMounted) {
          if (sess && sess.questions && sess.questions.length > 0) {
            setSession(sess);
            startTimeRef.current = Date.now();
            questionStartTimeRef.current = Date.now();
            resetTimer(sess.questions[0]?.difficulty);
          } else {
            showToast('Failed to start game session. Check backend status.', 'warning');
            onClose();
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          showToast('Error initializing game', 'warning');
          onClose();
        }
      }
    };
    init();

    return () => {
      isMounted = false;
      clearInterval(timerIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [gameId, difficulty, onClose, showToast]);

  const resetTimer = (diff?: string) => {
    clearInterval(timerIntervalRef.current);
    const initial = gameId === 'rapid_fire' ? 60 : diff === 'Hard' ? 20 : 30;
    setTimer(initial);

    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    if (selectedOption === null && !answerResult) {
      handleSelectOption(-1);
    }
  };

  const currentQ: GameQuestionApiResponse | undefined = session?.questions[currentQuestionIndex];

  // Auto-play audio preview if current question is audio
  useEffect(() => {
    if (currentQ?.mediaUrl && currentQ.mediaType === 'audio') {
      if (audioRef.current) {
        audioRef.current.src = currentQ.mediaUrl;
        audioRef.current.currentTime = gameId === 'guess_intro' ? 0 : 15;
        audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(false));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      }
    }
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionIndex, currentQ, gameId]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    }
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (selectedOption !== null || !session || !currentQ) return;
    clearInterval(timerIntervalRef.current);
    setSelectedOption(optionIndex);

    const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    const result = await apiService.submitGameAnswer(
      session.sessionId,
      currentQ.questionId,
      optionIndex,
      elapsed
    );

    if (result) {
      setAnswerResult(result);
      setScore(result.currentScore);
      setStreak(result.streak);
    } else {
      // Local fallback
      const correct = optionIndex === currentQ.correctAnswerIndex;
      setAnswerResult({
        correct,
        correctOptionIndex: currentQ.correctAnswerIndex,
        pointsEarned: correct ? currentQ.points : 0,
        currentScore: score + (correct ? currentQ.points : 0),
        streak: correct ? streak + 1 : 0,
        explanation: currentQ.explanation,
      });
      if (correct) {
        setScore((s) => s + currentQ.points);
        setStreak((st) => st + 1);
      } else {
        setStreak(0);
      }
    }
  };

  const handleNextQuestion = async () => {
    if (!session) return;
    const nextIdx = currentQuestionIndex + 1;

    if (nextIdx < session.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(null);
      setAnswerResult(null);
      resetTimer(session.questions[nextIdx]?.difficulty);
    } else {
      // Game complete
      clearInterval(timerIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();

      const totalElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await apiService.completeGameSession({
        sessionId: session.sessionId,
        gameId,
        finalScore: score,
        correctCount: streak, // approx
        totalCount: session.questions.length,
        timeElapsedSeconds: totalElapsed,
      });

      if (gameId === 'daily_challenge') {
        await apiService.completeDailyChallenge();
      }

      setCompletionData(res);
      setGameCompleted(true);
      if (res?.level && onLevelUpdated) {
        onLevelUpdated(res.level);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <audio ref={audioRef} onEnded={() => setIsAudioPlaying(false)} />
      <div className="bg-[#121320] border border-[#23253b] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#23253b] flex items-center justify-between bg-[#151627]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">{gameTitle}</h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  {difficulty}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Round {currentQuestionIndex + 1} of {session?.totalRounds || 5}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak & Score */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                <Flame className="w-3.5 h-3.5" />
                <span>{streak}x</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                <Trophy className="w-3.5 h-3.5" />
                <span>{score} pts</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Preparing music challenge and audio snippets...</p>
          </div>
        )}

        {/* Game Completed Screen */}
        {!loading && gameCompleted && (
          <div className="p-8 text-center space-y-6 flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Challenge Completed!</h2>
              <p className="text-xs text-slate-400">
                {completionData?.message || 'Outstanding performance across this music game session.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3.5 rounded-2xl bg-[#171828] border border-[#262840]">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Final Score</div>
                <div className="text-lg font-black text-white mt-1">{score}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#171828] border border-[#262840]">
                <div className="text-[10px] text-slate-400 uppercase font-bold">XP Awarded</div>
                <div className="text-lg font-black text-amber-400 mt-1">+{completionData?.xpEarned || 25} XP</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#171828] border border-[#262840]">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Streak Peak</div>
                <div className="text-lg font-black text-purple-300 mt-1">{streak}x</div>
              </div>
            </div>

            {completionData?.levelUp && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold max-w-md mx-auto">
                🎉 LEVEL UP! You reached Level {completionData.level}!
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
              >
                Back to Games Hub
              </button>
            </div>
          </div>
        )}

        {/* Active Question Screen */}
        {!loading && !gameCompleted && currentQ && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col justify-between">
            {/* Timer Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Time Left
                </span>
                <span className={`font-mono font-bold ${timer <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                  {timer}s
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#1e2034] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timer <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                  }`}
                  style={{ width: `${(timer / (gameId === 'rapid_fire' ? 60 : 30)) * 100}%` }}
                />
              </div>
            </div>

            {/* Prompt & Media Container */}
            <div className="space-y-4 text-center my-auto">
              <h4 className="text-base font-bold text-white max-w-xl mx-auto leading-snug">
                {currentQ.prompt}
              </h4>

              {/* Audio Snippet Playback */}
              {currentQ.mediaType === 'audio' && currentQ.mediaUrl && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-purple-950/30 border border-purple-500/30 max-w-md mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAudio}
                      className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-950 transition-all cursor-pointer"
                    >
                      {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Audio Snippet</div>
                      <div className="text-[10px] text-purple-300">
                        {isAudioPlaying ? 'Playing preview now...' : 'Click to preview audio'}
                      </div>
                    </div>
                  </div>
                  <Volume2 className={`w-5 h-5 ${isAudioPlaying ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
                </div>
              )}

              {/* Artwork Media Display */}
              {currentQ.mediaType === 'image' && currentQ.mediaUrl && (
                <div className="w-36 h-36 rounded-2xl overflow-hidden mx-auto border-2 border-purple-500/40 shadow-xl relative group">
                  <img
                    src={currentQ.mediaUrl}
                    alt="Album Cover"
                    className="w-full h-full object-cover filter blur-[2px] transition-all hover:blur-none"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-[10px] text-white/80 font-bold">
                    Album Art
                  </div>
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((option, idx) => {
                let btnStyle = 'bg-[#171828] hover:bg-[#1f2136] border-[#262840] text-slate-200';

                if (selectedOption !== null) {
                  if (idx === currentQ.correctAnswerIndex) {
                    btnStyle = 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
                  } else {
                    btnStyle = 'opacity-40 bg-[#141522] border-transparent text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={selectedOption !== null}
                    className={`p-3.5 px-4 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#202235] text-slate-400 flex items-center justify-center font-mono text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{option}</span>
                    </div>

                    {selectedOption !== null && idx === currentQ.correctAnswerIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {selectedOption !== null && idx === selectedOption && idx !== currentQ.correctAnswerIndex && (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Result Banner & Next Button */}
            {answerResult && (
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 mt-2 transition-all ${
                  answerResult.correct
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {answerResult.correct ? 'Correct Answer!' : 'Incorrect'}
                    {answerResult.pointsEarned > 0 && ` (+${answerResult.pointsEarned} pts)`}
                  </div>
                  <div className="text-[11px] text-slate-300 line-clamp-1">{answerResult.explanation}</div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/40 shrink-0 transition-all cursor-pointer"
                >
                  <span>
                    {currentQuestionIndex + 1 >= (session?.questions.length || 5) ? 'Finish Challenge' : 'Next'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
