import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Section, Block, SpecCols } from "../board";
import { AnnoStage, H, W, lead } from "../annotate";

const LANGS = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
];

const SPECS = [
  { title: "Trigger", rows: [["height", "36px · h-9 (compact 32px)"], ["radius", "12px"], ["padding", "0 12px"], ["text", "14px (compact 12px)"], ["border", "1px · border-input"], ["icon", "chevron · 16px · muted"]] },
  { title: "Menu", rows: [["surface", "popover · white"], ["elevation", "elevation-md"], ["radius", "8px"], ["item", "selected = accent + check"]] },
] satisfies { title: string; rows: [string, string][] }[];

/** Static recreation of the open menu — the real menu is a click portal. */
function FloatingMenu() {
  return (
    <div className="w-[220px] rounded-[8px] border border-border bg-popover p-1 shadow-md">
      <div className="flex h-8 items-center justify-between gap-2 rounded-[6px] bg-accent px-2.5 text-[14px] text-foreground">
        Only invited people
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
      </div>
      <div className="flex h-8 items-center rounded-[6px] px-2.5 text-[14px] text-foreground">Anyone with the link</div>
    </div>
  );
}

export function SelectSection() {
  return (
    <Section
      id="select"
      num="05"
      group="Components"
      title="Select"
      desc="A dropdown for one-of-many. Reach for it over a segmented control once the options stop fitting on a line. The trigger mirrors the input shape; the menu floats on the md elevation."
      spec
    >
      <Block label="Trigger">
        <AnnoStage
          annos={[H, W, lead(0.99, 0.12, 40, -28, "radius · 12", "r"), lead(0.92, 0.5, 56, 26, "chevron · 16", "r")]}
        >
          <Select defaultValue="en">
            <SelectTrigger style={{ width: 240 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AnnoStage>
      </Block>

      <Block label="Floating menu">
        <AnnoStage
          annos={[
            W,
            lead(0.99, 0.08, 40, -24, "radius · 8", "r"),
            lead(0.5, 0.0, 70, -30, "elevation · md", "r"),
            lead(0.08, 0.25, -34, -20, "selected · accent + check", "l"),
          ]}
        >
          <FloatingMenu />
        </AnnoStage>
      </Block>

      <Block label="Specs">
        <SpecCols groups={SPECS} />
      </Block>
    </Section>
  );
}
