/* End-to-end click-through of the prototype's main flows, as a developer would walk them.
 *   node tools/qa-flows.mjs            (dev server on 5173, system Chrome)
 * Each step asserts something visible, and every console error, page error or
 * failed request is collected. Prints PASS/FAIL per flow and a summary. */
import { chromium } from "playwright";

const PORT = process.env.PORT || "5173";
const results = [];
const b = await chromium.launch({ channel: "chrome", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });

async function session(query, width = 1440, height = 900) {
  const ctx = await b.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();
  const faults = [];
  p.on("console", (m) => { if (m.type() === "error") faults.push("console: " + m.text().slice(0, 200)); });
  p.on("pageerror", (e) => faults.push("pageerror: " + String(e).slice(0, 200)));
  p.on("requestfailed", (r) => { if (!/favicon|hot-update/.test(r.url())) faults.push("request: " + r.url().slice(0, 120)); });
  await p.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ac = new AudioContext(); const o = ac.createOscillator(); o.frequency.value = 180;
      const g = ac.createGain(); g.gain.value = 0.25; const d = ac.createMediaStreamDestination();
      o.connect(g).connect(d); o.start(); return d.stream;
    };
  });
  await p.goto(`http://localhost:${PORT}/login${query ? "?" + query : ""}`, { waitUntil: "networkidle" });
  /* noauth=1 in the query keeps the session on the sign-in pages themselves */
  if (!/(^|&)noauth=1/.test(query)) {
    await p.fill("input[type=email]", "admin@test.com"); await p.fill("input[type=password]", "admin123");
    await p.click("button[type=submit]"); await p.waitForTimeout(1200);
  }
  const nav = async (to) => { await p.evaluate((t) => { history.pushState({}, "", t); dispatchEvent(new PopStateEvent("popstate")); }, to); await p.waitForTimeout(700); };
  return { p, ctx, faults, nav };
}

async function flow(name, query, fn, width, height) {
  const s = await session(query, width, height);
  const steps = [];
  const expect = async (label, ok) => { const v = typeof ok === "function" ? await ok() : ok; steps.push((v ? "  ok  " : "  MISS ") + label); if (!v) steps.fail = true; };
  try { await fn(s, expect); } catch (e) { steps.push("  THREW " + String(e).split("\n")[0].slice(0, 200)); steps.fail = true; }
  const verdict = steps.fail ? "FAIL" : "PASS";
  results.push({ name, verdict, steps, faults: s.faults });
  console.log(`${verdict} ${name}\n${steps.join("\n")}${s.faults.length ? "\n  faults: " + JSON.stringify(s.faults.slice(0, 6)) : ""}`);
  await s.ctx.close();
}

/* "visible" means any match on screen: wide layouts keep hidden phone copies of the same text */
const vis = async (p, sel) => (await p.locator(sel).filter({ visible: true }).count().catch(() => 0)) > 0;
const count = (p, sel) => p.locator(sel).count();

/* ---------- Web portal ---------- */
await flow("Web: home, four cards, panel card, hide card", "shell=web&installed=0&banner=panel", async ({ p }, expect) => {
  await expect("greeting", () => vis(p, "text=/Good (morning|afternoon|evening)/"));
  await expect("four home cards", async () => (await count(p, "text=Audio & Video Files")) >= 1 && (await vis(p, "text=Instant speech")) && (await vis(p, "text=Meeting Recorder")) && (await vis(p, "text=Transcribe from URL")));
  await expect("desktop card in the right panel", () => vis(p, "text=Record calls on your computer"));
  await p.click("button[aria-label='Hide this card'] >> visible=true"); await p.waitForTimeout(400);
  await expect("card gone after the cross", async () => !(await vis(p, "text=Record calls on your computer")));
  await expect("discount ticket still there", () => vis(p, "text=welcome50"));
});

await flow("Web: Record meeting dialog, bot or app, get the app", "shell=web&installed=0", async ({ p }, expect) => {
  await p.click("p:has-text('Meeting Recorder') >> visible=true"); await p.waitForTimeout(600);
  await expect("dialog opens", () => vis(p, "[role=dialog], .ttt-modal, [data-slot=drawer-content], [data-slot=dialog-content]"));
  await expect("choice: bot", () => vis(p, "[role=radio]:has-text('bot')"));
  await expect("choice: on your computer", () => vis(p, "[role=radio]:has-text('On your computer')"));
  await p.click("[role=radio]:has-text('On your computer')"); await p.waitForTimeout(300);
  await expect("get the app offered", () => vis(p, "text=/Get the app|Download for/"));
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await expect("dialog closes on Escape", async () => !(await vis(p, "[role=dialog], .ttt-modal, [data-slot=drawer-content], [data-slot=dialog-content]")));
});

await flow("Web: Instant speech records and lands on a note", "shell=web&installed=0", async ({ p }, expect) => {
  await p.click("p:has-text('Instant speech') >> visible=true"); await p.waitForTimeout(600);
  await expect("choose-how dialog", () => vis(p, "[role=dialog], .ttt-modal, [data-slot=drawer-content], [data-slot=dialog-content]"));
  await expect("start button", () => vis(p, "button:has-text('Start recording')"));
  await p.click("button:has-text('Start recording') >> visible=true"); await p.waitForTimeout(2500);
  await expect("live bar with Pause", () => vis(p, "button:has-text('Pause')"));
  await expect("Recording label", () => vis(p, "text=Recording"));
  await p.click("button:has-text('Pause')"); await p.waitForTimeout(400);
  await expect("Resume after pause", () => vis(p, "button:has-text('Resume')"));
  await p.click("button:has-text('Stop')"); await p.waitForTimeout(3000);
  await expect("note page after stop", () => vis(p, "text=/Transcript|Summary/"));
});

await flow("Web: a finished note: share, copy, export, tabs", "shell=web&installed=0", async ({ p, nav }, expect) => {
  /* open a finished note the way a person does: from the list */
  await p.click("text=My Records >> visible=true"); await p.waitForTimeout(600);
  /* a row opens on double click, as in the product; a single click selects it */
  await p.locator("text=Weekly product sync").filter({ visible: true }).first().dblclick(); await p.waitForTimeout(1200);
  await expect("note opened from the list", () => vis(p, "text=Weekly product sync"));
  /* exact names: "Shared with me" in the menu also has the word Share in it */
  await expect("note header actions", async () => (await vis(p, "button:has-text('Share'):not(:has-text('Shared'))")) && (await vis(p, "button:has-text('Copy')")) && (await vis(p, "button:has-text('Export')")));
  await p.click("button:has-text('Export')"); await p.waitForTimeout(300);
  await expect("export formats", async () => (await vis(p, "text=PDF")) && (await vis(p, "text=/DOCX/")) && (await vis(p, "text=/SRT/")));
  await p.keyboard.press("Escape");
  await p.click("button:has-text('Share'):not(:has-text('Shared')) >> visible=true"); await p.waitForTimeout(500);
  await expect("share dialog", () => vis(p, "[role=dialog], .ttt-modal, [data-slot=drawer-content], [data-slot=dialog-content]"));
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.click("button:has-text('Copy')"); await p.waitForTimeout(300);
  await expect("copy menu", () => vis(p, "[role=menuitem]"));
  await p.keyboard.press("Escape");
  await expect("tabs", async () => (await vis(p, "[role=tab]:has-text('Transcript')")) && (await vis(p, "[role=tab]:has-text('Summary')")));
});

await flow("Web: navigation pages open", "shell=web&installed=0", async ({ p, nav }, expect) => {
  /* the portal switches pages from the menu, not the address bar: the greeting must leave and come back */
  for (const item of ["My Records", "Meetings", "Templates", "Shared with me"]) {
    await p.click(`text=${item} >> visible=true`); await p.waitForTimeout(700);
    await expect(`menu: ${item} replaces Home`, async () => !(await vis(p, "text=/Good (morning|afternoon|evening)/")));
  }
  await p.click("text=Home >> visible=true"); await p.waitForTimeout(700);
  await expect("menu: Home again", () => vis(p, "text=/Good (morning|afternoon|evening)/"));
});

await flow("Web phone: home carousel, record dialog with the card", "shell=web&installed=0", async ({ p }, expect) => {
  await expect("phone greeting", () => vis(p, "text=/Good (morning|afternoon|evening)/"));
  await expect("desktop card in the phone carousel", () => vis(p, "text=Record calls on your computer"));
  /* on a phone the four cards live behind the plus button */
  await p.click("[aria-label='New transcription'] >> visible=true"); await p.waitForTimeout(500);
  await expect("plus menu with Meeting Recorder", () => vis(p, "text=Meeting Recorder"));
  await p.click("text=Meeting Recorder >> visible=true"); await p.waitForTimeout(700);
  await expect("info card instead of the choice", () => vis(p, "text=/Also on Mac and Windows/"));
}, 390, 844);

/* ---------- Desktop shell, macOS ---------- */
await flow("macOS: record a call in one click, live note, pause, generate, after", "shell=desktop&os=mac&installed=0", async ({ p }, expect) => {
  await p.click("p:has-text('Record a call') >> visible=true"); await p.waitForTimeout(700);
  await expect("choose how: on this Mac", () => vis(p, "[role=radio]:has-text('Record on this Mac')"));
  await p.click("[role=radio]:has-text('Record on this Mac')"); await p.waitForTimeout(300);
  await p.click("button:has-text('Start recording')"); await p.waitForTimeout(2500);
  await expect("live note with My thoughts", () => vis(p, "[role=tab]:has-text('My thoughts')"));
  await expect("Pause in the bar", () => vis(p, "button:has-text('Pause')"));
  await expect("meeting suggestion (Yes, this meeting)", () => vis(p, "button[aria-label='Yes, this meeting']"));
  await p.click("button[aria-label='Yes, this meeting']"); await p.waitForTimeout(400);
  await expect("meeting chip linked", () => vis(p, "text=/Nexora/"));
  await p.click("button:has-text('Add to folder')"); await p.waitForTimeout(300);
  await p.click("[role=menuitem] >> nth=0"); await p.waitForTimeout(300);
  await expect("folder chip set", async () => !(await vis(p, "button:has-text('Add to folder')")));
  await p.click("textarea >> nth=0"); await p.fill("textarea >> nth=0", "Ask who owns the export");
  await expect("disabled Export has a tooltip on focus", async () => { await p.focus("span:has(> button[aria-label='Export'])"); await p.waitForTimeout(500); return vis(p, "text=/Export is available/"); });
  await p.click("button:has-text('Pause')"); await p.waitForTimeout(400);
  await expect("Generate notes appears on hold", () => vis(p, "button:has-text('Generate notes')"));
  await p.click("button:has-text('Generate notes')"); await p.waitForTimeout(16000);
  await expect("summary written", () => vis(p, "text=/Decisions|Action items/"));
  await expect("player with Play and Resume recording", async () => (await vis(p, "button:has-text('Play')")) && (await vis(p, "text=Resume recording")));
  await expect("Export enabled after the call", async () => !(await p.locator("button[aria-label='Export']").first().isDisabled().catch(() => false)));
});

await flow("macOS: side by side from a live call, back to the full window, Notetaker settings via the profile menu", "shell=desktop&os=mac&installed=0", async ({ p, nav }, expect) => {
  await p.click("p:has-text('Record a call') >> visible=true"); await p.waitForTimeout(700);
  await p.click("[role=radio]:has-text('Record on this Mac')"); await p.waitForTimeout(300);
  await p.click("button:has-text('Start recording')"); await p.waitForTimeout(2500);
  await p.click("button[aria-label='Side by side with the call']"); await p.waitForTimeout(1200);
  await expect("side by side: the call on the left, the note on the right", async () => (await vis(p, "text=/Zoom Meeting|Maria Garcia/")) && (await vis(p, "button:has-text('Full window')")));
  await expect("side by side: the same header verbs", async () => (await vis(p, "button:has-text('Share'):not(:has-text('Shared'))")) && (await vis(p, "button:has-text('Copy')")) && (await vis(p, "button:has-text('Pause')")));
  await p.click("button:has-text('Full window')"); await p.waitForTimeout(1200);
  await expect("back in the full window, still recording", async () => (await vis(p, "[role=tab]:has-text('My thoughts')")) && (await vis(p, "button:has-text('Pause')")));
  await expect("no Notetaker page in the navigation", async () => !(await vis(p, "nav >> text=Notetaker")));
  await p.click("button:has-text('admin@test.com') >> visible=true"); await p.waitForTimeout(500);
  await p.click("button:has-text('Settings') >> visible=true"); await p.waitForTimeout(900);
  await p.click("main >> text=Notetaker >> visible=true"); await p.waitForTimeout(900);
  await expect("Notetaker settings", () => vis(p, "text=/Notetaker settings|Transcription language|Speakers/"));
  await expect("no shortcut card any more", async () => !(await vis(p, "text=/Shortcut/")));
  await nav("/"); await p.waitForTimeout(800);
  await expect("closed-app desk renders", async () => { await nav("/desk"); await p.waitForTimeout(900); return vis(p, "text=/Zoom|Recording|Notes/"); });
});

await flow("Web: banner variants (wide banner, navigation block) open the Mac / Windows menu", "shell=web&installed=0&banner=home", async ({ p }, expect) => {
  await expect("wide banner under the cards", () => vis(p, "text=Record calls on your computer"));
  await p.click("button:has-text('Get the app') >> visible=true"); await p.waitForTimeout(400);
  await expect("menu: Mac and Windows", async () => (await vis(p, "[role=menuitem]:has-text('Mac')")) && (await vis(p, "[role=menuitem]:has-text('Windows')")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  await p.click("button[aria-label='Hide this banner'], button[aria-label='Hide'] >> visible=true").catch(() => {});
});

await flow("Web: navigation block variant", "shell=web&installed=0&banner=sidebar", async ({ p }, expect) => {
  await expect("block in the navigation", () => vis(p, "text=Record on your desktop"));
  await expect("panel card not doubled", async () => !(await vis(p, "text=Record calls on your computer")));
  await p.click("button:has-text('Get the desktop app') >> visible=true"); await p.waitForTimeout(400);
  await expect("menu: Mac and Windows", async () => (await vis(p, "[role=menuitem]:has-text('Mac')")) && (await vis(p, "[role=menuitem]:has-text('Windows')")));
});

await flow("macOS: permissions missing show the warning and fold the bar", "shell=desktop&os=mac&installed=0&perm=1", async ({ p }, expect) => {
  await p.click("p:has-text('Record a call') >> visible=true"); await p.waitForTimeout(700);
  await p.click("[role=radio]:has-text('Record on this Mac')"); await p.waitForTimeout(300);
  await p.click("button:has-text('Start recording')"); await p.waitForTimeout(2500);
  await expect("nothing allowed in the meta line", () => vis(p, "text=/nothing allowed/"));
  await expect("warning chip (icon)", () => vis(p, "button[title*='allowed on']"));
  await p.click("button[title*='allowed on']"); await p.waitForTimeout(400);
  /* the microphone picker reads "Not allowed" here, so name the real button */
  await expect("popover with Allow", () => vis(p, "button:has-text('Allow both'), button:has-text('Allow system audio')"));
  await p.click("button:has-text('Allow both'), button:has-text('Allow system audio')"); await p.waitForTimeout(500);
  await expect("warning cleared after Allow", async () => !(await vis(p, "button[title*='allowed on']")));
});

/* ---------- Desktop shell, Windows ---------- */
await flow("macOS: Google sign-in hands over to the browser and comes back", "shell=desktop&os=mac&noauth=1", async ({ p, nav }, expect) => {
  await expect("sign in inside the window", async () => (await vis(p, "text=Welcome back")) && (await vis(p, "button:has-text('Continue with Google')")));
  await p.click("button:has-text('Continue with Google')"); await p.waitForTimeout(600);
  await expect("hand-over screen", async () => (await vis(p, "text=Continue in your browser")) && (await vis(p, "button:has-text('Open the browser again')")) && (await vis(p, "text=Waiting for the browser")));
  await expect("no form behind it", async () => !(await vis(p, "input[type=email]")));
  await p.click("button:has-text('Use email instead')"); await p.waitForTimeout(500);
  await expect("back to the email form", async () => (await vis(p, "input[type=email]")) && (await vis(p, "button:has-text('Continue with Google')")));
  await nav("/desktop/return");
  await expect("browser page: back to the app", async () => (await vis(p, "text=You're signed in")) && (await vis(p, "button:has-text('Open TranscribeToText')")) && (await vis(p, "text=Continue in the web app")));
});

await flow("Windows: record on this PC, live note, generate", "shell=desktop&os=win&installed=0", async ({ p }, expect) => {
  await p.click("p:has-text('Record a call') >> visible=true"); await p.waitForTimeout(700);
  await expect("choose how: on this PC", () => vis(p, "[role=radio]:has-text('Record on this PC')"));
  await p.click("[role=radio]:has-text('Record on this PC')"); await p.waitForTimeout(300);
  await p.click("button:has-text('Start recording')"); await p.waitForTimeout(2500);
  await expect("live note", () => vis(p, "button:has-text('Pause')"));
  await p.click("button:has-text('Pause')"); await p.waitForTimeout(400);
  await p.click("button:has-text('Generate notes')"); await p.waitForTimeout(16000);
  await expect("summary written", () => vis(p, "text=/Decisions|Action items/"));
});

await flow("Web: a long turn is one run, and one block can be moved to another voice", "", async ({ p, nav }, expect) => {
  await p.evaluate(() => localStorage.setItem("ttt_demo_unnamed_speakers", "1"));
  await nav("/transcriptions/2"); await p.waitForTimeout(900);
  await expect("continuation blocks hide the label until hover", () => p.$eval("[data-segment-id='61'] [data-speaker-trigger]", (el) => getComputedStyle(el).opacity === "0"));
  await p.click("[data-segment-id='4'] [data-speaker-trigger]"); await p.waitForTimeout(400);
  await expect("dropdown lists the other voices", () => vis(p, "[data-slot=popover-content] [data-speaker-row='s2']"));
  await p.hover("[data-slot=popover-content] [data-speaker-row='s2']"); await p.waitForTimeout(300);
  await expect("hover shows the scope beside the name", async () => (await vis(p, "button:has-text('Only this block')")) && (await vis(p, "button:has-text('All 4 blocks by Alex Johnson')")));
  await p.fill("input[placeholder='Search or type a name']", "Kirill"); await p.waitForTimeout(300);
  await expect("a new name offers the blue add row", () => vis(p, "[data-slot=popover-content] button:has-text('as a new speaker')"));
  await p.click("[data-slot=popover-content] button:has-text('as a new speaker')"); await p.waitForTimeout(300);
  await p.click("button:has-text('Only this block')"); await p.waitForTimeout(500);
  await expect("block 4 now says Kirill", () => vis(p, "[data-segment-id='4'] [data-speaker-trigger]:has-text('Kirill')"));
  await expect("the other Speaker 1 blocks are untouched", () => vis(p, "[data-segment-id='1'] [data-speaker-trigger]:has-text('Alex Johnson')"));
  await p.evaluate(() => localStorage.removeItem("ttt_demo_unnamed_speakers"));
});

await flow("Web: a run of words inside a block is handed to another voice", "", async ({ p, nav }, expect) => {
  await p.evaluate(() => localStorage.setItem("ttt_demo_unnamed_speakers", "1"));
  await nav("/transcriptions/2"); await p.waitForTimeout(900);
  await p.evaluate(() => {
    const el = document.querySelector("[data-segment-id='4'] p"); const text = "Absolutely, I'll set something up for Wednesday morning.";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node, start = null;
    while ((node = walker.nextNode())) { const i = node.textContent.indexOf(text); if (i >= 0) { start = [node, i, i + text.length]; break; } }
    const r = document.createRange(); r.setStart(start[0], start[1]); r.setEnd(start[0], start[2]);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await p.waitForTimeout(400);
  await expect("the selection pill offers Highlight and Speaker", async () => (await vis(p, "[data-selection-pill] button:has-text('Highlight')")) && (await vis(p, "[data-selection-speaker]")));
  await p.click("[data-selection-speaker]"); await p.waitForTimeout(400);
  await expect("the menu asks who said this part", () => vis(p, "[data-slot=popover-content] p:has-text('Who said this part?')"));
  await p.click("[data-slot=popover-content] [data-speaker-row='s2']"); await p.waitForTimeout(600);
  await expect("the sentence now sits under Maria", () => vis(p, "[data-segment-id='4002'] [data-speaker-trigger]:has-text('Maria Garcia')"));
  await expect("the rest of the block stays with Alex", () => vis(p, "[data-segment-id='4001'] [data-speaker-trigger]:has-text('Alex Johnson')"));
  await p.evaluate(() => localStorage.removeItem("ttt_demo_unnamed_speakers"));
});

await flow("Web: the header chip opens the speakers panel; rename, merge and add work from there", "", async ({ p, nav }, expect) => {
  await p.evaluate(() => localStorage.setItem("ttt_demo_unnamed_speakers", "1"));
  await nav("/transcriptions/2"); await p.waitForTimeout(900);
  await expect("the header shows a speakers chip with the count", () => vis(p, "[data-speakers-chip]:has-text('3 speakers')"));
  await p.click("[data-speakers-chip]"); await p.waitForTimeout(400);
  await expect("the panel lists every voice with its block count", async () => (await vis(p, "[data-speakers-panel] [data-speaker-manage-row='s3']:has-text('Speaker 3')")) && (await vis(p, "[data-speakers-panel] [data-speaker-manage-row='s3']:has-text('blocks')")));
  await p.click("[data-rename-speaker='s3']"); await p.fill("input[aria-label='Speaker name']", "Daniel Kim"); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
  await expect("the renamed voice shows on its blocks in the transcript", () => vis(p, "[data-speaker-trigger]:has-text('Daniel Kim')"));
  await p.click("[data-add-speaker]"); await p.fill("input[aria-label='New speaker name']", "Priya Patel"); await p.keyboard.press("Enter"); await p.waitForTimeout(400);
  await expect("a person added by hand appears in the list, not on any block yet", () => vis(p, "[data-speakers-panel] :text('Priya Patel')"));
  await p.click("[data-more-speaker='s2']"); await p.waitForTimeout(300);
  await p.click("[data-remove-speaker='s2']"); await p.waitForTimeout(400);
  await expect("removing asks who takes the blocks and the button waits", async () => (await vis(p, "[data-remove-step]:has-text('Remove Maria Garcia?')")) && (await p.$eval("[data-remove-confirm]", (b) => b.disabled)));
  await p.click("[data-remove-target='s3']"); await p.click("[data-remove-confirm]"); await p.waitForTimeout(600);
  await expect("after the removal Maria's blocks belong to Daniel and Maria is gone", async () => !(await vis(p, "[data-speaker-trigger]:has-text('Maria Garcia')")) && (await vis(p, "[data-speakers-chip]:has-text('2 speakers')")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.removeItem("ttt_demo_unnamed_speakers"));
});

await flow("Web: a block's speaker menu has a door to the whole list", "", async ({ p, nav }, expect) => {
  await p.evaluate(() => localStorage.setItem("ttt_demo_unnamed_speakers", "1"));
  await nav("/transcriptions/2"); await p.waitForTimeout(900);
  await p.click("[data-segment-id='4'] [data-speaker-trigger]"); await p.waitForTimeout(400);
  await expect("the block menu ends with Manage speakers", () => vis(p, "[data-slot=popover-content] [data-manage-speakers]"));
  await p.click("[data-slot=popover-content] [data-manage-speakers]"); await p.waitForTimeout(500);
  await expect("it opens the same speakers panel", () => vis(p, "[data-speakers-panel]"));
  await p.keyboard.press("Escape");
  await p.evaluate(() => localStorage.removeItem("ttt_demo_unnamed_speakers"));
});

await b.close();
const failed = results.filter((r) => r.verdict === "FAIL");
const faulty = results.filter((r) => r.faults.length);
console.log(`\nSUMMARY ${results.length} flows, ${failed.length} failed, ${faulty.length} with faults`);
process.exit(failed.length ? 1 : 0);
