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
  Rows,
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
import { formatDuration, isPlayableSong } from '../utils/pureLogic';
import { isSongWithLocalAudio } from '../utils/bulkDelete';
import { BulkSelectionToolbar } from '../components/BulkSelectionToolbar';
import { BulkDeleteConfirmModal } from '../components/modals/BulkDeleteConfirmModal';
import { SongArtwork } from '../components/common/SongArtwork';

interface MusicLibraryViewProps {
  onOpenAddSong: () => void;
  onOpenEditSong: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
}

type SortField = 'title' | 'artist' | 'album' | 'duration' | 'year' | 'playCount';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'compact' | 'grid';

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
    syncLocalSampleMusic,
  } = useMusic();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterSource, setFilterSource] = useState<'all' | 'public_catalogue' | 'user_import'>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Multi-selection state
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract unique genres, languages, moods & counts
  const catalogueCount = useMemo(() => songs.filter((s) => s.source === 'public_catalogue').length, [songs]);
  const personalCount = useMemo(() => songs.filter((s) => s.source === 'user_import').length, [songs]);

  const genres = useMemo(() => ['all', ...Array.from(new Set(songs.map((s) => s.genre)))], [songs]);
  const languages = useMemo(() => ['all', ...Array.from(new Set(songs.map((s) => s.language)))], [songs]);
  const moods = useMemo(() => ['all', ...Array.from(new Set(songs.map((s) => s.mood)))], [songs]);

  // Filtered and sorted songs
  const filteredSongs = useMemo(() => {
    return songs
      .filter((s) => {
        if (filterSource !== 'all') {
          if (filterSource === 'public_catalogue' && s.source !== 'public_catalogue') return false;
          if (filterSource === 'user_import' && s.source !== 'user_import') return false;
        }
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
  }, [songs, filterSource, filterGenre, filterLanguage, filterMood, filterAvailability, localSearch, sortField, sortOrder]);

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

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedSongIds(new Set());
  };

  // Single-song delete click: select that song and open the confirmation modal
  const handleRequestSingleDelete = (song: Song, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSongIds(new Set([song.id]));
    setIsBulkDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsBulkDeleteModalOpen(false);
    if (!isSelectMode) {
      setSelectedSongIds(new Set());
    }
  };

  // Perform delete after confirmation
  const handleConfirmDelete = async () => {
    const idsToDelete = Array.from(selectedSongIds);
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      await bulkDeleteSongs(idsToDelete);
      setSelectedSongIds(new Set());
      setIsSelectMode(false); // Exit selection mode after successful deletion
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
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'compact' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Compact Row View"
              aria-label="Compact Row View"
            >
              <Rows className="w-4 h-4" />
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

          {/* Select Mode Toggle Button */}
          <button
            onClick={() => {
              if (isSelectMode) {
                handleExitSelectMode();
              } else {
                setIsSelectMode(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              isSelectMode
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400 ring-2 ring-purple-500/30'
                : 'bg-[#1b1c2e] hover:bg-[#23253d] border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400'
            }`}
            title={isSelectMode ? 'Exit Selection Mode' : 'Enter Selection Mode to select multiple tracks'}
            aria-label={isSelectMode ? 'Exit Selection Mode' : 'Enter Selection Mode'}
          >
            <CheckSquare className={`w-4 h-4 ${isSelectMode ? 'text-white' : 'text-purple-400'}`} />
            <span>{isSelectMode ? 'Selecting' : 'Select'}</span>
          </button>

          {/* Import Songs CTA */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1b1c2e] hover:bg-[#23253d] border border-purple-500/30 text-purple-200 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 hover:border-purple-400 cursor-pointer"
            title="Import local MP3 and WAV files into your MelodyVault library"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Import Songs</span>
          </button>

          {/* Sync Sample Collection CTA (Manual Backup Trigger) */}
          <button
            onClick={() => syncLocalSampleMusic()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 border border-purple-400/40 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-950/40 transition-all shrink-0 cursor-pointer"
            title="Manual Rescan: Scan C:\MelodyVault Sample Music personal audio tracks and verify IndexedDB audio blobs & artwork"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Rescan Vault</span>
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

      {/* Collection Source Filter Pills (All Collection vs Public Legal Catalogue vs Personal Vault) */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <button
          onClick={() => setFilterSource('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            filterSource === 'all'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
              : 'bg-[#151624] hover:bg-[#1f2136] text-slate-300 border border-[#26283d]'
          }`}
        >
          <span>All Songs</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">
            {songs.length}
          </span>
        </button>

        <button
          onClick={() => setFilterSource('public_catalogue')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            filterSource === 'public_catalogue'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
              : 'bg-[#151624] hover:bg-[#1f2136] text-purple-300 border border-purple-500/25'
          }`}
          title="Explore verified public domain and CC-licensed tracks served with live streaming"
        >
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          <span>Public Catalogue</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-200">
            {catalogueCount}
          </span>
        </button>

        <button
          onClick={() => setFilterSource('user_import')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            filterSource === 'user_import'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
              : 'bg-[#151624] hover:bg-[#1f2136] text-cyan-300 border border-cyan-500/25'
          }`}
          title="Browse your locally imported MP3 & WAV audio files stored in IndexedDB"
        >
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>Personal Vault</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-200">
            {personalCount}
          </span>
        </button>
      </div>

      {/* Select Mode Toolbar / Action Banner */}
      {isSelectMode && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#1d1732] to-[#121323] border border-purple-500/50 flex flex-wrap items-center justify-between gap-3 text-xs text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Selection Mode</span>
                <span className="font-mono text-purple-300 text-[11px] font-semibold">
                  ({selectedSongIds.size} of {filteredSongs.length} selected)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {selectedSongIds.size === 0
                  ? 'Click checkboxes or track rows to select songs for bulk actions.'
                  : `${selectedSongIds.size} song${selectedSongIds.size === 1 ? '' : 's'} ready for bulk deletion.`}
                {selectedImportedAudioCount > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <HardDrive className="w-2.5 h-2.5" />
                    <span>{selectedImportedAudioCount} with local audio</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Select All / Deselect All */}
            <button
              onClick={handleToggleSelectAllFiltered}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#20223a] hover:bg-[#2b2e4f] border border-[#35385e] text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
              title={
                isAllFilteredSelected
                  ? `Deselect all ${filteredSongs.length} songs in view`
                  : `Select all ${filteredSongs.length} songs in view`
              }
            >
              {isAllFilteredSelected ? (
                <>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Select All ({filteredSongs.length})</span>
                </>
              )}
            </button>

            {selectedSongIds.size > 0 && (
              <button
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
                title="Clear selected songs"
              >
                Clear
              </button>
            )}

            {/* Bulk Delete Button */}
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={selectedSongIds.size === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold shadow-md shadow-rose-950/50 transition-all cursor-pointer"
              title={
                selectedSongIds.size === 0
                  ? 'Select songs to delete'
                  : `Delete ${selectedSongIds.size} selected song${selectedSongIds.size === 1 ? '' : 's'}`
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedSongIds.size})</span>
            </button>

            {/* Cancel / Exit Selection Mode */}
            <button
              onClick={handleExitSelectMode}
              className="px-3 py-1.5 rounded-xl bg-[#1a1b2d] hover:bg-[#252741] border border-[#2f3252] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
              title="Exit selection mode"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
        /* Table View with Controlled Horizontal Scroll and Balanced Column Budget */
        <div className="bg-[#12131f] border border-[#212338] rounded-2xl overflow-hidden shadow-xl">
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs text-slate-300 min-w-[1020px] lg:min-w-[1080px]">
              <thead className="bg-[#0f1019] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#212338] select-none">
                <tr>
                  {/* Select Checkbox Column - Only visible in Select Mode */}
                  {isSelectMode && (
                    <th className="py-2.5 px-2 w-12 text-center shrink-0">
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
                  )}

                  {/* Play / Index */}
                  <th className="py-2.5 px-2 w-12 text-center shrink-0">#</th>

                  {/* Title (Flexible width) */}
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors w-[28%] min-w-[210px]"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Title</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Artist */}
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors w-[18%] min-w-[130px]"
                    onClick={() => handleSort('artist')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Artist</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Album */}
                  <th
                    className="py-2.5 px-3 hidden md:table-cell cursor-pointer hover:text-white transition-colors w-[16%] min-w-[120px]"
                    onClick={() => handleSort('album')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Album</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>

                  {/* Genre & Lang */}
                  <th className="py-2.5 px-2.5 hidden lg:table-cell w-[14%] min-w-[110px]">Genre & Lang</th>

                  {/* Mood */}
                  <th className="py-2.5 px-2 hidden xl:table-cell w-[10%] min-w-[85px]">Mood</th>

                  {/* Audio */}
                  <th className="py-2.5 px-2 text-center w-28 shrink-0">Audio</th>

                  {/* Time */}
                  <th
                    className="py-2.5 px-2 text-right cursor-pointer hover:text-white transition-colors w-20 shrink-0 pr-3"
                    onClick={() => handleSort('duration')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Time</span>
                    </div>
                  </th>

                  {/* Actions (Always visible at the right side) */}
                  <th className="py-2.5 px-3 text-right w-36 min-w-[148px] shrink-0 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2030]">
                {filteredSongs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isSelected = selectedSongIds.has(song.id);

                  return (
                    <tr
                      key={song.id}
                      onClick={isSelectMode && song.source !== 'public_catalogue' ? () => toggleSelectSong(song.id) : undefined}
                      className={`hover:bg-[#18192a] group transition-colors ${
                        isSelectMode && song.source !== 'public_catalogue' ? 'cursor-pointer' : ''
                      } ${
                        isSelected
                          ? 'bg-purple-950/45 border-l-2 border-purple-500'
                          : isCurrent
                          ? 'bg-purple-950/25'
                          : ''
                      }`}
                    >
                      {/* Checkbox Column - Only rendered in Select Mode */}
                      {isSelectMode && (
                        <td className="py-2.5 px-2 text-center shrink-0 w-12">
                          {song.source === 'public_catalogue' ? (
                            <span className="text-slate-600 text-[10px]" title="System track">·</span>
                          ) : (
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
                          )}
                        </td>
                      )}

                      {/* Play / Index */}
                      <td className="py-2.5 px-2 text-center shrink-0 w-12">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSong(song);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all mx-auto cursor-pointer ${
                            isPlayableSong(song)
                              ? 'text-slate-400 group-hover:text-white group-hover:bg-purple-600'
                              : 'text-slate-600 hover:text-slate-500 hover:bg-slate-800/40 opacity-50'
                          }`}
                          title={
                            isPlayableSong(song)
                              ? `Play ${song.title}`
                              : `Cannot play: Manual catalogue entry (No local audio)`
                          }
                          aria-label={`Play ${song.title}`}
                        >
                          {isCurrent && isPlaying ? (
                            <Volume2 className="w-3.5 h-3.5 text-purple-400 group-hover:text-white animate-pulse" />
                          ) : (
                            <Play className="w-3 h-3 translate-x-0.2" />
                          )}
                        </button>
                      </td>

                      {/* Title & Artwork (Flexible width + tooltip on hover) */}
                      <td className="py-2.5 px-3 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <SongArtwork
                            src={song.artwork}
                            alt={song.title}
                            className={`w-9 h-9 rounded-lg object-cover shrink-0 transition-transform ${
                              isSelected ? 'ring-2 ring-purple-500/70' : ''
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-semibold truncate ${
                                isSelected
                                  ? 'text-purple-200'
                                  : isCurrent
                                  ? 'text-purple-300'
                                  : 'text-slate-100'
                              }`}
                              title={song.title}
                            >
                              {song.title}
                            </div>
                            <div className="text-[11px] text-slate-400 md:hidden truncate" title={song.artist}>
                              {song.artist}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Artist */}
                      <td className="py-2.5 px-3 text-slate-300 truncate" title={song.artist}>
                        {song.artist}
                      </td>

                      {/* Album */}
                      <td className="py-2.5 px-3 hidden md:table-cell text-slate-400 truncate" title={`${song.album} (${song.year})`}>
                        {song.album} ({song.year})
                      </td>

                      {/* Genre & Language */}
                      <td className="py-2.5 px-2.5 hidden lg:table-cell truncate" title={`${song.genre} · ${song.language}`}>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                          <span className="text-slate-300 truncate">{song.genre}</span>
                          <span>·</span>
                          <span className="text-slate-400 truncate">{song.language}</span>
                        </div>
                      </td>

                      {/* Mood */}
                      <td className="py-2.5 px-2 hidden xl:table-cell truncate">
                        <span className="text-[11px] text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded truncate inline-block max-w-full">
                          {song.mood}
                        </span>
                      </td>

                      {/* Audio Status */}
                      <td className="py-2.5 px-2 text-center shrink-0 w-28">
                        {song.source === 'public_catalogue' ? (
                          <span
                            className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold inline-flex items-center gap-1"
                            title={`Authorized Public Stream: ${song.licence || 'Public Domain'}`}
                          >
                            <Radio className="w-2.5 h-2.5 text-purple-400" />
                            <span>CATALOGUE</span>
                          </span>
                        ) : isPlayableSong(song) ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold inline-flex items-center gap-1">
                            <HardDrive className="w-2.5 h-2.5" />
                            <span>{song.fileName?.toLowerCase().endsWith('.wav') ? 'LOCAL WAV' : 'LOCAL MP3'}</span>
                          </span>
                        ) : (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium"
                            title="Catalog metadata only (No local audio binary)"
                          >
                            METADATA
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-400 text-xs shrink-0 pr-3">
                        {formatDuration(song.duration)}
                      </td>

                      {/* Action buttons (Right side, always accessible without horizontal collision) */}
                      <td className="py-2.5 px-3 text-right shrink-0 pr-4 w-36 min-w-[148px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
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
                            disabled={!isPlayableSong(song)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isPlayableSong(song)
                                ? 'text-slate-500 hover:text-purple-300 hover:bg-slate-800'
                                : 'text-slate-700 cursor-not-allowed opacity-40'
                            }`}
                            title={isPlayableSong(song) ? 'Add to Up Next Queue' : 'Only playable audio tracks can be queued'}
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

                          {song.source === 'public_catalogue' ? (
                            <span
                              className="p-1.5 text-slate-700 cursor-not-allowed opacity-30 inline-flex items-center justify-center"
                              title="Public catalogue track (System item - read only)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => onOpenEditSong(song)}
                              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Record"
                              aria-label="Edit Song"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {song.source === 'public_catalogue' ? (
                            <span
                              className="p-1.5 text-slate-700 cursor-not-allowed opacity-30 inline-flex items-center justify-center"
                              title="Public catalogue track (System item - cannot delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              onClick={(e) => handleRequestSingleDelete(song, e)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete Song"
                              aria-label={`Delete ${song.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'compact' ? (
        /* Compact Row View (2 lines per track, dense layout, zero horizontal overflow) */
        <div className="space-y-1.5">
          {filteredSongs.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const isSelected = selectedSongIds.has(song.id);

            return (
              <div
                key={song.id}
                onClick={isSelectMode ? () => toggleSelectSong(song.id) : undefined}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSelectMode ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'bg-purple-950/45 border-purple-500 shadow-md shadow-purple-950/40'
                    : isCurrent
                    ? 'bg-purple-950/25 border-purple-500/40'
                    : 'bg-[#12131f] hover:bg-[#18192a] border-[#212338]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 min-w-0">
                  {/* Left: Checkbox (Select Mode), Play button, Artwork, and Line 1 + Line 2 */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox (Select Mode only) */}
                    {isSelectMode && (
                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectSong(song.id, e)}
                          className="w-4 h-4 rounded border-[#383a59] bg-[#161729] text-purple-600 focus:ring-purple-500/40 cursor-pointer accent-purple-600"
                          aria-label={`Select ${song.title}`}
                        />
                      </div>
                    )}

                    {/* Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song);
                      }}
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                        isPlayableSong(song)
                          ? isCurrent && isPlaying
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                            : 'bg-white/5 hover:bg-purple-600 text-slate-300 hover:text-white'
                          : 'bg-white/5 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                      title={
                        isPlayableSong(song)
                          ? `Play ${song.title}`
                          : `Cannot play: Manual catalogue entry (No local audio)`
                      }
                      aria-label={`Play ${song.title}`}
                    >
                      {isCurrent && isPlaying ? (
                        <Volume2 className="w-3.5 h-3.5 animate-pulse text-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 translate-x-0.5 fill-current" />
                      )}
                    </button>

                    {/* Artwork thumbnail */}
                    <div className="hidden sm:block shrink-0">
                      <SongArtwork
                        src={song.artwork}
                        alt={song.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    </div>

                    {/* Line 1 & Line 2 Content */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {/* Line 1: Title, Format Badge, Artist, Album */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                          className={`font-semibold text-xs truncate max-w-[280px] sm:max-w-[340px] md:max-w-[420px] ${
                            isSelected
                              ? 'text-purple-200'
                              : isCurrent
                              ? 'text-purple-300 font-bold'
                              : 'text-white'
                          }`}
                          title={song.title}
                        >
                          {song.title}
                        </span>

                        {/* Format / Availability Badge */}
                        {song.source === 'public_catalogue' ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold shrink-0">
                            CATALOGUE
                          </span>
                        ) : isPlayableSong(song) ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shrink-0">
                            {song.fileName?.toLowerCase().endsWith('.wav') ? 'WAV' : 'MP3'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium shrink-0">
                            METADATA
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 truncate hidden xs:inline" title={song.artist}>
                          <span className="text-slate-600 mr-1.5">•</span>
                          {song.artist}
                        </span>

                        {song.album && (
                          <span className="text-[11px] text-slate-500 truncate hidden md:inline" title={song.album}>
                            <span className="text-slate-600 mr-1.5">•</span>
                            {song.album}
                          </span>
                        )}
                      </div>

                      {/* Line 2: Genre · Language · Mood · Duration */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
                        <span className="text-slate-400 truncate">
                          {song.genre}
                          {song.language && <span className="text-slate-500"> · {song.language}</span>}
                        </span>

                        {song.mood && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-purple-300/80 bg-purple-500/10 px-1.5 py-0.2 rounded truncate">
                              {song.mood}
                            </span>
                          </>
                        )}

                        <span className="text-slate-600">•</span>
                        <span className="font-mono text-slate-400 tabular-nums">
                          {formatDuration(song.duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: 5 Action buttons */}
                  <div
                    className="flex items-center gap-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                      disabled={!isPlayableSong(song)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isPlayableSong(song)
                          ? 'text-slate-500 hover:text-purple-300 hover:bg-slate-800'
                          : 'text-slate-700 cursor-not-allowed opacity-40'
                      }`}
                      title={isPlayableSong(song) ? 'Add to Up Next Queue' : 'Only imported audio tracks can be queued'}
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
                </div>
              </div>
            );
          })}
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
                onClick={isSelectMode ? () => toggleSelectSong(song.id) : undefined}
                className={`p-3 rounded-2xl bg-[#131422] hover:bg-[#191a2e] border transition-all group flex flex-col justify-between relative select-none ${
                  isSelectMode ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-purple-500 bg-[#1a1730] shadow-xl shadow-purple-900/40 ring-1 ring-purple-500/50'
                    : isCurrent
                    ? 'border-purple-500/50 shadow-lg shadow-purple-900/20'
                    : 'border-[#212338]'
                }`}
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden mb-3 aspect-square bg-slate-900 shadow">
                    <SongArtwork
                      src={song.artwork}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      iconClassName="w-12 h-12 text-purple-400"
                    />

                    {/* Selection Checkbox Badge - Only visible in Select Mode */}
                    {isSelectMode && (
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
                    )}

                    {/* Play CTA Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song);
                      }}
                      className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full text-white flex items-center justify-center shadow-lg transition-all cursor-pointer z-10 ${
                        isPlayableSong(song)
                          ? 'bg-purple-600 hover:bg-purple-500 opacity-0 group-hover:opacity-100 hover:scale-105'
                          : 'bg-slate-700/80 opacity-0 group-hover:opacity-60 cursor-not-allowed'
                      }`}
                      title={isPlayableSong(song) ? `Play ${song.title}` : `Cannot play: Manual catalogue entry (No local audio)`}
                    >
                      <Play className="w-4 h-4 fill-white translate-x-0.2" />
                    </button>
                  </div>

                  <div
                    className={`text-xs font-bold truncate ${
                      isSelected ? 'text-purple-200' : 'text-white group-hover:text-purple-300'
                    }`}
                    title={song.title}
                  >
                    {song.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5" title={song.artist}>
                    {song.artist}
                  </div>
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
                    {song.source !== 'public_catalogue' && (
                      <button
                        onClick={(e) => handleRequestSingleDelete(song, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete Song"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
        onCancel={handleExitSelectMode}
      />

      {/* Bulk & Single Delete Confirmation Modal */}
      <BulkDeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        selectedSongs={selectedSongsList}
        isDeleting={isDeleting}
      />
    </div>
  );
};
