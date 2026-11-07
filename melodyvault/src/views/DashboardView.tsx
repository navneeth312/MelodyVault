import React from 'react';
import {
  Play,
  Pause,
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
  Music,
  Headphones,
  HardDrive,
  CheckCircle2,
  Award,
  Layers,
  Server,
  Gamepad2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { calculateLevelFromXP, formatDuration, isPlayableSong, formatTotalDurationDetailed } from '../utils/pureLogic';
import { Song, SongMood } from '../types';
import { apiService, RecommendationApiResponse } from '../services/apiService';
import { SongArtwork } from '../components/common/SongArtwork';

interface DashboardViewProps {
  onOpenCreatePlaylist: () => void;
  onOpenAddSong: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCreatePlaylist,
}) => {
  const {
    songs,
    playlists,
    recentlyPlayed,
    favorites,
    memories,
    currentSong,
    isPlaying,
    togglePlayPause,
    playSong,
    setActiveTab,
    setSelectedPlaylistId,
    toggleFavorite,
    activeQuests,
    claimQuestReward,
    dailyListeningXPToday,
    dailyListeningXPCap,
    storageStats,
    streakDays,
    xp,
    userProfile,
    showToast,
    backendStatus,
    catalogueTracks,
  } = useMusic();

  const levelInfo = calculateLevelFromXP(xp);

  // Playable imported tracks
  const importedTracks = songs.filter((s) => s.source === 'user_import' && s.isLocalImport);
  const mp3Count = importedTracks.filter((s) => s.mimeType?.includes('mpeg') || s.mimeType?.includes('mp3') || s.fileName?.toLowerCase().endsWith('.mp3')).length;
  const wavCount = importedTracks.filter((s) => s.mimeType?.includes('wav') || s.fileName?.toLowerCase().endsWith('.wav')).length;
  const totalDurationSecs = importedTracks.reduce((acc, s) => acc + (s.duration || 0), 0);

  // Track to resume: current track or last played track or first imported track
  const resumeTrack: Song | null =
    currentSong ||
    recentlyPlayed.find(isPlayableSong) ||
    importedTracks[0] ||
    null;

  // Recently imported tracks (last 6 in chronological insertion order)
  const recentlyImported = importedTracks.slice(0, 6);

  const moodBadges: { mood: SongMood; label: string; gradient: string }[] = [
    { mood: 'Midnight Drive', label: 'Midnight Drive', gradient: 'from-purple-900 to-indigo-950' },
    { mood: 'Chill Lo-Fi', label: 'Chill Lo-Fi', gradient: 'from-amber-950 to-stone-900' },
    { mood: 'Deep Focus', label: 'Deep Focus', gradient: 'from-slate-900 to-blue-950' },
    { mood: 'Euphoric', label: 'Euphoric Flow', gradient: 'from-violet-950 to-fuchsia-950' },
    { mood: 'Romantic', label: 'Acoustic Romance', gradient: 'from-rose-950 to-purple-950' },
  ];

  const handlePlayMood = (mood: SongMood) => {
    const matching = songs.filter((s) => s.mood === mood && isPlayableSong(s));
    if (matching.length > 0) {
      playSong(matching[0], matching.slice(1));
    } else {
      showToast(`No playable imported tracks found for "${mood}". Import MP3 or WAV files to listen.`, 'info');
    }
  };

  const handleOpenPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActiveTab('playlists');
  };

  const dailyQuests = activeQuests.filter((q) => q.period === 'daily');

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Continue Listening Hero Spotlight */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950 via-[#18152c] to-[#0d0e18] border border-purple-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Personal Vault Hub
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {streakDays}-Day Listening Streak
              </span>
            </div>

            {resumeTrack ? (
              <div className="space-y-2">
                <div className="text-xs font-mono text-purple-300">
                  {currentSong && isPlaying ? 'Now Playing' : 'Continue Listening'}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-1">
                  {resumeTrack.title}
                </h1>
                <p className="text-sm text-slate-300 font-medium">
                  {resumeTrack.artist} · <span className="text-slate-400">{resumeTrack.album}</span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {resumeTrack.fileName?.toLowerCase().endsWith('.wav') ? 'WAV Audio' : 'MP3 Audio'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {formatDuration(resumeTrack.duration)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Welcome to MelodyVault, {userProfile.name}
                </h1>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Your private, authenticated audio repository. Import high-fidelity MP3 and WAV files from your device to begin listening, tracking XP, and creating playlists.
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {resumeTrack ? (
                <button
                  onClick={() => {
                    if (currentSong?.id === resumeTrack.id) {
                      togglePlayPause();
                    } else {
                      playSong(resumeTrack);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:scale-102 transition-all active:scale-[0.98]"
                >
                  {currentSong?.id === resumeTrack.id && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white text-white" />
                      <span>Pause Track</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>{currentSong?.id === resumeTrack.id ? 'Resume Track' : 'Play Track'}</span>
                    </>
                  )}
                </button>
              ) : null}

              <button
                onClick={() => setActiveTab('library')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1f2033] hover:bg-[#282a44] border border-[#2e3150] text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-purple-400" />
                <span>Import Local Audio</span>
              </button>

              <button
                onClick={() => setActiveTab('quest')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#191a2b] hover:bg-[#23253d] border border-[#272942] text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Daily Quests ({dailyQuests.filter((q) => q.isCompleted && !q.isClaimed).length} ready)</span>
              </button>
            </div>
          </div>

          {/* User Journey & Level Card */}
          <div className="bg-[#141524]/90 backdrop-blur-md border border-[#272942] rounded-2xl p-4 w-full lg:w-72 space-y-3 shrink-0 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#24263d]">
              <span className="text-xs text-slate-400">Vault Level</span>
              <span className="text-xs font-bold text-purple-300 font-mono">Lv.{levelInfo.level}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>{levelInfo.currentTierTitle}</span>
                <span className="font-mono text-purple-300">{xp} XP</span>
              </div>
              <div className="h-1.5 bg-[#25283f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-300"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="p-2 bg-[#1a1b2d] rounded-lg border border-[#26283d]">
                <div className="text-xs font-bold text-white font-mono">{importedTracks.length}</div>
                <div className="text-[10px] text-slate-400">Imported Tracks</div>
              </div>
              <div className="p-2 bg-[#1a1b2d] rounded-lg border border-[#26283d]">
                <div className="text-xs font-bold text-white font-mono">{playlists.length}</div>
                <div className="text-[10px] text-slate-400">Playlists</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Today's Listening XP:</span>
              <span className="font-mono font-bold text-purple-300">
                {dailyListeningXPToday} / {dailyListeningXPCap} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vault Telemetry & Storage Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#141525] border border-[#222438] flex items-center gap-3">
          <Music className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {mp3Count} MP3 · {wavCount} WAV
            </div>
            <div className="text-[10px] text-slate-400">Valid Local Files</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141525] border border-[#222438] flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {totalDurationSecs > 0 ? formatTotalDurationDetailed(totalDurationSecs) : '0 mins'}
            </div>
            <div className="text-[10px] text-slate-400">Total Audio Time</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141525] border border-[#222438] flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-violet-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {storageStats.usageMB} MB / {storageStats.quotaMB} MB
            </div>
            <div className="text-[10px] text-slate-400">IndexedDB Storage</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141525] border border-[#222438] flex items-center gap-3">
          <Award className="w-5 h-5 text-pink-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {dailyQuests.filter((q) => q.isCompleted).length} / {dailyQuests.length} Done
            </div>
            <div className="text-[10px] text-slate-400">Daily Quests</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141525] border border-[#222438] flex items-center gap-3 col-span-2 sm:col-span-1">
          <Server className={`w-5 h-5 ${backendStatus.isOnline ? 'text-emerald-400' : 'text-slate-500'} shrink-0`} />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>{backendStatus.isOnline ? 'Online (:8085)' : 'Offline'}</span>
              <span className={`w-2 h-2 rounded-full ${backendStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Java 25 Spring Boot
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Public Music Catalogue Shelf */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Public Music Catalogue</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-semibold">
              Legal Public Domain & CC-BY Streams
            </span>
          </div>
          <button
            onClick={() => setActiveTab('library')}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Browse Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {catalogueTracks.slice(0, 6).map((song) => {
            const isCurrent = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                  isCurrent
                    ? 'bg-purple-950/35 border-purple-500/60 shadow-lg shadow-purple-950/40'
                    : 'bg-[#131422] hover:bg-[#181a2e] border-[#212338]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group/cover shrink-0">
                    <SongArtwork
                      src={song.artwork}
                      alt={song.title}
                      className="w-12 h-12 rounded-xl object-cover border border-purple-500/20 shadow"
                    />
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          togglePlayPause();
                        } else {
                          playSong(song);
                        }
                      }}
                      className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-5 h-5 fill-white text-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-white text-white translate-x-0.2" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold truncate ${
                        isCurrent ? 'text-purple-300' : 'text-white'
                      }`}
                      title={song.title}
                    >
                      {song.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {song.artist}
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                        {song.genre}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {formatDuration(song.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleFavorite(song.id)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      song.isFavorite
                        ? 'text-rose-500 hover:text-rose-400'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                    }`}
                    title={song.isFavorite ? 'In Favourites' : 'Add to Favourites'}
                  >
                    <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      if (isCurrent) {
                        togglePlayPause();
                      } else {
                        playSong(song);
                      }
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent && isPlaying
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                        : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white'
                    }`}
                    title={`Play ${song.title}`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-0.2" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mood Launchpads */}
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
                  {songs.filter((s) => s.mood === item.mood && isPlayableSong(s)).length} playable
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-purple-600 flex items-center justify-center shrink-0 transition-colors">
                <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.2" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recently Imported Audio Shelf */}
      {recentlyImported.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Recently Imported Audio</h2>
            </div>
            <button
              onClick={() => setActiveTab('library')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              View Music Library ({importedTracks.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyImported.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                    isCurrent
                      ? 'bg-purple-950/30 border-purple-500/50'
                      : 'bg-[#131422] hover:bg-[#181a2e] border-[#212338]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative group/cover shrink-0">
                      <SongArtwork
                        src={song.artwork}
                        alt={song.title}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-500/20"
                      />
                      <button
                        onClick={() => playSong(song)}
                        className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                      </button>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-bold text-white truncate group-hover:text-purple-300">
                        {song.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {song.artist}
                      </div>
                      <span className="inline-block text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-400 border border-purple-800/30">
                        {song.fileName?.toLowerCase().endsWith('.wav') ? 'WAV' : 'MP3'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">
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
              );
            })}
          </div>
        </section>
      )}

      {/* 2-Column Section: Recently Played & Playlists / Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Recently Played (7 cols) */}
        <section className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Listening History</h2>
            </div>
            <button
              onClick={() => setActiveTab('recently_played')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              See all ({recentlyPlayed.length})
            </button>
          </div>

          <div className="space-y-1.5 bg-[#12131f] border border-[#212338] rounded-2xl p-3 shadow-xl">
            {recentlyPlayed.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                <p>No listening history recorded yet.</p>
                <p className="text-[10px] text-slate-600">Start playing songs from your library to build listening history!</p>
              </div>
            ) : (
              recentlyPlayed.slice(0, 6).map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1b1c2e] group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative group/cover shrink-0">
                      <SongArtwork
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

        {/* Right Col: Top Playlists & Active Quests (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Quests Preview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Active Quests</h2>
              </div>
              <button
                onClick={() => setActiveTab('quest')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                All quests →
              </button>
            </div>

            <div className="space-y-2">
              {dailyQuests.slice(0, 2).map((q) => {
                const isDone = q.isCompleted;
                const isClaimed = q.isClaimed;
                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-[#131422] border border-[#212338] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{q.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{q.description}</div>
                      <div className="text-[10px] font-mono text-purple-400">
                        Progress: {q.currentCount}/{q.targetCount} · +{q.xpReward} XP
                      </div>
                    </div>
                    {isClaimed ? (
                      <span className="text-[11px] text-emerald-400 font-bold shrink-0">Claimed</span>
                    ) : isDone ? (
                      <button
                        onClick={() => claimQuestReward(q.id)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 transition-colors"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono shrink-0">Active</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

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
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pl.coverGradient} flex items-center justify-center shrink-0 shadow`}
                      >
                        <Radio className="w-4 h-4 text-white/80" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-purple-300 truncate">
                          {pl.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {pl.songIds.length} tracks
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 shrink-0 ml-2" />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};