import React from 'react';
import { Heart, Play, Shuffle, Plus, Clock, ListPlus } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { formatDuration, isPlayableSong } from '../utils/pureLogic';
import { Song } from '../types';
import { SongArtwork } from '../components/common/SongArtwork';

interface FavoritesViewProps {
  onOpenAddToPlaylist: (song: Song) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onOpenAddToPlaylist }) => {
  const { favorites, playSong, toggleFavorite, addToQueue } = useMusic();

  const playableFavorites = favorites.filter(isPlayableSong);

  const handlePlayAll = (shuffle = false) => {
    if (playableFavorites.length === 0) return;
    if (shuffle) {
      const shuffled = [...playableFavorites].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled.slice(1));
    } else {
      playSong(playableFavorites[0], playableFavorites.slice(1));
    }
  };

  const totalSeconds = favorites.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-950 via-[#1d1424] to-[#12131e] border border-rose-900/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-rose-900/40 shrink-0">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
              Personal Collection
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Favourites
            </h1>
            <p className="text-xs text-slate-300">
              {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} · {Math.round(totalSeconds / 60)} minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePlayAll(false)}
            disabled={playableFavorites.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/40 hover:scale-102 transition-all"
            title={playableFavorites.length === 0 ? 'No playable imported tracks in Favourites' : 'Play All'}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play All</span>
          </button>
          <button
            onClick={() => handlePlayAll(true)}
            disabled={playableFavorites.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1b1c2e] hover:bg-[#252740] disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-[#2d304a]"
            title={playableFavorites.length === 0 ? 'No playable imported tracks in Favourites' : 'Shuffle'}
          >
            <Shuffle className="w-4 h-4 text-rose-400" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* List */}
      {favorites.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-2">
          <Heart className="w-8 h-8 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-200">No favourites yet</h3>
          <p className="text-xs text-slate-500">
            Click the heart icon on any song across MelodyVault to bookmark your favorite tracks.
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
                <th className="py-3 px-4 hidden lg:table-cell">Album</th>
                <th className="py-3 px-4 text-right">Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2030]">
              {favorites.map((song, idx) => (
                <tr key={song.id} className="hover:bg-[#18192a] group transition-colors">
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => playSong(song, favorites.slice(idx + 1))}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all mx-auto ${
                        isPlayableSong(song)
                          ? 'text-slate-400 group-hover:text-white group-hover:bg-rose-600'
                          : 'text-slate-600 opacity-50'
                      }`}
                      title={isPlayableSong(song) ? `Play ${song.title}` : `Cannot play: Manual catalogue entry (No local audio)`}
                    >
                      <Play className="w-3 h-3 translate-x-0.2" />
                    </button>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <SongArtwork
                        src={song.artwork}
                        alt={song.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{song.title}</div>
                        <div className="text-[11px] text-slate-400 md:hidden">{song.artist}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 hidden md:table-cell text-slate-300">{song.artist}</td>
                  <td className="py-3 px-4 hidden lg:table-cell text-slate-400">{song.album}</td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                    {formatDuration(song.duration)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleFavorite(song.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Remove from Favourites"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
