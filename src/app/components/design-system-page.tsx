import { BrandSection } from "./design-system/sections/brand";
import { ColorsSection } from "./design-system/sections/colors";
import { TypographySection } from "./design-system/sections/typography";
import { ShapeSection } from "./design-system/sections/shape";
import { ButtonsSection } from "./design-system/sections/buttons";
import { InputsSection } from "./design-system/sections/inputs";
import { BadgesSection } from "./design-system/sections/badges";
import { CardsSection } from "./design-system/sections/cards";
import { NavSection } from "./design-system/sections/nav";
import { SourceChipsSection } from "./design-system/sections/source-chips";

const ANCHORS: { href: string; label: string }[] = [
  { href: "#brand", label: "Brand" },
  { href: "#colors", label: "Color" },
  { href: "#type", label: "Type" },
  { href: "#shape", label: "Shape" },
  { href: "#buttons", label: "Buttons" },
  { href: "#inputs", label: "Inputs" },
  { href: "#badges", label: "Badges" },
  { href: "#cards", label: "Cards" },
  { href: "#nav", label: "Nav" },
  { href: "#sources", label: "Sources" },
];

const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

/**
 * `/design-system` — a single scrollable board documenting the real
 * TranscribeToText system. Foundations are rendered from live theme.css tokens;
 * components are the project's own (Button, Input, Badge, SourceIcon) so the
 * board can't drift from the app. Reachable by URL only — no nav link.
 */
export function DesignSystemPage() {
  return (
    <div className="min-h-screen w-full bg-sidebar font-sans text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-border bg-sidebar/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/images/logo-mark.svg" alt="" className="h-6" />
            <span className="text-[14px] font-semibold tracking-tight text-foreground">Design system</span>
          </a>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {ANCHORS.map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="rounded-full px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {a.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto flex max-w-[1180px] scroll-mt-20 flex-col gap-6 px-6 py-10">
        {/* Hero */}
        <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <img src="/images/logo-full.svg" alt="TranscribeToText" className="h-9 self-start" />
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
              TranscribeToText — design system
            </h1>
            <p className="max-w-[68ch] text-[14px] leading-relaxed text-muted-foreground">
              The visual foundations and components behind the product, on one canvas. A clean, bright,
              low-chrome productivity UI: one blue accent, a cool-tinted neutral ramp, Inter throughout,
              hairline borders over heavy shadow. Foundations read from live tokens; components are the
              real app primitives.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground" style={{ fontFamily: MONO }}>
            <span>Inter variable</span>
            <span>·</span>
            <span>OKLCH color</span>
            <span>·</span>
            <span>React + Tailwind v4 · shadcn</span>
            <span>·</span>
            <span>tokens: src/styles/theme.css</span>
          </div>
        </div>

        <BrandSection />
        <ColorsSection />
        <TypographySection />
        <ShapeSection />
        <ButtonsSection />
        <InputsSection />
        <BadgesSection />
        <CardsSection />
        <NavSection />
        <SourceChipsSection />

        <footer className="px-2 pb-10 pt-2 text-[11px] text-muted-foreground" style={{ fontFamily: MONO }}>
          TranscribeToText design system · tokens sourced from src/styles/theme.css · light theme
        </footer>
      </main>
    </div>
  );
}
