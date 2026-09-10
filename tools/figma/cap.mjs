/* Figma's own capture of one desktop route, into an existing section.
 *
 *   node cap.mjs <route> <captureId> <endpoint> "<frame name>" [w] [h]
 *
 * PORT names the dev server (default 4400). SEED, when set, is a JSON object
 * written into localStorage under "ttt-desktop" before the page loads, which
 * is how a guarded screen - the notes list, settings - is reached without a
 * click: the store is the state now, not the address. STEPS walks the page to
 * a state before the capture (clicks, waits, typing, hovering), in order.
 *
 * The page is frozen the same way the stills are (animations paused mid
 * cycle, no caret), named after the frame it becomes, and handed to Figma's
 * html-to-design capture script running inside the page, which serialises the
 * DOM with its fonts and pictures and posts it to the capture endpoint. */
import { chromium } from "playwright";
import { HOIST } from "./hoist.mjs";

const CAP = "https://mcp.figma.com/mcp/html-to-design/capture.js";
const [route, cid, endpoint, name, w = "1512", h = "982"] = process.argv.slice(2);
const PORT = process.env.PORT || "5173";
/* The full Chromium, not the headless shell: the shell has no media at all. And
   the microphone is stood in for with a quiet tone, because a scripted browser
   on macOS hangs asking for the real one - everything after getUserMedia runs
   for real. */
const b = await chromium.launch({ channel: "chromium", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
await p.addInitScript(() => {
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext(); const o = ac.createOscillator(); o.frequency.value = 180;
    const g = ac.createGain(); g.gain.value = 0.25; const d = ac.createMediaStreamDestination();
    o.connect(g).connect(d); o.start(); return d.stream;
  };
});
if (process.env.SEED) await p.addInitScript((seed) => localStorage.setItem("ttt-desktop", seed), process.env.SEED);
/* the demo session lives in React state, so every capture signs in first and
   then walks client-side; the shell and os flags ride on the login address */
const [path, query = ""] = route.split("?");
await p.goto("http://localhost:" + PORT + "/login" + (query ? "?" + query : ""), { waitUntil: "networkidle" });
await p.fill("input[type=email]", "admin@test.com"); await p.fill("input[type=password]", "admin123");
await p.click("button[type=submit]"); await p.waitForTimeout(1500);
if (path && path !== "home") { await p.evaluate((to) => { history.pushState({}, "", to); dispatchEvent(new PopStateEvent("popstate")); }, "/" + path); await p.waitForTimeout(1200); }
/* STEPS walks to a state: "click=<sel>;wait=<ms>;fill=<sel>|<text>;hover=<sel>;key=<key>", in order */
for (const step of (process.env.STEPS || "").split(";").filter(Boolean)) {
  const i = step.indexOf("="); const op = step.slice(0, i), arg = step.slice(i + 1);
  if (op === "click") await p.click(arg);
  else if (op === "wait") await p.waitForTimeout(+arg);
  else if (op === "fill") { const [sel, text] = arg.split("|"); await p.fill(sel, text); }
  else if (op === "hover") await p.hover(arg);
  /* focus=<sel>: a tooltip opened by focus stays open after the pointer leaves */
  else if (op === "focus") await p.focus(arg);
  /* the pointer is moved away before the capture, so a hover state is HELD
     instead: the browser is told the element is :hover until the frame is cut */
  else if (op === "force") {
    const cdp = await p.context().newCDPSession(p);
    await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: arg });
    for (const nodeId of nodeIds) await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
  }
  else if (op === "key") await p.keyboard.press(arg);
  /* drag=<sel>|<dy>: press on the element and move the pointer dy pixels
     (negative is up), and keep the button down so the dragging state is cut */
  else if (op === "drag") {
    const [sel, dy] = arg.split("|"); const bb = await (await p.$(sel)).boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2 + +dy, { steps: 6 });
  }
  else if (op === "scroll") await p.$eval(arg, (el) => { el.scrollTop = el.scrollHeight; });
  /* nav=<path>: walk to another route inside the app, the router way */
  else if (op === "nav") { await p.evaluate((to) => { history.pushState({}, "", to); dispatchEvent(new PopStateEvent("popstate")); }, arg); await p.waitForTimeout(900); }
  /* scrollx=<sel>|<px>: slide a horizontal carousel to a given offset */
  else if (op === "scrollx") { const [sel, px] = arg.split("|"); await p.$eval(sel, (el, x) => { el.scrollLeft = x; }, +px); }
  await p.waitForTimeout(350);
}
await p.addStyleTag({ content: "*{animation-play-state:paused!important;animation-delay:-0.45s!important;transition:none!important;caret-color:transparent!important} .ttt-dim{animation:none!important;opacity:1!important;backdrop-filter:blur(5px)!important} [data-sonner-toaster]{display:none!important} .ttt-modal,[data-slot=drawer-content],[aria-label='New transcription'],.ttt-feature-in{box-shadow:none!important} .ttt-feature-in{animation:none!important}" });
if (!(process.env.STEPS || "").includes("drag=")) await p.mouse.move(2, 2);
await p.evaluate(async () => { await Promise.all([400,500,600,700,800].map((wt) => document.fonts.load(wt + " 16px Inter"))); await document.fonts.ready; });
await p.waitForTimeout(700);
const shell = await p.evaluate(() => ({ mounted: !!document.getElementById("root")?.children.length, overlay: document.querySelectorAll("vite-error-overlay").length }));
if (!shell.mounted || shell.overlay) { console.log("bad page - refusing", JSON.stringify(shell)); await b.close(); process.exit(1); }
await p.evaluate((t) => { document.title = t; }, name);
/* Figma stacks siblings by z-index and only siblings, so an overlay that
   hangs off a row keeps that row's place in the document and the content
   printed after it paints over it. Re-seat the overlays first; nothing moves
   on screen, and the document finally says what the screen shows. */
console.log("hoisted", JSON.stringify(await p.evaluate(HOIST)));
const src = await p.evaluate(async (u) => (await fetch(u)).text(), CAP);
await p.evaluate(src);
const posted = p.waitForResponse((r) => r.url().includes("/submit") && r.request().method() === "POST", { timeout: 240000 }).catch(() => null);
await p.evaluate(([c, ep]) => { window.figma.captureForDesign({ captureId: c, endpoint: ep, selector: "body" }); }, [cid, endpoint]);
const res = await posted;
console.log("submitted", res ? res.status() : "no POST seen in 240s");
await b.close();
process.exit(0);
