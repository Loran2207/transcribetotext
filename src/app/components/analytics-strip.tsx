import { useState } from "react";
import { ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { useLanguage } from "./language-context";
import { AnalyticsCard, ANALYTICS_FILES, ANALYTICS_HOURS } from "./analytics-card";

/* Analytics banner for the mobile/tablet dashboard. A tappable card shown to
   every plan: the "Analytics" label on its own line, then the headline stats
   as big numbers with small muted units. Tapping expands the full AnalyticsCard
   inline. Desktop (>=lg) keeps the right-panel card and never renders this. */
export function AnalyticsStrip() {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="lg:hidden mt-[16px] flex flex-col gap-[12px]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-[12px] rounded-[16px] bg-card border border-border shadow-sm px-[16px] py-[14px] text-left active:bg-muted/40 transition-colors"
      >
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
        <Icon icon={ChevronRight} className="size-[18px] shrink-0 text-muted-foreground transition-transform duration-200" strokeWidth={2} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
      </button>
      {expanded && <AnalyticsCard />}
    </div>
  );
}
