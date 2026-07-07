import { useEffect, useState } from "react";

/* Shared signal to hide the floating add "+" FAB. Multiple independent reasons
   can request hiding (page scroll near the bottom controls, an active
   multi-select). The FAB is hidden while ANY reason is active, so the sources
   never fight over a single boolean. */
const reasons = new Set<string>();
const subs = new Set<(v: boolean) => void>();

function emit() {
  const v = reasons.size > 0;
  subs.forEach((f) => f(v));
}

export function setFabHidden(v: boolean, reason = "scroll") {
  const had = reasons.has(reason);
  if (v && !had) {
    reasons.add(reason);
    emit();
  } else if (!v && had) {
    reasons.delete(reason);
    emit();
  }
}

export function useFabHidden(): boolean {
  const [v, setV] = useState(reasons.size > 0);
  useEffect(() => {
    const f = (x: boolean) => setV(x);
    subs.add(f);
    setV(reasons.size > 0);
    return () => { subs.delete(f); };
  }, []);
  return v;
}
