import { SourceIcon, type SourceType } from "../../source-icons";
import { Section, Block, SpecList } from "../board";
import { AnnoStage, Cell, StageGrid, H, W, lead } from "../annotate";

const CHIPS: { source: SourceType; label: string }[] = [
  { source: "google-meet", label: "Google Meet" },
  { source: "zoom", label: "Zoom" },
  { source: "teams", label: "Teams" },
  { source: "youtube", label: "YouTube" },
  { source: "dropbox", label: "Dropbox" },
  { source: "google-sheets", label: "Google Sheets" },
  { source: "microphone", label: "Recording" },
  { source: "mp4", label: "interview.mp4" },
  { source: "mp3", label: "podcast.mp3" },
  { source: "folder", label: "Client Meetings" },
];

const SPECS: [string, string][] = [
  ["height", "30px"],
  ["padding", "0 12px / 0 8px (icon side)"],
  ["gap", "8px"],
  ["icon", "18px"],
  ["text", "12.5px / 500"],
  ["radius", "full"],
  ["border", "1px · border-border"],
];

function Chip({ source, label }: { source: SourceType; label: string }) {
  return (
    <span className="inline-flex h-[30px] items-center gap-2 rounded-full border border-border bg-card pl-2 pr-3 text-[12.5px] font-medium text-foreground">
      <span className="flex size-[18px] items-center justify-center [&_svg]:size-[18px]">
        <SourceIcon source={source} />
      </span>
      {label}
    </span>
  );
}

export function SourceChipsSection() {
  return (
    <Section
      id="sources"
      num="09"
      group="Components"
      title="Source chips"
      desc="Every record carries its origin. Brand and platform marks are hand-rolled multicolor SVGs — color-accurate, reused everywhere a source appears."
      spec
    >
      <Block label="Anatomy">
        <AnnoStage annos={[H, W, lead(0.99, 0.12, 38, -24, "radius · full", "r"), lead(0.08, 0.5, -36, 28, "icon · 18", "l"), lead(0.2, 0.5, 60, 26, "gap · 8", "r")]}>
          <Chip source="google-meet" label="Google Meet" />
        </AnnoStage>
      </Block>

      <Block label="All platform & file marks">
        <StageGrid>
          {CHIPS.map((c) => (
            <Cell key={c.source} tag={c.source} variant="mini" annos={[]}>
              <Chip source={c.source} label={c.label} />
            </Cell>
          ))}
        </StageGrid>
      </Block>

      <Block label="Specs">
        <SpecList rows={SPECS} />
      </Block>
    </Section>
  );
}
