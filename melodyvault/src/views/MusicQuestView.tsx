import React from 'react';
import {
  Trophy,
  Flame,
  Award,
  Star,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  Compass,
  Hourglass,
  BookHeart,
  Mic2,
  FolderPlus,
  Play,
  Moon,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { calculateLevelFromXP } from '../utils/pureLogic';
import { QuestBadge } from '../types';

export const MusicQuestView: React.FC = () => {
  const { xp, streakDays, badges, leaderboard } = useMusic();
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

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Level Card */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#18152c] to-[#11121d] border border-purple-800/40 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Listener Journey & Gamification
              </span>
              <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {streakDays}-Day Active Streak
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Level {levelInfo.level} · {levelInfo.currentTierTitle}
            </h1>
            <p className="text-xs text-slate-300 max-w-lg">
              Earn XP by listening to songs, creating themed playlists, completing daily challenges,
              and cataloging personal memories.
            </p>
          </div>

          {/* XP Progress Capsule */}
          <div className="bg-[#141525]/90 border border-[#272942] rounded-2xl p-5 w-full md:w-80 space-y-3 shrink-0 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Current Progress</span>
              <span className="text-xs font-bold text-purple-300 font-mono">{xp} Total XP</span>
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
        </div>
      </div>

      {/* 2-Column Split: Achievement Badges & Demo Leaderboard */}
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

        {/* Right Column: Demo Leaderboard (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Classroom Leaderboard</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Populated with demo classmate profiles for prototype testing
              </p>
            </div>
          </div>

          <div className="bg-[#12131f] border border-[#212338] rounded-2xl p-3 divide-y divide-[#1e2030] shadow-xl">
            {leaderboard.map((user, idx) => (
              <div
                key={user.id}
                className={`py-3 px-3 flex items-center justify-between rounded-xl transition-colors ${
                  user.isCurrentUser ? 'bg-purple-950/30 border border-purple-500/30' : 'hover:bg-[#18192a]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 text-center text-xs font-bold font-mono ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-purple-500/20 shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {user.isCurrentUser && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{user.tag}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-purple-300 font-mono tabular-nums">
                    {user.xp} XP
                  </div>
                  <div className="text-[10px] text-slate-500">Lv.{user.level}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
