import React, { useState } from 'react';
import { Sparkles, Trophy, Upload, ShieldCheck, Check, Music2, ArrowRight, Lock, KeyRound, AlertCircle, UserCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { apiService } from '../../services/apiService';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
}

const AVATAR_PRESETS = [
  {
    id: 'navneeth',
    name: 'Navneeth.U',
    role: 'Vault Creator & Lead Architect',
    url: '/avatars/navneeth_u.jpg',
    isCreator: true,
  },
  {
    id: 'synthwave',
    name: 'Neon Producer',
    role: 'Synth & Electronic Specialist',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'vinyl',
    name: 'Vinyl Collector',
    role: 'Analog Warmth & Jazz Archivist',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'classical',
    name: 'Concerto Virtuoso',
    role: 'Classical & Baroque Connoisseur',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Dreamer',
    role: 'Chill Beats & Deep Focus',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'audiophile',
    name: 'Studio Master',
    role: 'Lossless & High Fidelity Curator',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'creator' | 'new_user'>('creator');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(AVATAR_PRESETS[1].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [tag, setTag] = useState('Personal Vault Curator');
  const [bio, setBio] = useState('Exploring music in MelodyVault.');
  const [joinLeaderboard, setJoinLeaderboard] = useState(true);

  // Creator passkey state
  const [creatorPassword, setCreatorPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isVerifyingCreator, setIsVerifyingCreator] = useState(false);
  const [creatorAuthError, setCreatorAuthError] = useState<string | null>(null);
  const [isCreatorVerified, setIsCreatorVerified] = useState(false);

  if (!isOpen) return null;

  const handleVerifyCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorPassword.trim()) {
      setCreatorAuthError('Please enter the Creator passkey.');
      return;
    }

    setIsVerifyingCreator(true);
    setCreatorAuthError(null);

    try {
      const res = await apiService.verifyCreatorPassword(creatorPassword.trim(), rememberDevice);
      if (res.success) {
        setIsCreatorVerified(true);
        // Complete as verified Navneeth.U Creator
        const profile: UserProfile = {
          id: 'user-navneeth',
          name: 'Navneeth.U',
          handle: '@navneeth',
          avatar: '/avatars/navneeth_u.jpg',
          tag: 'Vault Creator & Lead Architect',
          bio: 'Curating pristine personal music collections with lossless audio in MelodyVault.',
          joinedLeaderboard: true,
        };
        onComplete(profile);
      } else {
        setCreatorAuthError(res.message || 'Invalid Creator passkey. Access denied.');
      }
    } catch {
      setCreatorAuthError('Authentication server unavailable. Please try again.');
    } finally {
      setIsVerifyingCreator(false);
    }
  };

  const handleSelectPreset = (preset: typeof AVATAR_PRESETS[0]) => {
    if (preset.isCreator) {
      setActiveTab('creator');
      return;
    }
    setSelectedAvatarUrl(preset.url);
    setCustomAvatarUrl(null);
    setTag(preset.role);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomAvatarUrl(reader.result);
          setSelectedAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim() || 'Music Listener';

    // Prevent unauthorized impersonation of Navneeth.U
    if (cleanName.toLowerCase() === 'navneeth.u' || cleanName.toLowerCase() === 'navneeth') {
      setActiveTab('creator');
      setCreatorAuthError('Navneeth.U is the protected Creator identity. Please enter the passkey to proceed.');
      return;
    }

    const safeHandle = '@' + cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const profile: UserProfile = {
      id: `user-${Date.now().toString(36)}`,
      name: cleanName,
      handle: safeHandle || '@listener',
      avatar: selectedAvatarUrl,
      tag: tag || 'Music Enthusiast',
      bio: bio || 'Enjoying tunes on MelodyVault.',
      joinedLeaderboard: joinLeaderboard,
    };

    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#11121d] border border-[#27293d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="p-6 border-b border-[#1e202e] bg-gradient-to-r from-purple-950/60 via-[#161726] to-slate-900/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Welcome to MelodyVault</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Profile Setup
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose your identity to access your personal vault, quests, and leaderboard.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#131422] rounded-xl border border-[#212338]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('creator');
                setCreatorAuthError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'creator'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Continue as Navneeth.U (Creator)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('new_user');
                setCreatorAuthError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'new_user'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Join as New Listener</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Creator Authentication */}
        {activeTab === 'creator' && (
          <form onSubmit={handleVerifyCreator} className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-4 p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl">
              <img
                src="/avatars/navneeth_u.jpg"
                alt="Navneeth.U"
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-purple-500 shadow-md"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Navneeth.U</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300">
                    Lead Creator
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Vault Creator & Lead Architect of MelodyVault
                </p>
                <p className="text-[11px] text-slate-400">
                  Protected profile with verified XP ledger and administrator access.
                </p>
              </div>
            </div>

            {creatorAuthError && (
              <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{creatorAuthError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>Creator Passkey <span className="text-purple-400">*</span></span>
              </label>
              <input
                type="password"
                required
                value={creatorPassword}
                onChange={(e) => setCreatorPassword(e.target.value)}
                placeholder="Enter creator passkey"
                className="w-full px-3.5 py-2.5 bg-[#171826] border border-[#27293d] focus:border-purple-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Verified cryptographically against the MelodyVault Java backend.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberDevice"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-[#27293d] text-purple-600 focus:ring-purple-500 bg-[#171826]"
              />
              <label htmlFor="rememberDevice" className="text-xs text-slate-300 cursor-pointer select-none">
                Remember this device (stay signed in)
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('new_user')}
                className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2"
              >
                Not Navneeth? Join as a guest listener &rarr;
              </button>

              <button
                type="submit"
                disabled={isVerifyingCreator}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                {isVerifyingCreator ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>Verify & Enter Vault</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: New Listener Setup */}
        {activeTab === 'new_user' && (
          <form onSubmit={handleNewUserSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                What should we call you? <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivers or VinylCollector"
                className="w-full px-3.5 py-2.5 bg-[#171826] border border-[#27293d] focus:border-purple-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Choose your profile avatar:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`relative p-2 rounded-xl flex flex-col items-center text-center transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 shadow-lg'
                          : 'bg-[#151624] border-[#232538] hover:border-slate-600 hover:bg-[#1a1b2e]'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-12 h-12 rounded-full object-cover mb-1.5"
                      />
                      <span className="text-[10px] font-medium text-slate-200 truncate w-full">
                        {preset.name}
                      </span>
                      {preset.isCreator && (
                        <span className="text-[8px] font-mono px-1 rounded bg-purple-500/30 text-purple-300">
                          Creator
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Photo Upload */}
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-[#171826] hover:bg-[#202236] border border-[#27293d] rounded-lg text-xs text-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Upload Custom Photo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                {customAvatarUrl && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Custom photo loaded
                  </span>
                )}
              </div>
            </div>

            {/* Role / Tag & Bio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Personal Vault Curator"
                  className="w-full px-3 py-2 bg-[#171826] border border-[#27293d] focus:border-purple-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bio (Short Note)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Your musical philosophy..."
                  className="w-full px-3 py-2 bg-[#171826] border border-[#27293d] focus:border-purple-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Join Shared Leaderboard Opt-in Toggle */}
            <div className="p-3.5 bg-[#151624] border border-[#27293d] rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Join Shared Leaderboard</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                      Live
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Display your listening level and genuine quest XP on the global leaderboard. Never shares your personal audio files.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setJoinLeaderboard(!joinLeaderboard)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  joinLeaderboard ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    joinLeaderboard ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Footer Submit */}
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Independent profile saved securely to database.</span>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Enter Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
