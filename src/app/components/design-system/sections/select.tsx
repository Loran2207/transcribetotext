import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Label } from "../../ui/label";
import { SectionFrame, SubBlock, SpecList } from "../board";

const LANGS = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "ja", label: "日本語" },
];

/**
 * The shadcn Select — used wherever a single value is picked from a longer list
 * (share permissions, template fields, translation language). The menu floats
 * on the md elevation. For searchable language pickers the product layers a
 * popover + text filter on top of this primitive.
 */
export function SelectSection() {
  return (
    <SectionFrame
      id="select"
      group="Components"
      title="Select"
      description="A dropdown for one-of-many. Reach for it over a segmented control once the options stop fitting on a line. The trigger mirrors the input shape; the menu floats on the md elevation."
    >
      <SubBlock label="Default & compact">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex w-[220px] flex-col gap-1.5">
            <Label className="text-[13px]">Transcription language</Label>
            <Select defaultValue="en">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px]">Access</Label>
            <Select defaultValue="invited">
              <SelectTrigger className="h-8 w-auto min-w-[150px] rounded-[12px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invited">Only invited people</SelectItem>
                <SelectItem value="link">Anyone with the link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SubBlock>

      <SubBlock label="Specs">
        <div className="flex flex-wrap gap-x-16 gap-y-7">
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-muted-foreground">Trigger</span>
            <SpecList
              rows={[
                ["height", "36px · h-9 (compact 32px)"],
                ["radius", "12px"],
                ["padding", "0 12px"],
                ["text", "14px (compact 12px)"],
                ["border", "1px · border-input"],
                ["icon", "chevron · 16px · muted"],
              ]}
            />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-muted-foreground">Menu</span>
            <SpecList
              rows={[
                ["surface", "popover · white"],
                ["elevation", "elevation-md"],
                ["radius", "8px"],
                ["item", "selected = accent + check"],
              ]}
            />
          </div>
        </div>
      </SubBlock>
    </SectionFrame>
  );
}
