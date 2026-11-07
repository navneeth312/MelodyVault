import React from 'react';
import { Trash2, AlertTriangle, HardDrive, Music, Undo2, X, ListMusic } from 'lucide-react';
import { Song } from '../../types';
import { isSongWithLocalAudio } from '../../utils/bulkDelete';

interface BulkDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedSongs: Song[];
  isDeleting?: boolean;
}

export const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedSongs,
  isDeleting = false,
}) => {
  if (!isOpen || selectedSongs.length === 0) return null;

  const count = selectedSongs.length;
  const importedSongs = selectedSongs.filter(isSongWithLocalAudio);
  const importedCount = importedSongs.length;
  const manualCount = count - importedCount;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-title"
    >
      <div className="bg-[#131424] border border-rose-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl shadow-rose-950/40 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 id="bulk-delete-title" className="text-lg font-bold text-white tracking-tight">
                Delete {count} {count === 1 ? 'Selected Song' : 'Selected Songs'}?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review songs to be permanently removed from your personal vault.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Callout for Local Audio Files */}
        {importedCount > 0 ? (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {importedCount} Local Audio {importedCount === 1 ? 'File' : 'Files'} Will Be Removed
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              These tracks contain actual MP3/WAV binaries stored inside your browser's IndexedDB.
              Confirming deletion will permanently delete their audio data from local storage.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
            <Music className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {count === 1 ? 'This catalog entry' : `These ${count} catalog entries`} will be removed
              from your personal library catalog, favorites, and playlists.
            </p>
          </div>
        )}

        {/* Scrollable Song Titles Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
            <span>Songs to be deleted ({count})</span>
            {importedCount > 0 && (
              <span className="text-cyan-400 font-mono text-[10px]">
                {importedCount} audio binary, {manualCount} catalog
              </span>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#212338]/60 bg-[#0d0e18] p-2.5 rounded-2xl border border-[#212338]">
            {selectedSongs.map((song) => {
              const isLocal = isSongWithLocalAudio(song);
              return (
                <div key={song.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-700/50"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{song.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{song.artist}</div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {isLocal ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5" />
                        <span>LOCAL {song.fileName?.toLowerCase().endsWith('.wav') ? 'WAV' : 'MP3'}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        CATALOG
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety & Playlist Cascade Information */}
        <div className="p-3 rounded-xl bg-[#18192d] border border-[#262842] flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Playlist associations will be automatically unlinked.</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
            <Undo2 className="w-3.5 h-3.5" />
            <span>12s Undo Window</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950/60 transition-all hover:scale-102 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete ({count})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
