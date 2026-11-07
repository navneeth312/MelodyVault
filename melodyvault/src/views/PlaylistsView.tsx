import React, { useState, useMemo } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Shuffle,
  Clock,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  X,
  Music,
  ArrowLeft,
  Heart,
  Share2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { calculatePlaylistStats, formatDuration } from '../utils/pureLogic';
import { Playlist, Song } from '../types';

interface PlaylistsViewProps {
  onOpenCreatePlaylist: () => void;
  onOpenEditPlaylist: (playlist: Playlist) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  onOpenCreatePlaylist,
  onOpenEditPlaylist,
}) => {
  const {
    playlists,
    songs,
    selectedPlaylistId,
    setSelectedPlaylistId,
    deletePlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs,
    playSong,
    toggleFavorite,
    addToQueue,
  } = useMusic();

  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  const activePlaylist = useMemo(() => {
    if (!selectedPlaylistId) return null;
    return playlists.find((p) => p.id === selectedPlaylistId) || null;
  }, [playlists, selectedPlaylistId]);

  // Resolve songs inside the active playlist
  const activePlaylistSongs = useMemo(() => {
    if (!activePlaylist) return [];
    const songMap = new Map<string, Song>();
    songs.forEach((s) => songMap.set(s.id, s));
    return activePlaylist.songIds.map((id) => songMap.get(id)).filter(Boolean) as Song[];
  }, [activePlaylist, songs]);

  const playlistStats = useMemo(() => {
    if (!activePlaylist) return { songCount: 0, totalSeconds: 0, formattedDuration: '0 min' };
    return calculatePlaylistStats(songs, activePlaylist.songIds);
  }, [activePlaylist, songs]);

  const handlePlayAll = (shuffle = false) => {
    if (activePlaylistSongs.length === 0) return;
    if (shuffle) {
      const shuffled = [...activePlaylistSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled.slice(1));
    } else {
      playSong(activePlaylistSongs[0], activePlaylistSongs.slice(1));
    }
  };

  const handleMoveUp = (index: number) => {
    if (!activePlaylist || index === 0) return;
    reorderPlaylistSongs(activePlaylist.id, index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (!activePlaylist || index === activePlaylist.songIds.length - 1) return;
    reorderPlaylistSongs(activePlaylist.id, index, index + 1);
  };

  const confirmDeletePlaylist = () => {
    if (playlistToDelete) {
      deletePlaylist(playlistToDelete.id);
      setPlaylistToDelete(null);
    }
  };

  // If a playlist is selected, show detail view
  if (activePlaylist) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
        {/* Back Link */}
        <button
          onClick={() => setSelectedPlaylistId(null)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Playlists</span>
        </button>

        {/* Playlist Header Hero */}
        <div className="rounded-3xl bg-[#131422] border border-[#212338] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
          <div
            className={`w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-br ${activePlaylist.coverGradient} flex items-center justify-center shadow-2xl shrink-0 border border-white/10`}
          >
            <ListMusic className="w-16 h-16 text-white/80" />
          </div>

          <div className="space-y-3 flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
              Curated Playlist
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
              {activePlaylist.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 line-clamp-2">
              {activePlaylist.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>{playlistStats.songCount} {playlistStats.songCount === 1 ? 'track' : 'tracks'}</span>
              <span>·</span>
              <span>{playlistStats.formattedDuration}</span>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handlePlayAll(false)}
                disabled={activePlaylistSongs.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:scale-102 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Playlist</span>
              </button>

              <button
                onClick={() => handlePlayAll(true)}
                disabled={activePlaylistSongs.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1b1c2e] hover:bg-[#252740] disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-[#2d304a]"
              >
                <Shuffle className="w-4 h-4 text-purple-400" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={() => onOpenEditPlaylist(activePlaylist)}
                className="p-2.5 bg-[#1b1c2e] hover:bg-[#252740] text-slate-300 rounded-xl transition-colors border border-[#2d304a]"
                title="Edit Playlist details"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPlaylistToDelete(activePlaylist)}
                className="p-2.5 bg-[#1b1c2e] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-[#2d304a]"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Playlist Song List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tracks & Order</h2>

          {activePlaylistSongs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-2">
              <Music className="w-8 h-8 mx-auto text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-200">This playlist is empty</h3>
              <p className="text-xs text-slate-500">
                Go to the Music Library to add tracks to "{activePlaylist.name}".
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
                    <th className="py-3 px-4 text-center">Reorder</th>
                    <th className="py-3 px-4 text-right">Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2030]">
                  {activePlaylistSongs.map((song, idx) => (
                    <tr
                      key={`${song.id}-${idx}`}
                      className="hover:bg-[#18192a] group transition-colors"
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => playSong(song, activePlaylistSongs.slice(idx + 1))}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-purple-600 transition-all mx-auto"
                        >
                          <Play className="w-3 h-3 translate-x-0.2" />
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
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

                      <td className="py-3 px-4 hidden md:table-cell text-slate-300 truncate">
                        {song.artist}
                      </td>

                      <td className="py-3 px-4 hidden lg:table-cell text-slate-400 truncate">
                        {song.album}
                      </td>

                      {/* Reorder Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === activePlaylistSongs.length - 1}
                            className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                            onClick={() => removeSongFromPlaylist(activePlaylist.id, song.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Remove from Playlist"
                          >
                            <X className="w-3.5 h-3.5" />
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
      </div>
    );
  }

  // All Playlists Grid
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Playlists Collection</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
              {playlists.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, reorder, customize and manage themed collections.
          </p>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="p-12 md:p-16 text-center rounded-3xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-4 max-w-lg mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/15 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
            <ListMusic className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Playlists Created Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize your personal music vault into themed playlists for workouts, study focus, or roadtrips.
            </p>
          </div>
          <button
            onClick={onOpenCreatePlaylist}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all hover:scale-102"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlists.map((playlist) => {
          const stats = calculatePlaylistStats(songs, playlist.songIds);
          return (
            <div
              key={playlist.id}
              onClick={() => setSelectedPlaylistId(playlist.id)}
              className="p-4 rounded-2xl bg-[#131422] hover:bg-[#191a2e] border border-[#212338] hover:border-purple-500/40 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-full aspect-video rounded-xl bg-gradient-to-br ${playlist.coverGradient} flex items-center justify-center shadow-md mb-3 border border-white/10 group-hover:scale-102 transition-transform`}
                >
                  <ListMusic className="w-10 h-10 text-white/80" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 truncate">
                  {playlist.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {playlist.description || 'Custom playlist'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e2030] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{stats.songCount} {stats.songCount === 1 ? 'song' : 'songs'}</span>
                <span>{stats.formattedDuration}</span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {playlistToDelete && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141524] border border-[#26283d] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Playlist?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{playlistToDelete.name}"</span>? Songs in your library will not be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPlaylistToDelete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePlaylist}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Delete Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
