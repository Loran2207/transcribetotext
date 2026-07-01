import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Zap, X } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { usePlan } from "./use-plan";
import { useLanguage } from "./language-context";
import { PromoCard } from "./right-panel";

/* Mobile + tablet banner region (replaces the stacked PlanWidgets). A single
   banner-height carousel: free users get a compact upgrade/paywall slide plus
   the promo slide; pro users get the promo slide only. The promo slide is
   dismissible and snoozed for ~7 days in localStorage. When nothing is left to
   show the whole region renders nothing, so it never leaves an empty gap. */

const PROMO_SNOOZE_KEY = "ttt_promo_snooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // ~7 days
const BANNER_HEIGHT = 63; // matches PromoCard's fixed height

function isPromoSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(PROMO_SNOOZE_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < SNOOZE_MS;
}

/* Compact paywall banner - reuses the Free-plan card's Zap + primary-gradient
   CTA visual, condensed to the promo banner's height. */
function PaywallBanner() {
  const { t } = useLanguage();
  return (
    <div
      className="relative w-full rounded-[12px] overflow-hidden bg-card border border-border shadow-sm flex items-center gap-[12px] pl-[16px] pr-[12px]"
      style={{ height: BANNER_HEIGHT }}
    >
      <p className="flex-1 min-w-0 text-foreground" style={{ fontWeight: 600, fontSize: "14px", lineHeight: 1.25, letterSpacing: "-0.2px" }}>
        {t("dash.banner.unlockPro")}
      </p>
      <Button
        className="h-[36px] px-[16px] gap-[6px] shrink-0 bg-primary text-primary-foreground hover:-translate-y-px"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
          boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 20%, transparent), 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <Icon icon={Zap} className="size-[14px] text-primary-foreground" strokeWidth={2} fill="currentColor" />
        <span className="text-primary-foreground" style={{ fontWeight: 600, fontSize: "13px", letterSpacing: "0.1px" }}>{t("calendar.upgrade")}</span>
      </Button>
    </div>
  );
}

interface Slide {
  key: string;
  node: ReactNode;
  dismissible: boolean;
}

export function BannerCarousel() {
  const plan = usePlan();
  const prefersReduced = useReducedMotion();
  const { t } = useLanguage();
  const [snoozed, setSnoozed] = useState<boolean>(() => isPromoSnoozed());
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Build the slide list for the current plan + snooze state.
  const slides: Slide[] = [];
  if (plan === "free") slides.push({ key: "paywall", node: <PaywallBanner />, dismissible: false });
  if (!snoozed) slides.push({ key: "promo", node: <PromoCard />, dismissible: true });

  const count = slides.length;

  // Keep the active index valid when the slide count shrinks (e.g. dismiss).
  useEffect(() => {
    if (active > count - 1) setActive(Math.max(0, count - 1));
  }, [count, active]);

  const go = useCallback((i: number) => {
    setActive(() => {
      const max = count - 1;
      return i < 0 ? 0 : i > max ? max : i;
    });
  }, [count]);

  const dismissPromo = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROMO_SNOOZE_KEY, String(Date.now()));
    }
    setSnoozed(true);
  }, []);

  if (count === 0) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const multi = count > 1;

  return (
    <div className="lg:hidden mt-[20px]">
      <div
        className="relative overflow-hidden rounded-[12px]"
        style={{ maxHeight: BANNER_HEIGHT, touchAction: "pan-y" }}
        onTouchStart={multi ? onTouchStart : undefined}
        onTouchEnd={multi ? onTouchEnd : undefined}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${active * 100}%)`,
            transition: prefersReduced ? undefined : "transform 0.32s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {slides.map((s) => (
            <div key={s.key} className="relative w-full shrink-0">
              {s.node}
              {s.dismissible && (
                <button
                  type="button"
                  onClick={dismissPromo}
                  aria-label="Dismiss"
                  className="absolute top-[6px] right-[8px] z-10 flex items-center justify-center size-[20px] rounded-full bg-background/70 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon icon={X} className="size-[13px]" strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {multi && (
        <div className="mt-[8px] flex items-center justify-center gap-[6px]">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === active ? 16 : 6,
                height: 6,
                backgroundColor: i === active ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
