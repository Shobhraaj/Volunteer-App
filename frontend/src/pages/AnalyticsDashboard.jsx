import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import SmartFilterBar from '../components/SmartFilterBar';
import ScrollReveal from '../components/ScrollReveal';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="card glass-card" style={{ padding: '12px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span>{p.name}:</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: 'all', skill: 'all', search: '' });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content"><div className="skeleton" style={{ height: 400 }} /></div>;
  if (!data) return <div className="main-content"><h3>Failed to load insights</h3></div>;

  const isAdmin = user?.role === 'organizer';

  // Smart Filtering logic for charts
  const processTrends = (trends) => {
    return trends.filter(t => {
      const matchesSearch = filters.search === '' || t.period.toLowerCase().includes(filters.search.toLowerCase());
      // In a real app, filtering would happen on the server based on location/skill
      return matchesSearch;
    });
  };

  const filteredTrends = processTrends(data.engagement_trends || []);

  return (
    <div className="main-content fade-in">
      <ScrollReveal>
        <div className="page-header flex justify-between items-center">
          <div>
            <h1>{isAdmin ? 'System Intelligence' : 'Performance Analytics'}</h1>
            <p>{isAdmin ? 'Global volunteer impact and resource optimization.' : 'Personal contribution metrics and growth tracking.'}</p>
          </div>
          <div className="flex gap-2">
             <button className="btn btn-secondary apple-hover micro-interaction" onClick={loadAnalytics}>🔄 Refresh Data</button>
          </div>
        </div>
      </ScrollReveal>

      {/* Smart Filters */}
      <ScrollReveal delay={0.1}>
        <SmartFilterBar 
          filters={filters} 
          setFilters={setFilters} 
          locations={['New Delhi', 'Bhopal', 'Mumbai', 'Bangalore']}
          skills={['Teaching', 'Medical', 'Environment', 'Legal', 'Tech']}
        />
      </ScrollReveal>

      {/* Stats Overview */}
      <div className="stats-grid">
        {isAdmin ? (
          <>
            <StatCard icon="📋" label="Total Assets" value={data.total_tasks} color="cyan" />
            <StatCard icon="✅" label="Completion Rate" value={`${data.completion_rate}%`} color="emerald" />
            <StatCard icon="👥" label="Active Force" value={data.total_volunteers} color="violet" />
            <StatCard icon="⚡" label="System Velocity" value="High" color="amber" />
          </>
        ) : (
          <>
            <StatCard icon="🏆" label="Global Rank" value={`#${data.my_rank || 1}`} color="amber" />
            <StatCard icon="🔥" label="Power Level" value={data.points || 0} color="violet" />
            <StatCard icon="✅" label="Tasks Sealed" value={data.tasks_completed} color="emerald" />
            <StatCard icon="✨" label="Reliability" value={`${data.reliability || 100}%`} color="cyan" />
          </>
        )}
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Chart 1: The "Pulse" (Engagement/Activity Trend) */}
        <ScrollReveal delay={0.2}>
          <div className="card glass-card">
            <h3>📈 {isAdmin ? 'System Engagement Pulse' : 'Personal Activity Pulse'}</h3>
            <div style={{ height: 320, width: '100%', marginTop: 24 }}>
              <ResponsiveContainer>
                <AreaChart data={filteredTrends}>
                  <defs>
                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                  <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={isAdmin ? "active_volunteers" : "tasks_completed"} 
                    stroke="var(--accent-primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPrimary)" 
                    name={isAdmin ? "Active Volunteers" : "Completions"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        {/* Chart 2: The "Mix" (Status Distribution) */}
        <ScrollReveal delay={0.3}>
          <div className="card glass-card">
            <h3>🎯 {isAdmin ? 'Task Lifecycle Mix' : 'Mission Status Mix'}</h3>
            <div style={{ height: 320, width: '100%', marginTop: 24 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.completion_breakdown || []}
                    cx="50%" cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {(data.completion_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        {/* Chart 3: Comparative Analysis */}
        <ScrollReveal delay={0.4}>
          <div className="card glass-card">
            <h3>📊 {isAdmin ? 'Skill Demand vs Participation' : 'Monthly Performance Bar'}</h3>
            <div style={{ height: 320, width: '100%', marginTop: 24 }}>
              <ResponsiveContainer>
                <BarChart data={isAdmin ? data.top_skills : filteredTrends.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                  <XAxis dataKey={isAdmin ? "skill" : "period"} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={isAdmin ? "count" : "tasks_completed"} 
                    fill="var(--accent-primary)" 
                    radius={[6, 6, 0, 0]}
                    name={isAdmin ? "Demand" : "Score"}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        {/* Chart 4: Reliability/Success Progression */}
        <ScrollReveal delay={0.5}>
          <div className="card glass-card">
            <h3>✨ {isAdmin ? 'Participation Rate Over Time' : 'Reliability Progression'}</h3>
            <div style={{ height: 320, width: '100%', marginTop: 24 }}>
              <ResponsiveContainer>
                <LineChart data={filteredTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                  <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={isAdmin ? "tasks_completed" : "active_volunteers"} 
                    stroke="#f59e0b" 
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: 'var(--bg-primary)' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    name={isAdmin ? "Completion Rate" : "Reliability %"}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

      </div>

      {!isAdmin && (
        <ScrollReveal delay={0.6}>
          <div className="card glass-card mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3>Achievements & Milestone Progression</h3>
              <span className="badge badge-amber">Level {Math.floor((data.points || 0) / 1000) + 1}</span>
            </div>
            <div className="flex items-center gap-6">
              <div style={{ flex: 1 }}>
                <div className="flex justify-between mb-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>Next Level Progress</span>
                  <span>{(data.points || 0) % 1000} / 1000 XP</span>
                </div>
                <div className="progress-bar" style={{ height: 12, borderRadius: 6 }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${((data.points || 0) % 1000) / 10}%`,
                      background: 'var(--gradient-primary)'
                    }} 
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {(data.badges || []).map(b => (
                  <div key={b} className="user-avatar apple-hover micro-interaction" title={b} style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    ✨
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
