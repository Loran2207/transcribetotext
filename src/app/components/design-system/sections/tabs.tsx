import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Section, Block, SpecList } from "../board";
import { AnnoStage, lead } from "../annotate";

const SPECS: [string, string][] = [
  ["gap", "24px · gap-6"],
  ["trigger", "pb 8px · text 14px / 500"],
  ["active", "text-primary + 2px underline"],
  ["hover", "text-foreground"],
  ["count", "span · opacity 50 · ml-1"],
  ["rule", "1px border-b under the row"],
];

export function TabsSection() {
  return (
    <Section
      id="tabs"
      num="03"
      group="Components"
      title="Tabs"
      desc="Section switchers, always the underline style. The active tab takes the brand blue with a 2px rule; an optional count rides along in a faded span."
      spec
    >
      <Block label="Underline tabs">
        <AnnoStage
          annos={[
            lead(0.0, 1, -20, 34, "active · text-primary + 2px rule", "l"),
            lead(0.34, 0.3, 18, -30, "gap · 24", "r"),
            lead(0.06, 0.62, -30, 30, "pb · 8", "l"),
          ]}
        >
          <Tabs defaultValue="recent">
            <TabsList variant="line" className="gap-6">
              <TabsTrigger value="recent" variant="line">Recent</TabsTrigger>
              <TabsTrigger value="starred" variant="line">Starred <span className="ml-1 opacity-50">4</span></TabsTrigger>
              <TabsTrigger value="trash" variant="line">Trash <span className="ml-1 opacity-50">2</span></TabsTrigger>
            </TabsList>
          </Tabs>
        </AnnoStage>
      </Block>

      <Block label="Specs">
        <SpecList rows={SPECS} />
      </Block>
    </Section>
  );
}
