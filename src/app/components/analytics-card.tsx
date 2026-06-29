import { Icon } from "./ui/icon";
import { Analytics01Icon } from "@hugeicons/core-free-icons";

/* ══════════════════════════════════════════════
   Right-panel analytics widget (Pro)
   A 2x2 KPI grid of all-time totals (icon-free, Linear/Vercel-style):
   four cells split by a hairline cross, each a small label over a big
   number. No header, chart, comparison, switcher or profile.
   NOTE: this is a deliberately simple "first version" - the full classic
   chart analytics (Recharts + comparison + range switcher + by-source)
   lives in git history before commit 82269ea and will return later.
   Demo flag: ttt_demo_analytics === "soon" -> coming-soon state.
   ══════════════════════════════════════════════ */

const STATS = [
  { label: "hours transcribed", value: "128.4" },
  { label: "files transcribed", value: "342" },
  { label: "words transcribed", value: "1.2M" },
  { label: "day streak", value: "12" },
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
    <div
      className="w-full shrink-0 overflow-hidden rounded-[16px] border border-border bg-card"
      style={{ boxShadow: "var(--elevation-sm)" }}
    >
      <div className="grid grid-cols-2 grid-rows-2">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={[
              "flex flex-col gap-[8px] p-[22px]",
              i % 2 === 0 ? "border-r border-border" : "",
              i < 2 ? "border-b border-border" : "",
            ].filter(Boolean).join(" ")}
          >
            <span className="text-[12px] font-medium leading-none text-muted-foreground">{s.label}</span>
            <span className="text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-foreground">{s.value}</span>
          </div>
        ))}
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
      <span className="text-foreground mt-[12px]" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>Your stats</span>
      <p className="text-muted-foreground mt-[4px] max-w-[220px]" style={{ fontWeight: 400, fontSize: "12px", lineHeight: 1.45 }}>Track your hours, files and streak.</p>
      <span className="mt-[12px] inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
    </div>
  );
}
