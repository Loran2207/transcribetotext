import { Icon } from "./ui/icon";
import { Analytics01Icon } from "@hugeicons/core-free-icons";

/* ══════════════════════════════════════════════
   Right-panel analytics widget (Pro)
   Totals only: a clean white card with aligned stat rows (label left,
   big value right, hairline dividers). No header, chart, comparison,
   switcher or profile.
   Demo flag: ttt_demo_analytics === "soon" -> coming-soon state.
   ══════════════════════════════════════════════ */

const METRICS = [
  { value: "128.4", label: "hours transcribed" },
  { value: "342", label: "files transcribed" },
  { value: "12", label: "day streak" },
];

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

function AnalyticsData() {
  return (
    <div className="rounded-[16px] bg-card border border-border shadow-sm shrink-0 px-[20px] py-[4px]">
      {METRICS.map((m, i) => (
        <div
          key={m.label}
          className={`flex items-baseline justify-between py-[17px] ${i > 0 ? "border-t border-border" : ""}`}
        >
          <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "13.5px" }}>{m.label}</span>
          <span className="text-foreground tabular-nums" style={{ fontWeight: 700, fontSize: "25px", letterSpacing: "-0.6px", lineHeight: 1 }}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsComingSoon() {
  return (
    <div className="rounded-[16px] bg-card border border-border shadow-sm shrink-0 px-[20px] py-[28px] flex flex-col items-center text-center">
      <div className="size-[44px] rounded-full bg-muted flex items-center justify-center">
        <Icon icon={Analytics01Icon} className="size-[20px] text-muted-foreground" strokeWidth={1.8} />
      </div>
      <span className="text-foreground mt-[12px]" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>Your stats</span>
      <p className="text-muted-foreground mt-[4px] max-w-[220px]" style={{ fontWeight: 400, fontSize: "12px", lineHeight: 1.45 }}>Track your hours, files and streak.</p>
      <span className="mt-[12px] inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
    </div>
  );
}
