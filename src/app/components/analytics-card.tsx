import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import { Icon } from "./ui/icon";
import { ArrowUpRight01Icon, Analytics01Icon } from "@hugeicons/core-free-icons";

/* ══════════════════════════════════════════════
   Right-panel analytics widget (Pro)
   The plan is unlimited, so this replaces the usage
   meter with all-time activity. Demo flag:
   ttt_demo_analytics === "soon" -> coming-soon state.
   ══════════════════════════════════════════════ */

const CARD_HEIGHT = 420;

const chartConfig = {
  minutes: { label: "Minutes", color: "var(--primary)" },
} satisfies ChartConfig;

const weekly = [
  { week: "W1", minutes: 210 },
  { week: "W2", minutes: 340 },
  { week: "W3", minutes: 290 },
  { week: "W4", minutes: 460 },
  { week: "W5", minutes: 520 },
  { week: "W6", minutes: 410 },
  { week: "W7", minutes: 640 },
  { week: "W8", minutes: 720 },
];

const sources = [
  { label: "Zoom", value: 138 },
  { label: "Google Meet", value: 92 },
  { label: "Microphone", value: 64 },
  { label: "File upload", value: 48 },
];
const sourceTotal = 342;

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
    <div className="rounded-[14px] overflow-hidden bg-card border border-border shadow-sm flex flex-col shrink-0" style={{ height: CARD_HEIGHT }}>
      {/* Band A — header + KPIs */}
      <div className="px-[18px] pt-[16px] pb-[14px] shrink-0">
        <div className="flex items-center justify-between mb-[14px]">
          <span className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Analytics</span>
          <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "10.5px" }}>All time</span>
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          <div>
            <div className="flex items-baseline gap-[3px]">
              <span className="text-foreground tabular-nums" style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.6px", lineHeight: 1 }}>128.4</span>
              <span className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "14px" }}>h</span>
            </div>
            <p className="text-muted-foreground mt-[6px]" style={{ fontWeight: 400, fontSize: "11px" }}>Hours transcribed</p>
          </div>
          <div className="pl-[16px] border-l border-border">
            <span className="block text-foreground tabular-nums" style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.6px", lineHeight: 1 }}>342</span>
            <p className="text-muted-foreground mt-[6px]" style={{ fontWeight: 400, fontSize: "11px" }}>Files transcribed</p>
          </div>
        </div>
        <div className="flex items-center gap-[6px] mt-[12px]">
          <span className="inline-flex items-center gap-[2px] rounded-full px-[7px] py-[2px] bg-emerald-50 text-emerald-600">
            <Icon icon={ArrowUpRight01Icon} className="size-[11px]" strokeWidth={2.5} />
            <span style={{ fontWeight: 600, fontSize: "11px" }}>12%</span>
          </span>
          <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "11px" }}>vs last month</span>
        </div>
      </div>

      {/* Band B — weekly activity chart (absorbs remaining height) */}
      <div className="px-[14px] flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-[6px] px-[4px]">
          <span className="text-foreground" style={{ fontWeight: 600, fontSize: "11.5px" }}>Weekly activity</span>
          <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "10px" }}>min / week</span>
        </div>
        <div className="flex-1 min-h-0">
          <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
            <AreaChart data={weekly} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
              <defs>
                <linearGradient id="ttt-analytics-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
                  <stop offset="55%" stopColor="var(--primary)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" hide />
              <YAxis hide domain={["dataMin - 60", "dataMax + 60"]} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
              <Area dataKey="minutes" type="monotone" stroke="var(--primary)" strokeWidth={1.5} fill="url(#ttt-analytics-fill)" dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: "var(--primary)" }} isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Band C — divider */}
      <div className="mx-[18px] h-px bg-border shrink-0" />

      {/* Band D — source breakdown */}
      <div className="px-[18px] pt-[14px] pb-[16px] shrink-0">
        <p className="text-muted-foreground mb-[10px]" style={{ fontWeight: 600, fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.6px" }}>By source</p>
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
    <div className="rounded-[14px] overflow-hidden bg-card border border-border shadow-sm relative shrink-0" style={{ height: CARD_HEIGHT }}>
      {/* Faint chart ghost, bottom-anchored */}
      <div className="absolute bottom-0 left-0 right-0 h-[160px] opacity-[0.10] pointer-events-none">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <AreaChart data={weekly} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ttt-analytics-ghost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" hide />
            <YAxis hide domain={["dataMin - 60", "dataMax + 60"]} />
            <Area dataKey="minutes" type="monotone" stroke="var(--muted-foreground)" strokeWidth={1.5} fill="url(#ttt-analytics-ghost)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ChartContainer>
      </div>
      {/* Centered foreground */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-[24px]">
        <div className="size-[46px] rounded-full bg-muted flex items-center justify-center">
          <Icon icon={Analytics01Icon} className="size-[22px] text-muted-foreground" strokeWidth={1.8} />
        </div>
        <span className="text-foreground mt-[14px]" style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.2px" }}>Analytics</span>
        <p className="text-muted-foreground mt-[5px] max-w-[230px]" style={{ fontWeight: 400, fontSize: "12px", lineHeight: 1.45 }}>
          Track your files, hours and activity over time.
        </p>
        <span className="mt-[14px] inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
      </div>
    </div>
  );
}
