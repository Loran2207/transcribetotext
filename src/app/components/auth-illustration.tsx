import {
  siZoom,
  siGooglemeet,
  siYoutube,
  siGoogledrive,
  siDropbox,
  siNotion,
  siDiscord,
  siSpotify,
} from "simple-icons";

/* ═══════════════════════════════════════════════════════════════════════════
   All animation is CSS-only (see src/styles/index.css).
   Zero JS runtime animation — no GSAP, no framer-motion, no setInterval.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Logo data (simple-icons, official SVG paths) ── */

const LOGOS = [
  { icon: siZoom, name: "Zoom" },
  { icon: siGooglemeet, name: "Google Meet" },
  { icon: siYoutube, name: "YouTube" },
  { icon: siGoogledrive, name: "Google Drive" },
  { icon: siDropbox, name: "Dropbox" },
  { icon: siNotion, name: "Notion" },
  { icon: siDiscord, name: "Discord" },
  { icon: siSpotify, name: "Spotify" },
];

/* ── Speaker data ── */

const SPEAKERS = [
  { initial: "A", name: "Alex", time: "00:12", bg: "#3B82F6", text: "The Q3 results exceeded all our targets...", delay: 0.5 },
  { initial: "M", name: "Maria", time: "00:24", bg: "#8B5CF6", text: "Great news. What drove the growth?", delay: 2 },
  { initial: "K", name: "Kevin", time: "00:38", bg: "#10B981", text: "Mainly the new enterprise contracts.", delay: 3.5 },
];

const FEATURE_PILLS = ["98% accuracy", "50+ languages", "Instant export"];

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthIllustration() {
  const doubledLogos = [...LOGOS, ...LOGOS];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* ── Ambient background orbs ── */}
      <div className="ambient-orb" style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "var(--primary)", opacity: 0.12, filter: "blur(40px)", top: "5%", right: "5%", pointerEvents: "none", zIndex: 0, animation: "float-slow 6s ease-in-out infinite" }} />
      <div className="ambient-orb" style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", background: "#a855f7", opacity: 0.1, filter: "blur(40px)", bottom: "8%", left: "2%", pointerEvents: "none", zIndex: 0, animation: "float-medium 8s ease-in-out infinite" }} />
      <div className="ambient-orb" style={{ position: "absolute", width: 50, height: 50, borderRadius: "50%", background: "#10B981", opacity: 0.09, filter: "blur(40px)", top: "40%", left: "5%", pointerEvents: "none", zIndex: 0, animation: "float-fast 5s ease-in-out infinite" }} />

      {/* ═══════════════════════════════════════════════════════════════════
         GLASS CARD — Waveform + Transcript
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 16,
          overflow: "hidden",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(88,101,242,0.15)",
        }}
      >
        {/* ── Waveform section ── */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          {/* Recording indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div
              className="live-dot-css"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#ef4444",
                animation: "blink-dot 1.2s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>
              REC
            </span>
          </div>

          {/* Waveform bars */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, height: 40, flex: 1 }}>
            {Array.from({ length: 32 }, (_, i) => i).map((index) => (
              <div
                key={index}
                className="wave-bar"
                style={{
                  width: 3,
                  height: 36,
                  background: "var(--primary)",
                  borderRadius: 2,
                  transformOrigin: "center",
                  flexShrink: 0,
                  animation: `wave-bar ${(0.4 + index * 0.04).toFixed(2)}s ease-in-out infinite`,
                  animationDelay: `${(index * 0.05).toFixed(2)}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

        {/* ── Transcript header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
            Meeting Transcript
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#22c55e",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 20,
              padding: "3px 10px",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              className="live-dot-css"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#22c55e",
                animation: "blink-dot 1.5s ease-in-out infinite",
              }}
            />
            Live
          </span>
        </div>

        {/* ── Speaker rows with typewriter text ── */}
        <div style={{ padding: "4px 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {SPEAKERS.map((s) => (
            <div key={s.initial} style={{ display: "flex", gap: 10 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "white",
                  background: s.bg,
                  marginTop: 1,
                }}
              >
                {s.initial}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.time}</span>
                </div>
                {/* Typewriter line */}
                <span
                  className="typewriter-text"
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    width: 0,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.6)",
                    animation: `typing 1.2s steps(30) ${s.delay}s forwards`,
                    borderRight: "2px solid var(--primary)",
                  }}
                >
                  &ldquo;{s.text}&rdquo;
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI Summary shimmer ── */}
        <div style={{ padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>
            &#10022; AI Summary generating...
          </span>
          {[100, 60].map((w, i) => (
            <div
              key={i}
              style={{
                height: 7,
                borderRadius: 4,
                marginTop: i > 0 ? 5 : 0,
                width: `${w}%`,
                background: "rgba(255,255,255,0.04)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                className="shimmer-bar-css"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  animation: `shimmer-slide 1.5s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         LOGOS MARQUEE — CSS-only infinite scroll
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="logos-marquee" style={{ position: "relative", zIndex: 1 }}>
        <div className="logos-track">
          {doubledLogos.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 100,
                whiteSpace: "nowrap",
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white" opacity="0.8">
                <path d={item.icon.path} />
              </svg>
              {item.name}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         FEATURE PILLS — bottom
         ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", gap: 10 }}>
        {FEATURE_PILLS.map((pill, i) => (
          <div
            key={pill}
            className="feature-pill-animated"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.65)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "6px 14px",
              whiteSpace: "nowrap",
              opacity: 0,
              animation: `fade-up 0.4s ease-out ${1.5 + i * 0.2}s forwards`,
            }}
          >
            {pill}
          </div>
        ))}
      </div>
    </div>
  );
}
