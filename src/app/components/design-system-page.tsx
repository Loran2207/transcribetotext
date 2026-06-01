import "./design-system/technical.css";
import { GroupDivider } from "./design-system/board";
import { BrandSection } from "./design-system/sections/brand";
import { ColorsSection } from "./design-system/sections/colors";
import { TypographySection } from "./design-system/sections/typography";
import { ShapeSection } from "./design-system/sections/shape";
import { ButtonsSection } from "./design-system/sections/buttons";
import { InputsSection } from "./design-system/sections/inputs";
import { TabsSection } from "./design-system/sections/tabs";
import { SegmentedSection } from "./design-system/sections/segmented";
import { SelectSection } from "./design-system/sections/select";
import { BadgesSection } from "./design-system/sections/badges";
import { CardsSection } from "./design-system/sections/cards";
import { NavSection } from "./design-system/sections/nav";
import { SourceChipsSection } from "./design-system/sections/source-chips";

const NAV: { group: string; items: { id: string; label: string }[] }[] = [
  {
    group: "Foundations",
    items: [
      { id: "brand", label: "Brand" },
      { id: "colors", label: "Color" },
      { id: "type", label: "Type" },
      { id: "shape", label: "Shape" },
    ],
  },
  {
    group: "Components",
    items: [
      { id: "buttons", label: "Buttons" },
      { id: "inputs", label: "Inputs" },
      { id: "tabs", label: "Tabs" },
      { id: "segmented", label: "Segmented" },
      { id: "select", label: "Select" },
      { id: "badges", label: "Badges" },
      { id: "cards", label: "Cards" },
      { id: "nav", label: "Nav" },
      { id: "sources", label: "Sources" },
    ],
  },
];

/**
 * `/design-system` — the technical board: an engineered spec sheet on blueprint
 * paper. Each component sits alone on a stage where a live measurement engine
 * draws its real dimensions and redline callouts. Foundations read from theme
 * tokens; components are the app's own. Reachable by URL only — no nav link.
 */
export function DesignSystemPage() {
  return (
    <div className="dstech min-h-screen w-full font-sans text-foreground md:grid md:grid-cols-[244px_minmax(0,1fr)] md:items-start">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-white/85 backdrop-blur-sm md:block">
        <div className="flex h-full flex-col gap-5 overflow-y-auto px-[18px] py-6">
          <a href="#top" className="ds-mono flex items-center gap-2.5 text-[12.5px] font-semibold tracking-tight">
            <img src="/images/logo-mark.svg" alt="" className="h-5" />
            <span>Design system</span>
          </a>
          <nav className="flex flex-col gap-px">
            {NAV.map((grp) => (
              <div key={grp.group} className="flex flex-col gap-px">
                <div className="ds-mono mt-4 mb-1.5 px-3 text-[10px] font-semibold text-muted-foreground first:mt-0.5">{grp.group}</div>
                {grp.items.map((it) => (
                  <a
                    key={it.id}
                    href={`#${it.id}`}
                    className="ds-mono group border-l-2 border-transparent px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    <span className="opacity-40 transition-opacity group-hover:opacity-100">#</span>
                    {it.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="ds-mono mt-auto border-t border-border pt-4 text-[10px] leading-relaxed text-muted-foreground">
            v1.0 · light theme
            <br />
            tokens · theme.css
          </div>
        </div>
      </aside>

      {/* Main */}
      <main id="top" className="min-w-0">
        {/* Hero */}
        <header className="border-b border-border bg-white/60 px-6 py-14 sm:px-14">
          <div className="max-w-[1040px]">
            <img src="/images/logo-full.svg" alt="TranscribeToText" className="mb-6 block h-[30px]" />
            <span className="ds-mono mb-4 flex items-center gap-2 text-[11px] font-medium text-primary">
              <span className="text-primary">▍</span> Design system
            </span>
            <h1 className="m-0 mb-4 text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[40px]">
              Every token &amp; component
              <br className="hidden sm:block" /> the product is built from.
            </h1>
            <p className="m-0 max-w-[64ch] text-[15px] leading-[1.7] text-muted-foreground">
              One blue accent, a cool-tinted gray ramp, Inter throughout, and hairline borders instead of heavy
              shadow. The foundations read straight from the live theme tokens and the components are the real app
              primitives — measured on the spot, so what you see here is what ships.
            </p>
            <div className="ds-mono mt-6 flex max-w-[560px] flex-wrap gap-x-3 gap-y-1.5 rounded-[8px] border border-border bg-white/70 px-4 py-3 text-[11px] text-muted-foreground">
              <span>Inter variable</span><span className="opacity-40">·</span>
              <span>OKLCH color</span><span className="opacity-40">·</span>
              <span>React + Tailwind v4 · shadcn</span><span className="opacity-40">·</span>
              <span>tokens: src/styles/theme.css</span>
            </div>
          </div>
        </header>

        <GroupDivider label="Foundations" hint="brand · color · type · shape" />
        <BrandSection />
        <ColorsSection />
        <TypographySection />
        <ShapeSection />

        <GroupDivider label="Components" hint="real app primitives · measured live" />
        <ButtonsSection />
        <InputsSection />
        <TabsSection />
        <SegmentedSection />
        <SelectSection />
        <BadgesSection />
        <CardsSection />
        <NavSection />
        <SourceChipsSection />

        <footer className="ds-mono px-6 py-6 text-[11px] text-muted-foreground sm:px-14">
          TranscribeToText design system · tokens sourced from src/styles/theme.css · light theme
        </footer>
      </main>
    </div>
  );
}
