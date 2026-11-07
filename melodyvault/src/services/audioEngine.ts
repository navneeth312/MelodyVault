import { Song } from '../types';
import { isPlayableSong, validateSongPlayability } from '../utils/pureLogic';
import {
  getAudioBlob,
  getAudioObjectURL,
  getInstrumentalObjectURL,
  hasSeparatedAudio,
} from './storageIndexedDB';

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'buffering' | 'error' | 'unavailable';
export type AudioSourceTrack = 'original' | 'instrumental';

export interface AudioEngineListeners {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onStatusChange?: (status: PlayerStatus, errorMessage?: string) => void;
  onEnded?: () => void;
  onAudioSourceChange?: (source: AudioSourceTrack) => void;
}

class AudioEngineService {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private vocalCutFilterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;

  private currentSong: Song | null = null;
  private status: PlayerStatus = 'idle';
  private volume = 0.8;
  private audioSource: AudioSourceTrack = 'original';
  private listeners: AudioEngineListeners = {};

  constructor() {
    // Audio context will be lazy-initialized on user gesture
  }

  public setListeners(listeners: AudioEngineListeners) {
    this.listeners = listeners;
  }

  private initAudioNodes() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 64;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      this.vocalCutFilterNode = this.audioCtx.createBiquadFilter();
      this.vocalCutFilterNode.type = 'allpass'; // Default: no cut

      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      try {
        this.audioSourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        this.audioSourceNode.connect(this.vocalCutFilterNode);
        this.vocalCutFilterNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn('MediaElementSource initialization warning (fallback direct audio)', e);
      }

      this.setupAudioElementEvents();
    } catch (e) {
      console.error('AudioContext initialization failed', e);
    }
  }

  private setupAudioElementEvents() {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('timeupdate', () => {
      const cur = this.audioElement?.currentTime || 0;
      const dur = this.audioElement?.duration || this.currentSong?.duration || 0;
      this.listeners.onTimeUpdate?.(
        cur,
        isNaN(dur) || dur <= 0 ? (this.currentSong?.duration || 180) : dur
      );
    });

    this.audioElement.addEventListener('playing', () => {
      this.status = 'playing';
      this.listeners.onStatusChange?.('playing');
    });

    this.audioElement.addEventListener('pause', () => {
      if (this.status !== 'idle') {
        this.status = 'paused';
        this.listeners.onStatusChange?.('paused');
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.listeners.onEnded?.();
    });

    this.audioElement.addEventListener('error', () => {
      this.status = 'error';
      this.listeners.onStatusChange?.(
        'error',
        'Failed to decode local audio file. The file may be corrupted or in an unsupported format.'
      );
    });

    this.audioElement.addEventListener('waiting', () => {
      this.listeners.onStatusChange?.('buffering');
    });
  }

  /**
   * Centrally enforces that only imported local tracks (MP3/WAV) with valid
   * blobs in IndexedDB can be played.
   */
  public async playSong(
    song: Song,
    resumeAt = 0,
    preferredSource?: AudioSourceTrack
  ): Promise<boolean> {
    this.initAudioNodes();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume warning', e);
      }
    }

    // 1. Central playability validation
    const validation = validateSongPlayability(song);
    if (!validation.canPlay || !isPlayableSong(song)) {
      this.currentSong = null;
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
      this.status = 'unavailable';
      this.listeners.onStatusChange?.('unavailable', validation.message);
      this.listeners.onTimeUpdate?.(0, song?.duration || 180);
      return false;
    }

    this.currentSong = song;

    // 2. Resolve audio source URL:
    // If public catalogue track: resolve stream URL (local backend or external authorized stream)
    // If user imported track: validate and fetch blob from browser IndexedDB
    try {
      let activeUrl: string | null = null;
      let chosenSource: AudioSourceTrack = 'original';

      if (song.source === 'public_catalogue') {
        const rawStream = song.streamUrl || song.audioUrl;
        if (!rawStream) {
          if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
          }
          this.status = 'error';
          this.listeners.onStatusChange?.('error', `Streaming audio URL missing for catalogue track "${song.title}".`);
          return false;
        }
        activeUrl = rawStream.startsWith('http')
          ? rawStream
          : `http://localhost:8085${rawStream.startsWith('/') ? '' : '/'}${rawStream}`;
        chosenSource = 'original';
      } else {
        // User imported track from IndexedDB
        const blob = await getAudioBlob(song.id);
        if (!blob || blob.size === 0) {
          if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
          }
          this.status = 'error';
          const errorMsg = `Audio file for "${song.title}" is missing from browser local storage (IndexedDB). Please re-import this track.`;
          this.listeners.onStatusChange?.('error', errorMsg);
          return false;
        }

        if (preferredSource === 'instrumental') {
          const instUrl = await getInstrumentalObjectURL(song.id);
          if (instUrl) {
            activeUrl = instUrl;
            chosenSource = 'instrumental';
          }
        }

        if (!activeUrl) {
          activeUrl = await getAudioObjectURL(song.id);
          chosenSource = 'original';
        }
      }

      if (!activeUrl || !this.audioElement) {
        this.status = 'error';
        this.listeners.onStatusChange?.(
          'error',
          'Failed to generate audio playback URL.'
        );
        return false;
      }

      this.audioSource = chosenSource;
      this.listeners.onAudioSourceChange?.(this.audioSource);

      // 4. Set audio element source and begin playback
      if (this.audioElement.src !== activeUrl) {
        this.audioElement.src = activeUrl;
      }
      this.audioElement.currentTime = resumeAt;
      this.audioElement.volume = this.volume;

      try {
        await this.audioElement.play();
        this.status = 'playing';
        this.listeners.onStatusChange?.('playing');
        return true;
      } catch (playErr) {
        console.error('Audio playback start error:', playErr);
        this.status = 'error';
        this.listeners.onStatusChange?.(
          'error',
          'Browser blocked or failed to play this local audio file.'
        );
        return false;
      }
    } catch (dbErr) {
      console.error('Failed to query audio blob from IndexedDB:', dbErr);
      this.status = 'error';
      this.listeners.onStatusChange?.(
        'error',
        'Could not access IndexedDB audio storage.'
      );
      return false;
    }
  }

  public getAudioSource(): AudioSourceTrack {
    return this.audioSource;
  }

  public async hasInstrumentalTrack(songId?: string): Promise<boolean> {
    const id = songId || this.currentSong?.id;
    if (!id) return false;
    return hasSeparatedAudio(id);
  }

  /**
   * Seamlessly switches audio track between Original and Instrumental
   * while preserving exact playback position and play state.
   */
  public async switchAudioSource(targetSource: AudioSourceTrack): Promise<{ success: boolean; reason?: string }> {
    if (!this.currentSong) {
      return { success: false, reason: 'No track currently active.' };
    }

    if (targetSource === this.audioSource) {
      return { success: true };
    }

    const currentPos = this.audioElement?.currentTime || 0;
    const wasPlaying = this.status === 'playing';

    if (targetSource === 'instrumental') {
      const hasInst = await hasSeparatedAudio(this.currentSong.id);
      if (!hasInst) {
        return {
          success: false,
          reason: `No separated instrumental audio track exists for "${this.currentSong.title}".`,
        };
      }

      const instUrl = await getInstrumentalObjectURL(this.currentSong.id);
      if (!instUrl || !this.audioElement) {
        return { success: false, reason: 'Failed to access instrumental audio blob.' };
      }

      this.audioElement.src = instUrl;
      this.audioElement.currentTime = currentPos;
      this.audioSource = 'instrumental';
      this.listeners.onAudioSourceChange?.('instrumental');

      if (wasPlaying) {
        await this.audioElement.play().catch(console.warn);
      }
      return { success: true };
    } else {
      let origUrl: string | null = null;
      if (this.currentSong.source === 'public_catalogue') {
        const rawStream = this.currentSong.streamUrl || this.currentSong.audioUrl || '';
        origUrl = rawStream.startsWith('http')
          ? rawStream
          : `http://localhost:8085${rawStream.startsWith('/') ? '' : '/'}${rawStream}`;
      } else {
        origUrl = await getAudioObjectURL(this.currentSong.id);
      }

      if (!origUrl || !this.audioElement) {
        return { success: false, reason: 'Failed to access original audio.' };
      }

      this.audioElement.src = origUrl;
      this.audioElement.currentTime = currentPos;
      this.audioSource = 'original';
      this.listeners.onAudioSourceChange?.('original');

      if (wasPlaying) {
        await this.audioElement.play().catch(console.warn);
      }
      return { success: true };
    }
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.status = 'paused';
    this.listeners.onStatusChange?.('paused');
  }

  public resume() {
    if (
      this.audioElement &&
      this.currentSong &&
      isPlayableSong(this.currentSong)
    ) {
      this.audioElement.play().catch((err) => {
        console.error('Resume playback error', err);
        this.status = 'error';
        this.listeners.onStatusChange?.('error', 'Failed to resume audio playback.');
      });
    } else if (this.currentSong && isPlayableSong(this.currentSong)) {
      this.playSong(this.currentSong);
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && !isNaN(this.audioElement.duration)) {
      this.audioElement.currentTime = Math.max(
        0,
        Math.min(seconds, this.audioElement.duration)
      );
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public toggleInstrumentalMode(): boolean {
    if (this.vocalCutFilterNode && this.audioCtx) {
      const isCurrentlyNotch = this.vocalCutFilterNode.type === 'notch';
      if (!isCurrentlyNotch) {
        this.vocalCutFilterNode.type = 'notch';
        this.vocalCutFilterNode.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        this.vocalCutFilterNode.Q.setValueAtTime(3.0, this.audioCtx.currentTime);
        return true;
      } else {
        this.vocalCutFilterNode.type = 'allpass';
        return false;
      }
    }
    return false;
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(16);
    }
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getCurrentStatus(): PlayerStatus {
    return this.status;
  }

  public reportAudioMissing(songId: string, reason?: string) {
    this.status = 'error';
    this.listeners.onStatusChange?.(
      'error',
      reason || 'Audio binary missing from local IndexedDB storage.'
    );
  }

  /**
   * Sound effect generator for interactive quiz challenges only.
   */
  public playAudioSnippet(frequencies: number[]) {
    this.initAudioNodes();
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    frequencies.forEach((freq, idx) => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.25);

      const startTime = this.audioCtx.currentTime + idx * 0.25;
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.24);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }
}

export const audioEngine = new AudioEngineService();
