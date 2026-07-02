import { useEffect, useState } from "react";

/* Tiny shared signal: lets a scrolling page hide the floating add "+" FAB while
   its bottom controls (e.g. the pagination bar) are in view, so the FAB never
   overlaps them. Module-level pub/sub; the page sets it, bottom-nav reads it. */
let hidden = false;
const subs = new Set<(v: boolean) => void>();

export function setFabHidden(v: boolean) {
  if (v === hidden) return;
  hidden = v;
  subs.forEach((f) => f(v));
}

export function useFabHidden(): boolean {
  const [v, setV] = useState(hidden);
  useEffect(() => {
    const f = (x: boolean) => setV(x);
    subs.add(f);
    setV(hidden);
    return () => { subs.delete(f); };
  }, []);
  return v;
}
