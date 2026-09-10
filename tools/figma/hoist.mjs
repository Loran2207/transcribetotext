/* Figma's capture sorts siblings by z-index, and only siblings. The window's
   traffic lights are a sibling of the window body, so they arrive on top; a
   menu that hangs off the chip row is not - it keeps the chip row's place in
   the document, and the article printed after the row paints straight over it.
   That is the whole bug: the page is right, the document order that describes
   it is not.
 *
 * So before the page is handed over, every overlay the browser puts on top is
 * re-seated as the last child of an ancestor that also holds what it covers,
 * pinned to the exact rectangle it already occupies. Nothing moves on screen -
 * an out-of-flow element leaves no gap behind it - and the document now says
 * what the screen shows. */
export const HOIST = () => {
  const all = [...document.querySelectorAll("*")];
  const ix = new Map(all.map((el, i) => [el, i]));
  const box = (el) => el.getBoundingClientRect();
  const shown = (el) => {
    const c = getComputedStyle(el);
    return c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.02;
  };
  const over = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  /* something a reader would miss if it were painted over */
  const paints = (el) => {
    const c = getComputedStyle(el);
    if (c.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor)) return true;
    if (c.backgroundImage && c.backgroundImage !== "none") return true;
    if (el.tagName === "IMG" || el.tagName === "svg") return true;
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  };

  const raised = all.filter((el) => {
    const c = getComputedStyle(el);
    if (c.position !== "absolute" && c.position !== "fixed") return false;
    if (c.zIndex === "auto" || !(+c.zIndex > 0)) return false;
    const r = box(el);
    return r.width > 2 && r.height > 2 && shown(el);
  });

  /* An overlay that does not take the pointer is still an overlay; let the
     whole page answer for its paint order, then put the property back. */
  const held = raised.map((el) => [el, el.style.pointerEvents]);
  for (const [el] of held) el.style.pointerEvents = "auto";
  const tops = new Map();
  for (const el of raised) {
    const r = box(el);
    let seen = 0, mine = 0;
    for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.2], [0.8, 0.8], [0.2, 0.8], [0.8, 0.2]]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (x < 1 || y < 1 || x > innerWidth - 1 || y > innerHeight - 1) continue;
      seen++;
      const t = document.elementFromPoint(x, y);
      if (t && (t === el || el.contains(t))) mine++;
    }
    tops.set(el, seen > 0 && mine > 0);
  }
  for (const [el, v] of held) el.style.pointerEvents = v;

  const moves = [];
  for (const el of raised) {
    if (!tops.get(el)) continue; /* the browser puts something above it: it is not the top layer */
    const r = box(el), mine = ix.get(el);
    const under = all.filter((o) =>
      ix.get(o) > mine && !el.contains(o) && !o.contains(el) && shown(o) && paints(o) && over(box(o), r));
    if (!under.length) continue;
    /* the lowest ancestor that holds everything this overlay covers, then up to
       one that an absolute child can be measured from */
    let host = el.parentElement;
    while (host && !under.every((o) => host.contains(o))) host = host.parentElement;
    if (!host) host = document.body;
    while (host !== document.body && getComputedStyle(host).position === "static") host = host.parentElement;
    if (host === el.parentElement && el === el.parentElement.lastElementChild) continue; /* already last where it matters */
    moves.push({ el, r, host, z: +getComputedStyle(el).zIndex, ix: mine });
  }

  /* two overlays over the same ground keep their own order */
  moves.sort((a, b) => a.z - b.z || a.ix - b.ix);
  for (const m of moves) {
    const h = m.host.getBoundingClientRect();
    const c = getComputedStyle(m.host);
    const bl = parseFloat(c.borderLeftWidth) || 0, bt = parseFloat(c.borderTopWidth) || 0;
    const s = m.el.style;
    s.position = "absolute";
    s.left = m.r.left - h.left - bl + "px";
    s.top = m.r.top - h.top - bt + "px";
    s.right = "auto";
    s.bottom = "auto";
    s.width = m.r.width + "px";
    s.height = m.r.height + "px";
    s.margin = "0";
    s.transform = "none";
    m.host.appendChild(m.el);
  }
  return moves.map((m) => (m.el.className.toString() || m.el.tagName).slice(0, 44) + " -> " + (m.host.className.toString() || m.host.tagName).slice(0, 28));
};
