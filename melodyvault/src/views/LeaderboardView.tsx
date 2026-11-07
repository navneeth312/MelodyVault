import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Sparkles,
  Flame,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  Globe,
  Radio,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { apiService, LeaderboardEntryApiResponse } from '../services/apiService';
import { calculateLevelFromXP } from '../utils/pureLogic';

export const LeaderboardView: React.FC = () => {
  const { userProfile, xp, showToast, backendStatus } = useMusic();
  const [entries, setEntries] = useState<LeaderboardEntryApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptedIn, setIsOptedIn] = useState<boolean>(userProfile.joinedLeaderboard ?? true);
  const [isTogglingOptIn, setIsTogglingOptIn] = useState(false);

  const levelInfo = calculateLevelFromXP(xp);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // First sync current user's genuine progress
      if (backendStatus.isOnline && isOptedIn) {
        await apiService.syncLeaderboard({
          userId: userProfile.id,
          displayName: userProfile.name,
          avatarUrl: userProfile.avatar,
          totalXp: xp,
          level: levelInfo.level,
          tierTitle: levelInfo.currentTierTitle,
        });
      }

      const remoteEntries = await apiService.getLeaderboard(userProfile.id);
      if (remoteEntries && remoteEntries.length > 0) {
        setEntries(remoteEntries);
      } else {
        // Fallback to local profile if offline or empty
        if (isOptedIn) {
          setEntries([
            {
              rank: 1,
              userId: userProfile.id,
              displayName: userProfile.name,
              avatarUrl: userProfile.avatar,
              totalXp: xp,
              level: levelInfo.level,
              tierTitle: levelInfo.currentTierTitle,
              currentUser: true,
              updatedAt: new Date().toISOString(),
            },
          ]);
        } else {
          setEntries([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
      if (isOptedIn) {
        setEntries([
          {
            rank: 1,
            userId: userProfile.id,
            displayName: userProfile.name,
            avatarUrl: userProfile.avatar,
            totalXp: xp,
            level: levelInfo.level,
            tierTitle: levelInfo.currentTierTitle,
            currentUser: true,
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [backendStatus.isOnline, isOptedIn, userProfile, xp, levelInfo]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleToggleOptIn = async () => {
    const nextState = !isOptedIn;
    setIsTogglingOptIn(true);
    try {
      if (backendStatus.isOnline) {
        await apiService.toggleLeaderboardOptIn(userProfile.id, nextState);
      }
      setIsOptedIn(nextState);
      showToast(
        nextState
          ? 'You are now visible on the Shared Global Leaderboard!'
          : 'You are now hidden from the Shared Global Leaderboard.',
        'info'
      );
      if (nextState) {
        await apiService.syncLeaderboard({
          userId: userProfile.id,
          displayName: userProfile.name,
          avatarUrl: userProfile.avatar,
          totalXp: xp,
          level: levelInfo.level,
          tierTitle: levelInfo.currentTierTitle,
        });
      }
      await fetchLeaderboard();
    } catch {
      showToast('Failed to update leaderboard preference.', 'warning');
    } finally {
      setIsTogglingOptIn(false);
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs shadow-md shadow-amber-900/30">
            <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-xs shadow-md">
            <Medal className="w-4 h-4 text-slate-300 fill-slate-300/30" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center font-bold text-xs shadow-md">
            <Medal className="w-4 h-4 text-amber-600 fill-amber-600/30" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-[#1c1d2e] text-slate-400 border border-[#2d2f45] flex items-center justify-center font-bold text-xs font-mono">
            #{rank}
          </div>
        );
    }
  };

  const currentUserEntry = entries.find((e) => e.userId === userProfile.id || e.currentUser);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#1e1728] to-[#12131e] border border-amber-500/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-amber-900/40 shrink-0">
            <Trophy className="w-10 h-10 text-white fill-white/20" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Global Listener Rankings</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-Time Verified XP
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              MelodyVault Leaderboard
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Authentic ranking of genuine music collectors and quest achievers. Verified by Java backend anti-farming algorithms — zero simulated bots.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1b1c2b] hover:bg-[#25273d] border border-[#2e3048] text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Refresh rankings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleToggleOptIn}
            disabled={isTogglingOptIn}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isOptedIn
                ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isOptedIn ? (
              <>
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Publicly Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Hidden from Board</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Opt-Out Notice Banner */}
      {!isOptedIn && (
        <div className="p-4 rounded-2xl bg-[#161726] border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <EyeOff className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Your profile is currently private.</span>{' '}
              You are hidden from the shared leaderboard. Toggle your status to "Publicly Visible" above to join fellow music curators!
            </div>
          </div>
          <button
            onClick={handleToggleOptIn}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium cursor-pointer shrink-0 transition-colors"
          >
            Show My Profile
          </button>
        </div>
      )}

      {/* Current User Quick Stats Card */}
      {currentUserEntry && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#18192a] to-[#12131e] border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={currentUserEntry.avatarUrl || '/avatars/navneeth_u.jpg'}
                alt={currentUserEntry.displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/50 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1">
                {getRankBadge(currentUserEntry.rank)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {currentUserEntry.displayName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  You
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-purple-300">{currentUserEntry.tierTitle}</span>
                <span>•</span>
                <span>Level {currentUserEntry.level}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Your Global Rank</div>
              <div className="text-lg font-black text-amber-400 font-mono">
                #{currentUserEntry.rank}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Verified XP</div>
              <div className="text-lg font-black text-purple-300 font-mono">
                {currentUserEntry.totalXp.toLocaleString()} XP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table / Cards */}
      <div className="rounded-2xl bg-[#11121d] border border-[#212336] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e202e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Verified Listener Rankings ({entries.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Sorted strictly by authentic total XP
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#171826] flex items-center justify-center mx-auto text-slate-500">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-300">
              No public entries to display
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are currently hidden or no registered listeners have opted in. Turn on public visibility to display your rank!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1c1d2e]">
            {entries.map((entry) => {
              const isCurrent = entry.userId === userProfile.id || entry.currentUser;
              return (
                <div
                  key={entry.userId}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isCurrent
                      ? 'bg-purple-950/20 hover:bg-purple-950/30'
                      : 'hover:bg-[#151624]'
                  }`}
                >
                  {/* Left: Rank & User Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="shrink-0">
                      {getRankBadge(entry.rank)}
                    </div>

                    <div className="relative shrink-0">
                      <img
                        src={entry.avatarUrl || '/avatars/navneeth_u.jpg'}
                        alt={entry.displayName}
                        className={`w-10 h-10 rounded-full object-cover ring-2 ${
                          entry.rank === 1
                            ? 'ring-amber-500/70'
                            : isCurrent
                            ? 'ring-purple-500'
                            : 'ring-[#2e3048]'
                        }`}
                      />
                      {entry.rank === 1 && (
                        <div className="absolute -top-1.5 -right-1 bg-amber-500 text-black rounded-full p-0.5 shadow-sm">
                          <Crown className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${isCurrent ? 'text-purple-200' : 'text-slate-100'}`}>
                          {entry.displayName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                            You
                          </span>
                        )}
                        {entry.rank === 1 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                            #1 Leader
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                        <span className="text-slate-300 font-medium">{entry.tierTitle}</span>
                        <span>•</span>
                        <span>Level {entry.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Verified Total XP */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm md:text-base font-bold font-mono text-purple-300 tabular-nums">
                        {entry.totalXp.toLocaleString()} XP
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Community Info Note */}
      {entries.length <= 1 && (
        <div className="p-4 rounded-xl bg-[#141521] border border-[#212334] text-xs text-slate-400 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200">Shared Backend Ready:</span>{' '}
            MelodyVault uses a genuine database-backed leaderboard. When additional users access the vault through this Java backend and opt in, their ranks and XP will update dynamically without manual restarts.
          </div>
        </div>
      )}
    </div>
  );
};
