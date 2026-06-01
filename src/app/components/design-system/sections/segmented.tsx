import { useState } from "react";
import { SectionFrame, SubBlock, SpecList } from "../board";

/**
 * A bespoke segmented control — the Mono/Bilingual switch in the transcription
 * settings. Distinct from Tabs: it's a standalone two-state toggle, not a tab
 * set. A muted track holds pills; the active pill lifts onto a white surface.
 */

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
        "self-start " +
        (compact
          ? "inline-flex h-[40px] items-center rounded-[12px] border border-border bg-muted/70 p-[3px]"
          : "inline-flex rounded-[10px] border border-border bg-muted p-[3px]")
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
              (compact
                ? "h-full min-w-[58px] rounded-[9px] px-[14px] text-[12px] "
                : "h-[32px] min-w-[120px] rounded-[8px] px-[16px] text-[13px] ") +
              "font-medium transition-all " +
              (active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedSection() {
  const [mode, setMode] = useState<"mono" | "bi">("mono");
  const [short, setShort] = useState<"mono" | "bi">("mono");
  return (
    <SectionFrame
      id="segmented"
      group="Components"
      title="Segmented control"
      description="A two-state switch for mutually exclusive options that should both stay visible — used for the Monolingual / Bilingual choice. Try it: the active pill slides onto a raised surface."
    >
      <SubBlock label="Default">
        <Segmented
          options={[
            { value: "mono", label: "Monolingual" },
            { value: "bi", label: "Bilingual" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </SubBlock>

      <SubBlock label="Compact">
        <Segmented
          size="compact"
          options={[
            { value: "mono", label: "Mono" },
            { value: "bi", label: "Bi" },
          ]}
          value={short}
          onChange={setShort}
        />
      </SubBlock>

      <SubBlock label="Specs">
        <div className="flex flex-wrap gap-x-16 gap-y-7">
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-muted-foreground">track</span>
            <SpecList
              rows={[
                ["radius", "10px (compact 12px)"],
                ["padding", "3px"],
                ["fill", "muted + 1px border"],
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-muted-foreground">pill</span>
            <SpecList
              rows={[
                ["height", "32px (compact 34px)"],
                ["radius", "8px (compact 9px)"],
                ["text", "13px / 500 (compact 12px)"],
                ["active", "bg-background + sm shadow"],
                ["idle", "muted-foreground · hover foreground"],
              ]}
            />
          </div>
        </div>
      </SubBlock>
    </SectionFrame>
  );
}
