import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  UploadCloud,
  Cpu,
  Sparkles,
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Volume2,
  Radio,
  FileAudio,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import {
  vocalSeparationService,
  VocalSeparationStatus,
  SeparationProgress,
} from '../../services/vocalSeparationService';
import { deleteSeparatedAudioRecord } from '../../services/storageIndexedDB';
import { formatDuration, isPlayableSong } from '../../utils/pureLogic';

export const VocalSeparationModal: React.FC = () => {
  const {
    isSeparationModalOpen,
    setIsSeparationModalOpen,
    selectedSongForSeparation,
    setSelectedSongForSeparation,
    refreshSeparationStatus,
    audioSource,
    setAudioSource,
    showToast,
  } = useMusic();

  const song = selectedSongForSeparation;

  const [status, setStatus] = useState<VocalSeparationStatus>({ isAvailable: false });
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isDemucsOnline, setIsDemucsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'dsp' | 'ai'>('import');

  // DSP processing state
  const [isProcessingDSP, setIsProcessingDSP] = useState(false);
  const [dspProgress, setDspProgress] = useState<SeparationProgress | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingFile, setIsImportingFile] = useState(false);

  // Load status when modal opens or song changes
  useEffect(() => {
    if (!isSeparationModalOpen || !song) return;

    let isMounted = true;
    setIsLoadingStatus(true);

    const checkStatus = async () => {
      try {
        const s = await vocalSeparationService.getStatus(song.id);
        const demucsOnline = await vocalSeparationService.checkLocalDemucsAvailable();
        if (isMounted) {
          setStatus(s);
          setIsDemucsOnline(demucsOnline);
        }
      } catch (err) {
        console.error('Error fetching separation status:', err);
      } finally {
        if (isMounted) setIsLoadingStatus(false);
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [isSeparationModalOpen, song]);

  // Handle Close
  const handleClose = () => {
    setIsSeparationModalOpen(false);
    setSelectedSongForSeparation(null);
    setDspProgress(null);
    setIsProcessingDSP(false);
  };

  if (!isSeparationModalOpen || !song) return null;

  const isPlayable = isPlayableSong(song);

  // Studio Backing Track Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp3') && !file.name.toLowerCase().endsWith('.wav')) {
      showToast('Please select a valid MP3 or WAV instrumental file.', 'warning');
      return;
    }

    setIsImportingFile(true);
    try {
      const res = await vocalSeparationService.importStudioInstrumentalTrack(song.id, file);
      if (res.success) {
        showToast(`Instrumental track for "${song.title}" imported successfully!`, 'success');
        await refreshSeparationStatus(song.id);
        const updated = await vocalSeparationService.getStatus(song.id);
        setStatus(updated);
      } else {
        showToast(res.error || 'Failed to save instrumental audio.', 'warning');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error importing instrumental file.', 'warning');
    } finally {
      setIsImportingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Offline DSP Center-Channel Cancellation
  const handleStartDSP = async () => {
    if (!isPlayable) {
      showToast('Offline separation requires an imported local audio file.', 'warning');
      return;
    }

    setIsProcessingDSP(true);
    setDspProgress({
      stage: 'decoding',
      progressPercent: 5,
      message: 'Preparing audio engine...',
    });

    try {
      const res = await vocalSeparationService.separateVocalsOfflineDSP(song, (p) => {
        setDspProgress(p);
      });

      if (res.success) {
        showToast(`Instrumental track rendered and saved to IndexedDB!`, 'success');
        await refreshSeparationStatus(song.id);
        const updated = await vocalSeparationService.getStatus(song.id);
        setStatus(updated);
      } else {
        showToast(res.error || 'Vocal isolation failed.', 'warning');
      }
    } catch (err: any) {
      showToast(err?.message || 'DSP separation error.', 'warning');
    } finally {
      setIsProcessingDSP(false);
    }
  };

  // Local Demucs AI Processing
  const handleStartDemucs = async () => {
    if (!isDemucsOnline) {
      showToast('Local Demucs companion is offline. Start the service first.', 'warning');
      return;
    }

    setIsProcessingDSP(true);
    try {
      const res = await vocalSeparationService.separateVocalsDemucsBackend(song, (p) => {
        setDspProgress(p);
      });

      if (res.success) {
        showToast('Demucs AI separation complete!', 'success');
        await refreshSeparationStatus(song.id);
        const updated = await vocalSeparationService.getStatus(song.id);
        setStatus(updated);
      } else {
        showToast(res.error || 'Demucs separation failed.', 'warning');
      }
    } catch (err: any) {
      showToast(err?.message || 'Demucs backend error.', 'warning');
    } finally {
      setIsProcessingDSP(false);
    }
  };

  // Delete Separated Stem
  const handleDeleteStem = async () => {
    if (confirm(`Remove the separated instrumental track for "${song.title}"? Your original song file remains completely untouched.`)) {
      await deleteSeparatedAudioRecord(song.id);
      await refreshSeparationStatus(song.id);
      setStatus({ isAvailable: false });
      if (audioSource === 'instrumental') {
        setAudioSource('original');
      }
      showToast('Instrumental track removed from IndexedDB.', 'info');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vocal Separation Studio"
    >
      <div
        className="bg-[#10111d] border border-purple-500/30 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#1f2136] bg-gradient-to-r from-purple-950/40 via-[#151627] to-[#10111d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Vocal Separation Studio</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Stem Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate or import isolated instrumental audio without altering your original files.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin">
          {/* Target Track Info Card */}
          <div className="p-4 rounded-2xl bg-[#161729] border border-[#23253f] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={song.artwork}
                alt={song.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0 shadow border border-purple-500/20"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate" title={song.title}>
                  {song.title}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5" title={song.artist}>
                  {song.artist} • <span className="text-slate-500">{song.album}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {isPlayable ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold inline-flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{song.fileName?.toLowerCase().endsWith('.wav') ? 'LOCAL WAV' : 'LOCAL MP3'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      CATALOG ONLY
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-500">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Separation Status Badge */}
            <div className="text-right shrink-0">
              {isLoadingStatus ? (
                <span className="text-xs text-slate-500 animate-pulse">Checking status...</span>
              ) : status.isAvailable ? (
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Instrumental Ready</span>
                  </span>
                  <div className="text-[10px] font-mono text-slate-400">
                    {status.modelUsed === 'studio_backing_track'
                      ? 'Studio Backing Track'
                      : status.modelUsed === 'dsp_center_isolation_v1'
                      ? 'Offline DSP Isolation'
                      : 'Demucs AI Stem'}{' '}
                    • {formatFileSize(status.fileSize)}
                  </div>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium">
                  <Radio className="w-3.5 h-3.5 text-slate-500" />
                  <span>Original Audio Only</span>
                </span>
              )}
            </div>
          </div>

          {/* Active Instrumental Actions Bar (if already separated) */}
          {status.isAvailable && (
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-300 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dual-Track Playback Ready</div>
                  <div className="text-[11px] text-slate-400">
                    Current active output:{' '}
                    <span className="font-semibold text-purple-300 capitalize">
                      {audioSource}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAudioSource(audioSource === 'original' ? 'instrumental' : 'original')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/40 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Switch to {audioSource === 'original' ? 'Instrumental' : 'Original'}</span>
                </button>

                <button
                  onClick={handleDeleteStem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  title="Remove separated track from IndexedDB"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Stem</span>
                </button>
              </div>
            </div>
          )}

          {/* Processing Progress Bar (if running) */}
          {isProcessingDSP && dspProgress && (
            <div className="p-4 rounded-2xl bg-[#141524] border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{dspProgress.message}</span>
                </span>
                <span className="font-mono text-white">{dspProgress.progressPercent}%</span>
              </div>
              <div className="w-full bg-[#202237] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-violet-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${dspProgress.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Separation Method Tabs */}
          <div className="space-y-4">
            <div className="flex items-center bg-[#141525] border border-[#23253d] rounded-2xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Import Studio Backing Track</span>
              </button>

              <button
                onClick={() => setActiveTab('dsp')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'dsp'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Offline DSP Vocal Filter</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Local Demucs AI (Companion)</span>
              </button>
            </div>

            {/* TAB 1: Direct Studio Instrumental Import */}
            {activeTab === 'import' && (
              <div className="p-5 rounded-2xl bg-[#141524] border border-[#22243c] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Direct Studio Backing Track Import</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Recommended • 100% Lossless
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Have an official karaoke, instrumental, or acoustic backing track for this song?
                    Import the file directly into your browser's IndexedDB. This guarantees pristine studio audio quality with zero algorithmic artifacts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#1b1c31] border border-dashed border-[#34375b] flex flex-col items-center justify-center text-center space-y-3">
                  <FileAudio className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Select Instrumental MP3 or WAV file
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Synchronized seamlessly with "{song.title}"
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,audio/mpeg,audio/wav"
                    onChange={handleFileChange}
                    className="hidden"
                    id="instrumental-file-upload"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImportingFile}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isImportingFile ? 'Saving to IndexedDB...' : 'Choose Audio File'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Offline DSP Center-Channel Cancellation */}
            {activeTab === 'dsp' && (
              <div className="p-5 rounded-2xl bg-[#141524] border border-[#22243c] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Offline DSP Center-Channel Vocal Cancellation</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Browser Native • Zero Upload
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Applies high-order phase-inversion subtraction with bass/kick crossover preservation (&lt; 140 Hz).
                    Renders an isolated instrumental stereo waveform and encodes an actual 16-bit WAV file into IndexedDB.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-1.5">
                  <div className="font-semibold text-purple-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>How it works & Transparency Disclosure:</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    This algorithm cancels center-panned mono lead vocals while preserving stereo side instruments, panning, and low-end bass frequencies. Panned backing vocals or heavy stereo reverbs may remain subtly audible. Runs 100% offline in your browser.
                  </p>
                </div>

                <button
                  onClick={handleStartDSP}
                  disabled={isProcessingDSP || !isPlayable}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Cpu className="w-4 h-4" />
                  <span>
                    {isProcessingDSP
                      ? 'Rendering Instrumental Waveform...'
                      : status.isAvailable
                      ? 'Regenerate Offline Instrumental WAV'
                      : 'Generate Offline Instrumental WAV'}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 3: Local Demucs Companion Service */}
            {activeTab === 'ai' && (
              <div className="p-5 rounded-2xl bg-[#141524] border border-[#22243c] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Local Demucs v4 AI Companion Service</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isDemucsOnline
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {isDemucsOnline ? 'Online (localhost:5000)' : 'Offline'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    MelodyVault supports Meta's deep neural source-separation model (htdemucs) running locally on your own machine.
                    No audio is ever uploaded to external cloud servers.
                  </p>
                </div>

                {isDemucsOnline ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Local Demucs AI daemon detected at <code className="font-mono">localhost:5000</code>.
                      </span>
                    </div>

                    <button
                      onClick={handleStartDemucs}
                      disabled={isProcessingDSP || !isPlayable}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Start Local Demucs Separation</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#191a2e] border border-[#2b2d49] text-xs text-slate-300 space-y-2">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      <span>How to start your local AI Companion:</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Deep neural separation models require high GPU/CPU compute (800MB–1.5GB RAM) that cannot be simulated safely in pure browser JavaScript without crashing tabs. Run our lightweight local Python helper:
                    </p>
                    <pre className="p-2.5 rounded-lg bg-black/50 font-mono text-[11px] text-purple-300 overflow-x-auto select-all">
                      pip install demucs flask flask-cors
                      {'\n'}python -m melodyvault_companion
                    </pre>
                    <p className="text-[10px] text-slate-500">
                      Once started, refresh this modal to execute full neural vocal extraction locally.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1f2136] bg-[#0d0e17] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>Separated stems are saved locally in IndexedDB</span>
          </div>

          <button
            onClick={handleClose}
            className="px-4 py-2 bg-[#1b1c30] hover:bg-[#252744] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-[#2b2d49]"
          >
            Back to Player
          </button>
        </div>
      </div>
    </div>
  );
};

