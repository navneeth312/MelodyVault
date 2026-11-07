import React from 'react';
import {
  Trophy,
  Flame,
  Award,
  Star,
  CheckCircle2,
  Lock,
  Sparkles,
  UserCheck,
  Compass,
  Hourglass,
  BookHeart,
  Mic2,
  FolderPlus,
  Play,
  Moon,
  Clock,
  History,
  ShieldCheck,
  Music,
  Headphones,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { calculateLevelFromXP } from '../utils/pureLogic';
import { DynamicQuest } from '../services/questService';

export const MusicQuestView: React.FC = () => {
  const {
    xp,
    streakDays,
    badges,
    userProfile,
    activeQuests,
    questHistory,
    claimQuestReward,
    dailyListeningXPToday,
    dailyListeningXPCap,
    songs,
    playlists,
    timeCapsules,
    memories,
  } = useMusic();

  const levelInfo = calculateLevelFromXP(xp);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Play':
        return Play;
      case 'FolderPlus':
        return FolderPlus;
      case 'Mic2':
        return Mic2;
      case 'Hourglass':
        return Hourglass;
      case 'BookHeart':
        return BookHeart;
      case 'Trophy':
        return Trophy;
      case 'Moon':
        return Moon;
      case 'Compass':
        return Compass;
      default:
        return Star;
    }
  };

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const importedTracksCount = songs.filter((s) => s.source === 'user_import' && s.isLocalImport).length;

  const dailyQuests = activeQuests.filter((q) => q.period === 'daily');
  const weeklyQuests = activeQuests.filter((q) => q.period === 'weekly');

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Hero: Authenticated Listener Profile Card */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#18152c] to-[#101221] border border-purple-800/40 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* User Info & Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-20 h-20 md:w-24 md:md-24 rounded-2xl object-cover border-2 border-purple-500/50 shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 bg-purple-600 text-[10px] font-bold text-white px-2 py-0.5 rounded-full border border-purple-400">
                Lv.{levelInfo.level}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                  Authenticated Personal Vault
                </span>
                <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  {streakDays}-Day Active Streak
                </span>
              </div>

              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {userProfile.name}
                </h1>
                <span className="text-xs font-mono text-purple-400/80 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/30">
                  {userProfile.handle}
                </span>
              </div>

              <p className="text-xs text-slate-300">
                {levelInfo.currentTierTitle} · {userProfile.bio}
              </p>
            </div>
          </div>

          {/* XP & Daily Listening Cap Progress Widgets */}
          <div className="w-full lg:w-96 space-y-3 shrink-0">
            {/* Level XP Progress */}
            <div className="bg-[#141525]/90 border border-[#272942] rounded-2xl p-4 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Listener XP</span>
                <span className="text-xs font-bold text-purple-300 font-mono">{xp} XP</span>
              </div>
              <div className="w-full h-2.5 bg-[#25283f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-300"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{levelInfo.xpInCurrentLevel} XP</span>
                <span className="text-purple-400">
                  {levelInfo.xpNeededForNext - levelInfo.xpInCurrentLevel} XP to Level {levelInfo.level + 1}
                </span>
              </div>
            </div>

            {/* Daily Listening Cap */}
            <div className="bg-[#121320]/80 border border-[#212338] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400">Daily Listening XP Cap:</span>
              </div>
              <span className="font-mono font-semibold text-purple-300">
                {dailyListeningXPToday} / {dailyListeningXPCap} XP
              </span>
            </div>
          </div>
        </div>

        {/* Collection Metric Pills */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-900/30">
          <div className="bg-purple-950/20 border border-purple-800/20 rounded-xl p-3 flex items-center gap-3">
            <Music className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">{importedTracksCount}</div>
              <div className="text-[10px] text-slate-400">Imported Audio Tracks</div>
            </div>
          </div>
          <div className="bg-purple-950/20 border border-purple-800/20 rounded-xl p-3 flex items-center gap-3">
            <FolderPlus className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">{playlists.length}</div>
              <div className="text-[10px] text-slate-400">Curated Playlists</div>
            </div>
          </div>
          <div className="bg-purple-950/20 border border-purple-800/20 rounded-xl p-3 flex items-center gap-3">
            <Hourglass className="w-4 h-4 text-violet-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">{timeCapsules.length}</div>
              <div className="text-[10px] text-slate-400">Time Capsules Sealed</div>
            </div>
          </div>
          <div className="bg-purple-950/20 border border-purple-800/20 rounded-xl p-3 flex items-center gap-3">
            <BookHeart className="w-4 h-4 text-pink-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">{memories.length}</div>
              <div className="text-[10px] text-slate-400">Journal Memories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Music Quests Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Dynamic Music Quests</span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalized challenges adapted to your {importedTracksCount} locally imported tracks. Reset daily and weekly.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Daily quests refresh at midnight</span>
          </div>
        </div>

        {importedTracksCount === 0 && (
          <div className="p-5 rounded-2xl bg-[#141525] border border-purple-500/20 text-center space-y-2">
            <p className="text-sm font-semibold text-purple-200">No imported audio tracks found in your vault yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Import local MP3 or WAV audio files into your Music Library to generate adaptive listening quests!
            </p>
          </div>
        )}

        {/* Daily Quests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dailyQuests.map((quest) => {
            const isCompleted = quest.isCompleted;
            const isClaimed = quest.isClaimed;
            const percent = Math.min(100, Math.round((quest.currentCount / quest.targetCount) * 100));

            return (
              <div
                key={quest.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isClaimed
                    ? 'bg-[#11121d] border-[#1e202e] opacity-70'
                    : isCompleted
                    ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/30'
                    : 'bg-[#141525] border-[#222438]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Daily Quest
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      +{quest.xpReward} XP
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{quest.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{quest.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Progress</span>
                      <span className="text-white font-bold">
                        {quest.currentCount} / {quest.targetCount}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#25283f] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-purple-500 to-violet-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quest Action Button */}
                  {isClaimed ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 rounded-xl bg-[#1b1c2b] text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Reward Claimed</span>
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => claimQuestReward(quest.id)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Claim +{quest.xpReward} XP</span>
                    </button>
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-[#171829] text-slate-500 text-xs text-center font-medium border border-[#212338]">
                      In Progress ({percent}%)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Quests Shelf */}
        {weeklyQuests.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Weekly Vault Challenges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyQuests.map((quest) => {
                const isCompleted = quest.isCompleted;
                const isClaimed = quest.isClaimed;
                const percent = Math.min(100, Math.round((quest.currentCount / quest.targetCount) * 100));

                return (
                  <div
                    key={quest.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isClaimed
                        ? 'bg-[#11121d] border-[#1e202e] opacity-70'
                        : isCompleted
                        ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/30'
                        : 'bg-[#141525] border-[#222438]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          Weekly Challenge
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          +{quest.xpReward} XP
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{quest.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{quest.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Weekly Progress</span>
                          <span className="text-white font-bold">
                            {quest.currentCount} / {quest.targetCount}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#25283f] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {isClaimed ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 rounded-xl bg-[#1b1c2b] text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default border border-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reward Claimed</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          onClick={() => claimQuestReward(quest.id)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Claim +{quest.xpReward} XP</span>
                        </button>
                      ) : (
                        <div className="py-2 px-3 rounded-xl bg-[#171829] text-slate-500 text-xs text-center font-medium border border-[#212338]">
                          In Progress ({percent}%)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 2-Column Split: Achievement Badges & Quest Completion History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Badges (7 cols) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Achievement Badges</span>
              </h2>
              <p className="text-xs text-slate-400">
                {unlockedCount} of {badges.length} badges unlocked
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((badge) => {
              const Icon = getBadgeIcon(badge.iconName);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    badge.isUnlocked
                      ? 'bg-[#141525] border-purple-500/30 shadow-md'
                      : 'bg-[#11121d] border-[#1e202e] opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow ${
                      badge.isUnlocked
                        ? 'bg-gradient-to-br from-purple-600 to-violet-500 text-white'
                        : 'bg-[#1c1d2e] text-slate-500'
                    }`}
                  >
                    {badge.isUnlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{badge.title}</span>
                      {badge.isUnlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{badge.description}</p>
                    <div className="pt-1 text-[10px] font-mono text-purple-400">
                      {badge.isUnlocked ? 'Unlocked' : `Progress: ${badge.currentCount}/${badge.requirementCount}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Quest Completion History Ledger (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <span>Quest Completion Ledger</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Persistent audit history of verified quest completions
              </p>
            </div>
          </div>

          <div className="bg-[#12131f] border border-[#212338] rounded-2xl p-4 shadow-xl space-y-3">
            {questHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p>No quests claimed yet.</p>
                <p className="text-[10px] text-slate-600">Complete daily and weekly quests above to record rewards.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e2030] max-h-96 overflow-y-auto">
                {questHistory.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-white truncate">{item.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {new Date(item.completedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 shrink-0">
                      +{item.xpAwarded} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};