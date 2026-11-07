import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Plus, Play, Music, X, Menu, Server, CheckCircle2, RefreshCw } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { calculateLevelFromXP, isPlayableSong } from '../utils/pureLogic';
import { Song } from '../types';
import { SongArtwork } from './common/SongArtwork';

interface TopHeaderProps {
  onOpenAddSong?: () => void;
  onOpenCreatePlaylistModal?: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenAddSong,
  onOpenCreatePlaylistModal,
  onToggleMobileMenu,
}) => {
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    songs,
    playSong,
    xp,
    streakDays,
    setActiveTab,
    backendStatus,
    vaultSyncState,
    userProfile,
  } = useMusic();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const levelInfo = calculateLevelFromXP(xp);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults: Song[] = searchQuery.trim()
    ? songs
        .filter(
          (s) =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.genre.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    library: 'Music Library',
    playlists: 'Playlists Collection',
    favorites: 'Favourites',
    recently_played: 'Recently Played Tracks',
    leaderboard: 'Shared Global Leaderboard',
    karaoke: 'Karaoke & Timed Lyrics',
    challenges: 'Music Challenges & Games',
    quest: 'Music Quest & Achievements',
    time_capsule: 'Music Time Capsule',
    memory_journal: 'Song Memory Journal',
    forgotten_songs: 'Forgotten Songs Discovery',
    mood_explorer: 'Mood Explorer',
    bucket_list: 'Music Bucket List',
    statistics: 'Listening Statistics & Analytics',
    settings: 'System & Prototype Settings',
  };

  const handlePlaySearchResult = (song: Song) => {
    playSong(song);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-[#0e0f17]/90 backdrop-blur-md border-b border-[#1e202e] flex items-center justify-between gap-4 md:gap-6 shrink-0 z-30">
      {/* Title & Mobile Hamburger */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-white md:hidden cursor-pointer hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
            {tabTitles[activeTab] || 'MelodyVault'}
          </h1>
          <p className="text-[10px] md:text-[11px] text-slate-400 truncate">
            Music Playlist and Personal Collection Management System
          </p>
        </div>
      </div>

      {/* Center Search Input */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search songs, artists, albums, or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full pl-9 pr-9 py-2 bg-[#141521] border border-[#232538] focus:border-purple-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Popup */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#151624] border border-[#27293d] rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Matching Tracks ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No songs matched "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {searchResults.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handlePlaySearchResult(song)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-purple-600/15 group transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SongArtwork
                        src={song.artwork}
                        alt={song.title}
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 group-hover:text-purple-300 truncate">
                          {song.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {song.artist} · {song.genre}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isPlayableSong(song) ? (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                          LOCAL
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          CATALOG
                        </span>
                      )}
                      <Play className={`w-4 h-4 ${isPlayableSong(song) ? 'text-slate-400 group-hover:text-purple-400' : 'text-slate-600'}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Automatic Personal Vault Sync Status Badge */}
        {vaultSyncState.status === 'scanning' && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-300 font-mono shadow-sm"
            title={`Scanning C:\\MelodyVault Sample Music (${vaultSyncState.trackCount > 0 ? `${vaultSyncState.trackCount} tracks` : 'folder'})...`}
          >
            <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
            <span className="font-semibold">Scanning Vault...</span>
          </div>
        )}
        {vaultSyncState.status === 'synced' && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-300 font-mono shadow-sm"
            title={`Personal Vault: ${vaultSyncState.trackCount} local tracks synchronized`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold">{vaultSyncState.trackCount} Tracks Synced</span>
          </div>
        )}

        {/* Java 25 & Spring Boot Backend Status Badge */}
        {backendStatus.isOnline ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono shadow-sm"
            title="Java 25 & Spring Boot 3.4.2 REST API Online at localhost:8085"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Java API :8085</span>
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[10px] text-slate-400 font-mono"
            title="Java API offline (Prototype operating in standalone browser mode)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Local Mode</span>
          </div>
        )}

        {/* Quick Action Button */}
        {onOpenAddSong && (
          <button
            onClick={onOpenAddSong}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-900/20 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Song</span>
          </button>
        )}

        {/* Quest Status Pill */}
        <button
          onClick={() => setActiveTab('quest')}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-[#171826] hover:bg-[#1e2033] border border-[#27293d] rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
          title="View Music Quest & Badges"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-200 tabular-nums font-mono">{xp} XP</span>
          <span className="text-[10px] text-purple-400 font-medium hidden sm:inline">
            Lv.{levelInfo.level}
          </span>
        </button>

        {/* User Profile Quick Pill */}
        <button
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-[#171826] hover:bg-[#1e2033] border border-[#27293d] rounded-full text-xs transition-colors shrink-0 group cursor-pointer"
          title={`${userProfile.name} • ${userProfile.tag || 'Curator'} • Click to view settings`}
        >
          <img
            src={userProfile.avatar || '/avatars/navneeth_u.jpg'}
            alt={userProfile.name}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-purple-500/40 shrink-0"
          />
          <span className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 max-w-[85px] truncate hidden md:inline">
            {userProfile.name}
          </span>
        </button>
      </div>
    </header>
  );
};
