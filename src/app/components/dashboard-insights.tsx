import { useRef, useState } from "react";
import { ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { useLanguage } from "./language-context";
import { usePlan } from "./use-plan";
import { UpgradeBanner } from "./upgrade-banner";
import { PromoCard } from "./right-panel";
import { ANALYTICS_FILES, ANALYTICS_HOURS, ANALYTICS_SOURCES } from "./analytics-card";
import { meetings, MeetingItem, TODAY_STR } from "./todays-events";

/* Home (mobile/tablet) insight carousel - ONE horizontal scroll, no stacked
   banners. Free swipes [Pro upsell][gift promo][Today events]; Pro swipes
   [Analytics][Today events]. Meetings ALWAYS show, any plan. Fixed-height track
   + a detail accordion BELOW it, so expanding an event never makes the row jump.
   Desktop (>=lg) uses the right panel and never renders this. */
export function DashboardInsights({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useLanguage();
  const plan = usePlan();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const todays = meetings.filter((m) => m.day === TODAY_STR);
  const nextMeeting = todays[0];
  const slides = plan === "pro" ? ["analytics", "events"] : ["banner", "promo", "events"];
  const onScroll = () => { const el = trackRef.current; if (!el) return; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== active) { setActive(i); setExpanded(false); } };
  const toggle = (i: number) => { if (active === i) setExpanded((v) => !v); else { setActive(i); setExpanded(true); } };
  const expandable = (key: string) => key === "analytics" || key === "events";
  const headCls = "flex h-[84px] w-full items-center justify-between gap-[12px] rounded-[16px] bg-card border border-border shadow-sm px-[16px] text-left active:bg-muted/40 transition-colors";

  const analyticsHeader = (i: number) => (
    <button type="button" onClick={() => toggle(i)} aria-expanded={active === i && expanded} className={headCls}>
      <span className="flex min-w-0 flex-col gap-[8px]">
        <span className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "12px", lineHeight: "16px" }}>{t("dash.tab.analytics")}</span>
        <span className="flex items-baseline gap-[8px] text-foreground">
          <span className="tabular-nums" style={{ fontWeight: 700, fontSize: "26px", letterSpacing: "-0.6px", lineHeight: 1 }}>{ANALYTICS_FILES}</span>
          <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "12px", lineHeight: "16px" }}>{t("dash.analytics.files")}</span>
          <span className="text-muted-foreground/40" style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1 }}>{"·"}</span>
          <span className="tabular-nums" style={{ fontWeight: 700, fontSize: "26px", letterSpacing: "-0.6px", lineHeight: 1 }}>{ANALYTICS_HOURS}</span>
          <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "12px", lineHeight: "16px" }}>{t("dash.analytics.hrs")}</span>
        </span>
      </span>
      <Icon icon={ChevronRight} className="size-[18px] shrink-0 text-muted-foreground transition-transform duration-200" strokeWidth={2} style={{ transform: active === i && expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
    </button>
  );

  const eventsHeader = (i: number) => (
    <button type="button" onClick={() => toggle(i)} aria-expanded={active === i && expanded} className={headCls}>
      <span className="flex min-w-0 flex-col gap-[8px]">
        <span className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "12px", lineHeight: "16px" }}>{"Today's events"}</span>
        {nextMeeting ? (
          <span className="flex items-baseline gap-[8px] text-foreground">
            <span className="tabular-nums" style={{ fontWeight: 700, fontSize: "26px", letterSpacing: "-0.6px", lineHeight: 1 }}>{todays.length}</span>
            <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "12px", lineHeight: "16px" }}>{todays.length === 1 ? "call" : "calls"}</span>
            <span className="text-muted-foreground/40" style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1 }}>{"·"}</span>
            <span className="truncate text-muted-foreground" style={{ fontWeight: 500, fontSize: "13px", lineHeight: "18px" }}>{nextMeeting.time.split(" ")[0]}</span>
          </span>
        ) : (
          <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "13px", lineHeight: "18px" }}>No calls today</span>
        )}
      </span>
      <Icon icon={ChevronRight} className="size-[18px] shrink-0 text-muted-foreground transition-transform duration-200" strokeWidth={2} style={{ transform: active === i && expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
    </button>
  );

  const renderSlide = (key: string, i: number) => {
    if (key === "banner") return <div className="h-[84px] flex items-center"><UpgradeBanner bare /></div>;
    if (key === "promo") return <div className="h-[84px] flex items-center"><PromoCard /></div>;
    if (key === "analytics") return analyticsHeader(i);
    return eventsHeader(i);
  };

  const activeKey = slides[active] || slides[0];
  return (
    <div className="lg:hidden mt-[16px]">
      <div ref={trackRef} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-[16px] px-[16px] gap-[12px]" style={{ scrollbarWidth: "none" }}>
        {slides.map((key, i) => (
          <div key={key} className="snap-center shrink-0 w-full">{renderSlide(key, i)}</div>
        ))}
      </div>

      {expanded && expandable(activeKey) && (
        <div className="mt-[10px] rounded-[16px] bg-card border border-border shadow-sm overflow-hidden">
          <div className="px-[16px] py-[16px]">
            {activeKey === "analytics" ? (
              <>
                <p className="text-muted-foreground mb-[10px]" style={{ fontWeight: 600, fontSize: "12px", lineHeight: "16px" }}>By source</p>
                <div className="flex flex-col gap-[10px]">
                  {ANALYTICS_SOURCES.map((src) => (
                    <div key={src.label} className="flex items-center gap-[10px]">
                      <span className="w-[92px] shrink-0 text-[12px] leading-[16px] text-muted-foreground">{src.label}</span>
                      <span className="relative flex-1 h-[4px] rounded-full bg-muted overflow-hidden">
                        <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: Math.round((src.value / ANALYTICS_SOURCES[0].value) * 100) + "%" }} />
                      </span>
                      <span className="w-[32px] shrink-0 text-right tabular-nums text-[12px] leading-[16px] text-foreground">{src.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              todays.length ? (
                <>
                  <div className="flex flex-col">
                    {todays.map((m) => (<MeetingItem key={m.id} meeting={m} />))}
                  </div>
                  <button type="button" onClick={() => onNavigate?.("calendar")} className="mt-[8px] flex w-full items-center justify-center gap-[6px] rounded-[10px] border border-border py-[10px] text-[13px] font-medium text-foreground active:bg-muted/50 transition-colors">
                    View all meetings
                    <Icon icon={ChevronRight} className="size-[15px] text-muted-foreground" strokeWidth={2} />
                  </button>
                </>
              ) : (
                <p className="py-[8px] text-[13px] leading-[18px] text-muted-foreground">Nothing scheduled for today.</p>
              )
            )}
          </div>
        </div>
      )}

      {slides.length > 1 && (
        <div className="mt-[10px] flex items-center justify-center gap-[6px]">
          {slides.map((key, i) => (
            <span key={key} className={i === active ? "h-[6px] w-[16px] rounded-full bg-primary transition-all" : "size-[6px] rounded-full bg-muted-foreground/30 transition-all"} />
          ))}
        </div>
      )}
    </div>
  );
}
