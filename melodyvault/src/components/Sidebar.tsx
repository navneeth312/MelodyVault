import React from 'react';
import {
  Home,
  Music2,
  ListMusic,
  Heart,
  Clock,
  Mic2,
  Gamepad2,
  Trophy,
  Hourglass,
  BookHeart,
  Compass,
  Sparkles,
  BookmarkCheck,
  BarChart2,
  Settings,
  Flame,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { NavigationTab } from '../types';
import { calculateLevelFromXP } from '../utils/pureLogic';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, setSelectedPlaylistId, favorites, xp, streakDays } = useMusic();

  const levelInfo = calculateLevelFromXP(xp);

  const mainNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'library', label: 'Music Library', icon: Music2 },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'favorites', label: 'Favourites', icon: Heart, badge: favorites.length > 0 ? favorites.length : undefined },
    { id: 'recently_played', label: 'Recently Played', icon: Clock },
  ];

  const playNav: NavItem[] = [
    { id: 'karaoke', label: 'Karaoke & Lyrics', icon: Mic2 },
    { id: 'challenges', label: 'Music Challenges', icon: Gamepad2 },
    { id: 'quest', label: 'Music Quest', icon: Trophy, badge: `Lvl ${levelInfo.level}` },
  ];

  const vaultNav: NavItem[] = [
    { id: 'time_capsule', label: 'Music Time Capsule', icon: Hourglass },
    { id: 'memory_journal', label: 'Song Memory Journal', icon: BookHeart },
    { id: 'forgotten_songs', label: 'Forgotten Songs', icon: Compass },
    { id: 'mood_explorer', label: 'Mood Explorer', icon: Sparkles },
    { id: 'bucket_list', label: 'Music Bucket List', icon: BookmarkCheck },
  ];

  const systemNav: NavItem[] = [
    { id: 'statistics', label: 'Listening Statistics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (id: NavigationTab) => {
    setActiveTab(id);
    if (id !== 'playlists') {
      setSelectedPlaylistId(null);
    }
  };

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 font-semibold border-l-2 border-purple-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded text-xs ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 font-medium'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 h-full bg-[#0e0f17] border-r border-[#1e202e] flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1e202e]/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>MelodyVault</span>
              <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-purple-500/20 text-purple-400 rounded">
                PROTOTYPE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[145px]">
              Music & Memories System
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {renderSection('Library', mainNav)}
        {renderSection('Entertainment', playNav)}
        {renderSection('Personal Vault', vaultNav)}
        {renderSection('System', systemNav)}
      </div>

      {/* User Quest Mini Profile */}
      <div className="p-3 border-t border-[#1e202e] bg-[#0c0d14]/70">
        <div className="bg-[#151622] rounded-xl p-2.5 border border-[#232538]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 font-semibold text-xs flex items-center justify-center border border-purple-500/30">
                NV
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Navneeth</div>
                <div className="text-[10px] text-purple-400">{levelInfo.currentTierTitle}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              <Flame className="w-3 h-3 fill-amber-400" />
              <span>{streakDays}d</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
              <span>Level {levelInfo.level}</span>
              <span>
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNext} XP
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#25273b] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
