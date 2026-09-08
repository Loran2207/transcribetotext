import { useEffect, useState } from "react";
import { Mic01Icon, AiMagicIcon, CloudIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { RecordsTable } from "../records-table";
import { useTranscriptionModals } from "../transcription-modals";
import { useShell } from "./shell";

/* The desktop app's own tab. One verb at the top and the same records table the
   rest of the portal uses. The right half of the hero turns through the three
   things only the app does; a click on a dot holds one. */
const FEATURES = [
  { icon: Mic01Icon, title: "Both sides, no bot", line: (m: string) => `Your microphone and the call's sound, recorded on ${m}.` },
  { icon: AiMagicIcon, title: "Notes beside the transcript", line: () => "Type while it listens. Generate notes writes the note in your template." },
  { icon: CloudIcon, title: "In your account", line: () => "Every note lands here and in the web portal, same folders and templates." },
];

export function NotetakerPage({ onNavigate, onOpenFolder }: { onNavigate?: (page: string) => void; onOpenFolder?: (folderId: string) => void }) {
  const { setOpenModal } = useTranscriptionModals();
  const { machine } = useShell();
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % FEATURES.length), 3600);
    return () => window.clearInterval(t);
  }, [held]);
  const feature = FEATURES[active];
  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="px-[16px] pt-[16px] pb-[112px] md:px-[24px] md:pt-[20px] md:pb-[40px] lg:px-[32px] lg:pt-[28px] lg:pb-0">
        <div className="relative overflow-hidden rounded-[16px]" style={{ background: "#0A1630", boxShadow: "0 8px 24px rgba(10,22,48,0.18)" }}>
          <img src="/images/desktop/banner.jpg" alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: "center 42%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(10,22,48,0.94) 0%, rgba(10,22,48,0.72) 50%, rgba(10,22,48,0.45) 100%)" }} />
          <div className="relative flex items-center gap-[24px] p-[20px] md:p-[24px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[10px] md:max-w-[440px]">
              <p className="text-[20px] font-bold leading-[1.2] tracking-[-0.3px] text-white lg:text-[24px]">Every call, written up</p>
              <p className="text-[13px] leading-[1.5] text-white/78">Start when the call starts. Pause any time. Generate notes ends the recording and writes the note.</p>
              <button type="button" className="mt-[4px] flex h-[38px] w-fit items-center gap-[8px] rounded-full bg-white pl-[16px] pr-[18px] text-[13.5px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]" onClick={() => setOpenModal("meeting")}>
                <Icon icon={Mic01Icon} className="size-[16px]" strokeWidth={1.9} />
                Record a call
              </button>
            </div>
            <div className="ml-auto hidden w-[300px] shrink-0 flex-col gap-[10px] md:flex" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}>
              <div key={active} className="ttt-feature-in flex items-start gap-[12px] rounded-[14px] border border-white/15 bg-white/10 p-[14px] backdrop-blur-[6px]">
                <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-white text-[#0A1630]">
                  <Icon icon={feature.icon} className="size-[18px]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-white">{feature.title}</span>
                  <span className="mt-[2px] block text-[12.5px] leading-[1.45] text-white/75">{feature.line(machine)}</span>
                </span>
              </div>
              <div className="flex items-center justify-center gap-[6px]">
                {FEATURES.map((f, i) => (
                  <button key={f.title} type="button" aria-label={f.title} onClick={() => { setActive(i); setHeld(true); }} className={i === active ? "h-[6px] w-[16px] rounded-full bg-white transition-all" : "size-[6px] rounded-full bg-white/35 transition-all"} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-[8px]">
          <RecordsTable surface="home" onNavigateToRecords={() => onNavigate?.("records")} onOpenFolder={onOpenFolder} />
        </div>
      </div>
    </div>
  );
}
