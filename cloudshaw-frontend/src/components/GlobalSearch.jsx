import { useState, useEffect, useRef, useCallback } from 'react';
import { searchApi } from '../services/api';
import { PLATFORMS } from '../utils/constants';
import PlatformIcon from './PlatformIcon';

export default function GlobalSearch({ onOpenFolder, onOpenMedia }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ folders: [], media: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ folders: [], media: [] });
    }
  }, [open]);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults({ folders: [], media: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await searchApi.global(q);
      setResults(res.data.data);
    } catch {
      setResults({ folders: [], media: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const hasResults = results.folders.length > 0 || results.media.length > 0;
  const totalResults = results.folders.length + results.media.length;

  if (!open) {
    return (
      <button
        id="global-search-btn"
        onClick={() => setOpen(true)}
        title="Search (Ctrl+K)"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.9rem',
          color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer',
          transition: 'all 0.2s', fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        🔍 Search…
        <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Ctrl+K
        </kbd>
      </button>
    );
  }

  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 1rem 0', animation: 'fadeIn 0.15s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, background: 'var(--bg-card)', border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-xl)', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,108,248,0.15)', overflow: 'hidden', animation: 'slideUp 0.2s ease' }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.2rem', borderBottom: hasResults || loading ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            id="global-search-input"
            value={query}
            onChange={handleInput}
            placeholder="Search folders, media, hashtags…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit' }}
          />
          {loading && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Searching…</span>}
          <kbd onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Esc</kbd>
        </div>

        {/* Results */}
        {hasResults && (
          <div style={{ maxHeight: 420, overflowY: 'auto', padding: '0.5rem' }}>
            {/* Folders section */}
            {results.folders.length > 0 && (
              <div>
                <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Folders ({results.folders.length})
                </div>
                {results.folders.map((folder) => {
                  const platform = PLATFORMS[folder.platform] || PLATFORMS.other;
                  return (
                    <button
                      key={folder._id}
                      onClick={() => { onOpenFolder(folder); setOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: folder.color + '22', border: `2px solid ${folder.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PlatformIcon platform={folder.platform} size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</div>
                        <div style={{ fontSize: '0.72rem', color: platform.color }}>{platform.label}</div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>📁 Folder</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Media section */}
            {results.media.length > 0 && (
              <div style={{ marginTop: results.folders.length > 0 ? '0.5rem' : 0 }}>
                <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Media ({results.media.length})
                </div>
                {results.media.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => {
                      if (item.folderId) onOpenFolder(item.folderId);
                      setOpen(false);
                    }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {item.fileType === 'image' ? (
                      <img src={item.filePath} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, border: '1px solid var(--border)' }}>🎬</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title || item.fileName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.folderId?.name && `📁 ${item.folderId.name}`}
                        {item.hashtags?.length > 0 && <span style={{ marginLeft: '0.4rem', color: 'var(--accent-light)' }}>{item.hashtags.slice(0, 3).join(' ')}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: item.status === 'uploaded' ? '#22c55e' : '#f59e0b', flexShrink: 0 }}>
                      {item.status === 'uploaded' ? '✅' : '⏳'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {query.trim().length >= 2 && !loading && !hasResults && (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            No results for "{query}"
          </div>
        )}

        {/* Footer hint */}
        <div style={{ padding: '0.65rem 1.2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>↵ Open</span>
          <span>Esc Close</span>
          {totalResults > 0 && <span style={{ marginLeft: 'auto' }}>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>}
        </div>
      </div>
    </div>
  );
}
