import { forwardRef, useState, type ReactElement } from "react";
import { toast } from "sonner";
import { ExportDialog, FormatIcon } from "./export-dialog";
import { useExportPresets, type ExportPreset } from "./export-presets-context";
import { useIsMobile } from "./ui/use-mobile";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { runExportPlan, type ExportableRecord } from "@/lib/export-formats";

function presetSummary(preset: ExportPreset, recordCount: number) {
  const { settings } = preset;
  const parts = [settings.format.toUpperCase()];
  if (recordCount > 1) parts.push(`${recordCount} files`);
  if (settings.includeTranscript) {
    if (settings.options.showSpeakers) parts.push("Speakers");
    if (settings.options.showTimestamps) parts.push("Timestamps");
    if (!settings.options.showSpeakers && !settings.options.showTimestamps) parts.push("Text only");
  }
  if (settings.includeSummary) parts.push("Summary");
  if (settings.includeTranslation) parts.push("Translation");
  if (settings.includeAudio) parts.push("Audio");
  if (recordCount > 1 && settings.zipEnabled) parts.push("ZIP");
  return parts.join(" · ");
}

const PresetItem = forwardRef<HTMLButtonElement, {
  preset: ExportPreset;
  recordCount: number;
  onSelect: () => void;
}>(({ preset, recordCount, onSelect }, ref) => (
  <button
    ref={ref}
    type="button"
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent active:bg-accent"
    onClick={onSelect}
  >
    <FormatIcon format={preset.settings.format} size={25} />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[13.5px] font-semibold text-foreground">{preset.name}</span>
      <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
        {presetSummary(preset, recordCount)}
      </span>
    </span>
  </button>
));

PresetItem.displayName = "PresetItem";

export function QuickExport({ records, availableRecords, trigger }: {
  records: ExportableRecord[];
  availableRecords?: ExportableRecord[];
  trigger: ReactElement;
}) {
  const isMobile = useIsMobile();
  const { presets } = useExportPresets();
  const [quickOpen, setQuickOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function handleOpenChange(open: boolean) {
    if (open && presets.length === 0) {
      setQuickOpen(false);
      setAdvancedOpen(true);
      return;
    }
    setQuickOpen(open);
  }

  async function runPreset(preset: ExportPreset) {
    setQuickOpen(false);
    const { settings } = preset;
    try {
      const manifest = await runExportPlan(
        records.map((record) => ({
          record,
          format: settings.format,
          includeTranscript: settings.includeTranscript,
          includeSummary: settings.includeSummary,
          includeAudio: settings.includeAudio,
          includeTranslation: settings.includeTranslation,
          translationLanguage: settings.translationLanguage,
          options: settings.options,
        })),
        undefined,
        { zip: records.length > 1 && settings.zipEnabled },
      );
      toast.success(`Exported with "${preset.name}"`, { description: manifest.downloadName });
    } catch {
      toast.error("Export failed. Please try again.");
    }
  }

  function openAdvanced() {
    setQuickOpen(false);
    setAdvancedOpen(true);
  }

  return (
    <>
      {isMobile ? (
        <Sheet open={quickOpen} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side="bottom" className="max-h-[78dvh] gap-0 rounded-t-[22px] px-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
            <SheetHeader className="px-2 pb-2 pt-4 text-left">
              <div>
                <SheetTitle className="text-[17px]">Quick export</SheetTitle>
                <SheetDescription className="sr-only">Choose an export preset</SheetDescription>
              </div>
            </SheetHeader>
            <div className="min-h-0 overflow-y-auto">
              {presets.map((preset) => (
                <PresetItem key={preset.id} preset={preset} recordCount={records.length} onSelect={() => void runPreset(preset)} />
              ))}
            </div>
            <div className="mx-3 my-2 h-px bg-border" />
            <button type="button" className="w-full rounded-xl px-3 py-3 text-left text-[14px] font-medium text-primary active:bg-primary/5" onClick={openAdvanced}>
              Advanced export...
            </button>
          </SheetContent>
        </Sheet>
      ) : (
        <DropdownMenu open={quickOpen} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="z-[130] w-[320px] rounded-[14px] p-2">
            <DropdownMenuLabel className="px-3 pb-1.5 pt-2 text-[13px] font-semibold text-foreground">Quick export</DropdownMenuLabel>
            {presets.map((preset) => (
              <DropdownMenuItem key={preset.id} asChild className="p-0 focus:bg-transparent">
                <PresetItem preset={preset} recordCount={records.length} onSelect={() => void runPreset(preset)} />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="mx-2 my-1.5" />
            <DropdownMenuItem className="rounded-lg px-3 py-2.5 text-[13px] font-medium text-primary focus:bg-primary/5 focus:text-primary" onSelect={openAdvanced}>
              Advanced export...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ExportDialog open={advancedOpen} onClose={() => setAdvancedOpen(false)} records={records} availableRecords={availableRecords} />
    </>
  );
}
