import React, { useState, useMemo } from 'react';
import {
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  ListPlus,
  Clock,
  Heart,
  Calendar,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { filterForgottenSongs, formatDuration, isPlayableSong } from '../utils/pureLogic';
import { Song } from '../types';
import { SongArtwork } from '../components/common/SongArtwork';

interface ForgottenSongsViewProps {
  onOpenAddToPlaylist: (song: Song) => void;
}

export const ForgottenSongsView: React.FC<ForgottenSongsViewProps> = ({
  onOpenAddToPlaylist,
}) => {
  const { songs, playSong, toggleFavorite, createPlaylist, addSongToPlaylist, awardXP, showToast } = useMusic();
  const [daysThreshold, setDaysThreshold] = useState<number>(14);

  // Filter forgotten songs
  const forgottenSongs = useMemo(() => {
    return filterForgottenSongs(songs, daysThreshold) as Song[];
  }, [songs, daysThreshold]);

  const handlePlayForgottenMix = () => {
    const playableForgotten = forgottenSongs.filter(isPlayableSong);
    if (playableForgotten.length === 0) {
      showToast('No playable imported tracks found in forgotten songs.', 'info');
      return;
    }
    awardXP(30, 'Rediscovering forgotten library gems');
    playSong(playableForgotten[0], playableForgotten.slice(1));
  };

  const handleCreateNostalgiaPlaylist = () => {
    if (forgottenSongs.length === 0) return;
    const pl = createPlaylist(
      `Rediscovered Gems (${daysThreshold}d+)`,
      `Curated collection of songs unplayed for at least ${daysThreshold} days in MelodyVault.`,
      'from-amber-950 via-purple-950 to-slate-900'
    );
    forgottenSongs.slice(0, 10).forEach((s) => {
      addSongToPlaylist(pl.id, s.id);
    });
    awardXP(40, 'Curated Forgotten Nostalgia playlist');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-[#1a1728] to-[#0f1019] border border-amber-800/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Intelligent Library Discovery
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-amber-300">Dust Off The Vinyl</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Forgotten Songs Discovery
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Unearth catalog tracks that haven't graced your headphones recently. Reclaim neglected
            b-sides and hidden album cuts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePlayForgottenMix}
            disabled={forgottenSongs.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/50 hover:scale-102 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Rediscovery Mix</span>
          </button>

          <button
            onClick={handleCreateNostalgiaPlaylist}
            disabled={forgottenSongs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1b1c2e] hover:bg-[#252842] disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold border border-[#2d304a] transition-colors"
          >
            <ListPlus className="w-4 h-4 text-amber-400" />
            <span>Save as Playlist</span>
          </button>
        </div>
      </div>

      {/* Threshold Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#12131e] border border-[#212338] p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">
            Unplayed Threshold Period:
          </span>
        </div>

        <div className="flex items-center gap-2">
          {[
            { days: 7, label: '7 Days' },
            { days: 14, label: '14 Days' },
            { days: 30, label: '30 Days' },
            { days: 60, label: '60+ Days' },
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => setDaysThreshold(item.days)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                daysThreshold === item.days
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-[#18192a] border border-[#292b45] text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Songs Table */}
      {forgottenSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">No forgotten tracks found!</h3>
          <p className="text-xs text-slate-500">
            You've listened to all songs in your library within the last {daysThreshold} days. Great dedication!
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
                <th className="py-3 px-4 hidden lg:table-cell">Genre</th>
                <th className="py-3 px-4">Neglect Status</th>
                <th className="py-3 px-4 text-right">Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2030]">
              {forgottenSongs.map((song, idx) => {
                const daysAgo = song.lastPlayedAt
                  ? Math.floor(
                      (Date.now() - new Date(song.lastPlayedAt).getTime()) / (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <tr key={song.id} className="hover:bg-[#18192a] group transition-colors">
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => playSong(song, forgottenSongs.slice(idx + 1))}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-amber-600 transition-all mx-auto"
                      >
                        <Play className="w-3 h-3 translate-x-0.2" />
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <SongArtwork
                          src={song.artwork}
                          alt={song.title}
                          className="w-9 h-9 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{song.title}</div>
                          <div className="text-[11px] text-slate-400 md:hidden">{song.artist}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell text-slate-300">{song.artist}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-slate-400">{song.genre}</td>

                    <td className="py-3 px-4 font-mono text-xs">
                      {daysAgo !== null ? (
                        <span className="text-amber-400/90">{daysAgo} days unplayed</span>
                      ) : (
                        <span className="text-slate-500">Never played (0 plays)</span>
                      )}
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
