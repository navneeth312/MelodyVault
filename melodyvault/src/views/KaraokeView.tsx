import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Upload,
  Globe,
  Sparkles,
  RefreshCw,
  FileText,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { LyricLine } from '../types';
import { isPlayableSong } from '../utils/pureLogic';
import { apiService } from '../services/apiService';
import { SongArtwork } from '../components/common/SongArtwork';

export const KaraokeView: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    togglePlayPause,
    seek,
    isInstrumentalMode,
    toggleInstrumentalMode,
    audioSource,
    hasInstrumental,
    toggleAudioSource,
    openSeparationModal,
    updateSong,
    songs,
    playSong,
    showToast,
    setActiveTab,
  } = useMusic();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableLyricsText, setEditableLyricsText] = useState('');
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
  const [lyricsSource, setLyricsSource] = useState<string>('Local');
  const [isSynced, setIsSynced] = useState(true);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active song: fallback to first playable imported song if none currently playing
  const activeSong = currentSong || songs.find(isPlayableSong) || songs[0];

  // Helper to parse LRC or plain text into LyricLine[]
  const parseLrcText = (lrcText: string): { lines: LyricLine[]; isSynced: boolean } => {
    const rawLines = lrcText.split('\n').map((l) => l.trim()).filter(Boolean);
    const result: LyricLine[] = [];
    let hasTimestamp = false;

    rawLines.forEach((line, idx) => {
      const match = line.match(/^\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)$/);
      if (match) {
        hasTimestamp = true;
        const mins = parseInt(match[1], 10);
        const secs = parseFloat(match[2]);
        result.push({ time: mins * 60 + secs, text: match[3] || '♪' });
      } else {
        result.push({ time: idx * 4, text: line });
      }
    });

    result.sort((a, b) => a.time - b.time);
    return { lines: result, isSynced: hasTimestamp };
  };

  // Convert LyricLine[] to editable LRC string
  useEffect(() => {
    if (activeSong && activeSong.lyrics && activeSong.lyrics.length > 0) {
      const text = activeSong.lyrics
        .map((l) => {
          const m = Math.floor(l.time / 60);
          const s = Math.floor(l.time % 60);
          const timeStr = `[${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}]`;
          return `${timeStr} ${l.text}`;
        })
        .join('\n');
      setEditableLyricsText(text);
      setIsSynced(true);
    } else {
      setEditableLyricsText('');
    }
  }, [activeSong]);

  // Automatic online lookup if song has no lyrics
  useEffect(() => {
    let isCancelled = false;
    const fetchLyricsAutomatically = async () => {
      if (!activeSong || (activeSong.lyrics && activeSong.lyrics.length > 0)) return;

      setIsSearchingLyrics(true);
      try {
        const fetched = await apiService.getLyrics(
          activeSong.id,
          activeSong.title,
          activeSong.artist,
          activeSong.duration
        );

        if (!isCancelled && fetched) {
          const content = fetched.syncedLyrics || fetched.plainLyrics;
          if (content) {
            const { lines, isSynced: synced } = parseLrcText(content);
            if (lines.length > 0) {
              updateSong({ ...activeSong, lyrics: lines });
              setLyricsSource(fetched.source || 'LRCLIB');
              setIsSynced(synced);
              showToast(`Synced lyrics discovered for '${activeSong.title}'!`, 'success');
            }
          }
        }
      } catch (err) {
        console.warn('Lyrics lookup error:', err);
      } finally {
        if (!isCancelled) setIsSearchingLyrics(false);
      }
    };

    fetchLyricsAutomatically();
    return () => {
      isCancelled = true;
    };
  }, [activeSong?.id]);

  // Current active lyric line index based on playback time
  const currentLineIndex = useMemo(() => {
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

  const handleManualSearchLyrics = async () => {
    if (!activeSong) return;
    setIsSearchingLyrics(true);
    try {
      const fetched = await apiService.getLyrics(
        activeSong.id,
        activeSong.title,
        activeSong.artist,
        activeSong.duration
      );

      if (fetched) {
        const content = fetched.syncedLyrics || fetched.plainLyrics;
        if (content) {
          const { lines, isSynced: synced } = parseLrcText(content);
          updateSong({ ...activeSong, lyrics: lines });
          setLyricsSource(fetched.source || 'LRCLIB');
          setIsSynced(synced);
          showToast(`Loaded lyrics from ${fetched.source}`, 'success');
        } else {
          showToast('No lyrics found online for this track.', 'info');
        }
      } else {
        showToast('No lyrics found for this track online yet.', 'info');
      }
    } catch {
      showToast('Could not query lyrics service.', 'warning');
    } finally {
      setIsSearchingLyrics(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSong) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const { lines, isSynced: synced } = parseLrcText(content);
        updateSong({ ...activeSong, lyrics: lines });
        setIsSynced(synced);
        setLyricsSource('Imported .LRC');

        // Also save to backend
        await apiService.saveLyrics(
          activeSong.id,
          activeSong.title,
          activeSong.artist,
          content,
          synced ? content : '',
          'USER_FILE_IMPORT'
        );

        showToast(`Imported ${lines.length} lyric lines from ${file.name}`, 'success');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveLyrics = async () => {
    if (!activeSong) return;
    const { lines, isSynced: synced } = parseLrcText(editableLyricsText);

    updateSong({
      ...activeSong,
      lyrics: lines,
    });
    setIsSynced(synced);
    setLyricsSource('User Edited');
    setIsEditing(false);
    setHasUnsavedEdits(false);

    // Persist to Java backend
    await apiService.saveLyrics(
      activeSong.id,
      activeSong.title,
      activeSong.artist,
      editableLyricsText,
      synced ? editableLyricsText : '',
      'MANUAL_EDIT'
    );
    showToast('Saved custom lyrics successfully!', 'success');
  };

  const handleCancelEdit = () => {
    if (hasUnsavedEdits) {
      const confirmDiscard = window.confirm('Discard unsaved lyric edits?');
      if (!confirmDiscard) return;
    }
    if (activeSong && activeSong.lyrics && activeSong.lyrics.length > 0) {
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
    setIsEditing(false);
    setHasUnsavedEdits(false);
  };

  const handleLineClick = (lineTime: number) => {
    seek(lineTime);
    if (!isPlaying) {
      togglePlayPause();
    }
  };

  if (!activeSong) {
    return (
      <div className="p-16 text-center text-slate-400">
        No songs found in catalog for Karaoke.
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0a0a10] overflow-hidden'
          : 'p-6 md:p-8 space-y-6 max-w-5xl mx-auto pb-24'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".lrc,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Blurred Album Artwork Ambient Backdrop in Fullscreen */}
      {isFullscreen && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl pointer-events-none transform scale-110"
          style={{ backgroundImage: `url(${activeSong.artwork})` }}
        />
      )}

      {/* Top Karaoke Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-[#12131f] border border-[#212338] shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => {
              if (isFullscreen) {
                setIsFullscreen(false);
              } else {
                setActiveTab('library');
              }
            }}
            className="p-2.5 rounded-xl bg-[#18192a] hover:bg-[#22243d] border border-[#292b45] text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Back to Library'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <SongArtwork
            src={activeSong.artwork}
            alt={activeSong.title}
            className="w-12 h-12 rounded-2xl object-cover shadow-md shrink-0 border border-purple-500/20"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-extrabold text-white truncate">
                {activeSong.title}
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                {isSynced ? 'Synced Karaoke' : 'Static Lyrics'}
              </span>
              {lyricsSource && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b1c2e] text-slate-400 border border-[#27293d] hidden sm:inline">
                  {lyricsSource}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{activeSong.artist} • {activeSong.album}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Online Discover Lyrics */}
          <button
            onClick={handleManualSearchLyrics}
            disabled={isSearchingLyrics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18192a] hover:bg-[#22243d] border border-[#292b45] text-purple-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Discover synchronized lyrics from LRCLIB"
          >
            <Globe className={`w-3.5 h-3.5 ${isSearchingLyrics ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Discover Online</span>
          </button>

          {/* Import LRC/TXT */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18192a] hover:bg-[#22243d] border border-[#292b45] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            title="Upload .LRC or .TXT file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Import .LRC</span>
          </button>

          {/* Instrumental Vocal Track Switcher */}
          <button
            onClick={() => {
              if (hasInstrumental) {
                toggleAudioSource();
              } else {
                openSeparationModal(activeSong);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              hasInstrumental && audioSource === 'instrumental'
                ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/30'
                : hasInstrumental
                ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                : 'bg-[#18192a] border-[#292b45] text-slate-300 hover:text-white'
            }`}
            title={
              hasInstrumental
                ? audioSource === 'instrumental'
                  ? 'Switch back to original audio'
                  : 'Play isolated instrumental track'
                : 'Separate vocals or import instrumental track'
            }
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasInstrumental
                ? audioSource === 'instrumental'
                  ? 'Stem: Instrumental'
                  : 'Play Instrumental'
                : 'Stem Studio'}
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-[460px]">
        {isEditing ? (
          /* Lyrics Editor Mode */
          <div className="w-full max-w-2xl bg-[#12131f] border border-[#212338] rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">
                  Edit Synchronized Lyrics
                </span>
                <p className="text-[11px] text-slate-400">
                  Format: [mm:ss] Lyric text line. Supports Unicode (Telugu, Tamil, Hindi, English).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b1c2e] hover:bg-[#252740] border border-[#27293d] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveLyrics}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Lyrics</span>
                </button>
              </div>
            </div>
            <textarea
              rows={14}
              value={editableLyricsText}
              onChange={(e) => {
                setEditableLyricsText(e.target.value);
                setHasUnsavedEdits(true);
              }}
              placeholder="[00:15] Write your lyric timestamps here..."
              className="w-full font-mono text-xs p-4 bg-[#171829] border border-[#292b45] rounded-2xl text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>
        ) : (
          /* Timed Lyrics View */
          <div
            ref={lyricsContainerRef}
            className={`w-full max-w-3xl h-[460px] overflow-y-auto px-6 py-16 space-y-6 text-center select-none scrollbar-none font-sans ${
              isFullscreen ? 'max-w-4xl h-[68vh]' : ''
            }`}
          >
            {activeSong.lyrics.length === 0 ? (
              <div className="p-12 text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/15 text-purple-400 border border-purple-500/25 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No Lyrics Found Yet</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Synchronized lyrics have not been attached to this song yet.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleManualSearchLyrics}
                    disabled={isSearchingLyrics}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Search LRCLIB</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#1b1d30] hover:bg-[#252740] border border-[#292b45] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload .LRC</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-[#1b1d30] hover:bg-[#252740] border border-[#292b45] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Add Manually</span>
                  </button>
                </div>
              </div>
            ) : (
              activeSong.lyrics.map((line, idx) => {
                const isActive = currentLineIndex === idx;
                const isPast = currentLineIndex > idx;
                return (
                  <div
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => handleLineClick(line.time)}
                    className={`cursor-pointer transition-all duration-300 py-2.5 px-6 rounded-2xl tracking-wide ${
                      isActive
                        ? 'text-white text-2xl md:text-3xl font-black scale-105 text-purple-200 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-purple-950/20 border border-purple-500/20'
                        : isPast
                        ? 'text-slate-500 text-base md:text-lg hover:text-slate-300'
                        : 'text-slate-400 text-base md:text-lg hover:text-slate-200'
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
        <div className="relative z-10 p-5 border-t border-[#1e202e] bg-[#0c0d14]/90 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              disabled={!isPlayableSong(activeSong)}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlayableSong(activeSong) ? (isPlaying ? 'Pause' : 'Play') : 'Track unavailable'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white text-sm">{activeSong.title}</span> — {activeSong.artist}
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Exit Karaoke Fullscreen
          </button>
        </div>
      )}
    </div>
  );
};
