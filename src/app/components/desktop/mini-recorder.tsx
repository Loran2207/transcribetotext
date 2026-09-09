import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router";
import { AiMagicIcon, Loading01Icon, PauseIcon, PlayIcon, LayoutRightIcon, Note01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { useTranscriptionModals } from "../transcription-modals";
import { useDemo, setDemo, useShell } from "./shell";

export type MiniMode = "minimal" | "hover" | "paused" | "ended" | "writing" | "done";

/* The recording, with the window gone: one small capsule that floats over the
   desk (Kirill, 09.09: no wide row any more). Everything is a single round
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

  const btn = "flex size-[28px] shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20";
  const peek = (hover || mode === "hover") && recording;
  return (
    <div className="relative select-none" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {peek && (
        <div className="absolute right-[calc(100%+10px)] top-0 w-[280px] rounded-[14px] p-[11px] text-[12.5px] leading-[17px] text-white/85 backdrop-blur-[10px]" style={{ background: "rgba(10,22,48,0.8)", boxShadow: "0 8px 24px rgba(10,22,48,0.22)" }}>
          {lines.map((l, i) => (<p key={i} className={i === lines.length - 1 ? "text-white" : "text-white/60"}>{l}</p>))}
        </div>
      )}
      <div
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        className="flex h-[40px] cursor-grab items-center gap-[2px] rounded-full pl-[12px] pr-[6px] text-white backdrop-blur-[12px] active:cursor-grabbing"
        style={{ background: "rgba(10,22,48,0.82)", boxShadow: "0 10px 30px rgba(10,22,48,0.28)" }}
        title={recording ? "Recording. Drag to move" : undefined}
      >
        {/* the state, as a dot and a number, never a sentence */}
        {writing ? (
          <Icon icon={Loading01Icon} className="size-[14px] animate-spin text-white/80" strokeWidth={2} />
        ) : (
          <span className={`size-[8px] shrink-0 rounded-full ${done ? "bg-[#34C759]" : ended ? "bg-white/40" : paused ? "bg-[#FEBC2E]" : "bg-[#FF3B30] animate-pulse"}`} />
        )}
        {recording && (
          <span className="ml-[8px] flex h-[16px] items-end gap-[2px]" aria-hidden>
            <span className="w-[3px] rounded-full bg-[#34C759]" style={{ height: "55%" }} />
            <span className="w-[3px] rounded-full bg-[#34C759]" style={{ height: "100%" }} />
            <span className="w-[3px] rounded-full bg-[#34C759]" style={{ height: "40%" }} />
            <span className="w-[3px] rounded-full bg-[#34C759]" style={{ height: "75%" }} />
          </span>
        )}
        {(paused || ended) && <span className="ml-[8px] text-[12.5px] font-semibold tabular-nums">{ended ? "10s" : fmt(elapsed)}</span>}
        {writing && <span className="ml-[8px] text-[12.5px] text-white/80">Writing</span>}
        {done && <span className="ml-[8px] text-[12.5px] text-white/80">Ready</span>}
        <span className="mx-[6px] h-[16px] w-px bg-white/15" />
        {(recording || paused || ended) && (
          <button type="button" onClick={toggle} aria-label={ended ? "Keep recording" : paused ? "Resume" : "Pause"} title={ended ? "Keep recording" : paused ? "Resume" : "Pause"} className={btn}>
            <Icon icon={paused || ended ? PlayIcon : PauseIcon} className="size-[14px]" strokeWidth={2} />
          </button>
        )}
        {(paused || ended) && (
          <button type="button" onClick={generate} aria-label="Generate notes" title="Generate notes" className={`${btn} ttt-glow bg-primary hover:bg-primary/90`}>
            <Icon icon={AiMagicIcon} className="size-[14px]" strokeWidth={1.9} />
          </button>
        )}
        {done ? (
          <button type="button" onClick={() => navigate("/transcriptions/rec-1")} aria-label="Open the note" title="Open the note" className={btn}>
            <Icon icon={Note01Icon} className="size-[14px]" strokeWidth={1.9} />
          </button>
        ) : (
          <button type="button" onClick={openNotes} aria-label="Open the notes beside the call" title="Open the notes beside the call" className={btn}>
            <Icon icon={LayoutRightIcon} className="size-[14px]" strokeWidth={1.9} />
          </button>
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
