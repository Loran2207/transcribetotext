import { useState } from "react";
import { useNavigate } from "react-router";
import { Mic01Icon, AiMagicIcon } from "@hugeicons/core-free-icons";
import { ToastCard } from "../app-toast";
import { SourceIcon } from "../source-icons";
import { readDemo, useShell } from "./shell";
import { useTranscriptionModals } from "../transcription-modals";

export type NoticeKind = "call" | "ready";

/* The two things the app says from outside its window, in the portal's own
   toast shape. "A call started" comes from the OS seeing Zoom, Meet or Teams
   take the microphone; "Notes are ready" comes after Generate notes while the
   app is behind other windows or closed. */
export function NoticeCard({ kind, onAct, onClose }: { kind: NoticeKind; onAct: () => void; onClose: () => void }) {
  /* the calling app's own logo is the mark: the reader knows which window rang
     before reading a word */
  const n = kind === "call"
    ? { mark: <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] border border-border bg-white"><SourceIcon source="zoom" /></span>, glyph: Mic01Icon, title: "Zoom call detected", meta: "Record it here, no bot", act: "Record", later: "Not now" }
    : { mark: undefined, glyph: AiMagicIcon, title: "Notes are ready", meta: "Acme onboarding call", act: "Open", later: "Later" };
  return (
    <div className="rounded-[14px]" style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.14), 0 2px 6px rgba(15,23,42,0.06)" }}>
      <ToastCard mark={n.mark} glyph={n.glyph} title={n.title} meta={n.meta} action={{ label: n.act, onClick: onAct }} secondary={{ label: n.later, onClick: onClose }} />
    </div>
  );
}

/* Inside the app window: top right on macOS, bottom right on Windows, the
   corner the system uses. Dev server: `?notice=call|ready`. */
export function DesktopNotice() {
  const { desktop, os } = useShell();
  const navigate = useNavigate();
  const { setOpenModal } = useTranscriptionModals();
  const [kind, setKind] = useState(() => readDemo("notice") as NoticeKind | null);
  if (!desktop || (kind !== "call" && kind !== "ready")) return null;
  const close = () => { window.sessionStorage.removeItem("ttt_demo_notice"); setKind(null); };
  const act = () => { close(); if (kind === "call") setOpenModal("meeting"); else navigate("/transcriptions/rec-1"); };
  return (
    <div className={`fixed z-[80] ${os === "win" ? "bottom-[20px] right-[20px]" : "right-[20px] top-[20px]"}`}>
      <NoticeCard kind={kind} onAct={act} onClose={close} />
    </div>
  );
}
