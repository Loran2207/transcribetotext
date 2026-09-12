import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AiMagicIcon, Loading01Icon, PauseIcon, PlayIcon, LayoutRightIcon, Note01Icon, DragDropHorizontalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useTranscriptionModals } from "../transcription-modals";
import { useDemo, setDemo, useShell } from "./shell";

/* every round button says what it does, to the left, where the eye already is;
   declared outside the capsule so the ticking clock does not remount it */
const Tip = ({ label, children }: { label: string; children: ReactNode }) => <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent side="left" sideOffset={8}>{label}</TooltipContent></Tooltip>;

export type MiniMode = "minimal" | "hover" | "paused" | "ended" | "writing" | "done";

/* The recording, with the window gone: one small capsule that floats over the
   desk, standing upright (Kirill, 10.09). Everything is a single round
   button inside it: pause or resume, Generate notes when the call is on hold,
   and Open, which docks the notes beside the call. Hovering shows the last
   words heard, to the left. The capsule can be dragged anywhere and remembers
   where it was left. Dev server: /desk?desk=widget|hover|paused|ended|writing|done. */
export function MiniRecorder({ mode: forced }: { mode?: MiniMode } = {}) {
  const navigate = useNavigate();
  const { recordingPhase, recordingElapsed, pauseInstantRecording, resumeInstantRecording, liveTranscriptSegments } = useTranscriptionModals();
  const [hover, setHover] = useState(false);
  const live = recordingPhase === "recording" || recordingPhase === "paused";
  const demoWidget = useDemo("widget"); const demoDesk = useDemo("desk"); const demo = demoWidget ?? demoDesk;
  const mode: MiniMode = forced ?? (demo === "hover" || demo === "paused" || demo === "ended" || demo === "writing" || demo === "done" ? demo : live && recordingPhase === "paused" ? "paused" : "minimal");
  const paused = mode === "paused", ended = mode === "ended", writing = mode === "writing", done = mode === "done";
  const recording = mode === "minimal" || mode === "hover";
  const demoLines = ["Maria: the export is owned by our ops team, I can send the owner today.", "You: great, then the pricing tiers go out before Thursday.", "Maria: works for us, let us lock the dates on the call tomorrow."];
  const lines = liveTranscriptSegments.length ? liveTranscriptSegments.slice(-3).map((s) => s.text) : demoLines;
  const elapsed = live ? recordingElapsed : 754;
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  const toggle = () => { if (!live) return; if (paused) resumeInstantRecording(); else pauseInstantRecording(); };
  const generate = () => navigate("/transcriptions/live", { state: { liveRecording: true, generate: true } });
  const openNotes = () => setDemo("desk", "split");

  /* drag: the offset lives in the session so the capsule stays where it was put */
  const [offset, setOffset] = useState<{ x: number; y: number }>(() => { try { return JSON.parse(window.sessionStorage.getItem("ttt_widget_pos") || "") as { x: number; y: number }; } catch { return { x: 0, y: 0 }; } });
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => { if ((e.target as HTMLElement).closest("button")) return; drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => { if (!drag.current) return; setOffset({ x: drag.current.ox + e.clientX - drag.current.sx, y: drag.current.oy + e.clientY - drag.current.sy }); };
  const onUp = () => { if (!drag.current) return; drag.current = null; window.sessionStorage.setItem("ttt_widget_pos", JSON.stringify(offset)); };
  useEffect(() => { if (!drag.current) window.sessionStorage.setItem("ttt_widget_pos", JSON.stringify(offset)); }, [offset]);

  const btn = "flex size-[30px] shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20";
  const peek = (hover || mode === "hover") && recording;
  return (
    <div className="relative select-none" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {peek && (
        <div className="absolute right-[calc(100%+10px)] top-0 w-[280px] rounded-[14px] p-[11px] text-[12.5px] leading-[17px] text-white/85 backdrop-blur-[10px]" style={{ background: "rgba(10,22,48,0.8)", boxShadow: "0 8px 24px rgba(10,22,48,0.22)" }}>
          {lines.map((l, i) => (<p key={i} className={i === lines.length - 1 ? "text-white" : "text-white/60"}>{l}</p>))}
        </div>
      )}
      {/* a vertical capsule (Kirill, 10.09): the grip on top, the state under it,
          then the verbs; the width never changes, only the middle does */}
      <div
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        className="flex w-[46px] cursor-grab flex-col items-center gap-[7px] rounded-full pt-[9px] pb-[8px] text-white backdrop-blur-[12px] active:cursor-grabbing"
        style={{ background: "rgba(10,22,48,0.82)", boxShadow: "0 10px 30px rgba(10,22,48,0.28)" }}
        title={recording ? "Recording. Drag to move" : "Drag to move"}
      >
        <Icon icon={DragDropHorizontalIcon} className="size-[14px] text-white/40" strokeWidth={2} aria-hidden />
        {writing ? (
          <Icon icon={Loading01Icon} className="size-[14px] animate-spin text-white/80" strokeWidth={2} />
        ) : (
          <span className={`size-[8px] shrink-0 rounded-full ${done ? "bg-[#34C759]" : ended ? "bg-white/40" : paused ? "bg-[#FEBC2E]" : "bg-[#FF3B30] animate-pulse"}`} />
        )}
        {recording && (
          /* the sound, as four bars breathing on their own beats */
          <span className="flex h-[24px] items-center gap-[3px]" aria-hidden>
            {[0.5, 1, 0.65, 0.85, 0.45].map((h, i) => (
              <span key={i} className="ttt-bar w-[3px] rounded-full bg-[#34C759]" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.18}s`, animationDuration: `${0.8 + i * 0.15}s` }} />
            ))}
          </span>
        )}
        {(paused || ended) && <span className="text-[11px] font-semibold tabular-nums leading-[14px]">{ended ? "10s" : fmt(elapsed)}</span>}
        {writing && <span className="text-[10.5px] leading-[14px] text-white/80">Writing</span>}
        {done && <span className="text-[10.5px] leading-[14px] text-white/80">Ready</span>}
        <span className="h-px w-[16px] bg-white/15" />
        {(recording || paused || ended) && (
          <Tip label={ended ? "Keep recording" : paused ? "Resume" : "Pause"}><button type="button" onClick={toggle} aria-label={ended ? "Keep recording" : paused ? "Resume" : "Pause"} className={btn}>
            <Icon icon={paused || ended ? PlayIcon : PauseIcon} className="size-[14px]" strokeWidth={2} />
          </button></Tip>
        )}
        {(paused || ended) && (
          <Tip label="Generate notes"><button type="button" onClick={generate} aria-label="Generate notes" className={`${btn} ttt-glow bg-primary hover:bg-primary/90`}>
            <Icon icon={AiMagicIcon} className="size-[14px]" strokeWidth={1.9} />
          </button></Tip>
        )}
        {done ? (
          <Tip label="Open the note"><button type="button" onClick={() => navigate("/transcriptions/rec-1")} aria-label="Open the note" className={btn}>
            <Icon icon={Note01Icon} className="size-[14px]" strokeWidth={1.9} />
          </button></Tip>
        ) : (
          <Tip label="Open the notes beside the call"><button type="button" onClick={openNotes} aria-label="Open the notes beside the call" className={btn}>
            <Icon icon={LayoutRightIcon} className="size-[14px]" strokeWidth={1.9} />
          </button></Tip>
        )}
      </div>
    </div>
  );
}

/* A page that is only the widget, for the desktop app's second window. */
export function MiniRecorderPage() {
  const { os } = useShell();
  return (
    <div className="flex h-screen w-screen items-center justify-center" style={{ background: os === "win" ? "#F3F3F3" : "#F5F5F7" }}>
      <MiniRecorder />
    </div>
  );
}
