import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Trophy,
  Flame,
  Sparkles,
  Calendar,
  Clock,
  Music,
  Mic2,
  Radio,
  HelpCircle,
  PlayCircle,
  Type,
  BrainCircuit,
  UserCheck,
  Disc,
  Languages,
  Grid,
  Swords,
  Tag,
  Image,
  Zap,
  Search,
  Filter,
} from 'lucide-react';
import { apiService, GameInfoApiResponse, DailyChallengeApiResponse } from '../services/apiService';
import { InteractiveGameModal } from '../components/games/InteractiveGameModal';
import { useMusic } from '../context/MusicContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Music,
  PlayCircle,
  HelpCircle,
  Radio,
  Mic2,
  Type,
  BrainCircuit,
  UserCheck,
  Disc,
  Languages,
  Grid,
  Swords,
  Flame,
  Tag,
  Image,
  Calendar,
  Zap,
  Sparkles,
};

export const GamesHubView: React.FC = () => {
  const { xp, streakDays, showToast } = useMusic();

  const [games, setGames] = useState<GameInfoApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeApiResponse | null>(null);

  // Active game modal state
  const [activeGame, setActiveGame] = useState<{
    id: string;
    title: string;
    difficulty: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchGamesData = async () => {
      setLoading(true);
      try {
        const [gamesList, dc] = await Promise.all([
          apiService.getGames(),
          apiService.getDailyChallenge(),
        ]);
        if (isMounted) {
          setGames(gamesList);
          setDailyChallenge(dc);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to fetch games hub data:', err);
          setLoading(false);
        }
      }
    };
    fetchGamesData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    return ['All', 'Song Recognition', 'Lyrics & Knowledge', 'Memory & Competition', 'Daily & Special'];
  }, []);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (selectedCategory !== 'All' && g.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [games, selectedCategory, searchQuery]);

  const handleLaunchGame = (gameId: string, title: string, diff = 'Medium') => {
    setActiveGame({ id: gameId, title, difficulty: diff });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Top Banner: Daily Music Challenge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-900/60 border border-purple-500/30 p-6 md:p-8 shadow-2xl shadow-purple-950/30">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Today's Daily Challenge</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                +100 XP Bonus
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {dailyChallenge?.title || 'Daily Sonic Master Challenge'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {dailyChallenge?.description ||
                'Complete today handpicked 5-round music challenge to maintain your streak and earn verified anti-farming XP.'}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => handleLaunchGame('daily_challenge', "Today's Daily Challenge", 'Standard')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-900/50 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Play Daily Challenge</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hub Controls: Categories & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <span>Music Games Arcade</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                {games.length} Games Available
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              18 specialized music games across recognition, lyrics, memory, and competition.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search music games..."
              className="w-full pl-9 pr-4 py-2 bg-[#141524] border border-[#23253b] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
                    : 'bg-[#151626] text-slate-400 hover:text-white border border-[#23253b] hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map((game) => {
          const Icon = iconMap[game.iconName] || Music;
          return (
            <div
              key={game.id}
              className="group bg-[#121320] border border-[#212338] hover:border-purple-500/50 rounded-3xl p-5 shadow-lg transition-all flex flex-col justify-between hover:shadow-purple-950/30 hover:scale-[1.01]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/15 text-purple-400 border border-purple-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#1b1d30] border border-[#282a45] text-slate-300">
                    {game.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-[#1c1d30] flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Trophy className="w-3.5 h-3.5" />
                    +{game.xpReward} XP
                  </span>
                  {game.timeLimitSeconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {game.timeLimitSeconds}s
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleLaunchGame(game.id, game.title, game.supportedDifficulties[0] || 'Medium')}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-950 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Play</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Game Modal */}
      {activeGame && (
        <InteractiveGameModal
          gameId={activeGame.id}
          gameTitle={activeGame.title}
          difficulty={activeGame.difficulty}
          onClose={() => setActiveGame(null)}
        />
      )}
    </div>
  );
};

