import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AiMagicIcon, Calendar03Icon, CheckmarkSquare02Icon, Copy01Icon, Download04Icon, FileAudioIcon,
  Folder01Icon, Link01Icon, PencilEdit01Icon, Search01Icon, SquareIcon, StarIcon, Tick02Icon, TranslateIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { cn } from "./ui/utils";

/* Review 56-57 (Kirill, 29.09): the Academy speaks the marketing site's v2
   language. The photograph IS the cover: a real night photograph in the
   site's cobalt grade, people smeared by a long exposure.

   Review 57: a card is not a movie. Each cover carries ONE small piece of the
   real interface for its lesson (the search field for Find, the formats for
   Export), drawn in frosted white glass so the photograph shows through. It
   holds still; only a hover lifts it. The motion lives in the banner, where
   the scenes of one meeting follow each other: the transcript types, then the
   summary, the action items tick, the speakers are counted, and it starts
   over. Reduced motion shows the first scene finished. */

const ACCENT = "text-[#8FC2FF]";
const GLASS = "rounded-[10px] bg-white/[0.13] ring-1 ring-inset ring-white/25 backdrop-blur-md";
const ROW = "rounded-[6px] bg-white/[0.10]";
const LABEL = "text-[9.5px] font-semibold tracking-[0.01em] text-white/60";

function Head({ icon, children, right }: { icon: typeof Search01Icon; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[6px]">
      <Icon icon={icon} size={11} strokeWidth={2.2} className={ACCENT} />
      <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-white">{children}</span>
      {right}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={cn("flex h-[12px] w-[21px] shrink-0 items-center rounded-full px-[2px]", on ? "justify-end bg-[#8FC2FF]" : "justify-start bg-white/25")}>
      <span className="size-[8px] rounded-full bg-white" />
    </span>
  );
}

/* The ten interface pieces, one per lesson. */
const WIDGETS: Record<string, () => React.ReactElement> = {
  "first-record": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={FileAudioIcon} right={<span className="text-[9.5px] font-semibold tabular-nums text-white/70">98%</span>}>Client call.m4a</Head>
      <span className="mt-[7px] block h-[4px] overflow-hidden rounded-full bg-white/20"><span className="block h-full w-[98%] rounded-full bg-[#8FC2FF]" /></span>
      <div className="mt-[7px] flex gap-[4px]">
        {["MP3", "MP4", "WAV", "Link"].map((f) => <span key={f} className={cn(ROW, "px-[6px] py-[2px] text-[9px] font-semibold text-white/80")}>{f}</span>)}
      </div>
    </div>
  ),
  "meetings": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={Calendar03Icon} right={<span className={LABEL}>Auto-join</span>}>Today</Head>
      {([["14:00", "Product sync", true], ["16:30", "Customer call", false]] as const).map(([t, n, on]) => (
        <div key={t} className={cn(ROW, "mt-[5px] flex items-center gap-[7px] px-[7px] py-[4px]")}>
          <span className="text-[9.5px] font-semibold tabular-nums text-white/60">{t}</span>
          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-white">{n}</span>
          <Toggle on={on} />
        </div>
      ))}
    </div>
  ),
  "read-transcript": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={TranslateIcon} right={<span className={cn(ROW, "px-[6px] py-[1px] text-[9px] font-semibold text-white")}>English · Español</span>}>Transcript</Head>
      {[["00:16", "The new plan starts in May."], ["00:31", "Then we tell the team."]].map(([t, s], i) => (
        <p key={t} className="mt-[5px] flex gap-[7px] text-[10px] leading-[13px]">
          <span className={cn("font-semibold tabular-nums", i === 0 ? ACCENT : "text-white/50")}>{t}</span>
          <span className="font-semibold text-white/90">{s}</span>
        </p>
      ))}
    </div>
  ),
  "edit-transcript": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={PencilEdit01Icon} right={<span className="rounded-full bg-white px-[7px] py-[1px] text-[9px] font-bold text-[#0A1630]">Save</span>}>Edit transcript</Head>
      <p className={cn(ROW, "mt-[6px] px-[7px] py-[5px] text-[10px] font-semibold leading-[13px] text-white")}>
        Ship the booking flow by <span className="rounded-[3px] bg-[#8FC2FF]/35 px-[2px] text-white">Monday</span><span className="ml-[1px] inline-block h-[10px] w-[1px] translate-y-[1px] bg-white" />
      </p>
    </div>
  ),
  "speakers": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={AiMagicIcon} right={<span className={LABEL}>2 found</span>}>Speakers</Head>
      {[["H", "Host", "34%", "bg-[#8FC2FF]"], ["G", "Guest", "66%", "bg-[#C9A8FF]"]].map(([a, n, w, c]) => (
        <div key={n} className="mt-[6px] flex items-center gap-[7px]">
          <span className={cn("flex size-[16px] shrink-0 items-center justify-center rounded-full text-[8.5px] font-bold text-[#0A1630]", c)}>{a}</span>
          <span className="w-[34px] text-[10px] font-semibold text-white">{n}</span>
          <span className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/15"><span className={cn("block h-full rounded-full", c)} style={{ width: w }} /></span>
          <span className="w-[24px] text-right text-[9px] font-semibold tabular-nums text-white/60">{w}</span>
        </div>
      ))}
    </div>
  ),
  "summary": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={AiMagicIcon} right={<span className={cn(ROW, "px-[6px] py-[1px] text-[9px] font-semibold text-white")}>Meeting notes</span>}>AI Summary</Head>
      {[["Decision", "Launch moves to Monday."], ["Action", "Leo sends the release note."]].map(([k, s]) => (
        <p key={k} className="mt-[5px] truncate text-[10px] font-semibold leading-[13px] text-white/90"><span className={ACCENT}>{k}</span> {s}</p>
      ))}
    </div>
  ),
  "export": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={Download04Icon}>Export</Head>
      <div className="mt-[6px] flex gap-[4px]">
        {["PDF", "DOCX", "TXT", "SRT"].map((f, i) => (
          <span key={f} className={cn("flex-1 rounded-[6px] py-[4px] text-center text-[9.5px] font-bold", i === 0 ? "bg-white text-[#0A1630]" : "bg-white/[0.10] text-white/85")}>{f}</span>
        ))}
      </div>
      <div className="mt-[6px] flex items-center gap-[6px] text-[9.5px] font-semibold text-white/75"><Icon icon={Tick02Icon} size={10} strokeWidth={3} className={ACCENT} />Timecodes<Icon icon={Tick02Icon} size={10} strokeWidth={3} className={cn(ACCENT, "ml-[6px]")} />Speakers</div>
    </div>
  ),
  "share": () => (
    <div className={cn(GLASS, "p-[9px]")}>
      <Head icon={Link01Icon} right={<Toggle on />}>Anyone with the link</Head>
      <div className="mt-[7px] flex items-center gap-[7px]">
        <span className="flex -space-x-[5px]">
          {["A", "P", "L"].map((a, i) => <span key={a} className={cn("flex size-[16px] items-center justify-center rounded-full text-[8.5px] font-bold text-[#0A1630] ring-[1.5px] ring-[#1A2A4E]", ["bg-[#8FC2FF]", "bg-[#C9A8FF]", "bg-white"][i])}>{a}</span>)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[9.5px] font-semibold text-white/70">3 people can view</span>
        <span className="flex items-center gap-[3px] rounded-full bg-white px-[7px] py-[1px] text-[9px] font-bold text-[#0A1630]"><Icon icon={Copy01Icon} size={9} strokeWidth={2.4} />Copy</span>
      </div>
    </div>
  ),
  "folders": () => (
    <div className={cn(GLASS, "p-[7px]")}>
      {([["Clients", "12", false], ["Acme · Q3", "5", true], ["Interviews", "8", false]] as const).map(([n, c, on]) => (
        <div key={n} className={cn("flex items-center gap-[7px] rounded-[6px] px-[6px] py-[4px]", on ? "bg-white/[0.16]" : "")}>
          <Icon icon={on ? StarIcon : Folder01Icon} size={11} strokeWidth={2.2} className={on ? ACCENT : "text-white/70"} />
          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-white">{n}</span>
          <span className="text-[9.5px] font-semibold tabular-nums text-white/55">{c}</span>
        </div>
      ))}
    </div>
  ),
  "find": () => (
    <div className={cn(GLASS, "p-[8px]")}>
      <div className="flex items-center gap-[6px] rounded-[7px] bg-white px-[8px] py-[5px]">
        <Icon icon={Search01Icon} size={11} strokeWidth={2.2} className="text-[#0A1630]/60" />
        <span className="flex-1 text-[10px] font-semibold text-[#0A1630]">launch date</span>
        <span className="text-[9px] font-semibold text-[#0A1630]/45">3 results</span>
      </div>
      {[["12:03", "Let's lock the ", "launch date", " today."], ["18:47", "The ", "launch date", " moves to Monday."]].map(([t, a, h, b]) => (
        <p key={t} className="mt-[5px] flex gap-[7px] px-[2px] text-[10px] leading-[13px]">
          <span className="font-semibold tabular-nums text-white/50">{t}</span>
          <span className="truncate font-semibold text-white/90">{a}<span className="rounded-[3px] bg-[#8FC2FF]/35 px-[2px] text-white">{h}</span>{b}</span>
        </p>
      ))}
    </div>
  ),
};

/* The cover: the photograph, the site's whisper of a wash, the lesson's piece of interface. */
export function SceneCover({ id, src, size = "sm", className }: { id: string; src: string; size?: "sm" | "md"; className?: string }) {
  const W = WIDGETS[id];
  return (
    <div className={cn("relative overflow-hidden bg-[#0A1630]", className)}>
      <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.05]" style={{ objectPosition: "50% 40%" }} />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(4,10,26,0) 0%, rgba(4,10,26,0.42) 100%)" }} />
      {W && (
        <div aria-hidden className={cn("absolute", size === "md" ? "bottom-[18px] left-[20px] w-[236px] origin-bottom-left scale-[1.3]" : "bottom-[12px] left-[12px] w-[min(76%,232px)]")}>
          <div className="transition-transform duration-300 ease-out group-hover:-translate-y-[3px]"><W /></div>
        </div>
      )}
    </div>
  );
}

function LiveDot() {
  return <span className="relative flex size-[6px]"><span className="absolute inset-0 animate-ping rounded-full bg-destructive/70" /><span className="relative size-[6px] rounded-full bg-destructive" /></span>;
}

export function StatusPill({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return (
    <span className="inline-flex h-[26px] items-center gap-[5px] rounded-full bg-[rgba(7,15,36,0.86)] px-[11px] text-[11.5px] font-bold text-white ring-[1.5px] ring-white/85">
      {live ? <LiveDot /> : <Icon icon={AiMagicIcon} size={11} className={ACCENT} />}
      {children}
    </span>
  );
}

/* The recording clock runs in its own component so the scenes do not re-render every second. */
function LiveClock() {
  const reduce = useReducedMotion();
  const [secs, setSecs] = useState(24 * 60 + 18);
  useEffect(() => {
    if (reduce) return;
    const tick = window.setInterval(() => setSecs((x) => x + 1), 1000);
    return () => window.clearInterval(tick);
  }, [reduce]);
  return <>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</>;
}

/* ── the banner: the scenes of one meeting, one after another ── */
const LIVE: Array<[string, string]> = [
  ["Sarah", "Let's start with the onboarding numbers."],
  ["Marcus", "Sign-ups are up eleven percent this week."],
  ["Sarah", "Then we ship the shorter upload flow first."],
  ["Marcus", "I'll measure the drop-off again on Friday."],
];
const ACTIONS = ["Ship the shorter upload flow", "Measure drop-off on Friday", "Share the chart with support"];
type Act = "transcript" | "summary" | "actions" | "speakers";
const ACTS: Act[] = ["transcript", "summary", "actions", "speakers"];
const HOLD: Record<Act, number> = { transcript: 0, summary: 5200, actions: 5600, speakers: 4800 };

function Words({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const w = text.split(" ");
  return <>{w.map((x, j) => <motion.span key={j} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: j * 0.09 }}>{x}{j < w.length - 1 ? " " : ""}</motion.span>)}</>;
}

function TranscriptAct({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? LIVE.length : 1);
  useEffect(() => {
    if (reduce) return;
    const words = LIVE[shown - 1][1].split(" ").length;
    const id = window.setTimeout(() => (shown < LIVE.length ? setShown(shown + 1) : onDone()), words * 90 + 900 + (shown === LIVE.length ? 1800 : 0));
    return () => window.clearTimeout(id);
  }, [shown, reduce, onDone]);
  return (
    <div className="flex flex-col gap-[6px]">
      {LIVE.slice(0, shown).map(([who, text], i) => (
        <motion.p key={i} initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-[13px] font-semibold leading-[19px] text-[#F2F6FF]">
          <span className={ACCENT}>{who}</span> <Words text={text} />
          {i === shown - 1 && !reduce && <motion.span className="ml-[2px] inline-block h-[13px] w-[1.5px] translate-y-[2px] bg-white" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
        </motion.p>
      ))}
    </div>
  );
}

function PanelHead({ icon, children, right }: { icon: typeof Search01Icon; children: React.ReactNode; right?: React.ReactNode }) {
  return <div className="flex items-center gap-[6px] text-[12px] font-semibold text-white"><Icon icon={icon} size={13} className={ACCENT} />{children}<span className="ml-auto">{right}</span></div>;
}

function SummaryAct() {
  const rows: Array<[string, string]> = [["Decision", "Ship the shorter upload flow first."], ["Numbers", "Sign-ups up 11% week over week."], ["Next", "Re-measure the drop-off on Friday."]];
  return (
    <div className={cn(GLASS, "w-[330px] p-[12px]")}>
      <PanelHead icon={AiMagicIcon} right={<span className={cn(ROW, "px-[7px] py-[1px] text-[10.5px] font-semibold")}>Meeting notes</span>}>AI Summary</PanelHead>
      {rows.map(([k, s], i) => (
        <motion.p key={k} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.45 }} className="mt-[7px] text-[12.5px] font-semibold leading-[17px] text-white/90"><span className={ACCENT}>{k}</span> {s}</motion.p>
      ))}
    </div>
  );
}

function ActionsAct() {
  const [ticked, setTicked] = useState(0);
  useEffect(() => {
    if (ticked >= ACTIONS.length) return;
    const id = window.setTimeout(() => setTicked((t) => t + 1), ticked === 0 ? 900 : 1100);
    return () => window.clearTimeout(id);
  }, [ticked]);
  return (
    <div className={cn(GLASS, "w-[330px] p-[12px]")}>
      <PanelHead icon={CheckmarkSquare02Icon} right={<span className="text-[11px] tabular-nums text-white/60">{ticked} of {ACTIONS.length}</span>}>Action items</PanelHead>
      {ACTIONS.map((a, i) => (
        <div key={a} className="mt-[7px] flex items-center gap-[8px] text-[12.5px] font-semibold leading-[17px]">
          <motion.span animate={{ scale: i < ticked ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }} className="flex">
            <Icon icon={i < ticked ? CheckmarkSquare02Icon : SquareIcon} size={14} strokeWidth={2} className={i < ticked ? ACCENT : "text-white/45"} />
          </motion.span>
          <span className={cn("transition-colors duration-300", i < ticked ? "text-white/55 line-through decoration-white/40" : "text-white/90")}>{a}</span>
        </div>
      ))}
    </div>
  );
}

function SpeakersAct() {
  const people: Array<[string, string, number, string]> = [["S", "Sarah", 54, "bg-[#8FC2FF]"], ["M", "Marcus", 46, "bg-[#C9A8FF]"]];
  return (
    <div className={cn(GLASS, "w-[330px] p-[12px]")}>
      <PanelHead icon={AiMagicIcon} right={<span className="text-[11px] text-white/60">Talk time</span>}>Speakers</PanelHead>
      {people.map(([a, n, w, c], i) => (
        <div key={n} className="mt-[9px] flex items-center gap-[9px]">
          <span className={cn("flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-[#0A1630]", c)}>{a}</span>
          <span className="w-[52px] text-[12.5px] font-semibold text-white">{n}</span>
          <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/15"><motion.span initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.9, delay: 0.3 + i * 0.25, ease: "easeOut" }} className={cn("block h-full rounded-full", c)} /></span>
          <span className="w-[32px] text-right text-[11px] font-semibold tabular-nums text-white/65">{w}%</span>
        </div>
      ))}
    </div>
  );
}

export function BannerStage() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const name = ACTS[step % ACTS.length];
  const next = useCallback(() => setStep((s) => s + 1), []);
  useEffect(() => {
    if (reduce || HOLD[name] === 0) return;
    const id = window.setTimeout(next, HOLD[name]);
    return () => window.clearTimeout(id);
  }, [step, name, reduce, next]);
  const pill = name === "transcript" ? <StatusPill live>Recording <LiveClock /></StatusPill>
    : name === "summary" ? <StatusPill>Summary ready</StatusPill>
    : name === "actions" ? <StatusPill>3 action items</StatusPill>
    : <StatusPill>2 speakers found</StatusPill>;
  return (
    <div className="flex flex-col gap-[8px]" aria-hidden data-banner-act={name}>
      <p className="text-[11.5px] font-semibold tracking-[0.01em] text-white/60">Weekly product sync · Google Meet</p>
      <div className="h-[118px]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
            {name === "transcript" && <TranscriptAct onDone={next} />}
            {name === "summary" && <SummaryAct />}
            {name === "actions" && <ActionsAct />}
            {name === "speakers" && <SpeakersAct />}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="pt-[2px]">{pill}</div>
    </div>
  );
}
