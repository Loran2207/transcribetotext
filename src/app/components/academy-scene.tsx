import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AiMagicIcon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { cn } from "./ui/utils";

/* Review 56 (Kirill, 29.09): the Academy speaks the marketing site's v2
   language. The photograph IS the cover: a real night photograph in the
   site's cobalt grade, generated dark, people smeared by a long exposure.
   The product lives ON the photograph as naked type (a meta line, the
   transcript with the speaker in light blue) and one status pill with a light
   ring, measured off the site's FeatureTabs. No scrim: the picture is dark
   enough to carry white type; only the site's whisper of a wash at the foot. Motion: the words type in when the cover comes
   into view and again on hover, the photograph drifts closer, the live dot
   breathes. Reduced motion shows the finished frame. */

export type Scene = { meta: string; lines: Array<[string, string]>; pill: string; live?: boolean; focus?: string };

export const SCENES: Record<string, Scene> = {
  "first-record": { meta: "Client call.m4a · 42 min", lines: [["Anna", "Let's start with last week's numbers."], ["Leo", "Sign-ups are up eleven percent."]], pill: "Transcribing 98%" },
  "meetings": { meta: "Weekly product sync · Google Meet", lines: [["Anna", "Let's lock the launch date today."], ["Leo", "Marketing is ready for Monday."]], pill: "Recording 24:18", live: true },
  "read-transcript": { meta: "Quarterly review · 00:16", lines: [["Maya", "The new plan starts in May."], ["Tom", "Then we tell the team this week."]], pill: "Translated to Spanish" },
  "edit-transcript": { meta: "Editing · Product sync", lines: [["Leo", "Ship the booking flow by Monday."], ["Anna", "And tell support on Friday."]], pill: "Saved" },
  "speakers": { meta: "Founder interview.mp3 · 1 hr 08 min", lines: [["Host", "Why did you start the company?"], ["Guest", "We lost a day a week writing things up."]], pill: "2 speakers found" },
  "summary": { meta: "AI Summary · Meeting notes", lines: [["Decision", "Launch moves to Monday."], ["Action", "Leo sends the release note."]], pill: "Summary ready" },
  "export": { meta: "Product sync · 3 files", lines: [["PDF", "Transcript with timecodes."], ["SRT", "Subtitles for the video."]], pill: "Download ready" },
  "share": { meta: "Shared with the team", lines: [["Priya", "Can you check the action items?"], ["Anna", "Done, I added two notes."]], pill: "Link copied" },
  "folders": { meta: "Clients / Acme / Q3", lines: [["12", "recordings, newest first."], ["3", "starred for the review."]], pill: "Moved to Acme" },
  "find": { meta: "Search · launch date", lines: [["12:03", "Let's lock the launch date today."], ["18:47", "The launch date moves to Monday."]], pill: "3 results" },
};

/* One line of naked type. Its words appear one by one from `delay`. */
function Line({ who, text, delay, play, size }: { who: string; text: string; delay: number; play: number; size: "sm" | "md" }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <p className={cn("font-semibold text-[#F2F6FF]", size === "md" ? "text-[13px] leading-[19px]" : "truncate text-[11.5px] leading-[16px]")}>
      <span className="text-[#8FC2FF]">{who}</span>{" "}
      {words.map((w, i) => (
        <motion.span
          key={`${play}-${i}`}
          initial={reduce ? false : { opacity: 0, filter: "blur(3px)" }}
          animate={play === 0 && !reduce ? { opacity: 0, filter: "blur(3px)" } : { opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.28, delay: delay + i * 0.07, ease: "easeOut" }}
        >
          {w}{i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </p>
  );
}

export function StatusPill({ children, live = false, size = "sm" }: { children: React.ReactNode; live?: boolean; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex items-center gap-[5px] rounded-full bg-[rgba(7,15,36,0.86)] font-bold text-white ring-[1.5px] ring-white/85", size === "md" ? "h-[26px] px-[11px] text-[11.5px]" : "h-[22px] px-[9px] text-[10.5px]")}>
      {live ? <span className="relative flex size-[6px]"><span className="absolute inset-0 animate-ping rounded-full bg-destructive/70" /><span className="relative size-[6px] rounded-full bg-destructive" /></span> : <Icon icon={AiMagicIcon} size={11} className="text-[#8FC2FF]" />}
      {children}
    </span>
  );
}

/* The cover: photograph + the scene on it. `play` changes to replay the typing. */
export function SceneCover({ id, src, play, size = "sm", className }: { id: string; src: string; play: number; size?: "sm" | "md"; className?: string }) {
  const s = SCENES[id];
  const per = 0.07;
  let t = 0.15;
  const delays = (s?.lines ?? []).map(([, text]) => { const d = t; t += text.split(" ").length * per + 0.25; return d; });
  return (
    <div className={cn("relative overflow-hidden bg-[#0A1630]", className)}>
      <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.06]" style={{ objectPosition: s?.focus ?? "50% 40%" }} />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(4,10,26,0) 0%, rgba(4,10,26,0.38) 100%)" }} />
      {s && (
        <div className={cn("absolute inset-x-0 bottom-0 flex flex-col", size === "md" ? "gap-[5px] px-[20px] pb-[18px]" : "gap-[3px] px-[14px] pb-[12px]")}>
          <p className={cn("font-semibold tracking-[0.01em] text-white/60", size === "md" ? "text-[11.5px]" : "text-[10.5px]")}>{s.meta}</p>
          {(size === "sm" ? s.lines.slice(0, 1) : s.lines).map(([who, text], i) => <Line key={i} who={who} text={text} delay={delays[i]} play={play} size={size} />)}
          <div className={size === "md" ? "pt-[8px]" : "pt-[6px]"}><StatusPill live={s.live} size={size}>{s.pill}</StatusPill></div>
        </div>
      )}
    </div>
  );
}

/* The banner's live transcript: lines type in one after another, a cursor
   blinks on the line being written, the recording clock runs; after the last
   line it holds, then starts over. */
const LIVE: Array<[string, string]> = [
  ["Sarah", "Let's start with the onboarding numbers."],
  ["Marcus", "Sign-ups are up eleven percent this week."],
  ["Sarah", "Then we ship the shorter upload flow first."],
  ["Marcus", "I'll measure the drop-off again on Friday."],
];

export function LiveTranscript() {
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [shown, setShown] = useState(reduce ? LIVE.length : 1);
  const [secs, setSecs] = useState(24 * 60 + 18);
  useEffect(() => {
    if (reduce) return;
    const tick = window.setInterval(() => setSecs((x) => x + 1), 1000);
    return () => window.clearInterval(tick);
  }, [reduce]);
  useEffect(() => {
    if (reduce) return;
    const words = LIVE[shown - 1][1].split(" ").length;
    const wait = words * 90 + 900 + (shown === LIVE.length ? 2600 : 0);
    const id = window.setTimeout(() => {
      if (shown < LIVE.length) setShown(shown + 1);
      else { setRound((r) => r + 1); setShown(1); }
    }, wait);
    return () => window.clearTimeout(id);
  }, [shown, reduce]);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <div className="flex flex-col gap-[6px]" aria-hidden>
      <p className="text-[11.5px] font-semibold tracking-[0.01em] text-white/60">Weekly product sync · Google Meet</p>
      {LIVE.slice(0, shown).map(([who, text], i) => {
        const words = text.split(" ");
        const current = i === shown - 1 && !reduce;
        return (
          <motion.p key={`${round}-${i}`} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-[13px] font-semibold leading-[19px] text-[#F2F6FF]">
            <span className="text-[#8FC2FF]">{who}</span>{" "}
            {words.map((w, j) => (
              <motion.span key={j} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: j * 0.09 }}>{w}{j < words.length - 1 ? " " : ""}</motion.span>
            ))}
            {current && <motion.span className="ml-[2px] inline-block h-[13px] w-[1.5px] translate-y-[2px] bg-white" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
          </motion.p>
        );
      })}
      <div className="pt-[6px]"><StatusPill live size="md">Recording {clock}</StatusPill></div>
    </div>
  );
}
