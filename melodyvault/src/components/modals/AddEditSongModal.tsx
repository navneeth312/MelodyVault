import React, { useState, useEffect } from 'react';
import { X, Music2, Image as ImageIcon, Sliders } from 'lucide-react';
import { Song, SongMood, AudioAvailability } from '../../types';

interface AddEditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (songData: any) => void;
  initialSong?: Song | null;
}

const GENRES = [
  'Synthwave',
  'Lo-Fi',
  'Electronic',
  'Jazz',
  'Rock',
  'Classical',
  'Pop',
  'Indie',
  'R&B',
  'Ambient',
  'Hip Hop',
];

const MOODS: SongMood[] = [
  'Midnight Drive',
  'Chill Lo-Fi',
  'Euphoric',
  'Melancholic',
  'Deep Focus',
  'Romantic',
  'High Energy',
];

const LANGUAGES = ['English', 'Spanish', 'French', 'Japanese', 'Instrumental', 'German', 'Italian'];

export const AddEditSongModal: React.FC<AddEditSongModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSong,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Synthwave');
  const [language, setLanguage] = useState('English');
  const [durationSecs, setDurationSecs] = useState('180');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [artwork, setArtwork] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioAvailability, setAudioAvailability] = useState<AudioAvailability>('preview');
  const [mood, setMood] = useState<SongMood>('Midnight Drive');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSong) {
      setTitle(initialSong.title);
      setArtist(initialSong.artist);
      setAlbum(initialSong.album);
      setGenre(initialSong.genre);
      setLanguage(initialSong.language);
      setDurationSecs(initialSong.duration.toString());
      setYear(initialSong.year.toString());
      setArtwork(initialSong.artwork);
      setAudioUrl(initialSong.audioUrl || '');
      setAudioAvailability(initialSong.audioAvailability);
      setMood(initialSong.mood);
    } else {
      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('Synthwave');
      setLanguage('English');
      setDurationSecs('195');
      setYear(new Date().getFullYear().toString());
      setArtwork('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80');
      setAudioUrl('');
      setAudioAvailability('preview');
      setMood('Midnight Drive');
    }
    setError(null);
  }, [initialSong, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Song title is required.');
      return;
    }
    if (!artist.trim()) {
      setError('Artist name is required.');
      return;
    }
    const dur = parseInt(durationSecs, 10);
    if (isNaN(dur) || dur <= 5) {
      setError('Duration must be at least 5 seconds.');
      return;
    }

    const payload = {
      ...initialSong,
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || 'MelodyVault Single',
      genre,
      language,
      duration: dur,
      year: parseInt(year, 10) || new Date().getFullYear(),
      artwork: artwork.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
      audioUrl: audioUrl.trim() || null,
      audioAvailability: initialSong?.isLocalImport ? ('local_file' as const) : ('metadata_only' as const),
      source: initialSong?.isLocalImport ? ('user_import' as const) : ('user_manual' as const),
      isLocalImport: Boolean(initialSong?.isLocalImport),
      mood,
      lyrics: initialSong?.lyrics || [
        { time: 0, text: `[${genre} Instrumental Intro]` },
        { time: 10, text: `Listening to ${title.trim()} by ${artist.trim()}` },
      ],
      synthNotes: initialSong?.synthNotes || [330, 392, 440, 523],
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12131f] border border-[#23253b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-[#23253b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              {initialSong ? 'Edit Song Record' : 'Catalog New Song'}
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Song Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Horizon"
                className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Artist Name *
              </label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Neon Mirage"
                className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Album
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="e.g. Synthetic Dreams"
                className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] focus:border-purple-500 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Duration (sec)
              </label>
              <input
                type="number"
                min="5"
                max="3600"
                value={durationSecs}
                onChange={(e) => setDurationSecs(e.target.value)}
                className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Mood Category
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value as SongMood)}
              className="w-full px-2.5 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none"
            >
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Artwork Image URL
            </label>
            <input
              type="url"
              value={artwork}
              onChange={(e) => setArtwork(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {initialSong?.isLocalImport ? (
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
              <div className="font-semibold flex items-center gap-1.5">
                <span>Locally Stored Audio File</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Audio binary is saved securely in browser IndexedDB: {initialSong.fileName || 'Local file'}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-amber-300">
              <div className="font-semibold">Catalogue Record (Metadata Only)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Manual catalogue entries do not store audio. To play audio, use the "Import Songs" button to upload MP3 or WAV files.
              </div>
            </div>
          )}

          {/* Modal Footer */}
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
              {initialSong ? 'Save Changes' : 'Catalog Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
