import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/app/components/ui/command";
import { Icon } from "@/app/components/ui/icon";
import { toastExported } from "./app-toast";
import { Loading01Icon, CheckmarkCircle02Icon, Alert02Icon, ArrowDown01Icon, ArrowUp01Icon, Download01Icon, Tick02Icon, Add01Icon, Cancel01Icon, PencilEdit02Icon, Delete02Icon, MoreHorizontal, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { usePlan } from "./use-plan";
import { LANGUAGES } from "./language-context";
import { EMPTY_EXPORT_SETTINGS, useExportPresets, type ExportPreset, type ExportPresetSettings } from "./export-presets-context";
import {
  runExportPlan, transformForExport, FORMAT_META,
  type ExportableRecord, type ExportFormat, type ExportContentOptions, type ExportFilePlan, type ExportManifest,
} from "@/lib/export-formats";

/* ══════════════════════════════════════════════
   Export Dialog v5 - unified single & batch export
   · one settings panel, applied to every file
   · batch: left file tabs (preview per file), files
     can be removed from / added to the export
   · batch: editable zip name
   · fixed-height shell, processing → success manifest
   ══════════════════════════════════════════════ */

type Phase = "form" | "processing" | "success" | "error";

interface FileSettings {
  format: ExportFormat;
  includeTranscript: boolean;
  includeSummary: boolean;
  includeAudio: boolean;
  includeTranslation: boolean;
  translationLanguage: string;
  options: ExportContentOptions;
}

const DEFAULT_SETTINGS: FileSettings = {
  format: EMPTY_EXPORT_SETTINGS.format,
  includeTranscript: EMPTY_EXPORT_SETTINGS.includeTranscript,
  includeSummary: EMPTY_EXPORT_SETTINGS.includeSummary,
  includeAudio: EMPTY_EXPORT_SETTINGS.includeAudio,
  includeTranslation: EMPTY_EXPORT_SETTINGS.includeTranslation,
  translationLanguage: EMPTY_EXPORT_SETTINGS.translationLanguage,
  options: EMPTY_EXPORT_SETTINGS.options,
};

interface FormatChoice { format: ExportFormat; label: string; pro: boolean; }
const FORMAT_CHOICES: FormatChoice[] = [
  { format: "txt", label: "Plain text", pro: false },
  { format: "docx", label: "Word", pro: true },
  { format: "pdf", label: "PDF", pro: true },
  { format: "srt", label: "SRT subtitles", pro: true },
  { format: "vtt", label: "VTT subtitles", pro: true },
];

const FORMAT_COLORS: Record<string, { fg: string; dogEar: string }> = {
  txt: { fg: "#475467", dogEar: "#98A2B3" },
  docx: { fg: "#155EEF", dogEar: "#84ADFF" },
  pdf: { fg: "#D92D20", dogEar: "#FDA29B" },
  srt: { fg: "#7A5AF8", dogEar: "#BDB4FE" },
  vtt: { fg: "#0E9384", dogEar: "#5FE9D0" },
  zip: { fg: "#DC6803", dogEar: "#FEC84B" },
  mp3: { fg: "#DD2590", dogEar: "#FAA7E0" },
};

export function FormatIcon({ format, size = 26 }: { format: string; size?: number }) {
  const c = FORMAT_COLORS[format] ?? FORMAT_COLORS.txt;
  const w = Math.round(size * 0.82);
  return (
    <span className="inline-flex shrink-0 items-center justify-center select-none" style={{ width: w, height: size }}>
      <svg width={w} height={size} viewBox="0 0 26 32" fill="none">
        <path d="M1 5a4 4 0 0 1 4-4h12.2L25 7.8V27a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V5z" fill={c.fg} />
        <path d="M17.2 1L25 7.8h-5.8a2 2 0 0 1-2-2V1z" fill={c.dogEar} />
        <text x="13" y="23.5" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="700" fontSize={format.length > 3 ? 7 : 8.4} letterSpacing="0.2">{format.toUpperCase().slice(0, 4)}</text>
      </svg>
    </span>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

function safeName(s: string): string {
  return (s.replace(/[\\/:*?"<>|]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "transcript");
}

function settingsFromPreset(preset: ExportPreset): FileSettings {
  const { zipEnabled: _zipEnabled, ...settings } = preset.settings;
  return { ...settings, options: { ...settings.options } };
}

function settingsForPreset(shared: FileSettings, zipEnabled: boolean): ExportPresetSettings {
  return { ...shared, zipEnabled, options: { ...shared.options } };
}

function sameSettings(left: ExportPresetSettings, right: ExportPresetSettings) {
  return left.format === right.format
    && left.includeTranscript === right.includeTranscript
    && left.includeSummary === right.includeSummary
    && left.includeAudio === right.includeAudio
    && left.includeTranslation === right.includeTranslation
    && left.translationLanguage === right.translationLanguage
    && left.zipEnabled === right.zipEnabled
    && left.options.showSpeakers === right.options.showSpeakers
    && left.options.showTimestamps === right.options.showTimestamps
    && left.options.combineSameSpeaker === right.options.combineSameSpeaker
    && left.options.combineAll === right.options.combineAll;
}

function suggestedPresetName(format: ExportFormat) {
  if (format === "srt") return "SRT captions";
  if (format === "vtt") return "VTT captions";
  if (format === "docx") return "Word document";
  if (format === "pdf") return "PDF document";
  return "Plain text";
}

/* The shared useIsMobile draws the line at 1024, because it means "compact
   layout" and a tablet belongs there. A bottom sheet does not: the adaptives
   put a centred card on a tablet and keep the sheet for the phone. */
function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setPhone(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return phone;
}

/* On a phone this project puts a modal on the bottom edge, full width, with
   only its top corners rounded - the sort sheet and the move-to-folder sheet
   are both built that way. On a tablet and up it is a centred card. The body
   is written once and the shell changes under it. */
function Modal({ open, onOpenChange, sheetClass, dialogClass, children }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sheetClass?: string;
  dialogClass?: string;
  children: React.ReactNode;
}) {
  const isPhone = useIsPhone();
  if (isPhone) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={"rounded-t-[22px] p-0 gap-0 flex flex-col " + (sheetClass || "")}>
          {children}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={"p-0 gap-0 overflow-hidden flex flex-col " + (dialogClass || "")} aria-describedby={undefined}>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function SectionRow({ title, enabled, onToggle, disabled, children }: {
  title: string; enabled: boolean; onToggle: (v: boolean) => void; disabled?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-b-0 py-[16px]">
      <div className="flex items-center justify-between">
        <span className={disabled ? "font-semibold text-[14.5px] text-muted-foreground" : "font-semibold text-[14.5px] text-foreground"}>{title}</span>
        <Switch checked={enabled} onCheckedChange={onToggle} disabled={disabled} />
      </div>
      {children}
    </div>
  );
}

function OptionCheck({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-[8px]">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="font-normal text-[13px] text-foreground cursor-pointer leading-[18px]">{label}</Label>
    </div>
  );
}

/* Transcript preview (center pane) - live: reflects the current export options */
function TranscriptPreview({ record, options }: { record: ExportableRecord; options: ExportContentOptions }) {
  const view = transformForExport(record, options);
  record = view;
  return (
    <div className="flex flex-col">
      <div className="mb-[16px] pb-[14px] border-b border-border/70">
        <p className="font-semibold text-[14px] text-foreground leading-[20px] max-lg:hidden">{record.title}</p>
        <p className="mt-[3px] text-[11.5px] text-muted-foreground">
          {[record.metadata?.duration, record.metadata?.date, record.metadata?.language?.toUpperCase()].filter(Boolean).join("  ·  ")}
        </p>
      </div>
      {record.segments.length === 0 && (
        <p className="text-[12.5px] leading-[19px] text-foreground/80">{record.summary || "Transcript preview is not available for this record."}</p>
      )}
      <div className="flex flex-col gap-[14px]">
        {record.segments.map((seg, i) => (
          <div key={i}>
            <p className="flex items-baseline gap-[8px] text-[12px] mb-[3px]">
              <span className="font-semibold text-foreground">{seg.speaker}</span>
              <span className="text-muted-foreground">{seg.timestamp}</span>
            </p>
            <p className="text-[12.5px] leading-[19px] text-foreground/80">{seg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExportDialog({ open, onClose, records, availableRecords }: {
  open: boolean; onClose: () => void; records: ExportableRecord[]; availableRecords?: ExportableRecord[];
}) {
  const plan = usePlan();
  const { presets, createPreset, updatePreset, deletePreset } = useExportPresets();

  const [phase, setPhase] = useState<Phase>("form");
  const [items, setItems] = useState<ExportableRecord[]>(records);
  const [activeId, setActiveId] = useState<string>("");
  const [shared, setShared] = useState<FileSettings>(DEFAULT_SETTINGS);
  const [exportName, setExportName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  // Off by default: a zip costs the server a full download-and-pack pass.
  const [zipEnabled, setZipEnabled] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [manifest, setManifest] = useState<ExportManifest | null>(null);
  /* Below lg there is no room for the file column, so it becomes what it is on
     a desktop anyway - a panel you open. A labelled button reveals it over the
     dialog, with the same remove and the same add inside. */
  const [filesOpen, setFilesOpen] = useState(false);
  const [addOpenMobile, setAddOpenMobile] = useState(false);
  /* Below lg there is room for one pane at a time. Settings is what the export
     is for, so it opens there; the transcript is one tap away rather than gone. */
  const [mobilePane, setMobilePane] = useState<"settings" | "transcript">("settings");
  const [progress, setProgress] = useState(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetDialogMode, setPresetDialogMode] = useState<"create" | "edit" | null>(null);
  const [presetName, setPresetName] = useState("");
  const [deletePresetOpen, setDeletePresetOpen] = useState(false);
  const [changeNoticeDismissed, setChangeNoticeDismissed] = useState(false);

  const multi = items.length > 1;

  // Reset once per open; ttt_export_demo forces a phase for design captures (off by default).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open) { wasOpen.current = false; return; }
    if (wasOpen.current) return;
    wasOpen.current = true;
    const demo = typeof window !== "undefined" ? window.localStorage.getItem("ttt_export_demo") : null;
    // ttt_export_full: design-capture flag - every toggle on, options expanded (off by default)
    const full = typeof window !== "undefined" && window.localStorage.getItem("ttt_export_full") === "1";
    // ttt_export_zip=1 opens the dialog with the archive switch on (design captures).
    const zipOn = typeof window !== "undefined" && window.localStorage.getItem("ttt_export_zip") === "1";
    setZipEnabled(zipOn);
    setItems(records);
    setActiveId(records[0]?.id ?? "");
    setShared(full ? { ...DEFAULT_SETTINGS, includeSummary: true, includeAudio: true, includeTranslation: true } : DEFAULT_SETTINGS);
    setExportName(records.length > 1 ? `transcripts-${records.length}` : "");
    setNameTouched(false);
    setAddOpen(false); setMoreOpen(full); setProgress(0); setManifest(null);
    setSelectedPresetId(null); setPresetDialogMode(null); setPresetName("");
    setDeletePresetOpen(false); setChangeNoticeDismissed(false);
    if (demo === "error") setPhase("error");
    else if (demo === "processing") { setPhase("processing"); setProgress(Math.max(1, Math.floor(records.length / 2))); }
    else if (demo === "success") {
      setManifest({
        downloadName: records.length > 1 ? `transcripts-${records.length}.zip` : `${safeName(records[0]?.title ?? "transcript")}.txt`,
        zipped: records.length > 1,
        files: records.map((r) => ({ name: `${safeName(r.title)}.txt`, format: "txt", bytes: 2048 + (r.title.length * 37) })),
      });
      setPhase("success");
    }
    else setPhase("form");
  }, [open, records]);

  // Keep the default zip name in sync while the user has not edited it.
  useEffect(() => {
    if (!nameTouched) setExportName(items.length > 1 ? `transcripts-${items.length}` : "");
  }, [items, nameTouched]);

  const activeRecord = items.find((r) => r.id === activeId) ?? items[0];
  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? null;
  const currentPresetSettings = settingsForPreset(shared, zipEnabled);
  const selectedPresetChanged = !!selectedPreset && !sameSettings(currentPresetSettings, selectedPreset.settings);
  const addable = (availableRecords ?? []).filter((r) => !items.some((i) => i.id === r.id));
  const showNav = true; // unified design: the file list is always present

  function patchShared(patch: Partial<FileSettings>) {
    setShared((prev) => ({ ...prev, ...patch }));
    setChangeNoticeDismissed(false);
  }
  const patchOptions = (k: keyof ExportContentOptions, v: boolean) => patchShared({ options: { ...shared.options, [k]: v } });

  function removeItem(id: string) {
    const next = items.filter((r) => r.id !== id);
    if (!next.length) return;
    setItems(next);
    if (activeId === id) setActiveId(next[0].id);
  }
  function addItem(r: ExportableRecord) {
    setItems((prev) => (prev.some((i) => i.id === r.id) ? prev : [...prev, r]));
  }

  function selectPreset(id: string) {
    if (id === "none") {
      setSelectedPresetId(null);
      setChangeNoticeDismissed(false);
      return;
    }
    const preset = presets.find((candidate) => candidate.id === id);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setShared(settingsFromPreset(preset));
    setZipEnabled(preset.settings.zipEnabled);
    setMoreOpen(
      preset.settings.options.showSpeakers
      || preset.settings.options.showTimestamps
      || preset.settings.options.combineSameSpeaker
      || preset.settings.options.combineAll,
    );
    setChangeNoticeDismissed(false);
  }

  function openCreatePreset() {
    setPresetName(suggestedPresetName(shared.format));
    setPresetDialogMode("create");
  }

  function openEditPreset() {
    if (!selectedPreset) return;
    setPresetName(selectedPreset.name);
    setPresetDialogMode("edit");
  }

  function savePresetDialog() {
    const name = presetName.trim() || suggestedPresetName(shared.format);
    if (presetDialogMode === "edit" && selectedPreset) {
      updatePreset(selectedPreset.id, { name });
      toast.success("Preset updated", { description: name });
    } else {
      const preset = createPreset(name, currentPresetSettings);
      setSelectedPresetId(preset.id);
      toast.success("Preset saved", { description: name });
    }
    setPresetDialogMode(null);
  }

  function saveAsNewPreset() {
    setPresetName(selectedPreset ? `${selectedPreset.name} copy` : suggestedPresetName(shared.format));
    setPresetDialogMode("create");
  }

  function confirmDeletePreset() {
    if (!selectedPreset) return;
    const name = selectedPreset.name;
    deletePreset(selectedPreset.id);
    setSelectedPresetId(null);
    setDeletePresetOpen(false);
    toast.success("Preset deleted", { description: name });
  }

  const zipFileName = `${safeName(exportName || `transcripts-${items.length}`)}.zip`;

  const plans: ExportFilePlan[] = useMemo(
    () => items.map((r) => ({ record: r, format: shared.format, includeTranscript: shared.includeTranscript, includeSummary: shared.includeSummary, includeAudio: shared.includeAudio, includeTranslation: shared.includeTranslation, translationLanguage: shared.translationLanguage, options: shared.options })),
    [items, shared]
  );
  const nothingSelected = items.length === 0 || (!shared.includeTranscript && !shared.includeSummary && !shared.includeAudio && !shared.includeTranslation);
  const fileCount = nothingSelected ? 0 : items.length * ((shared.includeTranscript ? 1 : 0) + (shared.includeSummary ? 1 : 0) + (shared.includeAudio ? 1 : 0) + (shared.includeTranslation ? 1 : 0));

  const footerSummary = useMemo(() => {
    if (nothingSelected) return "Nothing selected";
    if (fileCount === 1) {
      const r = items[0];
      const base = safeName(r.title);
      if (shared.includeTranscript) return `${base}.${FORMAT_META[shared.format].extension}`;
      if (shared.includeSummary) return `${base}-summary.txt`;
      if (shared.includeTranslation) return `${base}-${shared.translationLanguage}.txt`;
      return `${base}.mp3`;
    }
    const mix: string[] = [];
    if (shared.includeTranscript) mix.push(`${items.length}× ${shared.format.toUpperCase()}`);
    if (shared.includeSummary) mix.push(`${items.length}× summary`);
    if (shared.includeTranslation) mix.push(`${items.length}× ${shared.translationLanguage} translation`);
    if (shared.includeAudio) mix.push(`${items.length}× mp3`);
    return `${mix.join(" · ")}  →  ${zipEnabled ? zipFileName : "separate files"}`;
  }, [items, shared, fileCount, nothingSelected, zipFileName, zipEnabled]);

  async function handleExport() {
    setPhase("processing");
    setProgress(0);
    try {
      if (selectedPreset && selectedPresetChanged) {
        updatePreset(selectedPreset.id, { settings: currentPresetSettings });
      }
      for (let i = 0; i < items.length; i++) {
        await new Promise((r) => setTimeout(r, Math.min(350, 900 / items.length)));
        setProgress(i + 1);
      }
      const m = await runExportPlan(plans, zipFileName, { zip: multi && zipEnabled });
      // Single-file export: no confirmation screen - download and close.
      if (m.files.length === 1) { toastExported(m.downloadName, "Downloaded to your device"); onClose(); return; }
      setManifest(m);
      setPhase("success");
    } catch {
      setPhase("error");
    }
  }

  /* ── settings panel (right) - one set of settings, applied to every file ── */
  const settingsPanel = (
    <div className="w-[340px] shrink-0 overflow-y-auto px-[24px] py-[6px] max-lg:w-full max-lg:shrink max-lg:overflow-visible max-lg:pb-[20px]">
      <div className="pt-[16px]">
        <div className="relative rounded-[10px] border border-border bg-background px-[14px] py-[10px]">
          <span className="block text-[11.5px] font-medium text-muted-foreground">Export preset</span>
          <div className="mt-[3px] flex min-h-[30px] items-center gap-[8px]">
            <Select value={selectedPresetId ?? "none"} onValueChange={selectPreset} disabled={presets.length === 0}>
              <SelectTrigger className="h-[30px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[13.5px] shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100">
                <SelectValue>
                  {selectedPreset ? (
                    <span className="flex min-w-0 items-center gap-[8px]">
                      <FormatIcon format={selectedPreset.settings.format} size={21} />
                      <span className="truncate font-semibold text-foreground">{selectedPreset.name}</span>
                    </span>
                  ) : <span className="font-medium text-foreground">No preset</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No preset</SelectItem>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <span className="flex items-center gap-[8px]"><FormatIcon format={preset.settings.format} size={20} />{preset.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPreset ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent" aria-label="Preset actions">
                    <Icon icon={MoreHorizontal} size={16} strokeWidth={1.8} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[176px]">
                  <DropdownMenuItem className="gap-[8px]" onSelect={openEditPreset}>
                    <Icon icon={PencilEdit02Icon} size={15} strokeWidth={1.7} />Edit preset
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-[8px] text-destructive focus:text-destructive" onSelect={() => setDeletePresetOpen(true)}>
                    <Icon icon={Delete02Icon} size={15} strokeWidth={1.7} />Delete preset
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button type="button" className="shrink-0 text-[12.5px] font-medium text-primary hover:underline" onClick={openCreatePreset}>Save current settings</button>
            )}
          </div>
        </div>
        {selectedPresetChanged && !changeNoticeDismissed && (
          <div className="relative mt-[10px] flex gap-[10px] rounded-[10px] bg-primary/5 px-[12px] py-[10px] pr-[34px]">
            <Icon icon={InformationCircleIcon} size={17} className="mt-[1px] shrink-0 text-primary" strokeWidth={1.6} />
            <div className="min-w-0">
              <p className="text-[12px] leading-[17px] text-foreground">Export will update "{selectedPreset?.name}".</p>
              <button type="button" className="mt-[4px] text-[12px] font-medium text-primary hover:underline" onClick={saveAsNewPreset}>Save as new preset</button>
            </div>
            <button type="button" className="absolute right-[8px] top-[8px] inline-flex size-[22px] items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10" onClick={() => setChangeNoticeDismissed(true)} aria-label="Dismiss">
              <Icon icon={Cancel01Icon} size={11} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
      {/* How the files are handed over. Off by default: packing an archive
          makes the server pull every file out of storage first. */}
      <div className="border-b border-border py-[16px]">
        <div className="flex items-center justify-between gap-[12px]">
          <span className={multi ? "font-semibold text-[14.5px] text-foreground" : "font-semibold text-[14.5px] text-muted-foreground"}>
            Download as ZIP archive
          </span>
          <Switch checked={multi && zipEnabled} onCheckedChange={(value) => { setZipEnabled(value); setChangeNoticeDismissed(false); }} disabled={!multi} />
        </div>
        <p className="mt-[8px] text-[11.5px] leading-[16px] text-muted-foreground">
          {!multi
            ? "A single file downloads on its own. An archive is only worth it for several files."
            : zipEnabled
              ? `All ${items.length} files are packed into one archive.`
              : `Each of the ${items.length} files downloads on its own.`}
        </p>
        {multi && zipEnabled && (
          <div className="relative mt-[12px]">
            <Input
              value={exportName}
              onChange={(e) => { setExportName(e.target.value); setNameTouched(true); }}
              placeholder={`transcripts-${items.length}`}
              className="h-[34px] rounded-[8px] text-[13px] pr-[44px]"
            />
            <span className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 text-[12.5px] text-muted-foreground">.zip</span>
          </div>
        )}
        {multi && (
          <p className="mt-[8px] text-[11.5px] leading-[16px] text-muted-foreground">Settings below apply to all {items.length} files.</p>
        )}
      </div>

      <SectionRow title="Transcript" enabled={shared.includeTranscript} onToggle={(v) => patchShared({ includeTranscript: v })}>
        <div className={shared.includeTranscript ? "mt-[12px] flex flex-col gap-[12px]" : "hidden"}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">File format</span>
            <Select value={shared.format} onValueChange={(v) => patchShared({ format: v as ExportFormat })}>
              <SelectTrigger className="w-[168px] h-[34px] rounded-[8px] text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMAT_CHOICES.map((fc) => (
                  <SelectItem key={fc.format} value={fc.format} disabled={fc.pro && plan === "free"}>
                    <span className="flex items-center gap-[8px]">
                      <FormatIcon format={fc.format} size={20} />
                      {fc.label}
                      {fc.pro && plan === "free" && <span className="text-[10px] font-semibold text-primary uppercase tracking-[0.4px]">Pro</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button type="button" className="flex items-center gap-[4px] text-[13px] text-foreground/70 hover:text-foreground w-fit" onClick={() => setMoreOpen(!moreOpen)}>
            More options
            <Icon icon={moreOpen ? ArrowUp01Icon : ArrowDown01Icon} size={13} strokeWidth={1.8} />
          </button>
          <div className={moreOpen ? "flex flex-col gap-[10px]" : "hidden"}>
            {!shared.options.combineAll && (
              <>
                <div className="grid grid-cols-2 gap-[10px] max-[380px]:grid-cols-1">
                  <OptionCheck id="opt-speakers" label="Show speaker names" checked={shared.options.showSpeakers} onChange={(v) => patchOptions("showSpeakers", v)} />
                  <OptionCheck id="opt-timestamps" label="Show timestamps" checked={shared.options.showTimestamps} onChange={(v) => patchOptions("showTimestamps", v)} />
                </div>
                <OptionCheck id="opt-combine-same" label="Combine paragraphs of the same speaker" checked={shared.options.combineSameSpeaker} onChange={(v) => patchOptions("combineSameSpeaker", v)} />
              </>
            )}
            <OptionCheck id="opt-combine-all" label="Combine all paragraphs" checked={shared.options.combineAll} onChange={(v) => patchOptions("combineAll", v)} />
          </div>
        </div>
      </SectionRow>

      <SectionRow title="Summary" enabled={shared.includeSummary} onToggle={(v) => patchShared({ includeSummary: v })}>
        <p className={shared.includeSummary ? "mt-[6px] text-[12.5px] leading-[18px] text-muted-foreground" : "hidden"}>Exports the AI summary as a separate .txt file.</p>
      </SectionRow>

      <SectionRow title="Translation" enabled={shared.includeTranslation} onToggle={(v) => patchShared({ includeTranslation: v })}>
        <div className={shared.includeTranslation ? "mt-[12px] flex flex-col gap-[10px]" : "hidden"}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Translate to</span>
            <Select value={shared.translationLanguage} onValueChange={(v) => patchShared({ translationLanguage: v })}>
              <SelectTrigger className="w-[168px] h-[34px] rounded-[8px] text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    <span className="flex items-center gap-[8px]">{l.label}<span className="text-[10.5px] text-muted-foreground">{l.short}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[12.5px] leading-[18px] text-muted-foreground">Exports the translated transcript as a separate .txt file.</p>
        </div>
      </SectionRow>

      <SectionRow title="Audio" enabled={shared.includeAudio} onToggle={(v) => patchShared({ includeAudio: v })}>
        <div className={shared.includeAudio ? "mt-[10px] flex items-center justify-between" : "hidden"}>
          <span className="text-[13px] text-muted-foreground">File format</span>
          <span className="flex items-center gap-[8px] text-[13px] text-foreground"><FormatIcon format="mp3" size={20} />mp3</span>
        </div>
      </SectionRow>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!o) onClose(); }}
      sheetClass="bg-background h-[84dvh]"
      dialogClass="bg-background sm:max-w-[560px] max-lg:h-[74dvh] lg:h-[calc(100dvh-24px)] lg:max-h-[634px] lg:max-w-[960px]!"
    >
        <div className="flex items-center gap-[10px] px-[20px] h-[52px] border-b border-border shrink-0 max-md:h-[58px]">
          <DialogTitle className="font-semibold text-[17px] text-foreground">Export</DialogTitle>
          {/* Which files are in the export is an edit, not a row of its own:
              a chip next to the title opens the list. Only below lg, because
              the desktop keeps the list as a column. */}
          <button
            type="button"
            onClick={() => setFilesOpen(true)}
            className="flex shrink-0 items-center gap-[6px] h-[26px] pl-[9px] pr-[11px] rounded-full border border-border bg-card text-muted-foreground active:bg-muted/50 transition-colors lg:hidden"
          >
            <Icon icon={PencilEdit02Icon} size={13} strokeWidth={1.9} />
            <span className="text-[12px] font-medium text-foreground">{items.length === 1 ? "1 file" : `${items.length} files`}</span>
          </button>
        </div>

        {/* Body - fixed height so toggling options never resizes the dialog */}
        <div className="min-h-0 flex-1 overflow-hidden max-lg:h-auto">
          {phase === "processing" ? (
            <div className="flex h-full flex-col items-center justify-center px-[24px]">
              <div className="size-[64px] rounded-full bg-primary/5 flex items-center justify-center mb-[18px]">
                <Icon icon={Loading01Icon} size={28} className="text-primary animate-spin" strokeWidth={1.6} />
              </div>
              <p className="font-semibold text-[16px] text-foreground mb-[4px]">Preparing your export…</p>
              <p className="text-[13px] text-muted-foreground mb-[18px]">{multi ? `File ${Math.min(progress + 1, items.length)} of ${items.length}` : "This only takes a moment"}</p>
              <div className="w-[320px] max-w-full h-[6px] rounded-full bg-muted overflow-hidden mb-[24px]">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.max(8, (progress / Math.max(1, items.length)) * 100)}%` }} />
              </div>
              {multi && (
                <div className="w-[380px] max-w-full max-h-[180px] overflow-y-auto flex flex-col gap-[2px]">
                  {items.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-[10px] h-[30px]">
                      {i < progress
                        ? <Icon icon={Tick02Icon} size={14} className="text-primary shrink-0" strokeWidth={2.2} />
                        : <span className="size-[14px] shrink-0 rounded-full border border-border" />}
                      <span className={"flex-1 truncate text-[12.5px] " + (i < progress ? "text-foreground" : "text-muted-foreground")}>{r.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : phase === "error" ? (
            <div className="flex h-full flex-col items-center justify-center px-[24px]">
              <div className="size-[64px] rounded-full bg-destructive/5 flex items-center justify-center mb-[18px]">
                <Icon icon={Alert02Icon} size={28} className="text-destructive" strokeWidth={1.6} />
              </div>
              <p className="font-semibold text-[16px] text-foreground mb-[4px]">Export failed</p>
              <p className="text-[13px] text-muted-foreground mb-[24px]">Could not export. Please try again.</p>
              <div className="flex items-center gap-[10px]">
                <Button variant="pill-outline" onClick={() => setPhase("form")} className="h-[36px] px-[16px]">
                  <span className="font-medium text-[13px]">Back to settings</span>
                </Button>
                <Button onClick={handleExport} className="h-[36px] px-[20px]">
                  <span className="font-semibold text-[13px]">Try again</span>
                </Button>
              </div>
            </div>
          ) : phase === "success" && manifest ? (
            <div className="flex h-full flex-col items-center px-[24px] pt-[44px]">
              <div className="size-[56px] rounded-full bg-primary/5 flex items-center justify-center mb-[14px]">
                <Icon icon={CheckmarkCircle02Icon} size={26} className="text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-[16px] text-foreground mb-[4px]">Export complete</p>
              <p className="text-[13px] text-muted-foreground mb-[18px]">
                {manifest.zipped
                  ? <>{manifest.files.length} files packed into <span className="font-medium text-foreground">{manifest.downloadName}</span></>
                  : manifest.files.length > 1
                    ? <><span className="font-medium text-foreground">{manifest.files.length} files</span> downloaded separately</>
                    : <><span className="font-medium text-foreground">{manifest.downloadName}</span> has been downloaded</>}
              </p>
              <div className="w-[520px] max-w-full max-h-[240px] overflow-y-auto rounded-[12px] border border-border divide-y divide-border">
                {manifest.files.map((f) => (
                  <div key={f.name} className="flex items-center gap-[12px] h-[42px] px-[14px]">
                    <FormatIcon format={f.format} size={24} />
                    <span className="flex-1 truncate text-[13px] text-foreground">{f.name}</span>
                    <span className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">{formatBytes(f.bytes)}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleExport} className="mt-[18px] flex items-center gap-[8px] text-primary hover:underline">
                <Icon icon={Download01Icon} size={15} strokeWidth={1.8} />
                <span className="font-medium text-[13px]">Download {manifest.downloadName}</span>
              </button>
            </div>
          ) : (
            <div className="flex h-full max-lg:flex-col max-lg:overflow-y-auto">
              {/* Which file you are looking at, and which of its two panes.
                  Both sit clear of the dividers: an underline that lands on a
                  border reads as one thick line and the tabs stop looking like
                  tabs. */}
              <div className="flex w-full shrink-0 items-end gap-[12px] border-b border-border px-[16px] pt-[10px] lg:hidden">
                <span className="min-w-0 flex-1 truncate pb-[10px] text-[13px] font-medium text-foreground">
                  {activeRecord ? activeRecord.title : ""}
                </span>
                <Tabs
                  value={mobilePane}
                  onValueChange={(v) => setMobilePane(v === "transcript" ? "transcript" : "settings")}
                  className="shrink-0"
                >
                  <TabsList variant="line" className="gap-[16px] border-b-0">
                    <TabsTrigger value="settings" variant="line" className="text-[13px]">Settings</TabsTrigger>
                    <TabsTrigger value="transcript" variant="line" className="text-[13px]">Transcript</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {showNav && (
                <nav className="export-tabs w-[212px] shrink-0 border-r border-border bg-muted/30 flex flex-col py-[12px] max-lg:hidden">
                  <p className="px-[18px] pb-[8px] text-[11px] font-medium text-muted-foreground">{items.length === 1 ? "1 file" : `${items.length} files`}</p>
                  <div className="flex-1 min-h-0 overflow-y-auto px-[8px] flex flex-col gap-[2px]">
                    {items.map((r) => {
                      const isActive = activeId === r.id;
                      return (
                        <div
                          key={r.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveId(r.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveId(r.id); }}
                          className={"group flex w-full items-center gap-[6px] h-[34px] pl-[14px] pr-[8px] rounded-full text-[12.5px] cursor-pointer transition-colors " +
                            (isActive ? "bg-primary/5 text-primary font-medium" : "text-foreground/80 hover:bg-foreground/[0.04]")}
                        >
                          <span className="flex-1 min-w-0 truncate text-left">{r.title}</span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              aria-label="Remove from export"
                              onClick={(e) => { e.stopPropagation(); removeItem(r.id); }}
                              className="shrink-0 size-[20px] rounded-full inline-flex items-center justify-center text-muted-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground group-hover:text-muted-foreground"
                            >
                              <Icon icon={Cancel01Icon} size={11} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Always here, so the export never looks like a closed list.
                      Spent, it says why rather than disappearing. */}
                  <div className="px-[8px] pt-[8px] mt-[8px] border-t border-border">
                      <Popover open={addOpen && addable.length > 0} onOpenChange={setAddOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            disabled={addable.length === 0}
                            className="flex w-full items-center gap-[8px] h-[34px] px-[14px] rounded-full text-[12.5px] font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent"
                          >
                            <Icon icon={Add01Icon} size={13} strokeWidth={2} />
                            <span className="truncate">{addable.length === 0 ? "Nothing left to add" : "Add files to export"}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[248px] max-w-[calc(100vw-32px)] p-0 max-lg:w-[300px]" align="end" side="bottom" sideOffset={6}>
                          <Command>
                            <CommandInput placeholder="Search records…" />
                            <CommandList>
                              <CommandEmpty>No records found.</CommandEmpty>
                              <CommandGroup>
                                {addable.map((r) => (
                                  <CommandItem key={r.id} value={r.title} onSelect={() => addItem(r)}>
                                    <span className="truncate">{r.title}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                  </div>
                </nav>
              )}
              {/* Center pane - live preview of the selected file */}
              <div className={"flex-1 min-w-0 bg-muted/40 border-r border-border overflow-y-auto px-[24px] py-[20px] max-lg:px-[16px] max-lg:py-[14px] " + (mobilePane === "transcript" ? "" : "max-lg:hidden")}>
                {activeRecord && <TranscriptPreview record={activeRecord} options={shared.options} />}
              </div>
              <div className={mobilePane === "transcript" ? "max-lg:hidden contents" : "contents"}>{settingsPanel}</div>
            </div>
          )}
        </div>

        {/* Below lg the file column moves into its own modal: it keeps what the
            desktop column has - which file is selected and the remove - and the
            adding is a separate button that opens the picker with its search. */}
        <Modal
          open={filesOpen}
          onOpenChange={setFilesOpen}
          sheetClass="h-[72dvh] lg:hidden"
          dialogClass="sm:max-w-[440px] max-lg:h-[62dvh] lg:hidden"
        >
            <div className="flex shrink-0 items-center px-[20px] h-[52px] max-md:h-[58px] border-b border-border">
              <DialogTitle className="text-[16px] font-semibold text-foreground">Files in this export</DialogTitle>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-[10px] py-[8px] flex flex-col gap-[2px]">
              {items.map((r) => {
                const isActive = activeId === r.id;
                return (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveId(r.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveId(r.id); }}
                    className={"flex w-full items-center gap-[8px] h-[40px] pl-[14px] pr-[8px] rounded-full text-[13px] cursor-pointer " +
                      (isActive ? "bg-primary/5 text-primary font-medium" : "text-foreground/85")}
                  >
                    <span className="flex-1 min-w-0 truncate text-left">{r.title}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove from export"
                        onClick={(e) => { e.stopPropagation(); removeItem(r.id); }}
                        className="shrink-0 size-[26px] rounded-full inline-flex items-center justify-center text-muted-foreground"
                      >
                        <Icon icon={Cancel01Icon} size={12} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 border-t border-border p-[12px]">
              <Button
                variant="pill-outline"
                disabled={addable.length === 0}
                onClick={() => setAddOpenMobile(true)}
                className="w-full h-[38px] gap-[8px] text-[13px] font-medium"
              >
                <Icon icon={Add01Icon} size={14} strokeWidth={2} />
                {addable.length === 0 ? "Nothing left to add" : "Add files to export"}
              </Button>
            </div>
        </Modal>

        {/* The picker, the same Command with its search that the desktop opens
            in a popover - on a phone a popover would be a postage stamp. */}
        <Modal
          open={addOpenMobile}
          onOpenChange={setAddOpenMobile}
          sheetClass="h-[72dvh] lg:hidden"
          dialogClass="sm:max-w-[440px] max-lg:h-[62dvh] lg:hidden"
        >
            <DialogTitle className="px-[20px] pt-[18px] pb-[8px] text-[16px] font-semibold text-foreground">Add files to export</DialogTitle>
            <Command className="flex-1 min-h-0 flex flex-col">
              <CommandInput placeholder="Search records…" />
              <CommandList className="flex-1 min-h-0 max-h-none pb-[8px] max-md:pb-[18px]">
                <CommandEmpty>No records found.</CommandEmpty>
                <CommandGroup>
                  {addable.map((r) => (
                    <CommandItem key={r.id} value={r.title} onSelect={() => { addItem(r); setAddOpenMobile(false); }}>
                      <span className="truncate">{r.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
        </Modal>

        <Modal
          open={presetDialogMode !== null}
          onOpenChange={(next) => { if (!next) setPresetDialogMode(null); }}
          sheetClass="h-auto max-h-[70dvh]"
          dialogClass="sm:max-w-[420px]"
        >
          <div className="border-b border-border px-[20px] py-[17px]">
            <DialogTitle className="text-[17px] font-semibold text-foreground">
              {presetDialogMode === "edit" ? "Edit export preset" : "Save export preset"}
            </DialogTitle>
          </div>
          <div className="px-[20px] py-[20px]">
            <Label htmlFor="export-preset-name" className="mb-[7px] block text-[12.5px] font-medium text-foreground">Preset name</Label>
            <Input
              id="export-preset-name"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") savePresetDialog(); }}
              autoFocus
              className="h-[40px] rounded-[8px]"
            />
          </div>
          <div className="flex items-center justify-end gap-[10px] border-t border-border px-[20px] py-[14px]">
            <Button variant="pill-outline" className="h-[36px] px-[16px] text-[13px]" onClick={() => setPresetDialogMode(null)}>Cancel</Button>
            <Button className="h-[36px] px-[20px] text-[13px] font-semibold" onClick={savePresetDialog}>Save</Button>
          </div>
        </Modal>

        <AlertDialog open={deletePresetOpen} onOpenChange={setDeletePresetOpen}>
          <AlertDialogContent className="max-w-[420px] rounded-[18px] max-md:bottom-0 max-md:left-0 max-md:top-auto max-md:w-full max-md:max-w-none! max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-[22px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{selectedPreset?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>This preset will be removed from Quick export. Your files and transcripts will not change.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDeletePreset}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Footer */}
        <div className="flex items-center gap-[12px] px-[24px] h-[60px] border-t border-border bg-background max-lg:shrink-0">
          {phase === "success" && manifest ? (
            <>
              <div className="flex items-center gap-[8px] flex-1 min-w-0">
                {manifest.zipped && <FormatIcon format="zip" size={22} />}
                <p className="truncate text-[12.5px] text-muted-foreground">{manifest.downloadName}</p>
              </div>
              <Button
                onClick={() => {
                  toastExported(
                    manifest.downloadName,
                    manifest.zipped
                      ? "Archive downloaded"
                      : manifest.files.length + " files downloaded"
                  );
                  onClose();
                }}
                className="h-[36px] px-[18px]"
              >
                <span className="font-semibold text-[13px]">Done</span>
              </Button>
            </>
          ) : phase === "error" ? (
            <>
              <div className="flex-1" />
              <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[16px]">
                <span className="font-medium text-[13px]">Cancel</span>
              </Button>
            </>
          ) : (
            <>
              <p className="flex-1 min-w-0 truncate text-[12.5px] text-muted-foreground">
                <span className="font-semibold text-foreground">{fileCount > 1 ? "Files: " : "Filename: "}</span>{footerSummary}
              </p>
              <Button variant="pill-outline" onClick={onClose} disabled={phase === "processing"} className="h-[36px] px-[16px]">
                <span className="font-medium text-[13px]">Cancel</span>
              </Button>
              <Button onClick={handleExport} disabled={nothingSelected || phase === "processing"} className="h-[36px] px-[20px] gap-[6px]">
                {phase === "processing" && <Icon icon={Loading01Icon} size={14} className="animate-spin" strokeWidth={2} />}
                <span className="font-semibold text-[13px]">Export</span>
              </Button>
            </>
          )}
        </div>
    </Modal>
  );
}
