import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  siZoom,
  siGooglemeet,
  siYoutube,
  siGoogledrive,
  siDropbox,
  siSpotify,
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

const LOGOS = [
  { icon: siZoom, name: "Zoom" },
  { icon: siGooglemeet, name: "Meet" },
  { icon: siYoutube, name: "YouTube" },
  { icon: siGoogledrive, name: "Drive" },
  { icon: siDropbox, name: "Dropbox" },
  { icon: siSpotify, name: "Spotify" },
];

const TESTIMONIALS = [
  { quote: "We save 3 hours per week on meeting notes", name: "Sarah K.", role: "Head of Product" },
  { quote: "Accuracy is unreal. Even with my accent.", name: "Dmitri V.", role: "Engineer" },
  { quote: "Game changer for our sales calls", name: "Amanda L.", role: "VP Sales" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Live transcript hook — words appear one by one
   ═══════════════════════════════════════════════════════════════════════════ */

interface TranscriptLine {
  id: number;
  speaker: string;
  color: string;
  words: string[];
  complete: boolean;
}

function useStreamingTranscript() {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);

  const currentEntry = TRANSCRIPT[lineIdx % TRANSCRIPT.length];
  const allWords = currentEntry.text.split(" ");

  useEffect(() => {
    // Add words one by one
    if (wordIdx <= allWords.length) {
      const timer = setTimeout(() => {
        if (wordIdx === 0) {
          // Start new line
          setLines((prev) => {
            const next = [
              ...prev,
              {
                id: lineIdx,
                speaker: currentEntry.speaker,
                color: currentEntry.color,
                words: [],
                complete: false,
              },
            ];
            // Keep max 3 visible lines
            return next.length > 3 ? next.slice(-3) : next;
          });
          setWordIdx(1);
        } else if (wordIdx <= allWords.length) {
          // Add next word
          setLines((prev) =>
            prev.map((line) =>
              line.id === lineIdx
                ? { ...line, words: allWords.slice(0, wordIdx) }
                : line
            )
          );
          if (wordIdx === allWords.length) {
            // Sentence complete — mark it, wait, then advance
            setLines((prev) =>
              prev.map((line) =>
                line.id === lineIdx ? { ...line, complete: true } : line
              )
            );
            setTimeout(() => {
              setLineIdx((prev) => prev + 1);
              setWordIdx(0);
            }, 1500);
          } else {
            setWordIdx((prev) => prev + 1);
          }
        }
      }, wordIdx === 0 ? 300 : 200);
      return () => clearTimeout(timer);
    }
  }, [lineIdx, wordIdx, allWords, currentEntry, lines.length]);

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
   Star component
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
        padding: "32px 40px",
        position: "relative",
      }}
    >
      {/* ── TOP: Live demo pill ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.05em",
          }}
        >
          <div
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#ef4444",
              animation: "pulse-red 2s ease-in-out infinite",
            }}
          />
          Live demo
        </div>
      </div>

      {/* ── CENTER TOP: Waveform ── */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            height: 60,
          }}
        >
          {Array.from({ length: 48 }, (_, i) => {
            const center = 23.5;
            const dist = Math.abs(i - center) / center;
            return (
              <div
                key={i}
                className="wave-bar"
                style={{
                  width: 3,
                  height: 60,
                  background: "white",
                  borderRadius: 2,
                  transformOrigin: "center",
                  flexShrink: 0,
                  opacity: 0.3 + (1 - dist) * 0.7,
                  animation: `wave-bar-test ${(0.4 + i * 0.04).toFixed(2)}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.05).toFixed(2)}s`,
                }}
              />
            );
          })}
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            marginTop: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Transcribing...
        </p>
      </div>

      {/* ── CENTER: Live transcription stream ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
          minHeight: 0,
          overflow: "hidden",
          padding: "20px 0",
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
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              {/* Speaker tag */}
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
              {/* Words */}
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.8,
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

      {/* ── BOTTOM: Trust strip ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
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

        {/* Logos row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {LOGOS.map((item, i) => (
            <span key={item.name} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {i > 0 && (
                <span
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 10,
                    margin: "0 6px",
                  }}
                >
                  ·
                </span>
              )}
              <svg
                viewBox="0 0 24 24"
                width={16}
                height={16}
                fill="white"
                opacity={0.45}
                style={{ flexShrink: 0 }}
              >
                <path d={item.icon.path} />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  marginLeft: 4,
                }}
              >
                {item.name}
              </span>
            </span>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{ minHeight: 40 }}>
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
            <span
              style={{
                fontStyle: "normal",
                color: "rgba(255,255,255,0.6)",
                marginLeft: 8,
              }}
            >
              — {testimonial.name}, {testimonial.role}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
