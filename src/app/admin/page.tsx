'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Trophy,
  Users,
  Bell,
  LogOut,
  ShieldCheck,
  Minus,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPanel() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [club, setClub] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'maclar' | 'kadro' | 'duyurular'>('maclar');
  const [statusMsg, setStatusMsg] = useState('');

  // Yeni Maç Formu
  const [opponent, setOpponent] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [teamId, setTeamId] = useState('');
  const [location, setLocation] = useState('İnegöl İlçe Stadı');
  const [isHome, setIsHome] = useState(true);

  // Skor Düzenleme State'i
  const [scores, setScores] = useState<Record<string, { our: string; opp: string }>>({});

  // Yeni Oyuncu Formu
  const [playerName, setPlayerName] = useState('');
  const [position, setPosition] = useState('Orta Saha');
  const [jersey, setJersey] = useState('');
  const [playerTeamId, setPlayerTeamId] = useState('');

  // Yeni Duyuru Formu
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showNotice = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const fetchData = async () => {
    const { data: clubData } = await supabase.from('clubs').select('*').eq('slug', 'genclergucu').single();
    if (!clubData) return;
    setClub(clubData);

    const [tRes, mRes, pRes, aRes] = await Promise.all([
      supabase.from('teams').select('*').eq('club_id', clubData.id).order('sort_order'),
      supabase.from('matches').select('*').eq('club_id', clubData.id).order('match_date', { ascending: false }),
      supabase.from('players').select('*').eq('club_id', clubData.id).order('jersey_number'),
      supabase.from('announcements').select('*').eq('club_id', clubData.id).order('created_at', { ascending: false }),
    ]);

    const loadedTeams = tRes.data || [];
    setTeams(loadedTeams);
    if (loadedTeams.length > 0) {
      setTeamId((prev) => prev || loadedTeams[0].id);
      setPlayerTeamId((prev) => prev || loadedTeams[0].id);
    }

    const loadedMatches = mRes.data || [];
    setMatches(loadedMatches);

    const initialScores: Record<string, { our: string; opp: string }> = {};
    loadedMatches.forEach((m: any) => {
      initialScores[m.id] = {
        our: m.our_score !== null ? String(m.our_score) : '',
        opp: m.opponent_score !== null ? String(m.opponent_score) : '',
      };
    });
    setScores(initialScores);

    setPlayers(pRes.data || []);
    setAnnouncements(aRes.data || []);
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoginError('E-posta veya şifre hatalı!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Maç Ekle
  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club || !opponent || !matchDate) return;

    const { error } = await supabase.from('matches').insert({
      club_id: club.id,
      team_id: teamId || null,
      opponent_name: opponent,
      match_date: new Date(matchDate).toISOString(),
      is_home: isHome,
      location,
    });

    if (!error) {
      setOpponent('');
      setMatchDate('');
      showNotice('Yeni maç fikstüre eklendi!');
      fetchData();
    }
  };

  // Skor Güncelle
  const handleSaveScore = async (matchId: string) => {
    const s = scores[matchId];
    const ourVal = s?.our === '' ? null : Number(s.our);
    const oppVal = s?.opp === '' ? null : Number(s.opp);

    const { error } = await supabase
      .from('matches')
      .update({ our_score: ourVal, opponent_score: oppVal })
      .eq('id', matchId);

    if (!error) {
      showNotice('Maç skoru güncellendi!');
      fetchData();
    }
  };

  // Maç Sil
  const handleDeleteMatch = async (id: string) => {
    await supabase.from('matches').delete().eq('id', id);
    showNotice('Maç silindi.');
    fetchData();
  };

  // Oyuncu Ekle
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club || !playerName) return;

    const { error } = await supabase.from('players').insert({
      club_id: club.id,
      team_id: playerTeamId || null,
      full_name: playerName,
      position,
      jersey_number: jersey ? Number(jersey) : null,
      goals: 0,
      assists: 0,
    });

    if (!error) {
      setPlayerName('');
      setJersey('');
      showNotice('Futbolcu kadroya eklendi!');
      fetchData();
    }
  };

  // Gol / Asist Artır veya Azalt
  const handleStatChange = async (player: any, field: 'goals' | 'assists', delta: number) => {
    const newVal = Math.max(0, (player[field] || 0) + delta);
    await supabase.from('players').update({ [field]: newVal }).eq('id', player.id);
    fetchData();
  };

  // Oyuncu Sil
  const handleDeletePlayer = async (id: string) => {
    await supabase.from('players').delete().eq('id', id);
    showNotice('Oyuncu kadrodan çıkarıldı.');
    fetchData();
  };

  // Duyuru Ekle
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club || !annTitle || !annContent) return;

    const { error } = await supabase.from('announcements').insert({
      club_id: club.id,
      title: annTitle,
      content: annContent,
    });

    if (!error) {
      setAnnTitle('');
      setAnnContent('');
      showNotice('Duyuru yayınlandı!');
      fetchData();
    }
  };

  // Duyuru Sil
  const handleDeleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    showNotice('Duyuru silindi.');
    fetchData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#DDF1FC] via-[#EEF8FE] to-[#CBE8FA] text-[#2B2727] flex flex-col items-center justify-center gap-4">
        <img src="/logo.jpg" alt="İGG" className="w-16 h-16 rounded-2xl object-contain bg-white p-1.5 shadow-lg animate-pulse" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#2B2727]/70">
          Oturum Kontrol Ediliyor...
        </p>
      </div>
    );
  }

  // BUZ MAVİSİ GLASS YÖNETİCİ GİRİŞ EKRANI
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#D6EEFC] via-[#EAF6FD] to-[#F5FAFE] text-[#2B2727] flex items-center justify-center p-5 relative overflow-hidden">
        <div className="pointer-events-none fixed top-[-50px] left-[-40px] w-72 h-72 rounded-full bg-[#A6D9F7]/70 blur-3xl" />
        <div className="pointer-events-none fixed bottom-[-50px] right-[-40px] w-80 h-80 rounded-full bg-sky-300/40 blur-3xl" />

        <form
          onSubmit={handleLogin}
          className="relative z-10 w-full max-w-sm bg-white/75 backdrop-blur-2xl p-7 rounded-3xl border border-white shadow-[0_16px_40px_rgba(14,116,144,0.12)] space-y-5"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md border border-[#A6D9F7]/60 mb-3">
              <img src="/logo.jpg" alt="İnegöl Gençlergücü SK" className="w-full h-full object-contain" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-700 bg-[#A6D9F7]/40 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3" /> Yetkili Erişimi
            </span>
            <h1 className="text-lg font-black text-[#2B2727] mt-1.5">Kulüp Yönetim Paneli</h1>
            <p className="text-xs font-medium text-[#2B2727]/65 mt-0.5">
              İnegöl Gençlergücü SK • 1977
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Yönetici E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/85 border border-sky-900/10 text-sm text-[#2B2727] placeholder:text-[#2B2727]/40 focus:outline-none focus:border-[#2B2727] transition"
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/85 border border-sky-900/10 text-sm text-[#2B2727] placeholder:text-[#2B2727]/40 focus:outline-none focus:border-[#2B2727] transition"
              required
            />
            {loginError && (
              <p className="text-xs font-bold text-rose-600 text-center bg-rose-50 py-2 rounded-xl border border-rose-200">
                {loginError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#2B2727] hover:bg-zinc-800 text-[#A6D9F7] font-black text-sm shadow-lg transition active:scale-95"
          >
            Güvenli Giriş Yap
          </button>

          <div className="text-center pt-1">
            <Link href="/" className="text-xs font-bold text-sky-800 hover:text-[#2B2727] transition">
              ← Kulüp Portalına Dön
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D6EEFC] via-[#EAF6FD] to-[#F5FAFE] text-[#2B2727] pb-20 max-w-md mx-auto relative overflow-x-hidden shadow-[0_0_50px_rgba(14,116,144,0.12)] border-x border-white/80">
      {/* Arka Plan Buz Mavisi Küreler */}
      <div className="pointer-events-none fixed top-[-60px] left-[-40px] w-72 h-72 rounded-full bg-[#A6D9F7]/65 blur-3xl" />
      <div className="pointer-events-none fixed top-64 right-[-60px] w-80 h-80 rounded-full bg-sky-300/35 blur-3xl" />

      {/* ÜST GLASS YÖNETİM BARI */}
      <header className="relative z-10 pt-6 pb-4 px-5">
        <div className="bg-white/65 backdrop-blur-2xl border border-white/90 p-4 rounded-3xl shadow-[0_8px_25px_rgba(14,116,144,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#2B2727] bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-white shadow-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-700" />
              <span>Siteye Dön</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-extrabold text-rose-600 bg-rose-50/90 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200/80 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-sm border border-[#A6D9F7]/60 shrink-0">
              <img src="/logo.jpg" alt="İGG" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-sky-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Yönetici Modu Aktif
              </div>
              <h1 className="text-base font-black text-[#2B2727] truncate">
                {club?.name || 'İnegöl Gençlergücü SK'}
              </h1>
              <p className="text-[11px] font-medium text-[#2B2727]/60 truncate">{session.user.email}</p>
            </div>
          </div>

          {/* SEKMELER */}
          <div className="grid grid-cols-3 gap-1.5 mt-4 bg-[#A6D9F7]/30 p-1 rounded-2xl border border-white/70">
            {[
              { id: 'maclar', label: 'Maç & Skor', icon: Trophy },
              { id: 'kadro', label: 'Kadro', icon: Users },
              { id: 'duyurular', label: 'Duyurular', icon: Bell },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition ${
                    activeTab === t.id
                      ? 'bg-[#2B2727] text-[#A6D9F7] shadow-sm'
                      : 'text-[#2B2727]/75 hover:text-[#2B2727]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* BİLDİRİM MESAJI */}
      {statusMsg && (
        <div className="relative z-10 mx-4 mb-3 bg-[#2B2727] text-[#A6D9F7] text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg border border-[#A6D9F7]/30">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      <main className="relative z-10 px-4 mt-1 space-y-5">
        {/* ==================== 1. MAÇ & SKOR YÖNETİMİ ==================== */}
        {activeTab === 'maclar' && (
          <>
            <form
              onSubmit={handleAddMatch}
              className="bg-white/75 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-[0_8px_24px_rgba(14,116,144,0.06)] space-y-3"
            >
              <h2 className="font-black text-sm text-[#2B2727] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-700" /> Yeni Maç Ekle
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-bold text-[#2B2727]"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <select
                  value={isHome ? 'home' : 'away'}
                  onChange={(e) => setIsHome(e.target.value === 'home')}
                  className="px-3 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-bold text-[#2B2727]"
                >
                  <option value="home">İç Saha</option>
                  <option value="away">Deplasman</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Rakip Takım Adı (örn: Kafkasspor)"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-medium text-[#2B2727]"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-medium text-[#2B2727]"
                  required
                />
                <input
                  type="text"
                  placeholder="Saha / Stat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-medium text-[#2B2727]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#2B2727] hover:bg-zinc-800 text-[#A6D9F7] text-xs font-black shadow-md transition active:scale-95"
              >
                Fikstüre Ekle
              </button>
            </form>

            <div className="space-y-3">
              <h2 className="font-black text-sm text-[#2B2727] px-1">Mevcut Maçlar & Skor Girişi</h2>
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="bg-white/75 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-[0_6px_20px_rgba(14,116,144,0.05)] space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-[#2B2727]/65">
                    <span>{new Date(m.match_date).toLocaleDateString('tr-TR')}</span>
                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-black text-xs text-[#2B2727]">
                    <span className="w-1/3 truncate">Gençlergücü</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="-"
                        value={scores[m.id]?.our ?? ''}
                        onChange={(e) =>
                          setScores({
                            ...scores,
                            [m.id]: { ...scores[m.id], our: e.target.value },
                          })
                        }
                        className="w-12 py-2 text-center border border-[#A6D9F7] rounded-xl bg-white font-black text-sm text-[#2B2727]"
                      />
                      <span>:</span>
                      <input
                        type="number"
                        placeholder="-"
                        value={scores[m.id]?.opp ?? ''}
                        onChange={(e) =>
                          setScores({
                            ...scores,
                            [m.id]: { ...scores[m.id], opp: e.target.value },
                          })
                        }
                        className="w-12 py-2 text-center border border-[#A6D9F7] rounded-xl bg-white font-black text-sm text-[#2B2727]"
                      />
                    </div>
                    <span className="w-1/3 text-right truncate">{m.opponent_name}</span>
                  </div>
                  <button
                    onClick={() => handleSaveScore(m.id)}
                    className="w-full py-2.5 rounded-2xl bg-[#A6D9F7]/75 hover:bg-[#A6D9F7] text-[#2B2727] text-xs font-black transition"
                  >
                    Skoru Kaydet
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== 2. KADRO YÖNETİMİ ==================== */}
        {activeTab === 'kadro' && (
          <>
            <form
              onSubmit={handleAddPlayer}
              className="bg-white/75 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-[0_8px_24px_rgba(14,116,144,0.06)] space-y-3"
            >
              <h2 className="font-black text-sm text-[#2B2727] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-700" /> Kadroya Futbolcu Ekle
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={playerTeamId}
                  onChange={(e) => setPlayerTeamId(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-bold text-[#2B2727]"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-bold text-[#2B2727]"
                >
                  <option value="Kaleci">Kaleci</option>
                  <option value="Defans">Defans</option>
                  <option value="Orta Saha">Orta Saha</option>
                  <option value="Forvet">Forvet</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="col-span-2 px-3.5 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-medium text-[#2B2727]"
                  required
                />
                <input
                  type="number"
                  placeholder="Forma No"
                  value={jersey}
                  onChange={(e) => setJersey(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-medium text-[#2B2727]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#2B2727] hover:bg-zinc-800 text-[#A6D9F7] text-xs font-black shadow-md transition active:scale-95"
              >
                Oyuncuyu Kaydet
              </button>
            </form>

            <div className="space-y-2.5">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="bg-white/75 backdrop-blur-xl p-3.5 rounded-3xl border border-white shadow-[0_6px_20px_rgba(14,116,144,0.05)] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#2B2727] text-[#A6D9F7] font-black text-xs flex items-center justify-center shrink-0">
                      {p.jersey_number || '-'}
                    </div>
                    <div className="truncate">
                      <div className="font-black text-xs text-[#2B2727] truncate">{p.full_name}</div>
                      <div className="text-[11px] font-medium text-[#2B2727]/65">{p.position}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Gol Sayacı */}
                    <div className="flex items-center bg-[#A6D9F7]/50 rounded-xl px-1.5 py-1 gap-1">
                      <button
                        onClick={() => handleStatChange(p, 'goals', -1)}
                        className="p-0.5 text-[#2B2727]/70 hover:text-[#2B2727]"
                        title="Gol Azalt"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-black text-[#2B2727]">{p.goals} G</span>
                      <button
                        onClick={() => handleStatChange(p, 'goals', 1)}
                        className="p-0.5 text-[#2B2727]/70 hover:text-[#2B2727]"
                        title="Gol Artır"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Asist Sayacı */}
                    <div className="flex items-center bg-white/90 border border-white rounded-xl px-1.5 py-1 gap-1">
                      <button
                        onClick={() => handleStatChange(p, 'assists', -1)}
                        className="p-0.5 text-[#2B2727]/70 hover:text-[#2B2727]"
                        title="Asist Azalt"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-extrabold text-[#2B2727]">{p.assists} A</span>
                      <button
                        onClick={() => handleStatChange(p, 'assists', 1)}
                        className="p-0.5 text-[#2B2727]/70 hover:text-[#2B2727]"
                        title="Asist Artır"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeletePlayer(p.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 ml-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== 3. DUYURU YÖNETİMİ ==================== */}
        {activeTab === 'duyurular' && (
          <>
            <form
              onSubmit={handleAddAnnouncement}
              className="bg-white/75 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-[0_8px_24px_rgba(14,116,144,0.06)] space-y-3"
            >
              <h2 className="font-black text-sm text-[#2B2727] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-700" /> Yeni Duyuru Yayınla
              </h2>
              <input
                type="text"
                placeholder="Duyuru Başlığı"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-medium text-[#2B2727]"
                required
              />
              <textarea
                placeholder="Duyuru detaylarını yazın..."
                rows={3}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-sky-900/10 text-xs font-medium text-[#2B2727]"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#2B2727] hover:bg-zinc-800 text-[#A6D9F7] text-xs font-black shadow-md transition active:scale-95"
              >
                Duyuruyu Yayınla
              </button>
            </form>

            <div className="space-y-2.5">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white/75 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-[0_6px_20px_rgba(14,116,144,0.05)] flex items-start justify-between gap-3 border-l-4 border-l-[#2B2727]"
                >
                  <div>
                    <div className="font-black text-xs text-[#2B2727]">{a.title}</div>
                    <p className="text-xs text-[#2B2727]/75 mt-1 leading-relaxed">{a.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="text-rose-500 hover:text-rose-700 shrink-0 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}