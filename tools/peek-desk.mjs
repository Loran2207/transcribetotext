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
const go = async (path) => { await p.evaluate((to) => { history.pushState({}, "", to); dispatchEvent(new PopStateEvent("popstate")); }, path); await p.waitForTimeout(1200); };
await login("http://localhost:5173/login?shell=desktop&os=mac&desk=paused"); await go("/desk"); await p.screenshot({ path: `${out}/k1-desk-mac-paused.png`, clip: { x: 1000, y: 0, width: 440, height: 220 } });
await p.evaluate(() => sessionStorage.clear());
await login("http://localhost:5173/login?shell=desktop&os=mac&notice=call"); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/k2-app-call.png`, clip: { x: 1000, y: 0, width: 440, height: 120 } }); await p.evaluate(() => sessionStorage.clear());
await p.locator("p:has-text('Record a call') >> visible=true").first().click(); await p.waitForTimeout(2500); await p.click("button[role=tab]:has-text('Transcript')"); await p.waitForTimeout(400); await p.click("button:has-text('Pause')"); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/k3-live-paused.png`, clip: { x: 256, y: 700, width: 1184, height: 200 } });
await b.close(); console.log("peek-done");
