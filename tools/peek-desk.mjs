/* A walk through both shells on the dev server, with screenshots. node tools/walk-shells.mjs */
import { chromium } from "playwright";
const out = "/Users/kirill/.claude/jobs/09c3c405/tmp/web";
import { mkdirSync } from "fs"; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: "chromium", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["microphone"] });
const p = await ctx.newPage(); p.setDefaultTimeout(8000);
const errors = [];
p.on("pageerror", (e) => errors.push("PAGEERR " + e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text().slice(0, 160)); });
const step = async (n, f) => { try { await f(); console.log("ok", n); } catch (e) { console.log("FAIL", n, e.message.split("\n")[0]); } };
async function login(url) {
  await p.goto(url); await p.waitForSelector("input[type=email]");
  await p.fill("input[type=email]", "admin@test.com"); await p.fill("input[type=password]", "admin123");
  await p.click("button[type=submit]"); await p.waitForTimeout(1500);
}
// WEB
await login("http://localhost:5173/login?shell=web");
await login("http://localhost:5173/login?shell=desktop&os=mac"); await p.waitForTimeout(500); await p.locator("p:has-text('Record a call') >> visible=true").first().click(); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/t3-live.png`, clip: { x: 256, y: 200, width: 1184, height: 700 } });
await p.click("button:has-text('Pause')"); await p.waitForTimeout(400); await p.click("button:has-text('Generate notes')"); await p.waitForTimeout(16000); await p.screenshot({ path: `${out}/t4-after.png`, clip: { x: 256, y: 660, width: 864, height: 240 } });
await b.close(); console.log("peek-done");
