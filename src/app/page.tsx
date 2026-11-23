'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Trophy,
  Calendar,
  Users,
  Bell,
  MapPin,
  ChevronRight,
  Shield,
  Flame,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ClubPortal() {
  const [club, setClub] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'ozet' | 'fikstur' | 'kadro' | 'gundem'>('ozet');
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortalData() {
      const { data: clubData } = await supabase
        .from('clubs')
        .select('*')
        .eq('slug', 'genclergucu')
        .single();

      if (!clubData) {
        setLoading(false);
        return;
      }
      setClub(clubData);

      const [teamsRes, matchesRes, playersRes, annRes] = await Promise.all([
        supabase.from('teams').select('*').eq('club_id', clubData.id).order('sort_order'),
        supabase.from('matches').select('*').eq('club_id', clubData.id).order('match_date', { ascending: true }),
        supabase.from('players').select('*').eq('club_id', clubData.id).order('jersey_number'),
        supabase.from('announcements').select('*').eq('club_id', clubData.id).order('created_at', { ascending: false }),
      ]);

      setTeams(teamsRes.data || []);
      setMatches(matchesRes.data || []);
      setPlayers(playersRes.data || []);
      setAnnouncements(annRes.data || []);
      setLoading(false);
    }

    loadPortalData();
  }, []);

  const filteredMatches = useMemo(() => {
    return selectedTeamId === 'all'
      ? matches
      : matches.filter((m) => m.team_id === selectedTeamId);
  }, [matches, selectedTeamId]);

  const filteredPlayers = useMemo(() => {
    return selectedTeamId === 'all'
      ? players
      : players.filter((p) => p.team_id === selectedTeamId);
  }, [players, selectedTeamId]);

  const upcomingMatch = useMemo(
    () => filteredMatches.find((m) => m.our_score === null),
    [filteredMatches]
  );

  const finishedMatches = useMemo(
    () => filteredMatches.filter((m) => m.our_score !== null),
    [filteredMatches]
  );

  const lastFinishedMatch = finishedMatches[finishedMatches.length - 1];

  // Son 5 maç form durumu (G / B / M)
  const formStats = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    const recent = finishedMatches.slice(-5).map((m) => {
      if (m.our_score > m.opponent_score) {
        wins++;
        return { id: m.id, res: 'G', opp: m.opponent_name, score: `${m.our_score}-${m.opponent_score}` };
      } else if (m.our_score === m.opponent_score) {
        draws++;
        return { id: m.id, res: 'B', opp: m.opponent_name, score: `${m.our_score}-${m.opponent_score}` };
      } else {
        losses++;
        return { id: m.id, res: 'M', opp: m.opponent_name, score: `${m.our_score}-${m.opponent_score}` };
      }
    });
    return { recent, wins, draws, losses };
  }, [finishedMatches]);

  // Gol & Asist lideri
  const topScorer = useMemo(() => {
    if (filteredPlayers.length === 0) return null;
    return [...filteredPlayers].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];
  }, [filteredPlayers]);

  // Mevkiye göre gruplu kadro
  const groupedPlayers = useMemo(() => {
    const order = ['Kaleci', 'Defans', 'Orta Saha', 'Forvet'];
    const groups: Record<string, any[]> = {};
    order.forEach((pos) => {
      const list = filteredPlayers.filter((p) => p.position === pos);
      if (list.length > 0) groups[pos] = list;
    });
    const others = filteredPlayers.filter((p) => !order.includes(p.position));
    if (others.length > 0) groups['Diğer'] = others;
    return groups;
  }, [filteredPlayers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="absolute -inset-2 rounded-3xl bg-[#A6D9F7]/30 blur-xl animate-pulse" />
          <img
            src="/logo.jpg"
            alt="İnegöl Gençlergücü SK"
            className="relative w-20 h-20 rounded-2xl object-contain bg-white p-1.5 shadow-2xl"
          />
        </div>
        <div className="text-center space-y-1">
          <div className="text-xs font-extrabold tracking-[0.25em] uppercase text-[#A6D9F7]">
            İNEGÖL GENÇLERGÜCÜ SK
          </div>
          <div className="text-[11px] text-zinc-500">Maç Merkezi Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 pb-28 max-w-md mx-auto relative shadow-[0_0_60px_rgba(0,0,0,0.9)] border-x border-zinc-800/70 selection:bg-[#A6D9F7] selection:text-zinc-950">
      {/* Arka Plan Dekoratif Gök Mavisi Işık Hüzmesi */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-[#A6D9F7]/15 via-[#2B2727]/20 to-transparent" />

      {/* ÜST HEADER */}
      <header className="relative z-10 pt-6 pb-4 px-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-[#A6D9F7] to-sky-300 opacity-60 blur-[2px]" />
              <div className="relative w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg">
                <img
                  src="/logo.jpg"
                  alt="İnegöl Gençlergücü SK Arması"
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A6D9F7] animate-ping" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#A6D9F7] font-bold">
                  EST. 1977 • İNEGÖL
                </span>
              </div>
              <h1 className="text-base font-black tracking-tight text-white mt-0.5">
                {club?.name || 'İnegöl Gençlergücü SK'}
              </h1>
            </div>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-[11px] font-bold bg-zinc-900/90 hover:bg-zinc-800 text-[#A6D9F7] px-3.5 py-2 rounded-xl border border-zinc-800 shadow-inner transition active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Yönetim</span>
          </Link>
        </div>

        {/* YATAY KAYDIRILABİLİR KATEGORİ PİLLERİ */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedTeamId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedTeamId === 'all'
                ? 'bg-[#A6D9F7] text-zinc-950 shadow-[0_0_20px_rgba(166,217,247,0.35)]'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800/80 hover:text-white'
            }`}
          >
            Tüm Kulüp
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedTeamId === team.id
                  ? 'bg-[#A6D9F7] text-zinc-950 shadow-[0_0_20px_rgba(166,217,247,0.35)]'
                  : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800/80 hover:text-white'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      </header>

      {/* ANA İÇERİK ALANI */}
      <main className="relative z-10 px-4 mt-2 space-y-5">
        {/* ==================== 1. ÖZET SEKMESİ ==================== */}
        {activeTab === 'ozet' && (
          <>
            {/* SIRADAKİ MAÇ — STADYUM HERO KARTI */}
            {upcomingMatch ? (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2B2727] via-zinc-900 to-zinc-950 p-5 border border-[#A6D9F7]/25 shadow-2xl">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#A6D9F7]/10 blur-2xl" />

                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#A6D9F7]/15 text-[#A6D9F7] text-[10px] font-black uppercase tracking-wider border border-[#A6D9F7]/20">
                    <Flame className="w-3 h-3" /> Sıradaki Karşılaşma
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A6D9F7]" />
                    {new Date(upcomingMatch.match_date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    •{' '}
                    {new Date(upcomingMatch.match_date).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Takımlar Karşılaştırması */}
                <div className="grid grid-cols-3 items-center text-center py-2">
                  {/* Gençlergücü */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center">
                      <img src="/logo.jpg" alt="İGG" className="w-11 h-11 object-contain" />
                    </div>
                    <span className="font-extrabold text-xs text-white leading-tight">
                      Gençlergücü
                    </span>
                  </div>

                  {/* VS Rozeti */}
                  <div className="flex flex-col items-center">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-[#A6D9F7] font-black text-sm tracking-widest shadow-inner">
                      VS
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase mt-1.5">
                      {upcomingMatch.is_home ? 'İç Saha' : 'Deplasman'}
                    </span>
                  </div>

                  {/* Rakip */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center font-black text-lg text-zinc-300 shadow-lg">
                      {upcomingMatch.opponent_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-extrabold text-xs text-zinc-200 leading-tight line-clamp-1">
                      {upcomingMatch.opponent_name}
                    </span>
                  </div>
                </div>

                {upcomingMatch.location && (
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-[#A6D9F7]" />
                    <span>{upcomingMatch.location}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800 p-5 text-center text-xs text-zinc-400">
                Planlanmış sıradaki maç bulunmuyor.
              </div>
            )}

            {/* SON MAÇ SKORU & FORM DURUMU */}
            <div className="grid grid-cols-1 gap-3.5">
              {lastFinishedMatch && (
                <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-4 shadow-lg">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
                    <span className="font-bold uppercase tracking-wider text-zinc-300">
                      Son Maç Sonucu
                    </span>
                    <span>
                      {new Date(lastFinishedMatch.match_date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-1/3 font-extrabold text-xs text-white truncate">
                      Gençlergücü
                    </div>
                    <div className="px-4 py-1.5 rounded-xl bg-[#A6D9F7] text-zinc-950 font-black text-base tracking-wider shadow-[0_0_15px_rgba(166,217,247,0.3)]">
                      {lastFinishedMatch.our_score} - {lastFinishedMatch.opponent_score}
                    </div>
                    <div className="w-1/3 font-extrabold text-xs text-zinc-300 text-right truncate">
                      {lastFinishedMatch.opponent_name}
                    </div>
                  </div>
                </div>
              )}

              {/* SON 5 MAÇ FORM ŞERİDİ */}
              {formStats.recent.length > 0 && (
                <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Son Maç Formu
                    </div>
                    <div className="text-xs font-extrabold text-white mt-0.5">
                      {formStats.wins}G • {formStats.draws}B • {formStats.losses}M
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {formStats.recent.map((item) => (
                      <div
                        key={item.id}
                        title={`${item.opp} (${item.score})`}
                        className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shadow-sm ${
                          item.res === 'G'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : item.res === 'B'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {item.res}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* GOL LİDERİ & SON DUYURU */}
            <div className="grid grid-cols-1 gap-3.5">
              {topScorer && (topScorer.goals > 0 || topScorer.assists > 0) && (
                <div
                  onClick={() => setActiveTab('kadro')}
                  className="rounded-2xl bg-gradient-to-r from-zinc-900 to-[#2B2727] border border-zinc-800 p-4 flex items-center justify-between cursor-pointer hover:border-[#A6D9F7]/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#A6D9F7]/15 border border-[#A6D9F7]/30 text-[#A6D9F7] flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A6D9F7]">
                        Takım Skoreri
                      </span>
                      <div className="font-extrabold text-sm text-white">
                        {topScorer.full_name}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        #{topScorer.jersey_number || '-'} • {topScorer.position}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-[#A6D9F7]">{topScorer.goals} Gol</div>
                    <div className="text-[11px] text-zinc-400">{topScorer.assists} Asist</div>
                  </div>
                </div>
              )}

              {announcements[0] && (
                <div
                  onClick={() => setActiveTab('gundem')}
                  className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 cursor-pointer hover:border-[#A6D9F7]/50 transition group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#A6D9F7] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> Kulüpten Son Haber
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#A6D9F7] group-hover:translate-x-0.5 transition" />
                  </div>
                  <h3 className="font-extrabold text-sm text-white">{announcements[0].title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {announcements[0].content}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================== 2. FİKSTÜR SEKMESİ ==================== */}
        {activeTab === 'fikstur' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-extrabold text-sm text-white tracking-tight">
                Maç Takvimi & Sonuçlar
              </h2>
              <span className="text-[11px] text-zinc-500">{filteredMatches.length} Maç</span>
            </div>

            {filteredMatches.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 text-center text-xs text-zinc-400">
                Bu kategori için henüz maç kaydı eklenmemiş.
              </div>
            ) : (
              filteredMatches.map((m) => {
                const isPlayed = m.our_score !== null;
                const isWin = isPlayed && m.our_score > m.opponent_score;
                const isLoss = isPlayed && m.our_score < m.opponent_score;

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-4 shadow-md space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>
                        {new Date(m.match_date).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          m.is_home
                            ? 'bg-[#A6D9F7]/15 text-[#A6D9F7]'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {m.is_home ? 'İç Saha' : 'Deplasman'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="w-2/5 font-extrabold text-xs text-white truncate">
                        Gençlergücü
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-xl font-black text-xs tracking-wider text-center min-w-[74px] ${
                          !isPlayed
                            ? 'bg-zinc-800 text-[#A6D9F7] border border-zinc-700'
                            : isWin
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isLoss
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                        }`}
                      >
                        {isPlayed
                          ? `${m.our_score} - ${m.opponent_score}`
                          : new Date(m.match_date).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                      </div>
                      <div className="w-2/5 font-extrabold text-xs text-zinc-200 text-right truncate">
                        {m.opponent_name}
                      </div>
                    </div>

                    {m.location && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/70">
                        <MapPin className="w-3 h-3 text-[#A6D9F7]" />
                        <span>{m.location}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ==================== 3. KADRO SEKMESİ ==================== */}
        {activeTab === 'kadro' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-extrabold text-sm text-white tracking-tight">Takım Kadrosu</h2>
              <span className="text-[11px] text-zinc-500">{filteredPlayers.length} Futbolcu</span>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 text-center text-xs text-zinc-400">
                Bu kategoriye henüz futbolcu eklenmemiş.
              </div>
            ) : (
              Object.entries(groupedPlayers).map(([posTitle, posPlayers]) => (
                <div key={posTitle} className="space-y-2.5">
                  <div className="text-[11px] font-black uppercase tracking-widest text-[#A6D9F7] px-1">
                    {posTitle}
                  </div>
                  {posPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="relative overflow-hidden rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-3.5 flex items-center justify-between shadow-md"
                    >
                      {/* Arka Plan Forma Numarası Filigranı */}
                      <span className="pointer-events-none absolute right-24 -bottom-3 text-5xl font-black text-white/[0.03] select-none">
                        {p.jersey_number || ''}
                      </span>

                      <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2B2727] to-zinc-950 border border-[#A6D9F7]/30 text-[#A6D9F7] font-black text-sm flex items-center justify-center shadow-inner">
                          {p.jersey_number || '-'}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-white">{p.full_name}</div>
                          <div className="text-[11px] text-zinc-400">{p.position}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 relative z-10">
                        <span className="px-2.5 py-1 rounded-lg bg-[#A6D9F7]/15 text-[#A6D9F7] font-extrabold text-[11px]">
                          {p.goals} G
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-[11px]">
                          {p.assists} A
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== 4. GÜNDEM SEKMESİ ==================== */}
        {activeTab === 'gundem' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-extrabold text-sm text-white tracking-tight">
                Kulüp Duyuruları & Haberler
              </h2>
              <span className="text-[11px] text-zinc-500">{announcements.length} Duyuru</span>
            </div>

            {announcements.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 text-center text-xs text-zinc-400">
                Henüz yayınlanmış bir duyuru bulunmuyor.
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-4 shadow-md border-l-4 border-l-[#A6D9F7]"
                >
                  <div className="text-[10px] font-bold text-[#A6D9F7] uppercase tracking-wider mb-1">
                    {new Date(a.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <h3 className="font-extrabold text-sm text-white">{a.title}</h3>
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed whitespace-pre-line">
                    {a.content}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* SABİT ALT MOBİL NAVİGASYON BARI (GLASSMORPHISM) */}
      <nav className="fixed bottom-3 inset-x-0 z-50 max-w-md mx-auto px-4">
        <div className="grid grid-cols-4 gap-1 bg-zinc-900/85 backdrop-blur-xl border border-zinc-800/90 p-1.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
          {[
            { id: 'ozet', label: 'Özet', icon: Trophy },
            { id: 'fikstur', label: 'Fikstür', icon: Calendar },
            { id: 'kadro', label: 'Kadro', icon: Users },
            { id: 'gundem', label: 'Gündem', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-extrabold transition-all ${
                  isActive
                    ? 'bg-[#A6D9F7] text-zinc-950 shadow-[0_0_15px_rgba(166,217,247,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}