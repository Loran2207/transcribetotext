import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* ═══════════════════════════════════════════════════════════════════════════
   SVG Logos — inline, real brand colors
   ═══════════════════════════════════════════════════════════════════════════ */

function ZoomLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#2D8CFF" />
      <path
        d="M5 7.5C5 6.67 5.67 6 6.5 6H11.5C12.33 6 13 6.67 13 7.5V12.5C13 13.33 12.33 14 11.5 14H6.5C5.67 14 5 13.33 5 12.5V7.5Z"
        fill="white"
      />
      <path d="M13 8.5L15.5 6.5V13.5L13 11.5V8.5Z" fill="white" />
    </svg>
  );
}

function GoogleMeetLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#00897B" />
      <path d="M5 7H11V13H5V7Z" fill="#FFF" opacity="0.9" />
      <path d="M11 8.5L14.5 6V14L11 11.5V8.5Z" fill="#FFF" opacity="0.9" />
      <rect x="6" y="8" width="1.5" height="1.5" rx="0.3" fill="#00897B" />
      <rect x="8.5" y="8" width="1.5" height="1.5" rx="0.3" fill="#00897B" />
      <rect x="6" y="10.5" width="1.5" height="1.5" rx="0.3" fill="#00897B" />
      <rect x="8.5" y="10.5" width="1.5" height="1.5" rx="0.3" fill="#00897B" />
    </svg>
  );
}

function YouTubeLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#FF0000" />
      <path d="M8 6.5L14 10L8 13.5V6.5Z" fill="white" />
    </svg>
  );
}

function TeamsLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#6264A7" />
      <text x="10" y="14" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif">
        T
      </text>
    </svg>
  );
}

function DriveLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 13L7 7H13L9.5 13H3.5Z" fill="#0066DA" />
      <path d="M7 7H13L16.5 13H9.5L7 7Z" fill="#00AC47" />
      <path d="M10 12L13 7L16.5 13H10Z" fill="#FFBA00" />
    </svg>
  );
}

function DropboxLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#0061FF" />
      <path d="M10 4L6 6.5L10 9L14 6.5L10 4Z" fill="white" opacity="0.9" />
      <path d="M6 6.5L10 9L6 11.5L2.5 9L6 6.5Z" fill="white" opacity="0.7" />
      <path d="M14 6.5L10 9L14 11.5L17.5 9L14 6.5Z" fill="white" opacity="0.7" />
      <path d="M10 9L6 11.5L10 14L14 11.5L10 9Z" fill="white" opacity="0.5" />
    </svg>
  );
}

function MicrophoneLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="var(--primary)" opacity="0.15" />
      <rect x="8" y="4" width="4" height="8" rx="2" fill="var(--primary)" />
      <path d="M6 10C6 12.2 7.8 14 10 14C12.2 14 14 12.2 14 10" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="14" x2="10" y2="16.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SlackLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#4A154B" />
      <rect x="5" y="8" width="4" height="2" rx="1" fill="#E01E5A" />
      <rect x="11" y="8" width="4" height="2" rx="1" fill="#36C5F0" />
      <rect x="5" y="11" width="4" height="2" rx="1" fill="#2EB67D" />
      <rect x="11" y="11" width="4" height="2" rx="1" fill="#ECB22E" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════════════════════ */

const LOGOS = [
  { Component: ZoomLogo, label: "Zoom" },
  { Component: GoogleMeetLogo, label: "Meet" },
  { Component: YouTubeLogo, label: "YouTube" },
  { Component: TeamsLogo, label: "Teams" },
  { Component: DriveLogo, label: "Drive" },
  { Component: DropboxLogo, label: "Dropbox" },
  { Component: MicrophoneLogo, label: "Record" },
  { Component: SlackLogo, label: "Slack" },
];

const SPEAKERS = [
  { initial: "A", name: "Alex", time: "00:12", color: "#3B82F6", text: "The Q3 results exceeded all our targets..." },
  { initial: "M", name: "Maria", time: "00:24", color: "#8B5CF6", text: "Great news. What drove the growth?" },
  { initial: "K", name: "Kevin", time: "00:38", color: "#10B981", text: "Mainly the new enterprise contracts." },
];

const WAVE_BARS = Array.from({ length: 28 }, (_, i) => i);

const FEATURE_PILLS = ["98% accuracy", "50+ languages", "Instant export"];

const glass: React.CSSProperties = {
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Main Illustration
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthIllustration() {
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP only for: marquee scroll + speaker row stagger + feature pills entrance
  // Everything else uses CSS keyframes (no nested context issues)
  useGSAP(
    () => {
      // ── A) MARQUEE — logos scrolling left infinitely ──
      gsap.to(".logos-track", {
        xPercent: -50,
        duration: 20,
        ease: "none",
        repeat: -1,
      });

      // ── B) SPEAKER ROWS — stagger in on mount ──
      gsap.fromTo(
        ".speaker-row",
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.5,
          duration: 0.7,
          ease: "power2.out",
          delay: 0.3,
        }
      );

      // ── C) Feature pills entrance ──
      gsap.fromTo(
        ".feature-pill",
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.5,
          ease: "power2.out",
          delay: 1.8,
        }
      );
    },
    { scope: containerRef }
  );

  // Double the logos array for seamless marquee
  const doubledLogos = [...LOGOS, ...LOGOS];

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflow: "hidden",
      }}
    >
      {/* ── Ambient Background ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        className="ambient-orb"
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "var(--primary)",
          opacity: 0.12,
          filter: "blur(40px)",
          top: "5%",
          right: "5%",
          pointerEvents: "none",
          zIndex: 0,
          animation: "float-slow 6s ease-in-out infinite",
        }}
      />
      <div
        className="ambient-orb"
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#a855f7",
          opacity: 0.1,
          filter: "blur(40px)",
          bottom: "10%",
          left: "2%",
          pointerEvents: "none",
          zIndex: 0,
          animation: "float-medium 8s ease-in-out infinite",
        }}
      />
      <div
        className="ambient-orb"
        style={{
          position: "absolute",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "var(--primary)",
          opacity: 0.08,
          filter: "blur(40px)",
          top: "40%",
          left: "5%",
          pointerEvents: "none",
          zIndex: 0,
          animation: "float-fast 5s ease-in-out infinite",
        }}
      />
      <div
        className="ambient-orb"
        style={{
          position: "absolute",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#10B981",
          opacity: 0.09,
          filter: "blur(40px)",
          top: "12%",
          left: "18%",
          pointerEvents: "none",
          zIndex: 0,
          animation: "float-slow 7s ease-in-out 1s infinite",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
         TOP — Logo Marquee Strip (GSAP-driven)
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div
          className="logos-track"
          style={{
            display: "flex",
            gap: 12,
            width: "max-content",
          }}
        >
          {doubledLogos.map((item, i) => {
            const Logo = item.Component;
            return (
              <div
                key={`${item.label}-${i}`}
                style={{
                  ...glass,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              >
                <Logo />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.8)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         CENTER — Glass Transcript Card
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          ...glass,
          position: "relative",
          zIndex: 1,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(88,101,242,0.08)",
        }}
      >
        {/* Waveform strip — pure CSS animation */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              height: 32,
              flex: 1,
            }}
          >
            {WAVE_BARS.map((i) => {
              const center = 13.5;
              const dist = Math.abs(i - center) / center;
              return (
                <div
                  key={i}
                  className="wave-bar"
                  style={{
                    width: 2.5,
                    height: `${Math.round(28 * (1 - dist * 0.5))}px`,
                    borderRadius: 2,
                    background: "var(--primary)",
                    opacity: 1 - dist * 0.35,
                    transformOrigin: "bottom",
                    flexShrink: 0,
                    boxShadow: "0 0 4px rgba(88,101,242,0.25)",
                    animation: `wave-bar ${0.4 + i * 0.05}s ease-in-out infinite`,
                    animationDelay: `${i * 0.06}s`,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              className="live-dot-css"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ef4444",
                flexShrink: 0,
                animation: "blink-dot 1.2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                whiteSpace: "nowrap",
              }}
            >
              Recording
            </span>
          </div>
        </div>

        {/* Transcript header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 8px",
          }}
        >
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

        {/* Speaker rows (GSAP stagger) */}
        <div style={{ padding: "6px 20px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {SPEAKERS.map((s) => (
            <div
              key={s.initial}
              className="speaker-row"
              style={{
                display: "flex",
                gap: 10,
                visibility: "hidden",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "white",
                  background: s.color,
                  marginTop: 1,
                }}
              >
                {s.initial}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.time}</span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.6)",
                    margin: 0,
                  }}
                >
                  {`"${s.text}"`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Summary shimmer — pure CSS */}
        <div
          style={{
            padding: "10px 20px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
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
         BOTTOM — Feature Pills (GSAP entrance)
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {FEATURE_PILLS.map((pill) => (
          <div
            key={pill}
            className="feature-pill"
            style={{
              ...glass,
              visibility: "hidden",
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "6px 14px",
              whiteSpace: "nowrap",
            }}
          >
            {pill}
          </div>
        ))}
      </div>
    </div>
  );
}
