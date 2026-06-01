import { SectionFrame, SubBlock, Mono } from "../board";
import { headingScale, bodyScale, weights } from "../tokens";

export function TypographySection() {
  return (
    <SectionFrame
      id="type"
      group="Foundations"
      title="Typography"
      description="Inter only (variable). Headings are semibold at 1.2 line-height; body is the 14px workhorse. Tabular numerals for durations and usage."
    >
      <SubBlock label="Headings">
        <div className="flex flex-col gap-4">
          {headingScale.map((t) => (
            <div key={t.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span style={t.style} className="text-foreground">{t.sample}</span>
              <Mono>{t.label} · {t.spec}</Mono>
            </div>
          ))}
        </div>
      </SubBlock>

      <SubBlock label="Body & labels">
        <div className="flex flex-col gap-3">
          {bodyScale.map((t) => (
            <div key={t.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span style={t.style} className="min-w-[26ch] text-foreground">{t.sample}</span>
              <Mono>{t.label} · {t.spec}</Mono>
            </div>
          ))}
        </div>
      </SubBlock>

      <SubBlock label="Inter — variable, 4 weights">
        <div className="flex flex-wrap items-end gap-8">
          {weights.map((fw) => (
            <div key={fw.w} className="flex flex-col gap-1">
              <span style={{ fontSize: 30, fontWeight: fw.w }} className="text-foreground">Aa</span>
              <Mono>{fw.w} {fw.name}</Mono>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }} className="text-foreground">0123456789</span>
            <Mono>tabular figures</Mono>
          </div>
        </div>
      </SubBlock>
    </SectionFrame>
  );
}
