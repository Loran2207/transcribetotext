/* Every line the guide can say, from guides.ts, as JSON for tools/voice/gen.py.
   Run: node tools/voice/lines.mjs > tools/voice/lines.json */
import { build } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const dir = mkdtempSync(join(tmpdir(), "ttt-lines-"));
const out = join(dir, "guides.mjs");
await build({ entryPoints: ["src/app/components/onboarding/guides.ts"], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "silent" });
const g = await import(pathToFileURL(out).href);
const out2 = join(dir, "mock.mjs");
await build({ entryPoints: ["src/lib/mock-transcripts.ts"], bundle: true, format: "esm", platform: "node", outfile: out2, logLevel: "silent" });
const m = await import(pathToFileURL(out2).href);
const lines = new Set();
const say = (title, body) => { if (body) lines.add(`${title ? title.replace(/[.!?]$/, "") + ". " : ""}${body}`); };
const step = (s) => { say(s.title, s.body); if (s.phoneBody) say(s.phoneTitle ?? s.title, s.phoneBody); if (s.compactBody) say(s.title, s.compactBody); if (s.connected) { say(s.connected.title ?? s.title, s.connected.body); if (s.connected.phoneBody) say(s.connected.title ?? s.title, s.connected.phoneBody); } };
step(g.INTRO_STEP);
for (const guide of [...g.GUIDES, ...g.STEP_TOURS]) for (const s of guide.steps) step(s);
if (g.REWARD) say(g.REWARD.title, g.REWARD.body);
process.stdout.write(JSON.stringify({ guides: [...lines], /* the transcript shows "lunch" where the voice says "launch": the edit lesson fixes it */
  welcome: m.MOCK_TRANSCRIPTS.welcome.map((x) => ({ speaker: x.speaker, text: x.text.replace("The lunch is", "The launch is") })) }, null, 1));
