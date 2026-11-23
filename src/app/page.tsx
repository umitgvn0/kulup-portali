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
      <div className="min-h-screen bg-gradient-to-br from-[#DDF1FC] via-[#EEF8FE] to-[#CBE8FA] text-[#2B2727] flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-[#A6D9F7]/70 blur-xl animate-pulse" />
          <img
            src="/logo.jpg"
            alt="İnegöl Gençlergücü SK"
            className="relative w-20 h-20 rounded-2xl object-contain bg-white/90 p-1.5 shadow-xl border border-white"
          />
        </div>
        <div className="text-center space-y-1">
          <div className="text-xs font-black tracking-[0.25em] uppercase text-[#2B2727]">
            İNEGÖL GENÇLERGÜCÜ SK
          </div>
          <div className="text-[11px] font-medium text-sky-800/70">Maç Merkezi Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D6EEFC] via-[#EAF6FD] to-[#F5FAFE] text-[#2B2727] pb-28 max-w-md mx-auto relative overflow-x-hidden shadow-[0_0_50px_rgba(14,116,144,0.12)] border-x border-white/80 selection:bg-[#2B2727] selection:text-[#A6D9F7]">
      {/* Arka Plan Cam Efektini Besleyen Yumuşak Gök Mavisi Küreler */}
      <div className="pointer-events-none fixed top-[-60px] left-[-40px] w-72 h-72 rounded-full bg-[#A6D9F7]/65 blur-3xl" />
      <div className="pointer-events-none fixed top-64 right-[-60px] w-80 h-80 rounded-full bg-sky-300/35 blur-3xl" />
      <div className="pointer-events-none fixed bottom-10 left-6 w-64 h-64 rounded-full bg-[#A6D9F7]/45 blur-3xl" />

      {/* ÜST GLASS HEADER */}
      <header className="relative z-10 pt-6 pb-4 px-5">
        <div className="flex items-center justify-between mb-5 bg-white/55 backdrop-blur-xl border border-white/80 p-3 rounded-3xl shadow-[0_8px_25px_rgba(14,116,144,0.07)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-sm border border-[#A6D9F7]/50 shrink-0">
              <img
                src="/logo.jpg"
                alt="İnegöl Gençlergücü SK Arması"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-sky-700 font-extrabold">
                  EST. 1977 • İNEGÖL
                </span>
              </div>
              <h1 className="text-base font-black tracking-tight text-[#2B2727] mt-0.5">
                {club?.name || 'İnegöl Gençlergücü SK'}
              </h1>
            </div>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-[11px] font-bold bg-[#2B2727] hover:bg-zinc-800 text-[#A6D9F7] px-3.5 py-2 rounded-2xl shadow-md transition active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Yönetim</span>
          </Link>
        </div>

        {/* YATAY KAYDIRILABİLİR GLASS KATEGORİ PİLLERİ */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedTeamId('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedTeamId === 'all'
                ? 'bg-[#2B2727] text-[#A6D9F7] shadow-md'
                : 'bg-white/60 backdrop-blur-md text-[#2B2727]/80 border border-white/80 hover:bg-white/90'
            }`}
          >
            Tüm Kulüp
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedTeamId === team.id
                  ? 'bg-[#2B2727] text-[#A6D9F7] shadow-md'
                  : 'bg-white/60 backdrop-blur-md text-[#2B2727]/80 border border-white/80 hover:bg-white/90'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      </header>

      {/* ANA İÇERİK ALANI */}
      <main className="relative z-10 px-4 mt-2 space-y-4">
        {/* ==================== 1. ÖZET SEKMESİ ==================== */}
        {activeTab === 'ozet' && (
          <>
            {/* SIRADAKİ MAÇ — BUZ MAVİSİ GLASS HERO KARTI */}
            {upcomingMatch ? (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 via-[#A6D9F7]/35 to-white/70 backdrop-blur-2xl p-5 border border-white shadow-[0_12px_32px_rgba(14,116,144,0.1)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#2B2727] text-[#A6D9F7] text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <Flame className="w-3 h-3" /> Sıradaki Maç
                  </span>
                  <span className="text-[11px] font-bold text-[#2B2727]/80 flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-xl border border-white">
                    <Clock className="w-3 h-3 text-sky-600" />
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
                    <div className="w-15 h-15 rounded-2xl bg-white p-1.5 shadow-md border border-[#A6D9F7]/60 flex items-center justify-center">
                      <img src="/logo.jpg" alt="İGG" className="w-11 h-11 object-contain" />
                    </div>
                    <span className="font-black text-xs text-[#2B2727] leading-tight">
                      Gençlergücü
                    </span>
                  </div>

                  {/* VS Rozeti */}
                  <div className="flex flex-col items-center">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-white/90 border border-[#A6D9F7] text-[#2B2727] font-black text-sm tracking-widest shadow-sm">
                      VS
                    </div>
                    <span className="text-[10px] font-extrabold text-sky-800 uppercase mt-1.5">
                      {upcomingMatch.is_home ? 'İç Saha' : 'Deplasman'}
                    </span>
                  </div>

                  {/* Rakip */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-15 h-15 rounded-2xl bg-white/80 backdrop-blur-md border border-white flex items-center justify-center font-black text-lg text-[#2B2727] shadow-md">
                      {upcomingMatch.opponent_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-black text-xs text-[#2B2727] leading-tight line-clamp-1">
                      {upcomingMatch.opponent_name}
                    </span>
                  </div>
                </div>

                {upcomingMatch.location && (
                  <div className="mt-4 pt-3 border-t border-sky-900/10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#2B2727]/80">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>{upcomingMatch.location}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 p-5 text-center text-xs font-medium text-[#2B2727]/70">
                Planlanmış sıradaki maç bulunmuyor.
              </div>
            )}

            {/* SON MAÇ SKORU & FORM DURUMU */}
            <div className="grid grid-cols-1 gap-3.5">
              {lastFinishedMatch && (
                <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 p-4 shadow-[0_8px_24px_rgba(14,116,144,0.06)]">
                  <div className="flex items-center justify-between text-[11px] text-[#2B2727]/60 mb-3">
                    <span className="font-extrabold uppercase tracking-wider text-[#2B2727]">
                      Son Maç Sonucu
                    </span>
                    <span className="font-semibold">
                      {new Date(lastFinishedMatch.match_date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-1/3 font-black text-xs text-[#2B2727] truncate">
                      Gençlergücü
                    </div>
                    <div className="px-4 py-1.5 rounded-2xl bg-[#2B2727] text-[#A6D9F7] font-black text-base tracking-wider shadow-md">
                      {lastFinishedMatch.our_score} - {lastFinishedMatch.opponent_score}
                    </div>
                    <div className="w-1/3 font-black text-xs text-[#2B2727]/85 text-right truncate">
                      {lastFinishedMatch.opponent_name}
                    </div>
                  </div>
                </div>
              )}

              {/* SON 5 MAÇ FORM ŞERİDİ */}
              {formStats.recent.length > 0 && (
                <div className="rounded-3xl bg-white/65 backdrop-blur-xl border border-white/85 p-4 flex items-center justify-between shadow-[0_8px_24px_rgba(14,116,144,0.05)]">
                  <div>
                    <div className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">
                      Son Maç Formu
                    </div>
                    <div className="text-xs font-black text-[#2B2727] mt-0.5">
                      {formStats.wins}G • {formStats.draws}B • {formStats.losses}M
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {formStats.recent.map((item) => (
                      <div
                        key={item.id}
                        title={`${item.opp} (${item.score})`}
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shadow-sm ${
                          item.res === 'G'
                            ? 'bg-emerald-500 text-white'
                            : item.res === 'B'
                            ? 'bg-amber-400 text-[#2B2727]'
                            : 'bg-rose-500 text-white'
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
                  className="rounded-3xl bg-gradient-to-r from-white/80 to-[#A6D9F7]/40 backdrop-blur-xl border border-white p-4 flex items-center justify-between cursor-pointer hover:bg-white/90 transition shadow-[0_8px_24px_rgba(14,116,144,0.06)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#2B2727] text-[#A6D9F7] flex items-center justify-center shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
                        Takım Skoreri
                      </span>
                      <div className="font-black text-sm text-[#2B2727]">
                        {topScorer.full_name}
                      </div>
                      <div className="text-[11px] font-medium text-[#2B2727]/70">
                        #{topScorer.jersey_number || '-'} • {topScorer.position}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-[#2B2727]">{topScorer.goals} Gol</div>
                    <div className="text-[11px] font-bold text-sky-800">{topScorer.assists} Asist</div>
                  </div>
                </div>
              )}

              {announcements[0] && (
                <div
                  onClick={() => setActiveTab('gundem')}
                  className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 p-4 cursor-pointer hover:bg-white/90 transition group shadow-[0_8px_24px_rgba(14,116,144,0.06)]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-700 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> Kulüpten Son Haber
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#2B2727]/50 group-hover:text-[#2B2727] group-hover:translate-x-0.5 transition" />
                  </div>
                  <h3 className="font-black text-sm text-[#2B2727]">{announcements[0].title}</h3>
                  <p className="text-xs text-[#2B2727]/75 mt-1 line-clamp-2 leading-relaxed">
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
              <h2 className="font-black text-sm text-[#2B2727] tracking-tight">
                Maç Takvimi & Sonuçlar
              </h2>
              <span className="text-[11px] font-bold text-sky-800">{filteredMatches.length} Maç</span>
            </div>

            {filteredMatches.length === 0 ? (
              <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white p-6 text-center text-xs text-[#2B2727]/70">
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
                    className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 p-4 shadow-[0_6px_20px_rgba(14,116,144,0.05)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#2B2727]/65 font-semibold">
                      <span>
                        {new Date(m.match_date).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          m.is_home
                            ? 'bg-[#A6D9F7]/60 text-[#2B2727]'
                            : 'bg-white/80 text-[#2B2727]/70 border border-white'
                        }`}
                      >
                        {m.is_home ? 'İç Saha' : 'Deplasman'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="w-2/5 font-black text-xs text-[#2B2727] truncate">
                        Gençlergücü
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-xl font-black text-xs tracking-wider text-center min-w-[74px] shadow-sm ${
                          !isPlayed
                            ? 'bg-white text-[#2B2727] border border-[#A6D9F7]'
                            : isWin
                            ? 'bg-emerald-500 text-white'
                            : isLoss
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-400 text-[#2B2727]'
                        }`}
                      >
                        {isPlayed
                          ? `${m.our_score} - ${m.opponent_score}`
                          : new Date(m.match_date).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                      </div>
                      <div className="w-2/5 font-black text-xs text-[#2B2727]/85 text-right truncate">
                        {m.opponent_name}
                      </div>
                    </div>

                    {m.location && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#2B2727]/65 pt-1.5 border-t border-sky-900/10">
                        <MapPin className="w-3 h-3 text-sky-600" />
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
              <h2 className="font-black text-sm text-[#2B2727] tracking-tight">Takım Kadrosu</h2>
              <span className="text-[11px] font-bold text-sky-800">{filteredPlayers.length} Futbolcu</span>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white p-6 text-center text-xs text-[#2B2727]/70">
                Bu kategoriye henüz futbolcu eklenmemiş.
              </div>
            ) : (
              Object.entries(groupedPlayers).map(([posTitle, posPlayers]) => (
                <div key={posTitle} className="space-y-2.5">
                  <div className="text-[11px] font-black uppercase tracking-widest text-sky-800 px-1">
                    {posTitle}
                  </div>
                  {posPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 p-3.5 flex items-center justify-between shadow-[0_6px_20px_rgba(14,116,144,0.05)]"
                    >
                      {/* Arka Plan Forma Numarası Filigranı */}
                      <span className="pointer-events-none absolute right-24 -bottom-3 text-5xl font-black text-sky-900/[0.06] select-none">
                        {p.jersey_number || ''}
                      </span>

                      <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-[#2B2727] text-[#A6D9F7] font-black text-sm flex items-center justify-center shadow-sm">
                          {p.jersey_number || '-'}
                        </div>
                        <div>
                          <div className="font-black text-sm text-[#2B2727]">{p.full_name}</div>
                          <div className="text-[11px] font-medium text-[#2B2727]/65">{p.position}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 relative z-10">
                        <span className="px-2.5 py-1 rounded-xl bg-[#A6D9F7]/65 text-[#2B2727] font-black text-[11px]">
                          {p.goals} G
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-white/90 border border-white text-[#2B2727]/80 font-extrabold text-[11px]">
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
              <h2 className="font-black text-sm text-[#2B2727] tracking-tight">
                Kulüp Duyuruları & Haberler
              </h2>
              <span className="text-[11px] font-bold text-sky-800">{announcements.length} Duyuru</span>
            </div>

            {announcements.length === 0 ? (
              <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white p-6 text-center text-xs text-[#2B2727]/70">
                Henüz yayınlanmış bir duyuru bulunmuyor.
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 p-4 shadow-[0_6px_20px_rgba(14,116,144,0.05)] border-l-4 border-l-[#2B2727]"
                >
                  <div className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider mb-1">
                    {new Date(a.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <h3 className="font-black text-sm text-[#2B2727]">{a.title}</h3>
                  <p className="text-xs text-[#2B2727]/80 mt-2 leading-relaxed whitespace-pre-line">
                    {a.content}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* SABİT ALT BUZLU CAM NAVİGASYON BARI */}
      <nav className="fixed bottom-3 inset-x-0 z-50 max-w-md mx-auto px-4">
        <div className="grid grid-cols-4 gap-1 bg-white/75 backdrop-blur-2xl border border-white p-1.5 rounded-3xl shadow-[0_12px_35px_rgba(14,116,144,0.16)]">
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
                className={`flex flex-col items-center justify-center py-2 rounded-2xl text-[11px] font-black transition-all ${
                  isActive
                    ? 'bg-[#2B2727] text-[#A6D9F7] shadow-md'
                    : 'text-[#2B2727]/65 hover:text-[#2B2727]'
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