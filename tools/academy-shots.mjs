/* A picture for every step the Academy panel lists: each lesson is walked on the
   real screens (1440x900, a connected calendar), the lit part is cut out with a
   little of the dim around it, the guide's card hidden. Output:
   public/academy/steps/<lesson>-<n>.webp (n = the step's place in the panel list)
   and src/app/components/onboarding/step-shots.ts (which pictures exist).
   Run with the dev server up: PORT=5180 node tools/academy-shots.mjs */
import { chromium } from "playwright";
import { build } from "esbuild";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const PORT = process.env.PORT || "5180";
const ONLY = (process.env.ONLY || "").split(",").filter(Boolean);
const dir = mkdtempSync(join(tmpdir(), "ttt-shots-"));
await build({ entryPoints: ["src/app/components/onboarding/guides.ts"], bundle: true, format: "esm", platform: "node", outfile: join(dir, "g.mjs"), logLevel: "silent" });
const { GUIDES, NO_ANCHOR } = await import(pathToFileURL(join(dir, "g.mjs")).href);
const OUT = "public/academy/steps";
mkdirSync(OUT, { recursive: true });
const raw = join(dir, "raw"); mkdirSync(raw);

/* PHONE=1: the same walk at 390x844; pictures named <lesson>-<n>-m.webp, cut 3:4 around the light */
const PHONE = process.env.PHONE === "1";
const W = PHONE ? 390 : 1440, H = PHONE ? 844 : 900, ASPECT = PHONE ? 0.75 : 1.6, PAD = PHONE ? 16 : 44, MIN_W = PHONE ? 390 : 560;
const SUFFIX = PHONE ? "-m" : "";
const b = await chromium.launch({ channel: "chrome" });
/* every lesson in its own fresh page: a finished lesson may leave a toast, a dialog or an open window behind */
const open = async () => {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { localStorage.setItem("ttt_demo_quicklogin", "0"); localStorage.setItem("ttt_demo_onboarding", "half"); localStorage.setItem("ttt_demo_fresh", "0"); localStorage.setItem("ttt_voice", "off"); });
  await p.goto(`http://localhost:${PORT}/login`, { waitUntil: "networkidle" });
  await p.fill("input[type=email]", "admin@test.com"); await p.fill("input[type=password]", "admin123");
  await p.click("button[type=submit]", { force: true }); await p.waitForTimeout(1500);
  await p.addStyleTag({ content: "*{caret-color:transparent!important} [data-sonner-toaster]{display:none!important}" });
  return { ctx, p };
};

const crop = (r) => {
  let x = r.left - PAD, y = r.top - PAD, w = r.width + PAD * 2, h = r.height + PAD * 2;
  if (w < MIN_W) { x -= (MIN_W - w) / 2; w = MIN_W; }
  if (w / h > ASPECT) { const nh = w / ASPECT; y -= (nh - h) / 2; h = nh; } else { const nw = h * ASPECT; x -= (nw - w) / 2; w = nw; }
  if (w > W) { const k = W / w; w = W; h = Math.min(H, h * k); }
  if (h > H) { h = H; w = Math.min(W, h * ASPECT); }
  x = Math.max(0, Math.min(W - w, x)); y = Math.max(0, Math.min(H - h, y));
  return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) };
};

const made = {};
for (const g of GUIDES) {
  if (ONLY.length && !ONLY.includes(g.id)) continue;
  const { ctx, p } = await open();
  if (PHONE) { await p.click("[data-tour=menu]"); await p.waitForTimeout(700); }
  await p.click("[data-tour=nav-academy]"); await p.waitForTimeout(1000);
  await p.click(`[data-academy-start="${g.id}"]`); await p.waitForTimeout(1600);
  let n = 0;
  for (let i = 0; i < g.steps.length; i++) {
    const s = g.steps[i];
    const listed = s.anchor !== NO_ANCHOR && !s.nav;
    if (listed) {
      await p.waitForTimeout(500);
      const r0 = await p.evaluate(() => {
        let st = document.getElementById("shot-hide"); if (!st) { st = document.createElement("style"); st.id = "shot-hide"; document.head.appendChild(st); } st.textContent = "[data-tour-card]{display:none!important}";
        const l = document.querySelector("[data-onboarding-tour] [style*='box-shadow']"); if (!l) return null;
        const b = l.getBoundingClientRect(); return { left: b.left, top: b.top, width: b.width, height: b.height };
      });
      await p.waitForTimeout(120);
      const r = r0;
      if (r && r.width > 0) {
        const f = join(raw, `${g.id}-${n}${SUFFIX}.png`);
        await p.screenshot({ path: f, clip: crop(r) });
        (made[g.id] ||= []).push(n);
      }
      await p.evaluate(() => { const st = document.getElementById("shot-hide"); if (st) st.textContent = ""; });
      n++;
    }
    if (i === g.steps.length - 1) break;
    const next = await p.$("[data-tour-next]");
    if (!next) break;
    await next.click(); await p.waitForTimeout(1300);
  }
  await ctx.close();
  console.log(g.id, (made[g.id] || []).length, "of", n);
}
await b.close();
/* webp at 720px wide: sharp enough for a 360px column on a 2x screen */
execFileSync("python", ["-I", "-c", `
import glob,os,sys
from PIL import Image
src,dst=sys.argv[1],sys.argv[2]
for f in glob.glob(os.path.join(src,'*.png')):
    im=Image.open(f).convert('RGB'); w=720 if im.width>=im.height else 540; h=round(im.height*w/im.width)
    im.resize((w,h),Image.LANCZOS).save(os.path.join(dst,os.path.basename(f)[:-4]+'.webp'),'WEBP',quality=80,method=6)
`, raw, OUT], { stdio: "inherit" });
const ts = `/* Generated by tools/academy-shots.mjs: the Academy panel pictures that exist,
   lesson id to the places in its step list. Do not edit by hand. */
export const STEP_SHOTS: Record<string, number[]> = ${JSON.stringify(made, null, 2)};
`;
const merged = ONLY.length || PHONE ? null : ts;
if (merged) writeFileSync("src/app/components/onboarding/step-shots.ts", merged);
else console.log("ONLY run: step-shots.ts not rewritten", JSON.stringify(made));
