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
await step("web-home", async () => { await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/w1-home.png` }); });
await step("web-meeting", async () => { await p.locator("p:has-text('Meeting Recorder') >> visible=true").first().click(); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/w2-meeting-bot.png` }); });
await step("web-desktop-method", async () => { await p.click("text=Record on your computer"); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/w3-meeting-app.png` }); await p.keyboard.press("Escape"); });
await step("web-installed", async () => { await login("http://localhost:5173/login?shell=web&installed=1"); await p.waitForTimeout(1000); await p.locator("p:has-text('Meeting Recorder') >> visible=true").first().click(); await p.waitForTimeout(400); await p.click("text=Record on your computer"); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/w4-meeting-installed.png` }); await p.keyboard.press("Escape"); await p.evaluate(() => localStorage.setItem("ttt_app_installed", "0")); });
await step("web-phone", async () => { await p.setViewportSize({ width: 390, height: 844 }); await login("http://localhost:5173/login?shell=web"); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/w5-phone.png` }); await p.setViewportSize({ width: 1440, height: 900 }); });
// DESKTOP (mac)
await login("http://localhost:5173/login?shell=desktop&os=mac"); await p.waitForTimeout(1200);
await step("desk-home", async () => { await p.screenshot({ path: `${out}/d1-home.png` }); });
await step("desk-record-modal", async () => { await p.locator("p:has-text('Meeting Recorder') >> visible=true").first().click(); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/d2-record-modal.png` }); });
await step("desk-start", async () => { await p.fill("input[placeholder='Untitled call']", "Acme Logistics - onboarding call"); await p.click("button:has-text('Start recording')"); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/d3-live-notes.png` }); });
await step("desk-slash", async () => { await p.click("textarea >> nth=0"); await p.keyboard.type("/"); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/d4-slash.png` }); await p.keyboard.press("Escape"); await p.keyboard.type("Ask who owns the export"); await p.keyboard.press("Enter"); await p.keyboard.type("# Questions"); await p.waitForTimeout(300); });
await step("desk-transcript", async () => { await p.click("button[role=tab]:has-text('Transcript')"); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/d5-live-transcript.png` }); });
await step("desk-generate", async () => { await p.click("button:has-text('Generate notes')"); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/d6-generating.png` }); await p.waitForTimeout(3200); await p.screenshot({ path: `${out}/d7-summary.png` }); });
await step("desk-notes-tab", async () => { await p.click("button[role=tab]:has-text('Notes')"); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/d8-notes-after.png` }); });
await step("desk-notetaker", async () => { await p.click("text=Notetaker"); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/d9-notetaker.png` }); });
// WINDOWS frame
await login("http://localhost:5173/login?shell=desktop&os=win"); await p.waitForTimeout(1200);
await step("win-home", async () => { await p.screenshot({ path: `${out}/x1-win-home.png` }); });
console.log(errors.length ? errors.slice(0, 8).join("\n") : "no console errors");
await b.close();
