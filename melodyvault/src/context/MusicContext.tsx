import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Song,
  Playlist,
  TimeCapsule,
  SongMemory,
  BucketListItem,
  QuestBadge,
  LeaderboardUser,
  NavigationTab,
  ImportFileProgress,
} from '../types';
import { INITIAL_SONGS } from '../data/sampleSongs';
import {
  INITIAL_PLAYLISTS,
  INITIAL_TIME_CAPSULES,
  INITIAL_MEMORIES,
  INITIAL_BUCKET_LIST,
  INITIAL_BADGES,
  DEMO_LEADERBOARD,
} from '../data/sampleData';
import { audioEngine, PlayerStatus } from '../services/audioEngine';
import { calculateLevelFromXP, reorderArray } from '../utils/pureLogic';
import { saveAudioBlob, deleteAudioBlob, saveArtworkBlob, getStorageStats } from '../services/storageIndexedDB';
import { extractAudioFileMetadata } from '../utils/audioMetadataParser';
import {
  CollectionAnalysis,
  CleanupBackupRecord,
  analyzeCollection,
  performSafeCleanup,
} from '../utils/collectionCleaner';
import {
  DeletedBatchRecord,
  filterSongsAfterBulkDelete,
  prunePlaylistsAfterDeletion,
  findOrphanedArtworks,
  restoreDeletedBatch,
  isSongWithLocalAudio,
} from '../utils/bulkDelete';
import { getAudioBlob } from '../services/storageIndexedDB';

const STORAGE_KEY_PREFIX = 'melodyvault_v1_';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  action?: ToastAction;
  duration?: number;
}

interface StorageStats {
  usageMB: number;
  quotaMB: number;
  percent: number;
  songCount: number;
}

interface MusicContextType {
  // Navigation & UI
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toast: Toast | null;
  showToast: (
    message: string,
    type?: 'success' | 'info' | 'warning',
    action?: ToastAction,
    duration?: number
  ) => void;
  hideToast: () => void;

  // Music & Library
  songs: Song[];
  favorites: Song[];
  recentlyPlayed: Song[];
  addSong: (song: Omit<Song, 'id' | 'playCount' | 'lastPlayedAt' | 'isFavorite'>) => void;
  updateSong: (song: Song) => void;
  deleteSong: (songId: string) => void;
  toggleFavorite: (songId: string) => void;

  // Playlists
  playlists: Playlist[];
  createPlaylist: (name: string, description: string, coverGradient: string) => Playlist;
  updatePlaylist: (playlist: Playlist) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylistSongs: (playlistId: string, startIndex: number, endIndex: number) => void;

  // Player State
  currentSong: Song | null;
  isPlaying: boolean;
  playerStatus: PlayerStatus;
  statusMessage: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Song[];
  isInstrumentalMode: boolean;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;

  // Player Controls
  playSong: (song: Song, overrideQueue?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleInstrumentalMode: () => void;

  // Personal Vault Features
  timeCapsules: TimeCapsule[];
  createTimeCapsule: (title: string, message: string, unlockDate: string, songIds: string[]) => void;
  deleteTimeCapsule: (id: string) => void;

  memories: SongMemory[];
  addMemory: (memory: Omit<SongMemory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;

  bucketList: BucketListItem[];
  addBucketItem: (item: Omit<BucketListItem, 'id' | 'addedAt' | 'isListened'>) => void;
  toggleBucketListened: (id: string) => void;
  deleteBucketItem: (id: string) => void;
  migrateBucketToLibrary: (item: BucketListItem) => void;

  // Music Quest & Gamification
  xp: number;
  streakDays: number;
  badges: QuestBadge[];
  leaderboard: LeaderboardUser[];
  awardXP: (amount: number, reason: string) => void;

  // System Settings & Data Backup
  equalizerPreset: string;
  setEqualizerPreset: (preset: string) => void;
  audioQuality: string;
  setAudioQuality: (q: string) => void;
  crossfadeSecs: number;
  setCrossfadeSecs: (secs: number) => void;
  resetToDefaultData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;

  // Local File Import & IndexedDB Backup
  importAudioFiles: (files: File[]) => Promise<{ successCount: number; duplicateCount: number; errorCount: number }>;
  importTasks: ImportFileProgress[];
  isImporting: boolean;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  storageStats: StorageStats;
  refreshStorageStats: () => Promise<void>;

  // Personal Collection Cleanup & Migration
  collectionAnalysis: CollectionAnalysis;
  isCleanupModalOpen: boolean;
  setIsCleanupModalOpen: (open: boolean) => void;
  cleanupDemoMusic: () => { removedCount: number; preservedCount: number };
  restoreDemoMusic: () => boolean;
  cleanupBackup: CleanupBackupRecord | null;

  // Bulk Delete & Undo Management
  bulkDeleteSongs: (songIds: string[]) => Promise<{ success: boolean; deletedCount: number; importedCount: number }>;
  undoLastDelete: () => Promise<{ success: boolean; restoredCount: number }>;
  deletedBatchBackup: DeletedBatchRecord | null;
  clearDeletedBatchBackup: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn('Storage read warning', e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write warning', e);
  }
}

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Search
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Stored State (Clean personal defaults for fresh installations)
  const [songs, setSongs] = useState<Song[]>(() => loadFromStorage('songs', []));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadFromStorage('playlists', []));
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>(() => loadFromStorage('time_capsules', []));
  const [memories, setMemories] = useState<SongMemory[]>(() => loadFromStorage('memories', []));
  const [bucketList, setBucketList] = useState<BucketListItem[]>(() => loadFromStorage('bucket_list', []));
  const [xp, setXp] = useState<number>(() => loadFromStorage('xp', 0));
  const [streakDays, setStreakDays] = useState<number>(() => loadFromStorage('streak_days', 0));
  const [badges, setBadges] = useState<QuestBadge[]>(() => loadFromStorage('badges', INITIAL_BADGES));
  const [equalizerPreset, setEqualizerPreset] = useState<string>(() => loadFromStorage('eq_preset', 'Bass Boost'));
  const [audioQuality, setAudioQuality] = useState<string>(() => loadFromStorage('audio_quality', 'High (320 kbps)'));
  const [crossfadeSecs, setCrossfadeSecs] = useState<number>(() => loadFromStorage('crossfade', 2));

  // Personal Cleanup & Migration State
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupBackup, setCleanupBackup] = useState<CleanupBackupRecord | null>(() =>
    loadFromStorage<CleanupBackupRecord | null>('cleanup_backup', null)
  );

  // Bulk Delete & Undo Management State
  const [deletedBatchBackup, setDeletedBatchBackup] = useState<DeletedBatchRecord | null>(null);

  const collectionAnalysis = useMemo(() => analyzeCollection(songs, playlists), [songs, playlists]);

  // Audio Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Song[]>([]);
  const [isInstrumentalMode, setIsInstrumentalMode] = useState(false);

  // Local File Import State & IndexedDB Storage
  const [importTasks, setImportTasks] = useState<ImportFileProgress[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    usageMB: 0,
    quotaMB: 0,
    percent: 0,
    songCount: 0,
  });

  const refreshStorageStats = useCallback(async () => {
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.warn('Failed to retrieve storage statistics', err);
    }
  }, []);

  useEffect(() => {
    refreshStorageStats();
  }, [refreshStorageStats]);

  // Sync state to local storage
  useEffect(() => saveToStorage('songs', songs), [songs]);
  useEffect(() => saveToStorage('playlists', playlists), [playlists]);
  useEffect(() => saveToStorage('time_capsules', timeCapsules), [timeCapsules]);
  useEffect(() => saveToStorage('memories', memories), [memories]);
  useEffect(() => saveToStorage('bucket_list', bucketList), [bucketList]);
  useEffect(() => saveToStorage('xp', xp), [xp]);
  useEffect(() => saveToStorage('streak_days', streakDays), [streakDays]);
  useEffect(() => saveToStorage('badges', badges), [badges]);
  useEffect(() => saveToStorage('eq_preset', equalizerPreset), [equalizerPreset]);
  useEffect(() => saveToStorage('audio_quality', audioQuality), [audioQuality]);
  useEffect(() => saveToStorage('crossfade', crossfadeSecs), [crossfadeSecs]);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'info' | 'warning' = 'info',
      action?: ToastAction,
      duration?: number
    ) => {
      const id = Date.now().toString();
      setToast({ id, message, type, action, duration });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeoutMs = toast.duration || (toast.action ? 12000 : 3800);
    const t = setTimeout(() => {
      setToast(null);
    }, timeoutMs);
    return () => clearTimeout(t);
  }, [toast]);

  // Award XP helper
  const awardXP = useCallback(
    (amount: number, reason: string) => {
      setXp((prev) => {
        const nextXP = prev + amount;
        showToast(`+${amount} XP: ${reason}`, 'success');
        return nextXP;
      });
    },
    [showToast]
  );

  // Player Engine event hooks
  useEffect(() => {
    audioEngine.setListeners({
      onTimeUpdate: (cur, dur) => {
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      },
      onStatusChange: (status, errorMsg) => {
        setPlayerStatus(status);
        setIsPlaying(status === 'playing');
        if (errorMsg) {
          setStatusMessage(errorMsg);
        } else {
          setStatusMessage(null);
        }
      },
      onEnded: () => {
        handleTrackEnded();
      },
    });
  }, []);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && currentSong) {
      audioEngine.seek(0);
      audioEngine.playSong(currentSong);
      return;
    }
    playNext();
  }, [repeatMode, currentSong]);

  // Play next track
  const playNext = useCallback(() => {
    if (!currentSong) return;

    if (queue.length > 0) {
      const nextSong = queue[0];
      setQueue((q) => q.slice(1));
      playSong(nextSong);
      return;
    }

    // Default library loop
    const activeList = songs;
    if (activeList.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * activeList.length);
      playSong(activeList[randomIndex]);
      return;
    }

    const currentIndex = activeList.findIndex((s) => s.id === currentSong.id);
    if (currentIndex >= 0 && currentIndex < activeList.length - 1) {
      playSong(activeList[currentIndex + 1]);
    } else if (repeatMode === 'all') {
      playSong(activeList[0]);
    } else {
      audioEngine.pause();
      setIsPlaying(false);
    }
  }, [currentSong, queue, songs, isShuffle, repeatMode]);

  // Play previous track
  const playPrevious = useCallback(() => {
    if (!currentSong) return;
    if (currentTime > 4) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }

    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    if (currentIndex > 0) {
      playSong(songs[currentIndex - 1]);
    } else {
      playSong(songs[songs.length - 1]);
    }
  }, [currentSong, currentTime, songs]);

  // Play Song action
  const playSong = useCallback(
    (song: Song, overrideQueue?: Song[]) => {
      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(song.duration);

      if (overrideQueue) {
        setQueue(overrideQueue);
      }

      // Record play count and last played
      setSongs((prevSongs) =>
        prevSongs.map((s) =>
          s.id === song.id
            ? { ...s, playCount: (s.playCount || 0) + 1, lastPlayedAt: new Date().toISOString() }
            : s
        )
      );

      awardXP(5, `Listening to "${song.title}"`);
      audioEngine.playSong(song);
    },
    [awardXP]
  );

  const togglePlayPause = useCallback(() => {
    if (!currentSong) {
      if (songs.length > 0) {
        playSong(songs[0]);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.resume();
    }
  }, [currentSong, isPlaying, songs, playSong]);

  const seek = useCallback((seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    setIsMuted(vol === 0);
    audioEngine.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      showToast(next ? 'Shuffle Mode On' : 'Shuffle Mode Off', 'info');
      return next;
    });
  }, [showToast]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      let next: 'off' | 'all' | 'one' = 'off';
      if (prev === 'off') next = 'all';
      else if (prev === 'all') next = 'one';
      else next = 'off';
      showToast(`Repeat: ${next.toUpperCase()}`, 'info');
      return next;
    });
  }, [showToast]);

  const addToQueue = useCallback(
    (song: Song) => {
      setQueue((q) => [...q, song]);
      showToast(`Added "${song.title}" to Queue`, 'success');
    },
    [showToast]
  );

  const removeFromQueue = useCallback((index: number) => {
    setQueue((q) => q.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    showToast('Queue Cleared', 'info');
  }, [showToast]);

  const toggleInstrumentalMode = useCallback(() => {
    const isNowInst = audioEngine.toggleInstrumentalMode();
    setIsInstrumentalMode(isNowInst);
    showToast(isNowInst ? 'Vocal Suppressor / Instrumental Active' : 'Normal Audio Restored', 'info');
  }, [showToast]);

  // Song Favorites & Crud
  const toggleFavorite = useCallback(
    (songId: string) => {
      setSongs((prev) =>
        prev.map((s) => {
          if (s.id === songId) {
            const nextFav = !s.isFavorite;
            showToast(nextFav ? `Added "${s.title}" to Favourites` : `Removed "${s.title}" from Favourites`, 'info');
            return { ...s, isFavorite: nextFav };
          }
          return s;
        })
      );
    },
    [showToast]
  );

  const addSong = useCallback(
    (songData: Omit<Song, 'id' | 'playCount' | 'lastPlayedAt' | 'isFavorite'>) => {
      const newSong: Song = {
        ...songData,
        id: `song-${Date.now()}`,
        source: 'user_manual',
        playCount: 0,
        lastPlayedAt: null,
        isFavorite: false,
      };
      setSongs((prev) => [newSong, ...prev]);
      awardXP(25, `Cataloged new song "${newSong.title}"`);
      showToast(`Song "${newSong.title}" added to Library`, 'success');
    },
    [awardXP, showToast]
  );

  const updateSong = useCallback(
    (updatedSong: Song) => {
      setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
      if (currentSong?.id === updatedSong.id) {
        setCurrentSong(updatedSong);
      }
      showToast(`Song "${updatedSong.title}" updated`, 'success');
    },
    [currentSong, showToast]
  );

  // Bulk Delete and Undo System
  const undoLastDelete = useCallback(async (): Promise<{ success: boolean; restoredCount: number }> => {
    if (!deletedBatchBackup) {
      showToast('No deletion available to undo', 'warning');
      return { success: false, restoredCount: 0 };
    }

    try {
      // 1. Re-insert audio blobs into IndexedDB
      for (const item of deletedBatchBackup.audioBlobs) {
        await saveAudioBlob(item.songId, item.blob, item.filename).catch((err) => {
          console.warn('Error re-saving restored audio blob:', item.songId, err);
        });
      }

      // 2. Restore songs and playlist mappings
      const { restoredSongs, restoredPlaylists } = restoreDeletedBatch(songs, deletedBatchBackup);
      setSongs(restoredSongs);
      setPlaylists(restoredPlaylists);

      const count = deletedBatchBackup.deletedSongs.length;
      setDeletedBatchBackup(null);
      refreshStorageStats();

      showToast(`Restored ${count} song${count === 1 ? '' : 's'} to your vault!`, 'success');
      return { success: true, restoredCount: count };
    } catch (err) {
      console.error('Failed to undo deletion:', err);
      showToast('Failed to undo deletion', 'warning');
      return { success: false, restoredCount: 0 };
    }
  }, [deletedBatchBackup, songs, refreshStorageStats, showToast]);

  const clearDeletedBatchBackup = useCallback(() => {
    setDeletedBatchBackup(null);
  }, []);

  const bulkDeleteSongs = useCallback(
    async (songIds: string[]): Promise<{ success: boolean; deletedCount: number; importedCount: number }> => {
      if (songIds.length === 0) return { success: false, deletedCount: 0, importedCount: 0 };
      const selectedIdSet = new Set(songIds);
      const { remainingSongs, deletedSongs } = filterSongsAfterBulkDelete(songs, selectedIdSet);
      if (deletedSongs.length === 0) return { success: false, deletedCount: 0, importedCount: 0 };

      // 1. Snapshot playlists before deletion
      const playlistsSnapshot = playlists.map((p) => ({ ...p, songIds: [...p.songIds] }));

      // 2. Fetch and snapshot audio blobs for any imported songs before deleting from IndexedDB
      const importedAudioBackups: Array<{ songId: string; blob: Blob; filename: string }> = [];
      for (const song of deletedSongs) {
        if (isSongWithLocalAudio(song)) {
          try {
            const blob = await getAudioBlob(song.id);
            if (blob) {
              importedAudioBackups.push({
                songId: song.id,
                blob,
                filename: song.fileName || `${song.title}.mp3`,
              });
            }
          } catch (e) {
            console.warn('Failed to snapshot audio blob for undo:', song.id, e);
          }
        }
      }

      // 3. Create Undo Snapshot record
      const batchSnapshot: DeletedBatchRecord = {
        id: `batch-${Date.now()}`,
        deletedSongs,
        audioBlobs: importedAudioBackups,
        playlistsSnapshot,
        deletedAt: new Date().toISOString(),
      };
      setDeletedBatchBackup(batchSnapshot);

      // 4. Update Songs state
      setSongs(remainingSongs);

      // 5. Update Playlists state (prune deleted IDs)
      const nextPlaylists = prunePlaylistsAfterDeletion(playlists, selectedIdSet);
      setPlaylists(nextPlaylists);

      // 6. If currently playing song is deleted, stop playback and reset currentSong
      if (currentSong && selectedIdSet.has(currentSong.id)) {
        audioEngine.pause();
        setCurrentSong(null);
        setIsPlaying(false);
      }

      // 7. Remove deleted songs from Up Next Queue
      setQueue((q) => q.filter((s) => !selectedIdSet.has(s.id)));

      // 8. Delete associated IndexedDB audio blobs for the deleted imported songs
      for (const song of deletedSongs) {
        if (isSongWithLocalAudio(song)) {
          try {
            await deleteAudioBlob(song.id);
          } catch (e) {
            console.warn('Failed to delete audio blob:', song.id, e);
          }
        }
      }

      // 9. Clean up orphaned artworks
      const orphaned = findOrphanedArtworks(deletedSongs, remainingSongs);
      for (const artUrl of orphaned) {
        if (artUrl.startsWith('blob:')) {
          URL.revokeObjectURL(artUrl);
        }
      }

      // 10. Refresh storage stats
      refreshStorageStats();

      // 11. Show user notification with Undo action
      const importedCount = importedAudioBackups.length;
      const countMsg = `${deletedSongs.length} song${deletedSongs.length === 1 ? '' : 's'}`;
      const detailMsg = importedCount > 0 ? ` (${importedCount} local audio file${importedCount === 1 ? '' : 's'} removed)` : '';
      showToast(
        `Deleted ${countMsg}${detailMsg}`,
        'info',
        {
          label: 'Undo',
          onClick: () => {
            undoLastDelete();
          },
        },
        12000
      );

      return {
        success: true,
        deletedCount: deletedSongs.length,
        importedCount,
      };
    },
    [songs, playlists, currentSong, refreshStorageStats, showToast, undoLastDelete]
  );

  const deleteSong = useCallback(
    (songId: string) => {
      bulkDeleteSongs([songId]);
    },
    [bulkDeleteSongs]
  );

  // Playlist Management
  const createPlaylist = useCallback(
    (name: string, description: string, coverGradient: string): Playlist => {
      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        name: name.trim() || 'Untitled Playlist',
        description: description.trim() || 'Created in MelodyVault',
        coverGradient: coverGradient || 'from-purple-900 via-indigo-950 to-slate-900',
        songIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlaylists((prev) => [newPlaylist, ...prev]);
      awardXP(30, `Created playlist "${newPlaylist.name}"`);
      showToast(`Created Playlist "${newPlaylist.name}"`, 'success');
      return newPlaylist;
    },
    [awardXP, showToast]
  );

  const updatePlaylist = useCallback(
    (updatedPlaylist: Playlist) => {
      setPlaylists((prev) =>
        prev.map((p) => (p.id === updatedPlaylist.id ? { ...updatedPlaylist, updatedAt: new Date().toISOString() } : p))
      );
      showToast(`Playlist "${updatedPlaylist.name}" updated`, 'success');
    },
    [showToast]
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      const target = playlists.find((p) => p.id === id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
        setActiveTab('playlists');
      }
      showToast(`Deleted playlist "${target?.name || ''}"`, 'info');
    },
    [playlists, selectedPlaylistId, showToast]
  );

  const addSongToPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === playlistId) {
            if (p.songIds.includes(songId)) {
              showToast('Song is already in this playlist', 'warning');
              return p;
            }
            showToast(`Added song to "${p.name}"`, 'success');
            return {
              ...p,
              songIds: [...p.songIds, songId],
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        })
      );
    },
    [showToast]
  );

  const removeSongFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === playlistId) {
            showToast(`Removed track from "${p.name}"`, 'info');
            return {
              ...p,
              songIds: p.songIds.filter((id) => id !== songId),
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        })
      );
    },
    [showToast]
  );

  const reorderPlaylistSongs = useCallback((playlistId: string, startIndex: number, endIndex: number) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          const reordered = reorderArray(p.songIds, startIndex, endIndex);
          return {
            ...p,
            songIds: reordered,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  }, []);

  // Time Capsules
  const createTimeCapsule = useCallback(
    (title: string, message: string, unlockDate: string, songIds: string[]) => {
      const newCapsule: TimeCapsule = {
        id: `capsule-${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        unlockDate,
        songIds,
        isSealed: true,
        createdAt: new Date().toISOString(),
      };
      setTimeCapsules((prev) => [newCapsule, ...prev]);
      awardXP(50, `Sealed Time Capsule "${newCapsule.title}"`);
      showToast(`Time Capsule sealed until ${new Date(unlockDate).toLocaleDateString()}`, 'success');
    },
    [awardXP, showToast]
  );

  const deleteTimeCapsule = useCallback(
    (id: string) => {
      setTimeCapsules((prev) => prev.filter((c) => c.id !== id));
      showToast('Time Capsule removed', 'info');
    },
    [showToast]
  );

  // Memory Journal
  const addMemory = useCallback(
    (memoryData: Omit<SongMemory, 'id' | 'createdAt'>) => {
      const newMem: SongMemory = {
        ...memoryData,
        id: `mem-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setMemories((prev) => [newMem, ...prev]);
      awardXP(40, `Wrote memory for "${newMem.songTitle}"`);
      showToast(`Memory attached to "${newMem.songTitle}"`, 'success');
    },
    [awardXP, showToast]
  );

  const deleteMemory = useCallback(
    (id: string) => {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      showToast('Memory entry deleted', 'info');
    },
    [showToast]
  );

  // Bucket List
  const addBucketItem = useCallback(
    (itemData: Omit<BucketListItem, 'id' | 'addedAt' | 'isListened'>) => {
      const newItem: BucketListItem = {
        ...itemData,
        id: `bucket-${Date.now()}`,
        isListened: false,
        addedAt: new Date().toISOString(),
      };
      setBucketList((prev) => [newItem, ...prev]);
      awardXP(15, `Added "${newItem.title}" to Bucket List`);
      showToast(`"${newItem.title}" added to Music Bucket List`, 'success');
    },
    [awardXP, showToast]
  );

  const toggleBucketListened = useCallback(
    (id: string) => {
      setBucketList((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            const nextVal = !b.isListened;
            if (nextVal) {
              awardXP(35, `Explored bucket list track "${b.title}"`);
            }
            return { ...b, isListened: nextVal };
          }
          return b;
        })
      );
    },
    [awardXP]
  );

  const deleteBucketItem = useCallback(
    (id: string) => {
      setBucketList((prev) => prev.filter((b) => b.id !== id));
      showToast('Bucket list item removed', 'info');
    },
    [showToast]
  );

  const migrateBucketToLibrary = useCallback(
    (item: BucketListItem) => {
      const newSong: Song = {
        id: `song-${Date.now()}`,
        title: item.title,
        artist: item.artist,
        album: 'Discovered via Bucket List',
        genre: item.genre || 'Indie',
        language: 'English',
        duration: 210,
        artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
        audioAvailability: 'preview',
        year: new Date().getFullYear(),
        playCount: 1,
        lastPlayedAt: new Date().toISOString(),
        isFavorite: false,
        mood: 'Euphoric',
        lyrics: [{ time: 0, text: `[Discovered from Bucket List: ${item.notes || 'Curated recommendation'}]` }],
      };

      setSongs((prev) => [newSong, ...prev]);
      toggleBucketListened(item.id);
      awardXP(45, `Imported "${item.title}" into Music Library`);
      showToast(`Migrated "${item.title}" to Library`, 'success');
    },
    [awardXP, showToast, toggleBucketListened]
  );

  // Derived collections
  const favorites = useMemo(() => songs.filter((s) => s.isFavorite), [songs]);

  const recentlyPlayed = useMemo(
    () =>
      [...songs]
        .filter((s) => s.lastPlayedAt !== null)
        .sort((a, b) => new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime()),
    [songs]
  );

  // Dynamic leaderboard updating with current user's XP
  const leaderboard = useMemo(() => {
    const userLevel = calculateLevelFromXP(xp).level;
    const updated = DEMO_LEADERBOARD.map((u) => {
      if (u.isCurrentUser) {
        return { ...u, xp, level: userLevel };
      }
      return u;
    });
    return updated.sort((a, b) => b.xp - a.xp);
  }, [xp]);

  // Demo Cleanup & Migration Actions
  const cleanupDemoMusic = useCallback(() => {
    const { cleanedSongs, cleanedPlaylists, cleanedMemories, backupRecord } = performSafeCleanup(
      songs,
      playlists,
      memories
    );
    saveToStorage('cleanup_backup', backupRecord);
    setCleanupBackup(backupRecord);
    setSongs(cleanedSongs);
    setPlaylists(cleanedPlaylists);
    setMemories(cleanedMemories);
    showToast(
      `Removed ${backupRecord.removedDemoSongsCount} demo tracks. Preserved ${backupRecord.preservedPersonalSongsCount} personal tracks.`,
      'success'
    );
    return {
      removedCount: backupRecord.removedDemoSongsCount,
      preservedCount: backupRecord.preservedPersonalSongsCount,
    };
  }, [songs, playlists, memories, showToast]);

  const restoreDemoMusic = useCallback(() => {
    if (!cleanupBackup) return false;
    setSongs(cleanupBackup.previousSongs);
    setPlaylists(cleanupBackup.previousPlaylists);
    setMemories(cleanupBackup.previousMemories);
    showToast('Restored collection to state before cleanup', 'info');
    return true;
  }, [cleanupBackup, showToast]);

  // Data Reset & Backup
  const resetToDefaultData = useCallback(() => {
    setSongs([]);
    setPlaylists([]);
    setTimeCapsules([]);
    setMemories([]);
    setBucketList([]);
    setXp(0);
    setStreakDays(0);
    setBadges(INITIAL_BADGES.map((b) => ({ ...b, isUnlocked: false, progress: 0 })));
    showToast('Reset MelodyVault to a fresh, clean personal music vault', 'info');
  }, [showToast]);

  const exportDataJSON = useCallback((): string => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      songs,
      playlists,
      timeCapsules,
      memories,
      bucketList,
      xp,
      streakDays,
    };
    return JSON.stringify(backup, null, 2);
  }, [songs, playlists, timeCapsules, memories, bucketList, xp, streakDays]);

  const importDataJSON = useCallback(
    (jsonStr: string): boolean => {
      try {
        const data = JSON.parse(jsonStr);
        if (data.songs && Array.isArray(data.songs)) setSongs(data.songs);
        if (data.playlists && Array.isArray(data.playlists)) setPlaylists(data.playlists);
        if (data.timeCapsules && Array.isArray(data.timeCapsules)) setTimeCapsules(data.timeCapsules);
        if (data.memories && Array.isArray(data.memories)) setMemories(data.memories);
        if (data.bucketList && Array.isArray(data.bucketList)) setBucketList(data.bucketList);
        if (typeof data.xp === 'number') setXp(data.xp);
        if (typeof data.streakDays === 'number') setStreakDays(data.streakDays);
        showToast('Successfully imported database backup!', 'success');
        return true;
      } catch (err) {
        showToast('Failed to parse backup JSON file', 'warning');
        return false;
      }
    },
    [showToast]
  );

  const importAudioFiles = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) {
        return { successCount: 0, duplicateCount: 0, errorCount: 0 };
      }

      setIsImporting(true);
      const initialTasks: ImportFileProgress[] = files.map((file) => ({
        file,
        fileName: file.name,
        fileSize: file.size,
        status: 'pending',
        progress: 0,
      }));
      setImportTasks(initialTasks);

      let successCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;
      const newSongsToAdd: Song[] = [];

      const updateTask = (index: number, patch: Partial<ImportFileProgress>) => {
        setImportTasks((prev) => {
          const next = [...prev];
          if (next[index]) {
            next[index] = { ...next[index], ...patch };
          }
          return next;
        });
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        updateTask(i, { status: 'parsing', progress: 20 });

        const lowerName = file.name.toLowerCase();
        const isValidExt = lowerName.endsWith('.mp3') || lowerName.endsWith('.wav');
        const isValidMime =
          file.type === 'audio/mpeg' ||
          file.type === 'audio/mp3' ||
          file.type === 'audio/wav' ||
          file.type === 'audio/wave' ||
          file.type === 'audio/x-wav' ||
          file.type === '';

        if (!isValidExt && !isValidMime) {
          updateTask(i, {
            status: 'error',
            error: 'Unsupported audio format. Only MP3 and WAV files are supported.',
            progress: 100,
          });
          errorCount++;
          continue;
        }

        // Duplicate check against existing library
        const isDuplicate = songs.some(
          (s) =>
            (s.fileName && s.fileName.toLowerCase() === file.name.toLowerCase() && s.fileSize === file.size) ||
            (s.fileName && s.fileName.toLowerCase() === file.name.toLowerCase()) ||
            (s.title.toLowerCase() === file.name.replace(/\.[^/.]+$/, '').toLowerCase())
        );

        if (isDuplicate) {
          updateTask(i, {
            status: 'duplicate',
            error: 'Track already exists in your library.',
            progress: 100,
          });
          duplicateCount++;
          continue;
        }

        try {
          updateTask(i, { status: 'parsing', progress: 45 });
          const metadata = await extractAudioFileMetadata(file);

          updateTask(i, { status: 'saving', progress: 75 });
          const songId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

          // Save audio binary blob in IndexedDB
          await saveAudioBlob(songId, file, file.name);

          // Save artwork blob in IndexedDB if present
          let artworkUrl = metadata.artworkDataUrl;
          if (metadata.artworkBlob) {
            try {
              await saveArtworkBlob(songId, metadata.artworkBlob);
            } catch (artErr) {
              console.warn('Could not save artwork blob to IndexedDB', artErr);
            }
          }

          const newSong: Song = {
            id: songId,
            source: 'user_import',
            title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: metadata.artist || 'Unknown Artist',
            album: metadata.album || 'Local Imports',
            genre: metadata.genre || 'Local Audio',
            language: 'Instrumental / Local',
            duration: metadata.duration || 180,
            artwork:
              artworkUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
            audioUrl: '',
            audioAvailability: 'local_file',
            isLocalImport: true,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || (lowerName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg'),
            mood: 'Deep Focus',
            year: metadata.year || new Date().getFullYear(),
            playCount: 0,
            lastPlayedAt: null,
            isFavorite: false,
            lyrics: [
              { time: 0, text: metadata.title || file.name },
              { time: 4, text: 'Local imported audio track' },
              { time: 12, text: 'High-fidelity sound playing from your local device storage' },
            ],
          };

          newSongsToAdd.push(newSong);
          updateTask(i, { status: 'success', progress: 100 });
          successCount++;
        } catch (err: any) {
          console.error('Failed to import file', file.name, err);
          updateTask(i, {
            status: 'error',
            error: err?.message || 'Failed to process file',
            progress: 100,
          });
          errorCount++;
        }
      }

      if (newSongsToAdd.length > 0) {
        setSongs((prev) => [...newSongsToAdd, ...prev]);
        const earnedXP = newSongsToAdd.length * 35;
        awardXP(earnedXP, `Imported ${newSongsToAdd.length} local audio track${newSongsToAdd.length > 1 ? 's' : ''}`);
        showToast(
          `Successfully imported ${newSongsToAdd.length} track${newSongsToAdd.length > 1 ? 's' : ''}!`,
          'success'
        );
        await refreshStorageStats();
      }

      setIsImporting(false);
      return { successCount, duplicateCount, errorCount };
    },
    [songs, awardXP, showToast, refreshStorageStats]
  );

  return (
    <MusicContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedPlaylistId,
        setSelectedPlaylistId,
        searchQuery,
        setSearchQuery,
        toast,
        showToast,
        hideToast,
        songs,
        favorites,
        recentlyPlayed,
        addSong,
        updateSong,
        deleteSong,
        toggleFavorite,
        playlists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        reorderPlaylistSongs,
        currentSong,
        isPlaying,
        playerStatus,
        statusMessage,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        isInstrumentalMode,
        isQueueOpen,
        setIsQueueOpen,
        playSong,
        togglePlayPause,
        playNext,
        playPrevious,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleInstrumentalMode,
        timeCapsules,
        createTimeCapsule,
        deleteTimeCapsule,
        memories,
        addMemory,
        deleteMemory,
        bucketList,
        addBucketItem,
        toggleBucketListened,
        deleteBucketItem,
        migrateBucketToLibrary,
        xp,
        streakDays,
        badges,
        leaderboard,
        awardXP,
        equalizerPreset,
        setEqualizerPreset,
        audioQuality,
        setAudioQuality,
        crossfadeSecs,
        setCrossfadeSecs,
        resetToDefaultData,
        exportDataJSON,
        importDataJSON,
        importAudioFiles,
        importTasks,
        isImporting,
        isImportModalOpen,
        setIsImportModalOpen,
        isBackupModalOpen,
        setIsBackupModalOpen,
        storageStats,
        refreshStorageStats,
        collectionAnalysis,
        isCleanupModalOpen,
        setIsCleanupModalOpen,
        cleanupDemoMusic,
        restoreDemoMusic,
        cleanupBackup,
        bulkDeleteSongs,
        undoLastDelete,
        deletedBatchBackup,
        clearDeletedBatchBackup,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
