import { useState } from "react";
import { useNavigate } from "react-router";
import { Mic01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { readDemo, useShell } from "./shell";
import { useTranscriptionModals } from "../transcription-modals";

/* The two things the app says from outside its window. "A call started" comes
   from the OS seeing Zoom, Meet or Teams take the microphone; "Notes are ready"
   comes after Generate notes when the app is behind other windows. Drawn in the
   system's own notification shape: top right on macOS, bottom right on Windows.
   The dev server shows them from `?notice=call|ready`. */
export function DesktopNotice() {
  const { desktop, os } = useShell();
  const navigate = useNavigate();
  const { setOpenModal } = useTranscriptionModals();
  const [kind, setKind] = useState(() => readDemo("notice"));
  if (!desktop || (kind !== "call" && kind !== "ready")) return null;
  const notice = kind === "call"
    ? { title: "Zoom call started", body: "Record it here, no bot joins the call", primary: "Record", secondary: "Not now", go: () => setOpenModal("meeting") }
    : { title: "Notes are ready", body: "Acme Logistics - onboarding call", primary: "Open", secondary: "Later", go: () => navigate("/transcriptions/rec-1") };
  const close = () => { window.sessionStorage.removeItem("ttt_demo_notice"); setKind(null); };
  const act = () => { close(); notice.go(); };
  if (os === "win") {
    return (
      <div className="fixed bottom-[16px] right-[16px] z-[80] w-[364px] overflow-hidden rounded-[8px] border border-black/10 bg-[#F3F3F3] text-foreground" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
        <div className="flex items-start gap-[12px] p-[16px]">
          <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground"><Icon icon={Mic01Icon} className="size-[20px]" strokeWidth={1.8} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold leading-[20px]">{notice.title}</span>
            <span className="block text-[13px] leading-[18px] text-foreground/70">{notice.body}</span>
            <span className="mt-[2px] block text-[11px] text-foreground/50">TranscribeToText</span>
          </span>
          <button type="button" aria-label="Dismiss" onClick={close} className="text-foreground/50 hover:text-foreground"><Icon icon={Cancel01Icon} className="size-[14px]" strokeWidth={2} /></button>
        </div>
        <div className="grid grid-cols-2 gap-[8px] px-[16px] pb-[16px]">
          <button type="button" onClick={act} className="h-[32px] rounded-[4px] bg-primary text-[13px] font-medium text-primary-foreground">{notice.primary}</button>
          <button type="button" onClick={close} className="h-[32px] rounded-[4px] border border-black/10 bg-white text-[13px] font-medium">{notice.secondary}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed right-[16px] top-[16px] z-[80] flex w-[356px] items-center gap-[12px] rounded-[18px] border border-white/60 bg-white/85 p-[12px] pr-[10px] text-foreground backdrop-blur-[20px]" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.16)" }}>
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground"><Icon icon={Mic01Icon} className="size-[20px]" strokeWidth={1.8} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-[17px]">{notice.title}</span>
        <span className="block truncate text-[12.5px] leading-[17px] text-foreground/70">{notice.body}</span>
      </span>
      <span className="flex shrink-0 flex-col gap-[4px]">
        <button type="button" onClick={act} className="h-[24px] rounded-[7px] bg-primary px-[10px] text-[12px] font-semibold text-primary-foreground">{notice.primary}</button>
        <button type="button" onClick={close} className="h-[24px] rounded-[7px] bg-black/[0.06] px-[10px] text-[12px] font-medium">{notice.secondary}</button>
      </span>
    </div>
  );
}
