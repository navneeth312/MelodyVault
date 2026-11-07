import React, { useState, useEffect } from 'react';
import { X, ListMusic, Palette } from 'lucide-react';
import { Playlist } from '../../types';

interface CreateEditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, coverGradient: string) => void;
  initialPlaylist?: Playlist | null;
}

const GRADIENT_THEMES = [
  { name: 'Violet Velvet', value: 'from-purple-900 via-indigo-950 to-slate-900' },
  { name: 'Neon Cyber', value: 'from-violet-950 via-purple-900 to-fuchsia-950' },
  { name: 'Vintage Soul', value: 'from-amber-950 via-stone-900 to-zinc-950' },
  { name: 'High Voltage', value: 'from-rose-950 via-purple-950 to-black' },
  { name: 'Emerald Forest', value: 'from-emerald-950 via-teal-950 to-slate-950' },
  { name: 'Midnight Deep', value: 'from-blue-950 via-slate-900 to-black' },
];

export const CreateEditPlaylistModal: React.FC<CreateEditPlaylistModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPlaylist,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_THEMES[0].value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPlaylist) {
      setName(initialPlaylist.name);
      setDescription(initialPlaylist.description);
      setSelectedGradient(initialPlaylist.coverGradient || GRADIENT_THEMES[0].value);
    } else {
      setName('');
      setDescription('');
      setSelectedGradient(GRADIENT_THEMES[0].value);
    }
    setError(null);
  }, [initialPlaylist, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Playlist name cannot be empty.');
      return;
    }
    onSave(name.trim(), description.trim(), selectedGradient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12131f] border border-[#23253b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#23253b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              {initialPlaylist ? 'Edit Playlist Details' : 'Create New Playlist'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Lo-Fi Focus"
              className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give your playlist a story or mood description..."
              className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Cover Artwork Theme</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_THEMES.map((theme) => {
                const isSelected = selectedGradient === theme.value;
                return (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => setSelectedGradient(theme.value)}
                    className={`h-12 rounded-xl bg-gradient-to-br ${theme.value} border-2 transition-all flex items-center justify-center ${
                      isSelected
                        ? 'border-white scale-102 shadow-lg shadow-purple-950/40 ring-2 ring-purple-500/50'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-white/90 drop-shadow">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#23253b] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-900/30 transition-all"
            >
              {initialPlaylist ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
