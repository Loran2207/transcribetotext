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
  visibility: "private" | "link";
};

export const DEFAULT_NOTETAKER_SETTINGS: NotetakerSettings = {
  notifyBefore: "1m", detectCalls: true, stopOnCallEnd: true,
  language: "auto", speakers: true, speakerCount: "auto", maxLength: "2h", hideFromScreenShare: true,
  openNoteOnStart: true, splitOnJoin: false, liveTranscript: true, autoShare: false, visibility: "private",
};

/* What the app does as a program on this computer, apart from any call: when
   it starts, where it lives when the window is closed, how it updates. */
export type SystemSettings = {
  openAtLogin: boolean;
  keepRunning: boolean;
  autoUpdate: boolean;
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = { openAtLogin: true, keepRunning: true, autoUpdate: true };

function store<T extends object>(key: string, defaults: T) {
  const event = key.replace(/_/g, "-");
  const read = (): T => {
    try { const raw = window.localStorage.getItem(key); return raw ? { ...defaults, ...JSON.parse(raw) } : defaults; } catch { return defaults; }
  };
  return function useStore() {
    const [settings, setSettings] = useState<T>(read);
    useEffect(() => {
      const sync = () => setSettings(read());
      window.addEventListener(event, sync); window.addEventListener("storage", sync);
      return () => { window.removeEventListener(event, sync); window.removeEventListener("storage", sync); };
    }, []);
    const update = (patch: Partial<T>) => {
      const next = { ...read(), ...patch };
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* private mode */ }
      window.dispatchEvent(new Event(event));
    };
    return { settings, update };
  };
}

export const useNotetakerSettings = store<NotetakerSettings>("ttt_notetaker_settings", DEFAULT_NOTETAKER_SETTINGS);
export const useSystemSettings = store<SystemSettings>("ttt_system_settings", DEFAULT_SYSTEM_SETTINGS);
