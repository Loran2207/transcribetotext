/* Runs cap.mjs for every job in a JSON file, five at a time.
   A job: { cid, route, name, w, h, steps }. node tools/figma/recap.mjs jobs.json */
import { readFileSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const here = dirname(fileURLToPath(import.meta.url));
const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
let i = 0;
const runOne = (j) => new Promise((res) => {
  const env = { ...process.env, PORT: process.env.PORT || "5173", STEPS: j.steps || "" };
  const ep = `https://mcp.figma.com/mcp/capture/${j.cid}/submit?bindVariables=false`;
  const c = spawn("node", [join(here, "cap.mjs"), j.route, j.cid, ep, j.name, String(j.w || 1440), String(j.h || 900)], { env });
  let out = "";
  c.stdout.on("data", (d) => (out += d)); c.stderr.on("data", (d) => (out += d));
  c.on("close", () => { console.log(j.name, "|", j.w || 1440, "|", out.trim().split("\n").pop()); res(); });
});
const next = async () => { while (i < jobs.length) { const j = jobs[i++]; await runOne(j); } };
await Promise.all(Array.from({ length: 5 }, next));
console.log("RECAP_DONE");
