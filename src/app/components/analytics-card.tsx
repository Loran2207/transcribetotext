import { Icon } from "./ui/icon";
import { Analytics01Icon } from "@hugeicons/core-free-icons";

/* ══════════════════════════════════════════════
   Right-panel analytics widget (Pro)
   Simple "totals only" version: a clean white card with the all-time
   numbers (hours, files, streak). No chart, comparison, range switcher
   or profile - just the totals.
   Demo flag: ttt_demo_analytics === "soon" -> coming-soon state.
   ══════════════════════════════════════════════ */

export function AnalyticsCard() {
  const comingSoon = (() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem("ttt_demo_analytics") === "soon";
    } catch {
      return false;
    }
  })();
  return comingSoon ? <AnalyticsComingSoon /> : <AnalyticsData />;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-[8px]">
      <span className="text-foreground tabular-nums" style={{ fontWeight: 700, fontSize: "30px", letterSpacing: "-0.8px", lineHeight: 1 }}>{value}</span>
      <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "13px" }}>{label}</span>
    </div>
  );
}

function AnalyticsData() {
  return (
    <div className="rounded-[16px] bg-card border border-border shadow-sm shrink-0 px-[20px] py-[20px]">
      <div className="flex items-center justify-between mb-[18px]">
        <span className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "11px", letterSpacing: "0.2px" }}>Analytics</span>
        <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "11px" }}>All time</span>
      </div>
      <div className="flex flex-col gap-[16px]">
        <Metric value="128.4" label="hours transcribed" />
        <Metric value="342" label="files transcribed" />
        <Metric value="12" label="day streak" />
      </div>
    </div>
  );
}

function AnalyticsComingSoon() {
  return (
    <div className="rounded-[16px] bg-card border border-border shadow-sm shrink-0 px-[20px] py-[28px] flex flex-col items-center text-center">
      <div className="size-[44px] rounded-full bg-muted flex items-center justify-center">
        <Icon icon={Analytics01Icon} className="size-[20px] text-muted-foreground" strokeWidth={1.8} />
      </div>
      <span className="text-foreground mt-[12px]" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>Analytics</span>
      <p className="text-muted-foreground mt-[4px] max-w-[220px]" style={{ fontWeight: 400, fontSize: "12px", lineHeight: 1.45 }}>Track your hours, files and streak.</p>
      <span className="mt-[12px] inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
    </div>
  );
}
