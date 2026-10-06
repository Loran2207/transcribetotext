import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";

/* A row that is wider than its place (the tab row once a translation adds two
   tabs) scrolls sideways with no scrollbar. Each edge that hides more content
   fades out and carries a round arrow that scrolls one screen that way. The
   active item is scrolled into view when it changes, so a tab chosen by the
   product (the translated transcript) is never off-screen. */
export function ScrollRow({ children, className = "", activeKey, label = "tabs" }: { children: ReactNode; className?: string; activeKey?: string; label?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((cur) => (cur.left === left && cur.right === right ? cur : { left, right }));
  }, []);

  /* the chosen item comes into view past the fade, with a little of its neighbour showing */
  const reveal = useCallback((behavior: ScrollBehavior) => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>("[data-state=active]");
    if (!active) return;
    const a = active.getBoundingClientRect(), s = el.getBoundingClientRect();
    const pad = 56;
    if (a.left < s.left + pad) el.scrollTo({ left: Math.max(0, el.scrollLeft - (s.left + pad - a.left)), behavior });
    else if (a.right > s.right - pad) el.scrollTo({ left: el.scrollLeft + (a.right - (s.right - pad)), behavior });
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    /* the row gets narrower when the controls beside it appear, so the active item is revealed again */
    const ro = new ResizeObserver(() => { measure(); reveal("auto"); });
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    el.addEventListener("scroll", measure, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener("scroll", measure); };
  }, [measure, reveal, children]);

  useEffect(() => { reveal("smooth"); }, [activeKey, reveal]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + dir * Math.round(el.clientWidth * 0.6), behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted [@media(pointer:coarse)]:size-8";
  const fade = "pointer-events-none absolute inset-y-0 z-[5] w-12 from-background to-transparent";

  return (
    <div data-scroll-row="" className={"relative min-w-0 flex-1 " + className}>
      <div ref={ref} className="flex items-end overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {edges.left && (
        <>
          <div className={fade + " left-0 bg-gradient-to-r"} />
          <button type="button" data-scroll-row-arrow="left" aria-label={`Scroll ${label} left`} onClick={() => page(-1)} className={arrow + " left-0"}>
            <Icon icon={ArrowLeft01Icon} size={14} />
          </button>
        </>
      )}
      {edges.right && (
        <>
          <div className={fade + " right-0 bg-gradient-to-l"} />
          <button type="button" data-scroll-row-arrow="right" aria-label={`Scroll ${label} right`} onClick={() => page(1)} className={arrow + " right-0"}>
            <Icon icon={ArrowRight01Icon} size={14} />
          </button>
        </>
      )}
    </div>
  );
}
