import { useState, useEffect } from 'react';
import { folderApi } from '../services/api';
import { PLATFORMS } from '../utils/constants';
import FolderModal from './FolderModal';
import PlatformIcon from './PlatformIcon';
import toast from 'react-hot-toast';

export default function Dashboard({ onOpenFolder }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await folderApi.getAll();
      setFolders(res.data.data);
    } catch (err) {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (saved) => {
    setFolders((prev) => {
      const idx = prev.findIndex((f) => f._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowModal(false);
    setEditingFolder(null);
  };

  const handleDelete = async (folder, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${folder.name}" and all its media?`)) return;
    try {
      await folderApi.delete(folder._id);
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
      toast.success('Folder deleted');
    } catch (err) {
      toast.error('Failed to delete folder');
    }
  };

  const handleEdit = (folder, e) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setShowModal(true);
  };

  const totalMedia = folders.reduce((s, f) => s + (f.totalMedia || 0), 0);
  const totalUploaded = folders.reduce((s, f) => s + (f.uploadedMedia || 0), 0);

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, lineHeight: 1.1 }}>
              <span className="gradient-text">CloudShaw</span>
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Your personal media vault & social content hub
            </p>
          </div>
          <button onClick={() => { setEditingFolder(null); setShowModal(true); }} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.7rem 1.4rem' }}>
            + New Folder
          </button>
        </div>

        {/* Stats Row */}
        {folders.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Folders', value: folders.length, icon: '📁' },
              { label: 'Total Media', value: totalMedia, icon: '🖼️' },
              { label: 'Uploaded', value: totalUploaded, icon: '✅' },
              { label: 'Pending', value: totalMedia - totalUploaded, icon: '⏳' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.5rem',
                flex: '1 1 120px',
                minWidth: 120,
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Folders Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 160, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {folders.map((folder) => (
            <FolderCard
              key={folder._id}
              folder={folder}
              onClick={() => onOpenFolder(folder)}
              onEdit={(e) => handleEdit(folder, e)}
              onDelete={(e) => handleDelete(folder, e)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FolderModal
          folder={editingFolder}
          onClose={() => { setShowModal(false); setEditingFolder(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function FolderCard({ folder, onClick, onEdit, onDelete }) {
  const platform = PLATFORMS[folder.platform] || PLATFORMS.other;
  const total = folder.totalMedia || 0;
  const uploaded = folder.uploadedMedia || 0;
  const pct = total > 0 ? (uploaded / total) * 100 : 0;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{ padding: '1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle color band at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: folder.color, borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 'var(--radius-sm)',
          background: folder.color + '22',
          border: `2px solid ${folder.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0,
        }}>
          <PlatformIcon platform={folder.platform} size={28} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {folder.name}
          </h3>
          <span style={{ fontSize: '0.75rem', color: platform.color, fontWeight: 600 }}>
            {platform.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {total} {total === 1 ? 'item' : 'items'} · {uploaded} uploaded
          </span>
          <span style={{ fontSize: '0.78rem', color: folder.color, fontWeight: 600 }}>
            {total > 0 ? Math.round(pct) : 0}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%`, background: folder.color }} />
        </div>
      </div>

      {/* Pending badge */}
      {total - uploaded > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <span className="badge badge-pending">{total - uploaded} pending</span>
        </div>
      )}
      {uploaded > 0 && total === uploaded && (
        <div style={{ marginBottom: '0.75rem' }}>
          <span className="badge badge-uploaded">All uploaded ✨</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
        <button onClick={onEdit} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem' }}>
          ✏️ Edit
        </button>
        <button onClick={onDelete} className="btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem' }}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☁️</div>
      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Your cloud is empty</h2>
      <p style={{ margin: '0.75rem 0 2rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Create your first folder to start organizing your social media content — separate accounts for each platform.
      </p>
      <button onClick={onAdd} className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.8rem 1.8rem' }}>
        📁 Create First Folder
      </button>
    </div>
  );
}
