import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Music,
  HardDrive,
  ArrowRight,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

interface SafeCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafeCleanupModal: React.FC<SafeCleanupModalProps> = ({ isOpen, onClose }) => {
  const {
    songs,
    collectionAnalysis,
    cleanupDemoMusic,
    restoreDemoMusic,
    cleanupBackup,
    exportDataJSON,
    showToast,
  } = useMusic();

  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [downloadedBackup, setDownloadedBackup] = useState(false);

  if (!isOpen) return null;

  const { demoSongsCount, personalSongsCount, importedSongsCount, manualSongsCount } = collectionAnalysis;

  const handleDownloadSafetyJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MelodyVault_Safety_Backup_Before_Cleanup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedBackup(true);
    showToast('Safety backup JSON downloaded!', 'success');
  };

  const handleConfirmCleanup = () => {
    cleanupDemoMusic();
    setHasConfirmed(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleUndo = () => {
    restoreDemoMusic();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12131f] border border-purple-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 px-6 border-b border-[#23253b] flex items-center justify-between bg-gradient-to-r from-purple-950/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Personal Collection Migration
              </h3>
              <p className="text-[11px] text-slate-400">
                Safely remove bundled demo music and keep only your personal audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Main Plan Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Demo Music to Remove</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono">
                {demoSongsCount} <span className="text-xs font-normal text-rose-300">tracks</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Preloaded sample songs, mock artists, and demonstration catalog entries.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Personal Music Preserved</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono">
                {personalSongsCount} <span className="text-xs font-normal text-emerald-300">tracks</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {importedSongsCount} imported local file(s) &amp; {manualSongsCount} manual entries.
              </p>
            </div>
          </div>

          {/* Safety Guarantees Callout */}
          <div className="p-4 rounded-2xl bg-[#171829] border border-[#282a44] space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Zero-Loss Safety Guarantee</span>
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
              <li>
                <strong>No audio binary loss:</strong> Local MP3/WAV files in IndexedDB are completely untouched.
              </li>
              <li>
                <strong>Playlists &amp; memories intact:</strong> Your created playlists and memory notes are preserved.
              </li>
              <li>
                <strong>Reversible:</strong> An automatic restore snapshot is stored so you can undo anytime.
              </li>
              <li>
                <strong>Permanent setting:</strong> Demo music will not be reinserted after refresh or application restart.
              </li>
            </ul>
          </div>

          {/* Safety Pre-backup button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <div>
              <div className="font-semibold text-purple-200 text-[11px]">Download Safety Backup First</div>
              <div className="text-[10px] text-slate-400">Export current database JSON before cleanup</div>
            </div>
            <button
              onClick={handleDownloadSafetyJSON}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                downloadedBackup
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {downloadedBackup ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedBackup ? 'Backup Saved' : 'Download JSON'}</span>
            </button>
          </div>

          {/* Reversible Restore option if already cleaned */}
          {cleanupBackup && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-amber-300 text-[11px]">Previous Backup Available</div>
                <div className="text-[10px] text-slate-400">
                  Undo last cleanup and restore {cleanupBackup.removedDemoSongsCount} tracks
                </div>
              </div>
              <button
                onClick={handleUndo}
                className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo Cleanup</span>
              </button>
            </div>
          )}

          {hasConfirmed && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Demo music successfully removed! Your library is now purely personal.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#23253b] bg-[#11121d] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {demoSongsCount > 0 ? (
            <button
              onClick={handleConfirmCleanup}
              disabled={hasConfirmed}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/30 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirm Cleanup ({demoSongsCount} Demo Songs)</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Collection Clean &amp; Ready
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
