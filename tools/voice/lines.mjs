/* Every line the guide can say, from guides.ts, and the welcome recording's
   lines, from src/lib/welcome-script.ts, as JSON for tools/voice/gen.py (and
   for the developer, who makes the welcome audio with their own voices).
   Run: node tools/voice/lines.mjs > tools/voice/lines.json */
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const dir = mkdtempSync(join(tmpdir(), "ttt-lines-"));
const out = join(dir, "guides.mjs");
await build({ entryPoints: ["src/app/components/onboarding/guides.ts"], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "silent" });
const g = await import(pathToFileURL(out).href);
const out2 = join(dir, "welcome.mjs");
await build({ entryPoints: ["src/lib/welcome-script.ts"], bundle: true, format: "esm", platform: "node", outfile: out2, logLevel: "silent" });
const w = await import(pathToFileURL(out2).href);
const lines = new Set();
const say = (title, body) => { if (body) lines.add(`${title ? title.replace(/[.!?]$/, "") + ". " : ""}${body}`); };
const step = (s) => { say(s.title, s.body); if (s.phoneBody) say(s.phoneTitle ?? s.title, s.phoneBody); if (s.compactBody) say(s.title, s.compactBody); if (s.connected) { say(s.connected.title ?? s.title, s.connected.body); if (s.connected.phoneBody) say(s.connected.title ?? s.title, s.connected.phoneBody); } };
step(g.INTRO_STEP);
for (const guide of [...g.GUIDES, ...g.STEP_TOURS]) for (const s of guide.steps) step(s);
if (g.REWARD) say(g.REWARD.title, g.REWARD.body);
/* the transcript shows "lunch" where the voice says "launch": the edit lesson fixes it */
const spoken = (l) => (l.id === w.WELCOME_SLIP_LINE ? l.text.replace("lunch", "launch") : l.text);
process.stdout.write(JSON.stringify({
  guides: [...lines],
  welcome: w.WELCOME_LINES.map((l) => ({ id: l.id, speaker: l.speaker.name, text: spoken(l) })),
}, null, 1));
