/**
 * Leaderboard page — ranks volunteers by points.
 * Data fetched from FastAPI /analytics/leaderboard with Firestore fallback.
 * Shows gold/silver/bronze podium for top 3, full ranked table below.
 */
import React, { useEffect, useState } from 'react';
import api from '../api';
import { Trophy, Medal, BarChart3 } from 'lucide-react';

const PODIUM_CONFIG = [
  { rank: 1, medal: <Medal className="w-12 h-12 text-amber-500" />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', shadow: 'rgba(245,158,11,0.3)', size: 72, elevation: 32 },
  { rank: 2, medal: <Medal className="w-10 h-10 text-slate-400" />, color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', shadow: 'rgba(148,163,184,0.2)', size: 60, elevation: 0  },
  { rank: 3, medal: <Medal className="w-9 h-9 text-orange-500" />, color: '#cd7c3a', bg: 'rgba(205,124,58,0.10)',  shadow: 'rgba(205,124,58,0.2)',  size: 54, elevation: 16 },
];

const BADGE_COLORS = {
  'Top Performer':   '#f59e0b',
  'Rising Star':     '#8b5cf6',
  'Reliable':        '#10b981',
  'Task Master':     '#06b6d4',
  'Community Hero':  '#ef4444',
};

// Demo data shown while loading or when API unavailable
const DEMO = [
  { rank:1, full_name:'Priya Sharma',   points:1480, tasks_completed:24, badges:['Top Performer','Task Master']    },
  { rank:2, full_name:'Arjun Mehta',    points:1210, tasks_completed:19, badges:['Rising Star','Reliable']         },
  { rank:3, full_name:'Sneha Patel',    points:980,  tasks_completed:16, badges:['Community Hero']                 },
  { rank:4, full_name:'Rahul Gupta',    points:860,  tasks_completed:14, badges:['Reliable']                       },
  { rank:5, full_name:'Ananya Reddy',   points:740,  tasks_completed:12, badges:['Rising Star']                    },
  { rank:6, full_name:'Vikram Singh',   points:620,  tasks_completed:10, badges:[]                                 },
  { rank:7, full_name:'Deepa Nair',     points:550,  tasks_completed:9,  badges:[]                                 },
  { rank:8, full_name:'Karan Joshi',    points:490,  tasks_completed:8,  badges:[]                                 },
  { rank:9, full_name:'Meera Iyer',     points:420,  tasks_completed:7,  badges:[]                                 },
  { rank:10,full_name:'Aditya Kumar',   points:380,  tasks_completed:6,  badges:[]                                 },
];

function Initials({ name, sizeClasses = "w-11 h-11 text-base", rank = 4 }) {
  const letters = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';
  const gradient = rank === 1 ? 'from-amber-400 to-amber-600' :
                   rank === 2 ? 'from-slate-300 to-slate-500' :
                   rank === 3 ? 'from-orange-400 to-orange-600' :
                   'from-primary-400 to-primary-600';
  return (
    <div className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shrink-0 shadow-md ${sizeClasses}`}>
      {letters}
    </div>
  );
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');

  useEffect(() => {
    api.getLeaderboard()
      .then((data) => setLeaders(data.length ? data : DEMO))
      .catch(() => setLeaders(DEMO))
      .finally(() => setLoading(false));
  }, []);

  const top3  = leaders.slice(0, 3);
  const rest  = leaders.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  if (loading) {
    return (
      <div className="main-content py-8 px-4 md:px-8">
        <div className="stats-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
        <div className="space-y-4 mt-8">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content py-8 px-4 md:px-8 animate-fade-in">
      {/* Page header */}
      <div className="text-center mb-10 flex flex-col items-center">
        <Trophy className="w-16 h-16 text-primary-500 mb-4" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Volunteer Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
          Rankings based on points, tasks completed, and community impact. 
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-24 relative z-30">
        <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg">
          <button className={`px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 ${tab === 'all' ? 'bg-white dark:bg-white/10 text-primary-500 shadow-premium scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setTab('all')}>All Time</button>
          <button className={`px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 ${tab === 'weekly' ? 'bg-white dark:bg-white/10 text-primary-500 shadow-premium scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setTab('weekly')}>This Week</button>
        </div>
      </div>

      {/* Podium Section — Using natural heights for step effect */}
      {top3.length >= 1 && (
        <div className="flex flex-wrap items-end justify-center gap-6 md:gap-10 mb-28 px-4 relative">
          {podiumOrder.map((person, idx) => {
            if (!person) return null;
            const isFirst = person.rank === 1;
            const isSecond = person.rank === 2;
            const cfg = PODIUM_CONFIG.find(c => c.rank === person.rank);
            
            return (
              <div 
                key={person.rank} 
                className="animate-slide-up w-full md:w-auto" 
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div
                  className={`glass-card flex flex-col items-center p-8 md:p-10 w-full md:w-72 border-2 text-center transition-all duration-300 apple-hover
                    ${isFirst ? 'bg-amber-500/5 border-amber-500/30 shadow-amber-500/20 z-10 min-h-[460px]' : 
                      isSecond ? 'bg-slate-400/5 border-slate-400/20 shadow-slate-400/20 min-h-[400px]' : 
                      'bg-orange-500/5 border-orange-500/20 shadow-orange-500/20 min-h-[340px]'}
                  `}
                >
                  <div className="mb-8 drop-shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                    {cfg.medal}
                  </div>
                  <Initials name={person.full_name} rank={person.rank} sizeClasses={isFirst ? "w-28 h-28 text-4xl mb-6 shadow-2xl" : isSecond ? "w-24 h-24 text-3xl mb-5 shadow-xl" : "w-20 h-20 text-2xl mb-4 shadow-lg"} />
                  
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[140px]">
                    <div className={`font-black text-slate-900 dark:text-white mb-2 tracking-tight ${isFirst ? 'text-3xl' : 'text-xl'}`}>
                      {person.full_name}
                    </div>
                    <div className={`font-black tracking-tighter mb-2 ${isFirst ? 'text-5xl text-amber-500' : isSecond ? 'text-4xl text-slate-400' : 'text-4xl text-orange-500'}`}>
                      {person.points?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-6 opacity-60">
                      {person.tasks_completed || 0} Tasks
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mt-auto">
                    {person.badges?.slice(0, 2).map(b => (
                      <span key={b} className="skill-tag !text-[10px] !px-3 !py-1 !m-0 !bg-primary-500/10 !text-primary-600 !border !border-primary-500/20 shadow-sm">{b}</span>
                    ))}
                    {(!person.badges || person.badges.length === 0) && (
                      <div className="h-7" /> 
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ranked table */}
      <div className="card">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary-500" /> Full Rankings</h3>
          <span className="text-sm font-bold text-slate-400">
            {leaders.length} volunteers
          </span>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Volunteer</th>
                <th>Points</th>
                <th>Tasks</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <span className={`font-extrabold text-lg flex items-center gap-1
                      ${v.rank === 1 ? 'text-amber-500' : v.rank === 2 ? 'text-slate-400' : v.rank === 3 ? 'text-orange-500' : 'text-slate-400'}
                    `}>
                      {v.rank === 1 ? <Medal className="w-5 h-5" /> : v.rank === 2 ? <Medal className="w-5 h-5" /> : v.rank === 3 ? <Medal className="w-5 h-5" /> : `#${v.rank}`}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-4">
                      <Initials name={v.full_name} rank={v.rank} sizeClasses="w-10 h-10 text-xs" />
                      <span className="font-bold text-slate-900 dark:text-white">{v.full_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-extrabold text-primary-500">
                      {v.points?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="font-bold text-slate-500">{v.tasks_completed || 0}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(v.badges || []).map(b => (
                        <span key={b} className="skill-tag !text-[10px] !px-2 !py-0.5 !m-0">{b}</span>
                      ))}
                      {(!v.badges || v.badges.length === 0) && (
                        <span className="text-xs font-bold text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
