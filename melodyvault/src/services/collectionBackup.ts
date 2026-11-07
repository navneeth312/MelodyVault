import JSZip from 'jszip';
import { Song, Playlist, SongMemory, BucketListItem, TimeCapsule } from '../types';
import { getAudioBlob, saveAudioBlob, getArtworkBlob, saveArtworkBlob } from './storageIndexedDB';
import { isDemoSong } from '../utils/collectionCleaner';

export const CURRENT_BACKUP_VERSION = '1.1.0';
export const SUPPORTED_BACKUP_VERSIONS = ['1.0.0', '1.1.0'];

export interface BackupManifest {
  appName: 'MelodyVault';
  version: string;
  exportedAt: string;
  totalSongs: number;
  totalPlaylists: number;
  totalAudioFiles: number;
  totalMemories?: number;
  totalBucketItems?: number;
  description: string;
  sharingNotice: string;
}

export interface CollectionBackupData {
  manifest: BackupManifest;
  songs: Song[];
  playlists: Playlist[];
  memories?: SongMemory[];
  bucketList?: BucketListItem[];
  timeCapsules?: TimeCapsule[];
  xp?: number;
  streakDays?: number;
  equalizerPreset?: string;
  favorites?: string[]; // Song IDs
}

export interface BackupProgressCallback {
  (current: number, total: number, message: string): void;
}

export interface MissingAudioInfo {
  id: string;
  title: string;
  artist: string;
  fileName?: string;
}

export interface BackupValidationReport {
  isValid: boolean;
  manifest: BackupManifest;
  backupData: CollectionBackupData;
  audioFilesFoundInZip: number;
  missingAudioSongs: MissingAudioInfo[];
  duplicateSongs: Array<{ title: string; artist: string; id: string }>;
  newSongsCount: number;
  totalSongsInBackup: number;
  totalPlaylistsInBackup: number;
  compatibilityNote: string;
  errors: string[];
  warnings: string[];
}

export type DuplicateStrategy = 'merge_skip' | 'merge_overwrite' | 'replace';

export interface ImportOptions {
  duplicateStrategy?: DuplicateStrategy;
  currentSongs?: Song[];
  currentPlaylists?: Playlist[];
}

/**
 * Validates a MelodyVault backup ZIP archive without performing writes.
 */
export async function validateBackupZip(
  zipFile: File | Blob,
  currentSongs: Song[] = []
): Promise<BackupValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipFile);
  } catch (err: any) {
    return {
      isValid: false,
      manifest: {} as any,
      backupData: {} as any,
      audioFilesFoundInZip: 0,
      missingAudioSongs: [],
      duplicateSongs: [],
      newSongsCount: 0,
      totalSongsInBackup: 0,
      totalPlaylistsInBackup: 0,
      compatibilityNote: 'Incompatible file',
      errors: ['File is not a valid or readable ZIP package: ' + (err?.message || 'Corrupted archive')],
      warnings: [],
    };
  }

  // 1. Check for collection.json
  const collectionJsonFile = zip.file('collection.json');
  if (!collectionJsonFile) {
    errors.push('Archive is missing "collection.json" metadata descriptor.');
  }

  // 2. Check for manifest.json
  const manifestFile = zip.file('manifest.json');
  let manifest: BackupManifest;
  if (!manifestFile) {
    warnings.push('Archive does not have a "manifest.json" header; legacy format detected.');
    manifest = {
      appName: 'MelodyVault',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalSongs: 0,
      totalPlaylists: 0,
      totalAudioFiles: 0,
      description: 'Legacy MelodyVault backup archive',
      sharingNotice: 'Sharing the web application URL does not transfer audio files. Complete ZIP backup required.',
    };
  } else {
    try {
      const manifestText = await manifestFile.async('text');
      manifest = JSON.parse(manifestText);
      if (manifest.appName !== 'MelodyVault') {
        errors.push(`Invalid application name in manifest: "${manifest.appName}". Expected "MelodyVault".`);
      }
      if (!SUPPORTED_BACKUP_VERSIONS.includes(manifest.version)) {
        warnings.push(`Backup version "${manifest.version}" may have differences with current application version "${CURRENT_BACKUP_VERSION}".`);
      }
    } catch (mErr: any) {
      errors.push('Corrupted manifest.json in ZIP archive: ' + mErr.message);
      manifest = {} as any;
    }
  }

  // If collection.json was missing or manifest had fatal error, return early
  if (errors.length > 0 || !collectionJsonFile) {
    return {
      isValid: false,
      manifest,
      backupData: {} as any,
      audioFilesFoundInZip: 0,
      missingAudioSongs: [],
      duplicateSongs: [],
      newSongsCount: 0,
      totalSongsInBackup: 0,
      totalPlaylistsInBackup: 0,
      compatibilityNote: 'Integrity check failed',
      errors,
      warnings,
    };
  }

  // 3. Parse collection.json
  let backupData: CollectionBackupData;
  try {
    const jsonText = await collectionJsonFile.async('text');
    backupData = JSON.parse(jsonText);
  } catch (jErr: any) {
    errors.push('Failed to parse "collection.json": ' + jErr.message);
    return {
      isValid: false,
      manifest,
      backupData: {} as any,
      audioFilesFoundInZip: 0,
      missingAudioSongs: [],
      duplicateSongs: [],
      newSongsCount: 0,
      totalSongsInBackup: 0,
      totalPlaylistsInBackup: 0,
      compatibilityNote: 'JSON syntax error',
      errors,
      warnings,
    };
  }

  if (!backupData.songs || !Array.isArray(backupData.songs)) {
    errors.push('Collection metadata does not contain a valid "songs" array.');
  }
  if (backupData.playlists && !Array.isArray(backupData.playlists)) {
    errors.push('"playlists" in collection is not an array.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      manifest,
      backupData,
      audioFilesFoundInZip: 0,
      missingAudioSongs: [],
      duplicateSongs: [],
      newSongsCount: 0,
      totalSongsInBackup: 0,
      totalPlaylistsInBackup: 0,
      compatibilityNote: 'Invalid metadata schema',
      errors,
      warnings,
    };
  }

  // 4. Inspect audio binaries in "audio/" folder
  const audioFolder = zip.folder('audio');
  const availableAudioFileMap = new Map<string, string>(); // base id -> full path
  let audioFilesFoundInZip = 0;

  if (audioFolder) {
    audioFolder.forEach((relPath, entry) => {
      if (!entry.dir) {
        audioFilesFoundInZip++;
        const filename = entry.name.split('/').pop() || '';
        const baseId = filename.replace(/\.(mp3|wav|wave|m4a|ogg)$/i, '');
        availableAudioFileMap.set(baseId, filename);
      }
    });
  }

  // 5. Detect missing audio files for songs that require them
  const missingAudioSongs: MissingAudioInfo[] = [];
  for (const song of backupData.songs) {
    if (song.isLocalImport || song.audioAvailability === 'local_file') {
      const hasAudio = availableAudioFileMap.has(song.id);
      if (!hasAudio) {
        missingAudioSongs.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          fileName: song.fileName,
        });
      }
    }
  }

  if (missingAudioSongs.length > 0) {
    warnings.push(
      `${missingAudioSongs.length} local track(s) in collection metadata do not have audio files inside the "audio/" folder.`
    );
  }

  // 6. Detect duplicate tracks against current user collection
  const duplicateSongs: Array<{ title: string; artist: string; id: string }> = [];
  const currentSongIds = new Set(currentSongs.map((s) => s.id));
  const currentSongKeys = new Set(
    currentSongs.map((s) => `${s.title.toLowerCase()}:::${s.artist.toLowerCase()}`)
  );

  let newSongsCount = 0;
  for (const bSong of backupData.songs) {
    const key = `${bSong.title.toLowerCase()}:::${bSong.artist.toLowerCase()}`;
    if (currentSongIds.has(bSong.id) || currentSongKeys.has(key)) {
      duplicateSongs.push({
        title: bSong.title,
        artist: bSong.artist,
        id: bSong.id,
      });
    } else {
      newSongsCount++;
    }
  }

  const compatibilityNote = `Version ${manifest.version || '1.0.0'} (${backupData.songs.length} tracks, ${backupData.playlists?.length || 0} playlists)`;

  return {
    isValid: errors.length === 0,
    manifest,
    backupData,
    audioFilesFoundInZip,
    missingAudioSongs,
    duplicateSongs,
    newSongsCount,
    totalSongsInBackup: backupData.songs.length,
    totalPlaylistsInBackup: backupData.playlists?.length || 0,
    compatibilityNote,
    errors,
    warnings,
  };
}

/**
 * Packages personal collection, playlists, audio binaries and artwork into a ZIP.
 */
export async function exportCollectionZip(
  songs: Song[],
  playlists: Playlist[],
  memories: SongMemory[] = [],
  bucketList: BucketListItem[] = [],
  options?: {
    timeCapsules?: TimeCapsule[];
    xp?: number;
    streakDays?: number;
    excludeDemoTracks?: boolean;
  },
  onProgress?: BackupProgressCallback
): Promise<Blob> {
  const zip = new JSZip();

  // Filter out demo tracks if personal collection export is desired (default: true)
  const shouldExcludeDemo = options?.excludeDemoTracks ?? true;
  const songsToExport = shouldExcludeDemo ? songs.filter((s) => !isDemoSong(s)) : songs;

  // Local tracks that have audio blobs in IndexedDB
  const localSongs = songsToExport.filter(
    (s) => s.isLocalImport || s.audioAvailability === 'local_file'
  );

  const totalSteps = localSongs.length + 4;
  let currentStep = 0;

  onProgress?.(currentStep++, totalSteps, 'Preparing metadata manifest and validation headers...');

  const manifest: BackupManifest = {
    appName: 'MelodyVault',
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    totalSongs: songsToExport.length,
    totalPlaylists: playlists.length,
    totalAudioFiles: localSongs.length,
    totalMemories: memories.length,
    totalBucketItems: bucketList.length,
    description: 'MelodyVault Portable Music Collection: Audio binaries, playlists, metadata and memories.',
    sharingNotice: 'Audio files are stored locally in browser IndexedDB. To share or transfer, send this complete ZIP package.',
  };

  const backupData: CollectionBackupData = {
    manifest,
    songs: songsToExport,
    playlists,
    memories,
    bucketList,
    timeCapsules: options?.timeCapsules || [],
    xp: options?.xp,
    streakDays: options?.streakDays,
    favorites: songsToExport.filter((s) => s.isFavorite).map((s) => s.id),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('collection.json', JSON.stringify(backupData, null, 2));

  // Audio and artwork folders
  const audioFolder = zip.folder('audio');
  const artworkFolder = zip.folder('artwork');

  // Archive audio binaries from IndexedDB
  for (let i = 0; i < localSongs.length; i++) {
    const s = localSongs[i];
    onProgress?.(
      currentStep++,
      totalSteps,
      `Packaging audio binary (${i + 1}/${localSongs.length}): "${s.title}"...`
    );

    const audioBlob = await getAudioBlob(s.id);
    if (audioBlob && audioFolder) {
      const ext = s.fileName?.toLowerCase().endsWith('.wav') ? 'wav' : 'mp3';
      audioFolder.file(`${s.id}.${ext}`, audioBlob);
    }

    const artworkBlob = await getArtworkBlob(s.id);
    if (artworkBlob && artworkFolder) {
      artworkFolder.file(`${s.id}.jpg`, artworkBlob);
    }
  }

  onProgress?.(currentStep++, totalSteps, 'Compressing collection package into standard ZIP...');

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(
        totalSteps,
        totalSteps,
        `Compressing ZIP archive: ${Math.round(metadata.percent)}%`
      );
    }
  );

  return zipBlob;
}

/**
 * Imports and restores a validated collection archive with flexible duplicate handling.
 */
export async function importCollectionZip(
  zipFile: File | Blob,
  options: ImportOptions = {},
  onProgress?: BackupProgressCallback
): Promise<{
  importedSongs: Song[];
  importedPlaylists: Playlist[];
  importedMemories: SongMemory[];
  importedBucketList: BucketListItem[];
  importedTimeCapsules: TimeCapsule[];
  audioFilesRestored: number;
  missingAudioCount: number;
  duplicateCount: number;
  strategyUsed: DuplicateStrategy;
}> {
  const duplicateStrategy: DuplicateStrategy = options.duplicateStrategy || 'merge_skip';
  const currentSongs = options.currentSongs || [];
  const currentPlaylists = options.currentPlaylists || [];

  onProgress?.(1, 10, 'Validating package integrity...');
  const validation = await validateBackupZip(zipFile, currentSongs);

  if (!validation.isValid) {
    throw new Error('Integrity validation failed: ' + validation.errors.join('; '));
  }

  const { backupData, missingAudioSongs, duplicateSongs } = validation;
  const zip = await JSZip.loadAsync(zipFile);

  // Restore audio binaries to IndexedDB
  const audioFolder = zip.folder('audio');
  let audioFilesRestored = 0;

  if (audioFolder) {
    const audioFiles: JSZip.JSZipObject[] = [];
    audioFolder.forEach((_, fileObj) => {
      if (!fileObj.dir) audioFiles.push(fileObj);
    });

    for (let i = 0; i < audioFiles.length; i++) {
      const fileObj = audioFiles[i];
      const filename = fileObj.name.split('/').pop() || '';
      const songId = filename.replace(/\.(mp3|wav|wave|m4a|ogg)$/i, '');

      onProgress?.(
        2 + Math.round((i / (audioFiles.length || 1)) * 5),
        10,
        `Extracting and storing audio binary ${i + 1} of ${audioFiles.length}: "${filename}"...`
      );

      const isWav = filename.toLowerCase().endsWith('.wav');
      const mimeType = isWav ? 'audio/wav' : 'audio/mpeg';
      const arrayBuffer = await fileObj.async('arraybuffer');
      const blob = new Blob([arrayBuffer], { type: mimeType });

      await saveAudioBlob(songId, blob, filename);
      audioFilesRestored++;
    }
  }

  // Restore artwork
  const artworkFolder = zip.folder('artwork');
  if (artworkFolder) {
    const artworkFiles: JSZip.JSZipObject[] = [];
    artworkFolder.forEach((_, f) => {
      if (!f.dir) artworkFiles.push(f);
    });

    for (const artFile of artworkFiles) {
      const filename = artFile.name.split('/').pop() || '';
      const songId = filename.replace(/\.(jpg|png|jpeg)$/i, '');
      const arrayBuffer = await artFile.async('arraybuffer');
      const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
      await saveArtworkBlob(songId, blob);
    }
  }

  onProgress?.(8, 10, 'Reconciling song metadata and playlists...');

  // Combine songs based on strategy
  let finalSongs: Song[] = [];
  let finalPlaylists: Playlist[] = [];

  const incomingSongs = backupData.songs.map((s) => ({
    ...s,
    source: (s.isLocalImport ? 'user_import' : 'user_manual') as any,
  }));

  if (duplicateStrategy === 'replace') {
    finalSongs = incomingSongs;
    finalPlaylists = backupData.playlists || [];
  } else if (duplicateStrategy === 'merge_overwrite') {
    const map = new Map<string, Song>();
    // Existing first
    currentSongs.forEach((s) => map.set(s.id, s));
    // Overwrite with incoming
    incomingSongs.forEach((s) => map.set(s.id, s));
    finalSongs = Array.from(map.values());

    const plMap = new Map<string, Playlist>();
    currentPlaylists.forEach((p) => plMap.set(p.id, p));
    (backupData.playlists || []).forEach((p) => plMap.set(p.id, p));
    finalPlaylists = Array.from(plMap.values());
  } else {
    // merge_skip: keep current, add only new ones
    const currentSongIds = new Set(currentSongs.map((s) => s.id));
    const currentSongKeys = new Set(
      currentSongs.map((s) => `${s.title.toLowerCase()}:::${s.artist.toLowerCase()}`)
    );

    const songsToAdd = incomingSongs.filter((s) => {
      const key = `${s.title.toLowerCase()}:::${s.artist.toLowerCase()}`;
      return !currentSongIds.has(s.id) && !currentSongKeys.has(key);
    });

    finalSongs = [...currentSongs, ...songsToAdd];

    const currentPlIds = new Set(currentPlaylists.map((p) => p.id));
    const plToAdd = (backupData.playlists || []).filter((p) => !currentPlIds.has(p.id));
    finalPlaylists = [...currentPlaylists, ...plToAdd];
  }

  onProgress?.(10, 10, 'Restoration complete!');

  return {
    importedSongs: finalSongs,
    importedPlaylists: finalPlaylists,
    importedMemories: backupData.memories || [],
    importedBucketList: backupData.bucketList || [],
    importedTimeCapsules: backupData.timeCapsules || [],
    audioFilesRestored,
    missingAudioCount: missingAudioSongs.length,
    duplicateCount: duplicateSongs.length,
    strategyUsed: duplicateStrategy,
  };
}
