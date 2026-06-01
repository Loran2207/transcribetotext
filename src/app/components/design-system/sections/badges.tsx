import { Badge } from "../../ui/badge";
import { SectionFrame, SubBlock } from "../board";
import { brandGradient } from "../tokens";

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
    </SectionFrame>
  );
}
