import { useState } from 'react';
import { folderApi } from '../services/api';
import { PLATFORM_OPTIONS, DEFAULT_COLORS } from '../utils/constants';
import PlatformIcon from './PlatformIcon';
import toast from 'react-hot-toast';

export default function FolderModal({ folder = null, onClose, onSave }) {
  const isEdit = Boolean(folder);
  const [form, setForm] = useState({
    name: folder?.name || '',
    platform: folder?.platform || 'instagram',
    color: folder?.color || '#7c6cf8',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Folder name is required');
      return;
    }
    setLoading(true);
    try {
      const res = isEdit
        ? await folderApi.update(folder._id, form)
        : await folderApi.create(form);
      toast.success(isEdit ? 'Folder updated!' : 'Folder created!');
      onSave(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              {isEdit ? '✏️ Edit Folder' : '📁 New Folder'}
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {isEdit ? 'Update your account folder' : 'Create an account folder to organize your content'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.4rem 0.6rem', fontSize: '1.1rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Name */}
          <div>
            <label className="label">Folder Name</label>
            <input
              className="input"
              placeholder="e.g. @myinsta_account"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          {/* Platform */}
          <div>
            <label className="label">Platform</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, platform: p.value })}
                  style={{
                    background: form.platform === p.value ? 'rgba(124,108,248,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.platform === p.value ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.3rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlatformIcon platform={p.value} size={22} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: form.platform === p.value ? 'var(--accent-light)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="label">Accent Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    boxShadow: form.color === c ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${c}` : 'none',
                    transition: 'all 0.15s ease',
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ width: 28, height: 28, border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0, background: 'transparent' }}
                title="Custom color"
              />
            </div>
          </div>

          {/* Preview */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-sm)',
              background: form.color + '22', border: `2px solid ${form.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <PlatformIcon platform={form.platform} size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{form.name || 'Folder Name'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {PLATFORM_OPTIONS.find(p => p.value === form.platform)?.label}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Saving...' : isEdit ? '💾 Save Changes' : '✨ Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
