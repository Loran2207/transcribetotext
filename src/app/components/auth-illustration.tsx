import {
  siZoom,
  siGooglemeet,
  siYoutube,
  siGoogledrive,
  siDropbox,
  siNotion,
  siDiscord,
  siSpotify,
} from 'simple-icons'

const LOGOS = [
  { icon: siZoom, name: 'Zoom' },
  { icon: siGooglemeet, name: 'Google Meet' },
  { icon: siYoutube, name: 'YouTube' },
  { icon: siGoogledrive, name: 'Google Drive' },
  { icon: siDropbox, name: 'Dropbox' },
  { icon: siNotion, name: 'Notion' },
  { icon: siDiscord, name: 'Discord' },
  { icon: siSpotify, name: 'Spotify' },
]

const SPEAKERS = [
  { initial: 'A', name: 'Alex', time: '00:12', bg: '#3B82F6', text: 'The Q3 results exceeded all our targets...' },
  { initial: 'M', name: 'Maria', time: '00:24', bg: '#8B5CF6', text: 'Great news. What drove the growth?' },
  { initial: 'K', name: 'Kevin', time: '00:38', bg: '#10B981', text: 'Mainly the new enterprise contracts.' },
]

export function AuthIllustration() {
  return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 16,
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(88,101,242,0.15)',
        }}
      >
        {/* Waveform section */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
              REC
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 40, flex: 1 }}>
            {Array.from({ length: 32 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 36,
                  background: 'var(--primary)',
                  borderRadius: 2,
                  transformOrigin: 'center',
                  flexShrink: 0,
                  animation: `wave-bar-test ${(0.4 + i * 0.04).toFixed(2)}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.05).toFixed(2)}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

        {/* Transcript header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 8px' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            Meeting Transcript
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#22c55e',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 20, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
            Live
          </span>
        </div>

        {/* Speaker rows — static text */}
        <div style={{ padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SPEAKERS.map((s) => (
            <div key={s.initial} style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', background: s.bg, marginTop: 1,
              }}>
                {s.initial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.time}</span>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  &ldquo;{s.text}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee logos strip */}
      <div style={{
        overflow: 'hidden',
        marginTop: 16,
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}>
        <div style={{
          display: 'flex',
          gap: 12,
          width: 'max-content',
          animation: 'marquee 25s linear infinite',
        }}>
          {[...LOGOS, ...LOGOS].map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 100,
                whiteSpace: 'nowrap',
                fontSize: 13,
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="white" opacity={0.7}>
                <path d={item.icon.path} />
              </svg>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
