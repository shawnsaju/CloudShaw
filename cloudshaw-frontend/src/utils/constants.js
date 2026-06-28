// Platform metadata: icon emoji + display label + color
export const PLATFORMS = {
  instagram: { label: 'Instagram', icon: '📸', color: '#e1306c', gradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
  youtube:   { label: 'YouTube',   icon: '▶️', color: '#ff0000', gradient: 'linear-gradient(45deg, #ff0000, #cc0000)' },
  tiktok:    { label: 'TikTok',    icon: '🎵', color: '#69c9d0', gradient: 'linear-gradient(45deg, #010101, #69c9d0)' },
  twitter:   { label: 'X / Twitter', icon: '🐦', color: '#1da1f2', gradient: 'linear-gradient(45deg, #1da1f2, #0d8bd9)' },
  facebook:  { label: 'Facebook',  icon: '👥', color: '#1877f2', gradient: 'linear-gradient(45deg, #1877f2, #0c59cf)' },
  linkedin:  { label: 'LinkedIn',  icon: '💼', color: '#0a66c2', gradient: 'linear-gradient(45deg, #0a66c2, #064e93)' },
  other:     { label: 'Other',     icon: '🌐', color: '#8888aa', gradient: 'linear-gradient(45deg, #555577, #8888aa)' },
};

export const PLATFORM_OPTIONS = Object.entries(PLATFORMS).map(([value, meta]) => ({ value, ...meta }));

export const DEFAULT_COLORS = [
  '#7c6cf8', '#e1306c', '#ff0000', '#69c9d0', '#1da1f2',
  '#1877f2', '#0a66c2', '#f59e0b', '#22c55e', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316',
];

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};
