import { useEffect, useState } from "react";

/* Everything the Notetaker does on its own, in one record the settings page
   edits and the recording bar reads. Kept on this machine: these are habits of
   the computer, not of the account. */
export type NotetakerSettings = {
  notifyBefore: "off" | "15s" | "1m" | "5m";
  detectCalls: boolean;
  stopOnCallEnd: boolean;
  language: string;
  speakers: boolean;
  speakerCount: number | "auto";
  maxLength: "1h" | "2h" | "4h";
  hideFromScreenShare: boolean;
  openNoteOnStart: boolean;
  splitOnJoin: boolean;
  liveTranscript: boolean;
  autoShare: boolean;
};

export const DEFAULT_NOTETAKER_SETTINGS: NotetakerSettings = {
  notifyBefore: "1m", detectCalls: true, stopOnCallEnd: true,
  language: "auto", speakers: true, speakerCount: "auto", maxLength: "2h", hideFromScreenShare: true,
  openNoteOnStart: true, splitOnJoin: false, liveTranscript: true, autoShare: false,
};

const KEY = "ttt_notetaker_settings";
const EVENT = "ttt-notetaker-settings";

function read(): NotetakerSettings {
  try { const raw = window.localStorage.getItem(KEY); return raw ? { ...DEFAULT_NOTETAKER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_NOTETAKER_SETTINGS; } catch { return DEFAULT_NOTETAKER_SETTINGS; }
}

export function useNotetakerSettings() {
  const [settings, setSettings] = useState<NotetakerSettings>(read);
  useEffect(() => {
    const sync = () => setSettings(read());
    window.addEventListener(EVENT, sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const update = (patch: Partial<NotetakerSettings>) => {
    const next = { ...read(), ...patch };
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
    window.dispatchEvent(new Event(EVENT));
  };
  return { settings, update };
}
