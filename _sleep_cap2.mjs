import { chromium } from '@playwright/test';
// argv: captureId mode id seedsCSV homeFlag
// mode: screen | onb | full | onbfull | showcase
const [,, captureId, mode, id, seedsCSV, homeFlag, clickText] = process.argv;
const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
const BASE = 'http://localhost:5173/';
const seeds = (seedsCSV && seedsCSV !== '-') ? seedsCSV.split(',') : [];
const isHome = homeFlag === 'home';
const W = 402, H = 874;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = []; p.on('pageerror', e => errs.push(e.message));

const url = mode === 'showcase' ? BASE + '?showcase=' + (id && id !== '-' ? id : 'mood') : BASE;
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(400);

await p.evaluate(({ mode, id, seeds, isHome }) => {
  if (mode === 'showcase') return;
  if (mode === 'onb' || mode === 'onbfull') { globalThis.__onb.setIdx(parseInt(id, 10)); return; }
  const store = globalThis.__store, nav = globalThis.__nav;
  store.completeOnboarding();
  store.setMiniPlayerHidden(!isHome); // mini player only on home
  for (const s of seeds) { const [fn, arg] = s.split(':'); store[fn](arg); }
  nav.goHome(); nav.go(id);
}, { mode, id, seeds, isHome });

await p.waitForTimeout(1300);
// optional: click an element by exact text (e.g. switch to a tab) then re-settle
if (clickText && clickText !== '-') {
  await p.evaluate((txt) => {
    const els = [...document.querySelectorAll('div,button,span,a')].filter((e) => e.textContent.trim() === txt && e.children.length <= 1);
    if (els[0]) els[0].click();
  }, clickText);
  await p.waitForTimeout(900);
}
await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});

// 1) freeze animations to settled layout
await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;animation-duration:0s!important;animation-delay:0s!important;}' });

// 2) render visible input values as real text (engine can't read input values);
//    skip transparent overlay inputs (a sibling label already shows the value)
await p.evaluate(() => {
  document.querySelectorAll('input, textarea').forEach((inp) => {
    const cs = getComputedStyle(inp);
    const op = parseFloat(cs.opacity || '1');
    const am = (cs.color || '').match(/rgba?\([^)]*?,\s*([\d.]+)\)/);
    const colorAlpha = am ? parseFloat(am[1]) : 1;
    if (op < 0.1 || cs.color === 'transparent' || colorAlpha < 0.1) return;
    const span = document.createElement('div');
    span.textContent = (inp.type === 'password' && inp.value) ? '•'.repeat(inp.value.length) : (inp.value || inp.getAttribute('placeholder') || '');
    span.className = inp.className;
    ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','color','lineHeight','fontVariantNumeric','textAlign','paddingTop','paddingRight','paddingBottom','paddingLeft'].forEach((k) => { span.style[k] = cs[k]; });
    span.style.boxSizing = 'border-box';
    span.style.display = 'flex'; span.style.alignItems = 'center';
    span.style.justifyContent = (cs.textAlign === 'center') ? 'center' : (cs.textAlign === 'right' ? 'flex-end' : 'flex-start');
    span.style.whiteSpace = 'pre'; span.style.overflow = 'hidden';
    // Preserve absolute/fixed inputs' box so the value renders where the input sat
    // (otherwise it collapses to the top of the container, over a floating label).
    if (cs.position === 'absolute' || cs.position === 'fixed') {
      span.style.position = cs.position;
      ['left','right','top','bottom','transform'].forEach((k) => { span.style[k] = cs[k]; });
      span.style.width = (cs.left !== 'auto' && cs.right !== 'auto') ? 'auto' : cs.width;
      span.style.height = (cs.top !== 'auto' && cs.bottom !== 'auto') ? 'auto' : cs.height;
    } else {
      span.style.width = '100%'; span.style.height = cs.height;
    }
    if (inp.parentNode) inp.parentNode.replaceChild(span, inp);
  });
});

// 3) the html-to-design engine mis-measures `white-space: pre-line` text with a
//    manual \n (renders the next element overlapping). Convert \n to <br> and set
//    white-space:normal so each line is measured explicitly.
await p.evaluate(() => {
  document.querySelectorAll('*').forEach((el) => {
    if (el.children.length !== 0) return;
    const ws = getComputedStyle(el).whiteSpace;
    if ((ws === 'pre-line' || ws === 'pre-wrap' || ws === 'pre') && el.textContent && el.textContent.includes('\n')) {
      const parts = el.textContent.split('\n').map((s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;'));
      el.innerHTML = parts.join('<br>');
      el.style.whiteSpace = 'normal';
    }
  });
});

// 4) bake soft-wraps for mixed-font inline text (two-tone headlines) — the engine
//    fails to wrap the styled run, causing horizontal overflow/clipping.
await p.evaluate(() => {
  function bake(block) {
    const tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue && n.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const nodes = []; let x; while ((x = tw.nextNode())) nodes.push(x);
    const range = document.createRange();
    let prevTop = null;
    for (const tn of nodes) {
      const s = tn.nodeValue; const breaks = []; let lastTop = null;
      for (let i = 0; i < s.length; i++) {
        range.setStart(tn, i); range.setEnd(tn, i + 1);
        const r = range.getClientRects()[0]; if (!r) continue;
        const top = Math.round(r.top);
        if (lastTop === null) { if (prevTop !== null && top > prevTop + 3) tn.parentNode.insertBefore(document.createElement('br'), tn); }
        else if (top > lastTop + 3) breaks.push(i);
        lastTop = top; prevTop = top;
      }
      for (let k = breaks.length - 1; k >= 0; k--) { const after = tn.splitText(breaks[k]); after.parentNode.insertBefore(document.createElement('br'), after); }
    }
  }
  document.querySelectorAll('h1,h2,h3,h4,p,div,span').forEach((el) => {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) return;
    const cs = getComputedStyle(el); const base = cs.fontFamily;
    if (![...el.children].some((c) => getComputedStyle(c).fontFamily !== base)) return;
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    if (el.getBoundingClientRect().height > lh * 1.4) bake(el);
  });
});

let captureH = H;
if (mode === 'full' || mode === 'onbfull') {
  captureH = await p.evaluate(() => {
    let best = null, bestOver = 0;
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY)) { const o = el.scrollHeight - el.clientHeight; if (o > bestOver) { bestOver = o; best = el; } }
    });
    if (!best || bestOver < 24) return 874;
    const full = best.scrollHeight;
    best.style.height = full + 'px'; best.style.maxHeight = 'none'; best.style.overflow = 'visible'; best.style.flex = '0 0 auto';
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
  await p.setViewportSize({ width: W, height: Math.min(captureH, 8000) });
  await p.waitForTimeout(500);
} else if (mode === 'showcase') {
  captureH = await p.evaluate(() => Math.ceil(document.body.scrollHeight));
  await p.setViewportSize({ width: W, height: Math.min(captureH, 8000) });
  await p.waitForTimeout(400);
}

const js = await (await p.context().request.get('https://mcp.figma.com/mcp/html-to-design/capture.js')).text();
await p.evaluate((s) => { const el = document.createElement('script'); el.textContent = s; document.head.appendChild(el); }, js);
await p.waitForTimeout(700);
try {
  await p.evaluate(({ id, ep }) => window.figma.captureForDesign({ captureId: id, endpoint: ep, selector: 'body' }), { id: captureId, ep: endpoint });
} catch (e) { console.log('threw:', e.message); }
await p.waitForTimeout(4000);
console.log('submitted', mode, id, 'captureH=' + captureH, 'errs:', errs[0] || 'none');
await Promise.race([b.close(), new Promise((r) => setTimeout(r, 3000))]);
process.exit(0);
