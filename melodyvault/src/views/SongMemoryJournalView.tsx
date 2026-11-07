import React, { useState } from 'react';
import {
  BookHeart,
  Plus,
  Calendar,
  MapPin,
  Play,
  Trash2,
  Sparkles,
  Heart,
  Music,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song, SongMemory } from '../types';
import { isPlayableSong } from '../utils/pureLogic';
import { SongArtwork } from '../components/common/SongArtwork';

interface SongMemoryJournalViewProps {
  onOpenAttachMemory: (song: Song) => void;
}

export const SongMemoryJournalView: React.FC<SongMemoryJournalViewProps> = ({
  onOpenAttachMemory,
}) => {
  const { memories, deleteMemory, songs, playSong } = useMusic();
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all');
  const [memorySearch, setMemorySearch] = useState('');

  const moodTags = ['all', ...Array.from(new Set(memories.map((m) => m.moodTag).filter(Boolean)))];

  const filteredMemories = memories.filter((m) => {
    if (selectedMoodFilter !== 'all' && m.moodTag !== selectedMoodFilter) return false;
    if (memorySearch.trim()) {
      const q = memorySearch.toLowerCase();
      return (
        m.songTitle.toLowerCase().includes(q) ||
        m.artist.toLowerCase().includes(q) ||
        m.note.toLowerCase().includes(q) ||
        (m.location && m.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handlePlaySongForMemory = (songId: string) => {
    const song = songs.find((s) => s.id === songId);
    if (song) {
      playSong(song);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#1a1426] to-[#0f1019] border border-purple-800/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Personal Vault
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-purple-300">Auditory Journal</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Song Memory Journal
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Attach personal stories, road trips, study sessions, and milestone moments to individual
            songs. Music is the ultimate mnemonic anchor for life's memories.
          </p>
        </div>

        {/* Quick add with first song selector */}
        {songs.length > 0 && (
          <button
            onClick={() => onOpenAttachMemory(songs[0])}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:scale-102 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Memory</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#12131e] border border-[#212338] p-4 rounded-2xl">
        <input
          type="text"
          placeholder="Search memories by note, song, or location..."
          value={memorySearch}
          onChange={(e) => setMemorySearch(e.target.value)}
          className="w-full sm:max-w-md px-3 py-2 bg-[#18192a] border border-[#292b45] focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Sentiment:</span>
          <select
            value={selectedMoodFilter}
            onChange={(e) => setSelectedMoodFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#18192a] border border-[#292b45] rounded-xl text-xs text-white focus:outline-none"
          >
            {moodTags.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Sentiments' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-2">
          <BookHeart className="w-8 h-8 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-200">No journal memories found</h3>
          <p className="text-xs text-slate-500">
            Log your first musical memory using the button above or browse your Library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => {
            const linkedSong = songs.find((s) => s.id === mem.songId);
            return (
              <div
                key={mem.id}
                className="p-6 rounded-3xl bg-[#131422] hover:bg-[#18192a] border border-[#212338] hover:border-purple-500/30 transition-all flex flex-col justify-between shadow-xl space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Song Anchor Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e2030]">
                    <div className="flex items-center gap-3 min-w-0">
                      {linkedSong && (
                        <SongArtwork
                          src={linkedSong.artwork}
                          alt={linkedSong.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {mem.songTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{mem.artist}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlaySongForMemory(mem.songId)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isPlayableSong(linkedSong)
                          ? 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white'
                          : 'bg-slate-800 text-slate-500 opacity-60'
                      }`}
                      title={isPlayableSong(linkedSong) ? 'Play Associated Track' : 'Manual catalogue entry (No local audio)'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.2" />
                    </button>
                  </div>

                  {/* Note Body */}
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed italic">
                    "{mem.note}"
                  </p>

                  {/* Metadata: Date, Location, Mood */}
                  <div className="space-y-1 pt-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{mem.memoryDate}</span>
                    </div>

                    {mem.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{mem.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer sentiment tag & delete */}
                <div className="pt-3 border-t border-[#1e2030] flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                    {mem.moodTag || 'Musical Memory'}
                  </span>

                  <button
                    onClick={() => deleteMemory(mem.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
