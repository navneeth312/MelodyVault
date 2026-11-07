import React, { useState, useMemo } from 'react';
import {
  Play,
  Heart,
  Plus,
  Edit2,
  Trash2,
  ListPlus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Volume2,
  Radio,
  Clock,
  Sparkles,
  UploadCloud,
  CheckSquare,
  Square,
  MinusSquare,
  RotateCcw,
  Check,
  HardDrive,
  X,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import { formatDuration } from '../utils/pureLogic';
import { isSongWithLocalAudio } from '../utils/bulkDelete';
import { BulkSelectionToolbar } from '../components/BulkSelectionToolbar';
import { BulkDeleteConfirmModal } from '../components/modals/BulkDeleteConfirmModal';

interface MusicLibraryViewProps {
  onOpenAddSong: () => void;
  onOpenEditSong: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
}

type SortField = 'title' | 'artist' | 'album' | 'duration' | 'year' | 'playCount';
type SortOrder = 'asc' | 'desc';

export const MusicLibraryView: React.FC<MusicLibraryViewProps> = ({
  onOpenAddSong,
  onOpenEditSong,
  onOpenAddToPlaylist,
}) => {
  const {
    songs,
    currentSong,
    isPlaying,
    playSong,
    toggleFavorite,
    addToQueue,
    setIsImportModalOpen,
    collectionAnalysis,
    setIsCleanupModalOpen,
    bulkDeleteSongs,
    undoLastDelete,
    deletedBatchBackup,
    clearDeletedBatchBackup,
  } = useMusic();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Multi-selection state
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract unique genres, languages, moods
  const genres = useMemo(() => ['all', ...Array.from(new Set(songs.map((s) => s.genre)))], [songs]);
  const languages = useMemo(() => ['all', ...Array.from(new Set(songs.map((s) => s.language)))], [songs]);
  const moods = useMemo(() => ['all', ...Array.from(new Set(songs.map((s) => s.mood)))], [songs]);

  // Filtered and sorted songs
  const filteredSongs = useMemo(() => {
    return songs
      .filter((s) => {
        if (filterGenre !== 'all' && s.genre !== filterGenre) return false;
        if (filterLanguage !== 'all' && s.language !== filterLanguage) return false;
        if (filterMood !== 'all' && s.mood !== filterMood) return false;
        if (filterAvailability !== 'all' && s.audioAvailability !== filterAvailability) return false;
        if (localSearch.trim()) {
          const q = localSearch.toLowerCase();
          const match =
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            s.album.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB as string).toLowerCase();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [songs, filterGenre, filterLanguage, filterMood, filterAvailability, localSearch, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Selection helpers
  const selectedSongsList = useMemo(() => {
    return songs.filter((s) => selectedSongIds.has(s.id));
  }, [songs, selectedSongIds]);

  const selectedImportedAudioCount = useMemo(() => {
    return selectedSongsList.filter(isSongWithLocalAudio).length;
  }, [selectedSongsList]);

  const isAllFilteredSelected =
    filteredSongs.length > 0 && filteredSongs.every((s) => selectedSongIds.has(s.id));
  const isSomeFilteredSelected =
    filteredSongs.some((s) => selectedSongIds.has(s.id)) && !isAllFilteredSelected;

  const toggleSelectSong = (songId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    e?.stopPropagation();
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      // Unselect all filtered songs
      setSelectedSongIds((prev) => {
        const next = new Set(prev);
        filteredSongs.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      // Select all filtered songs
      setSelectedSongIds((prev) => {
        const next = new Set(prev);
        filteredSongs.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedSongIds(new Set());
  };

  // Single-song delete click: select that song and open the confirmation modal
  const handleRequestSingleDelete = (song: Song, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSongIds(new Set([song.id]));
    setIsBulkDeleteModalOpen(true);
  };

  // Perform delete after confirmation
  const handleConfirmDelete = async () => {
    const idsToDelete = Array.from(selectedSongIds);
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      await bulkDeleteSongs(idsToDelete);
      setSelectedSongIds(new Set());
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to bulk delete songs:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-28 relative">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Music Catalog</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
              {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, filter, preview, edit and organize your entire collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[#151624] border border-[#23253a] rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Import Songs CTA */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1b1c2e] hover:bg-[#23253d] border border-purple-500/30 text-purple-200 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 hover:border-purple-400 cursor-pointer"
            title="Import local MP3 and WAV files into your MelodyVault library"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Import Songs</span>
          </button>

          {/* Add Song CTA */}
          <button
            onClick={onOpenAddSong}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/30 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Song</span>
          </button>
        </div>
      </div>

      {/* Inline Undo Alert for Recently Deleted Songs */}
      {deletedBatchBackup && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#1e1730] to-[#121320] border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-200 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">
                Recently deleted {deletedBatchBackup.deletedSongs.length} song
                {deletedBatchBackup.deletedSongs.length === 1 ? '' : 's'}
              </span>
              <span className="text-slate-400 text-[11px] block sm:inline sm:ml-2">
                Click Undo to restore them and their playlists.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => undoLastDelete()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/40 transition-all hover:scale-102 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Deletion</span>
            </button>
            <button
              onClick={clearDeletedBatchBackup}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Dismiss undo"
              aria-label="Dismiss undo option"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Demo Music Migration Notice Banner */}
      {collectionAnalysis.hasDemoMusic && (
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-[#1a172e] to-[#12131f] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  Personal Collection Migration
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                  {collectionAnalysis.demoSongsCount} Demo Tracks Detected
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  {collectionAnalysis.personalSongsCount} Personal Track{collectionAnalysis.personalSongsCount === 1 ? '' : 's'} Preserved
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Upgrade to a dedicated personal collection. Clean up preloaded sample tracks while keeping your imported audio binaries, metadata, and custom playlists untouched.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCleanupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition-all shrink-0 hover:scale-102 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clean Up Demo Music</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#12131e] border border-[#212338] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Quick text filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Search In Library
            </label>
            <input
              type="text"
              placeholder="Title, artist, album..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#18192a] border border-[#292b45] focus:border-purple-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Genre Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Genre
            </label>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#18192a] border border-[#292b45] rounded-lg text-xs text-white focus:outline-none"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === 'all' ? 'All Genres' : g}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Language
            </label>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#18192a] border border-[#292b45] rounded-lg text-xs text-white focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l === 'all' ? 'All Languages' : l}
                </option>
              ))}
            </select>
          </div>

          {/* Mood Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mood
            </label>
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#18192a] border border-[#292b45] rounded-lg text-xs text-white focus:outline-none"
            >
              {moods.map((m) => (
                <option key={m} value={m}>
                  {m === 'all' ? 'All Moods' : m}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Availability */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Audio Mode
            </label>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#18192a] border border-[#292b45] rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="all">All Audio Modes</option>
              <option value="local_file">Local Imports (MP3 / WAV)</option>
              <option value="stream">HD Audio Stream</option>
              <option value="preview">Synth Preview</option>
              <option value="metadata_only">Metadata Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {songs.length === 0 ? (
        <div className="p-12 md:p-16 text-center rounded-3xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/15 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Your Personal Music Vault is Empty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Import your personal MP3 and WAV files to experience high-fidelity local playback stored securely in your browser's IndexedDB.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all hover:scale-102 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Audio Files</span>
            </button>
            <button
              onClick={onOpenAddSong}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#18192a] hover:bg-[#23253d] border border-[#292b45] text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Add Record Manually</span>
            </button>
          </div>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12131e] border border-[#212338] text-slate-400 space-y-3">
          <Radio className="w-8 h-8 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-200">No songs match your filters</h3>
          <p className="text-xs text-slate-500">
            Try clearing search queries or adjusting your genre and mood selections.
          </p>
          <button
            onClick={() => {
              setLocalSearch('');
              setFilterGenre('all');
              setFilterLanguage('all');
              setFilterMood('all');
              setFilterAvailability('all');
            }}
            className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-600/30 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-[#12131f] border border-[#212338] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0f1019] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#212338] select-none">
                <tr>
                  {/* Select All Checkbox Column */}
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllFiltered}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                      title={
                        isAllFilteredSelected
                          ? 'Deselect all songs in view'
                          : `Select all ${filteredSongs.length} songs in view`
                      }
                      aria-label="Toggle select all in current view"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : isSomeFilteredSelected ? (
                        <MinusSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                      )}
                    </button>
                  </th>

                  {/* Play / Index */}
                  <th className="py-3 px-2 w-10 text-center">#</th>

                  {/* Title */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Title</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Artist */}
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('artist')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Artist</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Album */}
                  <th
                    className="py-3 px-4 hidden md:table-cell cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('album')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Album</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  <th className="py-3 px-4 hidden lg:table-cell">Genre & Lang</th>
                  <th className="py-3 px-4 hidden xl:table-cell">Mood</th>
                  <th className="py-3 px-4 text-center">Audio</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('duration')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Time</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2030]">
                {filteredSongs.map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isSelected = selectedSongIds.has(song.id);

                  return (
                    <tr
                      key={song.id}
                      className={`hover:bg-[#18192a] group transition-colors ${
                        isSelected
                          ? 'bg-purple-950/45 border-l-2 border-purple-500'
                          : isCurrent
                          ? 'bg-purple-950/25'
                          : ''
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-3 px-3 text-center">
                        <label
                          className="inline-flex items-center justify-center p-1 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectSong(song.id, e)}
                            className="w-4 h-4 rounded border-[#383a59] bg-[#161729] text-purple-600 focus:ring-purple-500/40 focus:ring-offset-0 cursor-pointer accent-purple-600"
                            aria-label={`Select ${song.title}`}
                          />
                        </label>
                      </td>

                      {/* Play / Index */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => playSong(song)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-purple-600 transition-all mx-auto cursor-pointer"
                          title={`Play ${song.title}`}
                          aria-label={`Play ${song.title}`}
                        >
                          {isCurrent && isPlaying ? (
                            <Volume2 className="w-3.5 h-3.5 text-purple-400 group-hover:text-white animate-pulse" />
                          ) : (
                            <Play className="w-3 h-3 translate-x-0.2" />
                          )}
                        </button>
                      </td>

                      {/* Title & Artwork */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={song.artwork}
                            alt={song.title}
                            className={`w-10 h-10 rounded-lg object-cover shrink-0 transition-transform ${
                              isSelected ? 'ring-2 ring-purple-500/70' : ''
                            }`}
                          />
                          <div className="min-w-0">
                            <div
                              className={`font-semibold truncate ${
                                isSelected
                                  ? 'text-purple-200'
                                  : isCurrent
                                  ? 'text-purple-300'
                                  : 'text-slate-100'
                              }`}
                            >
                              {song.title}
                            </div>
                            <div className="text-[11px] text-slate-400 md:hidden truncate">
                              {song.artist}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Artist */}
                      <td className="py-3 px-4 text-slate-300 truncate">{song.artist}</td>

                      {/* Album */}
                      <td className="py-3 px-4 hidden md:table-cell text-slate-400 truncate">
                        {song.album} ({song.year})
                      </td>

                      {/* Genre & Language */}
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="text-slate-300">{song.genre}</span>
                          <span>·</span>
                          <span className="text-slate-400">{song.language}</span>
                        </div>
                      </td>

                      {/* Mood */}
                      <td className="py-3 px-4 hidden xl:table-cell">
                        <span className="text-[11px] text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded">
                          {song.mood}
                        </span>
                      </td>

                      {/* Audio Status */}
                      <td className="py-3 px-4 text-center">
                        {song.audioAvailability === 'local_file' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold inline-flex items-center gap-1">
                            <HardDrive className="w-2.5 h-2.5" />
                            <span>{song.fileName?.toLowerCase().endsWith('.wav') ? 'LOCAL WAV' : 'LOCAL MP3'}</span>
                          </span>
                        )}
                        {song.audioAvailability === 'stream' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            HD
                          </span>
                        )}
                        {song.audioAvailability === 'preview' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            SYNTH
                          </span>
                        )}
                        {song.audioAvailability === 'metadata_only' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            CATALOG
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400 text-xs">
                        {formatDuration(song.duration)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleFavorite(song.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              song.isFavorite
                                ? 'text-rose-500 hover:text-rose-400'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={song.isFavorite ? 'In Favourites' : 'Add to Favourites'}
                            aria-label={song.isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
                          </button>

                          <button
                            onClick={() => addToQueue(song)}
                            className="p-1.5 text-slate-500 hover:text-purple-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Add to Up Next Queue"
                            aria-label="Add to Queue"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenAddToPlaylist(song)}
                            className="p-1.5 text-slate-500 hover:text-purple-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Add to Playlist"
                            aria-label="Add to Playlist"
                          >
                            <ListPlus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenEditSong(song)}
                            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Record"
                            aria-label="Edit Song"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleRequestSingleDelete(song, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Song"
                            aria-label={`Delete ${song.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredSongs.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const isSelected = selectedSongIds.has(song.id);

            return (
              <div
                key={song.id}
                onClick={() => toggleSelectSong(song.id)}
                className={`p-3 rounded-2xl bg-[#131422] hover:bg-[#191a2e] border transition-all group flex flex-col justify-between relative cursor-pointer select-none ${
                  isSelected
                    ? 'border-purple-500 bg-[#1a1730] shadow-xl shadow-purple-900/40 ring-1 ring-purple-500/50'
                    : isCurrent
                    ? 'border-purple-500/50 shadow-lg shadow-purple-900/20'
                    : 'border-[#212338]'
                }`}
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden mb-3 aspect-square bg-slate-900 shadow">
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Selection Checkbox Badge */}
                    <div
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleSelectSong(song.id, e)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60 ring-1 ring-white/30'
                            : 'bg-black/65 backdrop-blur-sm text-slate-300 opacity-80 group-hover:opacity-100 hover:bg-black/90'
                        }`}
                        title={isSelected ? 'Deselect song' : 'Select song'}
                        aria-label={`Select ${song.title}`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Play CTA Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song);
                      }}
                      className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:scale-105 transition-all cursor-pointer z-10"
                      title={`Play ${song.title}`}
                    >
                      <Play className="w-4 h-4 fill-white translate-x-0.2" />
                    </button>
                  </div>

                  <div
                    className={`text-xs font-bold truncate ${
                      isSelected ? 'text-purple-200' : 'text-white group-hover:text-purple-300'
                    }`}
                  >
                    {song.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{song.artist}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1e2030] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">{formatDuration(song.duration)}</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className={`p-1 cursor-pointer ${
                        song.isFavorite ? 'text-rose-500' : 'text-slate-500 hover:text-white'
                      }`}
                      title="Favorite"
                    >
                      <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => onOpenAddToPlaylist(song)}
                      className="p-1 text-slate-500 hover:text-white cursor-pointer"
                      title="Add to Playlist"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleRequestSingleDelete(song, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Delete Song"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Selection Toolbar (Positions above player bar) */}
      <BulkSelectionToolbar
        selectedCount={selectedSongIds.size}
        totalFilteredCount={filteredSongs.length}
        importedAudioCount={selectedImportedAudioCount}
        isAllFilteredSelected={isAllFilteredSelected}
        onSelectAllFiltered={handleToggleSelectAllFiltered}
        onDeselectAll={handleDeselectAll}
        onRequestDelete={() => setIsBulkDeleteModalOpen(true)}
      />

      {/* Bulk & Single Delete Confirmation Modal */}
      <BulkDeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedSongs={selectedSongsList}
        isDeleting={isDeleting}
      />
    </div>
  );
};
