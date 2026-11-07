import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ChevronDown,
  ListMusic,
  Sliders,
  HardDrive,
  AlertCircle,
  Mic2,
  Disc3,
  X,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatDuration, isPlayableSong } from '../utils/pureLogic';
import { audioEngine } from '../services/audioEngine';
import { SongArtwork } from './common/SongArtwork';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    queue,
    isInstrumentalMode,
    audioSource,
    hasInstrumental,
    toggleAudioSource,
    setAudioSource,
    openSeparationModal,
    isExpandedPlayerOpen,
    setIsExpandedPlayerOpen,
    isQueueOpen,
    setIsQueueOpen,
    statusMessage,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleInstrumentalMode,
    toggleFavorite,
    setActiveTab,
  } = useMusic();

  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([20, 40, 60, 30, 80, 50, 25, 70, 45, 85, 35, 65]);
  const [showQueueSidebar, setShowQueueSidebar] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpandedPlayerOpen(false);
      }
    };
    if (isExpandedPlayerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpandedPlayerOpen, setIsExpandedPlayerOpen]);

  // Real Audio Engine Visualizer loop
  useEffect(() => {
    let animId: number;
    const updateVisualizer = () => {
      if (isPlaying) {
        const freqData = audioEngine.getVisualizerData();
        if (freqData && freqData.length > 0) {
          const step = Math.floor(freqData.length / 12);
          const sampled = Array.from({ length: 12 }).map((_, i) => {
            const val = freqData[i * step] || 0;
            return Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
          });
          setVisualizerBars(sampled);
        } else {
          setVisualizerBars([
            Math.random() * 75 + 15,
            Math.random() * 85 + 15,
            Math.random() * 65 + 20,
            Math.random() * 90 + 10,
            Math.random() * 70 + 20,
            Math.random() * 80 + 15,
            Math.random() * 95 + 5,
            Math.random() * 60 + 25,
            Math.random() * 85 + 15,
            Math.random() * 75 + 15,
            Math.random() * 90 + 10,
            Math.random() * 65 + 20,
          ]);
        }
      } else {
        setVisualizerBars([12, 16, 12, 16, 12, 16, 12, 16, 12, 16, 12, 16]);
      }
      animId = requestAnimationFrame(updateVisualizer);
    };

    if (isExpandedPlayerOpen) {
      animId = requestAnimationFrame(updateVisualizer);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isExpandedPlayerOpen]);

  if (!isExpandedPlayerOpen || !currentSong) return null;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverSeekTime(ratio * duration);
  };

  const handleProgressMouseLeave = () => {
    setHoverSeekTime(null);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isPlayable = isPlayableSong(currentSong);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Expanded Music Player"
      className="fixed inset-0 z-50 bg-[#0c0a15] text-white flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none"
    >
      {/* Dynamic Purple Ambient Glow Backdrops */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-700/15 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none translate-y-1/3" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1e1035]/80 via-[#100d1e]/90 to-[#090810] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 px-6 sm:px-10 py-5 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
        {/* Minimize Button */}
        <button
          onClick={() => setIsExpandedPlayerOpen(false)}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
          title="Minimize player (Esc)"
          aria-label="Minimize Player"
        >
          <ChevronDown className="w-5 h-5" />
          <span className="text-xs font-semibold pr-1 hidden sm:inline">Minimize</span>
        </button>

        {/* Header Center Title / Context */}
        <div className="text-center">
          <div className="text-[10px] tracking-widest uppercase font-bold text-purple-400/90 flex items-center justify-center gap-1.5">
            <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
            <span>MelodyVault HD Player</span>
          </div>
          <div className="text-xs font-semibold text-slate-300 truncate max-w-[200px] sm:max-w-xs mt-0.5" title={currentSong.album}>
            {currentSong.album || 'Personal Library'}
          </div>
        </div>

        {/* Top Right Auxiliary Actions */}
        <div className="flex items-center gap-2">
          {/* Karaoke & Lyrics navigation */}
          <button
            onClick={() => {
              setIsExpandedPlayerOpen(false);
              setActiveTab('karaoke');
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-white/5 transition-all cursor-pointer text-xs flex items-center gap-1.5"
            title="Open Karaoke & Lyrics View"
          >
            <Mic2 className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline font-medium">Lyrics</span>
          </button>

          {/* Queue Slide-over Toggle */}
          <button
            onClick={() => setShowQueueSidebar(!showQueueSidebar)}
            className={`p-2 rounded-xl border transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
              showQueueSidebar
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
            }`}
            title="Toggle Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
            <span className="hidden md:inline font-medium">Queue</span>
            {queue.length > 0 && (
              <span className="text-[10px] font-bold bg-purple-500/80 px-1.5 py-0.2 rounded-full">
                {queue.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center px-6 sm:px-12 py-4 md:py-6 gap-8 max-w-6xl mx-auto w-full overflow-hidden">
        {/* Left Side: Prominent Album Artwork with Audio Visualizer */}
        <div className="flex flex-col items-center justify-center shrink-0 w-full max-w-sm sm:max-w-md md:w-1/2">
          <div className="relative group w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 border border-purple-500/20 bg-slate-900/80">
            <SongArtwork
              src={currentSong.artwork}
              alt={currentSong.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              iconClassName="w-24 h-24 text-purple-400"
            />

            {/* Audio Availability Badge overlay */}
            <div className="absolute top-3 left-3 z-10">
              {currentSong.audioAvailability === 'local_file' && currentSong.isLocalImport ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-md inline-flex items-center gap-1.5 shadow-lg">
                  <HardDrive className="w-3 h-3 text-cyan-400" />
                  <span>{currentSong.fileName?.toLowerCase().endsWith('.wav') ? 'LOCAL WAV (LOSSLESS)' : 'LOCAL MP3'}</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md inline-flex items-center gap-1.5 shadow-lg">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>CATALOG (NO LOCAL AUDIO)</span>
                </span>
              )}
            </div>

            {/* Visualizer overlay at bottom of album art during playback */}
            {isPlaying && (
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center gap-1.5 px-6 pb-3">
                {visualizerBars.map((height, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 bg-gradient-to-t from-purple-400 to-violet-300 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(15, height * 0.55)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side / Bottom: Track Details & Controls & Queue Drawer */}
        <div className="flex flex-col justify-between w-full md:w-1/2 max-w-lg space-y-6">
          {/* Queue Overlay (if opened) */}
          {showQueueSidebar ? (
            <div className="bg-[#151325]/95 border border-purple-500/30 rounded-2xl p-4 max-h-[360px] flex flex-col shadow-2xl backdrop-blur-xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-2">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                    Up Next Queue ({queue.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowQueueSidebar(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                  title="Close queue view"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {queue.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>Queue is empty.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Playable tracks added to Up Next will appear here.</p>
                </div>
              ) : (
                <div className="overflow-y-auto space-y-1.5 pr-1 max-h-[280px] scrollbar-thin">
                  {queue.map((track, i) => (
                    <div
                      key={`${track.id}-${i}`}
                      className="p-2 rounded-xl bg-white/5 hover:bg-purple-600/20 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SongArtwork
                          src={track.artwork}
                          alt={track.title}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate" title={track.title}>
                            {track.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{track.artist}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Song Title, Artist, and Favorite */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight truncate"
                      title={currentSong.title}
                    >
                      {currentSong.title}
                    </h1>
                    <p className="text-base sm:text-lg text-purple-300 font-semibold truncate mt-1" title={currentSong.artist}>
                      {currentSong.artist}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                      <span className="truncate max-w-[200px]">{currentSong.album}</span>
                      {currentSong.year && (
                        <>
                          <span>•</span>
                          <span>{currentSong.year}</span>
                        </>
                      )}
                      {currentSong.genre && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[11px]">
                            {currentSong.genre}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Favorite Toggle Button */}
                  <button
                    onClick={() => toggleFavorite(currentSong.id)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 ${
                      currentSong.isFavorite
                        ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={currentSong.isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
                    aria-label={currentSong.isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
                  >
                    <Heart className={`w-6 h-6 ${currentSong.isFavorite ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Warning message if non-playable track */}
                {!isPlayable && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Playback disabled: Only locally imported MP3/WAV files can be played.</span>
                  </div>
                )}

                {/* Status Message from audio engine */}
                {statusMessage && (
                  <div className="mt-2 text-xs text-amber-400 flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{statusMessage}</span>
                  </div>
                )}
              </div>

              {/* Progress Seek Bar */}
              <div className="space-y-1.5 pt-2">
                <div
                  ref={progressBarRef}
                  onClick={handleProgressClick}
                  onMouseMove={handleProgressMouseMove}
                  onMouseLeave={handleProgressMouseLeave}
                  className="relative h-2 sm:h-2.5 bg-[#252238] hover:h-3 rounded-full cursor-pointer group transition-all"
                >
                  {/* Hover seek timestamp tooltip */}
                  {hoverSeekTime !== null && (
                    <div
                      className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 bg-[#1b172d] border border-purple-500/40 text-white text-[11px] font-mono rounded shadow pointer-events-none"
                      style={{
                        left: `${(hoverSeekTime / (duration || 1)) * 100}%`,
                      }}
                    >
                      {formatDuration(hoverSeekTime)}
                    </div>
                  )}

                  {/* Filled track progress */}
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-violet-300 rounded-full relative"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-purple-950/80 scale-0 group-hover:scale-100 transition-transform" />
                  </div>
                </div>

                {/* Time Indicators */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Main Playback Controls: Shuffle, Previous, Play/Pause, Next, Repeat */}
              <div className="flex items-center justify-center gap-6 sm:gap-8 pt-2">
                {/* Shuffle Button */}
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isShuffle
                      ? 'text-purple-300 bg-purple-600/30 border border-purple-500/40 shadow-md shadow-purple-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
                  aria-label="Toggle Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                {/* Previous Button */}
                <button
                  onClick={playPrevious}
                  className="p-3 text-slate-300 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Previous song (or restart)"
                  aria-label="Previous Track"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>

                {/* Play / Pause Button */}
                <button
                  onClick={togglePlayPause}
                  disabled={!isPlayable}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-purple-600 via-purple-500 to-violet-400 hover:from-purple-500 hover:to-violet-300 text-white flex items-center justify-center shadow-2xl shadow-purple-900/60 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  title={!isPlayable ? 'Playback disabled (No local audio file)' : isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-white" />
                  ) : (
                    <Play className="w-7 h-7 fill-white translate-x-0.5" />
                  )}
                </button>

                {/* Next Button */}
                <button
                  onClick={playNext}
                  className="p-3 text-slate-300 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Next track"
                  aria-label="Next Track"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>

                {/* Repeat Button */}
                <button
                  onClick={toggleRepeat}
                  className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${
                    repeatMode !== 'off'
                      ? 'text-purple-300 bg-purple-600/30 border border-purple-500/40 shadow-md shadow-purple-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                  aria-label="Toggle Repeat"
                >
                  <Repeat className="w-5 h-5" />
                  {repeatMode === 'one' && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-purple-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center shadow">
                      1
                    </span>
                  )}
                </button>
              </div>

              {/* Bottom Row: Audio Track Source Selector & Volume Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                {/* Audio Track Selector & Vocal Studio */}
                <div className="flex items-center gap-2 flex-wrap">
                  {hasInstrumental ? (
                    <div className="flex items-center bg-[#151325] border border-purple-500/40 rounded-xl p-1 text-xs font-semibold">
                      <button
                        onClick={() => setAudioSource('original')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          audioSource === 'original'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setAudioSource('instrumental')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          audioSource === 'instrumental'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                        <span>Instrumental</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Vocal Separation Studio Modal Trigger */}
                  <button
                    onClick={() => openSeparationModal(currentSong)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-purple-300 border border-white/5 text-xs font-semibold transition-all cursor-pointer"
                    title="Open Vocal Separation Studio"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>{hasInstrumental ? 'Stem Studio' : 'Separate Vocals'}</span>
                  </button>
                </div>

                {/* Volume Slider & Mute Toggle */}
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-rose-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 sm:w-32 accent-purple-500 h-1.5 bg-[#252238] rounded-lg cursor-pointer"
                    title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                    aria-label="Volume slider"
                  />
                  <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Info / Brand */}
      <footer className="relative z-10 px-8 py-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span>MelodyVault HD Sound Engine</span>
          <span>•</span>
          <span className="font-mono text-purple-400/80">32-bit Float Audio</span>
        </div>
        <div className="hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">Esc</kbd> or click Minimize to exit
        </div>
      </footer>
    </div>
  );
};

