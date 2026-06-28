import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { PLATFORMS } from '../utils/constants';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#7c6cf8', '#e1306c', '#ff0000', '#69c9d0', '#1da1f2', '#1877f2', '#0a66c2', '#f59e0b'];

const PLATFORM_COLORS = {
  instagram: '#e1306c',
  youtube: '#ff0000',
  tiktok: '#69c9d0',
  twitter: '#1da1f2',
  facebook: '#1877f2',
  linkedin: '#0a66c2',
  other: '#8888aa',
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 1rem', fontSize: '0.82rem' }}>
        <p style={{ margin: 0, fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: 0, color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, plRes, acRes] = await Promise.all([
          analyticsApi.overview(),
          analyticsApi.platformBreakdown(),
          analyticsApi.activity(),
        ]);
        setOverview(ovRes.data.data);
        setPlatforms(plRes.data.data.byPlatform);
        setActivity(acRes.data.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 120, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  const uploadRate = overview?.totalMedia > 0
    ? Math.round((overview.uploadedMedia / overview.totalMedia) * 100)
    : 0;

  const platformChartData = platforms.map((p) => ({
    name: PLATFORMS[p.platform]?.label || p.platform,
    value: p.total,
    uploaded: p.uploaded,
    pending: p.pending,
    color: PLATFORM_COLORS[p.platform] || '#8888aa',
  })).filter((p) => p.value > 0);

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
          📊 <span className="gradient-text">Analytics</span>
        </h2>
        <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Your content performance at a glance
        </p>
      </div>

      {/* Overview KPIs */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Folders', value: overview.totalFolders, icon: '📁', color: '#7c6cf8' },
            { label: 'Total Media', value: overview.totalMedia, icon: '🖼️', color: '#a89df8' },
            { label: 'Uploaded', value: overview.uploadedMedia, icon: '✅', color: '#22c55e' },
            { label: 'Pending', value: overview.pendingMedia, icon: '⏳', color: '#f59e0b' },
            { label: 'Upload Rate', value: `${uploadRate}%`, icon: '📈', color: uploadRate >= 75 ? '#22c55e' : '#f59e0b' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.color }} />
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* 14-day Activity Area Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            📅 14-Day Upload Activity
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activity} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c6cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c6cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUploaded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#5a5a78', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#5a5a78', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Uploaded" stroke="#7c6cf8" strokeWidth={2} fill="url(#colorCount)" dot={false} />
              <Area type="monotone" dataKey="uploaded" name="Marked Uploaded" stroke="#22c55e" strokeWidth={2} fill="url(#colorUploaded)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Pie Chart */}
        {platformChartData.length > 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              🌐 Media by Platform
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={platformChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {platformChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
              <div>No platform data yet.</div>
              <div style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>Upload some media to see the breakdown.</div>
            </div>
          </div>
        )}
      </div>

      {/* Platform Bar Chart */}
      {platformChartData.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            📊 Upload Progress by Platform
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformChartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#5a5a78', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#5a5a78', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="uploaded" name="Uploaded" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
