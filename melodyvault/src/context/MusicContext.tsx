import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  UserProfile,
} from '../types';
import {
  INITIAL_BADGES,
  CURRENT_USER_PROFILE,
  PUBLIC_CATALOGUE_FALLBACK_TRACKS,
} from '../data/sampleData';
import { apiService } from '../services/apiService';
import { questService, DynamicQuest, QuestHistoryRecord } from '../services/questService';
import { xpService } from '../services/xpService';
import { audioEngine, PlayerStatus } from '../services/audioEngine';
import {
  calculateLevelFromXP,
  reorderArray,
  isPlayableSong,
  validateSongPlayability,
  getNextPlayableTrack,
  getPreviousPlayableTrack,
} from '../utils/pureLogic';
import {
  saveAudioBlob,
  deleteAudioBlob,
  saveArtworkBlob,
  getStorageStats,
  getAudioBlob,
  hasSeparatedAudio,
} from '../services/storageIndexedDB';
import { extractAudioFileMetadata } from '../utils/audioMetadataParser';
import {
  CollectionAnalysis,
  CleanupBackupRecord,
  analyzeCollection,
  performSafeCleanup,
} from '../utils/collectionCleaner';
import { importSampleMusicCollection } from '../services/localCollectionImporter';
import {
  DeletedBatchRecord,
  filterSongsAfterBulkDelete,
  prunePlaylistsAfterDeletion,
  findOrphanedArtworks,
  restoreDeletedBatch,
  isSongWithLocalAudio,
} from '../utils/bulkDelete';

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
  audioSource: 'original' | 'instrumental';
  hasInstrumental: boolean;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isExpandedPlayerOpen: boolean;
  setIsExpandedPlayerOpen: (open: boolean) => void;
  isSeparationModalOpen: boolean;
  setIsSeparationModalOpen: (open: boolean) => void;
  selectedSongForSeparation: Song | null;
  setSelectedSongForSeparation: (song: Song | null) => void;

  // Player Controls
  playSong: (song: Song, overrideQueue?: Song[], preferredSource?: 'original' | 'instrumental') => Promise<boolean>;
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
  setAudioSource: (source: 'original' | 'instrumental') => Promise<boolean>;
  toggleAudioSource: () => Promise<boolean>;
  openSeparationModal: (song?: Song) => void;
  refreshSeparationStatus: (songId?: string) => Promise<boolean>;

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

  // Music Quest, Dynamic Quests & Centralized XP
  xp: number;
  streakDays: number;
  badges: QuestBadge[];
  userProfile: UserProfile;
  activeQuests: DynamicQuest[];
  questHistory: QuestHistoryRecord[];
  claimQuestReward: (questId: string) => { success: boolean; xpAwarded: number; reason?: string };
  dailyListeningXPToday: number;
  dailyListeningXPCap: number;
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

  // Java 25 & Spring Boot REST API Status & Public Catalogue
  backendStatus: {
    isOnline: boolean;
    checked: boolean;
    profile: string;
    port: number;
  };
  refreshBackendStatus: () => Promise<void>;
  catalogueTracks: Song[];
  syncLocalSampleMusic: (isSilent?: boolean) => Promise<void>;
  vaultSyncState: {
    status: 'idle' | 'scanning' | 'synced' | 'offline' | 'error';
    message: string;
    trackCount: number;
  };
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  logoutCreator: () => Promise<void>;
  logoutAllCreatorDevices: () => Promise<void>;
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

const UNWANTED_CATALOGUE_TITLES = [
  'canon in d major',
  'clair de lune',
  'gymnopédie no. 1',
  'gymnopedie no. 1',
  'prelude in c major (bwv 846)',
  'prelude in c major',
  'the four seasons: spring (allegro)',
  'the four seasons: spring',
  'moonlight sonata (adagio sostenuto)',
  'moonlight sonata',
];
const UNWANTED_CATALOGUE_IDS = ['cat-track-1', 'cat-track-2', 'cat-track-3', 'cat-track-4', 'cat-track-5', 'cat-track-6'];

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Search
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isExpandedPlayerOpen, setIsExpandedPlayerOpen] = useState(false);

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


  // Java Backend Telemetry State
  const [backendStatus, setBackendStatus] = useState<{
    isOnline: boolean;
    checked: boolean;
    profile: string;
    port: number;
  }>({
    isOnline: false,
    checked: false,
    profile: 'dev',
    port: 8085,
  });

  const [catalogueTracks, setCatalogueTracks] = useState<Song[]>(() => PUBLIC_CATALOGUE_FALLBACK_TRACKS);
  const catalogueTracksRef = useRef(catalogueTracks);
  useEffect(() => {
    catalogueTracksRef.current = catalogueTracks;
  }, [catalogueTracks]);

  // Stored State (Clean personal defaults + authorized public catalogue tracks)
  const [songs, setSongs] = useState<Song[]>(() => {
    const rawSongs = loadFromStorage<Song[]>('songs', []);
    const personalSongs = rawSongs
      .filter((s) => {
        if (s.source === 'public_catalogue') return false;
        if (UNWANTED_CATALOGUE_IDS.includes(s.id)) return false;
        const lowTitle = (s.title || '').trim().toLowerCase();
        if (UNWANTED_CATALOGUE_TITLES.some((u) => lowTitle === u || lowTitle.includes(u))) return false;
        return true;
      })
      .map((s) => {
        // Normalize imported tracks so source, isLocalImport, and audioAvailability are consistent
        if (s.isLocalImport || s.audioAvailability === 'local_file' || s.source === 'user_import' || (typeof s.id === 'string' && s.id.startsWith('local-'))) {
          return {
            ...s,
            source: 'user_import' as const,
            isLocalImport: true,
            audioAvailability: 'local_file' as const,
          };
        }
        return {
          ...s,
          source: 'user_manual' as const,
          isLocalImport: false,
          audioAvailability: 'metadata_only' as const,
        };
      });
    return [...PUBLIC_CATALOGUE_FALLBACK_TRACKS, ...personalSongs];
  });
  const songsRef = useRef(songs);
  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const loaded = loadFromStorage<Playlist[]>('playlists', []);
    return loaded.map((pl) => ({
      ...pl,
      songIds: (pl.songIds || []).filter((sid) => !UNWANTED_CATALOGUE_IDS.includes(sid)),
    }));
  });
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>(() => loadFromStorage('time_capsules', []));
  const [memories, setMemories] = useState<SongMemory[]>(() => loadFromStorage('memories', []));
  const [bucketList, setBucketList] = useState<BucketListItem[]>(() => loadFromStorage('bucket_list', []));
  const [xp, setXp] = useState<number>(() => {
    const stored = loadFromStorage('xp', 0);
    xpService.migrateExistingXP(stored);
    return xpService.getTotalXP();
  });
  const [streakDays, setStreakDays] = useState<number>(() => loadFromStorage('streak_days', 0));
  const [badges, setBadges] = useState<QuestBadge[]>(() => loadFromStorage('badges', INITIAL_BADGES));
  const [equalizerPreset, setEqualizerPreset] = useState<string>(() => loadFromStorage('eq_preset', 'Bass Boost'));
  const [audioQuality, setAudioQuality] = useState<string>(() => loadFromStorage('audio_quality', 'High (320 kbps)'));
  const [crossfadeSecs, setCrossfadeSecs] = useState<number>(() => loadFromStorage('crossfade', 2));

  // Dynamic Quests & Centralized Anti-Farming XP State
  const [activeQuests, setActiveQuests] = useState<DynamicQuest[]>(() =>
    questService.syncQuests(loadFromStorage<Song[]>('songs', []))
  );
  const [questHistory, setQuestHistory] = useState<QuestHistoryRecord[]>(() =>
    questService.getHistory()
  );
  const [dailyListeningXPToday, setDailyListeningXPToday] = useState<number>(() =>
    xpService.getListeningXPToday()
  );
  const dailyListeningXPCap = 150;

  // Vocal Separation & Stem Playback State
  const [audioSource, setAudioSourceState] = useState<'original' | 'instrumental'>('original');
  const [hasInstrumental, setHasInstrumental] = useState<boolean>(false);
  const [isSeparationModalOpen, setIsSeparationModalOpen] = useState(false);
  const [selectedSongForSeparation, setSelectedSongForSeparation] = useState<Song | null>(null);

  // User Profile & First-Time Onboarding State
  const [rawProfile, setRawProfile] = useState<UserProfile>(() =>
    loadFromStorage<UserProfile>('current_user', CURRENT_USER_PROFILE)
  );
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_KEY_PREFIX + 'current_user');
  });

  const userProfile: UserProfile = useMemo(() => {
    const { level } = calculateLevelFromXP(xp);
    return {
      ...rawProfile,
      xp,
      level,
      badgesCount: badges.filter((b) => b.isUnlocked).length,
    };
  }, [rawProfile, xp, badges]);

  const updateUserProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      setRawProfile((prev) => {
        const next = { ...prev, ...updates };
        saveToStorage('current_user', next);
        return next;
      });

      if (backendStatus.isOnline) {
        try {
          await apiService.saveUserProfile({
            id: updates.id || rawProfile.id,
            displayName: updates.name || rawProfile.name,
            avatarUrl: updates.avatar || rawProfile.avatar,
            bio: updates.bio || rawProfile.bio,
            totalXp: xp,
            level: calculateLevelFromXP(xp).level,
            streakDays,
            badgesCount: badges.filter((b) => b.isUnlocked).length,
            joinedLeaderboard: updates.joinedLeaderboard ?? rawProfile.joinedLeaderboard ?? true,
          });
        } catch (err) {
          console.warn('Failed to sync profile update to backend', err);
        }
      }
    },
    [backendStatus.isOnline, rawProfile, xp, streakDays, badges]
  );

  const completeOnboarding = useCallback(
    async (profile: UserProfile) => {
      setRawProfile(profile);
      saveToStorage('current_user', profile);
      setIsOnboardingOpen(false);

      if (backendStatus.isOnline) {
        try {
          await apiService.saveUserProfile({
            id: profile.id,
            displayName: profile.name,
            avatarUrl: profile.avatar,
            bio: profile.bio,
            totalXp: xp,
            level: calculateLevelFromXP(xp).level,
            streakDays,
            badgesCount: badges.filter((b) => b.isUnlocked).length,
            joinedLeaderboard: profile.joinedLeaderboard ?? true,
          });

          if (profile.joinedLeaderboard) {
            await apiService.syncLeaderboard({
              userId: profile.id,
              displayName: profile.name,
              avatarUrl: profile.avatar,
              totalXp: xp,
              level: calculateLevelFromXP(xp).level,
              tierTitle: calculateLevelFromXP(xp).currentTierTitle,
            });
          }
        } catch (err) {
          console.warn('Failed to send onboarding profile to backend', err);
        }
      }
      showToast(`Welcome to MelodyVault, ${profile.name}!`, 'success');
    },
    [backendStatus.isOnline, xp, streakDays, badges, showToast]
  );

  // Auto-restore verified Creator session on app mount if persistent cookie/token exists
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await apiService.checkCreatorSession();
        if (session.authenticated && session.userId === 'user-navneeth') {
          setRawProfile((prev) => {
            if (prev.id !== 'user-navneeth') {
              const creatorProfile: UserProfile = {
                id: 'user-navneeth',
                name: 'Navneeth.U',
                handle: '@navneeth',
                avatar: '/avatars/navneeth_u.jpg',
                tag: 'Vault Creator & Lead Architect',
                bio: 'Curating pristine personal music collections with lossless audio in MelodyVault.',
                joinedLeaderboard: true,
              };
              saveToStorage('current_user', creatorProfile);
              return creatorProfile;
            }
            return prev;
          });
        }
      } catch {
        // Backend offline or unconfigured
      }
    };
    restoreSession();
  }, []);

  const logoutCreator = useCallback(async () => {
    await apiService.logoutCreator();
    const guestProfile: UserProfile = {
      id: `user-guest-${Date.now().toString(36)}`,
      name: 'Guest Listener',
      handle: '@guest',
      avatar: '/avatars/preset-aurora.jpg',
      tag: 'Music Explorer',
      bio: 'Exploring melodies on MelodyVault.',
      joinedLeaderboard: false,
    };
    setRawProfile(guestProfile);
    saveToStorage('current_user', guestProfile);
    showToast('Signed out from Creator profile.', 'info');
  }, [showToast]);

  const logoutAllCreatorDevices = useCallback(async () => {
    await apiService.logoutAllCreatorDevices();
    const guestProfile: UserProfile = {
      id: `user-guest-${Date.now().toString(36)}`,
      name: 'Guest Listener',
      handle: '@guest',
      avatar: '/avatars/preset-aurora.jpg',
      tag: 'Music Explorer',
      bio: 'Exploring melodies on MelodyVault.',
      joinedLeaderboard: false,
    };
    setRawProfile(guestProfile);
    saveToStorage('current_user', guestProfile);
    showToast('Signed out of Creator profile across all devices.', 'info');
  }, [showToast]);

  // Sync quests when collection changes
  useEffect(() => {
    const updated = questService.syncQuests(songs);
    setActiveQuests(updated);
  }, [songs]);

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

  const [vaultSyncState, setVaultSyncState] = useState<{
    status: 'idle' | 'scanning' | 'synced' | 'offline' | 'error';
    message: string;
    trackCount: number;
  }>({
    status: 'idle',
    message: 'Connecting to vault...',
    trackCount: 0,
  });

  const autoScanExecutedRef = useRef(false);

  const syncLocalSampleMusic = useCallback(
    async (isSilent = false) => {
      try {
        setVaultSyncState({
          status: 'scanning',
          message: 'Scanning C:\\MelodyVault Sample Music for personal audio tracks...',
          trackCount: 0,
        });
        setIsImporting(true);

        const res = await importSampleMusicCollection((msg) => {
          if (!isSilent) {
            showToast(msg, 'info', undefined, 1200);
          }
        });

        if (res.songs.length > 0) {
          setSongs((prev) => {
            const userOnly = prev.filter((s) => s.source !== 'public_catalogue');
            const merged = [...userOnly];
            for (const s of res.songs) {
              const existingIdx = merged.findIndex(
                (m) =>
                  m.id === s.id ||
                  (m.title.toLowerCase() === s.title.toLowerCase() &&
                    m.artist.toLowerCase() === s.artist.toLowerCase())
              );
              if (existingIdx >= 0) {
                merged[existingIdx] = {
                  ...s,
                  playCount: merged[existingIdx].playCount || 0,
                  isFavorite: merged[existingIdx].isFavorite || false,
                  lastPlayedAt: merged[existingIdx].lastPlayedAt || null,
                  lyrics: merged[existingIdx].lyrics?.length ? merged[existingIdx].lyrics : s.lyrics,
                  artwork: s.artwork || merged[existingIdx].artwork,
                };
              } else {
                merged.push(s);
              }
            }
            saveToStorage('songs', merged);
            return [...catalogueTracksRef.current, ...merged];
          });

          await refreshStorageStats();

          setVaultSyncState({
            status: 'synced',
            message: `${res.songs.length} tracks synchronized`,
            trackCount: res.songs.length,
          });

          if (!isSilent) {
            if (res.importedCount > 0) {
              showToast(
                `Synchronized ${res.importedCount} new local tracks from C:\\MelodyVault Sample Music!`,
                'success'
              );
            } else {
              showToast(`All ${res.songs.length} local tracks are synchronized and ready.`, 'info');
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync sample music:', err);
        setVaultSyncState({
          status: 'error',
          message: 'Could not scan local music folder',
          trackCount: 0,
        });
        if (!isSilent) {
          showToast(
            'Could not scan C:\\MelodyVault Sample Music. Make sure Java backend is running.',
            'warning'
          );
        }
      } finally {
        setIsImporting(false);
      }
    },
    [refreshStorageStats, showToast]
  );

  const refreshBackendStatus = useCallback(async () => {
    try {
      const isOnline = await apiService.checkHealth();
      setBackendStatus({
        isOnline,
        checked: true,
        profile: 'dev',
        port: 8085,
      });

      if (isOnline) {
        const remoteCatalogue = await apiService.getCatalogueTracks();
        const cleanCatalogue = (remoteCatalogue || []).filter((t) => {
          if (UNWANTED_CATALOGUE_IDS.includes(t.id)) return false;
          const lowTitle = (t.title || '').trim().toLowerCase();
          return !UNWANTED_CATALOGUE_TITLES.some((u) => lowTitle === u || lowTitle.includes(u));
        });

        const mapped: Song[] = cleanCatalogue.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          genre: t.genre,
          language: t.language,
          duration: t.duration,
          artwork: t.artworkUrl,
          audioUrl: t.audioUrl,
          streamUrl: t.audioUrl,
          audioAvailability: 'stream' as const,
          source: 'public_catalogue' as const,
          isPublicCatalogue: true,
          isLocalImport: false,
          year: t.releaseYear,
          playCount: t.playCount || 0,
          lastPlayedAt: null,
          isFavorite: false,
          mood: (t.genre === 'Ambient' ? 'Chill Lo-Fi' : t.genre === 'Baroque' ? 'Romantic' : 'Deep Focus') as any,
          licence: t.licenceType,
          attribution: t.attribution,
          lyrics: t.lyrics
            ? t.lyrics.split('\n').map((line, idx) => {
                const m = line.match(/\[(\d+):(\d+)\]\s*(.*)/);
                if (m) {
                  const s = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
                  return { time: s, text: m[3] };
                }
                return { time: idx * 30, text: line };
              })
            : [],
        }));
        setCatalogueTracks(mapped);
        setSongs((prev) => {
          const userOnly = prev.filter((s) => {
            if (s.source === 'public_catalogue') return false;
            if (UNWANTED_CATALOGUE_IDS.includes(s.id)) return false;
            const lowTitle = (s.title || '').trim().toLowerCase();
            return !UNWANTED_CATALOGUE_TITLES.some((u) => lowTitle === u || lowTitle.includes(u));
          });
          return [...mapped, ...userOnly];
        });

        // Auto-scan personal music vault on backend startup once
        if (!autoScanExecutedRef.current) {
          autoScanExecutedRef.current = true;
          syncLocalSampleMusic(true);
        }
      } else {
        setVaultSyncState({
          status: 'offline',
          message: 'Offline (Local cache)',
          trackCount: songsRef.current.filter((s) => s.isLocalImport).length,
        });
      }
    } catch (err) {
      console.warn('Backend sync warning', err);
      setVaultSyncState({
        status: 'offline',
        message: 'Offline (Local cache)',
        trackCount: songsRef.current.filter((s) => s.isLocalImport).length,
      });
    }
  }, [syncLocalSampleMusic]);

  useEffect(() => {
    refreshBackendStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state to local storage (only personal songs are stored; public catalogue is fetched dynamically)
  useEffect(() => saveToStorage('songs', songs.filter((s) => s.source !== 'public_catalogue')), [songs]);
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


  const handleTrackEndedRef = useRef<() => void>(() => {});
  const currentSongRef = useRef<Song | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  // Player Engine event hooks
  useEffect(() => {
    audioEngine.setListeners({
      onTimeUpdate: (cur, dur) => {
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);

        const activeTrack = currentSongRef.current;
        if (activeTrack && isPlayableSong(activeTrack)) {
          // Anti-farming check (continuous 80% listening)
          const xpRes = xpService.updateListeningProgress(
            activeTrack.id,
            cur,
            dur > 0 ? dur : activeTrack.duration,
            activeTrack.title
          );
          if (xpRes.awarded) {
            setXp(xpService.getTotalXP());
            setDailyListeningXPToday(xpService.getListeningXPToday());
            showToast(`+${xpRes.amount} XP: First complete listen of "${activeTrack.title}"!`, 'success');
            // Log to Java backend XP ledger
            apiService.claimReward(
              `first-listen-${activeTrack.id}-${Date.now()}`,
              'FIRST_LISTEN',
              `First complete listen of "${activeTrack.title}"`,
              xpRes.amount,
              activeTrack.id,
              activeTrack.title
            ).catch(() => {});
          }

          // Listening minutes for quests (immune to skip/seek)
          const last = lastTimeUpdateRef.current;
          if (cur > last && cur - last <= 2.5) {
            const deltaMin = (cur - last) / 60;
            questService.addListeningMinutes(deltaMin);
            setActiveQuests(questService.getActiveQuests());
          }
          lastTimeUpdateRef.current = cur;
        }
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
        const endedTrack = currentSongRef.current;
        if (endedTrack) {
          apiService.recordListenStat(
            endedTrack.id,
            endedTrack.title,
            endedTrack.artist,
            endedTrack.genre,
            endedTrack.duration,
            true
          ).catch(() => {});
        }
        handleTrackEndedRef.current();
      },
      onAudioSourceChange: (source) => {
        setAudioSourceState(source);
      },
    });
  }, [showToast]);

  // Play Song action with central playability & IndexedDB verification
  const playSong = useCallback(
    async (song: Song, overrideQueue?: Song[], preferredSource?: 'original' | 'instrumental'): Promise<boolean> => {
      // 1. Central validation check
      const validation = validateSongPlayability(song);
      if (!validation.canPlay || !isPlayableSong(song)) {
        showToast(validation.message, 'warning');
        return false;
      }

      // 2. Validate audio blob exists in browser IndexedDB for local user imports
      if (song.source === 'user_import') {
        try {
          const blob = await getAudioBlob(song.id);
          if (!blob || blob.size === 0) {
            showToast(
              `Local audio file for "${song.title}" is missing from browser storage (IndexedDB). Please re-import this track.`,
              'warning'
            );
            audioEngine.reportAudioMissing(song.id);
            return false;
          }
        } catch (err) {
          showToast(
            `Failed to check local storage for "${song.title}". Please try again.`,
            'warning'
          );
          return false;
        }
      }

      // 3. Audio source is verified! Set active track
      setCurrentSong(song);
      currentSongRef.current = song;
      setCurrentTime(0);
      lastTimeUpdateRef.current = 0;
      setDuration(song.duration);

      // Check instrumental stem availability (local imports only)
      const hasInst = song.source === 'user_import' ? await hasSeparatedAudio(song.id) : false;
      setHasInstrumental(hasInst);

      // 4. Override queue with strictly playable tracks only
      if (overrideQueue) {
        const filteredQueue = overrideQueue.filter(isPlayableSong);
        setQueue(filteredQueue);
      }

      // 5. Record play count and last played
      setSongs((prevSongs) =>
        prevSongs.map((s) =>
          s.id === song.id
            ? { ...s, playCount: (s.playCount || 0) + 1, lastPlayedAt: new Date().toISOString() }
            : s
        )
      );

      // 6. Anti-farming listening session start & Quest tracking
      xpService.startListeningSession(song.id, song.duration, true);
      questService.recordSongListen(song);
      setActiveQuests(questService.getActiveQuests());

      // 7. Telemetry log for public catalogue stream
      if (song.source === 'public_catalogue') {
        apiService.logCataloguePlay(song.id).catch(() => {});
      }

      const targetSrc = preferredSource || (hasInst && audioSource === 'instrumental' ? 'instrumental' : 'original');
      const startRes = await audioEngine.playSong(song, 0, targetSrc);
      setAudioSourceState(targetSrc);
      return startRes;
    },
    [audioSource, showToast]
  );

  // Play next track (strictly playable imported tracks only)
  const playNext = useCallback(() => {
    if (!currentSong) return;

    // 1. Check queue for next playable song
    if (queue.length > 0) {
      const nextPlayableIndex = queue.findIndex(isPlayableSong);
      if (nextPlayableIndex >= 0) {
        const nextSong = queue[nextPlayableIndex];
        setQueue((q) => q.slice(nextPlayableIndex + 1));
        playSong(nextSong);
        return;
      } else {
        setQueue([]);
      }
    }

    // 2. Default library loop: only playable imported tracks
    const playableSongs = songs.filter(isPlayableSong);
    if (playableSongs.length === 0) {
      audioEngine.pause();
      setIsPlaying(false);
      return;
    }

    const nextSong = getNextPlayableTrack({
      songs: playableSongs,
      currentSongId: currentSong.id,
      isShuffle,
      repeatMode,
    });

    if (nextSong) {
      playSong(nextSong);
    } else {
      audioEngine.pause();
      setIsPlaying(false);
    }
  }, [currentSong, queue, songs, isShuffle, repeatMode, playSong]);

  // Play previous track (strictly playable imported tracks only)
  const playPrevious = useCallback(() => {
    if (!currentSong) return;
    if (currentTime > 4) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }

    const playableSongs = songs.filter(isPlayableSong);
    if (playableSongs.length === 0) return;

    const prevSong = getPreviousPlayableTrack({
      songs: playableSongs,
      currentSongId: currentSong.id,
    });

    if (prevSong) {
      playSong(prevSong);
    }
  }, [currentSong, currentTime, songs, playSong]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && currentSong && isPlayableSong(currentSong)) {
      audioEngine.seek(0);
      audioEngine.playSong(currentSong);
      return;
    }
    playNext();
  }, [repeatMode, currentSong, playNext]);

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) {
      const firstPlayable = songs.find(isPlayableSong);
      if (firstPlayable) {
        playSong(firstPlayable);
      } else {
        showToast(
          'No playable imported tracks found in your vault. Import MP3 or WAV files to start listening.',
          'info'
        );
      }
      return;
    }

    if (!isPlayableSong(currentSong)) {
      showToast('Current track is not an imported audio file and cannot be played.', 'warning');
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.resume();
    }
  }, [currentSong, isPlaying, songs, playSong, showToast]);

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
      if (!isPlayableSong(song)) {
        showToast(
          `Cannot add "${song.title}" to queue: Only imported MP3/WAV tracks can be played`,
          'warning'
        );
        return;
      }
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
        isLocalImport: false,
        audioAvailability: 'metadata_only',
        playCount: 0,
        lastPlayedAt: null,
        isFavorite: false,
      };
      setSongs((prev) => [newSong, ...prev]);
      awardXP(25, `Cataloged new song "${newSong.title}"`);
      showToast(`Song "${newSong.title}" cataloged in Library (Metadata only)`, 'success');
    },
    [awardXP, showToast]
  );

  const updateSong = useCallback(
    (updatedSong: Song) => {
      setSongs((prev) =>
        prev.map((s) => {
          if (s.id === updatedSong.id) {
            const isImported = s.isLocalImport || s.source === 'user_import' || s.audioAvailability === 'local_file';
            return {
              ...updatedSong,
              source: isImported ? 'user_import' : (s.source || 'user_manual'),
              isLocalImport: isImported,
              audioAvailability: isImported ? 'local_file' : 'metadata_only',
            };
          }
          return s;
        })
      );
      if (currentSong?.id === updatedSong.id) {
        const isImported = currentSong.isLocalImport || currentSong.source === 'user_import' || currentSong.audioAvailability === 'local_file';
        setCurrentSong({
          ...updatedSong,
          source: isImported ? 'user_import' : (currentSong.source || 'user_manual'),
          isLocalImport: isImported,
          audioAvailability: isImported ? 'local_file' : 'metadata_only',
        });
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

      // Protect public catalogue tracks from deletion
      const userSelectedSongIds = songIds.filter((id) => !id.startsWith('cat-track-'));
      if (userSelectedSongIds.length === 0) {
        showToast('Public catalogue tracks are built-in library items and cannot be removed.', 'info');
        return { success: false, deletedCount: 0, importedCount: 0 };
      }

      const selectedIdSet = new Set(userSelectedSongIds);
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
      apiService.savePlaylist(newPlaylist).catch(() => {});
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
      apiService.savePlaylist(updatedPlaylist).catch(() => {});
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
      apiService.deletePlaylist(id).catch(() => {});
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
        audioAvailability: 'metadata_only',
        source: 'user_manual',
        isLocalImport: false,
        year: new Date().getFullYear(),
        playCount: 0,
        lastPlayedAt: null,
        isFavorite: false,
        mood: 'Euphoric',
        lyrics: [{ time: 0, text: `[Discovered from Bucket List: ${item.notes || 'Curated recommendation'}]` }],
      };

      setSongs((prev) => [newSong, ...prev]);
      toggleBucketListened(item.id);
      awardXP(45, `Cataloged "${item.title}" into Music Library`);
      showToast(`Migrated "${item.title}" to Library (Metadata catalog entry)`, 'success');
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

  // Dynamic Quests & Anti-Farming XP Actions
  const claimQuestReward = useCallback(
    (questId: string) => {
      const targetQuest = activeQuests.find((q) => q.id === questId);
      const res = questService.claimQuestReward(questId);
      if (res.success && res.xpAwarded > 0) {
        awardXP(res.xpAwarded, `Quest Completed: "${targetQuest?.title || 'Quest'}"`);
        setActiveQuests(questService.getActiveQuests());
        setQuestHistory(questService.getHistory());
        // Synchronize reward claim with Java Spring Boot backend
        apiService.claimReward(
          `quest-${questId}-${Date.now()}`,
          'QUEST',
          targetQuest?.title || 'Quest',
          res.xpAwarded,
          undefined,
          undefined
        ).catch(() => {});
      } else if (res.reason) {
        showToast(res.reason, 'warning');
      }
      return res;
    },
    [activeQuests, awardXP, showToast]
  );

  // Vocal Separation & Dual Track Controls
  const setAudioSource = useCallback(
    async (source: 'original' | 'instrumental'): Promise<boolean> => {
      const res = await audioEngine.switchAudioSource(source);
      if (res.success) {
        setAudioSourceState(source);
        showToast(
          source === 'instrumental'
            ? 'Switched to Separated Instrumental Audio'
            : 'Switched to Original Audio',
          'info'
        );
        return true;
      } else {
        if (res.reason) showToast(res.reason, 'warning');
        return false;
      }
    },
    [showToast]
  );

  const toggleAudioSource = useCallback(async (): Promise<boolean> => {
    const target = audioSource === 'original' ? 'instrumental' : 'original';
    return setAudioSource(target);
  }, [audioSource, setAudioSource]);

  const openSeparationModal = useCallback((song?: Song) => {
    setSelectedSongForSeparation(song || currentSong);
    setIsSeparationModalOpen(true);
  }, [currentSong]);

  const refreshSeparationStatus = useCallback(async (songId?: string): Promise<boolean> => {
    const targetId = songId || currentSong?.id;
    if (!targetId) return false;
    const has = await hasSeparatedAudio(targetId);
    if (targetId === currentSong?.id) {
      setHasInstrumental(has);
    }
    return has;
  }, [currentSong]);

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

        let totalImportXP = 0;
        for (const newSong of newSongsToAdd) {
          const xpRes = xpService.awardUniqueImport(newSong.id, newSong.title);
          if (xpRes.awarded) {
            totalImportXP += xpRes.amount;
          }
          questService.recordSongImport(newSong.id);
        }

        setXp(xpService.getTotalXP());
        setActiveQuests(questService.getActiveQuests());

        if (totalImportXP > 0) {
          showToast(
            `+${totalImportXP} XP: Successfully imported ${newSongsToAdd.length} local audio track${newSongsToAdd.length > 1 ? 's' : ''}!`,
            'success'
          );
        } else {
          showToast(
            `Successfully imported ${newSongsToAdd.length} track${newSongsToAdd.length > 1 ? 's' : ''}!`,
            'success'
          );
        }
        await refreshStorageStats();
      }

      setIsImporting(false);
      return { successCount, duplicateCount, errorCount };
    },
    [songs, showToast, refreshStorageStats]
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
        audioSource,
        hasInstrumental,
        isQueueOpen,
        setIsQueueOpen,
        isExpandedPlayerOpen,
        setIsExpandedPlayerOpen,
        isSeparationModalOpen,
        setIsSeparationModalOpen,
        selectedSongForSeparation,
        setSelectedSongForSeparation,
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
        setAudioSource,
        toggleAudioSource,
        openSeparationModal,
        refreshSeparationStatus,
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
        userProfile,
        activeQuests,
        questHistory,
        claimQuestReward,
        dailyListeningXPToday,
        dailyListeningXPCap,
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
        backendStatus,
        refreshBackendStatus,
        catalogueTracks,
        syncLocalSampleMusic,
        vaultSyncState,
        isOnboardingOpen,
        setIsOnboardingOpen,
        updateUserProfile,
        completeOnboarding,
        logoutCreator,
        logoutAllCreatorDevices,
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
