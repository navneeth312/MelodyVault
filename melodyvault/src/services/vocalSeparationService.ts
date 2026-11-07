import {
  saveSeparatedAudioRecord,
  getSeparatedAudioRecord,
  deleteSeparatedAudioRecord,
  hasSeparatedAudio,
  getAudioBlob,
  StoredSeparatedAudioRecord,
} from './storageIndexedDB';
import { Song } from '../types';

export interface VocalSeparationStatus {
  isAvailable: boolean;
  modelUsed?: string;
  processedAt?: string;
  fileSize?: number;
}

export interface SeparationProgress {
  stage: 'idle' | 'decoding' | 'processing' | 'encoding' | 'saving' | 'complete' | 'error';
  progressPercent: number;
  message: string;
  error?: string;
}

export type SeparationEngine = 'local_ai_demucs' | 'dsp_vocal_subtraction' | 'studio_import';

class VocalSeparationService {
  private localDemucsEndpoint = 'http://localhost:5000/api';

  /**
   * Checks if processed instrumental audio exists for the given song.
   */
  public async getStatus(songId: string): Promise<VocalSeparationStatus> {
    const record = await getSeparatedAudioRecord(songId);
    if (!record || !record.instrumentalBlob) {
      return { isAvailable: false };
    }
    return {
      isAvailable: true,
      modelUsed: record.modelUsed,
      processedAt: record.processedAt,
      fileSize: record.size,
    };
  }

  /**
   * Tests whether a local Python Demucs AI service is running at localhost:5000.
   */
  public async checkLocalDemucsAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.localDemucsEndpoint}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Imports a pre-separated studio instrumental/karaoke track (MP3/WAV) directly into IndexedDB.
   */
  public async importStudioInstrumentalTrack(
    songId: string,
    file: File
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const record: StoredSeparatedAudioRecord = {
        songId,
        instrumentalBlob: file,
        modelUsed: 'studio_backing_track',
        processedAt: new Date().toISOString(),
        size: file.size,
      };
      await saveSeparatedAudioRecord(record);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save instrumental audio.' };
    }
  }

  /**
   * Generates a genuine isolated instrumental audio WAV file offline using high-order
   * phase-inversion center-channel cancellation with low-frequency bass/kick preservation.
   * Renders the output through OfflineAudioContext and encodes an actual stereo WAV Blob into IndexedDB.
   */
  public async separateVocalsOfflineDSP(
    song: Song,
    onProgress?: (p: SeparationProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      onProgress?.({
        stage: 'decoding',
        progressPercent: 10,
        message: 'Reading and decoding original audio from IndexedDB...',
      });

      const audioBlob = await getAudioBlob(song.id);
      if (!audioBlob) {
        throw new Error('Original audio file not found in IndexedDB.');
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const tempCtx = new AudioCtx();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
      await tempCtx.close();

      onProgress?.({
        stage: 'processing',
        progressPercent: 35,
        message: 'Analyzing stereo channels & extracting center-panned vocal frequencies...',
      });

      // Separation parameters
      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length;

      if (numChannels < 2) {
        throw new Error('Mono audio file detected. Stereo recording required for spatial vocal separation.');
      }

      // Offline render of genuine instrumental track
      const offlineCtx = new OfflineAudioContext(2, length, sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Channel splitter
      const splitter = offlineCtx.createChannelSplitter(2);
      const merger = offlineCtx.createChannelMerger(2);

      // Invert right channel phase to cancel center-panned lead vocals (L - R)
      const invertGain = offlineCtx.createGain();
      invertGain.gain.value = -1.0;

      // Bass crossover filter to preserve mono kick and bassline (< 140 Hz)
      const bassFilterL = offlineCtx.createBiquadFilter();
      bassFilterL.type = 'lowpass';
      bassFilterL.frequency.value = 140;

      const bassFilterR = offlineCtx.createBiquadFilter();
      bassFilterR.type = 'lowpass';
      bassFilterR.frequency.value = 140;

      // Stereo difference nodes
      const diffGainL = offlineCtx.createGain();
      diffGainL.gain.value = 0.85;

      const diffGainR = offlineCtx.createGain();
      diffGainR.gain.value = 0.85;

      // Connect graph:
      source.connect(splitter);

      // Bass preservation path
      splitter.connect(bassFilterL, 0);
      splitter.connect(bassFilterR, 1);
      bassFilterL.connect(merger, 0, 0);
      bassFilterR.connect(merger, 0, 1);

      // Vocal cancellation path (L - R) to Left, (R - L) to Right
      splitter.connect(diffGainL, 0); // L
      splitter.connect(invertGain, 1); // -R
      invertGain.connect(diffGainL); // (L - R)
      diffGainL.connect(merger, 0, 0);

      // (R - L) for Right channel
      const invertL = offlineCtx.createGain();
      invertL.gain.value = -1.0;
      splitter.connect(invertL, 0); // -L
      splitter.connect(diffGainR, 1); // R
      invertL.connect(diffGainR); // (R - L)
      diffGainR.connect(merger, 0, 1);

      merger.connect(offlineCtx.destination);
      source.start(0);

      onProgress?.({
        stage: 'processing',
        progressPercent: 65,
        message: 'Rendering isolated instrumental audio waveform...',
      });

      const renderedBuffer = await offlineCtx.startRendering();

      onProgress?.({
        stage: 'encoding',
        progressPercent: 85,
        message: 'Encoding 16-bit PCM Lossless Stereo WAV...',
      });

      const wavBlob = this.encodeAudioBufferToWav(renderedBuffer);

      onProgress?.({
        stage: 'saving',
        progressPercent: 95,
        message: 'Saving instrumental audio to local IndexedDB store...',
      });

      const record: StoredSeparatedAudioRecord = {
        songId: song.id,
        instrumentalBlob: wavBlob,
        modelUsed: 'dsp_center_isolation_v1',
        processedAt: new Date().toISOString(),
        size: wavBlob.size,
      };

      await saveSeparatedAudioRecord(record);

      onProgress?.({
        stage: 'complete',
        progressPercent: 100,
        message: 'Instrumental track generated and ready for playback!',
      });

      return { success: true };
    } catch (err: any) {
      onProgress?.({
        stage: 'error',
        progressPercent: 0,
        message: err?.message || 'Vocal separation failed.',
        error: err?.message || 'Unknown error during audio separation.',
      });
      return { success: false, error: err?.message || 'Vocal separation failed.' };
    }
  }

  /**
   * Connects to a local Demucs v4 Python backend (localhost:5000) for deep neural source separation.
   */
  public async separateVocalsDemucsBackend(
    song: Song,
    onProgress?: (p: SeparationProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      onProgress?.({
        stage: 'decoding',
        progressPercent: 10,
        message: 'Reading audio from IndexedDB...',
      });

      const audioBlob = await getAudioBlob(song.id);
      if (!audioBlob) throw new Error('Original audio file not found in IndexedDB.');

      onProgress?.({
        stage: 'processing',
        progressPercent: 30,
        message: 'Uploading to local Demucs v4 AI service (htdemucs)...',
      });

      const formData = new FormData();
      formData.append('audio', audioBlob, song.fileName || 'track.mp3');
      formData.append('songId', song.id);

      const response = await fetch(`${this.localDemucsEndpoint}/separate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Demucs AI service error: ${response.statusText}`);
      }

      onProgress?.({
        stage: 'encoding',
        progressPercent: 80,
        message: 'Receiving separated instrumental stem...',
      });

      const instrumentalBlob = await response.blob();

      onProgress?.({
        stage: 'saving',
        progressPercent: 95,
        message: 'Saving processed Demucs stem to IndexedDB...',
      });

      const record: StoredSeparatedAudioRecord = {
        songId: song.id,
        instrumentalBlob,
        modelUsed: 'htdemucs_v4',
        processedAt: new Date().toISOString(),
        size: instrumentalBlob.size,
      };

      await saveSeparatedAudioRecord(record);

      onProgress?.({
        stage: 'complete',
        progressPercent: 100,
        message: 'Demucs AI vocal separation complete!',
      });

      return { success: true };
    } catch (err: any) {
      onProgress?.({
        stage: 'error',
        progressPercent: 0,
        message: err?.message || 'Demucs separation failed.',
        error: err?.message,
      });
      return { success: false, error: err?.message };
    }
  }

  /**
   * Deletes the separated instrumental audio from IndexedDB.
   */
  public async removeSeparatedAudio(songId: string): Promise<void> {
    await deleteSeparatedAudioRecord(songId);
  }

  /**
   * Encodes a Web Audio AudioBuffer into a standard 16-bit PCM RIFF WAV Blob.
   */
  private encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write interleaved samples
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        // Clip to [-1, 1]
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const vocalSeparationService = new VocalSeparationService();

