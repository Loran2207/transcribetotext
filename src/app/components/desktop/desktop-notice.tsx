import { useState } from "react";
import { useNavigate } from "react-router";
import { Mic01Icon, AiMagicIcon, Video01Icon, ArrowDown01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { ToastCard } from "../app-toast";
import { SourceIcon } from "../source-icons";
import { Icon } from "../ui/icon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { readDemo, useShell } from "./shell";
import { useTranscriptionModals } from "../transcription-modals";

export type NoticeKind = "call" | "ready" | "upcoming";

/* The one meeting the demo knows about, read from the calendar in the real
   app. Every surface that mentions it (the notice, the Up next card, the
   pre-join panel) reads the same record, so they can never disagree. */
export const UPCOMING = { title: "Daily sync", time: "11:00 - 11:30", startsIn: "12 min", source: "zoom" as const, people: ["Maria Garcia", "Alex Chen", "You"] };

const NOTICE_SHADOW = "0 12px 32px rgba(15,23,42,0.14), 0 2px 6px rgba(15,23,42,0.06)";

/* What the app says from outside its window, in the portal's own toast shape.
   "A call started" comes from the OS seeing Zoom take the microphone; "Notes
   are ready" comes after Generate notes while the app is behind other windows;
   "Up next" comes from the calendar a few minutes before a call with a link.

   Hovering any notice reveals a close cross on its corner, the way the system
   does; at rest the card carries only its one action. */
export function NoticeCard({ kind, onAct, onClose, onJoinOnly, onOpenApp, menuOpen }: { kind: NoticeKind; onAct: () => void; onClose: () => void; onJoinOnly?: () => void; onOpenApp?: () => void; menuOpen?: boolean }) {
  const [open, setOpen] = useState(!!menuOpen);
  const zoomMark = <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] border border-border bg-white"><SourceIcon source="zoom" /></span>;
  return (
    <div data-notice className="group relative rounded-[14px]" style={{ boxShadow: NOTICE_SHADOW }}>
      <button type="button" aria-label="Dismiss" onClick={onClose} className="absolute -left-[8px] -top-[8px] z-[1] flex size-[22px] items-center justify-center rounded-full border border-border bg-popover text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 data-[show=true]:opacity-100" data-show={open || undefined}>
        <Icon icon={Cancel01Icon} className="size-[11px]" strokeWidth={2.2} />
      </button>
      {kind === "upcoming" ? (
        <div className="flex w-[356px] max-w-[calc(100vw-24px)] items-center gap-[12px] rounded-[14px] border border-border bg-popover py-[10px] pl-[14px] pr-[10px]">
          {zoomMark}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold leading-[18px] -tracking-[0.1px] text-foreground">{UPCOMING.title}</p>
            <p className="mt-[2px] truncate text-[12px] leading-[16px] text-muted-foreground">{UPCOMING.time} · in {UPCOMING.startsIn}</p>
          </div>
          {/* one pill, two halves: the call itself, and everything else behind the chevron */}
          <div className="flex h-[36px] shrink-0 items-stretch overflow-hidden rounded-full border border-border bg-background">
            <button type="button" onClick={onAct} className="flex items-center gap-[7px] pl-[11px] pr-[10px] text-left transition-colors hover:bg-muted">
              <Icon icon={Video01Icon} className="size-[15px] text-primary" strokeWidth={2} />
              <span className="leading-[13px]"><span className="block text-[12.5px] font-semibold text-foreground">Join</span><span className="block text-[10.5px] text-muted-foreground">and record</span></span>
            </button>
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="More ways to join" className="flex w-[26px] items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted">
                  <Icon icon={ArrowDown01Icon} className="size-[13px]" strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="min-w-[200px]">
                <DropdownMenuItem onClick={onJoinOnly}>Join without recording</DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenApp}>Open the app</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClose}>Don't remind for this call</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : kind === "call" ? (
        <ToastCard mark={zoomMark} glyph={Mic01Icon} title="Zoom call detected" meta="Record it here, no bot" action={{ label: "Record", onClick: onAct }} secondary={{ label: "Not now", onClick: onClose }} />
      ) : (
        <ToastCard glyph={AiMagicIcon} title="Notes are ready" meta="Acme onboarding call" action={{ label: "Open", onClick: onAct }} secondary={{ label: "Later", onClick: onClose }} />
      )}
    </div>
  );
}

/* Inside the app window: top right on macOS, bottom right on Windows, the
   corner the system uses. Dev server: `?notice=call|ready|upcoming|upcoming-menu`. */
export function DesktopNotice() {
  const { desktop, os } = useShell();
  const navigate = useNavigate();
  const { setOpenModal } = useTranscriptionModals();
  const [demo, setDemo] = useState(() => readDemo("notice"));
  const kind = (demo === "upcoming-menu" ? "upcoming" : demo) as NoticeKind | null;
  if (!desktop || (kind !== "call" && kind !== "ready" && kind !== "upcoming")) return null;
  const close = () => { window.sessionStorage.removeItem("ttt_demo_notice"); setDemo(null); };
  const act = () => { close(); if (kind === "ready") navigate("/transcriptions/rec-1"); else setOpenModal("meeting"); };
  return (
    <div className={`fixed z-[80] ${os === "win" ? "bottom-[20px] right-[20px]" : "right-[20px] top-[20px]"}`}>
      <NoticeCard kind={kind} onAct={act} onClose={close} onJoinOnly={close} onOpenApp={close} menuOpen={demo === "upcoming-menu"} />
    </div>
  );
}
