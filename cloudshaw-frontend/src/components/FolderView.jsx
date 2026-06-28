import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaApi } from '../services/api';
import { PLATFORMS, formatFileSize, copyToClipboard } from '../utils/constants';
import MediaModal from './MediaModal';
import UploadModal from './UploadModal';
import PlatformIcon from './PlatformIcon';
import toast from 'react-hot-toast';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: '⏳ Pending' },
  { key: 'uploaded', label: '✅ Uploaded' },
];

export default function FolderView({ folder, onBack }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  const searchTimeout = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const platform = PLATFORMS[folder.platform] || PLATFORMS.other;

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (searchQuery) params.search = searchQuery;
      const res = await mediaApi.getByFolder(folder._id, params);
      setMedia(res.data.data);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [folder._id, filter, searchQuery]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearchQuery(val), 400);
  };

  const handleUploaded = (newMedia) => {
    setMedia((prev) => [...newMedia, ...prev]);
  };

  const handleUpdate = (updated) => {
    setMedia((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
  };

  const handleDelete = (id) => {
    setMedia((prev) => prev.filter((m) => m._id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  // Drag-and-drop
  const handleDragOver = (e) => { e.preventDefault(); setDraggingOver(true); };
  const handleDragLeave = () => setDraggingOver(false);
  const handleDrop = (e) => { e.preventDefault(); setDraggingOver(false); if (e.dataTransfer.files.length) setShowUpload(true); };

  // Bulk actions
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === media.length) setSelected(new Set());
    else setSelected(new Set(media.map((m) => m._id)));
  };

  const bulkSetStatus = async (status) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await mediaApi.bulk([...selected], 'status', status);
      setMedia((prev) => prev.map((m) => selected.has(m._id) ? { ...m, status } : m));
      toast.success(`${selected.size} items marked as ${status}`);
      setSelected(new Set());
    } catch {
      toast.error('Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected items?`)) return;
    setBulkLoading(true);
    try {
      await mediaApi.bulk([...selected], 'delete');
      setMedia((prev) => prev.filter((m) => !selected.has(m._id)));
      toast.success(`${selected.size} items deleted`);
      setSelected(new Set());
      setBulkMode(false);
    } catch {
      toast.error('Bulk delete failed');
    } finally {
      setBulkLoading(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Title', 'Caption', 'Hashtags', 'Status', 'Scheduled Date', 'File Type', 'File Size', 'Created'];
    const rows = media.map((m) => [
      `"${(m.title || '').replace(/"/g, '""')}"`,
      `"${(m.caption || '').replace(/"/g, '""')}"`,
      `"${(m.hashtags || []).join(' ')}"`,
      m.status,
      m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : '',
      m.fileType,
      formatFileSize(m.fileSize),
      new Date(m.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${folder.name}-export.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const totalCount = media.length;
  const uploadedCount = media.filter((m) => m.status === 'uploaded').length;

  return (
    <div
      style={{ minHeight: '100vh', padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drag overlay */}
      {draggingOver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(124,108,248,0.15)', border: '3px dashed var(--accent)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'var(--accent-light)', backdropFilter: 'blur(4px)' }}>
          📤 Drop to Upload
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={onBack} className="btn-ghost" style={{ marginTop: 2 }}>← Back</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: folder.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 20px ${folder.color}44`, border: `2px solid ${folder.color}55` }}>
            <PlatformIcon platform={folder.platform} size={32} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{folder.name}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span style={{ color: platform.color, fontWeight: 600, fontSize: '0.85rem' }}>{platform.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{totalCount} items · {uploadedCount} uploaded</span>
            </div>
            {totalCount > 0 && (
              <div style={{ marginTop: '0.5rem', width: 200 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(uploadedCount / totalCount) * 100}%`, background: folder.color }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} className="btn-ghost" style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}>
            📤 Export CSV
          </button>
          <button
            onClick={() => { setBulkMode((v) => !v); setSelected(new Set()); }}
            className={bulkMode ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
          >
            {bulkMode ? '✓ Exit Bulk' : '☑ Bulk Select'}
          </button>
          <button onClick={() => setShowUpload(true)} className="btn-primary">
            ⬆️ Upload
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.2rem', marginBottom: '1.25rem', background: 'rgba(124,108,248,0.1)', border: '1px solid rgba(124,108,248,0.25)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
          <button onClick={toggleSelectAll} style={{ background: 'none', border: '1px solid var(--border-hover)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            {selected.size === media.length ? 'Deselect All' : 'Select All'}
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            {selected.size} of {totalCount} selected
          </span>
          {selected.size > 0 && (
            <>
              <div style={{ flex: 1 }} />
              <button onClick={() => bulkSetStatus('uploaded')} className="btn-success" style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }} disabled={bulkLoading}>
                ✅ Mark Uploaded
              </button>
              <button onClick={() => bulkSetStatus('pending')} className="btn-ghost" style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }} disabled={bulkLoading}>
                ⏳ Mark Pending
              </button>
              <button onClick={bulkDelete} className="btn-danger" style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }} disabled={bulkLoading}>
                🗑️ Delete ({selected.size})
              </button>
            </>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ background: filter === f.key ? 'var(--accent)' : 'transparent', color: filter === f.key ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 6, padding: '0.35rem 0.85rem', fontSize: '0.82rem', fontWeight: filter === f.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
          <input
            className="input"
            placeholder="Search by title, tags…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>

        {loading && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading…</span>}
      </div>

      {/* Grid */}
      {media.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h3 style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {search ? 'No results found' : 'No media yet'}
          </h3>
          <p style={{ margin: '0.5rem 0 1.5rem', fontSize: '0.875rem' }}>
            {search ? 'Try a different search term' : 'Upload photos or videos to get started'}
          </p>
          {!search && (
            <button onClick={() => setShowUpload(true)} className="btn-primary">⬆️ Upload Media</button>
          )}
        </div>
      ) : (
        <div className="media-grid">
          {media.map((item) => (
            <MediaTile
              key={item._id}
              item={item}
              bulkMode={bulkMode}
              selected={selected.has(item._id)}
              onSelect={() => toggleSelect(item._id)}
              onClick={() => { if (!bulkMode) setSelectedMedia(item); }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal folderId={folder._id} folderName={folder.name} onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
      )}
      {selectedMedia && (
        <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}
    </div>
  );
}

function MediaTile({ item, bulkMode, selected, onSelect, onClick }) {
  const isImage = item.fileType === 'image';
  const statusColor = item.status === 'uploaded' ? '#22c55e' : '#f59e0b';

  return (
    <div
      className="media-tile"
      onClick={bulkMode ? onSelect : onClick}
      title={item.title || item.fileName}
      style={{ outline: selected ? '2px solid var(--accent)' : undefined, outlineOffset: 2 }}
    >
      {isImage ? (
        <img src={item.filePath} alt={item.title || 'media'} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <video src={item.filePath} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
          <div style={{ position: 'absolute', fontSize: '2rem', opacity: 0.8 }}>▶</div>
        </div>
      )}

      {/* Bulk checkbox */}
      {bulkMode && (
        <div style={{ position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: 4, border: '2px solid #fff', background: selected ? 'var(--accent)' : 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          {selected && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
        </div>
      )}

      {/* Status dot */}
      <div className="status-dot" style={{ background: statusColor }} />

      {/* Scheduled badge */}
      {item.scheduledDate && (
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', color: '#a89df8' }}>
          📅 {new Date(item.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}

      {/* Hover overlay */}
      <div className="overlay">
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title || item.fileName}
        </div>
        {item.hashtags?.length > 0 && (
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.hashtags.slice(0, 3).join(' ')}
          </div>
        )}
      </div>
    </div>
  );
}
