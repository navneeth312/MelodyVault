import { apiService, DiscoveredTrackApiResponse } from './apiService';
import { saveAudioBlob, saveArtworkBlob, hasAudioBlob, getAudioBlob, getArtworkObjectURL } from './storageIndexedDB';
import { Song, SongMood } from '../types';

export interface ImportSampleResult {
  totalDiscovered: number;
  importedCount: number;
  existingCount: number;
  songs: Song[];
}

function inferMood(genre: string, title: string): SongMood {
  const lower = (genre + ' ' + title).toLowerCase();
  if (lower.includes('mass') || lower.includes('hukum') || lower.includes('energy') || lower.includes('kollywood')) {
    return 'High Energy';
  }
  if (lower.includes('indie') || lower.includes('rock') || lower.includes('drive')) {
    return 'Midnight Drive';
  }
  if (lower.includes('folk') || lower.includes('soul') || lower.includes('kehne') || lower.includes('magale')) {
    return 'Melancholic';
  }
  if (lower.includes('wildflower') || lower.includes('focus') || lower.includes('sailor')) {
    return 'Deep Focus';
  }
  return 'Euphoric';
}

export async function importSampleMusicCollection(
  onProgress?: (message: string, current: number, total: number) => void
): Promise<ImportSampleResult> {
  const discovered = await apiService.getLocalCollectionTracks();
  if (!discovered || discovered.length === 0) {
    return { totalDiscovered: 0, importedCount: 0, existingCount: 0, songs: [] };
  }

  const resultSongs: Song[] = [];
  let importedCount = 0;
  let existingCount = 0;

  for (let i = 0; i < discovered.length; i++) {
    const track: DiscoveredTrackApiResponse = discovered[i];
    onProgress?.(`Importing ${track.title} (${i + 1}/${discovered.length})...`, i + 1, discovered.length);

    try {
      const alreadyHasAudio = await hasAudioBlob(track.id);

      if (!alreadyHasAudio) {
        // Fetch audio binary from Java backend streaming endpoint
        const audioRes = await fetch(track.audioUrl);
        if (audioRes.ok) {
          const audioBlob = await audioRes.blob();
          await saveAudioBlob(track.id, audioBlob, track.filename);
          importedCount++;
        }
      } else {
        existingCount++;
      }

      // Extract and save artwork blob into IndexedDB
      let displayArtwork = track.artworkUrl;
      if (track.hasArtwork) {
        try {
          const artRes = await fetch(track.artworkUrl);
          if (artRes.ok) {
            const artBlob = await artRes.blob();
            await saveArtworkBlob(track.id, artBlob);
            const objectUrl = await getArtworkObjectURL(track.id);
            if (objectUrl) displayArtwork = objectUrl;
          }
        } catch (artErr) {
          console.warn('Failed to cache artwork blob for', track.title, artErr);
        }
      }

      const song: Song = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || 'MelodyVault Collection',
        genre: track.genre || 'Soundtrack',
        language: track.language || 'Multilingual',
        duration: track.duration || 180,
        artwork: displayArtwork,
        audioUrl: null, // Audio blob is stored in IndexedDB for authenticated offline playback
        audioAvailability: 'local_file',
        year: track.year || 2024,
        playCount: 0,
        lastPlayedAt: null,
        isFavorite: false,
        lyrics: [],
        mood: inferMood(track.genre, track.title),
        isLocalImport: true,
        source: 'user_import',
        fileName: track.filename,
        fileSize: track.fileSize,
        mimeType: 'audio/mpeg',
      };

      resultSongs.push(song);
    } catch (err) {
      console.error(`Failed to ingest sample track: ${track.filename}`, err);
    }
  }

  return {
    totalDiscovered: discovered.length,
    importedCount,
    existingCount,
    songs: resultSongs,
  };
}
