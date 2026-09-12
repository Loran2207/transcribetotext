import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowExpand01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { NotesPad, type PadLine } from "./notes-pad";
import { useTranscriptionModals } from "../transcription-modals";
import { LiveRecordingBar, LiveTitle, LiveFolderChip, LiveMeetingChips, LiveHeaderActions, padWithTemplate } from "../transcription-detail-page";
import { ShareDialog } from "../share-dialog";
import { useTemplates } from "@/hooks/use-templates";
import { TemplateLibraryDialog } from "../template-library-dialog";
import { useShell } from "./shell";
import { SourceIcon } from "../source-icons";

const DEMO_PAD: PadLine[] = [
  { kind: "p", text: "Ask who owns the export" },
  { kind: "h", text: "Questions for Maria" },
  { kind: "todo", text: "Send the pricing tiers today", done: false },
];

/* The app docked beside the call: half the screen, the notes pad first, the
   transcript one tab away, and the recording row at the bottom. Nothing the
   full window has is missing, only the chrome around it. */
export function SplitNotetaker() {
  const { machine } = useShell();
  const navigate = useNavigate();
  const [pad, setPad] = useState<PadLine[]>(DEMO_PAD);
  const [tab, setTab] = useState("notes");
  const { templates } = useTemplates();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const insertTemplate = (id: string) => { const t = templates.find((x) => x.id === id); if (t) setPad((prev) => padWithTemplate(prev, t)); };
  const { recordingElapsed, recordingPhase, pauseInstantRecording, resumeInstantRecording, microphoneDevices, selectedMicrophoneId, switchRecordingMicrophone, isSwitchingMicrophone } = useTranscriptionModals();
  const elapsed = recordingPhase === "idle" ? 754 : recordingElapsed;
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="shrink-0 px-[20px] pt-[14px] pb-[12px]">
        <div className="flex h-7 items-center justify-end">
          <button type="button" onClick={() => navigate("/transcriptions/live", { state: { liveRecording: true } })} className="flex h-7 items-center gap-[6px] rounded-full border border-border px-[10px] text-[12px] font-medium text-foreground transition-colors hover:bg-muted" title="Back to the full window">
            <Icon icon={ArrowExpand01Icon} className="size-[13px]" strokeWidth={1.9} />
            Full window
          </button>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1"><LiveTitle className="text-[22px] font-semibold leading-[28px] tracking-[-0.3px] text-foreground" /></div>
          {/* the same verbs as the full window, in the same order: what waits, waits here too */}
          <LiveHeaderActions compact onShare={() => setShareOpen(true)} transcriptText={() => "Maria: The export is owned by our ops team, I can send the owner today.\nYou: Great, then the pricing tiers go out before Thursday."} thoughtsText={() => pad.map((l) => l.text).join("\n")} />
        </div>
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} resourceType="transcription" resourceId="live" resourceName={window.sessionStorage.getItem("ttt_live_title") || "Untitled call"} />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="scale-[0.9]"><SourceIcon source="microphone" /></span><span>Notetaker on {machine}</span></span>
          <span className="text-border">{"\u2022"}</span>
          <span>{recordingPhase === "paused" ? "Paused - live transcript is on hold" : "Recording in real time"}</span>
          <span className="text-border">{"\u2022"}</span>
          <span>{new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
          <span className="text-border">{"\u2022"}</span>
          <LiveFolderChip />
          <span className="text-border">{"\u2022"}</span>
          <LiveMeetingChips />
        </div>
        <TemplateLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} value={null} onSelect={(tid) => { if (tid) insertTemplate(tid); }} gate={false} />
      </div>
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-[20px]">
          <TabsList variant="line" className="border-b-0">
            <TabsTrigger value="notes" variant="line">My thoughts</TabsTrigger>
            <TabsTrigger value="transcript" variant="line">Transcript</TabsTrigger>
          </TabsList>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-[16px] py-[14px]">
          {tab === "notes" ? (
            <NotesPad lines={pad} onChange={setPad} templates={templates} onTemplate={(tid) => { if (tid === "all") setLibraryOpen(true); else insertTemplate(tid); }} />
          ) : (
            <div className="flex flex-col gap-[12px] text-[13px] leading-[19px]">
              {[["Maria", "The export is owned by our ops team, I can send the owner today."], ["You", "Great, then the pricing tiers go out before Thursday."], ["Maria", "Works for us, let us lock the dates on the call tomorrow."]].map(([who, line], i) => (
                <p key={i}><span className="font-semibold">{who}</span> <span className="text-muted-foreground">{line}</span></p>
              ))}
            </div>
          )}
        </div>
      </Tabs>
      <p className="shrink-0 px-[16px] py-[8px] text-center text-[12px] text-muted-foreground">My thoughts won't be included when you share this note.</p>
      <LiveRecordingBar
        isPaused={recordingPhase === "paused"}
        elapsedSeconds={elapsed}
        onPauseResume={() => { if (recordingPhase === "paused") void resumeInstantRecording(); else pauseInstantRecording(); }}
        onStop={() => {}}
        generate
        showGenerate={false}
        caption={false}
        microphoneDevices={microphoneDevices}
        selectedMicrophoneId={selectedMicrophoneId}
        onSwitchMicrophone={(id) => { void switchRecordingMicrophone(id); }}
        isSwitchingMicrophone={isSwitchingMicrophone}
      />
    </div>
  );
}
