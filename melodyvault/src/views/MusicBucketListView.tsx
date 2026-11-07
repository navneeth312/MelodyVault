import React, { useState } from 'react';
import {
  BookmarkCheck,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  ArrowRight,
  Sparkles,
  X,
  Compass,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { BucketListItem } from '../types';

export const MusicBucketListView: React.FC = () => {
  const {
    bucketList,
    addBucketItem,
    toggleBucketListened,
    deleteBucketItem,
    migrateBucketToLibrary,
  } = useMusic();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Indie');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'listened'>('all');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    addBucketItem({
      title: title.trim(),
      artist: artist.trim(),
      genre: genre.trim() || 'Indie',
      priority,
      notes: notes.trim(),
      source: source.trim() || 'Friend Recommendation',
    });
    setIsModalOpen(false);
    setTitle('');
    setArtist('');
    setNotes('');
    setSource('');
  };

  const filteredItems = bucketList.filter((item) => {
    if (activeFilter === 'pending') return !item.isListened;
    if (activeFilter === 'listened') return item.isListened;
    return true;
  });

  const listenedCount = bucketList.filter((b) => b.isListened).length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#18152c] to-[#0f1019] border border-purple-800/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Future Auditory Horizons
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-purple-300">
              {listenedCount} of {bucketList.length} explored
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Music Bucket List
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Catalog albums, obscure vinyl tracks, and peer recommendations you plan to explore.
            Once you’ve auditioned a track, migrate it seamlessly into your active Library.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:scale-102 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Bucket List</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#212338] pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'pending', label: `Pending (${bucketList.length - listenedCount})` },
            { id: 'listened', label: `Explored (${listenedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === tab.id
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bucket List Cards */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-2">
          <BookmarkCheck className="w-8 h-8 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-200">No bucket list items</h3>
          <p className="text-xs text-slate-500">
            Keep track of albums or songs you want to discover next!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-lg space-y-3 ${
                item.isListened
                  ? 'bg-[#11121d] border-[#1e202e] opacity-75'
                  : 'bg-[#131422] border-[#222438] hover:border-purple-500/30'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className={`text-sm font-bold truncate ${
                        item.isListened ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <div className="text-xs text-slate-400 truncate">{item.artist}</div>
                  </div>

                  {/* Priority Tag */}
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-semibold shrink-0 ${
                      item.priority === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.priority === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-300 italic line-clamp-2">
                    "{item.notes}"
                  </p>
                )}

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Source: {item.source}</span>
                  <span>·</span>
                  <span>{item.genre}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1e2030] flex items-center justify-between">
                <button
                  onClick={() => toggleBucketListened(item.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    item.isListened
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.isListened ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
                      <span>Explored</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" />
                      <span>Mark Listened</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  {!item.isListened && (
                    <button
                      onClick={() => migrateBucketToLibrary(item)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-xs font-semibold border border-purple-500/30 transition-colors"
                      title="Import into active Library catalog"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>To Library</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteBucketItem(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add to Bucket List */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12131f] border border-[#23253b] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-purple-400" />
                <span>Add to Music Bucket List</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Song or Album Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Discovery (Full Album)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Artist or Band *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daft Punk"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. French House"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Discovery Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recommended by Professor / Reddit"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Listening Notes / Why Explore?
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Benchmark for analog vocoder synthesis..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#23253b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !artist.trim()}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
                >
                  Save to Bucket List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
