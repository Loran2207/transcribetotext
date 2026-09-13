/* Stills of every recipe in a jobs JSON ({name:{route,steps,w,h,seed}}), three at a time:
 *   node shoot.mjs <jobs.json> <outdir> [filter-regex] */
import { spawn } from "node:child_process"; import { readFileSync, mkdirSync } from "node:fs";
const [jobsPath, out, filter] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const jobs = Object.entries(JSON.parse(readFileSync(jobsPath, "utf8"))).filter(([n]) => !filter || new RegExp(filter).test(n));
let i = 0; const results = [];
const run = ([name, j]) => new Promise((res) => {
  const file = out + "/" + name.replace(/[^\w]+/g, "_") + ".png";
  const c = spawn("node", [new URL("./cap.mjs", import.meta.url).pathname, j.route, "x", "x", name, j.w || 1512, j.h || 982], { env: { ...process.env, STEPS: j.steps || "", SEED: j.seed || "", SHOT: file }, stdio: ["ignore", "pipe", "pipe"] });
  let log = ""; c.stdout.on("data", (d) => (log += d)); c.stderr.on("data", (d) => (log += d));
  c.on("exit", (code) => { const f = (log.match(/FAULTS .*/) || [""])[0]; console.log((code ? "FAIL " : f ? "WARN " : "ok   ") + name + (code ? "\n" + log.slice(-400) : "") + (f ? "\n   " + f : "")); results.push([name, code]); res(); });
});
const next = async () => { while (i < jobs.length) await run(jobs[i++]); };
await Promise.all(Array.from({ length: 3 }, next));
console.log("failed:", results.filter(([, c]) => c).map(([n]) => n));
