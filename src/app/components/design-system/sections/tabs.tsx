import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import { SectionFrame, SubBlock, SpecList } from "../board";

/**
 * Tabs in the product are always the `line` (underline) variant — records,
 * calendar, templates, the transcription detail tabs. The component also has a
 * segmented `default` variant, but it's unused here, so it isn't shown; for a
 * two-state toggle see the Segmented control below.
 */
export function TabsSection() {
  return (
    <SectionFrame
      id="tabs"
      group="Components"
      title="Tabs"
      description="Section switchers, always the underline style. The active tab takes the brand blue with a 2px rule; an optional count rides along in a faded span."
    >
      <SubBlock label="Underline">
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

      <SubBlock label="Specs">
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
      </SubBlock>
    </SectionFrame>
  );
}
