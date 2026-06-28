import { useState, useRef } from 'react';
import { mediaApi } from '../services/api';
import toast from 'react-hot-toast';

const ACCEPT = 'image/*,video/*';

export default function UploadModal({ folderId, folderName, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (valid.length !== newFiles.length) toast.error('Only images and videos are allowed');
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...valid.filter((f) => !existing.has(f.name + f.size))];
    });
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!files.length) { toast.error('Please select files first'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await mediaApi.upload(folderId, formData, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      toast.success(`✅ ${res.data.count} file(s) uploaded!`);
      onUploaded(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const fmtSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>⬆️ Upload Media</h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Uploading to <strong style={{ color: 'var(--accent-light)' }}>{folderName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.4rem 0.6rem' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Drop Zone */}
          <div
            className={`dropzone ${dragging ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => addFiles(e.target.files)} />
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📁</div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>
              {dragging ? 'Drop files here!' : 'Drag & drop photos or videos'}
            </p>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              or click to browse · JPG, PNG, GIF, WEBP, MP4, MOV, HEIC · Max 500 MB
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {files.length} FILE{files.length > 1 ? 'S' : ''} · {fmtSize(totalSize)}
                </span>
                <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  Clear all
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 220, overflowY: 'auto' }}>
                {files.map((f, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem', border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>{f.type.startsWith('video/') ? '🎬' : '🖼️'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmtSize(f.size)}</div>
                    </div>
                    <button onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn-ghost" disabled={uploading}>Cancel</button>
            <button onClick={handleUpload} className="btn-primary" disabled={uploading || !files.length}>
              {uploading ? `Uploading ${progress}%…` : `⬆️ Upload ${files.length > 0 ? `(${files.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
