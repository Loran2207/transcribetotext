/* Live marking during a recording: Mark on the bar, H, pending mark on a sentence being said,
   selection pill in the live text, carry-over into the finished note, the summary section and
   the share line. node tools/.probe-live.mjs [web|phone|tablet]  (PORT=5177) */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const PORT = process.env.PORT || "5177";
const OUT = "/Users/kirill/.claude/jobs/09c3c405/tmp/live/"; mkdirSync(OUT, { recursive: true });
const which = process.argv[2] || "web";
const SIZES = { web: { w: 1440, h: 900, m: false }, tablet: { w: 820, h: 1180, m: true }, phone: { w: 390, h: 844, m: true } };
const S = SIZES[which];
const b = await chromium.launch({ channel: "chrome", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const ctx = await b.newContext({ viewport: { width: S.w, height: S.h }, deviceScaleFactor: 1, ...(S.m ? { hasTouch: true, isMobile: true } : {}) });
const p = await ctx.newPage();
const faults = [];
p.on("console", (m) => { if (m.type() === "error") faults.push("console: " + m.text().slice(0, 200)); });
p.on("pageerror", (e) => faults.push("pageerror: " + String(e).slice(0, 200)));
await p.addInitScript(() => {
  try { localStorage.setItem("ttt_demo_live_text", "1"); localStorage.setItem("ttt_plan", "pro"); } catch {}
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext(); const o = ac.createOscillator(); o.frequency.value = 180;
    const g = ac.createGain(); g.gain.value = 0.25; const d = ac.createMediaStreamDestination();
    o.connect(g).connect(d); o.start(); return d.stream;
  };
});
const steps = [];
const ok = async (label, fn) => { let v = false; try { v = await fn(); } catch { v = false; } steps.push((v ? "  ok  " : "  MISS ") + label); if (!v) steps.fail = true; };
const vis = async (sel) => (await p.locator(sel).filter({ visible: true }).count().catch(() => 0)) > 0;
const shot = (name) => p.screenshot({ path: `${OUT}${which}-${name}.png` });
const pick = async (name) => { await p.locator(`[role=menuitem]:has-text('${name}'), [role=dialog] button:has-text('${name}'), [data-slot=drawer-content] button:has-text('${name}')`).first().click(); };
const waitFor = async (sel, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await vis(sel)) return true; await p.waitForTimeout(400); } return false; };

await p.goto(`http://localhost:${PORT}/login?shell=web&installed=0`, { waitUntil: "networkidle" });
await p.fill("input[type=email]", "admin@test.com"); await p.fill("input[type=password]", "admin123");
await p.click("button[type=submit]"); await p.waitForTimeout(1500);
/* start Instant speech from Home */
if (S.w < 500) { const plus = p.locator("button[aria-label*='New'], button[aria-label*='Add'], button[aria-label*='Create']").filter({ visible: true }).first(); if (await plus.count()) { await plus.click(); await p.waitForTimeout(500); } }
await p.click("text=Instant speech >> visible=true").catch(() => {}); await p.waitForTimeout(700);
await p.click("button:has-text('Start recording') >> visible=true"); await p.waitForTimeout(600);
const expand = p.locator("button[title='Open live details']").filter({ visible: true }).first();
if (await expand.count()) { await expand.click(); }
await p.waitForTimeout(6500);
await ok("live note with Pause", () => vis("button:has-text('Pause')"));
await ok("Mark button on the bar", () => vis("[data-highlight-button='player']"));
await ok("segments arrived", () => vis("text=/launch date/"));
await shot("01-live-with-mark");
/* Mark the last sentence with Key point */
await p.locator("[data-highlight-button='player'] button").first().click(); await p.waitForTimeout(500);
await shot("02-mark-menu");
await pick("Key point"); await p.waitForTimeout(500);
await ok("toast with Undo after Mark", () => vis("text=/Key point at/"));
await ok("a highlight is in the live text", async () => (await p.locator("[data-hl]").count()) > 0);
await shot("03-marked-key-point");
/* H while a sentence is being said: Decision pends on the interim */
await p.waitForTimeout(1200);
if (S.m) { await p.locator("[data-highlight-button='player'] button").first().click(); } else { await p.keyboard.press("h"); }
await p.waitForTimeout(400);
await ok("the labels open on the bar", () => vis("[role=menu], [data-slot=drawer-content]"));
await pick("Decision"); await p.waitForTimeout(250);
await ok("pending Decision chip under the speaker", () => vis("span:has-text('Decision')"));
await shot("04-pending-decision");
await p.waitForTimeout(4500);
await ok("Decision lands when the sentence is written", () => vis("text=/Decision at/"));
await shot("05-decision-landed");
await ok("the page takes clicks after the labels closed (Pause)", async () => { await p.click("button:has-text('Pause') >> visible=true", { timeout: 4000 }); await p.waitForTimeout(400); const r = await vis("button:has-text('Resume')"); if (r) { await p.click("button:has-text('Resume') >> visible=true"); await p.waitForTimeout(300); } if (!r) { const dump = await p.evaluate(() => Array.from(document.querySelectorAll('[data-vaul-overlay], [data-slot=drawer-content], [role=menu]')).map((el) => el.tagName + ' ' + (el.getAttribute('data-state') || '') + ' ' + (el.getAttribute('data-slot') || el.getAttribute('role') || '') + ' ' + el.className.slice(0, 60))); steps.push('  dump ' + JSON.stringify(dump)); await shot('05b-stuck-overlay'); } return r; });
/* select words in a finished live sentence: the pill */
if (!S.m) {
  const seg = p.locator("text=/customers early/").first();
  const box = await seg.boundingBox();
  if (box) { await p.mouse.move(box.x + 10, box.y + box.height / 2); await p.mouse.down(); await p.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(600); }
  await ok("selection pill over live words", () => vis("[data-highlight-button='bar']"));
  await shot("06-live-selection-pill");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
}
/* stop: the note is written, the marks come along */
await p.click("button:has-text('Stop') >> visible=true"); await p.waitForTimeout(1500);
await ok("finished note", () => vis("text=/Transcript|Summary/"));
await ok("highlights carried over once the transcript is ready", () => waitFor("[data-hl]", 25000));
await shot("07-after-stop-transcript");
const sumTab = p.locator("[role=tab]:has-text('Summary')").filter({ visible: true }).first();
if (await sumTab.count()) { await sumTab.click(); await p.waitForTimeout(700); }
await ok("empty summary says the highlights go in first", () => vis("[data-summary-highlights-note]"));
await shot("08-summary-empty-with-note");
const apply = p.locator("button:has-text('Apply template')").filter({ visible: true }).first();
if (await apply.count()) { await apply.click(); await p.waitForTimeout(600); await p.waitForTimeout(500); const item = p.locator("text=Meeting Notes").filter({ visible: true }).last(); if (await item.count()) await item.click(); await p.waitForTimeout(4500); }
await ok("summary opens with From your highlights", () => vis("[data-summary-highlights]"));
await shot("09-summary-from-highlights");
const share = p.locator("button:has-text('Share'):not(:has-text('Shared')), button[aria-label='Share']").filter({ visible: true }).first();
if (await share.count()) {
  await share.click(); await p.waitForTimeout(700);
  const linkTab = p.locator("[role=dialog] [role=tab], [data-slot=drawer-content] [role=tab]").filter({ hasText: /link/i }).first(); if (await linkTab.count()) { await linkTab.click(); await p.waitForTimeout(400); }
  await ok("share says the notes go with it", () => vis("text=Highlights and comments go with it."));
  await shot("10-share-line"); await p.keyboard.press("Escape");
}
console.log(`${steps.fail ? "FAIL" : "PASS"} live-${which}\n${steps.join("\n")}${faults.length ? "\n  faults: " + JSON.stringify(faults.slice(0, 8)) : ""}`);
await b.close();
