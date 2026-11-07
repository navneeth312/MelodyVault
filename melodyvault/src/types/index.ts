export type AudioAvailability = 'stream' | 'preview' | 'metadata_only' | 'local_file';

export type SongMood =
  | 'Euphoric'
  | 'Melancholic'
  | 'Deep Focus'
  | 'Midnight Drive'
  | 'Chill Lo-Fi'
  | 'High Energy'
  | 'Romantic';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export type SongSource = 'user_import' | 'user_manual' | 'sample_demo';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  language: string;
  duration: number; // in seconds
  artwork: string;
  audioUrl?: string | null;
  audioAvailability: AudioAvailability;
  year: number;
  playCount: number;
  lastPlayedAt: string | null; // ISO string
  isFavorite: boolean;
  lyrics: LyricLine[];
  mood: SongMood;
  synthNotes?: number[]; // Frequencies or MIDI notes for procedural playback fallback
  isLocalImport?: boolean;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  source?: SongSource;
}

export interface ImportFileProgress {
  fileName: string;
  fileSize: number;
  status: 'pending' | 'parsing' | 'saving' | 'success' | 'duplicate' | 'error';
  progress?: number;
  error?: string;
  songTitle?: string;
  artist?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface TimeCapsule {
  id: string;
  title: string;
  message: string;
  unlockDate: string; // ISO date
  songIds: string[];
  isSealed: boolean;
  createdAt: string;
}

export interface SongMemory {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  note: string;
  memoryDate: string;
  location?: string;
  moodTag?: string;
  createdAt: string;
}

export interface BucketListItem {
  id: string;
  title: string;
  artist: string;
  genre: string;
  priority: 'High' | 'Medium' | 'Low';
  notes: string;
  source: string;
  isListened: boolean;
  addedAt: string;
}

export interface QuestBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  requirementCount: number;
  currentCount: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  tag: string;
  isCurrentUser?: boolean;
}

export interface ChallengeItem {
  id: string;
  type: 'guess_song' | 'guess_lyrics' | 'trivia' | 'song_vs_song' | 'memory_match' | 'daily';
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
  songId?: string;
  audioSnippet?: number[]; // frequencies
}

export type NavigationTab =
  | 'dashboard'
  | 'library'
  | 'playlists'
  | 'favorites'
  | 'recently_played'
  | 'karaoke'
  | 'challenges'
  | 'quest'
  | 'time_capsule'
  | 'memory_journal'
  | 'forgotten_songs'
  | 'mood_explorer'
  | 'bucket_list'
  | 'statistics'
  | 'settings';
