import React, { useState } from 'react';
import { Sparkles, Play, Shuffle, Heart, Radio, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song, SongMood } from '../types';
import { formatDuration } from '../utils/pureLogic';

interface MoodCard {
  mood: SongMood;
  title: string;
  tagline: string;
  gradient: string;
  accentColor: string;
  description: string;
}

const MOOD_COLLECTIONS: MoodCard[] = [
  {
    mood: 'Midnight Drive',
    title: 'Midnight Drive',
    tagline: 'Neon asphalt & analog synthetics',
    gradient: 'from-purple-950 via-indigo-950 to-slate-950',
    accentColor: 'text-purple-400',
    description: 'Cinematic arpeggios, driving synthwave basslines, and brooding nocturnal rhythm.',
  },
  {
    mood: 'Chill Lo-Fi',
    title: 'Chill Lo-Fi & Study',
    tagline: 'Warm tape saturation & coffee aromas',
    gradient: 'from-amber-950 via-stone-900 to-zinc-950',
    accentColor: 'text-amber-400',
    description: 'Dusty vinyl beats, rhodes piano chords, and soothing rainy day acoustic vibrations.',
  },
  {
    mood: 'Euphoric',
    title: 'Euphoric Horizons',
    tagline: 'Sun-drenched bliss & golden hour chords',
    gradient: 'from-violet-950 via-fuchsia-950 to-neutral-900',
    accentColor: 'text-fuchsia-400',
    description: 'Uplifting indie pop, lush synthesizers, and soaring melodic hooks.',
  },
  {
    mood: 'Deep Focus',
    title: 'Deep Focus & Flowstate',
    tagline: 'Alpha waves & minimalist soundscapes',
    gradient: 'from-slate-900 via-blue-950 to-neutral-950',
    accentColor: 'text-blue-400',
    description: 'Hypnotic ambient drones, organic white noise, and immersive coding resonance.',
  },
  {
    mood: 'High Energy',
    title: 'High-Voltage Overdrive',
    tagline: 'Pure adrenaline & crunchy guitars',
    gradient: 'from-rose-950 via-purple-950 to-black',
    accentColor: 'text-rose-400',
    description: 'Fast tempos, electric overdrive, driving funk horns, and pulse-pounding workout anthems.',
  },
  {
    mood: 'Romantic',
    title: 'Acoustic Romance',
    tagline: 'Nylon strings & intimate melodies',
    gradient: 'from-rose-950 via-pink-950 to-slate-950',
    accentColor: 'text-pink-400',
    description: 'Spanish flamenco guitars, delicate vocal harmonies, and candlelit ballads.',
  },
  {
    mood: 'Melancholic',
    title: 'Melancholic Reflections',
    tagline: 'Quiet piano cadenzas & rainy Paris',
    gradient: 'from-cyan-950 via-slate-900 to-neutral-950',
    accentColor: 'text-cyan-400',
    description: 'Solitary piano sonatas, classical minor keys, and poignant introspection.',
  },
];

export const MoodExplorerView: React.FC = () => {
  const { songs, playSong, toggleFavorite } = useMusic();
  const [selectedMood, setSelectedMood] = useState<SongMood>('Midnight Drive');

  const activeMoodInfo = MOOD_COLLECTIONS.find((m) => m.mood === selectedMood) || MOOD_COLLECTIONS[0];
  const matchingSongs = songs.filter((s) => s.mood === selectedMood);

  const handlePlayMoodRadio = (shuffle = false) => {
    if (matchingSongs.length === 0) return;
    if (shuffle) {
      const shuffled = [...matchingSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled.slice(1));
    } else {
      playSong(matchingSongs[0], matchingSongs.slice(1));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#19152b] to-[#0f1019] border border-purple-800/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Emotional Sonic Landscapes
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-purple-300">Mood Explorer</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Explore Music by Atmosphere
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Organize and audition your collection mapped directly to your current psychological state.
            Whether coding at 2 AM or studying at a rainy coffee shop, dial into the exact mood.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePlayMoodRadio(false)}
            disabled={matchingSongs.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/50 hover:scale-102 transition-all disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play {activeMoodInfo.title}</span>
          </button>
        </div>
      </div>

      {/* Mood Selector Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {MOOD_COLLECTIONS.map((card) => {
          const isSelected = selectedMood === card.mood;
          const count = songs.filter((s) => s.mood === card.mood).length;
          return (
            <button
              key={card.mood}
              onClick={() => setSelectedMood(card.mood)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? `bg-gradient-to-br ${card.gradient} border-white shadow-lg ring-2 ring-purple-500/40 scale-102`
                  : 'bg-[#12131e] border-[#222438] hover:border-slate-600'
              }`}
            >
              <div className="space-y-1">
                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {card.title}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{card.tagline}</div>
              </div>
              <div className="mt-3 text-[10px] font-mono text-slate-400">
                {count} {count === 1 ? 'track' : 'tracks'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Mood Detail Section */}
      <div className="rounded-3xl bg-[#12131f] border border-[#212338] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2030]">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className={activeMoodInfo.accentColor}>{activeMoodInfo.title}</span>
              <span className="text-xs text-slate-400 font-normal">
                ({matchingSongs.length} songs)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{activeMoodInfo.description}</p>
          </div>

          <button
            onClick={() => handlePlayMoodRadio(true)}
            disabled={matchingSongs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1b1c2e] hover:bg-[#252840] text-slate-200 rounded-xl text-xs font-semibold border border-[#2d304a] transition-colors shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-400" />
            <span>Shuffle Mood Mix</span>
          </button>
        </div>

        {matchingSongs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No songs assigned to this mood category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {matchingSongs.map((song) => (
              <div
                key={song.id}
                className="p-3.5 rounded-2xl bg-[#151625] hover:bg-[#1a1c2e] border border-[#222438] hover:border-purple-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group/cover shrink-0">
                    <img
                      src={song.artwork}
                      alt={song.title}
                      className="w-12 h-12 rounded-xl object-cover shadow"
                    />
                    <button
                      onClick={() => playSong(song)}
                      className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Play className="w-4 h-4 fill-white text-white translate-x-0.2" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                      {song.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{song.artist}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatDuration(song.duration)} · {song.genre}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleFavorite(song.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    song.isFavorite
                      ? 'text-rose-500'
                      : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
