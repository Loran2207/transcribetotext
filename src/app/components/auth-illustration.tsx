import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";

/* ═══════════════════════════════════════════════════════════════════════════
   CSS Keyframes — injected once, used by waveform bars + floating cards.
   Using CSS animations ensures they work in Vite production builds.
   ═══════════════════════════════════════════════════════════════════════════ */

const KEYFRAMES_ID = "auth-illustration-keyframes";

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes wave-bar {
      0%, 100% { transform: scaleY(0.3); }
      50% { transform: scaleY(1); }
    }
    @keyframes float-1 {
      0%, 100% { transform: translateY(0px) rotateY(8deg) rotateX(4deg); }
      50% { transform: translateY(-8px) rotateY(8deg) rotateX(4deg); }
    }
    @keyframes float-2 {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }
    @keyframes float-3 {
      0%, 100% { transform: translateY(0px) rotateY(-6deg) rotateX(-3deg); }
      50% { transform: translateY(-6px) rotateY(-6deg) rotateX(-3deg); }
    }
    @keyframes float-dot {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(6px, -8px); }
      66% { transform: translate(-4px, 4px); }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes highlight-pill {
      0%, 100% { background: rgba(255,255,255,0.06); }
      50% { background: rgba(255,255,255,0.14); }
    }
    @keyframes copied-toast {
      0% { opacity: 0; transform: translateY(4px); }
      15%, 70% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-4px); }
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shared glass card style
   ═══════════════════════════════════════════════════════════════════════════ */

const glassBase: React.CSSProperties = {
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: 16,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Card 1 — Waveform (back, top-right)
   ═══════════════════════════════════════════════════════════════════════════ */

function WaveformCard({ reduced }: { reduced: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div
      style={{
        ...glassBase,
        position: "absolute",
        top: -10,
        right: -20,
        width: 180,
        padding: "20px 16px 16px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        opacity: 0.75,
        zIndex: 1,
        animation: reduced ? "none" : "float-1 3s ease-in-out infinite",
        transformStyle: "preserve-3d",
        transform: "rotateY(8deg) rotateX(4deg)",
      }}
    >
      {/* Waveform bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 2,
          height: 48,
          marginBottom: 12,
        }}
      >
        {bars.map((i) => {
          const center = 9.5;
          const dist = Math.abs(i - center) / center;
          const duration = 0.5 + Math.random() * 0.7;
          const delay = i * 0.05;

          return (
            <div
              key={i}
              style={{
                width: 2.5,
                height: 40 * (1 - dist * 0.5),
                borderRadius: 2,
                background: "var(--primary)",
                opacity: 1 - dist * 0.4,
                transformOrigin: "bottom",
                animation: reduced
                  ? "none"
                  : `wave-bar ${duration}s ease-in-out ${delay}s infinite`,
                boxShadow: "0 0 6px rgba(88,101,242,0.3)",
              }}
            />
          );
        })}
      </div>

      {/* Recording label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#ef4444",
            animation: reduced ? "none" : "pulse-dot 1.2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.02em",
          }}
        >
          Recording...
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card 2 — Transcript (center, main)
   ═══════════════════════════════════════════════════════════════════════════ */

const SPEAKERS = [
  {
    initial: "A",
    name: "Alex",
    time: "00:12",
    color: "var(--primary)",
    text: "The Q3 results exceeded our targets...",
  },
  {
    initial: "M",
    name: "Maria",
    time: "00:24",
    color: "#a855f7",
    text: "Great news. What drove the growth?",
  },
  {
    initial: "K",
    name: "Kevin",
    time: "00:38",
    color: "#22c55e",
    text: "Mainly the new enterprise contracts.",
  },
];

function TranscriptCard({ reduced }: { reduced: boolean }) {
  const [visibleRows, setVisibleRows] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [cycle, setCycle] = useState(0);

  const resetCycle = useCallback(() => {
    setVisibleRows(0);
    setShowSummary(false);
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    if (reduced) {
      setVisibleRows(3);
      return;
    }

    // Stagger rows in
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 3; i++) {
      timers.push(setTimeout(() => setVisibleRows(i), i * 1500));
    }
    // Show summary after rows
    timers.push(setTimeout(() => setShowSummary(true), 5000));
    // Reset and loop
    timers.push(setTimeout(resetCycle, 8000));

    return () => timers.forEach(clearTimeout);
  }, [cycle, reduced, resetCycle]);

  return (
    <div
      style={{
        ...glassBase,
        position: "relative",
        width: 300,
        padding: "0",
        background: "rgba(255,255,255,0.09)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(88,101,242,0.08)",
        zIndex: 2,
        animation: reduced ? "none" : "float-2 4s ease-in-out infinite",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.01em",
          }}
        >
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
            padding: "2px 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#22c55e",
              animation: reduced
                ? "none"
                : "pulse-dot 1.5s ease-in-out infinite",
            }}
          />
          Live
        </span>
      </div>

      {/* Speaker rows */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 140 }}>
        {SPEAKERS.map((speaker, i) => (
          <motion.div
            key={`${speaker.initial}-${cycle}`}
            style={{
              display: "flex",
              gap: 8,
              opacity: 0,
            }}
            animate={
              i < visibleRows ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
            }
            initial={{ opacity: 0, y: 10 }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                color: "white",
                background: speaker.color,
                marginTop: 1,
              }}
            >
              {speaker.initial}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {speaker.name}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {speaker.time}
                </span>
              </div>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                }}
              >
                {speaker.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Summary shimmer */}
      <motion.div
        animate={showSummary ? { opacity: 1 } : { opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          padding: "10px 16px 14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            AI Summary generating...
          </span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)",
            backgroundSize: "200% 100%",
            animation: reduced ? "none" : "shimmer 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 8,
            borderRadius: 4,
            marginTop: 4,
            width: "60%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)",
            backgroundSize: "200% 100%",
            animation: reduced
              ? "none"
              : "shimmer 1.5s ease-in-out 0.2s infinite",
          }}
        />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card 3 — Export & Share (front, bottom-left)
   ═══════════════════════════════════════════════════════════════════════════ */

const FORMATS = ["TXT", "SRT", "DOCX"];

function ExportCard({ reduced }: { reduced: boolean }) {
  const [copiedVisible, setCopiedVisible] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const show = () => {
      setCopiedVisible(true);
      setTimeout(() => setCopiedVisible(false), 2000);
    };
    const timer = setInterval(show, 5000);
    // Fire once initially after a delay
    const initial = setTimeout(show, 3000);
    return () => {
      clearInterval(timer);
      clearTimeout(initial);
    };
  }, [reduced]);

  return (
    <div
      style={{
        ...glassBase,
        position: "absolute",
        bottom: -6,
        left: -24,
        width: 190,
        padding: "14px 14px 12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        zIndex: 3,
        animation: reduced ? "none" : "float-3 3.5s ease-in-out infinite",
        transformStyle: "preserve-3d",
        transform: "rotateY(-6deg) rotateX(-3deg)",
      }}
    >
      {/* Header */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.8)",
          display: "block",
          marginBottom: 10,
          letterSpacing: "0.01em",
        }}
      >
        Export & Share
      </span>

      {/* Format pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {FORMATS.map((fmt, i) => (
          <div
            key={fmt}
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(255,255,255,0.65)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: 3,
              animation: reduced
                ? "none"
                : `highlight-pill 2.5s ease-in-out ${i * 0.8}s infinite`,
            }}
          >
            {fmt}
            <span style={{ fontSize: 8, opacity: 0.5 }}>&#8595;</span>
          </div>
        ))}
      </div>

      {/* Share link row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          padding: "6px 8px",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 110,
          }}
        >
          transcribe.to/s/a8f2k
        </span>
        {/* Copy icon (simple SVG) */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      </div>

      {/* "Copied!" toast */}
      {copiedVisible && (
        <div
          style={{
            position: "absolute",
            bottom: -8,
            right: 12,
            fontSize: 9,
            fontWeight: 600,
            color: "#22c55e",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 6,
            padding: "3px 8px",
            animation: "copied-toast 2s ease-out forwards",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Floating ambient dots
   ═══════════════════════════════════════════════════════════════════════════ */

const DOTS = [
  { size: 10, x: "12%", y: "18%", opacity: 0.35, dur: "6s", delay: "0s" },
  { size: 14, x: "78%", y: "72%", opacity: 0.25, dur: "8s", delay: "1s" },
  { size: 8, x: "65%", y: "25%", opacity: 0.4, dur: "7s", delay: "2s" },
  { size: 12, x: "25%", y: "80%", opacity: 0.3, dur: "5s", delay: "0.5s" },
];

function AmbientDots({ reduced }: { reduced: boolean }) {
  return (
    <>
      {DOTS.map((dot, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            borderRadius: "50%",
            background: "var(--primary)",
            opacity: dot.opacity,
            filter: "blur(3px)",
            animation: reduced
              ? "none"
              : `float-dot ${dot.dur} ease-in-out ${dot.delay} infinite`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main illustration — all 3 cards visible simultaneously
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthIllustration() {
  const prefersReducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    ensureKeyframes();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        height: 320,
        perspective: "1200px",
      }}
    >
      {/* Radial glow behind main card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(88,101,242,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient floating dots */}
      <AmbientDots reduced={prefersReducedMotion} />

      {/* Card container — centered with perspective */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Entrance animations via motion */}
        <motion.div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.92 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
        >
          {/* Card 1 — Waveform (back, top-right) */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, x: 30, y: -20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1],
              delay: 0.5,
            }}
          >
            <WaveformCard reduced={prefersReducedMotion} />
          </motion.div>

          {/* Card 2 — Transcript (center) */}
          <TranscriptCard reduced={prefersReducedMotion} />

          {/* Card 3 — Export (front, bottom-left) */}
          <motion.div
            initial={
              prefersReducedMotion ? undefined : { opacity: 0, x: -20, y: 20 }
            }
            animate={
              prefersReducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }
            }
            transition={{
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1],
              delay: 0.7,
            }}
          >
            <ExportCard reduced={prefersReducedMotion} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
