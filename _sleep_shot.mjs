import { chromium } from '@playwright/test';
// argv: mode id seedsCSV homeFlag outPath
// mode: screen | onb | full | onbfull | showcase
const [,, mode, id, seedsCSV, homeFlag, outPath] = process.argv;
const BASE = 'http://localhost:5173/';
const seeds = (seedsCSV && seedsCSV !== '-') ? seedsCSV.split(',') : [];
const isHome = homeFlag === 'home';
const W = 402, H = 874, DSF = 2;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
const errs = []; p.on('pageerror', e => errs.push(e.message));
const url = mode === 'showcase' ? BASE + '?showcase=mood' : BASE;
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(400);

await p.evaluate(({ mode, id, seeds, isHome }) => {
  if (mode === 'showcase') return;
  if (mode === 'onb' || mode === 'onbfull') { globalThis.__onb.setIdx(parseInt(id, 10)); return; }
  const store = globalThis.__store, nav = globalThis.__nav;
  store.completeOnboarding();
  store.setMiniPlayerHidden(!isHome);
  for (const s of seeds) { const [fn, arg] = s.split(':'); store[fn](arg); }
  nav.goHome(); nav.go(id);
}, { mode, id, seeds, isHome });

await p.waitForTimeout(1300);
await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});

// freeze decorative/infinite animations to a clean settled frame
await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;}' });

// render native time/text inputs as clean centered text (headless Chromium clips
// type=time inputs because the hidden picker indicator still reserves width)
await p.evaluate(() => {
  document.querySelectorAll('input, textarea').forEach((inp) => {
    const cs = getComputedStyle(inp);
    const op = parseFloat(cs.opacity || '1');
    const am = (cs.color || '').match(/rgba?\([^)]*?,\s*([\d.]+)\)/);
    const colorAlpha = am ? parseFloat(am[1]) : 1;
    if (op < 0.1 || cs.color === 'transparent' || colorAlpha < 0.1) return;
    const span = document.createElement('div');
    span.textContent = inp.value || inp.getAttribute('placeholder') || '';
    span.className = inp.className;
    ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','color','lineHeight','fontVariantNumeric'].forEach((k) => { span.style[k] = cs[k]; });
    span.style.boxSizing = 'border-box';
    span.style.width = '100%';
    span.style.height = cs.height;
    span.style.display = 'flex';
    span.style.alignItems = 'center';
    span.style.justifyContent = (cs.textAlign === 'center') ? 'center' : (cs.textAlign === 'right' ? 'flex-end' : 'flex-start');
    span.style.whiteSpace = 'pre';
    span.style.overflow = 'hidden';
    if (inp.parentNode) inp.parentNode.replaceChild(span, inp);
  });
});

let outH = H;
if (mode === 'full' || mode === 'onbfull') {
  outH = await p.evaluate(() => {
    let best = null, bestOver = 0;
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY)) {
        const over = el.scrollHeight - el.clientHeight;
        if (over > bestOver) { bestOver = over; best = el; }
      }
    });
    if (!best || bestOver < 24) return 874;
    const full = best.scrollHeight;
    best.style.height = full + 'px'; best.style.maxHeight = 'none';
    best.style.overflow = 'visible'; best.style.flex = '0 0 auto';
    let el = best.parentElement;
    while (el) {
      const s = getComputedStyle(el);
      if (s.position === 'fixed' || s.position === 'absolute') el.style.position = 'static';
      el.style.height = 'auto'; el.style.minHeight = '0'; el.style.maxHeight = 'none'; el.style.overflow = 'visible';
      el = el.parentElement;
    }
    document.documentElement.style.height = 'auto'; document.body.style.height = 'auto';
    return Math.max(874, Math.ceil(document.body.scrollHeight));
  });
  await p.setViewportSize({ width: W, height: Math.min(outH, 8000) });
  await p.waitForTimeout(450);
}

await p.screenshot({ path: outPath, fullPage: mode === 'showcase' });
// report measured overflow for device-mode screens (to decide scroll variants)
const over = await p.evaluate(() => {
  let m = 0;
  document.querySelectorAll('*').forEach((el) => {
    const s = getComputedStyle(el);
    if (/(auto|scroll)/.test(s.overflowY)) { const o = el.scrollHeight - el.clientHeight; if (o > m) m = o; }
  });
  return m;
});
console.log(JSON.stringify({ id, mode, outH, overflow: over, err: errs[0] || null }));
await b.close();
