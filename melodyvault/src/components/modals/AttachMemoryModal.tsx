import React, { useState } from 'react';
import { X, BookHeart, Calendar, MapPin, Sparkles } from 'lucide-react';
import { Song, SongMemory } from '../../types';

interface AttachMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memoryData: Omit<SongMemory, 'id' | 'createdAt'>) => void;
  song: Song | null;
}

const MEMORY_MOODS = [
  'Nostalgic Joy',
  'Serene Focus',
  'Triumphant',
  'Bittersweet',
  'Romantic Flutter',
  'Wild Adventure',
  'Quiet Solitude',
];

export const AttachMemoryModal: React.FC<AttachMemoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  song,
}) => {
  const [note, setNote] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [moodTag, setMoodTag] = useState(MEMORY_MOODS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !song) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please write down your memory note.');
      return;
    }

    onSave({
      songId: song.id,
      songTitle: song.title,
      artist: song.artist,
      note: note.trim(),
      memoryDate,
      location: location.trim() || undefined,
      moodTag,
    });
    setNote('');
    setLocation('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12131f] border border-[#23253b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#23253b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookHeart className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Attach Song Memory</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Song Snapshot */}
        <div className="p-3.5 px-6 bg-[#161726] border-b border-[#23253b] flex items-center gap-3">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Your Memory or Journal Entry *
            </label>
            <textarea
              rows={3}
              required
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What were you doing or feeling when this song was playing? Who were you with?"
              className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Date of Memory</span>
              </label>
              <input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Location (Optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Campus Library"
                className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Mood Sentiment</span>
            </label>
            <select
              value={moodTag}
              onChange={(e) => setMoodTag(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none"
            >
              {MEMORY_MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#23253b] flex items-center justify-end gap-2">
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
              Preserve Memory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
