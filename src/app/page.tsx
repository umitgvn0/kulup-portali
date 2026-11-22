'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar, Users, Bell, MapPin, ChevronRight } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <img src="/logo.jpg" alt="İnegöl Gençlergücü SK" className="w-16 h-16 rounded-2xl object-contain bg-white p-1 animate-pulse" />
        <div className="text-xs font-semibold tracking-widest uppercase text-sky-400">
          İnegöl Gençlergücü SK Yükleniyor...
        </div>
      </div>
    );
  }

  const filteredMatches = selectedTeamId === 'all'
    ? matches
    : matches.filter((m) => m.team_id === selectedTeamId);

  const filteredPlayers = selectedTeamId === 'all'
    ? players
    : players.filter((p) => p.team_id === selectedTeamId);

  const upcomingMatch = filteredMatches.find((m) => m.our_score === null);
  const lastFinishedMatch = [...filteredMatches].reverse().find((m) => m.our_score !== null);

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 pb-20 max-w-md mx-auto shadow-2xl border-x border-zinc-200">
      {/* Üst Kulüp Başlığı (Siyah & Gök Mavisi Kurumsal Kimlik) */}
      <header className="bg-zinc-900 text-white pt-7 pb-7 px-5 rounded-b-3xl shadow-lg border-b-4 border-sky-400">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
              <img
                src="/logo.jpg"
                alt="İnegöl Gençlergücü SK Arması"
                className="w-11 h-11 object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold block">
                Resmi Kulüp Portalı • 1977
              </span>
              <h1 className="text-base font-extrabold leading-tight tracking-tight">
                {club?.name || 'İnegöl Gençlergücü SK'}
              </h1>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-sky-300 font-medium px-3 py-1.5 rounded-full border border-zinc-700 transition"
          >
            Yönetim
          </Link>
        </div>

        {/* Yaş Grubu / Takım Filtresi */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedTeamId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedTeamId === 'all'
                ? 'bg-sky-400 text-zinc-950 shadow'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Tüm Kulüp
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedTeamId === team.id
                  ? 'bg-sky-400 text-zinc-950 shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      </header>

      {/* Ana Navigasyon Sekmeleri */}
      <nav className="grid grid-cols-4 gap-1.5 px-4 -mt-4">
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
              className={`flex flex-col items-center justify-center py-2.5 rounded-2xl text-xs font-bold shadow-sm border transition ${
                isActive
                  ? 'bg-zinc-900 text-sky-400 border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-100 hover:bg-zinc-50'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* İçerik Alanı */}
      <main className="px-4 mt-6 space-y-5">
        {activeTab === 'ozet' && (
          <>
            {upcomingMatch && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200/80">
                <div className="flex items-center justify-between text-xs text-sky-600 font-extrabold mb-3">
                  <span>SIRADAKİ MAÇ</span>
                  <span>{new Date(upcomingMatch.match_date).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center justify-between text-center py-2">
                  <div className="w-2/5 font-extrabold text-sm text-zinc-900">Gençlergücü</div>
                  <div className="w-1/5 text-xs font-extrabold bg-sky-100 text-sky-800 py-1 rounded-lg">VS</div>
                  <div className="w-2/5 font-extrabold text-sm text-zinc-900">{upcomingMatch.opponent_name}</div>
                </div>
                {upcomingMatch.location && (
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mt-3 pt-2 border-t border-zinc-100">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span>{upcomingMatch.location}</span>
                  </div>
                )}
              </div>
            )}

            {lastFinishedMatch && (
              <div className="bg-zinc-900 text-white rounded-2xl p-4 shadow-md border-l-4 border-sky-400">
                <div className="text-xs text-sky-400 font-semibold mb-2">Son Maç Sonucu</div>
                <div className="flex items-center justify-between text-center">
                  <div className="w-2/5 font-bold text-sm">Gençlergücü</div>
                  <div className="w-1/5 font-extrabold text-base bg-sky-400 text-zinc-950 py-1 rounded-lg shadow">
                    {lastFinishedMatch.our_score} - {lastFinishedMatch.opponent_score}
                  </div>
                  <div className="w-2/5 font-bold text-sm">{lastFinishedMatch.opponent_name}</div>
                </div>
              </div>
            )}

            {announcements[0] && (
              <div
                onClick={() => setActiveTab('gundem')}
                className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200/80 cursor-pointer hover:border-sky-400 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-extrabold text-sky-600 uppercase">Kulüp Duyurusu</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900">{announcements[0].title}</h3>
                <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{announcements[0].content}</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'fikstur' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-zinc-800">Maç Takvimi & Sonuçlar</h2>
            {filteredMatches.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-zinc-400">
                    {new Date(m.match_date).toLocaleDateString('tr-TR')} • {m.is_home ? 'İç Saha' : 'Deplasman'}
                  </div>
                  <div className="font-bold text-sm mt-0.5 text-zinc-900">Gençlergücü vs {m.opponent_name}</div>
                </div>
                <div className={`font-extrabold text-sm px-3 py-1.5 rounded-xl ${
                  m.our_score !== null ? 'bg-zinc-900 text-sky-400' : 'bg-sky-50 text-sky-700'
                }`}>
                  {m.our_score !== null ? `${m.our_score} - ${m.opponent_score}` : 'Oynanmadı'}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'kadro' && (
          <div className="space-y-2.5">
            <h2 className="font-bold text-sm text-zinc-800">Takım Kadrosu</h2>
            {filteredPlayers.map((p) => (
              <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 text-sky-400 font-extrabold text-xs flex items-center justify-center border border-sky-400/30">
                    {p.jersey_number || '-'}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-900">{p.full_name}</div>
                    <div className="text-xs text-zinc-500">{p.position}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-sky-600">{p.goals} Gol</span>
                  <span className="text-zinc-300 mx-1">•</span>
                  <span className="text-zinc-600">{p.assists} Asist</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'gundem' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-zinc-800">Duyurular & Haberler</h2>
            {announcements.map((a) => (
              <div key={a.id} className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
                <div className="text-[11px] text-sky-600 font-semibold mb-1">
                  {new Date(a.created_at).toLocaleDateString('tr-TR')}
                </div>
                <h3 className="font-bold text-sm text-zinc-900">{a.title}</h3>
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}