import type { ReactNode } from "react";
import { Badge } from "../../ui/badge";
import { Section, Block, PropTable } from "../board";
import { AnnoStage, Cell, StageGrid, H, W, lead } from "../annotate";
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

const SPECS = {
  head: ["type", "height", "padding-x", "text", "radius"],
  rows: [
    ["Badge (base)", "~22px", "8px · px-2", "12px / 500", "8px · md"],
    ["status / plan", "22px", "10px · px-2.5", "11.5px / 600", "full"],
    ["language tag", "20px", "8px · px-2", "11px / 500", "6px"],
  ] as ReactNode[][],
};

export function BadgesSection() {
  return (
    <Section
      id="badges"
      num="06"
      group="Components"
      title="Badges & status"
      desc="Pill badges carry status, plan and language. Status uses a soft tint of its hue with a leading dot; PRO is the one place the brand gradient appears in-product."
      spec
    >
      <Block label="Status pill">
        <AnnoStage annos={[H, W, lead(0.99, 0.12, 38, -24, "radius · full", "r"), lead(0.12, 0.5, -40, 28, "dot · 6", "l")]}>
          <StatusBadge label="Processing" color="var(--primary)" />
        </AnnoStage>
      </Block>

      <Block label="Status hues">
        <StageGrid>
          <Cell tag="done · green" variant="mini" annos={[]}><StatusBadge label="Done" color="var(--strength-strong)" /></Cell>
          <Cell tag="processing · blue" variant="mini" annos={[]}><StatusBadge label="Processing" color="var(--primary)" /></Cell>
          <Cell tag="error · red" variant="mini" annos={[]}><StatusBadge label="Error" color="var(--destructive)" /></Cell>
        </StageGrid>
      </Block>

      <Block label="Plan & language">
        <StageGrid>
          <Cell tag="free" variant="mini" annos={[]}>
            <span className="inline-flex h-[22px] items-center rounded-full bg-secondary px-2.5 text-[11.5px] font-semibold text-secondary-foreground">Free plan</span>
          </Cell>
          <Cell tag="pro · gradient" variant="mini" annos={[]}>
            <span className="inline-flex h-[22px] items-center rounded-full px-2.5 text-[11.5px] font-bold tracking-wide text-white" style={{ background: brandGradient.css }}>PRO</span>
          </Cell>
          <Cell tag="trial" variant="mini" annos={[]}>
            <span className="inline-flex h-[22px] items-center rounded-full px-2.5 text-[11.5px] font-semibold text-primary" style={{ background: "color-mix(in srgb, var(--primary) 8%, white)" }}>Start trial</span>
          </Cell>
          <Cell tag="language tag" variant="mini" annos={[]}>
            <span className="inline-flex h-[20px] items-center rounded-[6px] bg-secondary px-2 text-[11px] font-medium text-muted-foreground">EN</span>
          </Cell>
        </StageGrid>
      </Block>

      <Block label="Base badge">
        <StageGrid>
          <Cell tag="default" variant="mini" annos={[]}><Badge>default</Badge></Cell>
          <Cell tag="secondary" variant="mini" annos={[]}><Badge variant="secondary">secondary</Badge></Cell>
          <Cell tag="destructive" variant="mini" annos={[]}><Badge variant="destructive">destructive</Badge></Cell>
          <Cell tag="outline" variant="mini" annos={[]}><Badge variant="outline">outline</Badge></Cell>
        </StageGrid>
      </Block>

      <Block label="Specs" note={<>Status pills carry a 6px leading dot over a 12% tint of their hue. The base <code>Badge</code> keeps a square-ish 8px radius — every pill badge is fully rounded.</>}>
        <PropTable head={SPECS.head} rows={SPECS.rows} />
      </Block>
    </Section>
  );
}
