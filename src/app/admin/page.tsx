'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Lock, Trophy, Users, Bell, LogOut } from 'lucide-react';
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

  // Gol / Asist Artır
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-slate-400">Oturum Kontrol Ediliyor...</p>
      </div>
    );
  }

  // Supabase Auth Giriş Ekranı
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold">Kulüp Yönetim Paneli</h1>
            <p className="text-xs text-slate-400 mt-1">İnegöl Gençlergücü SK Yetkili Girişi</p>
          </div>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Yönetici E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:border-blue-500"
              required
            />
            {loginError && <p className="text-xs text-red-400 text-center">{loginError}</p>}
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition">
            Güvenli Giriş Yap
          </button>
          <div className="text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-white">
              ← Portala Geri Dön
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Üst Bar */}
      <header className="bg-slate-900 text-white px-5 pt-6 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-full">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Siteye Dön</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-red-300 hover:text-red-200 bg-slate-800 px-3 py-1.5 rounded-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış</span>
          </button>
        </div>
        <h1 className="text-lg font-bold">{club?.name} — Yönetim</h1>
        <p className="text-xs text-slate-400">{session.user.email}</p>

        {/* Sekmeler */}
        <div className="grid grid-cols-3 gap-2 mt-4">
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
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Bildirim Mesajı */}
      {statusMsg && (
        <div className="mx-4 mt-4 bg-emerald-600 text-white text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <main className="px-4 mt-5 space-y-6">
        {/* 1. MAÇ & SKOR YÖNETİMİ */}
        {activeTab === 'maclar' && (
          <>
            <form onSubmit={handleAddMatch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Yeni Maç Ekle
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <select
                  value={isHome ? 'home' : 'away'}
                  onChange={(e) => setIsHome(e.target.value === 'home')}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Saha / Stat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500">
                Fikstüre Ekle
              </button>
            </form>

            <div className="space-y-3">
              <h2 className="font-bold text-sm">Mevcut Maçlar & Skor Girişi</h2>
              {matches.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(m.match_date).toLocaleDateString('tr-TR')}</span>
                    <button onClick={() => handleDeleteMatch(m.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-bold text-xs">
                    <span className="w-1/3">Gençlergücü</span>
                    <div className="flex items-center gap-1">
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
                        className="w-11 py-1.5 text-center border border-slate-300 rounded-lg bg-slate-50"
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
                        className="w-11 py-1.5 text-center border border-slate-300 rounded-lg bg-slate-50"
                      />
                    </div>
                    <span className="w-1/3 text-right">{m.opponent_name}</span>
                  </div>
                  <button
                    onClick={() => handleSaveScore(m.id)}
                    className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    Skoru Kaydet
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 2. KADRO YÖNETİMİ */}
        {activeTab === 'kadro' && (
          <>
            <form onSubmit={handleAddPlayer} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Kadroya Futbolcu Ekle
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={playerTeamId}
                  onChange={(e) => setPlayerTeamId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
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
                  className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  required
                />
                <input
                  type="number"
                  placeholder="Forma No"
                  value={jersey}
                  onChange={(e) => setJersey(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">
                Oyuncuyu Kaydet
              </button>
            </form>

            <div className="space-y-2.5">
              {players.map((p) => (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs">#{p.jersey_number || '-'} {p.full_name}</div>
                    <div className="text-[11px] text-slate-500">{p.position}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatChange(p, 'goals', 1)}
                      className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold"
                    >
                      +1 Gol ({p.goals})
                    </button>
                    <button
                      onClick={() => handleStatChange(p, 'assists', 1)}
                      className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      +1 Asist ({p.assists})
                    </button>
                    <button onClick={() => handleDeletePlayer(p.id)} className="text-red-500 ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 3. DUYURU YÖNETİMİ */}
        {activeTab === 'duyurular' && (
          <>
            <form onSubmit={handleAddAnnouncement} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Yeni Duyuru Yayınla
              </h2>
              <input
                type="text"
                placeholder="Duyuru Başlığı"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
              <textarea
                placeholder="Duyuru detaylarını yazın..."
                rows={3}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">
                Yayınla
              </button>
            </form>

            <div className="space-y-2.5">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs">{a.title}</div>
                    <p className="text-[11px] text-slate-600 mt-1">{a.content}</p>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-500 shrink-0">
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