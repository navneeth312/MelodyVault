import React from 'react';
import { X, Trash2, Play, Music, Sparkles } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatDuration } from '../utils/pureLogic';
import { SongArtwork } from './common/SongArtwork';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    currentSong,
    playSong,
    removeFromQueue,
    clearQueue,
  } = useMusic();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-[#11121d] border-l border-[#222538] shadow-2xl z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#222538] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">Play Queue</h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
            {queue.length + (currentSong ? 1 : 0)} tracks
          </span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
              title="Clear upcoming queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Now Playing Block */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Now Playing
          </div>
          {currentSong ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
              <SongArtwork
                src={currentSong.artwork}
                alt={currentSong.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-purple-200 truncate">
                  {currentSong.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{currentSong.artist}</div>
                <div className="text-[10px] text-purple-400/80 font-mono">
                  {formatDuration(currentSong.duration)} · {currentSong.genre}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500 bg-[#161726] rounded-xl border border-[#222438]">
              No track currently playing
            </div>
          )}
        </div>

        {/* Up Next List */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Up Next</span>
            <span className="text-[10px] text-slate-500 font-normal">
              {queue.length} in waiting
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#26283d] rounded-xl">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p>Your queue is empty</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Add songs from your Library or Playlists by clicking their queue button
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((song, idx) => (
                <div
                  key={`${song.id}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#151624] hover:bg-[#1c1d2e] border border-[#222438] group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono text-slate-500 w-4 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <SongArtwork
                      src={song.artwork}
                      alt={song.title}
                      className="w-9 h-9 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 group-hover:text-purple-300 truncate">
                        {song.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{song.artist}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        removeFromQueue(idx);
                        playSong(song);
                      }}
                      className="p-1.5 text-slate-400 hover:text-purple-400 rounded transition-colors"
                      title="Play Now"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Remove from Queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
