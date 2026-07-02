import { useEffect, useState, type ReactNode } from "react";

/* Phone inner-screen chrome. When a drill-in view (folder, template detail,
   result page) registers itself, the mobile top bar swaps the hamburger +
   search shell for a back arrow + nesting path, and (optionally) the bottom
   nav hides so the screen can pin its own primary action. Module-level store
   so pages and chrome stay decoupled; phones only - md+ keeps normal bars. */
export type InnerScreen = {
  back: () => void;
  parent?: string;
  title: string;
  menu?: ReactNode;
  hideNav?: boolean;
} | null;

let current: InnerScreen = null;
const subs = new Set<(v: InnerScreen) => void>();

export function setInnerScreen(v: InnerScreen) {
  current = v;
  subs.forEach((f) => f(v));
}

export function useInnerScreen(): InnerScreen {
  const [v, setV] = useState<InnerScreen>(current);
  useEffect(() => {
    const f = (x: InnerScreen) => setV(x);
    subs.add(f);
    setV(current);
    return () => { subs.delete(f); };
  }, []);
  return v;
}
