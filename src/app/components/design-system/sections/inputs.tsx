import type { CSSProperties } from "react";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import { Switch } from "../../ui/switch";
import { Section, Block, SpecCols } from "../board";
import { AnnoStage, Cell, StageGrid, H, W, lead } from "../annotate";

const focusStyle: CSSProperties = {
  borderColor: "var(--primary)",
  boxShadow: "0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent)",
};

const SPECS = [
  { title: "Input", rows: [["height", "36px · h-9"], ["radius", "12px"], ["padding", "0 12px · px-3"], ["text", "14px (16px below md)"], ["border", "1px · border-input"], ["focus", "3px ring · ring/20"], ["error", "border-destructive"]] },
  { title: "Checkbox", rows: [["size", "16px · size-4"], ["radius", "4px"], ["checked", "bg-primary"], ["focus", "3px ring"]] },
  { title: "Switch", rows: [["track", "36×20 · w-9 h-5"], ["thumb", "16px · size-4"], ["travel", "16px"], ["checked", "bg-primary"]] },
] satisfies { title: string; rows: [string, string][] }[];

export function InputsSection() {
  return (
    <Section
      id="inputs"
      num="02"
      group="Components"
      title="Inputs & forms"
      desc="Inputs are 1px border, 12px radius, transparent fill. Focus = a 3px brand-blue ring at ~18%; errors swap the border to red with a caption beneath."
      spec
    >
      <Block label="Text field">
        <AnnoStage
          annos={[
            H, W,
            lead(0.99, 0.12, 40, -28, "radius · 12", "r"),
            lead(0.06, 0.5, -46, 30, "px-3 · 12", "l"),
            lead(0.5, 0.5, 96, 26, "text · 14", "r"),
          ]}
        >
          <Input defaultValue="you@example.com" style={{ width: 240, ...focusStyle }} />
        </AnnoStage>
      </Block>

      <Block label="States">
        <StageGrid>
          <Cell tag="default" variant="mini" annos={[]}>
            <Input placeholder="you@example.com" style={{ width: 200 }} />
          </Cell>
          <Cell tag="focus · ring/18" variant="mini" annos={[]}>
            <Input type="password" defaultValue="secret123" style={{ width: 200, ...focusStyle }} />
          </Cell>
          <Cell tag="error" variant="mini" annos={[]}>
            <Input aria-invalid placeholder="Client Meetings" style={{ width: 200 }} />
          </Cell>
        </StageGrid>
      </Block>

      <Block label="Selection controls">
        <StageGrid>
          <Cell tag="checkbox · size-4" variant="row" annos={[H, W, lead(1, 0.1, 30, -22, "radius · 4", "r")]}>
            <Checkbox defaultChecked />
          </Cell>
          <Cell tag="switch · w-9 h-5" variant="row" annos={[H, W, lead(0.86, 0.5, 40, 24, "thumb · 16", "r")]}>
            <Switch defaultChecked />
          </Cell>
        </StageGrid>
      </Block>

      <Block label="Specs">
        <SpecCols groups={SPECS} />
      </Block>
    </Section>
  );
}
