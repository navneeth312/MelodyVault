import React from 'react';
import { Trash2, CheckSquare, X, Check, Music2, HardDrive } from 'lucide-react';

interface BulkSelectionToolbarProps {
  selectedCount: number;
  totalFilteredCount: number;
  importedAudioCount: number;
  isAllFilteredSelected: boolean;
  onSelectAllFiltered: () => void;
  onDeselectAll: () => void;
  onRequestDelete: () => void;
  onCancel?: () => void;
}

export const BulkSelectionToolbar: React.FC<BulkSelectionToolbarProps> = ({
  selectedCount,
  totalFilteredCount,
  importedAudioCount,
  isAllFilteredSelected,
  onSelectAllFiltered,
  onDeselectAll,
  onRequestDelete,
  onCancel,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk Selection Actions"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[94vw] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-[#151627]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-2xl shadow-purple-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
        {/* Count and metadata badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-600/25 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
            <CheckSquare className="w-4 h-4" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{selectedCount}</span>
              <span className="text-slate-300 font-medium">
                {selectedCount === 1 ? 'song selected' : 'songs selected'}
              </span>
            </div>

            {importedAudioCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <HardDrive className="w-3 h-3" />
                <span>
                  {importedAudioCount} local audio {importedAudioCount === 1 ? 'file' : 'files'}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Select / Deselect All in View */}
          <button
            onClick={onSelectAllFiltered}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#202238] hover:bg-[#2b2d4b] border border-[#333658] text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
            title={
              isAllFilteredSelected
                ? `Deselect all ${totalFilteredCount} songs in current view`
                : `Select all ${totalFilteredCount} songs in current view`
            }
          >
            {isAllFilteredSelected ? (
              <>
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Deselect View</span>
                <span className="sm:hidden">Deselect</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <span>Select All ({totalFilteredCount})</span>
              </>
            )}
          </button>

          {/* Deselect All globally */}
          <button
            onClick={onDeselectAll}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            title="Deselect all songs"
            aria-label="Clear all selections"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Delete Selected CTA */}
          <button
            onClick={onRequestDelete}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-lg shadow-rose-950/60 transition-all hover:scale-102 cursor-pointer ml-1"
            title={`Delete ${selectedCount} selected song${selectedCount === 1 ? '' : 's'}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete ({selectedCount})</span>
          </button>

          {/* Cancel Selection Mode CTA */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-xl bg-[#202238] hover:bg-[#2b2d4b] border border-[#333658] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold ml-1"
              title="Cancel and exit selection mode"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
