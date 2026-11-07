import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Music,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Sparkles,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import { ImportFileProgress } from '../../types';

interface ImportSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFiles: (files: File[]) => Promise<{ successCount: number; duplicateCount: number; errorCount: number }>;
  importTasks: ImportFileProgress[];
  isImporting: boolean;
}

export const ImportSongsModal: React.FC<ImportSongsModalProps> = ({
  isOpen,
  onClose,
  onImportFiles,
  importTasks,
  isImporting,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSummary, setImportSummary] = useState<{
    successCount: number;
    duplicateCount: number;
    errorCount: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setImportSummary(null);
    const summary = await onImportFiles(files);
    setImportSummary(summary);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClose = () => {
    setImportSummary(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12131f] border border-[#23253b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 px-6 border-b border-[#23253b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Import Local Audio Files
              </h3>
              <p className="text-[11px] text-slate-400">
                MP3 and WAV files with automatic ID3 metadata & artwork extraction
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isImporting && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-purple-500 bg-purple-950/20 scale-[1.01]'
                : 'border-[#292b45] hover:border-purple-500/50 bg-[#161726]/60 hover:bg-[#18192a]'
            } ${isImporting ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <FileAudio className="w-10 h-10 mx-auto text-purple-400 mb-2" />
            <div className="text-xs font-semibold text-white">
              Drag & Drop MP3 or WAV audio tracks here
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              or <span className="text-purple-400 font-semibold underline">browse files</span> on your computer
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
              <span className="px-2 py-0.5 rounded bg-[#1c1d2e] border border-[#27293d]">
                Supports: .MP3 & .WAV
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1c1d2e] border border-[#27293d]">
                Multiple files supported
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1c1d2e] border border-[#27293d]">
                IndexedDB Persistent Storage
              </span>
            </div>
          </div>

          {/* Import Summary Callout */}
          {importSummary && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                importSummary.successCount > 0
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold">
                  {importSummary.successCount > 0
                    ? `Import complete: ${importSummary.successCount} new song(s) added to Library`
                    : 'No new songs were added'}
                </div>
                <div className="text-[11px] text-slate-300">
                  {importSummary.duplicateCount > 0 && `${importSummary.duplicateCount} duplicate(s) skipped · `}
                  {importSummary.errorCount > 0 && `${importSummary.errorCount} invalid format error(s) · `}
                  Audio stored in browser IndexedDB
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            </div>
          )}

          {/* Task Progress List */}
          {importTasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Import Queue ({importTasks.length})</span>
                {isImporting && (
                  <span className="text-purple-400 font-mono text-[10px] animate-pulse">
                    Processing metadata & saving...
                  </span>
                )}
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto p-1">
                {importTasks.map((task, idx) => (
                  <div
                    key={`${task.fileName}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#161726] border border-[#24263a] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Music className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {task.songTitle || task.fileName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {task.fileName} ({formatSize(task.fileSize)})
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right ml-3">
                      {task.status === 'success' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Imported</span>
                        </span>
                      )}
                      {task.status === 'duplicate' && (
                        <span className="text-[11px] font-medium text-amber-400">
                          Already in Library
                        </span>
                      )}
                      {task.status === 'error' && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{task.error || 'Failed'}</span>
                        </span>
                      )}
                      {(task.status === 'pending' || task.status === 'parsing' || task.status === 'saving') && (
                        <span className="text-[11px] font-mono text-purple-400 animate-pulse">
                          {task.status === 'parsing' ? 'Extracting ID3...' : 'Saving...'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persistent storage note */}
          <div className="p-3 bg-[#161726] rounded-xl border border-[#222438] flex items-center gap-2.5 text-[11px] text-slate-400">
            <HardDrive className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              Imported songs are stored in IndexedDB on this device and remain available after page
              refresh.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#23253b] bg-[#141524] flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            + Select More Files
          </button>
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
