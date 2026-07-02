import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
const BASE = 'http://localhost:5173/';
const OUT = 'C:/Users/kutsk/AppData/Local/Temp/shots';
mkdirSync(OUT, { recursive: true });
const W = 402, H = 874, DSF = 2;

const ONB = ['welcome','features','benefits','profileIntro','transition','section-about','age','gender','chronotype','goals','section-sleep','rating','latency','awaken','early','mind','screens','caffeine','consistency','ritual','daytime','calculating','score','analysis','section-targets','goal','wake','reminders','plan'];

// [name, mode, id, seeds, homeFlag]
const ITEMS = [
  ['home','screen','home','-','home'],
  ['track-mode','screen','track-mode','-',''],
  ['track-nap','screen','track-nap','-',''],
  ['track-night','screen','track-night','-',''],
  ['place-device','screen','place-device','-',''],
  ['tracking-active','screen','tracking-active','-',''],
  ['tracking-mixer','screen','tracking-mixer','-',''],
  ['tracking-stop-confirm','screen','tracking-stop-confirm','-',''],
  ['sounds','screen','sounds','-',''],
  ['sounds-player','screen','sounds-player','-',''],
  ['sleep-schedule','screen','sleep-schedule','setEditingScheduleId:weekdays',''],
  ['schedule-mix','screen','schedule-mix','setEditingScheduleId:weekdays',''],
  ['routine','screen','routine','-',''],
  ['night-shift-guide','screen','night-shift-guide','-',''],
  ['wind-down','screen','wind-down','-',''],
  ['course','screen','course','-',''],
  ['lesson','screen','lesson','setCurrentLesson:3',''],
  ['practice-intro','screen','practice-intro','-',''],
  ['practice-session','screen','practice-session','-',''],
  ['practice-complete','screen','practice-complete','-',''],
  ['wakeup-survey','screen','wakeup-survey','-',''],
  ['journal','screen','journal','-',''],
  ['journal-entry','screen','journal-entry','setEditingJournalId:j-1',''],
  ['profile','screen','profile','-',''],
  ['subscription','screen','subscription','-',''],
  ['quiz-intro','screen','quiz-intro','startQuiz:chronotype',''],
  ['quiz-session','screen','quiz-session','startQuiz:chronotype',''],
  ['quiz-result','screen','quiz-result','startQuiz:chronotype',''],
  ['auth-sign-in','screen','auth-sign-in','-',''],
  ['auth-sign-up','screen','auth-sign-up','-',''],
  ['auth-forgot','screen','auth-forgot','-',''],
  ['auth-reset-sent','screen','auth-reset-sent','-',''],
  ...ONB.map((lbl, i) => [`onb-${String(i).padStart(2,'0')}-${lbl}`, 'onb', String(i), '-', '']),
  ['mood-showcase','showcase','-','-',''],
];

const b = await chromium.launch();

async function shoot([name, mode, id, seedsCSV, homeFlag]) {
  const seeds = (seedsCSV && seedsCSV !== '-') ? seedsCSV.split(',') : [];
  const isHome = homeFlag === 'home';
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  try {
    const url = mode === 'showcase' ? BASE + '?showcase=mood' : BASE;
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    await p.evaluate(({ mode, id, seeds, isHome }) => {
      if (mode === 'showcase') return;
      if (mode === 'onb') { globalThis.__onb.setIdx(parseInt(id, 10)); return; }
      const store = globalThis.__store, nav = globalThis.__nav;
      store.completeOnboarding();
      store.setMiniPlayerHidden(!isHome);
      for (const s of seeds) { const [fn, arg] = s.split(':'); store[fn](arg); }
      nav.goHome(); nav.go(id);
    }, { mode, id, seeds, isHome });
    await p.waitForTimeout(1300);
    await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;}' });
    await p.evaluate(() => {
      document.querySelectorAll('input, textarea').forEach((inp) => {
        const cs = getComputedStyle(inp);
        // skip invisible overlay inputs (a sibling label already shows the value)
        const op = parseFloat(cs.opacity || '1');
        const am = (cs.color || '').match(/rgba?\([^)]*?,\s*([\d.]+)\)/);
        const colorAlpha = am ? parseFloat(am[1]) : 1;
        if (op < 0.1 || cs.color === 'transparent' || colorAlpha < 0.1) return;
        const span = document.createElement('div');
        span.textContent = inp.value || inp.getAttribute('placeholder') || '';
        span.className = inp.className;
        ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','color','lineHeight','fontVariantNumeric'].forEach((k) => { span.style[k] = cs[k]; });
        span.style.boxSizing = 'border-box'; span.style.width = '100%'; span.style.height = cs.height;
        span.style.display = 'flex'; span.style.alignItems = 'center';
        span.style.justifyContent = (cs.textAlign === 'center') ? 'center' : (cs.textAlign === 'right' ? 'flex-end' : 'flex-start');
        span.style.whiteSpace = 'pre'; span.style.overflow = 'hidden';
        if (inp.parentNode) inp.parentNode.replaceChild(span, inp);
      });
    });
    const over = await p.evaluate(() => {
      let m = 0;
      document.querySelectorAll('*').forEach((el) => {
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY)) { const o = el.scrollHeight - el.clientHeight; if (o > m) m = o; }
      });
      return m;
    });
    const file = `${OUT}/${name}.png`;
    await p.screenshot({ path: file });
    await p.close();
    return { name, file, w: W, h: H, overflow: over, err: errs[0] || null };
  } catch (e) {
    await p.close();
    return { name, file: null, err: String(e) };
  }
}

// concurrency pool
const POOL = 3;
const results = [];
let idx = 0;
async function worker() {
  while (idx < ITEMS.length) {
    const my = ITEMS[idx++];
    const r = await shoot(my);
    results.push(r);
    console.log(`${results.length}/${ITEMS.length} ${r.name} over=${r.overflow ?? '?'} ${r.err ? 'ERR:' + r.err : ''}`);
  }
}
await Promise.all(Array.from({ length: POOL }, worker));
await b.close();
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(results, null, 0));
const scrollers = results.filter(r => r.overflow > 40).map(r => `${r.name}(${r.overflow})`);
console.log('\nSCROLLERS (overflow>40):', scrollers.join(', '));
console.log('ERRORS:', results.filter(r => r.err).map(r => r.name + ':' + r.err).join(' | ') || 'none');
