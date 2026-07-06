import { useEffect, useRef, useState, type RefObject } from "react";

/* Bottom scroll-fade hint for phones (<768), where the floating bottom nav
   overlays the list. One global rule: every root tab page (Home, My Records,
   Templates, Meetings) renders this; subroutes, search and modals do not.
   Fixed to the viewport bottom under the nav pill (nav z-40, fade z-30), so it
   never scrolls away. Fades to the page background and hides once the given
   scroll container reaches its end. Hidden at md+ (no bottom nav there). The
   gradient uses literal white stops because CSS var() gradients flatten to gray
   in html-to-design captures. */
export function ScrollFade({ scrollRef }: { scrollRef: RefObject<HTMLElement | null> }) {
  const [atBottom, setAtBottom] = useState(true);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setAtBottom(remaining <= 8);
    };
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(check);
    };
    check();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollRef]);

  return (
    <div
      aria-hidden
      className="lg:hidden pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[72px] transition-opacity duration-300"
      style={{ opacity: atBottom ? 0 : 1, background: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(255,255,255,0.02) 100%)" }}
    />
  );
}
