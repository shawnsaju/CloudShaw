/**
 * PlatformIcon — renders the official SVG logo for each social platform.
 * Usage: <PlatformIcon platform="instagram" size={28} />
 */
export default function PlatformIcon({ platform, size = 24 }) {
  const s = size;

  switch (platform) {
    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ig-grad-1" cx="30%" cy="107%" r="150%">
              <stop offset="0%" stopColor="#ffd600" />
              <stop offset="20%" stopColor="#ff7a00" />
              <stop offset="40%" stopColor="#ff0069" />
              <stop offset="70%" stopColor="#d300c5" />
              <stop offset="100%" stopColor="#7638fa" />
            </radialGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad-1)" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" fill="none" />
          <circle cx="17.3" cy="6.7" r="1.2" fill="white" />
        </svg>
      );

    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="5" width="22" height="14" rx="4" fill="#FF0000" />
          <polygon points="10,8.5 16,12 10,15.5" fill="white" />
        </svg>
      );

    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5" fill="#010101" />
          {/* Cyan shadow */}
          <path d="M13 3h2.5c.2 2.5 2 4.1 4 4.3v2.4c-1.5.1-3-.4-4.1-1.3V15a5 5 0 1 1-3.7-4.8V12.7a2.6 2.6 0 1 0 1.3 2.3V3z" fill="#69C9D0" transform="translate(0.5,0.5)" />
          {/* Red shadow */}
          <path d="M13 3h2.5c.2 2.5 2 4.1 4 4.3v2.4c-1.5.1-3-.4-4.1-1.3V15a5 5 0 1 1-3.7-4.8V12.7a2.6 2.6 0 1 0 1.3 2.3V3z" fill="#EE1D52" transform="translate(-0.5,-0.5)" opacity="0.7" />
          {/* White main */}
          <path d="M13 3h2.5c.2 2.5 2 4.1 4 4.3v2.4c-1.5.1-3-.4-4.1-1.3V15a5 5 0 1 1-3.7-4.8V12.7a2.6 2.6 0 1 0 1.3 2.3V3z" fill="white" />
        </svg>
      );

    case 'twitter':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path
            d="M17.5 3h2.9l-6.3 7.2L21.5 21h-5.8l-4.5-5.9L5.7 21H2.8l6.7-7.7L2.5 3h6l4.1 5.4L17.5 3zm-1 16.2h1.6L7.6 4.7H5.9l10.6 14.5z"
            fill="white"
          />
        </svg>
      );

    case 'facebook':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5" fill="#1877F2" />
          <path
            d="M16.5 8H14V6.5c0-.7.4-.9 1-.9h1.4V3H14c-2.5 0-3 1.8-3 3v2H9v3h2v8h3v-8h2l.5-3z"
            fill="white"
          />
        </svg>
      );

    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5" fill="#0A66C2" />
          <rect x="4" y="9" width="3" height="10" fill="white" />
          <circle cx="5.5" cy="6" r="1.8" fill="white" />
          <path d="M9 9h3v1.4c.5-.9 1.7-1.5 3-1.5 2.5 0 4 1.5 4 4.5V19h-3v-5c0-1.5-.6-2.5-2-2.5s-2 1-2 2.5v5H9V9z" fill="white" />
        </svg>
      );

    default:
      // 'other' — generic globe
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5" fill="#3D3D55" />
          <circle cx="12" cy="12" r="6.5" stroke="#8888aa" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="3" ry="6.5" stroke="#8888aa" strokeWidth="1.5" />
          <line x1="5.5" y1="12" x2="18.5" y2="12" stroke="#8888aa" strokeWidth="1.5" />
        </svg>
      );
  }
}
