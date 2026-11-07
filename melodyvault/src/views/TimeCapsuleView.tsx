import React, { useState } from 'react';
import {
  Hourglass,
  Lock,
  Unlock,
  Plus,
  Play,
  Calendar,
  Sparkles,
  Trash2,
  X,
  Music,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { isTimeCapsuleUnlocked, formatDuration, isPlayableSong } from '../utils/pureLogic';
import { SongArtwork } from '../components/common/SongArtwork';
import { TimeCapsule, Song } from '../types';

export const TimeCapsuleView: React.FC = () => {
  const { timeCapsules, songs, createTimeCapsule, deleteTimeCapsule, playSong, showToast } = useMusic();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [capsuleTitle, setCapsuleTitle] = useState('');
  const [capsuleMessage, setCapsuleMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('2026-12-31T23:59');
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [previewCapsule, setPreviewCapsule] = useState<TimeCapsule | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capsuleTitle.trim() || selectedSongIds.length === 0) return;
    createTimeCapsule(
      capsuleTitle.trim(),
      capsuleMessage.trim() || 'A musical vault for the future.',
      new Date(unlockDate).toISOString(),
      selectedSongIds
    );
    setIsModalOpen(false);
    setCapsuleTitle('');
    setCapsuleMessage('');
    setSelectedSongIds([]);
  };

  const toggleSelectSong = (id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const getCapsuleSongs = (songIds: string[]): Song[] => {
    const songMap = new Map<string, Song>();
    songs.forEach((s) => songMap.set(s.id, s));
    return songIds.map((id) => songMap.get(id)).filter(Boolean) as Song[];
  };

  const getCountdownString = (unlockDateISO: string): string => {
    const unlockTime = new Date(unlockDateISO).getTime();
    const now = Date.now();
    const diff = unlockTime - now;

    if (diff <= 0) return 'Capsule Unlocked!';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-[#16172e] to-[#0f1019] border border-indigo-800/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Unique Feature
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-indigo-300">Nostalgic Vault</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Music Time Capsule
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Preserve playlists and intimate messages with a future unlock date. Seal away memories
            from this semester to open at graduation or future milestones.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/50 hover:scale-102 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Seal New Capsule</span>
        </button>
      </div>

      {/* Capsules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timeCapsules.map((capsule) => {
          const isUnlocked = isTimeCapsuleUnlocked(capsule.unlockDate);
          const capsuleSongs = getCapsuleSongs(capsule.songIds);

          return (
            <div
              key={capsule.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between shadow-xl ${isUnlocked
                  ? 'bg-gradient-to-b from-[#18192d] to-[#121320] border-indigo-500/40'
                  : 'bg-[#12131e] border-[#222438]'
                }`}
            >
              <div className="space-y-4">
                {/* Status chip & Countdown */}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${isUnlocked
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                  >
                    {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isUnlocked ? 'Unlocked' : 'Sealed & Locked'}</span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {getCountdownString(capsule.unlockDate)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {capsule.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 italic">
                    "{capsule.message}"
                  </p>
                </div>

                {/* Unlock date info */}
                <div className="p-3 bg-[#18192a] rounded-xl border border-[#272942] space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target Unlock Date:</span>
                  </div>
                  <div className="font-semibold text-white">
                    {new Date(capsule.unlockDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Track snippet preview */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Vault Contents ({capsuleSongs.length} songs)
                  </div>
                  <div className="space-y-1">
                    {capsuleSongs.slice(0, 3).map((song) => (
                      <div
                        key={song.id}
                        className={`flex items-center justify-between text-xs p-1.5 rounded-lg ${isUnlocked ? 'text-slate-200' : 'text-slate-500 blur-[1px]'
                          }`}
                      >
                        <span className="truncate">{song.title}</span>
                        <span className="text-[10px] font-mono">{formatDuration(song.duration)}</span>
                      </div>
                    ))}
                    {capsuleSongs.length > 3 && (
                      <div className="text-[10px] text-slate-500 pl-1.5">
                        +{capsuleSongs.length - 3} more hidden tracks...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-[#1e2030] flex items-center justify-between">
                {isUnlocked ? (
                  <button
                    onClick={() => {
                      const playable = capsuleSongs.filter(isPlayableSong);
                      if (playable.length > 0) {
                        playSong(playable[0], playable.slice(1));
                      } else {
                        showToast('No playable imported tracks found in this time capsule.', 'info');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Listen to Capsule</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setPreviewCapsule(capsule)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inspect Vault</span>
                  </button>
                )}

                <button
                  onClick={() => deleteTimeCapsule(capsule.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Remove Capsule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Time Capsule */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12131f] border border-[#23253b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 px-6 border-b border-[#23253b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hourglass className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Seal New Music Time Capsule</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Capsule Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Semester Memories 2026"
                  value={capsuleTitle}
                  onChange={(e) => setCapsuleTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Nostalgic Note to Future Self
                </label>
                <textarea
                  rows={2}
                  placeholder="Why are you sealing these songs? What are you experiencing right now?"
                  value={capsuleMessage}
                  onChange={(e) => setCapsuleMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Future Unlock Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18192a] border border-[#2b2d45] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-2">
                  Select Songs to Vault ({selectedSongIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#151624] rounded-xl border border-[#26283d]">
                  {songs.map((song) => {
                    const isSelected = selectedSongIds.includes(song.id);
                    return (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => toggleSelectSong(song.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${isSelected
                            ? 'bg-indigo-950/40 border border-indigo-500 text-indigo-200'
                            : 'hover:bg-[#1f2033] text-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SongArtwork
                            src={song.artwork}
                            alt={song.title}
                            className="w-7 h-7 rounded object-cover"
                          />
                          <span className="text-xs truncate">{song.title} - {song.artist}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {formatDuration(song.duration)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#23253b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!capsuleTitle.trim() || selectedSongIds.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
                >
                  Seal Capsule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inspect Vault */}
      {previewCapsule && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12131f] border border-[#23253b] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Vault Sealed</span>
              </h3>
              <button
                onClick={() => setPreviewCapsule(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              "{previewCapsule.message}"
            </p>
            <div className="p-3 bg-[#18192a] rounded-xl text-xs text-slate-400">
              This capsule will unlock automatically on{' '}
              <strong className="text-white">
                {new Date(previewCapsule.unlockDate).toLocaleDateString()}
              </strong>
              . Songs remain sealed to preserve the emotional rush of rediscovery.
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewCapsule(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
