import React, { useState, useRef } from 'react';
import {
  X,
  Archive,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Sparkles,
  Info,
  ShieldCheck,
  HardDrive,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import {
  exportCollectionZip,
  importCollectionZip,
  validateBackupZip,
  BackupValidationReport,
  DuplicateStrategy,
  CURRENT_BACKUP_VERSION,
} from '../../services/collectionBackup';
import { isDemoSong } from '../../utils/collectionCleaner';

interface CollectionBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollectionBackupModal: React.FC<CollectionBackupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    songs,
    playlists,
    memories,
    bucketList,
    timeCapsules,
    xp,
    streakDays,
    awardXP,
    showToast,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');
  const [excludeDemoTracks, setExcludeDemoTracks] = useState(true);

  // Restore validation & progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [validationReport, setValidationReport] = useState<BackupValidationReport | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('merge_skip');
  const [restoreResult, setRestoreResult] = useState<{
    songsCount: number;
    audioFilesCount: number;
    playlistsCount: number;
    duplicateCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const personalSongs = songs.filter((s) => !isDemoSong(s));
  const localAudioSongs = (excludeDemoTracks ? personalSongs : songs).filter(
    (s) => s.isLocalImport || s.audioAvailability === 'local_file'
  );

  const handleExportZip = async () => {
    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMsg('Initiating export packaging...');

    try {
      const zipBlob = await exportCollectionZip(
        songs,
        playlists,
        memories,
        bucketList,
        {
          timeCapsules,
          xp,
          streakDays,
          excludeDemoTracks,
        },
        (current, total, message) => {
          const percent = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgressPercent(percent);
          setProgressMsg(message);
        }
      );

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `MelodyVault_Collection_Backup_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      awardXP(50, 'Exported portable music collection ZIP archive');
      showToast('MelodyVault Backup Package downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast(err.message || 'Failed to generate collection backup ZIP', 'warning');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleFilePicked = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (!file.name.toLowerCase().endsWith('.zip')) {
      showToast('Please select a valid .ZIP backup package.', 'warning');
      return;
    }

    setSelectedZipFile(file);
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMsg('Validating archive integrity and audio binaries...');
    setRestoreResult(null);

    try {
      const report = await validateBackupZip(file, songs);
      setValidationReport(report);
      if (!report.isValid) {
        showToast('Archive integrity issue detected: ' + report.errors[0], 'warning');
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      showToast('Validation failed: ' + err.message, 'warning');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedZipFile || !validationReport || !validationReport.isValid) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMsg('Restoring collection from ZIP package...');

    try {
      const result = await importCollectionZip(
        selectedZipFile,
        {
          duplicateStrategy,
          currentSongs: songs,
          currentPlaylists: playlists,
        },
        (curr, total, msg) => {
          setProgressPercent(Math.round((curr / total) * 100));
          setProgressMsg(msg);
        }
      );

      // Persist restored state directly to local storage
      localStorage.setItem('melodyvault_v1_songs', JSON.stringify(result.importedSongs));
      localStorage.setItem('melodyvault_v1_playlists', JSON.stringify(result.importedPlaylists));
      if (result.importedMemories) {
        localStorage.setItem('melodyvault_v1_memories', JSON.stringify(result.importedMemories));
      }
      if (result.importedBucketList) {
        localStorage.setItem('melodyvault_v1_bucket_list', JSON.stringify(result.importedBucketList));
      }
      if (result.importedTimeCapsules) {
        localStorage.setItem('melodyvault_v1_time_capsules', JSON.stringify(result.importedTimeCapsules));
      }

      setRestoreResult({
        songsCount: result.importedSongs.length,
        audioFilesCount: result.audioFilesRestored,
        playlistsCount: result.importedPlaylists.length,
        duplicateCount: result.duplicateCount,
      });

      awardXP(60, 'Restored portable music collection backup');
      showToast('Music collection restored! Refreshing application state...', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1600);
    } catch (err: any) {
      console.error('Restore execution failed:', err);
      showToast(err.message || 'Failed to restore collection', 'warning');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12131f] border border-[#23253b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 px-6 border-b border-[#23253b] flex items-center justify-between bg-gradient-to-r from-purple-950/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Portable Music Collection Backup &amp; Restore
              </h3>
              <p className="text-[11px] text-slate-400">
                Self-contained ZIP packages containing audio binaries, playlists, and metadata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#23253b] px-6 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('export');
              setValidationReport(null);
              setSelectedZipFile(null);
            }}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'export'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Export ZIP Archive
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'restore'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Restore &amp; Validate ZIP
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Important Sharing Clarification Notice */}
          <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/30 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-indigo-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Portability &amp; Sharing Boundary Notice</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Audio files are stored privately inside your browser's local IndexedDB. <strong>Sharing the web URL does NOT transfer your audio files.</strong> To migrate or share your collection across computers or browsers, export this complete ZIP package containing the audio binaries.
            </p>
          </div>

          {activeTab === 'export' ? (
            /* Export Section */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#161726] border border-[#24263a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white">
                    Export Package Summary
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Format v{CURRENT_BACKUP_VERSION}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#1a1b2d] border border-[#27293d]">
                    <div className="text-slate-400 text-[10px]">Collection Songs</div>
                    <div className="font-mono font-bold text-white text-sm">
                      {excludeDemoTracks ? personalSongs.length : songs.length} tracks
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1a1b2d] border border-[#27293d]">
                    <div className="text-slate-400 text-[10px]">Audio Binaries (MP3/WAV)</div>
                    <div className="font-mono font-bold text-purple-400 text-sm">
                      {localAudioSongs.length} in IndexedDB
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1a1b2d] border border-[#27293d]">
                    <div className="text-slate-400 text-[10px]">Playlists &amp; Associations</div>
                    <div className="font-mono font-bold text-white text-sm">
                      {playlists.length} playlists
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1a1b2d] border border-[#27293d]">
                    <div className="text-slate-400 text-[10px]">Memories &amp; Notes</div>
                    <div className="font-mono font-bold text-white text-sm">
                      {memories.length} memories
                    </div>
                  </div>
                </div>

                {/* Exclude demo tracks checkbox */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={excludeDemoTracks}
                    onChange={(e) => setExcludeDemoTracks(e.target.checked)}
                    className="rounded accent-purple-500 w-3.5 h-3.5"
                  />
                  <span>Exclude demonstration tracks (export only personal imported music)</span>
                </label>
              </div>

              {isProcessing && (
                <div className="space-y-2 p-3 bg-[#18192a] rounded-xl border border-purple-500/30">
                  <div className="flex justify-between text-xs text-purple-300">
                    <span>{progressMsg}</span>
                    <span className="font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#25283f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleExportZip}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 hover:scale-101 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'Creating Package...' : 'Export & Download Collection (.ZIP)'}</span>
              </button>
            </div>
          ) : (
            /* Restore Section */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => handleFilePicked(e.target.files)}
              />

              {!validationReport && (
                <div
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#292b45] hover:border-purple-500/50 bg-[#161726]/60 hover:bg-[#18192a] rounded-2xl p-8 text-center cursor-pointer transition-all"
                >
                  <FileArchive className="w-10 h-10 mx-auto text-purple-400 mb-2" />
                  <div className="text-xs font-semibold text-white">
                    Select MelodyVault Backup ZIP Package
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click to select a <code className="text-purple-300">.zip</code> package for integrity verification
                  </p>
                </div>
              )}

              {/* Validation Report UI */}
              {validationReport && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#161726] border border-[#292b45] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Package Integrity: {validationReport.isValid ? 'Verified Valid' : 'Invalid'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setValidationReport(null);
                          setSelectedZipFile(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Choose Different File
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-[#1b1c2e] rounded-lg border border-[#25283f]">
                        <div className="text-[10px] text-slate-400">Total Songs</div>
                        <div className="font-mono font-bold text-white text-sm">
                          {validationReport.totalSongsInBackup}
                        </div>
                      </div>
                      <div className="p-2 bg-[#1b1c2e] rounded-lg border border-[#25283f]">
                        <div className="text-[10px] text-slate-400">Audio Binaries</div>
                        <div className="font-mono font-bold text-purple-400 text-sm">
                          {validationReport.audioFilesFoundInZip}
                        </div>
                      </div>
                      <div className="p-2 bg-[#1b1c2e] rounded-lg border border-[#25283f]">
                        <div className="text-[10px] text-slate-400">Playlists</div>
                        <div className="font-mono font-bold text-white text-sm">
                          {validationReport.totalPlaylistsInBackup}
                        </div>
                      </div>
                    </div>

                    {/* Missing Audio Warning */}
                    {validationReport.missingAudioSongs.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Missing Audio Warning ({validationReport.missingAudioSongs.length} tracks):</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-tight">
                          The archive contains metadata for tracks whose audio binaries were not found in the ZIP package:
                        </p>
                        <ul className="text-[10px] text-amber-300 list-disc list-inside max-h-20 overflow-y-auto">
                          {validationReport.missingAudioSongs.map((m) => (
                            <li key={m.id}>
                              {m.title} — {m.artist} {m.fileName ? `(${m.fileName})` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Duplicate Strategy Selection */}
                    <div className="pt-2 border-t border-[#23253b] space-y-2">
                      <div className="font-semibold text-slate-200 text-[11px]">
                        Duplicate &amp; Reconciliation Strategy:
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1b2d] border border-[#26283d] cursor-pointer text-[11px]">
                          <input
                            type="radio"
                            name="strategy"
                            value="merge_skip"
                            checked={duplicateStrategy === 'merge_skip'}
                            onChange={() => setDuplicateStrategy('merge_skip')}
                            className="accent-purple-500"
                          />
                          <div>
                            <span className="font-semibold text-white">Merge &amp; Skip Duplicates</span>
                            <span className="text-slate-400 text-[10px] block">
                              Preserve your current songs; only add new songs from the backup.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1b2d] border border-[#26283d] cursor-pointer text-[11px]">
                          <input
                            type="radio"
                            name="strategy"
                            value="merge_overwrite"
                            checked={duplicateStrategy === 'merge_overwrite'}
                            onChange={() => setDuplicateStrategy('merge_overwrite')}
                            className="accent-purple-500"
                          />
                          <div>
                            <span className="font-semibold text-white">Merge &amp; Update Duplicates</span>
                            <span className="text-slate-400 text-[10px] block">
                              Update matching songs and add newly found songs.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1b2d] border border-[#26283d] cursor-pointer text-[11px]">
                          <input
                            type="radio"
                            name="strategy"
                            value="replace"
                            checked={duplicateStrategy === 'replace'}
                            onChange={() => setDuplicateStrategy('replace')}
                            className="accent-purple-500"
                          />
                          <div>
                            <span className="font-semibold text-white">Full Replace</span>
                            <span className="text-slate-400 text-[10px] block">
                              Replace your current library completely with the backup archive.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteRestore}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 hover:scale-101 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? 'Restoring Archive...' : 'Confirm & Restore Collection'}</span>
                  </button>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2 p-3 bg-[#18192a] rounded-xl border border-purple-500/30">
                  <div className="flex justify-between text-xs text-purple-300">
                    <span>{progressMsg}</span>
                    <span className="font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#25283f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {restoreResult && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Restoration Successful!</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Restored {restoreResult.songsCount} songs ({restoreResult.audioFilesCount} audio
                    binaries in IndexedDB) and {restoreResult.playlistsCount} playlists.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
