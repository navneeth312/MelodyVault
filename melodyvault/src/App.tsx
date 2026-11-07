import React, { useState } from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { PlayerBar } from './components/PlayerBar';
import { QueueDrawer } from './components/QueueDrawer';

// Modals
import { AddEditSongModal } from './components/modals/AddEditSongModal';
import { AddToPlaylistModal } from './components/modals/AddToPlaylistModal';
import { CreateEditPlaylistModal } from './components/modals/CreateEditPlaylistModal';
import { AttachMemoryModal } from './components/modals/AttachMemoryModal';
import { ImportSongsModal } from './components/modals/ImportSongsModal';
import { CollectionBackupModal } from './components/modals/CollectionBackupModal';
import { SafeCleanupModal } from './components/modals/SafeCleanupModal';

// Views
import { DashboardView } from './views/DashboardView';
import { MusicLibraryView } from './views/MusicLibraryView';
import { PlaylistsView } from './views/PlaylistsView';
import { FavoritesView } from './views/FavoritesView';
import { RecentlyPlayedView } from './views/RecentlyPlayedView';
import { KaraokeView } from './views/KaraokeView';
import { MusicChallengesView } from './views/MusicChallengesView';
import { MusicQuestView } from './views/MusicQuestView';
import { TimeCapsuleView } from './views/TimeCapsuleView';
import { SongMemoryJournalView } from './views/SongMemoryJournalView';
import { ForgottenSongsView } from './views/ForgottenSongsView';
import { MoodExplorerView } from './views/MoodExplorerView';
import { MusicBucketListView } from './views/MusicBucketListView';
import { ListeningStatisticsView } from './views/ListeningStatisticsView';
import { SettingsView } from './views/SettingsView';

import { Song, Playlist } from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainShell: React.FC = () => {
  const {
    activeTab,
    toast,
    hideToast,
    addSong,
    updateSong,
    createPlaylist,
    updatePlaylist,
    addMemory,
    isImportModalOpen,
    setIsImportModalOpen,
    importAudioFiles,
    importTasks,
    isImporting,
    isBackupModalOpen,
    setIsBackupModalOpen,
    isCleanupModalOpen,
    setIsCleanupModalOpen,
  } = useMusic();

  // Modals state
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
  const [songForPlaylist, setSongForPlaylist] = useState<Song | null>(null);

  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const [isAttachMemoryModalOpen, setIsAttachMemoryModalOpen] = useState(false);
  const [songForMemory, setSongForMemory] = useState<Song | null>(null);

  // Handlers
  const handleOpenAddSong = () => {
    setEditingSong(null);
    setIsAddSongModalOpen(true);
  };

  const handleOpenEditSong = (song: Song) => {
    setEditingSong(song);
    setIsAddSongModalOpen(true);
  };

  const handleOpenAddToPlaylist = (song: Song) => {
    setSongForPlaylist(song);
    setIsAddToPlaylistModalOpen(true);
  };

  const handleOpenCreatePlaylist = () => {
    setEditingPlaylist(null);
    setIsCreatePlaylistModalOpen(true);
  };

  const handleOpenEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setIsCreatePlaylistModalOpen(true);
  };

  const handleOpenAttachMemory = (song: Song) => {
    setSongForMemory(song);
    setIsAttachMemoryModalOpen(true);
  };

  const handleSaveSong = (songData: any) => {
    if (editingSong) {
      updateSong({ ...editingSong, ...songData });
    } else {
      addSong(songData);
    }
  };

  const handleSavePlaylist = (name: string, description: string, coverGradient: string) => {
    if (editingPlaylist) {
      updatePlaylist({
        ...editingPlaylist,
        name,
        description,
        coverGradient,
      });
    } else {
      createPlaylist(name, description, coverGradient);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenCreatePlaylist={handleOpenCreatePlaylist}
            onOpenAddSong={handleOpenAddSong}
          />
        );
      case 'library':
        return (
          <MusicLibraryView
            onOpenAddSong={handleOpenAddSong}
            onOpenEditSong={handleOpenEditSong}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
          />
        );
      case 'playlists':
        return (
          <PlaylistsView
            onOpenCreatePlaylist={handleOpenCreatePlaylist}
            onOpenEditPlaylist={handleOpenEditPlaylist}
          />
        );
      case 'favorites':
        return <FavoritesView onOpenAddToPlaylist={handleOpenAddToPlaylist} />;
      case 'recently_played':
        return <RecentlyPlayedView onOpenAddToPlaylist={handleOpenAddToPlaylist} />;
      case 'karaoke':
        return <KaraokeView />;
      case 'challenges':
        return <MusicChallengesView />;
      case 'quest':
        return <MusicQuestView />;
      case 'time_capsule':
        return <TimeCapsuleView />;
      case 'memory_journal':
        return <SongMemoryJournalView onOpenAttachMemory={handleOpenAttachMemory} />;
      case 'forgotten_songs':
        return <ForgottenSongsView onOpenAddToPlaylist={handleOpenAddToPlaylist} />;
      case 'mood_explorer':
        return <MoodExplorerView />;
      case 'bucket_list':
        return <MusicBucketListView />;
      case 'statistics':
        return <ListeningStatisticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onOpenCreatePlaylist={handleOpenCreatePlaylist}
            onOpenAddSong={handleOpenAddSong}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0d14] text-slate-100 font-sans select-none">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header */}
        <TopHeader
          onOpenAddSong={handleOpenAddSong}
          onOpenCreatePlaylistModal={handleOpenCreatePlaylist}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {renderActiveView()}
        </main>

        {/* Persistent Bottom Player */}
        <PlayerBar />

        {/* Up Next Queue Drawer */}
        <QueueDrawer />

        {/* Global Toast Alert */}
        {toast && (
          <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#171829] border border-[#2a2c48] shadow-2xl text-xs text-white max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-purple-400 shrink-0" />}
            <span className="flex-1 font-medium">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  hideToast();
                }}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer shrink-0"
              >
                {toast.action.label}
              </button>
            )}
            <button onClick={hideToast} className="p-1 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modals */}
        <AddEditSongModal
          isOpen={isAddSongModalOpen}
          onClose={() => setIsAddSongModalOpen(false)}
          onSave={handleSaveSong}
          initialSong={editingSong}
        />

        <AddToPlaylistModal
          isOpen={isAddToPlaylistModalOpen}
          onClose={() => setIsAddToPlaylistModalOpen(false)}
          song={songForPlaylist}
        />

        <CreateEditPlaylistModal
          isOpen={isCreatePlaylistModalOpen}
          onClose={() => setIsCreatePlaylistModalOpen(false)}
          onSave={handleSavePlaylist}
          initialPlaylist={editingPlaylist}
        />

        <AttachMemoryModal
          isOpen={isAttachMemoryModalOpen}
          onClose={() => setIsAttachMemoryModalOpen(false)}
          onSave={addMemory}
          song={songForMemory}
        />

        <ImportSongsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportFiles={importAudioFiles}
          importTasks={importTasks}
          isImporting={isImporting}
        />

        <CollectionBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
        />

        <SafeCleanupModal
          isOpen={isCleanupModalOpen}
          onClose={() => setIsCleanupModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainShell />
    </MusicProvider>
  );
}
