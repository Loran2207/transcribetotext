import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  siZoom,
  siGooglemeet,
  siYoutube,
  siGoogledrive,
  siDropbox,
} from "simple-icons";

/* ═══════════════════════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════════════════════ */

const SPEAKERS = [
  {
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    initials: "SC",
    color: "#3B82F6",
    text: "The Q3 results exceeded all our targets by 23 percent",
  },
  {
    name: "Marcus Webb",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    initials: "MW",
    color: "#8B5CF6",
    text: "What drove the growth in the enterprise segment",
  },
  {
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    initials: "SC",
    color: "#3B82F6",
    text: "Mainly the new contracts signed in September and October",
  },
  {
    name: "Marcus Webb",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    initials: "MW",
    color: "#8B5CF6",
    text: "We should double down on that channel for Q4",
  },
];

const TEAMS_PATH =
  "M20.625 3.6h-7.5a1.125 1.125 0 00-1.125 1.125v7.5A1.125 1.125 0 0013.125 13.35h7.5A1.125 1.125 0 0021.75 12.225v-7.5A1.125 1.125 0 0020.625 3.6zm-1.5 6.75h-1.5v3h-1.5v-3h-1.5V8.85h4.5v1.5zM17.25 3.15a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zm5.25 4.2a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm.75.9h-2.7v4.5a2.25 2.25 0 01-2.25 2.25h-4.05a3.6 3.6 0 003.45 2.55h3.3a2.25 2.25 0 002.25-2.25v-5.1a1.95 1.95 0 00-2-1.95zM9.75 14.475v-9a2.25 2.25 0 012.25-2.25h4.35a3.6 3.6 0 00-3.6-3.075H5.4A2.25 2.25 0 003.15 2.4v10.35a3.6 3.6 0 003.075 3.563 3.6 3.6 0 003.525-1.838z";

const LOGOS: { path: string; name: string }[] = [
  { path: siZoom.path, name: "Zoom" },
  { path: siGooglemeet.path, name: "Meet" },
  { path: siYoutube.path, name: "YouTube" },
  { path: TEAMS_PATH, name: "Teams" },
  { path: siGoogledrive.path, name: "Drive" },
  { path: siDropbox.path, name: "Dropbox" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Streaming transcript hook (working version — stable deps)
   ═══════════════════════════════════════════════════════════════════════════ */

interface TranscriptLine {
  id: number;
  speaker: typeof SPEAKERS[number];
  words: string[];
  complete: boolean;
}

const SPEAKER_WORDS = SPEAKERS.map((s) => s.text.split(" "));

function useStreamingTranscript() {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(-1);

  useEffect(() => {
    const idx = sentenceIndex % SPEAKERS.length;
    const speaker = SPEAKERS[idx];
    const words = SPEAKER_WORDS[idx];

    if (wordIndex === -1) {
      const timer = setTimeout(() => {
        setLines((prev) => {
          const next = [...prev, { id: sentenceIndex, speaker, words: [], complete: false }];
          return next.length > 3 ? next.slice(-3) : next;
        });
        setWordIndex(0);
      }, 300);
      return () => clearTimeout(timer);
    }

    if (wordIndex < words.length) {
      const timer = setTimeout(() => {
        const count = wordIndex + 1;
        setLines((prev) =>
          prev.map((line) =>
            line.id === sentenceIndex ? { ...line, words: words.slice(0, count) } : line
          )
        );
        setWordIndex(count);
      }, 200);
      return () => clearTimeout(timer);
    }

    if (wordIndex === words.length) {
      const timer = setTimeout(() => {
        setLines((prev) =>
          prev.map((line) =>
            line.id === sentenceIndex ? { ...line, complete: true } : line
          )
        );
        setTimeout(() => {
          setSentenceIndex((prev) => prev + 1);
          setWordIndex(-1);
        }, 1500);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [sentenceIndex, wordIndex]);

  return lines;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Star
   ═══════════════════════════════════════════════════════════════════════════ */

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthIllustration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lines = useStreamingTranscript();

  // Canvas waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);
      const centerY = height / 2;
      const bars = 80;
      const barWidth = width / bars;
      const maxHeight = height * 0.6;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        const wave1 = Math.sin(i * 0.15 + time * 0.02) * 0.5;
        const wave2 = Math.sin(i * 0.08 + time * 0.015) * 0.3;
        const wave3 = Math.sin(i * 0.25 + time * 0.025) * 0.2;
        const amplitude = (wave1 + wave2 + wave3 + 1) / 2;
        const barHeight = Math.max(4, amplitude * maxHeight);

        const gradient = ctx.createLinearGradient(
          x, centerY - barHeight / 2, x, centerY + barHeight / 2
        );
        gradient.addColorStop(0, `rgba(79, 70, 229, ${0.15 + amplitude * 0.4})`);
        gradient.addColorStop(0.5, `rgba(99, 102, 241, ${0.2 + amplitude * 0.5})`);
        gradient.addColorStop(1, `rgba(79, 70, 229, ${0.15 + amplitude * 0.4})`);

        ctx.shadowColor = "rgba(99, 102, 241, 0.4)";
        ctx.shadowBlur = 15;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
          x - barWidth * 0.3,
          centerY - barHeight / 2,
          barWidth * 0.6,
          barHeight,
          barWidth * 0.3
        );
        ctx.fill();
      }
      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: "linear-gradient(160deg, #060818 0%, #030410 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 40,
      }}
    >
      {/* Canvas waveform — full background */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.6,
          filter: "blur(1px)",
        }}
      />

      {/* Dark gradient overlays for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, #040510 0%, transparent 30%, transparent 70%, #040510 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(3,4,15,0.7) 0%, transparent 40%, transparent 60%, rgba(3,4,15,0.7) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Content layer ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "white",
            }}
          >
            TRANSCRIBETOTEXT
            <span style={{ color: "var(--primary)" }}>.AI</span>
          </span>
        </div>

        {/* Center — headline + transcript card */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 32,
          }}
        >
          {/* Headline */}
          <div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: "white",
                lineHeight: 1.15,
                margin: "0 0 16px",
              }}
            >
              Transform voice into
              <br />
              <span style={{ color: "var(--primary)" }}>actionable insights</span>
            </h1>
            <p
              style={{
                marginTop: 12,
                color: "rgba(255,255,255,0.5)",
                fontSize: 15,
                lineHeight: 1.6,
                margin: "12px 0 0",
              }}
            >
              Enterprise-grade transcription powered by AI.
              <br />
              99.7% accuracy across 100+ languages.
            </p>
          </div>

          {/* Glass transcript card */}
          <div
            style={{
              maxWidth: 480,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 20,
              padding: "20px 24px",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.4), 0 0 80px rgba(79,70,229,0.15)",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(99,102,241,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                  Live Transcription
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#ef4444",
                    animation: "cursor-blink 1.5s ease-in-out infinite",
                  }}
                />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#ef4444", letterSpacing: "0.05em" }}>
                  REC
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 16 }} />

            {/* Speaker rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minHeight: 170,
                overflow: "hidden",
              }}
            >
              <AnimatePresence mode="popLayout">
                {lines.map((line) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "flex", gap: 12 }}
                  >
                    {/* Avatar with photo + fallback */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={line.speaker.avatar}
                        alt={line.speaker.name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div
                        style={{
                          display: "none",
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${line.speaker.color}, ${line.speaker.color}99)`,
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        {line.speaker.initials}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: -1,
                          right: -1,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#22c55e",
                          border: "2px solid #040510",
                        }}
                      />
                    </div>

                    {/* Name + text */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>
                          {line.speaker.name}
                        </span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                          00:{(12 + (line.id % SPEAKERS.length) * 12).toString().padStart(2, "0")}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          lineHeight: 1.6,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0 5px",
                          alignItems: "baseline",
                        }}
                      >
                        {line.words.map((word, wi) => (
                          <motion.span
                            key={`${line.id}-${wi}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              color:
                                wi === line.words.length - 1 && !line.complete
                                  ? "rgb(99,179,237)"
                                  : "rgba(255,255,255,0.9)",
                            }}
                          >
                            {word}
                          </motion.span>
                        ))}
                        {!line.complete && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 2,
                              height: 16,
                              background: "var(--primary)",
                              marginLeft: 2,
                              animation: "cursor-blink 1s step-end infinite",
                              verticalAlign: "text-bottom",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* AI Summary shimmer — shows after 3 lines appear */}
            {lines.length >= 3 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  &#10022; Generating AI summary...
                </span>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    marginTop: 8,
                    width: "70%",
                    background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom: trust signals ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto", paddingTop: 16 }}>
          {/* Stars */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              4.9 from 2,847 reviews
            </span>
          </div>

          {/* Platform logos */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                marginBottom: 12,
                margin: "0 0 12px",
              }}
            >
              Integrates with
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
              {LOGOS.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    opacity: 0.6,
                    transition: "opacity 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
                      <path d={item.path} />
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
