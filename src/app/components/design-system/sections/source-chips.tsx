import { SourceIcon, type SourceType } from "../../source-icons";
import { SectionFrame, SubBlock } from "../board";

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

export function SourceChipsSection() {
  return (
    <SectionFrame
      id="sources"
      group="Components"
      title="Source chips"
      description="Every record carries its origin. Brand and platform marks are hand-rolled multicolor SVGs (SourceIcon) — color-accurate, reused everywhere a source appears."
    >
      <SubBlock label="Platform & file marks">
        <div className="flex flex-wrap gap-2.5">
          {CHIPS.map((chip) => (
            <span
              key={chip.source}
              className="inline-flex h-[30px] items-center gap-2 rounded-full border border-border bg-card pl-2 pr-3 text-[12.5px] font-medium text-foreground"
            >
              <span className="flex size-[18px] items-center justify-center [&_svg]:size-[18px]">
                <SourceIcon source={chip.source} />
              </span>
              {chip.label}
            </span>
          ))}
        </div>
      </SubBlock>
    </SectionFrame>
  );
}
