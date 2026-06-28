import { useState, useEffect } from 'react';
import { mediaApi } from '../services/api';
import { copyToClipboard, formatDate, formatFileSize } from '../utils/constants';
import toast from 'react-hot-toast';

export default function MediaModal({ media: initialMedia, onClose, onUpdate, onDelete }) {
  const [media, setMedia] = useState(initialMedia);
  const [form, setForm] = useState({
    title: initialMedia.title || '',
    caption: initialMedia.caption || '',
    hashtags: (initialMedia.hashtags || []).join(' '),
    scheduledDate: initialMedia.scheduledDate
      ? new Date(initialMedia.scheduledDate).toISOString().slice(0, 10)
      : '',
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState('edit'); // 'edit' | 'preview'

  useEffect(() => {
    const orig = {
      title: initialMedia.title || '',
      caption: initialMedia.caption || '',
      hashtags: (initialMedia.hashtags || []).join(' '),
      scheduledDate: initialMedia.scheduledDate
        ? new Date(initialMedia.scheduledDate).toISOString().slice(0, 10)
        : '',
    };
    setDirty(JSON.stringify(form) !== JSON.stringify(orig));
  }, [form, initialMedia]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        caption: form.caption,
        hashtags: form.hashtags.split(/[\s,]+/).filter(Boolean),
        scheduledDate: form.scheduledDate || null,
      };
      const res = await mediaApi.update(media._id, payload);
      setMedia(res.data.data);
      onUpdate(res.data.data);
      setDirty(false);
      toast.success('Metadata saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = media.status === 'pending' ? 'uploaded' : 'pending';
    try {
      const res = await mediaApi.toggleStatus(media._id, newStatus);
      setMedia(res.data.data);
      onUpdate(res.data.data);
      toast.success(newStatus === 'uploaded' ? '✅ Marked as Uploaded!' : '↩️ Marked as Pending');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this media item? This cannot be undone.')) return;
    try {
      await mediaApi.delete(media._id);
      toast.success('Media deleted');
      onDelete(media._id);
      onClose();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = media.filePath;
    a.download = media.fileName || 'cloudshaw_media';
    a.click();
  };

  const handleCopy = async (type) => {
    let text = '';
    if (type === 'caption') text = form.caption;
    else if (type === 'hashtags') text = form.hashtags;
    else text = [form.caption, form.hashtags].filter(Boolean).join('\n\n');

    if (!text.trim()) { toast.error('Nothing to copy'); return; }
    await copyToClipboard(text);
    toast.success(`${type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)} copied!`);
  };

  const isImage = media.fileType === 'image';
  const mediaUrl = media.filePath;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{isImage ? '🖼️' : '🎬'}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {media.title || media.fileName}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem', alignItems: 'center' }}>
                <span className={`badge ${media.status === 'uploaded' ? 'badge-uploaded' : 'badge-pending'}`}>
                  {media.status === 'uploaded' ? '✅ Uploaded' : '⏳ Pending'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  {formatFileSize(media.fileSize)} · {formatDate(media.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.4rem 0.6rem' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 400 }}>
          {/* Left: Media Preview */}
          <div style={{
            background: '#000',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            position: 'relative',
          }}>
            {isImage ? (
              <img src={mediaUrl} alt={media.title || 'media'} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 450 }} />
            ) : (
              <video src={mediaUrl} controls style={{ width: '100%', maxHeight: 450 }} />
            )}
          </div>

          {/* Right: Edit Form */}
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: 500 }}>
            {/* Title */}
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="Post title…"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Caption */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="label" style={{ margin: 0 }}>Caption</label>
                <button onClick={() => handleCopy('caption')} className="btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                  📋 Copy
                </button>
              </div>
              <textarea
                className="input"
                placeholder="Write your caption here…"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                rows={5}
                style={{ resize: 'vertical', minHeight: 100 }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {form.caption.length} / 2200
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="label" style={{ margin: 0 }}>Hashtags</label>
                <button onClick={() => handleCopy('hashtags')} className="btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                  📋 Copy
                </button>
              </div>
              <textarea
                className="input"
                placeholder="#hashtag1 #hashtag2 #hashtag3"
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                rows={3}
                style={{ resize: 'none' }}
              />
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Separate with spaces or commas
              </p>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="label">📅 Schedule Date</label>
              <input
                className="input"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                style={{ colorScheme: 'dark' }}
              />
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Optional: when you plan to post this
              </p>
            </div>
            {dirty && (
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? '⏳ Saving…' : '💾 Save Metadata'}
              </button>
            )}
          </div>
        </div>

        {/* Footer: Action Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Copy actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => handleCopy('caption')} className="btn-ghost" style={{ fontSize: '0.78rem' }}>
              📋 Caption
            </button>
            <button onClick={() => handleCopy('hashtags')} className="btn-ghost" style={{ fontSize: '0.78rem' }}>
              📋 Hashtags
            </button>
            <button onClick={() => handleCopy('all')} className="btn-primary" style={{ fontSize: '0.78rem' }}>
              📋 Copy All
            </button>
          </div>

          {/* Right side actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={handleDownload} className="btn-ghost" style={{ fontSize: '0.78rem' }}>
              ⬇️ Download
            </button>
            <button
              onClick={handleStatusToggle}
              className={media.status === 'uploaded' ? 'btn-ghost' : 'btn-success'}
              style={{ fontSize: '0.78rem' }}
            >
              {media.status === 'uploaded' ? '↩️ Undo Upload' : '✅ Mark Uploaded'}
            </button>
            <button onClick={handleDelete} className="btn-danger" style={{ fontSize: '0.78rem' }}>
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
