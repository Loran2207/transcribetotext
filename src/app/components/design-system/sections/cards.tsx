import { Progress } from "../../ui/progress";
import { Section, Block, SpecCols } from "../board";
import { AnnoStage, H, W, lead } from "../annotate";

const SPECS = [
  { title: "Content card", rows: [["radius", "14px"], ["border", "1px · border-border"], ["shadow", "elevation-sm"], ["padding", "16px"], ["fill", "card · white"]] },
  { title: "Action card", rows: [["radius", "16px"], ["fill", "muted · gray"], ["padding", "16px"], ["label", "15px / 500 · centered"], ["art", "pastel tint + lift on hover"]] },
  { title: "Progress", rows: [["height", "5px"], ["radius", "full"], ["track", "muted"], ["fill", "primary"]] },
] satisfies { title: string; rows: [string, string][] }[];

function ContentCard() {
  return (
    <div className="w-[260px] overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2.5 px-4 py-4">
        <div className="text-[16px] font-bold text-foreground">You on Free plan</div>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-foreground">10 <span className="font-normal text-muted-foreground">of 120 mins</span></span>
          <span className="text-[11px] font-medium text-muted-foreground">8%</span>
        </div>
        <Progress value={8} className="h-[5px]" />
        <div className="text-[10.5px] text-muted-foreground">Resets on 04/10/2026</div>
      </div>
    </div>
  );
}

function ActionCard() {
  return (
    <div className="flex w-[160px] flex-col justify-end overflow-hidden rounded-[16px] bg-muted">
      <div className="flex flex-1 items-center justify-center p-4">
        <span className="h-[46px] w-[54px] rounded-[6px] border-2 border-white shadow-sm" style={{ background: "#E3F0FE" }} />
      </div>
      <div className="px-4 pb-4 text-center text-[15px] font-medium text-foreground">Audio &amp; video</div>
    </div>
  );
}

export function CardsSection() {
  return (
    <Section
      id="cards"
      num="07"
      group="Components"
      title="Cards"
      desc="Content cards are white with a 1px border, sm shadow and 14px radius. Dashboard action cards swap to a muted-gray fill, 16px radius, a centered label and a pastel mini-illustration."
      spec
    >
      <Block label="Content card">
        <AnnoStage annos={[H, W, lead(0.99, 0.05, 40, -24, "radius · 14", "r"), lead(0.5, 0.0, 70, -34, "border · 1px", "r"), lead(0.04, 0.5, -38, 30, "padding · 16", "l")]}>
          <ContentCard />
        </AnnoStage>
      </Block>

      <Block label="Action card">
        <AnnoStage annos={[H, W, lead(0.99, 0.06, 40, -24, "radius · 16", "r"), lead(0.5, 0.9, 60, 26, "label · 15 / 500", "r")]}>
          <ActionCard />
        </AnnoStage>
      </Block>

      <Block label="Specs">
        <SpecCols groups={SPECS} />
      </Block>
    </Section>
  );
}
