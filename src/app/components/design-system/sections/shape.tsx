import { Section, Block, Mono } from "../board";
import { radii, elevations } from "../tokens";

export function ShapeSection() {
  return (
    <Section
      id="shape"
      num="04"
      group="Foundations"
      title="Shape & elevation"
      desc="Base radius is 10px on a 6→26px scale. Every button is a pill. Just two elevation steps — cards usually lean on a 1px border instead of a shadow."
    >
      <Block label="Radius — base 10px · buttons always full">
        <div className="flex flex-wrap items-end gap-5">
          {radii.map((r) => (
            <div key={r.name} className="flex flex-col items-start gap-2">
              <span
                className="h-12 w-[58px] border border-border bg-secondary"
                style={{ borderRadius: r.css, background: r.name === "full" ? "var(--primary)" : undefined }}
              />
              <Mono>{r.name} · {r.px}</Mono>
            </div>
          ))}
        </div>
      </Block>

      <Block label="Elevation — two steps only">
        <div className="flex flex-wrap items-start gap-8">
          {elevations.map((e) => (
            <div key={e.name} className="flex flex-col gap-2.5">
              <span
                className="flex h-[56px] w-[170px] items-center justify-center rounded-[12px] bg-card text-[12px] text-muted-foreground"
                style={{ boxShadow: e.css }}
              >
                {e.use}
              </span>
              <Mono>{e.name} · {e.value}</Mono>
            </div>
          ))}
        </div>
      </Block>
    </Section>
  );
}
