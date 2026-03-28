import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/* Scene durations in ms */
const SCENE_DURATIONS = [3000, 2000, 4000];

/* ═══════════════════════════════════════════════
   Scene 1 — Audio Waveform
   ═══════════════════════════════════════════════ */

function AudioWaveScene() {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      setTick(Date.now());
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-end justify-center gap-[2.5px] h-20">
        {bars.map((i) => {
          const center = 13.5;
          const dist = Math.abs(i - center) / center;
          const opacity = 1 - dist * 0.55;
          const time = tick / 1000;
          const h =
            6 +
            Math.abs(Math.sin(time * 3 + i * 0.4)) * 18 * (1 - dist * 0.5) +
            Math.abs(Math.cos(time * 2.3 + i * 0.7)) * 14 * (1 - dist * 0.3) +
            Math.abs(Math.sin(time * 5 + i * 1.1)) * 8;

          return (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 3,
                height: h,
                background: "var(--primary)",
                opacity,
                transition: "height 0.05s linear",
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: "var(--primary)" }}
        />
        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
          Recording...
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Scene 2 — Processing
   ═══════════════════════════════════════════════ */

function ProcessingScene() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={175.9}
            initial={{ strokeDashoffset: 175.9 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--primary)" }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
        Transcribing your audio...
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Scene 3 — Transcript Result
   ═══════════════════════════════════════════════ */

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

function TypewriterText({ text, delay }: { text: string; delay: number }) {
  const [displayedCount, setDisplayedCount] = useState(0);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        if (count >= text.length) {
          setDisplayedCount(text.length);
          clearInterval(interval);
        } else {
          setDisplayedCount(count);
        }
      }, 25);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(startTimeout);
  }, [text, delay]);

  return (
    <span style={{ color: "rgba(255,255,255,0.7)" }}>
      {text.slice(0, displayedCount)}
      {displayedCount < text.length && (
        <motion.span
          className="inline-block w-[2px] h-3.5 ml-[1px] align-text-bottom"
          style={{ background: "var(--primary)" }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </span>
  );
}

function ResultScene() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        className="rounded-xl p-4 flex flex-col gap-3.5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {SPEAKERS.map((speaker, i) => (
          <motion.div
            key={speaker.initial}
            className="flex gap-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: i * 0.6,
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
              style={{ background: speaker.color, color: "white" }}
            >
              {speaker.initial}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {speaker.name}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {speaker.time}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed">
                <TypewriterText text={speaker.text} delay={i * 0.6 + 0.3} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center gap-1.5 self-end px-2.5 py-1 rounded-full"
        style={{
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.4, type: "spring", stiffness: 400, damping: 20 }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] font-medium" style={{ color: "#22c55e" }}>
          Transcription complete
        </span>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Static fallback (reduced motion)
   ═══════════════════════════════════════════════ */

function StaticResult() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        className="rounded-xl p-4 flex flex-col gap-3.5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {SPEAKERS.map((speaker) => (
          <div key={speaker.initial} className="flex gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
              style={{ background: speaker.color, color: "white" }}
            >
              {speaker.initial}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {speaker.name}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {speaker.time}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {speaker.text}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div
        className="flex items-center gap-1.5 self-end px-2.5 py-1 rounded-full"
        style={{
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
        <span className="text-[11px] font-medium" style={{ color: "#22c55e" }}>
          Transcription complete
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main illustration component
   ═══════════════════════════════════════════════ */

export function AuthIllustration() {
  const prefersReducedMotion = useReducedMotion();
  const [currentScene, setCurrentScene] = useState(0);

  const advanceScene = useCallback(() => {
    setCurrentScene((prev) => (prev + 1) % 3);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timeout = setTimeout(advanceScene, SCENE_DURATIONS[currentScene]);
    return () => clearTimeout(timeout);
  }, [currentScene, prefersReducedMotion, advanceScene]);

  if (prefersReducedMotion) {
    return (
      <div
        className="w-full p-8 flex items-center justify-center"
        style={{
          maxWidth: 420,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 0 60px rgba(100,130,255,0.1)",
        }}
      >
        <StaticResult />
      </div>
    );
  }

  return (
    <div
      className="w-full p-8 flex items-center justify-center"
      style={{
        maxWidth: 420,
        minHeight: 280,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "var(--radius-2xl)",
        boxShadow: "0 0 60px rgba(100,130,255,0.1)",
      }}
    >
      <AnimatePresence mode="wait">
        {currentScene === 0 && (
          <motion.div
            key="wave"
            className="flex items-center justify-center w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <AudioWaveScene />
          </motion.div>
        )}
        {currentScene === 1 && (
          <motion.div
            key="processing"
            className="flex items-center justify-center w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ProcessingScene />
          </motion.div>
        )}
        {currentScene === 2 && (
          <motion.div
            key="result"
            className="flex items-center justify-center w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ResultScene />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
