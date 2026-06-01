import { Section, Block, Swatch } from "../board";
import { colorGroups } from "../tokens";

export function ColorsSection() {
  return (
    <Section
      id="colors"
      num="02"
      group="Foundations"
      title="Color"
      desc="All colors are OKLCH. One blue accent, a cool-tinted neutral ramp, red as the only other saturated hue. Click any swatch to copy its token."
    >
      {colorGroups.map((group) => (
        <Block key={group.id} label={group.title}>
          <p className="-mt-1 max-w-[64ch] text-[12px] leading-relaxed text-muted-foreground">{group.note}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-6">
            {group.tokens.map((t) => (
              <Swatch key={t.name} css={t.css} name={t.name} value={t.value} usage={t.usage} outline={t.outline} />
            ))}
          </div>
        </Block>
      ))}
    </Section>
  );
}
