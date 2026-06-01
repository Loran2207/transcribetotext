import type { ReactNode } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import { Switch } from "../../ui/switch";
import { SectionFrame, SubBlock, Mono } from "../board";

function Field({ label, children, hint, hintError }: { label: string; children: ReactNode; hint?: string; hintError?: boolean }) {
  return (
    <div className="flex w-[220px] flex-col gap-1.5">
      <Label className="text-[13px]">{label}</Label>
      {children}
      {hint ? (
        <span className={hintError ? "text-[11px] text-destructive" : "text-[11px] text-muted-foreground"}>{hint}</span>
      ) : null}
    </div>
  );
}

export function InputsSection() {
  return (
    <SectionFrame
      id="inputs"
      group="Components"
      title="Inputs & forms"
      description="Inputs are 1px border, 12px radius, transparent fill. Focus = a 3px brand-blue ring at ~18%; errors swap the border to red with a caption beneath."
    >
      <SubBlock label="Text fields">
        <div className="flex flex-wrap items-start gap-6">
          <Field label="Email">
            <Input placeholder="you@example.com" />
          </Field>
          <Field label="Password" hint="Focus to see the brand ring">
            <Input type="password" defaultValue="secret123" autoFocus={false} />
          </Field>
          <Field label="Folder name" hint="Name is required" hintError>
            <Input aria-invalid defaultValue="" placeholder="e.g. Client Meetings" />
          </Field>
        </div>
      </SubBlock>

      <SubBlock label="Toggles">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <label className="flex items-center gap-2.5">
            <Checkbox defaultChecked />
            <span className="text-[13px] text-foreground">Checked</span>
          </label>
          <label className="flex items-center gap-2.5">
            <Checkbox />
            <span className="text-[13px] text-foreground">Unchecked</span>
          </label>
          <div className="flex items-center gap-2.5">
            <Switch defaultChecked />
            <span className="text-[13px] text-foreground">On</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch />
            <span className="text-[13px] text-foreground">Off</span>
          </div>
          <Mono>checked = brand blue</Mono>
        </div>
      </SubBlock>
    </SectionFrame>
  );
}
