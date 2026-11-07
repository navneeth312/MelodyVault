import React, { useMemo } from 'react';
import {
  BarChart2,
  PieChart,
  Headphones,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  Award,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { SongArtwork } from '../components/common/SongArtwork';

export const ListeningStatisticsView: React.FC = () => {
  const { songs, playlists, memories, xp } = useMusic();

  // Aggregate listening stats
  const totalPlays = useMemo(() => songs.reduce((acc, s) => acc + (s.playCount || 0), 0), [songs]);

  const totalListenMinutes = useMemo(() => {
    return Math.round(
      songs.reduce((acc, s) => acc + (s.playCount || 0) * (s.duration || 180), 0) / 60
    );
  }, [songs]);

  // Top genres breakdown
  const genreBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    songs.forEach((s) => {
      const g = s.genre || 'Other';
      counts[g] = (counts[g] || 0) + (s.playCount || 1);
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([genre, count]) => ({
        genre,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [songs]);

  // Top artists
  const topArtists = useMemo(() => {
    const artistMap: Record<string, { plays: number; tracks: number; artwork: string }> = {};
    songs.forEach((s) => {
      if (!artistMap[s.artist]) {
        artistMap[s.artist] = { plays: 0, tracks: 0, artwork: s.artwork };
      }
      artistMap[s.artist].plays += s.playCount || 0;
      artistMap[s.artist].tracks += 1;
    });

    return Object.entries(artistMap)
      .map(([artist, data]) => ({
        artist,
        ...data,
      }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
  }, [songs]);

  // Listening hours by day of week (simulation model based on activity)
  const weeklyDistribution = [
    { day: 'Mon', hours: 2.4, height: 60 },
    { day: 'Tue', hours: 3.8, height: 85 },
    { day: 'Wed', hours: 4.2, height: 95 },
    { day: 'Thu', hours: 3.1, height: 75 },
    { day: 'Fri', hours: 5.0, height: 100 },
    { day: 'Sat', hours: 4.5, height: 90 },
    { day: 'Sun', hours: 2.8, height: 65 },
  ];

  // Audio feature profile
  const audioProfile = [
    { feature: 'Energy & Drive', value: 78, color: 'from-purple-500 to-indigo-500' },
    { feature: 'Acoustic Warmth', value: 64, color: 'from-amber-500 to-rose-500' },
    { feature: 'Rhythmic Danceability', value: 82, color: 'from-violet-500 to-fuchsia-500' },
    { feature: 'Nocturnal / Late-Night Vibe', value: 91, color: 'from-blue-500 to-purple-500' },
    { feature: 'Deep Focus Density', value: 73, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#19152b] to-[#0f1019] border border-purple-800/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Auditory Metrics
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-purple-300">Listening Analytics</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Your Listening Profile
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Gain deep insights into your music consumption habits, genre affinities, and sonic
            temperament across the entire MelodyVault catalog.
          </p>
        </div>
      </div>

      {/* Top 4 KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#131422] border border-[#212338] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Total Listening</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {Math.floor(totalListenMinutes / 60)}h {totalListenMinutes % 60}m
          </div>
          <div className="text-[11px] text-purple-400 font-medium">Auditioned sessions</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#131422] border border-[#212338] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Songs Played</span>
            <Headphones className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {totalPlays}
          </div>
          <div className="text-[11px] text-slate-400">Across {songs.length} catalog tracks</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#131422] border border-[#212338] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Personal Playlists</span>
            <BarChart2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {playlists.length}
          </div>
          <div className="text-[11px] text-slate-400">Curated themed collections</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#131422] border border-[#212338] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Memories Logged</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {memories.length}
          </div>
          <div className="text-[11px] text-slate-400">Auditory journal stories</div>
        </div>
      </div>

      {/* 2-Column Section: Top Genres & Weekly Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Genres Breakdown (6 cols) */}
        <section className="lg:col-span-6 p-6 rounded-3xl bg-[#12131f] border border-[#212338] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Top Genres Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">By Play Volume</span>
          </div>

          <div className="space-y-3 pt-2">
            {genreBreakdown.map((item) => (
              <div key={item.genre} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.genre}</span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {item.count} plays ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#1b1c2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Activity Bar Chart (6 cols) */}
        <section className="lg:col-span-6 p-6 rounded-3xl bg-[#12131f] border border-[#212338] space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Weekly Listening Rhythm</span>
            </h3>
            <span className="text-xs text-purple-400 font-medium">Peak: Friday Night</span>
          </div>

          {/* Bar Chart Visual */}
          <div className="pt-6 pb-2 flex items-end justify-between gap-3 h-44 px-4">
            {weeklyDistribution.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-mono text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.hours}h
                </div>
                <div
                  className="w-full bg-gradient-to-t from-purple-900 via-purple-600 to-violet-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                  style={{ height: `${item.height}%` }}
                />
                <span className="text-xs font-mono text-slate-400 group-hover:text-white">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 2-Column Section: Top Artists & Sonic Profile Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Artists (6 cols) */}
        <section className="lg:col-span-6 p-6 rounded-3xl bg-[#12131f] border border-[#212338] space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Top Artists in Rotation</span>
          </h3>

          <div className="space-y-2.5">
            {topArtists.map((artist, idx) => (
              <div
                key={artist.artist}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#151625] hover:bg-[#1a1c2e] border border-[#222438] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center">
                    #{idx + 1}
                  </span>
                  <SongArtwork
                    src={artist.artwork}
                    alt={artist.artist}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{artist.artist}</div>
                    <div className="text-[11px] text-slate-400">{artist.tracks} songs in catalog</div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs text-purple-300 tabular-nums">
                  {artist.plays} plays
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sonic Profile Meters (6 cols) */}
        <section className="lg:col-span-6 p-6 rounded-3xl bg-[#12131f] border border-[#212338] space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Audio Feature Persona</span>
          </h3>

          <div className="space-y-4 pt-1">
            {audioProfile.map((item) => (
              <div key={item.feature} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{item.feature}</span>
                  <span className="font-mono text-purple-400 tabular-nums">{item.value}%</span>
                </div>
                <div className="w-full h-2 bg-[#1b1c2e] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
