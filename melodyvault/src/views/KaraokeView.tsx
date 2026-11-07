import React, { useState, useEffect, useRef } from 'react';
import {
  Mic2,
  Maximize2,
  Minimize2,
  Sliders,
  Edit3,
  Save,
  Play,
  Pause,
  Music,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { LyricLine } from '../types';

export const KaraokeView: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    togglePlayPause,
    seek,
    isInstrumentalMode,
    toggleInstrumentalMode,
    updateSong,
    songs,
    playSong,
  } = useMusic();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableLyricsText, setEditableLyricsText] = useState('');
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Active song: fallback to first song if none currently playing
  const activeSong = currentSong || songs[0];

  useEffect(() => {
    if (activeSong && activeSong.lyrics) {
      // Format as "[mm:ss] text" for editing
      const text = activeSong.lyrics
        .map((l) => {
          const m = Math.floor(l.time / 60);
          const s = Math.floor(l.time % 60);
          const timeStr = `[${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}]`;
          return `${timeStr} ${l.text}`;
        })
        .join('\n');
      setEditableLyricsText(text);
    }
  }, [activeSong]);

  // Current active lyric line index based on playback time
  const currentLineIndex = React.useMemo(() => {
    if (!activeSong || !activeSong.lyrics || activeSong.lyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < activeSong.lyrics.length; i++) {
      if (currentTime >= activeSong.lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [activeSong, currentTime]);

  // Auto-scroll to active lyric line
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex]);

  const handleSaveLyrics = () => {
    if (!activeSong) return;
    const lines = editableLyricsText.split('\n').filter((l) => l.trim().length > 0);
    const parsedLyrics: LyricLine[] = [];

    lines.forEach((line) => {
      const match = line.match(/^\[(\d{1,2}):(\d{2})\]\s*(.*)$/);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const text = match[3];
        parsedLyrics.push({ time: mins * 60 + secs, text });
      } else {
        // Plain line without timestamp
        parsedLyrics.push({
          time: parsedLyrics.length > 0 ? parsedLyrics[parsedLyrics.length - 1].time + 5 : 0,
          text: line.trim(),
        });
      }
    });

    updateSong({
      ...activeSong,
      lyrics: parsedLyrics,
    });
    setIsEditing(false);
  };

  const handleLineClick = (lineTime: number) => {
    seek(lineTime);
    if (!isPlaying) {
      togglePlayPause();
    }
  };

  if (!activeSong) {
    return (
      <div className="p-12 text-center text-slate-400">
        No songs found in catalog for Karaoke.
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0a0a10] overflow-hidden'
          : 'p-6 md:p-8 space-y-6 max-w-5xl mx-auto pb-16'
      }`}
    >
      {/* Blurred Album Artwork Ambient Backdrop in Fullscreen */}
      {isFullscreen && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 blur-3xl pointer-events-none"
          style={{ backgroundImage: `url(${activeSong.artwork})` }}
        />
      )}

      {/* Top Karaoke Bar */}
      <div className="relative z-10 flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#12131f] border border-[#212338]">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={activeSong.artwork}
            alt={activeSong.title}
            className="w-12 h-12 rounded-xl object-cover shadow shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-white truncate">
                {activeSong.title}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Karaoke Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{activeSong.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Instrumental Vocal Suppressor */}
          <button
            onClick={toggleInstrumentalMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isInstrumentalMode
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                : 'bg-[#18192a] border-[#292b45] text-slate-300 hover:text-white'
            }`}
            title="Suppresses vocal frequencies using audio equalizer band notch"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isInstrumentalMode ? 'Instrumental ON' : 'Instrumental Mode'}
            </span>
          </button>

          {/* Edit Lyrics Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-xl text-xs transition-colors border ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#18192a] border-[#292b45] text-slate-400 hover:text-white'
            }`}
            title={isEditing ? 'Cancel Edit' : 'Edit Lyrics Timestamps'}
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-[#18192a] hover:bg-[#22243a] border border-[#292b45] text-slate-400 hover:text-white rounded-xl transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Lyrics'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Lyrics Display Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-[480px]">
        {isEditing ? (
          /* Lyrics Editor Mode */
          <div className="w-full max-w-2xl bg-[#12131f] border border-[#212338] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Edit Lyrics (Format: [mm:ss] Lyric text)
              </span>
              <button
                onClick={handleSaveLyrics}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Lyrics</span>
              </button>
            </div>
            <textarea
              rows={14}
              value={editableLyricsText}
              onChange={(e) => setEditableLyricsText(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-[#171829] border border-[#292b45] rounded-xl text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
        ) : (
          /* Timed Lyrics View */
          <div
            ref={lyricsContainerRef}
            className={`w-full max-w-2xl h-[460px] overflow-y-auto px-6 py-12 space-y-6 text-center select-none ${
              isFullscreen ? 'max-w-4xl h-[65vh]' : ''
            }`}
          >
            {activeSong.lyrics.length === 0 ? (
              <div className="text-slate-500 text-sm">No lyrics available for this song.</div>
            ) : (
              activeSong.lyrics.map((line, idx) => {
                const isActive = currentLineIndex === idx;
                const isPast = currentLineIndex > idx;
                return (
                  <div
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => handleLineClick(line.time)}
                    className={`cursor-pointer transition-all duration-300 py-2 px-4 rounded-xl ${
                      isActive
                        ? 'text-white text-xl md:text-2xl font-extrabold scale-105 text-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                        : isPast
                        ? 'text-slate-500 text-sm md:text-base hover:text-slate-300'
                        : 'text-slate-400 text-sm md:text-base hover:text-slate-200'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Sing Bar in Fullscreen */}
      {isFullscreen && (
        <div className="relative z-10 p-4 border-t border-[#1e202e] bg-[#0c0d14]/90 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">{activeSong.title}</span> — {activeSong.artist}
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Exit Karaoke Fullscreen
          </button>
        </div>
      )}
    </div>
  );
};
