import { useState, useEffect } from "react";
import { motion } from "motion/react";

/*
 * All @keyframes are in src/styles/index.css:
 *   float-slow, float-medium, float-fast, bar-pulse,
 *   blink-dot, shimmer, highlight-pill
 *
 * Layout: simple stacked cards (no absolute positioning, no 3D transforms).
 * JS state: only one phase counter for transcript row cycling.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Shared glass card style
   ═══════════════════════════════════════════════════════════════════════════ */

const glass: React.CSSProperties = {
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: 16,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Card 1 — Waveform
   ═══════════════════════════════════════════════════════════════════════════ */

const BARS = Array.from({ length: 20 }, (_, i) => i);

function WaveformCard() {
  return (
    <div
      style={{
        ...glass,
        position: "relative",
        width: "85%",
        marginLeft: "auto",
        marginBottom: -20,
        padding: "20px 16px 16px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        zIndex: 1,
        animation: "float-slow 4s ease-in-out infinite",
      }}
    >
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
        {BARS.map((i) => {
          const center = 9.5;
          const dist = Math.abs(i - center) / center;
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
                animation: `bar-pulse ${0.4 + i * 0.04}s ease-in-out ${i * 0.05}s infinite`,
                boxShadow: "0 0 6px rgba(88,101,242,0.3)",
              }}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#ef4444",
            animation: "blink-dot 1.2s ease-in-out infinite",
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>
          Recording...
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card 2 — Transcript
   ═══════════════════════════════════════════════════════════════════════════ */

const SPEAKERS = [
  { initial: "A", name: "Alex", time: "00:12", color: "var(--primary)", text: "The Q3 results exceeded our targets..." },
  { initial: "M", name: "Maria", time: "00:24", color: "#a855f7", text: "Great news. What drove the growth?" },
  { initial: "K", name: "Kevin", time: "00:38", color: "#22c55e", text: "Mainly the new enterprise contracts." },
];

function TranscriptCard() {
  // phase: 0 = empty, 1 = row 1, 2 = rows 1-2, 3 = all rows + summary
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let step = 0;
    const tick = () => {
      step = (step + 1) % 4;
      setPhase(step);
    };
    const id = setInterval(tick, 2000);
    // Start with phase 1 after initial delay
    const start = setTimeout(tick, 800);
    return () => {
      clearInterval(id);
      clearTimeout(start);
    };
  }, []);

  return (
    <div
      style={{
        ...glass,
        position: "relative",
        width: "100%",
        zIndex: 10,
        background: "rgba(255,255,255,0.09)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(88,101,242,0.08)",
        animation: "float-medium 5s ease-in-out infinite",
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
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
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
              animation: "blink-dot 1.5s ease-in-out infinite",
            }}
          />
          Live
        </span>
      </div>

      {/* Speaker rows */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 140 }}>
        {SPEAKERS.map((s, i) => (
          <motion.div
            key={s.initial}
            animate={{ opacity: i < phase ? 1 : 0, y: i < phase ? 0 : 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ display: "flex", gap: 8 }}
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
                background: s.color,
                marginTop: 1,
              }}
            >
              {s.initial}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{s.name}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{s.time}</span>
              </div>
              <p style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.6)", margin: 0 }}>{s.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Summary shimmer — visible in phase 3 */}
      <motion.div
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>
          AI Summary generating...
        </span>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 8,
            borderRadius: 4,
            marginTop: 4,
            width: "60%",
            background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out 0.2s infinite",
          }}
        />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card 3 — Export & Share
   ═══════════════════════════════════════════════════════════════════════════ */

const FORMATS = ["TXT", "SRT", "DOCX"];

function ExportCard() {
  return (
    <div
      style={{
        ...glass,
        position: "relative",
        width: "80%",
        marginTop: -20,
        padding: "14px 14px 12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        zIndex: 1,
        animation: "float-fast 3.5s ease-in-out infinite",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 10 }}>
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
              animation: `highlight-pill 2.5s ease-in-out ${i * 0.8}s infinite`,
            }}
          >
            {fmt}
            <span style={{ fontSize: 8, opacity: 0.5 }}>&#8595;</span>
          </div>
        ))}
      </div>

      {/* Share link */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          padding: "6px 8px",
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
          transcribe.to/s/a8f2k
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main illustration
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthIllustration() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 380, margin: "0 auto" }}>
      <WaveformCard />
      <TranscriptCard />
      <ExportCard />
    </div>
  );
}
