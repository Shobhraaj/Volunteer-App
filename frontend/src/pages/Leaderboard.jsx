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
      <div className="flex justify-center mb-10">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
          <button className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'all' ? 'bg-white dark:bg-white/10 text-primary-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setTab('all')}>All Time</button>
          <button className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'weekly' ? 'bg-white dark:bg-white/10 text-primary-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setTab('weekly')}>This Week</button>
        </div>
      </div>

      {/* Podium */}
      {top3.length >= 1 && (
        <div className="flex flex-wrap items-end justify-center gap-6 mb-16 px-4">
          {podiumOrder.map((person) => {
            if (!person) return null;
            const isFirst = person.rank === 1;
            const isSecond = person.rank === 2;
            const cfg = PODIUM_CONFIG.find(c => c.rank === person.rank);
            
            return (
              <div
                key={person.rank}
                className={`animate-slide-up glass-card flex flex-col items-center p-6 md:p-8 min-w-[160px] md:min-w-[200px] border-2 text-center transition-transform apple-hover
                  ${isFirst ? 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/20 -translate-y-8 z-10' : 
                    isSecond ? 'bg-slate-300/10 border-slate-300/20 shadow-slate-300/20' : 
                    'bg-orange-500/10 border-orange-500/20 shadow-orange-500/20 -translate-y-4'}
                `}
              >
                <div className="mb-4 drop-shadow-md flex items-center justify-center">{cfg.medal}</div>
                <Initials name={person.full_name} rank={person.rank} sizeClasses={isFirst ? "w-20 h-20 text-2xl mb-4" : isSecond ? "w-16 h-16 text-xl mb-3" : "w-14 h-14 text-lg mb-3"} />
                <div className={`font-extrabold text-slate-900 dark:text-white mb-2 ${isFirst ? 'text-lg' : 'text-base'}`}>
                  {person.full_name}
                </div>
                <div className={`font-black tracking-tight mb-2 ${isFirst ? 'text-3xl text-amber-500' : isSecond ? 'text-2xl text-slate-400' : 'text-2xl text-orange-500'}`}>
                  {person.points?.toLocaleString() || 0}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                  {person.tasks_completed || 0} tasks
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {person.badges?.slice(0,2).map(b => (
                    <span key={b} className="skill-tag !text-[9px] !px-2 !py-0.5 !m-0 !bg-white/50 dark:!bg-white/10">{b}</span>
                  ))}
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
