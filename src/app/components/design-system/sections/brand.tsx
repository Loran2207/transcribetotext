import { Section, Block, Mono } from "../board";
import { brandGradient } from "../tokens";

export function BrandSection() {
  return (
    <Section
      id="brand"
      num="01"
      group="Foundations"
      title="Brand"
      desc="The wordmark sets TRANSCRIBE + TEXT. in heavy weight with a lighter TO bridge; the period is part of the mark. The bubble holds AI over a teal→blue gradient. Use the mark alone only at small sizes."
    >
      <Block label="Logo">
        <div className="flex flex-wrap items-center gap-x-12 gap-y-6 rounded-[12px] border border-border bg-background px-7 py-8">
          <img src="/images/logo-full.svg" alt="TranscribeToText" className="h-9" />
          <img src="/images/logo-mark.svg" alt="AI mark" className="h-11" />
        </div>
      </Block>

      <Block label={`Brand gradient · ${brandGradient.angle}`}>
        <div className="flex flex-wrap items-center gap-5">
          <span className="h-[70px] w-[128px] rounded-[14px]" style={{ background: brandGradient.css }} />
          <span
            className="flex h-[70px] w-[70px] items-center justify-center rounded-[18px] text-[22px] font-extrabold tracking-tight text-white"
            style={{ background: brandGradient.css }}
          >
            AI
          </span>
          <div className="flex max-w-[320px] flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Mono>{brandGradient.teal}</Mono>
              <span className="text-muted-foreground">→</span>
              <Mono>{brandGradient.blue}</Mono>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Reserved for the logo mark and rare hero moments. The UI itself stays flat with solid brand blue — never gradients.
            </p>
          </div>
        </div>
      </Block>
    </Section>
  );
}
