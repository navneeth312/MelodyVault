import React from 'react';
import {
  Play,
  Flame,
  Sparkles,
  Trophy,
  ArrowRight,
  Clock,
  Radio,
  BookHeart,
  Heart,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { calculateLevelFromXP, formatDuration } from '../utils/pureLogic';
import { Song, SongMood } from '../types';

interface DashboardViewProps {
  onOpenCreatePlaylist: () => void;
  onOpenAddSong: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCreatePlaylist,
  onOpenAddSong,
}) => {
  const {
    songs,
    playlists,
    recentlyPlayed,
    favorites,
    memories,
    xp,
    streakDays,
    playSong,
    setActiveTab,
    setSelectedPlaylistId,
    toggleFavorite,
    addToQueue,
  } = useMusic();

  const levelInfo = calculateLevelFromXP(xp);

  const featuredSong = songs[0]; // Midnight Horizon
  const latestMemory = memories[0];

  const moodBadges: { mood: SongMood; label: string; gradient: string }[] = [
    { mood: 'Midnight Drive', label: 'Midnight Drive', gradient: 'from-purple-900 to-indigo-950' },
    { mood: 'Chill Lo-Fi', label: 'Chill Lo-Fi', gradient: 'from-amber-950 to-stone-900' },
    { mood: 'Deep Focus', label: 'Deep Focus', gradient: 'from-slate-900 to-blue-950' },
    { mood: 'Euphoric', label: 'Euphoric Flow', gradient: 'from-violet-950 to-fuchsia-950' },
    { mood: 'Romantic', label: 'Acoustic Romance', gradient: 'from-rose-950 to-purple-950' },
  ];

  const handlePlayMood = (mood: SongMood) => {
    const matching = songs.filter((s) => s.mood === mood);
    if (matching.length > 0) {
      playSong(matching[0], matching.slice(1));
    }
  };

  const handleOpenPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActiveTab('playlists');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Spotlight Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950 via-[#18152b] to-[#0f1019] border border-purple-800/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                MelodyVault Prototype
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {streakDays}-Day Listening Streak
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Your Music. Your Memories. Your Experience.
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Curate, revisit cherished memories, test your auditory knowledge in challenges, and
              explore unplayed treasures with intelligent vault tools.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {featuredSong ? (
                <button
                  onClick={() => playSong(featuredSong)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:scale-102 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Featured Track</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('library')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:scale-102 transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Import Music to Vault</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('challenges')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1f2033] hover:bg-[#282a44] border border-[#2e3150] text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Daily Challenge (+100 XP)</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Pill Widget */}
          <div className="bg-[#141524]/80 backdrop-blur-md border border-[#272942] rounded-2xl p-4 w-full md:w-64 space-y-3 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-[#24263d]">
              <span className="text-xs text-slate-400">Listener Level</span>
              <span className="text-xs font-bold text-purple-400 font-mono">Lv.{levelInfo.level}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>{levelInfo.currentTierTitle}</span>
                <span className="font-mono text-purple-300">{xp} XP</span>
              </div>
              <div className="h-1.5 bg-[#25283f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="p-2 bg-[#1a1b2d] rounded-lg border border-[#26283d]">
                <div className="text-xs font-bold text-white font-mono">{songs.length}</div>
                <div className="text-[10px] text-slate-400">Library Songs</div>
              </div>
              <div className="p-2 bg-[#1a1b2d] rounded-lg border border-[#26283d]">
                <div className="text-xs font-bold text-white font-mono">{playlists.length}</div>
                <div className="text-[10px] text-slate-400">Playlists</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Mood Radio Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Mood Launchpads</h2>
          </div>
          <button
            onClick={() => setActiveTab('mood_explorer')}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Explore all moods</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {moodBadges.map((item) => (
            <button
              key={item.mood}
              onClick={() => handlePlayMood(item.mood)}
              className={`p-3.5 rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/10 hover:border-purple-500/50 hover:scale-102 text-left transition-all group shadow-md flex items-center justify-between`}
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-200">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400">
                  {songs.filter((s) => s.mood === item.mood).length} tracks
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-purple-600 flex items-center justify-center shrink-0 transition-colors">
                <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.2" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 2-Column Section: Recently Played & Playlists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Recently Played (7 cols) */}
        <section className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Recently Played</h2>
            </div>
            <button
              onClick={() => setActiveTab('recently_played')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              See all ({recentlyPlayed.length})
            </button>
          </div>

          <div className="space-y-1.5 bg-[#12131f] border border-[#212338] rounded-2xl p-3">
            {recentlyPlayed.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No tracks played yet. Start playing songs from your library to build listening history!
              </div>
            ) : (
              recentlyPlayed.slice(0, 5).map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1b1c2e] group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative group/cover shrink-0">
                      <img
                        src={song.artwork}
                        alt={song.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <button
                        onClick={() => playSong(song)}
                        className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 group-hover:text-purple-300 truncate">
                        {song.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {song.artist} · <span className="text-slate-500">{song.album}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        song.isFavorite
                          ? 'text-rose-500'
                          : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Col: Top Playlists & Memory Spotlight (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Playlists */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight">Your Playlists</h2>
              <button
                onClick={onOpenCreatePlaylist}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2">
              {playlists.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#131422] border border-[#212338] text-center text-xs text-slate-500">
                  No playlists created yet. Click "+ New" above to create one.
                </div>
              ) : (
                playlists.slice(0, 3).map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handleOpenPlaylist(pl.id)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#131422] hover:bg-[#1a1c30] border border-[#212338] hover:border-purple-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pl.coverGradient} flex items-center justify-center shrink-0 shadow`}
                      >
                        <Radio className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-purple-300 truncate">
                          {pl.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {pl.songIds.length} tracks · {pl.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 shrink-0 ml-2" />
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Song Memory Journal Spotlight */}
          {latestMemory && (
            <section className="p-4 rounded-2xl bg-[#141525] border border-purple-900/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <BookHeart className="w-3.5 h-3.5 text-purple-400" />
                  <span>Memory Spotlight</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{latestMemory.memoryDate}</span>
              </div>
              <div className="text-xs font-semibold text-white">
                "{latestMemory.songTitle}" — {latestMemory.artist}
              </div>
              <p className="text-xs text-slate-300 italic line-clamp-2">
                "{latestMemory.note}"
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-purple-400">{latestMemory.moodTag || 'Musical Memory'}</span>
                <button
                  onClick={() => setActiveTab('memory_journal')}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Open Journal →
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
