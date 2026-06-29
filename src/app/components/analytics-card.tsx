import { Icon } from "./ui/icon";
import { Analytics01Icon } from "@hugeicons/core-free-icons";

/* ══════════════════════════════════════════════
   Right-panel analytics widget (Pro)
   A small "Your stats" heading over two separate rounded cards, each with
   two stats split by a short (partial-height) centered divider.
   No chart, comparison, switcher or profile.
   NOTE: deliberately simple "first version" - the classic chart analytics
   (Recharts + comparison + range switcher + by-source) lives in git history
   before commit 82269ea and will return later.
   Demo flag: ttt_demo_analytics === "soon" -> coming-soon state.
   ══════════════════════════════════════════════ */

interface Stat { label: string; value: string; }

const STATS: Stat[] = [
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

function Cell({ s }: { s: Stat }) {
  return (
    <div className="flex-1 min-w-0 px-[20px] py-[16px]">
      <p className="text-[12px] font-medium leading-none text-muted-foreground">{s.label}</p>
      <p className="mt-[8px] text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-foreground">{s.value}</p>
    </div>
  );
}

function StatPair({ a, b }: { a: Stat; b: Stat }) {
  return (
    <div className="flex items-center rounded-[14px] border border-border bg-card" style={{ boxShadow: "var(--elevation-sm)" }}>
      <Cell s={a} />
      <div className="w-px h-[40px] shrink-0 bg-border" />
      <Cell s={b} />
    </div>
  );
}

function AnalyticsData() {
  return (
    <div className="shrink-0">
      <p className="mb-[10px] text-[13px] font-semibold text-foreground">Your stats</p>
      <div className="flex flex-col gap-[10px]">
        <StatPair a={STATS[0]} b={STATS[1]} />
        <StatPair a={STATS[2]} b={STATS[3]} />
      </div>
    </div>
  );
}

function AnalyticsComingSoon() {
  return (
    <div className="shrink-0">
      <p className="mb-[10px] text-[13px] font-semibold text-foreground">Your stats</p>
      <div className="rounded-[14px] bg-card border border-border shadow-sm px-[20px] py-[28px] flex flex-col items-center text-center">
        <div className="size-[44px] rounded-full bg-muted flex items-center justify-center">
          <Icon icon={Analytics01Icon} className="size-[20px] text-muted-foreground" strokeWidth={1.8} />
        </div>
        <p className="text-muted-foreground mt-[12px] max-w-[220px]" style={{ fontWeight: 400, fontSize: "12px", lineHeight: 1.45 }}>Track your hours, files and streak.</p>
        <span className="mt-[12px] inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
      </div>
    </div>
  );
}
