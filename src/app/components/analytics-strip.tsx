import { useState } from "react";
import { ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { usePlan } from "./use-plan";
import { useLanguage } from "./language-context";
import { AnalyticsCard, ANALYTICS_FILES, ANALYTICS_HOURS } from "./analytics-card";

/* Pro-only compact analytics strip for the mobile/tablet dashboard. A thin
   tappable row under the greeting showing the same headline stats as the
   right-panel AnalyticsCard; tapping it expands the full card inline. Free
   users see nothing. Desktop (>=lg) keeps the right-panel card and never
   renders this. */
export function AnalyticsStrip() {
  const plan = usePlan();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (plan !== "pro") return null;

  return (
    <div className="lg:hidden mt-[22px] flex flex-col gap-[12px]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-[12px] rounded-[14px] bg-card border border-border shadow-sm px-[16px] h-[52px] active:bg-muted/40 transition-colors"
      >
        <span className="flex min-w-0 items-center gap-[10px]">
          <span className="shrink-0 text-muted-foreground" style={{ fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px" }}>{t("dash.tab.analytics")}</span>
          <span className="truncate text-foreground tabular-nums" style={{ fontWeight: 600, fontSize: "13px" }}>{t("dash.analytics.summary", ANALYTICS_FILES, ANALYTICS_HOURS)}</span>
        </span>
        <Icon icon={ChevronRight} className="size-[16px] shrink-0 text-muted-foreground transition-transform duration-200" strokeWidth={2} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
      </button>
      {expanded && <AnalyticsCard />}
    </div>
  );
}
