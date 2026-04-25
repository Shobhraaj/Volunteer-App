import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import api from '../api';
import StatCard from '../components/StatCard';

const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
        </div>
        <div className="charts-grid">
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="main-content"><div className="empty-state"><h3>Failed to load analytics</h3></div></div>;
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p>Data-driven insights into volunteer engagement and platform performance</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <StatCard icon="👥" label="Total Volunteers" value={data.total_volunteers} color="cyan" />
        <StatCard icon="🏢" label="Total Organizers" value={data.total_organizers} color="violet" />
        <StatCard icon="📋" label="Total Tasks" value={data.total_tasks} color="amber" />
        <StatCard icon="✅" label="Completion Rate" value={`${data.completion_rate}%`} color="emerald" />
      </div>

      {/* Charts row 1 */}
      <div className="charts-grid">
        {/* Engagement Trends */}
        <div className="chart-card">
          <h3>📈 Engagement Trends</h3>
          {data.engagement_trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.engagement_trends}>
                <defs>
                  <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="active_volunteers" stroke="#06b6d4" fillOpacity={1} fill="url(#gradCyan)" name="Active Volunteers" />
                <Area type="monotone" dataKey="tasks_created" stroke="#8b5cf6" fillOpacity={1} fill="url(#gradViolet)" name="Tasks Created" />
                <Line type="monotone" dataKey="tasks_completed" stroke="#10b981" strokeWidth={2} dot={false} name="Tasks Completed" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}><p>No trend data yet</p></div>
          )}
        </div>

        {/* Completion Breakdown */}
        <div className="chart-card">
          <h3>🎯 Participation Breakdown</h3>
          {data.completion_breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.completion_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                >
                  {data.completion_breakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}><p>No participation data yet</p></div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-grid">
        {/* Top Skills */}
        <div className="chart-card">
          <h3>🔧 Most Demanded Skills</h3>
          {data.top_skills.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.top_skills} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Task Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}><p>No skill data yet</p></div>
          )}
        </div>

        {/* Demand Forecast */}
        <div className="chart-card">
          <h3>🔮 AI Demand Forecast</h3>
          {data.demand_forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.demand_forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="predicted_tasks" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Predicted Tasks" />
                <Line type="monotone" dataKey="predicted_volunteers_needed" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} name="Volunteers Needed" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}><p>Not enough data for forecasting</p></div>
          )}
        </div>
      </div>

      {/* Extra stat */}
      <div className="card">
        <div className="card-header">
          <h3>📊 Platform Health</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Avg Reliability</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(data.avg_reliability * 100).toFixed(0)}%</div>
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${data.avg_reliability * 100}%` }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Active Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.active_tasks}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of {data.total_tasks} total</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Completion Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-4)' }}>{data.completion_rate}%</div>
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${data.completion_rate}%`, background: 'linear-gradient(135deg, #10b981, #06b6d4)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
