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
/* a job that has not finished in five minutes is stuck, not slow */
setTimeout(() => { console.log("submitted watchdog-timeout"); process.exit(2); }, 300000).unref();
const b = await chromium.launch({ channel: "chrome", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
/* QA: every console error and uncaught exception is printed at the end, so a broken state is heard, not just seen */
const faults = [];
p.on("console", (m) => { if (m.type() === "error") faults.push("console: " + m.text().slice(0, 300)); });
p.on("pageerror", (e) => faults.push("pageerror: " + String(e).slice(0, 300)));
p.on("requestfailed", (r) => { if (!/favicon|hot-update|mcp\.figma/.test(r.url())) faults.push("request: " + r.url().slice(0, 160) + " " + (r.failure()?.errorText || "")); });
process.on("exit", () => { if (faults.length) console.log("FAULTS " + JSON.stringify(faults.slice(0, 20))); });
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
/* the sign-in pages themselves are captured signed out: NOAUTH=1 skips the login and walks straight to the route */
if (process.env.NOAUTH !== "1") {
  await p.fill("input[type=email]", "admin@test.com"); await p.fill("input[type=password]", "admin123");
  await p.click("button[type=submit]"); await p.waitForTimeout(1500);
}
if (path && path !== "home") { await p.evaluate((to) => { history.pushState({}, "", to); dispatchEvent(new PopStateEvent("popstate")); }, "/" + path + (query ? "?" + query : "")); await p.waitForTimeout(1200); }
/* STEPS walks to a state: "click=<sel>;wait=<ms>;fill=<sel>|<text>;hover=<sel>;key=<key>", in order */
for (const step of (process.env.STEPS || "").split(";").filter(Boolean)) {
  const i = step.indexOf("="); const op = step.slice(0, i), arg = step.slice(i + 1);
  if (op === "click") await p.click(arg);
  else if (op === "wait") await p.waitForTimeout(+arg);
  else if (op === "store") { const [k, v] = arg.split("|"); await p.evaluate(([k, v]) => { localStorage.setItem(k, v); dispatchEvent(new Event("ttt-banner-hidden")); }, [k, v]); await p.waitForTimeout(600); }
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
  /* scrollto=<sel>: bring one element to the middle of its scroller */
  else if (op === "scrollto") { await p.$eval(arg, (el) => el.scrollIntoView({ block: "center" })); await p.waitForTimeout(300); }
  /* select=<segId>|<text>: select that text inside a transcript block and let the page see it */
  else if (op === "select") {
    const [sid, text] = arg.split("|");
    await p.evaluate(([sid, text]) => {
      const el = document.querySelector(`[data-segment-id='${sid}'] p`); if (!el) return;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node, offset = 0, start = null, end = null;
      while ((node = walker.nextNode())) { const i = node.textContent.indexOf(text); if (i >= 0) { start = [node, i]; end = [node, i + text.length]; break; } offset += node.textContent.length; }
      if (!start) return;
      const r = document.createRange(); r.setStart(start[0], start[1]); r.setEnd(end[0], end[1]);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      /* the capture cannot see a native selection, and the converter re-wraps text with its
         own font metrics, so for the frame the paragraph is rebuilt as one block per browser
         line, with the selected words in an inline span: the wrapping then survives the trip */
      setTimeout(() => {
        const full = el.textContent; const s0 = full.indexOf(text); if (s0 < 0) return; const s1 = s0 + text.length;
        const nodes = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) nodes.push(n);
        const locate = (idx) => { let acc = 0; for (const nd of nodes) { const L = nd.textContent.length; if (idx < acc + L) return [nd, idx - acc]; acc += L; } const last = nodes[nodes.length - 1]; return [last, last.textContent.length]; };
        const words = []; const re = /\S+/g; let m;
        while ((m = re.exec(full))) {
          const rr = document.createRange(); const [na, oa] = locate(m.index); const [nb, ob] = locate(m.index + m[0].length);
          rr.setStart(na, oa); rr.setEnd(nb, ob);
          words.push({ w: m[0], a: m.index, b: m.index + m[0].length, top: Math.round(rr.getBoundingClientRect().top) });
        }
        const lines = []; for (const wd of words) { const L = lines[lines.length - 1]; if (L && L.top === wd.top) L.words.push(wd); else lines.push({ top: wd.top, words: [wd] }); }
        const esc = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
        el.innerHTML = lines.map((L) => {
          let html = "", open = false;
          L.words.forEach((wd, i) => {
            const on = wd.a >= s0 && wd.b <= s1;
            if (on && !open) { html += '<span style="background:rgba(37,99,235,0.2);border-radius:2px">'; open = true; }
            if (!on && open) { html += "</span>"; open = false; }
            html += esc(wd.w) + (i < L.words.length - 1 ? " " : "");
          });
          if (open) html += "</span>";
          return `<div>${html}</div>`;
        }).join("");
        /* the bar over the selection is fixed to the viewport; the converter places such
           layers apart from scrolled text, so for the frame it is anchored to the paragraph */
        const pill = document.querySelector("[data-selection-pill]");
        if (pill) {
          const pr = pill.getBoundingClientRect(), er = el.getBoundingClientRect();
          el.style.position = "relative";
          pill.style.position = "absolute"; pill.style.top = (pr.top - er.top) + "px"; pill.style.left = (pr.left - er.left) + "px";
          el.appendChild(pill);
        }
      }, 250);
    }, [sid, text]);
    await p.waitForTimeout(400);
  }
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
/* SHOT=<png path>: a still of the same frozen page instead of a Figma capture, for review */
if (process.env.SHOT) { await p.screenshot({ path: process.env.SHOT }); console.log("shot", process.env.SHOT); await Promise.race([b.close().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]); process.exit(0); }
console.log("hoisted", JSON.stringify(await p.evaluate(HOIST)));
const src = await p.evaluate(async (u) => (await fetch(u)).text(), CAP);
await p.evaluate(src);
const posted = p.waitForResponse((r) => r.url().includes("/submit") && r.request().method() === "POST", { timeout: 240000 }).catch(() => null);
await p.evaluate(([c, ep]) => { window.figma.captureForDesign({ captureId: c, endpoint: ep, selector: "body" }); }, [cid, endpoint]);
const res = await posted;
console.log("submitted", res ? res.status() : "no POST seen in 240s");
/* the system Chrome sometimes never answers close(): give it five seconds, then leave anyway */
await Promise.race([b.close().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]);
process.exit(0);
