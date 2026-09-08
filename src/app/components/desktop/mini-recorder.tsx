import { useState } from "react";
import { useNavigate } from "react-router";
import { AiMagicIcon, Loading01Icon, Mic01Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { readDemo, useShell } from "./shell";
import { SourceIcon } from "../source-icons";
import { useTranscriptionModals } from "../transcription-modals";

function fmt(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

export type MiniMode = "minimal" | "expanded" | "paused" | "ended" | "writing" | "done";

/* The app's own small window for a call in progress, the one that stays on top
   when the main window is closed or behind the meeting. Granola's grammar,
   kept whole: at rest a wordless capsule (red dot, three level bars) says it is
   listening; hover opens the row with the timer, the name and one central
   button, Pause. On hold the button reads Resume and a glowing Generate notes
   appears above the row: the note is written only from a stopped call. While
   it is written the row says so; when ready, Open or keep recording into the
   same note. Dev server: /desk with `?desk=widget|expanded|paused|writing|done`. */
export function MiniRecorder({ mode: forced, peek = true }: { mode?: MiniMode; peek?: boolean } = {}) {
  const navigate = useNavigate();
  const { recordingPhase, recordingElapsed, pauseInstantRecording, resumeInstantRecording, liveTranscriptSegments } = useTranscriptionModals();
  const [hover, setHover] = useState(false);
  const live = recordingPhase === "recording" || recordingPhase === "paused";
  const demo = readDemo("widget") ?? readDemo("desk");
  const mode: MiniMode = forced ?? (demo === "expanded" || demo === "paused" || demo === "ended" || demo === "writing" || demo === "done" ? demo : live && recordingPhase === "paused" ? "paused" : "minimal");
  const ended = mode === "ended";
  /* the last lines heard, shown beside the open row so a glance says what the
     call is at without opening the app */
  const demoLines = ["Maria: the export is owned by our ops team, I can send the owner today.", "You: great, then the pricing tiers go out before Thursday.", "Maria: works for us, let us lock the dates on the call tomorrow."];
  const lines = (liveTranscriptSegments.length ? liveTranscriptSegments.slice(-3).map((s) => s.text) : demoLines);
  const paused = mode === "paused";
  const open = hover || mode !== "minimal";
  const elapsed = live ? recordingElapsed : 754;
  const title = window.sessionStorage.getItem("ttt_live_title") || "Untitled call";
  const toggle = () => { if (!live) return; if (paused) resumeInstantRecording(); else pauseInstantRecording(); };
  const generate = () => navigate("/transcriptions/live", { state: { liveRecording: true, generate: true } });
  const ground = { background: "#0A1630", boxShadow: "0 10px 30px rgba(10,22,48,0.28)" };
  const row = "flex h-[56px] items-center gap-[10px] rounded-full text-white";

  if (mode === "writing") {
    return (
      <div className={`${row} pl-[14px] pr-[18px]`} style={ground}>
        <Icon icon={Loading01Icon} className="size-[16px] animate-spin text-white/80" strokeWidth={2} />
        <span className="text-[13px] font-semibold">Writing the note</span>
        <span className="max-w-[180px] truncate text-[13px] text-white/60">{title}</span>
      </div>
    );
  }
  if (mode === "done") {
    return (
      <div className={`${row} pl-[16px] pr-[6px]`} style={ground}>
        <span className="size-[8px] shrink-0 rounded-full bg-[#34C759]" />
        <span className="text-[13px] font-semibold">Notes are ready</span>
        <span className="max-w-[140px] truncate text-[13px] text-white/60">{title}</span>
        <button type="button" onClick={() => navigate("/transcriptions/rec-1")} className="ml-[4px] flex h-[36px] items-center rounded-full bg-white/10 px-[14px] text-[13px] font-semibold transition-colors hover:bg-white/20">Open</button>
        <button type="button" onClick={() => navigate("/transcriptions/live", { state: { liveRecording: true } })} className="flex h-[36px] items-center gap-[6px] rounded-full bg-white px-[14px] text-[13px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]">
          <Icon icon={Mic01Icon} className="size-[14px]" strokeWidth={1.9} />
          Continue recording
        </button>
      </div>
    );
  }
  if (!open) {
    return (
      <button type="button" aria-label="Recording, open the controls" onMouseEnter={() => setHover(true)} className="flex w-[56px] flex-col items-center gap-[12px] rounded-full py-[16px] text-white" style={ground}>
        <span className="size-[10px] rounded-full bg-[#FF3B30] animate-pulse" />
        <span className="flex h-[22px] items-end gap-[3px]">
          <span className="w-[4px] rounded-full bg-[#34C759]" style={{ height: "60%" }} />
          <span className="w-[4px] rounded-full bg-[#34C759]" style={{ height: "100%" }} />
          <span className="w-[4px] rounded-full bg-[#34C759]" style={{ height: "40%" }} />
        </span>
        <span className="h-[3px] w-[16px] rounded-full bg-white/25" />
      </button>
    );
  }
  return (
    <div className="relative" onMouseLeave={() => setHover(false)}>
      {peek && !paused && !ended && (
        <div className="absolute bottom-0 right-[calc(100%+10px)] w-[300px] rounded-[16px] p-[12px] text-[12.5px] leading-[17px] text-white/85 backdrop-blur-[10px]" style={{ background: "rgba(10,22,48,0.78)", boxShadow: "0 8px 24px rgba(10,22,48,0.22)" }}>
          {lines.map((l, i) => (<p key={i} className={i === lines.length - 1 ? "text-white" : "text-white/60"}>{l}</p>))}
        </div>
      )}
      <div className={`${row} ${paused || ended ? "w-auto" : "w-[340px]"} pl-[14px] pr-[10px]`} style={ground}>
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] bg-white"><SourceIcon source="zoom" /></span>
        <span className={ended ? "size-[8px] shrink-0 rounded-full bg-white/40" : paused ? "size-[8px] shrink-0 rounded-full bg-[#FEBC2E]" : "size-[8px] shrink-0 rounded-full bg-[#FF3B30] animate-pulse"} />
        <span className="shrink-0 text-[14px] font-semibold tabular-nums">{fmt(elapsed)}</span>
        <span className={`min-w-0 truncate text-[13px] text-white/70 ${paused || ended ? "max-w-[120px]" : "flex-1"}`}>{ended ? "Call ended, 10s" : paused ? "On hold" : title}</span>
        <button type="button" onClick={toggle} className="flex h-[36px] shrink-0 items-center gap-[6px] rounded-full bg-white px-[14px] text-[13px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]">
          <Icon icon={paused || ended ? PlayIcon : PauseIcon} className="size-[14px]" strokeWidth={2} />
          {ended ? "Keep recording" : paused ? "Resume" : "Pause"}
        </button>
        {(paused || ended) && (
          /* the row grows by one verb; nothing floats */
          <button type="button" onClick={generate} className="ttt-glow flex h-[36px] shrink-0 items-center gap-[6px] rounded-full bg-primary px-[14px] text-[13px] font-semibold text-primary-foreground transition-transform hover:scale-[1.03]">
            <Icon icon={AiMagicIcon} className="size-[14px]" strokeWidth={1.8} />
            Generate notes
          </button>
        )}
      </div>
    </div>
  );
}

/* Granola's honest note: the OS sees the call end, so the row says so and
   counts down to the note; Keep recording holds it open for the tail.
   A page that is only the widget, for the desktop app's second window. */
export function MiniRecorderPage() {
  const { os } = useShell();
  return (
    <div className="flex h-screen w-screen items-center justify-center" style={{ background: os === "win" ? "#F3F3F3" : "#F5F5F7" }}>
      <MiniRecorder />
    </div>
  );
}
