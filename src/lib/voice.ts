/* The guide's voice. Every line the guide can say was generated once
   (tools/voice/gen.py, Microsoft Neural voice through edge-tts) and lives
   under public/voice/g as one MP3 per sentence; public/voice/guides.json maps
   the sentence to its file. speak() plays a line on one shared audio element;
   the orb reads the loudness from an AnalyserNode on that element every
   frame (voiceLevel). Sound is on by default and the switch is remembered. */

const KEY = "ttt_voice";
const INDEX_URL = "/voice/guides.json";

export const voiceLevel = { current: 0 };

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let data: Uint8Array | null = null;
let raf: number | null = null;
let index: Record<string, string> | null = null;
let indexLoad: Promise<Record<string, string>> | null = null;
let current = 0;
const listeners = new Set<(speaking: boolean) => void>();

export function voiceOn(): boolean {
  try { return window.localStorage.getItem(KEY) !== "off"; } catch { return true; }
}
export function setVoiceOn(on: boolean) {
  try { window.localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* ignore */ }
  if (!on) stopSpeaking();
  window.dispatchEvent(new CustomEvent("ttt-voice", { detail: on }));
}

/* the line as the generator spelled it: "Title. Body" */
export function lineKey(title: string | undefined, body: string | undefined): string {
  if (!body) return "";
  return `${title ? title.replace(/[.!?]$/, "") + ". " : ""}${body}`;
}

function loadIndex() {
  if (!indexLoad) indexLoad = fetch(INDEX_URL).then((r) => (r.ok ? r.json() : {})).then((j) => (index = j as Record<string, string>)).catch(() => (index = {}));
  return indexLoad;
}

function element() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("ended", () => tell(false));
  audio.addEventListener("pause", () => tell(false));
  audio.addEventListener("play", () => tell(true));
  return audio;
}

function tell(speaking: boolean) {
  for (const l of listeners) l(speaking);
  if (speaking) meter(); else { voiceLevel.current = 0; if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
}

/* loudness: the RMS of the waveform, scaled so a normal sentence sits around 0.6 */
function meter() {
  if (raf !== null) return;
  try {
    if (!ctx && audio) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const src = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser(); analyser.fftSize = 256;
      src.connect(analyser); analyser.connect(ctx.destination);
      data = new Uint8Array(analyser.fftSize);
    }
    if (ctx?.state === "suspended") void ctx.resume();
  } catch { return; }
  const tick = () => {
    if (!analyser || !data || !audio || audio.paused) { raf = null; voiceLevel.current = 0; return; }
    analyser.getByteTimeDomainData(data);
    let s = 0;
    for (let i = 0; i < data.length; i++) { const d = (data[i] - 128) / 128; s += d * d; }
    voiceLevel.current = Math.min(1, Math.sqrt(s / data.length) * 4);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

/* says the line if there is a file for it; a line without a file is silent.
   Returns false when nothing will be said. */
export async function speak(title: string | undefined, body: string | undefined): Promise<boolean> {
  if (!voiceOn()) return false;
  const key = lineKey(title, body);
  if (!key) return false;
  const id = ++current;
  const idx = index ?? (await loadIndex());
  const file = idx[key];
  if (!file || id !== current) return false;
  const el = element();
  el.src = `/voice/${file}`;
  try { await el.play(); } catch { return false; }
  return true;
}

export function stopSpeaking() {
  current++;
  if (audio && !audio.paused) audio.pause();
}

export function onSpeaking(l: (speaking: boolean) => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function isSpeaking() { return !!audio && !audio.paused && !audio.ended; }
