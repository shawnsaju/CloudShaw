import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import FolderView from './components/FolderView';
import AnalyticsPage from './components/AnalyticsPage';
import CalendarView from './components/CalendarView';
import GlobalSearch from './components/GlobalSearch';
import './index.css';

// Active tab type: 'dashboard' | 'analytics' | 'calendar'
function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentFolder, setCurrentFolder] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>☁️</div>
          <p>Loading CloudShaw…</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <AuthPage />;

  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tab) => {
    setCurrentFolder(null);
    setActiveTab(tab);
  };

  const navTabs = [
    { key: 'dashboard', label: '📁 Folders' },
    { key: 'analytics', label: '📊 Analytics' },
    { key: 'calendar', label: '📅 Calendar' },
  ];

  return (
    <>
      {/* Ambient background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,108,248,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,157,248,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Logo */}
        <button
          onClick={() => handleTabChange('dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
        >
          <span style={{ fontSize: '1.3rem' }}>☁️</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #7c6cf8, #c4b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CloudShaw
          </span>
        </button>

        {/* Nav Tabs — only show when not in folder view */}
        {!currentFolder && (
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
            {navTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  background: activeTab === tab.key ? 'rgba(124,108,248,0.3)' : 'transparent',
                  border: activeTab === tab.key ? '1px solid rgba(124,108,248,0.4)' : '1px solid transparent',
                  color: activeTab === tab.key ? '#c4b8ff' : 'var(--text-secondary)',
                  borderRadius: 6, padding: '0.3rem 0.9rem', fontSize: '0.82rem',
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Breadcrumb in folder view */}
        {currentFolder && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <button onClick={() => setCurrentFolder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
              Folders
            </button>
            <span style={{ color: 'var(--border)' }}>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentFolder.name}</span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Global Search */}
        <GlobalSearch onOpenFolder={handleOpenFolder} />

        {/* User avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6cf8, #a89df8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="btn-ghost"
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 56px)' }}>
        {currentFolder ? (
          <FolderView folder={currentFolder} onBack={() => setCurrentFolder(null)} />
        ) : activeTab === 'analytics' ? (
          <AnalyticsPage />
        ) : activeTab === 'calendar' ? (
          <CalendarView onOpenFolder={handleOpenFolder} />
        ) : (
          <Dashboard onOpenFolder={handleOpenFolder} />
        )}
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: 'transparent' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'transparent' } },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
