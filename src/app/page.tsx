'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Users, Trophy, Bell, MapPin, Shield, ChevronRight } from 'lucide-react';

export default function ClubPortal() {
  const [club, setClub] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'genel' | 'fikstur' | 'kadro' | 'duyurular'>('genel');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortalData() {
      const { data: clubData } = await supabase
        .from('clubs')
        .select('*')
        .eq('slug', 'genclergucu')
        .single();

      if (clubData) {
        setClub(clubData);

        const [teamsRes, playersRes, matchesRes, annRes] = await Promise.all([
          supabase.from('teams').select('*').eq('club_id', clubData.id).order('sort_order'),
          supabase.from('players').select('*').eq('club_id', clubData.id).order('jersey_number'),
          supabase.from('matches').select('*').eq('club_id', clubData.id).order('match_date', { ascending: true }),
          supabase.from('announcements').select('*').eq('club_id', clubData.id).order('created_at', { ascending: false }),
        ]);

        setTeams(teamsRes.data || []);
        setPlayers(playersRes.data || []);
        setMatches(matchesRes.data || []);
        setAnnouncements(annRes.data || []);
      }
      setLoading(false);
    }

    loadPortalData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <Shield className="w-12 h-12 text-blue-500 animate-pulse mb-3" />
        <p className="text-sm tracking-widest uppercase text-slate-400">Kulüp Portalı Yükleniyor...</p>
      </div>
    );
  }

  const filteredPlayers = selectedTeamId === 'all'
    ? players
    : players.filter((p) => p.team_id === selectedTeamId);

  const filteredMatches = selectedTeamId === 'all'
    ? matches
    : matches.filter((m) => m.team_id === selectedTeamId);

  const nextMatch = filteredMatches.find((m) => m.our_score === null);
  const lastMatch = [...filteredMatches].reverse().find((m) => m.our_score !== null);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24 max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Üst Kulüp Başlığı */}
      <header className="bg-slate-900 text-white pt-8 pb-6 px-5 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-inner">
              GG
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-blue-400 font-semibold">
                Resmi Kulüp Portalı
              </span>
              <h1 className="text-lg font-bold leading-tight">{club?.name || 'İnegöl Gençlergücü SK'}</h1>
            </div>
          </div>
          <a
            href="/admin"
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700"
          >
            Yönetim
          </a>
        </div>

        {/* Benim Takımım Seçici */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedTeamId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedTeamId === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Tüm Kulüp
          </button>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedTeamId === team.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      </header>

      {/* Hızlı İkon Menü */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-4">
        {[
          { id: 'genel', label: 'Özet', icon: Trophy },
          { id: 'fikstur', label: 'Fikstür', icon: Calendar },
          { id: 'kadro', label: 'Kadro', icon: Users },
          { id: 'duyurular', label: 'Gündem', icon: Bell },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-3 rounded-2xl shadow-sm border transition ${
                active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* İçerik Alanı */}
      <main className="px-4 mt-5 space-y-5">
        {/* GENEL BAKIŞ */}
        {activeTab === 'genel' && (
          <>
            {/* Sıradaki Maç Kartı */}
            {nextMatch && (
              <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-blue-600 uppercase">Sıradaki Maç</span>
                  <span>{new Date(nextMatch.match_date).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-base py-2">
                  <span className="w-2/5 text-left">Gençlergücü</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">VS</span>
                  <span className="w-2/5 text-right">{nextMatch.opponent_name}</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-xs text-slate-500 gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{nextMatch.location || 'İnegöl İlçe Stadı'}</span>
                </div>
              </section>
            )}

            {/* Son Maç Skoru */}
            {lastMatch && (
              <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-slate-400 mb-2">Son Maç Sonucu</div>
                <div className="flex items-center justify-between font-bold">
                  <span className="w-2/5 text-sm">Gençlergücü</span>
                  <span className="px-3 py-1 bg-blue-600 rounded-xl text-base">
                    {lastMatch.our_score} - {lastMatch.opponent_score}
                  </span>
                  <span className="w-2/5 text-right text-sm">{lastMatch.opponent_name}</span>
                </div>
              </section>
            )}

            {/* Son Duyuru */}
            {announcements[0] && (
              <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-600 uppercase">Kulüp Duyurusu</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="font-bold text-sm mb-1">{announcements[0].title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{announcements[0].content}</p>
              </section>
            )}
          </>
        )}

        {/* FİKSTÜR & SKORLAR */}
        {activeTab === 'fikstur' && (
          <div className="space-y-3">
            <h2 className="font-bold text-base">Maç Takvimi & Skorlar</h2>
            {filteredMatches.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>{new Date(m.match_date).toLocaleDateString('tr-TR')}</span>
                  <span>{m.is_home ? 'İç Saha' : 'Deplasman'}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>Gençlergücü</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100">
                    {m.our_score !== null ? `${m.our_score} - ${m.opponent_score}` : 'Oynanmadı'}
                  </span>
                  <span>{m.opponent_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KADRO */}
        {activeTab === 'kadro' && (
          <div className="space-y-3">
            <h2 className="font-bold text-base">Oyuncu Kadrosu ({filteredPlayers.length})</h2>
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                    #{player.jersey_number || '-'}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{player.full_name}</div>
                    <div className="text-xs text-slate-500">{player.position}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-blue-600">{player.goals} Gol</div>
                  <div className="text-slate-400">{player.assists} Asist</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DUYURULAR */}
        {activeTab === 'duyurular' && (
          <div className="space-y-3">
            <h2 className="font-bold text-base">Kulüp Gündemi</h2>
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] text-slate-400 mb-1">
                  {new Date(ann.created_at).toLocaleDateString('tr-TR')}
                </div>
                <h3 className="font-bold text-sm mb-1">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}