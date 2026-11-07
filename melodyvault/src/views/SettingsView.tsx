import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Download,
  Upload,
  RotateCcw,
  Code2,
  CheckCircle2,
  Copy,
  Info,
  ShieldCheck,
  Headphones,
  Archive,
  HardDrive,
  AlertCircle,
  FileArchive,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';

const EQ_PRESETS = [
  'Flat / Studio Reference',
  'Bass Boost (Sub-Woofer Emphasis)',
  'Vocal Clarity (Midrange Lift)',
  'Electronic & Club Drive',
  'Classical Acoustic Natural',
];

const QUALITY_OPTIONS = [
  'High Fidelity (320 kbps AAC/MP3)',
  'Standard Balanced (192 kbps MP3)',
  'Data Saver / Low Latency (96 kbps)',
];

export const SettingsView: React.FC = () => {
  const {
    equalizerPreset,
    setEqualizerPreset,
    audioQuality,
    setAudioQuality,
    crossfadeSecs,
    setCrossfadeSecs,
    resetToDefaultData,
    exportDataJSON,
    importDataJSON,
    showToast,
    storageStats,
    setIsBackupModalOpen,
    collectionAnalysis,
    setIsCleanupModalOpen,
    cleanupBackup,
    restoreDemoMusic,
  } = useMusic();

  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    navigator.clipboard.writeText(jsonStr);
    showToast('MelodyVault Database JSON copied to clipboard!', 'success');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const ok = importDataJSON(importJsonText);
    if (ok) {
      setShowImportBox(false);
      setImportJsonText('');
    }
  };

  const confirmReset = () => {
    resetToDefaultData();
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-purple-400" />
          <span>System & Audio Preferences</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure playback fidelity, EQ profiles, and manage prototype local data storage.
        </p>
      </div>

      {/* College Project Architecture Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#19152b] to-[#0f1019] border border-purple-800/40 p-6 md:p-8 space-y-3 shadow-xl">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">
            Academic Project Architecture
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
            College Java Prototype Phase
          </span>
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight">
          Music Playlist and Personal Collection Management System
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          <strong className="text-white">Tagline:</strong> "Your Music. Your Memories. Your Experience."
          <br />
          This interactive client prototype demonstrates full CRUD operations, state persistence,
          time-capsule logic, and real Web Audio processing before final Java SE / MySQL database
          packaging.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
          <span>Student Developer: Navneeth</span>
          <span>·</span>
          <span>Version: 1.0.0-PROTOTYPE</span>
          <span>·</span>
          <span>Storage: Browser LocalStorage (Synchronous JSON)</span>
        </div>
      </div>

      {/* Audio Engine Configuration */}
      <section className="bg-[#12131f] border border-[#212338] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Headphones className="w-4 h-4 text-purple-400" />
          <span>Audio Engine & Equalizer</span>
        </h3>

        <div className="space-y-4">
          {/* Equalizer Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Equalizer DSP Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EQ_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setEqualizerPreset(preset);
                    showToast(`EQ Profile set to: ${preset}`, 'info');
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    equalizerPreset === preset
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                      : 'bg-[#18192a] border-[#26283d] text-slate-300 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Stream Audio Quality Mode
            </label>
            <select
              value={audioQuality}
              onChange={(e) => {
                setAudioQuality(e.target.value);
                showToast(`Stream quality set to: ${e.target.value}`, 'info');
              }}
              className="w-full sm:max-w-md px-3 py-2 bg-[#18192a] border border-[#26283d] rounded-xl text-xs text-white focus:outline-none"
            >
              {QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Crossfade */}
          <div>
            <div className="flex items-center justify-between sm:max-w-md mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Track Crossfade Duration
              </label>
              <span className="text-xs font-mono text-purple-400">{crossfadeSecs} seconds</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={crossfadeSecs}
              onChange={(e) => setCrossfadeSecs(parseInt(e.target.value, 10))}
              className="w-full sm:max-w-md accent-purple-500 h-1.5 bg-[#202234] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Music Collection Backup & Restore (ZIP) with Audio Binaries */}
      <section className="bg-[#12131f] border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Archive className="w-5 h-5 text-purple-400" />
              <span>Music Collection Backup & Restore (ZIP)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Package your entire library, playlists, favorites, memories, and full audio files (MP3/WAV)
              into a portable standard ZIP archive.
            </p>
          </div>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all shrink-0"
          >
            <FileArchive className="w-4 h-4" />
            <span>Open ZIP Backup Manager</span>
          </button>
        </div>

        {/* IndexedDB Storage Usage Gauge */}
        <div className="p-4 rounded-2xl bg-[#171829] border border-[#272944] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Browser IndexedDB Local Audio Storage</span>
            </div>
            <span className="text-xs font-mono text-purple-300">
              {storageStats.usageMB.toFixed(2)} MB used · {storageStats.songCount} local track{storageStats.songCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="w-full h-2 bg-[#23253d] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(2, Math.min(100, storageStats.percent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Quota limit: ~{storageStats.quotaMB > 0 ? `${storageStats.quotaMB.toFixed(0)} MB available` : 'Dynamic system quota'}</span>
            <span>{storageStats.percent.toFixed(1)}% capacity used</span>
          </div>
        </div>

        {/* Sharing Clarification Notice */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-amber-200/90 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300">Sharing & Cross-Device Clarification:</div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Individual users' music libraries are kept strictly private and stored directly in each user's
              own browser IndexedDB. Sharing this web prototype or sending URL links does <strong>NOT</strong> automatically
              transfer your local audio tracks. To transfer your collection to another device or friend,
              you must generate a <strong>Collection ZIP Backup</strong> containing the audio binary files and restore it
              on the other machine.
            </p>
          </div>
        </div>
      </section>

      {/* Personal Collection Cleanup & Portability */}
      <section className="bg-[#12131f] border border-[#212338] rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Personal Collection Cleanup &amp; Migration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              MelodyVault operates as your personal music collection. Remove bundled demo tracks while keeping your imported audio binaries and personal data intact.
            </p>
          </div>

          <button
            onClick={() => setIsCleanupModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all shrink-0 hover:scale-102"
          >
            <Trash2 className="w-4 h-4" />
            <span>Open Cleanup Manager</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#171829] border border-[#262842] flex items-center justify-between">
            <span className="text-xs text-slate-300">Catalog Composition:</span>
            <span className="text-xs font-mono font-bold text-purple-300">
              {collectionAnalysis.personalSongsCount} Personal / {collectionAnalysis.demoSongsCount} Demo
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#171829] border border-[#262842] flex items-center justify-between">
            <span className="text-xs text-slate-300">IndexedDB Audio Files:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {collectionAnalysis.importedSongsCount} Verified Binary File{collectionAnalysis.importedSongsCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {cleanupBackup && (
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-300">Previous Cleanup Snapshot Available</div>
              <div className="text-[11px] text-slate-400">
                You can undo the last cleanup and restore {cleanupBackup.removedDemoSongsCount} tracks.
              </div>
            </div>
            <button
              onClick={() => {
                restoreDemoMusic();
              }}
              className="px-3.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Cleanup</span>
            </button>
          </div>
        )}
      </section>

      {/* Database & Prototype State Management */}
      <section className="bg-[#12131f] border border-[#212338] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Local Storage Data Management</span>
        </h3>

        <p className="text-xs text-slate-400">
          All prototype changes (playlists, song metadata, journal notes, bucket list items, and XP)
          are persistently saved in your browser's local storage. You can backup your data or reset
          to the fresh preloaded sample set anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#18192a] hover:bg-[#22243a] border border-[#282a44] text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-purple-400" />
            <span>Copy Database JSON Backup</span>
          </button>

          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-2 px-4 py-2 bg-[#18192a] hover:bg-[#22243a] border border-[#282a44] text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import Database JSON</span>
          </button>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/40 text-rose-300 rounded-xl text-xs font-semibold transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Fresh Personal State</span>
          </button>
        </div>

        {/* Import Box */}
        {showImportBox && (
          <form onSubmit={handleImportSubmit} className="pt-4 border-t border-[#1e2030] space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Paste MelodyVault Database JSON to restore:
            </label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste exported JSON structure here..."
              className="w-full font-mono text-xs p-3 bg-[#171829] border border-[#292b45] rounded-xl text-slate-100 focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportBox(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
              >
                Restore Database
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141524] border border-[#26283d] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset to Fresh Personal State?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will clear the current session and start with a fresh, empty personal music collection
              (0 library tracks, 0 playlists, 0 fabricated history). Local audio files in IndexedDB are preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Reset to Empty Personal State
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
