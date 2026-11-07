import React, { useState } from 'react';
import { X, ListPlus, Plus, Check } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Song } from '../../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  song,
}) => {
  const { playlists, addSongToPlaylist, removeSongFromPlaylist, createPlaylist } = useMusic();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !song) return null;

  const handleToggleSongInPlaylist = (playlistId: string, isIncluded: boolean) => {
    if (isIncluded) {
      removeSongFromPlaylist(playlistId, song.id);
    } else {
      addSongToPlaylist(playlistId, song.id);
    }
  };

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = createPlaylist(
      newPlaylistName.trim(),
      'Personal Playlist in MelodyVault',
      'from-purple-900 via-indigo-950 to-slate-900'
    );
    addSongToPlaylist(pl.id, song.id);
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12131f] border border-[#23253b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#23253b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Add to Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Song Info */}
        <div className="p-4 bg-[#161726] border-b border-[#23253b] flex items-center gap-3">
          <img
            src={song.artwork}
            alt={song.title}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{song.title}</div>
            <div className="text-[11px] text-slate-400 truncate">{song.artist}</div>
          </div>
        </div>

        {/* Playlist List */}
        <div className="p-4 max-h-64 overflow-y-auto space-y-2">
          {playlists.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No playlists found.</p>
          ) : (
            playlists.map((pl) => {
              const isIncluded = pl.songIds.includes(song.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => handleToggleSongInPlaylist(pl.id, isIncluded)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                    isIncluded
                      ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                      : 'bg-[#171828] border-[#252840] hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{pl.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {pl.songIds.length} {pl.songIds.length === 1 ? 'song' : 'songs'}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                      isIncluded
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'border-slate-600'
                    }`}
                  >
                    {isIncluded && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Quick Create Inline */}
        <div className="p-4 border-t border-[#23253b] bg-[#141524]">
          {isCreating ? (
            <form onSubmit={handleQuickCreate} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#1a1b2e] border border-[#2e3150] rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-500"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#2f3254] hover:border-purple-500/50 text-slate-300 hover:text-purple-300 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Playlist</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
