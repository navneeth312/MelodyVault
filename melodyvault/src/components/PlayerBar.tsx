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
  ListMusic,
  Mic2,
  Sliders,
  Radio,
  AlertCircle,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatDuration, isPlayableSong } from '../utils/pureLogic';
import { audioEngine } from '../services/audioEngine';
import { SongArtwork } from './common/SongArtwork';

export const PlayerBar: React.FC = () => {
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
    isQueueOpen,
    playerStatus,
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
    toggleAudioSource,
    openSeparationModal,
    toggleFavorite,
    setIsQueueOpen,
    setIsExpandedPlayerOpen,
    setActiveTab,
  } = useMusic();

  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([15, 30, 45, 20, 60, 35, 10, 50]);

  // Audio Visualizer Animation Loop
  useEffect(() => {
    let animId: number;
    const updateVisualizer = () => {
      if (isPlaying) {
        const freqData = audioEngine.getVisualizerData();
        if (freqData && freqData.length > 0) {
          // Take 8 sample points
          const step = Math.floor(freqData.length / 8);
          const sampled = Array.from({ length: 8 }).map((_, i) => {
            const val = freqData[i * step] || 0;
            return Math.max(10, Math.min(100, Math.round((val / 255) * 100)));
          });
          setVisualizerBars(sampled);
        } else {
          // Fallback pulse
          setVisualizerBars([
            Math.random() * 80 + 10,
            Math.random() * 90 + 10,
            Math.random() * 70 + 15,
            Math.random() * 95 + 10,
            Math.random() * 60 + 20,
            Math.random() * 85 + 10,
            Math.random() * 75 + 15,
            Math.random() * 65 + 10,
          ]);
        }
      } else {
        setVisualizerBars([10, 15, 10, 15, 10, 15, 10, 15]);
      }
      animId = requestAnimationFrame(updateVisualizer);
    };

    animId = requestAnimationFrame(updateVisualizer);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

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

  return (
    <>
      {/* Mobile Mini-Player (Sticky directly above mobile bottom nav) */}
      {currentSong && (
        <div className="fixed bottom-14 left-0 right-0 z-40 bg-[#11121d]/95 backdrop-blur-md border-t border-[#23253a] flex flex-col md:hidden select-none shadow-2xl">
          {/* Progress Bar at Top */}
          <div className="w-full h-1 bg-purple-950/60 overflow-hidden cursor-pointer" onClick={handleProgressClick}>
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="h-14 px-3 flex items-center justify-between gap-3">
            {/* Tappable Track Metadata */}
            <div
              onClick={() => setIsExpandedPlayerOpen(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <SongArtwork
                src={currentSong.artwork}
                alt={currentSong.title}
                className="w-10 h-10 rounded-lg object-cover shadow shrink-0 border border-purple-500/20"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{currentSong.title}</span>
                  {currentSong.source === 'public_catalogue' && (
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 shrink-0 font-semibold">
                      CATALOGUE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentSong.artist}
                </div>
              </div>
            </div>

            {/* Quick Actions (min 44px touch targets) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleFavorite(currentSong.id)}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 cursor-pointer active:scale-95"
                aria-label="Toggle favourite"
              >
                <Heart className={`w-4 h-4 ${currentSong.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={!isPlayableSong(currentSong)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-900/40 cursor-pointer active:scale-95 disabled:opacity-40"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-300 hover:text-white cursor-pointer active:scale-95"
                aria-label="Next song"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Full Player */}
      <footer className="h-20 bg-[#0d0e16] border-t border-[#1e202e] px-4 md:px-6 hidden md:flex items-center justify-between gap-4 select-none z-40 relative">
      {/* Track Metadata Zone (Left) */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        {currentSong ? (
          <>
            <div
              onClick={() => setIsExpandedPlayerOpen(true)}
              className="relative group shrink-0 cursor-pointer"
              title="Click to open full expanded player"
            >
              <SongArtwork
                src={currentSong.artwork}
                alt={currentSong.title}
                className="w-12 h-12 rounded-lg object-cover shadow-md border border-slate-700/50 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center gap-0.5 px-2 group-hover:opacity-0 transition-opacity">
                  {visualizerBars.slice(0, 4).map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-purple-400 rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(20, h * 0.7)}%` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {currentSong.title}
                </span>
                {/* Audio availability indicator */}
                {currentSong.audioAvailability === 'local_file' && currentSong.isLocalImport ? (
                  <span
                    className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0 font-bold"
                    title="Locally Stored Audio File"
                  >
                    {currentSong.fileName?.toLowerCase().endsWith('.wav') ? 'LOCAL WAV' : 'LOCAL MP3'}
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0"
                    title="Catalog Metadata Only (No Audio Binary)"
                  >
                    CATALOG
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentSong.artist} · <span className="text-slate-500">{currentSong.album}</span>
              </div>
            </div>

            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                currentSong.isFavorite
                  ? 'text-rose-500 hover:text-rose-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={currentSong.isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
            >
              <Heart
                className={`w-4 h-4 ${currentSong.isFavorite ? 'fill-rose-500' : ''}`}
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <div className="w-12 h-12 rounded-lg bg-[#151624] border border-[#232538] flex items-center justify-center">
              <Radio className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="font-medium text-slate-400">Ready to Play</div>
              <div className="text-[10px]">Select any song to listen</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Playback Controls & Progress Bar (Center) */}
      <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5">
        {/* Buttons Row */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isShuffle ? 'text-purple-400 bg-purple-500/15' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={playPrevious}
            className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors"
            title="Previous (or restart)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={currentSong ? !isPlayableSong(currentSong) : false}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white flex items-center justify-center shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-lg text-xs transition-colors relative ${
              repeatMode !== 'off'
                ? 'text-purple-400 bg-purple-500/15'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat className="w-3.5 h-3.5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-purple-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono tabular-nums text-slate-400 w-9 text-right shrink-0">
            {formatDuration(currentTime)}
          </span>

          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            className="relative flex-1 h-2 bg-[#202234] hover:h-2.5 rounded-full cursor-pointer group transition-all"
          >
            {/* Hover Tooltip */}
            {hoverSeekTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 bg-[#1f2133] border border-slate-700 text-white text-[10px] font-mono rounded shadow pointer-events-none"
                style={{
                  left: `${(hoverSeekTime / (duration || 1)) * 100}%`,
                }}
              >
                {formatDuration(hoverSeekTime)}
              </div>
            )}

            {/* Filled Progress */}
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-violet-400 rounded-full relative"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
            </div>
          </div>

          <span className="text-[11px] font-mono tabular-nums text-slate-400 w-9 text-left shrink-0">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Status notice if unavailable or error */}
        {statusMessage && (
          <div className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
            <AlertCircle className="w-3 h-3" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Auxiliary Controls (Right) */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {/* Karaoke Quick Button */}
        <button
          onClick={() => setActiveTab('karaoke')}
          className="p-1.5 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-slate-800/50 transition-colors"
          title="Open Karaoke & Lyrics View"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Vocal Separation / Instrumental Mode Button */}
        <button
          onClick={() => {
            if (hasInstrumental) {
              toggleAudioSource();
            } else if (currentSong) {
              openSeparationModal(currentSong);
            }
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer relative ${
            hasInstrumental && audioSource === 'instrumental'
              ? 'text-cyan-300 bg-cyan-600/25 border border-cyan-500/50 shadow-sm shadow-cyan-950'
              : hasInstrumental
              ? 'text-purple-300 bg-purple-600/20 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title={
            hasInstrumental
              ? audioSource === 'instrumental'
                ? 'Instrumental Track: Active (Click to switch to Original)'
                : 'Instrumental Stem Ready (Click to switch)'
              : 'Open Vocal Separation Studio to isolate vocals or import backing track'
          }
          aria-label="Vocal Separation & Instrumental Track Toggle"
        >
          <Sliders className="w-4 h-4" />
          {hasInstrumental && (
            <span
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                audioSource === 'instrumental' ? 'bg-cyan-400' : 'bg-purple-400'
              }`}
            />
          )}
        </button>

        {/* Queue Drawer Toggle */}
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`p-1.5 rounded-lg text-xs transition-colors relative ${
            isQueueOpen
              ? 'text-purple-300 bg-purple-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
          {queue.length > 0 && (
            <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-purple-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {queue.length}
            </span>
          )}
        </button>

        {/* Volume Slider & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 md:w-20 accent-purple-500 h-1.5 bg-[#202234] rounded-lg cursor-pointer"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>

        {/* Expand Player View Button */}
        <button
          onClick={() => setIsExpandedPlayerOpen(true)}
          disabled={!currentSong}
          className="p-1.5 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-slate-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Open expanded player (Spotify style)"
          aria-label="Open expanded player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
    </>
  );
};
