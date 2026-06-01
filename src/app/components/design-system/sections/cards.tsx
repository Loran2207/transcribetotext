import { Progress } from "../../ui/progress";
import { SectionFrame, SubBlock, Mono, SpecList } from "../board";

export function CardsSection() {
  return (
    <SectionFrame
      id="cards"
      group="Components"
      title="Cards"
      description="Content cards are white with a 1px border, sm shadow and 14px radius. Dashboard action cards swap to a muted-gray fill, 16px radius, a centered medium label and a pastel mini-illustration."
    >
      <SubBlock label="Content card · action card">
        <div className="flex flex-wrap items-stretch gap-5">
          {/* Plan / usage card */}
          <div className="w-[260px] overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-2.5 px-4 py-4">
              <div className="text-[16px] font-bold text-foreground">You on Free plan</div>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold text-foreground">
                  10 <span className="font-normal text-muted-foreground">of 120 mins</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">8%</span>
              </div>
              <Progress value={8} className="h-[5px]" />
              <div className="text-[10.5px] text-muted-foreground">Resets on 04/10/2026</div>
            </div>
          </div>

          {/* Dashboard action card */}
          <div className="flex w-[160px] flex-col justify-end overflow-hidden rounded-[16px] bg-muted">
            <div className="flex flex-1 items-center justify-center p-4">
              <span
                className="h-[46px] w-[54px] rounded-[6px] border-2 border-white shadow-sm"
                style={{ background: "#E3F0FE" }}
              />
            </div>
            <div className="px-4 pb-4 text-center text-[15px] font-medium text-foreground">Audio &amp; video</div>
          </div>
        </div>
      </SubBlock>

      <SubBlock label="Specs">
        <div className="flex flex-wrap gap-x-16 gap-y-7">
          <div className="flex flex-col gap-3">
            <Mono>Content card</Mono>
            <SpecList
              rows={[
                ["radius", "14px"],
                ["border", "1px · border-border"],
                ["shadow", "elevation-sm"],
                ["padding", "16px"],
                ["fill", "card · white"],
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Mono>Action card</Mono>
            <SpecList
              rows={[
                ["radius", "16px"],
                ["fill", "muted · gray"],
                ["padding", "16px"],
                ["label", "15px / 500 · centered"],
                ["art", "pastel tint + lift on hover"],
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Mono>Progress</Mono>
            <SpecList
              rows={[
                ["height", "5px"],
                ["radius", "full"],
                ["track", "muted"],
                ["fill", "primary"],
              ]}
            />
          </div>
        </div>
      </SubBlock>
    </SectionFrame>
  );
}
