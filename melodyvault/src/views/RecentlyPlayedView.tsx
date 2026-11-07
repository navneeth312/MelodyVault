import React from 'react';
import { Clock, Play, Heart, ListPlus, Volume2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatDuration } from '../utils/pureLogic';
import { Song } from '../types';

interface RecentlyPlayedViewProps {
  onOpenAddToPlaylist: (song: Song) => void;
}

export const RecentlyPlayedView: React.FC<RecentlyPlayedViewProps> = ({
  onOpenAddToPlaylist,
}) => {
  const { recentlyPlayed, currentSong, isPlaying, playSong, toggleFavorite } = useMusic();

  const formatPlayedDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) {
      const mins = Math.max(1, Math.round(diffHours * 60));
      return `${mins}m ago`;
    }
    if (diffHours < 24) {
      return `${Math.round(diffHours)}h ago`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Listening History</span>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
            {recentlyPlayed.length} tracks
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Chronological record of songs auditioned and enjoyed in MelodyVault.
        </p>
      </div>

      {recentlyPlayed.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-200">No recently played tracks</h3>
          <p className="text-xs text-slate-500">
            Hit play on any track to start building your auditory timeline.
          </p>
        </div>
      ) : (
        <div className="bg-[#12131f] border border-[#212338] rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0f1019] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#212338]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden md:table-cell">Artist</th>
                <th className="py-3 px-4 hidden lg:table-cell">Play Count</th>
                <th className="py-3 px-4">Last Played</th>
                <th className="py-3 px-4 text-right">Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2030]">
              {recentlyPlayed.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <tr
                    key={song.id}
                    className={`hover:bg-[#18192a] group transition-colors ${
                      isCurrent ? 'bg-purple-950/25' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => playSong(song)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-purple-600 transition-all mx-auto"
                      >
                        {isCurrent && isPlaying ? (
                          <Volume2 className="w-3.5 h-3.5 text-purple-400 group-hover:text-white animate-pulse" />
                        ) : (
                          <Play className="w-3 h-3 translate-x-0.2" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={song.artwork}
                          alt={song.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div
                            className={`font-semibold truncate ${
                              isCurrent ? 'text-purple-300' : 'text-slate-100'
                            }`}
                          >
                            {song.title}
                          </div>
                          <div className="text-[11px] text-slate-400 md:hidden">{song.artist}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell text-slate-300">{song.artist}</td>

                    <td className="py-3 px-4 hidden lg:table-cell font-mono text-purple-400">
                      {song.playCount} {song.playCount === 1 ? 'play' : 'plays'}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                      {formatPlayedDate(song.lastPlayedAt)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                      {formatDuration(song.duration)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleFavorite(song.id)}
                          className={`p-1.5 ${
                            song.isFavorite ? 'text-rose-500' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => onOpenAddToPlaylist(song)}
                          className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                          title="Add to Playlist"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
