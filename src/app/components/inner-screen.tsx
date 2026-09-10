import { useEffect, useState, type ReactNode } from "react";

/* Phone inner-screen chrome. The pattern: once you drill in anywhere (a folder
   with breadcrumbs, a template detail, a result page) the phone loses the
   floating "+" and the bottom nav, and gains a back arrow + nesting path up top
   plus a bottom control bar carrying only that screen's primary actions. A view
   registers itself here; the mobile top bar and the bottom bar read the store.
   Module-level pub/sub so pages and chrome stay decoupled. Phones only (below
   md); md+ keeps the normal bars. */
export type InnerScreen = {
  back: () => void;
  parent?: string;
  title: string;
  menu?: ReactNode;
  /* Hide the floating bottom nav + FAB while this screen is open (drill-in rule). */
  hideNav?: boolean;
  /* Primary controls pinned to the bottom edge, replacing the nav/FAB. */
  bottomBar?: ReactNode;
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

/* Renders the current inner screen's bottom control bar, fixed to the viewport
   bottom on phones. Mounted once in app-layout; returns nothing when no screen
   is active or the screen provided no bar. */
export function InnerScreenBottomBar() {
  const inner = useInnerScreen();
  if (!inner?.bottomBar) return null;
  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border px-[16px] pt-[10px]"
      style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
    >
      {inner.bottomBar}
    </div>
  );
}
