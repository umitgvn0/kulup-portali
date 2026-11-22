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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-sm font-medium tracking-wider uppercase text-slate-400">
          Kulüp Portalı Yükleniyor...
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Üst Kulüp Başlığı */}
      <header className="bg-slate-900 text-white pt-8 pb-6 px-5 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-extrabold text-xl shadow-inner">
              GG
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold block">
                Resmi Kulüp Portalı
              </span>
              <h1 className="text-lg font-bold leading-tight">{club?.name || 'İnegöl Gençlergücü SK'}</h1>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full border border-slate-700 transition"
          >
            Yönetim
          </Link>
        </div>

        {/* Yaş Grubu / Takım Filtresi */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedTeamId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedTeamId === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tüm Kulüp
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedTeamId === team.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      </header>

      {/* Ana Navigasyon Sekmeleri */}
      <nav className="grid grid-cols-4 gap-1 px-4 -mt-4">
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
              className={`flex flex-col items-center justify-center py-2.5 rounded-2xl text-xs font-semibold shadow-sm border transition ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
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
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between text-xs text-blue-600 font-bold mb-3">
                  <span>SIRADAKİ MAÇ</span>
                  <span>{new Date(upcomingMatch.match_date).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center justify-between text-center py-2">
                  <div className="w-2/5 font-bold text-sm">Gençlergücü</div>
                  <div className="w-1/5 text-xs font-extrabold bg-slate-100 py-1 rounded-lg text-slate-500">VS</div>
                  <div className="w-2/5 font-bold text-sm">{upcomingMatch.opponent_name}</div>
                </div>
                {upcomingMatch.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{upcomingMatch.location}</span>
                  </div>
                )}
              </div>
            )}

            {lastFinishedMatch && (
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-slate-400 font-medium mb-2">Son Maç Sonucu</div>
                <div className="flex items-center justify-between text-center">
                  <div className="w-2/5 font-semibold text-sm">Gençlergücü</div>
                  <div className="w-1/5 font-extrabold text-base bg-blue-600 py-1 rounded-lg">
                    {lastFinishedMatch.our_score} - {lastFinishedMatch.opponent_score}
                  </div>
                  <div className="w-2/5 font-semibold text-sm">{lastFinishedMatch.opponent_name}</div>
                </div>
              </div>
            )}

            {announcements[0] && (
              <div
                onClick={() => setActiveTab('gundem')}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:border-blue-200 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-600 uppercase">Kulüp Duyurusu</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{announcements[0].title}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{announcements[0].content}</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'fikstur' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-slate-800">Maç Takvimi & Sonuçlar</h2>
            {filteredMatches.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(m.match_date).toLocaleDateString('tr-TR')} • {m.is_home ? 'İç Saha' : 'Deplasman'}
                  </div>
                  <div className="font-bold text-sm mt-0.5">Gençlergücü vs {m.opponent_name}</div>
                </div>
                <div className="font-extrabold text-sm px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800">
                  {m.our_score !== null ? `${m.our_score} - ${m.opponent_score}` : 'Oynanmadı'}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'kadro' && (
          <div className="space-y-2.5">
            <h2 className="font-bold text-sm text-slate-800">Takım Kadrosu</h2>
            {filteredPlayers.map((p) => (
              <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {p.jersey_number || '-'}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{p.full_name}</div>
                    <div className="text-xs text-slate-500">{p.position}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-blue-600">{p.goals} Gol</span>
                  <span className="text-slate-400 mx-1">•</span>
                  <span className="text-slate-600">{p.assists} Asist</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'gundem' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-slate-800">Duyurular & Haberler</h2>
            {announcements.map((a) => (
              <div key={a.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[11px] text-slate-400 mb-1">
                  {new Date(a.created_at).toLocaleDateString('tr-TR')}
                </div>
                <h3 className="font-bold text-sm text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}