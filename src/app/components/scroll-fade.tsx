import { useEffect, useRef, useState, type RefObject } from "react";

/* A bottom scroll-fade hint for the mobile/tablet dashboard. Renders a soft fade
   to the page background along the bottom edge while there is more content below,
   and hides once the user scrolls to the end. Hidden on desktop (>=lg). It sits
   inside the dashboard's relative root, so the fixed bottom-nav pill floats above
   it. The gradient uses the --background token (white) and reads correctly in the
   live app; captures bake their own flat-white overlay because CSS var() gradients
   flatten to gray in html-to-design. */
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
      className="lg:hidden pointer-events-none absolute left-0 right-0 bottom-0 h-[84px] bg-gradient-to-t from-background via-background/85 to-transparent transition-opacity duration-300"
      style={{ opacity: atBottom ? 0 : 1 }}
    />
  );
}
