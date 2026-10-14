/* Sound for the welcome recording. The dialogue was generated once
   (tools/voice/gen.py): one MP3 per line under public/voice/welcome and
   welcome.json with each line's start, length and word timings, so the
   transcript's timestamps are the audio's. This plays the lines one after
   another on one audio element and reports the time on the whole dialogue,
   the way one long file would. */

export type WelcomeWord = [word: string, at: number, length: number];
export type WelcomeLine = { i: number; file: string; start: number; duration: number; words: WelcomeWord[] };
export type WelcomeVoice = { total: number; lines: WelcomeLine[] };

const URL = "/voice/welcome.json";
let loaded: Promise<WelcomeVoice | null> | null = null;

export function loadWelcomeVoice(): Promise<WelcomeVoice | null> {
  if (!loaded) loaded = fetch(URL).then((r) => (r.ok ? (r.json() as Promise<WelcomeVoice>) : null)).catch(() => null);
  return loaded;
}

export type WelcomePlayer = {
  play: (from?: number) => void;
  pause: () => void;
  seek: (seconds: number) => void;
  playing: () => boolean;
  dispose: () => void;
};

export function createWelcomePlayer(voice: WelcomeVoice, on: { time: (seconds: number) => void; state: (playing: boolean) => void; ended: () => void }): WelcomePlayer {
  const audio = new Audio();
  audio.preload = "auto";
  let line = 0;
  let gap: number | null = null;
  let wanted = false;
  let at = 0;

  const lineAt = (t: number) => {
    const i = voice.lines.findIndex((l) => t < l.start + l.duration);
    return i < 0 ? voice.lines.length - 1 : i;
  };
  const clearGap = () => { if (gap !== null) { window.clearTimeout(gap); gap = null; } };
  const load = (i: number, offset: number) => {
    line = i;
    const l = voice.lines[i];
    audio.src = `/voice/${l.file}`;
    audio.currentTime = Math.max(0, offset);
  };
  const start = () => { void audio.play().catch(() => { wanted = false; on.state(false); }); };

  audio.addEventListener("timeupdate", () => { at = voice.lines[line].start + audio.currentTime; on.time(at); });
  audio.addEventListener("play", () => on.state(true));
  audio.addEventListener("pause", () => { if (gap === null) on.state(false); });
  audio.addEventListener("ended", () => {
    const next = line + 1;
    if (next >= voice.lines.length) { wanted = false; at = voice.total; on.time(at); on.state(false); on.ended(); return; }
    /* the silence between two lines: the clock keeps walking, the next line starts when the gap ends */
    const l = voice.lines[line]; const n = voice.lines[next];
    at = l.start + l.duration; on.time(at);
    gap = window.setTimeout(() => { gap = null; if (!wanted) { on.state(false); return; } load(next, 0); start(); }, Math.max(0, (n.start - at) * 1000));
  });

  return {
    play(from) {
      wanted = true;
      clearGap();
      if (typeof from === "number") { const i = lineAt(from); load(i, from - voice.lines[i].start); }
      else if (!audio.src) load(0, 0);
      start();
    },
    pause() { wanted = false; clearGap(); audio.pause(); on.state(false); },
    seek(seconds) {
      const was = wanted;
      clearGap();
      const i = lineAt(Math.max(0, Math.min(voice.total, seconds)));
      const l = voice.lines[i];
      const offset = Math.max(0, Math.min(l.duration, seconds - l.start));
      at = l.start + offset; on.time(at);
      if (i !== line || !audio.src) load(i, offset); else audio.currentTime = offset;
      if (was) start();
    },
    playing: () => wanted,
    dispose() { wanted = false; clearGap(); audio.pause(); audio.removeAttribute("src"); audio.load(); },
  };
}
