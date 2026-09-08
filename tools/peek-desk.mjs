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
await login("http://localhost:5173/login?shell=desktop&os=mac&desk=widget"); await go("/desk"); await p.screenshot({ path: `${out}/k1-desk-mac-widget.png` });
await p.evaluate(() => sessionStorage.clear());
await login("http://localhost:5173/login?shell=desktop&os=win&desk=call"); await go("/desk"); await p.screenshot({ path: `${out}/k2-desk-win-call.png` });
await p.evaluate(() => sessionStorage.clear());
await login("http://localhost:5173/login?shell=desktop&os=mac&notice=ready"); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/k3-app-mac-ready.png` });
await b.close(); console.log("peek-done");
