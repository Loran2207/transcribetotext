import { useState, useEffect } from "react";
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

const TRANSCRIPT = [
  { speaker: "Alex", color: "#60A5FA", text: "The Q3 results exceeded all our targets by 23 percent" },
  { speaker: "Maria", color: "#A78BFA", text: "What drove the growth in the enterprise segment" },
  { speaker: "Kevin", color: "#34D399", text: "Mainly the new contracts signed in September and October" },
  { speaker: "Alex", color: "#60A5FA", text: "We should double down on that channel for Q4" },
];

// Microsoft Teams SVG path (not in simple-icons)
const TEAMS_PATH =
  "M20.625 3.6h-7.5a1.125 1.125 0 00-1.125 1.125v7.5A1.125 1.125 0 0013.125 13.35h7.5A1.125 1.125 0 0021.75 12.225v-7.5A1.125 1.125 0 0020.625 3.6zm-1.5 6.75h-1.5v3h-1.5v-3h-1.5V8.85h4.5v1.5zM17.25 3.15a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zm5.25 4.2a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm.75.9h-2.7v4.5a2.25 2.25 0 01-2.25 2.25h-4.05a3.6 3.6 0 003.45 2.55h3.3a2.25 2.25 0 002.25-2.25v-5.1a1.95 1.95 0 00-2-1.95zM9.75 14.475v-9a2.25 2.25 0 012.25-2.25h4.35a3.6 3.6 0 00-3.6-3.075H5.4A2.25 2.25 0 003.15 2.4v10.35a3.6 3.6 0 003.075 3.563 3.6 3.6 0 003.525-1.838z";

const LOGOS: { path: string; name: string }[] = [
  { path: siZoom.path, name: "Zoom" },
  { path: siGooglemeet.path, name: "Google Meet" },
  { path: siYoutube.path, name: "YouTube" },
  { path: TEAMS_PATH, name: "Teams" },
  { path: siGoogledrive.path, name: "Drive" },
  { path: siDropbox.path, name: "Dropbox" },
];

const TESTIMONIALS = [
  { quote: "We save 3 hours per week on meeting notes", name: "Sarah K.", role: "Head of Product" },
  { quote: "Accuracy is unreal. Even with my accent.", name: "Dmitri V.", role: "Engineer" },
  { quote: "Game changer for our sales calls", name: "Amanda L.", role: "VP Sales" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Live transcript hook
   ═══════════════════════════════════════════════════════════════════════════ */

interface TranscriptLine {
  id: number;
  speaker: string;
  color: string;
  words: string[];
  complete: boolean;
}

// Pre-split words so we never create new arrays inside render/effect
const TRANSCRIPT_WORDS = TRANSCRIPT.map((t) => t.text.split(" "));

function useStreamingTranscript() {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(-1); // -1 = not started

  useEffect(() => {
    const idx = sentenceIndex % TRANSCRIPT.length;
    const entry = TRANSCRIPT[idx];
    const words = TRANSCRIPT_WORDS[idx];

    if (wordIndex === -1) {
      // Create new line, then start adding words
      const timer = setTimeout(() => {
        setLines((prev) => {
          const next = [
            ...prev,
            {
              id: sentenceIndex,
              speaker: entry.speaker,
              color: entry.color,
              words: [],
              complete: false,
            },
          ];
          return next.length > 3 ? next.slice(-3) : next;
        });
        setWordIndex(0);
      }, 300);
      return () => clearTimeout(timer);
    }

    if (wordIndex < words.length) {
      // Add next word
      const timer = setTimeout(() => {
        const count = wordIndex + 1;
        setLines((prev) =>
          prev.map((line) =>
            line.id === sentenceIndex
              ? { ...line, words: words.slice(0, count) }
              : line
          )
        );
        setWordIndex(count);
      }, 200);
      return () => clearTimeout(timer);
    }

    if (wordIndex === words.length) {
      // Sentence done — mark complete, wait, advance
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
   Testimonial rotator
   ═══════════════════════════════════════════════════════════════════════════ */

function useTestimonialRotator() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);
  return TESTIMONIALS[index];
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
  const lines = useStreamingTranscript();
  const testimonial = useTestimonialRotator();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        padding: "72px 40px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Background blobs ── */}
      <div
        className="bg-blob"
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(59,130,246,0.12)",
          filter: "blur(80px)",
          top: "-5%",
          left: "-10%",
          pointerEvents: "none",
          zIndex: 0,
          animation: "blob-move 12s ease infinite",
        }}
      />
      <div
        className="bg-blob"
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(139,92,246,0.10)",
          filter: "blur(60px)",
          bottom: "-5%",
          right: "-5%",
          pointerEvents: "none",
          zIndex: 0,
          animation: "blob-move 15s ease infinite reverse",
        }}
      />

      {/* ── Waveform ── */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 4 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            height: 60,
          }}
        >
          {Array.from({ length: 48 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 36,
                  background: "white",
                  borderRadius: 2,
                  transformOrigin: "center",
                  flexShrink: 0,
                  animation: "wave-bar-test 0.6s ease-in-out infinite",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
          ))}
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            marginTop: 8,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Transcribing...
        </p>
      </div>

      {/* ── Live transcription stream ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 16,
          minHeight: 0,
          overflow: "hidden",
          paddingTop: 12,
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
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: line.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {line.speaker}
              </span>
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.7,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0 6px",
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
                          ? "rgba(255,255,255,1)"
                          : "rgba(255,255,255,0.85)",
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
                {!line.complete && (
                  <span
                    className="cursor-blink"
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 20,
                      background: "var(--primary)",
                      marginLeft: 2,
                      animation: "cursor-blink 1s step-end infinite",
                      verticalAlign: "text-bottom",
                    }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Trust strip ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Stars */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            4.9 / 5 from 2,847 reviews
          </span>
        </div>

        {/* Logos */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {LOGOS.map((item, i) => (
            <span key={item.name} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "0 6px" }}>
                  ·
                </span>
              )}
              <svg viewBox="0 0 24 24" width={16} height={16} fill="white" opacity={0.45} style={{ flexShrink: 0 }}>
                <path d={item.path} />
              </svg>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>
                {item.name}
              </span>
            </span>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{ minHeight: 36 }}>
          <p
            key={testimonial.name}
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.5,
              transition: "opacity 0.5s ease",
            }}
          >
            &ldquo;{testimonial.quote}&rdquo;
            <span style={{ fontStyle: "normal", color: "rgba(255,255,255,0.6)", marginLeft: 8 }}>
              — {testimonial.name}, {testimonial.role}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
