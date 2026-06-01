import { useState } from "react";
import { Section, Block, SpecCols } from "../board";
import { AnnoStage, Cell, H, W, lead } from "../annotate";

function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "lg",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "lg" | "compact";
}) {
  const compact = size === "compact";
  return (
    <div
      className={
        "inline-flex border border-border " +
        (compact ? "h-[40px] items-center rounded-[12px] bg-muted/70 p-[3px]" : "rounded-[10px] bg-muted p-[3px]")
      }
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              (compact ? "h-full min-w-[58px] rounded-[9px] px-[14px] text-[12px] " : "h-[32px] min-w-[120px] rounded-[8px] px-[16px] text-[13px] ") +
              "font-medium transition-all " +
              (active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const SPECS = [
  { title: "track", rows: [["radius", "10px (compact 12px)"], ["padding", "3px"], ["fill", "muted + 1px border"]] },
  { title: "pill", rows: [["height", "32px (compact 34px)"], ["radius", "8px (compact 9px)"], ["text", "13px / 500 (compact 12px)"], ["active", "bg-background + sm shadow"], ["idle", "muted-foreground · hover foreground"]] },
] satisfies { title: string; rows: [string, string][] }[];

export function SegmentedSection() {
  const [mode, setMode] = useState<"mono" | "bi">("mono");
  const [short, setShort] = useState<"mono" | "bi">("mono");
  return (
    <Section
      id="segmented"
      num="04"
      group="Components"
      title="Segmented control"
      desc="A two-state switch for mutually exclusive options that should both stay visible — used for the Monolingual / Bilingual choice. The active pill lifts onto a raised surface."
      spec
    >
      <Block label="Two-state switch">
        <AnnoStage
          annos={[
            H, W,
            lead(0.98, 0.1, 38, -26, "track radius · 10", "r"),
            lead(0.25, 0.5, 70, 26, "pill · 32 · r-8", "r"),
            lead(0.02, 0.9, -34, 28, "padding · 3", "l"),
          ]}
        >
          <Segmented
            options={[{ value: "mono", label: "Monolingual" }, { value: "bi", label: "Bilingual" }]}
            value={mode}
            onChange={setMode}
          />
        </AnnoStage>
      </Block>

      <Block label="Compact">
        <Cell tag="compact" variant="row" annos={[H]}>
          <Segmented
            size="compact"
            options={[{ value: "mono", label: "Mono" }, { value: "bi", label: "Bi" }]}
            value={short}
            onChange={setShort}
          />
        </Cell>
      </Block>

      <Block label="Specs">
        <SpecCols groups={SPECS} />
      </Block>
    </Section>
  );
}
