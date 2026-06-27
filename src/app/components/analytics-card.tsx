import { useState } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "./ui/chart";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Icon } from "./ui/icon";
import { ArrowUpRight01Icon, Analytics01Icon } from "@hugeicons/core-free-icons";

/* ══════════════════════════════════════════════
   Right-panel analytics widget (Pro)
   All-time KPIs + a switchable activity chart.
   Demo flag: ttt_demo_analytics === "soon" -> coming-soon state.
   ══════════════════════════════════════════════ */

const CARD_HEIGHT = 452;

const chartConfig = {
  minutes: { label: "Minutes", color: "var(--primary)" },
} satisfies ChartConfig;

type RangeKey = "7d" | "4w" | "12m";

// Each point carries a real date label, shown in the tooltip on hover.
const RANGE: Record<RangeKey, { unit: string; data: { label: string; minutes: number }[] }> = {
  "7d": {
    unit: "min / day",
    data: [
      { label: "Mon 6 May", minutes: 48 },
      { label: "Tue 7 May", minutes: 72 },
      { label: "Wed 8 May", minutes: 39 },
      { label: "Thu 9 May", minutes: 96 },
      { label: "Fri 10 May", minutes: 124 },
      { label: "Sat 11 May", minutes: 34 },
      { label: "Sun 12 May", minutes: 61 },
    ],
  },
  "4w": {
    unit: "min / week",
    data: [
      { label: "8 - 14 Apr", minutes: 290 },
      { label: "15 - 21 Apr", minutes: 460 },
      { label: "22 - 28 Apr", minutes: 410 },
      { label: "29 Apr - 5 May", minutes: 640 },
      { label: "6 - 12 May", minutes: 720 },
    ],
  },
  "12m": {
    unit: "min / month",
    data: [
      { label: "Jun 2025", minutes: 1520 },
      { label: "Jul 2025", minutes: 1780 },
      { label: "Aug 2025", minutes: 1420 },
      { label: "Sep 2025", minutes: 2010 },
      { label: "Oct 2025", minutes: 2360 },
      { label: "Nov 2025", minutes: 2140 },
      { label: "Dec 2025", minutes: 2620 },
      { label: "Jan 2026", minutes: 2480 },
      { label: "Feb 2026", minutes: 2900 },
      { label: "Mar 2026", minutes: 2740 },
      { label: "Apr 2026", minutes: 3120 },
      { label: "May 2026", minutes: 3260 },
    ],
  },
};

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

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: { payload: { label: string; minutes: number } }[] }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[10px] border border-border bg-card px-[12px] py-[8px] shadow-md">
      <p className="text-[12px] font-semibold text-foreground">{d.label}</p>
      <p className="mt-[2px] text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{d.minutes.toLocaleString()}</span> min transcribed
      </p>
    </div>
  );
}

function AnalyticsData() {
  const [range, setRange] = useState<RangeKey>("4w");
  const current = RANGE[range];
  return (
    <div className="rounded-[14px] overflow-hidden bg-card border border-border shadow-sm flex flex-col shrink-0" style={{ height: CARD_HEIGHT }}>
      <div className="px-[18px] pt-[16px] pb-[14px] shrink-0">
        <div className="flex items-center justify-between mb-[14px]">
          <span className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "11px" }}>Analytics</span>
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList className="h-[26px] rounded-full bg-muted p-[3px]">
              <TabsTrigger value="7d" className="h-[20px] rounded-full px-[9px] text-[11px] font-medium data-[state=active]:shadow-sm">7d</TabsTrigger>
              <TabsTrigger value="4w" className="h-[20px] rounded-full px-[9px] text-[11px] font-medium data-[state=active]:shadow-sm">4w</TabsTrigger>
              <TabsTrigger value="12m" className="h-[20px] rounded-full px-[9px] text-[11px] font-medium data-[state=active]:shadow-sm">12m</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          <div>
            <span className="block text-foreground tabular-nums" style={{ fontWeight: 700, fontSize: "28px", letterSpacing: "-0.6px", lineHeight: 1 }}>128.4</span>
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
      <div className="px-[14px] flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-[6px] px-[4px]">
          <span className="text-foreground" style={{ fontWeight: 600, fontSize: "11.5px" }}>Activity</span>
          <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "10px" }}>{current.unit}</span>
        </div>
        <div className="flex-1 min-h-0">
          <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
            <AreaChart data={current.data} margin={{ top: 6, right: 6, left: 6, bottom: 2 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin - 80", "dataMax + 60"]} />
              <ChartTooltip cursor={{ stroke: "var(--primary)", strokeOpacity: 0.25, strokeWidth: 1 }} content={<ActivityTooltip />} />
              <Area dataKey="minutes" type="monotone" stroke="var(--primary)" strokeWidth={2} fill="var(--primary)" fillOpacity={0.14} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--primary)" }} isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
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
    <div className="rounded-[14px] overflow-hidden bg-card border border-border shadow-sm relative shrink-0" style={{ height: CARD_HEIGHT }}>
      <div className="absolute bottom-0 left-0 right-0 h-[160px] opacity-[0.10] pointer-events-none">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <AreaChart data={RANGE["4w"].data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
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
        <p className="text-muted-foreground mt-[5px] max-w-[230px]" style={{ fontWeight: 400, fontSize: "12px", lineHeight: 1.45 }}>
          Track your files, hours and activity over time.
        </p>
        <span className="mt-[14px] inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
      </div>
    </div>
  );
}
