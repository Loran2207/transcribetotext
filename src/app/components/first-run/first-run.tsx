import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight01Icon, FileAudioIcon, Link01Icon, Mic01Icon, UserIcon, Video01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { cn } from "../ui/utils";
import { useTranscriptionModals } from "../transcription-modals";
import { useOnboarding } from "../onboarding/onboarding-context";

/* First run, the alternative to the Academy + checklist (branch first-run,
   review 58, Kirill 29.09: "something else, universal, to surprise the client").

   The product proves itself on the user's own words before anything is
   explained. One screen asks for ten seconds of talk; the words stream in as
   they are said; the result is a note with a key point and a to-do. Only then
   comes the one human question, "where do most of your conversations happen?",
   and each answer opens that way in directly. The flow ends on the next real
   action, never on "saved".

   Laws it follows: one thing to do per screen; the choice of method as centred
   cards; the choice is never final (a sample, a skip, the other ways in);
   honesty: a sample says it is a sample, and a browser that cannot hear says
   so instead of pretending. */

export { FIRST_RUN_VARIANT } from "./variant";

const DONE_KEY = "ttt_firstrun_done";
const PHOTO = "/images/academy3/banner.jpg";
const NAVY = "#0A1630";
const ACCENT = "text-[#8FC2FF]";
const GLASS = "rounded-[16px] bg-white/[0.08] ring-1 ring-inset ring-white/20 backdrop-blur-md";

const SAMPLE = [
  "Okay, quick plan for this week.",
  "The Acme proposal is almost ready, and the pricing page is the last open piece.",
  "I need to send the proposal to Anna by Thursday.",
  "Let's also book thirty minutes with Leo to review the numbers.",
];

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(DONE_KEY) === "1") return false;
    const flag = localStorage.getItem("ttt_demo_firstrun");
    if (flag === "1") return true;
    if (flag === "0") return false;
    return localStorage.getItem("ttt_demo_fresh") !== "0";
  } catch { return false; }
}

type Phase = "intro" | "live" | "result";
type Source = "voice" | "sample";

/* The notes a ten-second talk can honestly yield without a server: the
   sentence that carries the most, and the sentences that promise an action. */
function notesOf(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.split(" ").length >= 3);
  const todo = sentences.filter((s) => /\b(need to|have to|must|will|should|let's|going to|remember to|don't forget)\b/i.test(s)).slice(0, 2);
  const rest = sentences.filter((s) => !todo.includes(s));
  const key = [...rest].sort((a, b) => b.length - a.length)[0] ?? sentences[0] ?? "";
  return { key, todo };
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function FirstRun() {
  const [open, setOpen] = useState(shouldShow);
  if (!open) return null;
  return <FirstRunScreen onClose={() => { try { localStorage.setItem(DONE_KEY, "1"); } catch { /* private mode */ } setOpen(false); }} />;
}

function FirstRunScreen({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const { setOpenModal, addJob } = useTranscriptionModals();
  const ob = useOnboarding();
  const [phase, setPhase] = useState<Phase>("intro");
  const [source, setSource] = useState<Source>("voice");
  const [notice, setNotice] = useState<string | null>(null);
  const [finals, setFinals] = useState<string[]>([]);
  const [interim, setInterim] = useState("");
  const [secs, setSecs] = useState(0);
  const recRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const sampleTimer = useRef<number | null>(null);

  const text = useMemo(() => finals.join(" ").trim(), [finals]);

  useEffect(() => {
    if (phase !== "live") return;
    const t = window.setInterval(() => setSecs((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  /* the sample types itself in, word by word, like a real voice would */
  const playSample = useCallback((why: string | null) => {
    setNotice(why);
    setSource("sample"); setFinals([]); setInterim(""); setSecs(0); setPhase("live");
    const words = SAMPLE.map((s) => s.split(" "));
    let line = 0, word = 0;
    const step = () => {
      if (line >= words.length) { sampleTimer.current = null; return; }
      word += 1;
      const partial = words[line].slice(0, word).join(" ");
      if (word >= words[line].length) { const said = SAMPLE[line]; setFinals((f) => [...f, said]); setInterim(""); line += 1; word = 0; }
      else setInterim(partial);
      sampleTimer.current = window.setTimeout(step, word === 0 ? 420 : 150);
    };
    sampleTimer.current = window.setTimeout(step, 500);
  }, []);

  const startVoice = useCallback(() => {
    type Rec = { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void; onerror: (e: { error: string }) => void; onend: () => void; start: () => void; stop: () => void; abort: () => void };
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { playSample("Live listening works in Chrome and Edge, so here is a sample instead."); return; }
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = "";
      const done: string[] = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript.trim();
        if (!t) continue;
        if (r.isFinal) done.push(/[.!?]$/.test(t) ? t : `${t}.`); else live += `${t} `;
      }
      if (done.length) setFinals((f) => [...f, ...done.map((d) => d.charAt(0).toUpperCase() + d.slice(1))]);
      setInterim(live.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      recRef.current = null;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") playSample("The microphone is blocked in this browser, so here is a sample instead.");
      else playSample("Live listening is not available right now, so here is a sample instead.");
    };
    rec.onend = () => { recRef.current = null; };
    recRef.current = rec;
    setNotice(null); setSource("voice"); setFinals([]); setInterim(""); setSecs(0); setPhase("live");
    try { rec.start(); } catch { playSample("The microphone did not start, so here is a sample instead."); }
  }, [playSample]);

  const stopAll = useCallback(() => {
    recRef.current?.stop(); recRef.current = null;
    if (sampleTimer.current) { window.clearTimeout(sampleTimer.current); sampleTimer.current = null; }
  }, []);
  useEffect(() => () => { recRef.current?.abort(); if (sampleTimer.current) window.clearTimeout(sampleTimer.current); }, []);

  /* thirty seconds is plenty for a first note */
  useEffect(() => { if (phase === "live" && secs >= 30) finish(); });

  function finish() {
    stopAll();
    const all = [text, interim].filter(Boolean).join(" ").trim();
    if (!all) { setPhase("intro"); setNotice("I didn't catch anything. Try again, a little closer, or play the sample."); return; }
    if (interim) { setFinals((f) => [...f, /[.!?]$/.test(interim) ? interim : `${interim}.`]); setInterim(""); }
    setPhase("result");
  }

  const saveNote = () => {
    const sentences = [...finals, interim].filter(Boolean);
    const per = Math.max(2, Math.round(secs / Math.max(1, sentences.length)));
    addJob("Your first note", "audio", { source: "microphone", livePreviewSegments: sentences.map((s, i) => ({ id: i + 1, timestamp: clock(i * per), text: s })) });
  };

  const go = (modal: "meeting" | "upload" | "link" | "record" | null) => {
    if (phase === "result") saveNote();
    onClose();
    ob.navigate({ page: "dashboard" });
    if (modal) window.setTimeout(() => setOpenModal(modal), 250);
  };

  const skip = () => { stopAll(); onClose(); };

  const fade = { initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: reduce ? undefined : { opacity: 0, y: -8 }, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } as const;

  return (
    <div data-first-run={phase} className="fixed inset-0 z-[80] overflow-y-auto" style={{ background: NAVY }}>
      <img src={PHOTO} alt="" aria-hidden className="fixed inset-0 h-full w-full select-none object-cover" style={{ objectPosition: "70% 45%" }} />
      <span aria-hidden className="fixed inset-0" style={{ background: "linear-gradient(90deg, rgba(10,22,48,0.92) 0%, rgba(10,22,48,0.7) 45%, rgba(10,22,48,0.35) 100%)" }} />

      <div className="relative flex min-h-full flex-col px-6 py-6 lg:px-12">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-[0.01em] text-white/70">TranscribeToText</span>
          <button type="button" data-first-run-skip="" onClick={skip} className="rounded-full px-[14px] py-[7px] text-[13px] font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white">Skip for now</button>
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[620px] py-10">
            <AnimatePresence mode="wait">
              {phase === "intro" && (
                <motion.div key="intro" {...fade}>
                  <h1 className="text-[34px] font-bold leading-[40px] tracking-[-0.8px] text-white lg:text-[46px] lg:leading-[52px]">Say something.<br />Get the notes.</h1>
                  <p className="mt-4 max-w-[480px] text-[16px] leading-[24px] text-white/75">Talk for ten seconds about anything: a plan, an idea, your day. Watch it become a transcript and notes.</p>
                  {notice && <p className="mt-4 max-w-[480px] text-[14px] font-semibold leading-[20px] text-[#FFD66B]">{notice}</p>}
                  <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                    <button type="button" data-first-run-talk="" onClick={startVoice} className="group relative flex items-center gap-4 rounded-full bg-white py-[10px] pl-[10px] pr-[26px] text-[16px] font-semibold text-[#0A1630] transition-transform hover:scale-[1.02]">
                      <span className="relative flex size-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
                        <Icon icon={Mic01Icon} size={22} strokeWidth={2.2} className="relative" />
                      </span>
                      Start talking
                    </button>
                    <button type="button" data-first-run-sample="" onClick={() => playSample(null)} className="text-[14px] font-semibold text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white">Play a sample instead</button>
                  </div>
                  <div className="mt-14">
                    <p className="text-[13px] font-semibold text-white/60">Or bring something you already have</p>
                    <div className="mt-3 grid max-w-[520px] grid-cols-3 gap-3">
                      {([["upload", FileAudioIcon, "A file"], ["link", Link01Icon, "A link"], ["meeting", Video01Icon, "A meeting"]] as const).map(([m, ic, l]) => (
                        <button key={m} type="button" data-first-run-way={m} onClick={() => go(m)} className={cn(GLASS, "flex flex-col items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.14]")}>
                          <Icon icon={ic} size={18} strokeWidth={2} className={ACCENT} />
                          <span className="text-[14px] font-semibold text-white">{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === "live" && (
                <motion.div key="live" {...fade}>
                  <p className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.01em] text-white/70">
                    {source === "voice" ? <span className="relative flex size-[8px]"><span className="absolute inset-0 animate-ping rounded-full bg-destructive/70" /><span className="relative size-[8px] rounded-full bg-destructive" /></span> : <span className="rounded-full bg-white/15 px-2 py-[1px] text-[11px] font-bold text-white">Sample</span>}
                    {source === "voice" ? "Listening" : "Playing a sample"} · <span className="tabular-nums">{clock(secs)}</span>
                  </p>
                  {notice && <p className="mt-2 text-[13px] font-semibold text-[#FFD66B]">{notice}</p>}
                  <Bars active={!reduce} />
                  <div data-first-run-transcript="" className="mt-6 min-h-[132px] text-[22px] font-semibold leading-[32px] tracking-[-0.2px] text-white lg:text-[26px] lg:leading-[36px]">
                    {finals.map((f, i) => <motion.span key={i} initial={reduce ? false : { opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>{f} </motion.span>)}
                    <span className="text-white/45">{interim}</span>
                    {!text && !interim && <span className="text-white/35">{source === "voice" ? "Go ahead, I'm listening..." : ""}</span>}
                  </div>
                  <div className="mt-8 flex items-center gap-5">
                    <button type="button" data-first-run-done="" onClick={finish} disabled={!text && !interim} className="flex h-[46px] items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-[#0A1630] transition-opacity disabled:opacity-40">I'm done<Icon icon={ArrowRight01Icon} size={16} strokeWidth={2.4} /></button>
                    <button type="button" onClick={() => { stopAll(); setPhase("intro"); setNotice(null); }} className="text-[14px] font-semibold text-white/70 hover:text-white">Start over</button>
                  </div>
                </motion.div>
              )}

              {phase === "result" && <Result key="result" text={[...finals].join(" ")} secs={secs} sample={source === "sample"} onPick={go} fade={fade} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bars({ active }: { active: boolean }) {
  const hs = [10, 18, 12, 26, 16, 30, 12, 22, 28, 14, 32, 18, 24, 10, 28, 16, 20, 12, 30, 18, 26, 12, 20, 28, 14, 22];
  return (
    <div className="mt-6 flex h-[36px] items-center gap-[4px]" aria-hidden>
      {hs.map((h, i) => (
        <motion.span key={i} className="w-[4px] rounded-full bg-white/80" style={{ height: h }} animate={active ? { scaleY: [0.35, 1, 0.5, 0.9, 0.35] } : undefined} transition={{ duration: 1.1 + (i % 5) * 0.12, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

function Result({ text, secs, sample, onPick, fade }: { text: string; secs: number; sample: boolean; onPick: (m: "meeting" | "upload" | "link" | "record" | null) => void; fade: object }) {
  const { key, todo } = notesOf(text);
  const ways = [
    ["meeting", Video01Icon, "Online calls", "Zoom, Meet, Teams"],
    ["upload", FileAudioIcon, "Recorded files", "Audio and video"],
    ["link", Link01Icon, "Videos and links", "YouTube and more"],
    ["record", UserIcon, "Just me", "Thinking out loud"],
  ] as const;
  return (
    <motion.div {...fade}>
      <p className="text-[13px] font-semibold tracking-[0.01em] text-white/70">Your first note · <span className="tabular-nums">{clock(secs)}</span>{sample && " · from the sample"}</p>
      <div data-first-run-note="" className={cn(GLASS, "mt-3 p-5")}>
        <p className="line-clamp-3 text-[15px] font-semibold leading-[22px] text-white/90">{text}</p>
        {(key || todo.length > 0) && <div className="my-4 h-px bg-white/15" />}
        {key && <p className="text-[14px] font-semibold leading-[20px] text-white"><span className={ACCENT}>Key point</span> {key}</p>}
        {todo.map((t) => <p key={t} className="mt-2 text-[14px] font-semibold leading-[20px] text-white"><span className={ACCENT}>To do</span> {t}</p>)}
      </div>
      <h2 className="mt-10 text-[22px] font-bold leading-[28px] tracking-[-0.3px] text-white">Where do most of your conversations happen?</h2>
      <p className="mt-1 text-[14px] text-white/65">I'll save this note and open the right way in.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ways.map(([m, ic, l, s]) => (
          <button key={m} type="button" data-first-run-answer={m} onClick={() => onPick(m)} className={cn(GLASS, "flex flex-col items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.14]")}>
            <Icon icon={ic} size={18} strokeWidth={2} className={ACCENT} />
            <span>
              <span className="block text-[14px] font-semibold leading-[18px] text-white">{l}</span>
              <span className="block text-[12px] leading-[16px] text-white/60">{s}</span>
            </span>
          </button>
        ))}
      </div>
      <button type="button" data-first-run-open="" onClick={() => onPick(null)} className="mt-6 text-[14px] font-semibold text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white">Just open my note</button>
    </motion.div>
  );
}
