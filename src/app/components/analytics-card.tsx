import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "./ui/chart";
import { Icon } from "./ui/icon";
import { Analytics01Icon } from "@hugeicons/core-free-icons";

/* ══════════════════════════════════════════════
   Right-panel analytics widget (Pro)
   The original layout MINUS the range switcher, the "+12% vs last month"
   delta and the activity chart. Kept: the "Analytics" header, the two KPIs
   and the "By source" breakdown.
   Demo flag: ttt_demo_analytics === "soon" -> coming-soon state.
   ══════════════════════════════════════════════ */

const chartConfig = { minutes: { label: "Minutes", color: "var(--primary)" } } satisfies ChartConfig;

/* Headline KPI values shown in the two big cells below. Exported so the compact
   mobile analytics strip reuses the exact same numbers instead of recomputing. */
export const ANALYTICS_HOURS = 128.4;
export const ANALYTICS_FILES = 342;

// only used by the coming-soon ghost chart
const ghostData = [
  { label: "w1", minutes: 290 },
  { label: "w2", minutes: 460 },
  { label: "w3", minutes: 410 },
  { label: "w4", minutes: 640 },
  { label: "w5", minutes: 720 },
];

const sources = [
  { label: "Zoom", value: 138 },
  { label: "Google Meet", value: 92 },
  { label: "Microphone", value: 64 },
  { label: "File upload", value: 48 },
];
const sourceTotal = ANALYTICS_FILES;

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
    <div className="rounded-[14px] overflow-hidden bg-card border border-border shadow-sm flex flex-col shrink-0">
      <div className="px-[18px] pt-[16px] pb-[16px] shrink-0">
        <span className="block mb-[14px] text-muted-foreground" style={{ fontWeight: 600, fontSize: "11px" }}>Analytics</span>
        <div className="grid grid-cols-2 gap-[12px]">
          <div>
            <span className="block text-foreground tabular-nums" style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.6px", lineHeight: 1 }}>{ANALYTICS_HOURS}</span>
            <p className="text-muted-foreground mt-[6px]" style={{ fontWeight: 400, fontSize: "11px" }}>Hours transcribed</p>
          </div>
          <div className="pl-[16px] border-l border-border">
            <span className="block text-foreground tabular-nums" style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.6px", lineHeight: 1 }}>{ANALYTICS_FILES}</span>
            <p className="text-muted-foreground mt-[6px]" style={{ fontWeight: 400, fontSize: "11px" }}>Files transcribed</p>
          </div>
        </div>
      </div>
      <div className="mx-[18px] h-px bg-border shrink-0" />
      <div className="px-[18px] pt-[14px] pb-[16px] shrink-0">
        <p className="text-muted-foreground mb-[10px]" style={{ fontWeight: 600, fontSize: "11px" }}>By source</p>
        <div className="flex flex-col gap-[10px]">
          {sources.map((s) => {
            const pct = (s.value / sourceTotal) * 100;
            return (
              <div key={s.label} className="flex items-center gap-[10px] h-[16px]">
                <span className="w-[82px] shrink-0 truncate text-muted-foreground" style={{ fontWeight: 400, fontSize: "12px" }}>{s.label}</span>
                <div className="flex-1 h-[4px] rounded-full overflow-hidden bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%`, minWidth: "4px" }} />
                </div>
                <span className="w-[28px] shrink-0 text-right tabular-nums text-foreground" style={{ fontWeight: 600, fontSize: "11px" }}>{s.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnalyticsComingSoon() {
  return (
    <div className="rounded-[14px] overflow-hidden bg-card border border-border shadow-sm relative shrink-0" style={{ height: 320 }}>
      <div className="absolute bottom-0 left-0 right-0 h-[150px] opacity-[0.10] pointer-events-none">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <AreaChart data={ghostData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ttt-analytics-ghost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={["dataMin - 60", "dataMax + 60"]} />
            <Area dataKey="minutes" type="monotone" stroke="var(--muted-foreground)" strokeWidth={1.5} fill="url(#ttt-analytics-ghost)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[24px]">
        <div className="size-[46px] rounded-full bg-muted flex items-center justify-center">
          <Icon icon={Analytics01Icon} className="size-[22px] text-muted-foreground" strokeWidth={1.8} />
        </div>
        <span className="text-foreground mt-[14px]" style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.2px" }}>Analytics</span>
        <p className="text-muted-foreground mt-[5px] max-w-[230px]" style={{ fontWeight: 400, fontSize: "12px", lineHeight: 1.45 }}>Track your files and hours over time.</p>
        <span className="mt-[14px] inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
      </div>
    </div>
  );
}
