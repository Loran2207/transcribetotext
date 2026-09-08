import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowExpand01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { NotesPad, type PadLine } from "./notes-pad";
import { PauseIcon } from "@hugeicons/core-free-icons";
import { useTranscriptionModals } from "../transcription-modals";
import { useShell } from "./shell";

const DEMO_PAD: PadLine[] = [
  { kind: "p", text: "Ask who owns the export" },
  { kind: "h", text: "Questions for Maria" },
  { kind: "todo", text: "Send the pricing tiers today", done: false },
];

/* The app docked beside the call: half the screen, the notes pad first, the
   transcript one tab away, and the recording row at the bottom. Nothing the
   full window has is missing, only the chrome around it. */
export function SplitNotetaker() {
  const { os } = useShell();
  const navigate = useNavigate();
  const [pad, setPad] = useState<PadLine[]>(DEMO_PAD);
  const [tab, setTab] = useState("notes");
  const { recordingElapsed, recordingPhase, pauseInstantRecording } = useTranscriptionModals();
  const elapsed = recordingPhase === "idle" ? 754 : recordingElapsed;
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  const title = window.sessionStorage.getItem("ttt_live_title") || "Untitled call";
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className={`flex h-[44px] shrink-0 items-center gap-[10px] ${os === "mac" ? "pl-[84px]" : "pl-[16px]"} pr-[8px]`}>
        <span className="flex items-center gap-[8px] text-[13px] text-muted-foreground"><span className="size-[8px] rounded-full bg-[#FF3B30] animate-pulse" />Recording a call</span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{title}</span>
        <button type="button" onClick={() => navigate("/transcriptions/live", { state: { liveRecording: true } })} className="flex h-7 items-center gap-[6px] rounded-full border border-border px-[10px] text-[12px] font-medium transition-colors hover:bg-muted" title="Back to the full window">
          <Icon icon={ArrowExpand01Icon} className="size-[13px]" strokeWidth={1.9} />
          Full window
        </button>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-[16px]">
          <TabsList variant="line" className="border-b-0">
            <TabsTrigger value="notes" variant="line">My thoughts</TabsTrigger>
            <TabsTrigger value="transcript" variant="line">Transcript</TabsTrigger>
          </TabsList>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-[16px] py-[14px]">
          {tab === "notes" ? (
            <NotesPad lines={pad} onChange={setPad} templates={[]} onTemplate={() => {}} />
          ) : (
            <div className="flex flex-col gap-[12px] text-[13px] leading-[19px]">
              {[["Maria", "The export is owned by our ops team, I can send the owner today."], ["You", "Great, then the pricing tiers go out before Thursday."], ["Maria", "Works for us, let us lock the dates on the call tomorrow."]].map(([who, line], i) => (
                <p key={i}><span className="font-semibold">{who}</span> <span className="text-muted-foreground">{line}</span></p>
              ))}
            </div>
          )}
        </div>
      </Tabs>
      <p className="shrink-0 border-t border-border px-[16px] py-[8px] text-center text-[12px] text-muted-foreground">My thoughts won't be included when you share this note.</p>
      <div className="flex shrink-0 items-center gap-[10px] border-t border-border px-[16px] py-[10px]">
        <span className="size-[8px] rounded-full bg-[#FF3B30] animate-pulse" />
        <span className="text-[13px] font-semibold text-destructive">Recording</span>
        <span className="text-[14px] font-semibold tabular-nums">{fmt(elapsed)}</span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">Live transcript is running</span>
        <button type="button" onClick={pauseInstantRecording} className="flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[13px] font-medium transition-colors hover:bg-muted">
          <Icon icon={PauseIcon} className="size-[14px]" strokeWidth={2} />
          Pause
        </button>
      </div>
    </div>
  );
}
