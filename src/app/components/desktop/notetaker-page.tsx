import { Mic01Icon, AiMagicIcon, CloudIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { RecordsTable } from "../records-table";
import { useTranscriptionModals } from "../transcription-modals";
import { useShell } from "./shell";

/* The desktop app's own tab. One verb at the top, three facts under it, and the
   same records table the rest of the portal uses. Nothing here is a new
   pattern: the page is the dashboard's shape with one card instead of four. */
export function NotetakerPage({ onNavigate, onOpenFolder }: { onNavigate?: (page: string) => void; onOpenFolder?: (folderId: string) => void }) {
  const { setOpenModal } = useTranscriptionModals();
  const { machine } = useShell();
  const facts = [
    { icon: Mic01Icon, title: "Both sides, no bot", line: `Your microphone and the call's sound are recorded on ${machine}. Nothing joins the meeting.` },
    { icon: AiMagicIcon, title: "Notes beside the transcript", line: "Type your own notes while it listens. Press Generate notes and the note is written in your template." },
    { icon: CloudIcon, title: "In your account", line: "Every note lands here and in the web portal, with the same folders and templates." },
  ];
  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="px-[16px] pt-[16px] pb-[112px] md:px-[24px] md:pt-[20px] md:pb-[40px] lg:px-[32px] lg:pt-[28px] lg:pb-0">
        <div className="relative overflow-hidden rounded-[16px]" style={{ background: "#0A1630", boxShadow: "0 8px 24px rgba(10,22,48,0.18)" }}>
          <img src="/images/desktop/banner.jpg" alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: "center 42%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(10,22,48,0.92) 0%, rgba(10,22,48,0.55) 55%, rgba(10,22,48,0.15) 100%)" }} />
          <div className="relative flex flex-col gap-[14px] p-[24px] md:max-w-[520px]">
            <p className="text-[22px] font-bold leading-[1.2] tracking-[-0.3px] text-white lg:text-[26px]">Every call, written up</p>
            <p className="text-[14px] leading-[1.5] text-white/80">Start when the call starts. Pause any time. Generate notes ends the recording and writes the note.</p>
            <Button className="h-[42px] w-fit rounded-full gap-2 px-5 text-[14px] font-semibold" onClick={() => { window.sessionStorage.setItem("ttt_meeting_method", "desktop"); setOpenModal("meeting"); }}>
              <Icon icon={Mic01Icon} className="size-[16px]" strokeWidth={1.8} />
              Record a call
            </Button>
          </div>
        </div>
        <div className="mt-[16px] grid gap-[12px] md:grid-cols-3">
          {facts.map((f) => (
            <div key={f.title} className="flex gap-[12px] rounded-[16px] border border-border bg-card p-[16px]">
              <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon icon={f.icon} className="size-[18px]" strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-foreground">{f.title}</span>
                <span className="mt-[2px] block text-[13px] leading-[1.45] text-muted-foreground">{f.line}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-[8px]">
          <RecordsTable surface="home" onNavigateToRecords={() => onNavigate?.("records")} onOpenFolder={onOpenFolder} />
        </div>
      </div>
    </div>
  );
}
