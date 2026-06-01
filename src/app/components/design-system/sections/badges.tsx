import { Badge } from "../../ui/badge";
import { SectionFrame, SubBlock, PropTable } from "../board";
import { brandGradient } from "../tokens";

const BADGE_SPECS = {
  head: ["type", "height", "padding-x", "text", "radius"],
  rows: [
    ["Badge (base)", "~22px", "8px · px-2", "12px / 500", "8px · md"],
    ["status / plan", "22px", "10px · px-2.5", "11.5px / 600", "full"],
    ["language tag", "20px", "8px · px-2", "11px / 500", "6px"],
  ],
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold"
      style={{ background: `color-mix(in srgb, ${color} 12%, white)`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function BadgesSection() {
  return (
    <SectionFrame
      id="badges"
      group="Components"
      title="Badges & status"
      description="Pill badges carry status, plan and language. Status uses a soft tint of its hue with a leading dot; PRO is the one place the brand gradient appears in-product."
    >
      <SubBlock label="Status">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge label="Done" color="var(--strength-strong)" />
          <StatusBadge label="Processing" color="var(--primary)" />
          <StatusBadge label="Error" color="var(--destructive)" />
        </div>
      </SubBlock>

      <SubBlock label="Plan & language">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex h-[22px] items-center rounded-full bg-secondary px-2.5 text-[11.5px] font-semibold text-secondary-foreground">Free plan</span>
          <span className="inline-flex h-[22px] items-center rounded-full px-2.5 text-[11.5px] font-bold tracking-wide text-white" style={{ background: brandGradient.css }}>PRO</span>
          <span className="inline-flex h-[22px] items-center rounded-full px-2.5 text-[11.5px] font-semibold text-primary" style={{ background: "color-mix(in srgb, var(--primary) 8%, white)" }}>Start trial</span>
          {["EN", "RU", "ES"].map((l) => (
            <span key={l} className="inline-flex h-[20px] items-center rounded-[6px] bg-secondary px-2 text-[11px] font-medium text-muted-foreground">{l}</span>
          ))}
        </div>
      </SubBlock>

      <SubBlock label="Base Badge variants">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge>default</Badge>
          <Badge variant="secondary">secondary</Badge>
          <Badge variant="destructive">destructive</Badge>
          <Badge variant="outline">outline</Badge>
        </div>
      </SubBlock>

      <SubBlock label="Specs">
        <PropTable head={BADGE_SPECS.head} rows={BADGE_SPECS.rows} />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Status pills carry a 6px leading dot over a 12% tint of their hue. The base <code>Badge</code> is the only one that keeps a square-ish 8px radius — every pill badge is fully rounded.
        </p>
      </SubBlock>
    </SectionFrame>
  );
}
