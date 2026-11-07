import { Song } from '../types';

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'buffering' | 'error' | 'unavailable';

export interface AudioEngineListeners {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onStatusChange?: (status: PlayerStatus, errorMessage?: string) => void;
  onEnded?: () => void;
}

class AudioEngineService {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private vocalCutFilterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;

  // Synth state for preview / synthetic playback
  private synthInterval: number | null = null;
  private synthCurrentNoteIndex = 0;
  private synthFakeTimer: number | null = null;
  private synthCurrentTime = 0;
  private synthDuration = 180;
  private isUsingSynth = false;

  private currentSong: Song | null = null;
  private status: PlayerStatus = 'idle';
  private volume = 0.8;
  private isInstrumentalMode = false;
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
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      if (this.isUsingSynth) return;
      const cur = this.audioElement?.currentTime || 0;
      const dur = this.audioElement?.duration || this.currentSong?.duration || 0;
      this.listeners.onTimeUpdate?.(cur, isNaN(dur) || dur <= 0 ? (this.currentSong?.duration || 180) : dur);
    });

    this.audioElement.addEventListener('playing', () => {
      this.status = 'playing';
      this.listeners.onStatusChange?.('playing');
    });

    this.audioElement.addEventListener('pause', () => {
      if (this.status !== 'idle' && !this.isUsingSynth) {
        this.status = 'paused';
        this.listeners.onStatusChange?.('paused');
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.listeners.onEnded?.();
    });

    this.audioElement.addEventListener('error', () => {
      if (this.currentSong?.audioAvailability === 'local_file' || this.currentSong?.isLocalImport) {
        this.status = 'error';
        this.listeners.onStatusChange?.('error', 'Failed to decode local audio file.');
        return;
      }

      // If audio file URL fails (e.g. network/CORS or unavailable stream), gracefully fallback to synth audio demo
      console.info('Audio URL load error, switching to synthetic melody preview');
      if (this.currentSong && this.currentSong.audioAvailability !== 'metadata_only') {
        this.startSynthPlayback(0);
      } else {
        this.status = 'error';
        this.listeners.onStatusChange?.('error', 'Audio stream unavailable for this licensed catalog item.');
      }
    });

    this.audioElement.addEventListener('waiting', () => {
      this.listeners.onStatusChange?.('buffering');
    });
  }

  public async playSong(song: Song, resumeAt = 0) {
    this.initAudioNodes();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.stopSynthPlayback();
    this.currentSong = song;

    if (song.audioAvailability === 'metadata_only') {
      this.status = 'unavailable';
      this.listeners.onStatusChange?.('unavailable', 'This catalog record is metadata-only (licensed track with no stream).');
      this.listeners.onTimeUpdate?.(0, song.duration);
      return;
    }

    // Check if song is a local import stored in IndexedDB
    if (song.audioAvailability === 'local_file' || song.isLocalImport) {
      this.isUsingSynth = false;
      const { getAudioObjectURL } = await import('./storageIndexedDB');
      const blobUrl = await getAudioObjectURL(song.id);

      if (blobUrl && this.audioElement) {
        this.audioElement.src = blobUrl;
        this.audioElement.currentTime = resumeAt;
        this.audioElement.volume = this.volume;
        try {
          await this.audioElement.play();
          this.status = 'playing';
          this.listeners.onStatusChange?.('playing');
          return;
        } catch (err) {
          console.error('Local audio playback error:', err);
          this.status = 'error';
          this.listeners.onStatusChange?.('error', 'Browser was unable to play this local audio file.');
          return;
        }
      } else {
        this.status = 'error';
        this.listeners.onStatusChange?.('error', 'Local audio binary not found in browser IndexedDB.');
        return;
      }
    }

    // If audioUrl is present, attempt real streaming audio
    if (song.audioUrl) {
      this.isUsingSynth = false;
      if (this.audioElement) {
        this.audioElement.src = song.audioUrl;
        this.audioElement.currentTime = resumeAt;
        this.audioElement.volume = this.volume;
        try {
          await this.audioElement.play();
          this.status = 'playing';
          this.listeners.onStatusChange?.('playing');
        } catch {
          // If browser policy blocks or fails, fallback to synth engine
          this.startSynthPlayback(resumeAt);
        }
      }
    } else {
      // Audio preview using built-in procedural synthesizer
      this.startSynthPlayback(resumeAt);
    }
  }

  public pause() {
    if (this.isUsingSynth) {
      this.pauseSynthPlayback();
    } else if (this.audioElement) {
      this.audioElement.pause();
    }
    this.status = 'paused';
    this.listeners.onStatusChange?.('paused');
  }

  public resume() {
    if (this.isUsingSynth) {
      this.resumeSynthPlayback();
    } else if (this.audioElement && (this.currentSong?.audioUrl || this.currentSong?.audioAvailability === 'local_file' || this.currentSong?.isLocalImport)) {
      this.audioElement.play().catch(() => {
        if (this.currentSong?.audioAvailability !== 'local_file') {
          this.startSynthPlayback(this.audioElement?.currentTime || 0);
        }
      });
    } else if (this.currentSong) {
      this.playSong(this.currentSong);
    }
  }

  public seek(seconds: number) {
    if (this.isUsingSynth) {
      this.synthCurrentTime = seconds;
      this.listeners.onTimeUpdate?.(this.synthCurrentTime, this.synthDuration);
    } else if (this.audioElement && !isNaN(this.audioElement.duration)) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration));
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
    this.isInstrumentalMode = !this.isInstrumentalMode;
    if (this.vocalCutFilterNode && this.audioCtx) {
      if (this.isInstrumentalMode) {
        // High-pass filter above 180Hz and notch filter around 1kHz to cut vocal core
        this.vocalCutFilterNode.type = 'notch';
        this.vocalCutFilterNode.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        this.vocalCutFilterNode.Q.setValueAtTime(3.0, this.audioCtx.currentTime);
      } else {
        this.vocalCutFilterNode.type = 'allpass';
      }
    }
    return this.isInstrumentalMode;
  }

  // Realistic Procedural Synth Audio Generator (Web Audio API)
  private startSynthPlayback(startTime = 0) {
    this.stopSynthPlayback();
    this.isUsingSynth = true;
    this.status = 'playing';
    this.synthCurrentTime = startTime;
    this.synthDuration = this.currentSong?.duration || 180;
    this.synthCurrentNoteIndex = 0;
    this.listeners.onStatusChange?.('playing');

    const notes = this.currentSong?.synthNotes || [440, 523, 659, 784, 880, 659, 523, 440];

    // Trigger melodic notes every 400ms
    this.synthInterval = window.setInterval(() => {
      if (this.status !== 'playing' || !this.audioCtx) return;

      const freq = notes[this.synthCurrentNoteIndex % notes.length];
      this.synthCurrentNoteIndex++;

      try {
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        osc.type = this.currentSong?.genre === 'Lo-Fi' ? 'sine' : this.currentSong?.genre === 'Rock' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        const now = this.audioCtx.currentTime;
        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.18 * this.volume, now + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(noteGain);
        if (this.analyserNode) {
          noteGain.connect(this.analyserNode);
        } else {
          noteGain.connect(this.audioCtx.destination);
        }

        osc.start(now);
        osc.stop(now + 0.4);
      } catch (err) {
        console.warn('Synth note error', err);
      }
    }, 400);

    // Track timer
    this.synthFakeTimer = window.setInterval(() => {
      if (this.status !== 'playing') return;
      this.synthCurrentTime += 1;
      this.listeners.onTimeUpdate?.(this.synthCurrentTime, this.synthDuration);

      if (this.synthCurrentTime >= this.synthDuration) {
        this.stopSynthPlayback();
        this.listeners.onEnded?.();
      }
    }, 1000);
  }

  private pauseSynthPlayback() {
    if (this.synthInterval) clearInterval(this.synthInterval);
    if (this.synthFakeTimer) clearInterval(this.synthFakeTimer);
    this.synthInterval = null;
    this.synthFakeTimer = null;
  }

  private resumeSynthPlayback() {
    this.startSynthPlayback(this.synthCurrentTime);
  }

  private stopSynthPlayback() {
    this.pauseSynthPlayback();
    this.isUsingSynth = false;
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
