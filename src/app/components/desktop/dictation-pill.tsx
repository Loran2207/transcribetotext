import { useEffect, useRef, useState } from "react";
import { Mic01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { useTranscriptionModals } from "../transcription-modals";
import { useShell } from "./shell";
import { useFabHidden } from "../fab-visibility";

/* Dictation the way Wispr Flow does it: a small pill in the corner of the app,
   one key to start, and the words land in whatever field has the cursor. It is
   the app's own, so it is only drawn in the desktop shell, and it steps aside
   while a call is being recorded because the recording pill owns that corner. */

type SR = { start: () => void; stop: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: any) => void) | null; onend: (() => void) | null };

export function DictationPill() {
  const { desktop } = useShell();
  const { recordingPhase } = useTranscriptionModals();
  const fabHidden = useFabHidden();
  const [on, setOn] = useState(false);
  const [level, setLevel] = useState(0);
  const target = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const rec = useRef<SR | null>(null);

  const stop = () => { rec.current?.stop(); rec.current = null; setOn(false); };

  const start = () => {
    const el = document.activeElement;
    target.current = el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement ? el : null;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setOn(true);
    if (!Ctor) return;
    const r: SR = new Ctor();
    r.continuous = true; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e: any) => {
      const t = Array.from(e.results as ArrayLike<any>).slice(e.resultIndex).map((res: any) => res[0].transcript).join(" ").trim();
      const field = target.current;
      if (!t || !field) return;
      const before = field.value;
      const next = (before ? before.replace(/\s*$/, " ") : "") + t;
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value")?.set;
      setter?.call(field, next);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    };
    r.onend = () => setOn(false);
    rec.current = r;
    r.start();
  };

  useEffect(() => {
    if (!on) { setLevel(0); return; }
    const id = window.setInterval(() => setLevel(0.3 + Math.random() * 0.7), 120);
    return () => window.clearInterval(id);
  }, [on]);

  useEffect(() => {
    if (!desktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") { e.preventDefault(); on ? stop() : start(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, on]);

  if (!desktop || recordingPhase === "recording" || recordingPhase === "paused") return null;

  return (
    <div className="fixed bottom-[22px] z-[60] max-md:hidden" style={{ right: fabHidden ? 22 : 96 }} data-dictation>
      {on ? (
        <div className="flex h-[40px] items-center gap-[10px] rounded-full border border-border bg-popover pl-[12px] pr-[6px] shadow-md">
          <span className="relative flex size-[8px]">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/70" />
            <span className="relative inline-flex size-[8px] rounded-full bg-destructive" />
          </span>
          <span className="flex h-[16px] items-center gap-[2px]">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="w-[2px] rounded-full bg-primary transition-[height] duration-150" style={{ height: `${4 + level * (6 + ((i * 7) % 9))}px` }} />
            ))}
          </span>
          <span className="text-[13px] font-medium text-foreground">Listening</span>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={stop} aria-label="Stop dictating" className="flex size-[28px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <Icon icon={Cancel01Icon} className="size-[14px]" strokeWidth={1.8} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={start}
          title="Dictate into the field with the cursor"
          className="flex h-[40px] items-center gap-[8px] rounded-full border border-border bg-popover pl-[12px] pr-[8px] text-[13px] font-medium text-foreground shadow-md transition-colors hover:bg-muted"
        >
          <Icon icon={Mic01Icon} className="size-[16px] text-primary" strokeWidth={1.8} />
          Dictate
          <kbd className="flex h-[20px] items-center rounded-[4px] border border-black/[0.08] bg-background px-[6px] text-[11px] font-medium leading-none text-muted-foreground">⌥ Space</kbd>
        </button>
      )}
    </div>
  );
}
