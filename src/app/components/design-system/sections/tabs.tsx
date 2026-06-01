import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import { SectionFrame, SubBlock, SpecList } from "../board";

/**
 * The Tabs component ships two variants. `line` (underline) is the one used
 * across the product — records, calendar, templates, the transcription detail
 * tabs. `default` is a segmented pill set. Both are shown live.
 */
export function TabsSection() {
  return (
    <SectionFrame
      id="tabs"
      group="Components"
      title="Tabs"
      description="Section switchers. The underline variant is the product default — counts ride along in a faded span. The segmented variant is available for compact, equal-width choices."
    >
      <SubBlock label="Underline — variant line">
        <Tabs defaultValue="recent" className="w-full max-w-[440px]">
          <TabsList variant="line" className="gap-6">
            <TabsTrigger value="recent" variant="line">Recent</TabsTrigger>
            <TabsTrigger value="starred" variant="line">
              Starred <span className="ml-1 opacity-50">4</span>
            </TabsTrigger>
            <TabsTrigger value="trash" variant="line">
              Trash <span className="ml-1 opacity-50">2</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="pt-3 text-[13px] text-muted-foreground">Most recent records.</TabsContent>
          <TabsContent value="starred" className="pt-3 text-[13px] text-muted-foreground">Records you starred.</TabsContent>
          <TabsContent value="trash" className="pt-3 text-[13px] text-muted-foreground">Recently deleted records.</TabsContent>
        </Tabs>
      </SubBlock>

      <SubBlock label="Segmented — variant default">
        <Tabs defaultValue="transcript" className="w-[340px]">
          <TabsList className="w-full">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
          </TabsList>
        </Tabs>
      </SubBlock>

      <SubBlock label="Specs">
        <div className="flex flex-wrap gap-x-16 gap-y-7">
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-muted-foreground">line</span>
            <SpecList
              rows={[
                ["gap", "24px · gap-6"],
                ["trigger", "pb 8px · text 14px / 500"],
                ["active", "text-primary + 2px underline"],
                ["hover", "text-foreground"],
                ["count", "span · opacity 50 · ml-1"],
                ["rule", "1px border-b under the row"],
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-muted-foreground">default</span>
            <SpecList
              rows={[
                ["list", "36px · h-9 · bg-muted"],
                ["radius", "12px · padding 3px"],
                ["trigger", "flex-1 · text 14px / 500"],
                ["active", "bg-card + sm shadow"],
              ]}
            />
          </div>
        </div>
      </SubBlock>
    </SectionFrame>
  );
}
