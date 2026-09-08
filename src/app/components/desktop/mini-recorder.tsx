import { useNavigate } from "react-router";
import { PauseIcon, PlayIcon, AiMagicIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { readDemo, useShell } from "./shell";
import { useTranscriptionModals } from "../transcription-modals";

function fmt(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

/* The app's own small window for a call in progress, the one that stays on top
   when the main window is closed or behind the meeting. It says the recording
   is on, lets you pause, and ends it the only way there is: Generate notes.
   The dev server draws it at /widget; `?widget=paused` shows the paused state. */
export function MiniRecorder() {
  const navigate = useNavigate();
  const { recordingPhase, recordingElapsed, pauseInstantRecording, resumeInstantRecording } = useTranscriptionModals();
  const live = recordingPhase === "recording" || recordingPhase === "paused";
  const demo = readDemo("widget") ?? readDemo("desk");
  const paused = live ? recordingPhase === "paused" : demo === "paused";
  const elapsed = live ? recordingElapsed : 754;
  const title = window.sessionStorage.getItem("ttt_live_title") || "Untitled call";
  const toggle = () => { if (!live) return; if (paused) resumeInstantRecording(); else pauseInstantRecording(); };
  const generate = () => navigate("/transcriptions/live", { state: { liveRecording: true, generate: true } });
  return (
    <div className="flex h-[56px] w-[360px] items-center gap-[10px] rounded-full pl-[16px] pr-[6px] text-white" style={{ background: "#0A1630", boxShadow: "0 10px 30px rgba(10,22,48,0.28)" }}>
      <span className={paused ? "size-[8px] shrink-0 rounded-full bg-[#FEBC2E]" : "size-[8px] shrink-0 rounded-full bg-[#FF3B30] animate-pulse"} />
      <span className="shrink-0 text-[14px] font-semibold tabular-nums">{fmt(elapsed)}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-white/70">{paused ? "Paused" : title}</span>
      <button type="button" aria-label={paused ? "Resume" : "Pause"} onClick={toggle} className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
        <Icon icon={paused ? PlayIcon : PauseIcon} className="size-[16px]" strokeWidth={2} />
      </button>
      <button type="button" onClick={generate} className="flex h-[40px] shrink-0 items-center gap-[6px] rounded-full bg-primary pl-[12px] pr-[14px] text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
        <Icon icon={AiMagicIcon} className="size-[15px]" strokeWidth={1.9} />
        Generate notes
      </button>
    </div>
  );
}

/* A page that is only the widget, for the desktop app's second window and for
   the Figma capture: neutral ground, the pill in the middle. */
export function MiniRecorderPage() {
  const { os } = useShell();
  return (
    <div className="flex h-screen w-screen items-center justify-center" style={{ background: os === "win" ? "#F3F3F3" : "#F5F5F7" }}>
      <MiniRecorder />
    </div>
  );
}
