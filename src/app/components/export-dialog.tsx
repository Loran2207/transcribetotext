import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/app/components/ui/command";
import { Icon } from "@/app/components/ui/icon";
import { toastExported } from "./app-toast";
import { Loading01Icon, CheckmarkCircle02Icon, Alert02Icon, ArrowDown01Icon, ArrowUp01Icon, ArrowRight01Icon, Download01Icon, Tick02Icon, Add01Icon, Cancel01Icon, LeftToRightListBulletIcon } from "@hugeicons/core-free-icons";
import { usePlan } from "./use-plan";
import { LANGUAGES } from "./language-context";
import {
  runExportPlan, transformForExport, DEFAULT_EXPORT_OPTIONS, FORMAT_META,
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
  format: "txt",
  includeTranscript: true,
  includeSummary: false,
  includeAudio: false,
  includeTranslation: false,
  translationLanguage: "es",
  options: DEFAULT_EXPORT_OPTIONS,
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
        <p className="font-semibold text-[14px] text-foreground leading-[20px]">{record.title}</p>
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
  const [progress, setProgress] = useState(0);

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
  const addable = (availableRecords ?? []).filter((r) => !items.some((i) => i.id === r.id));
  const showNav = true; // unified design: the file list is always present

  function patchShared(patch: Partial<FileSettings>) {
    setShared((prev) => ({ ...prev, ...patch }));
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
      {/* How the files are handed over. Off by default: packing an archive
          makes the server pull every file out of storage first. */}
      <div className="border-b border-border py-[16px]">
        <div className="flex items-center justify-between gap-[12px]">
          <span className={multi ? "font-semibold text-[14.5px] text-foreground" : "font-semibold text-[14.5px] text-muted-foreground"}>
            Download as ZIP archive
          </span>
          <Switch checked={multi && zipEnabled} onCheckedChange={setZipEnabled} disabled={!multi} />
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
                <OptionCheck id="opt-speakers" label="Show speaker names" checked={shared.options.showSpeakers} onChange={(v) => patchOptions("showSpeakers", v)} />
                <OptionCheck id="opt-timestamps" label="Show timestamps" checked={shared.options.showTimestamps} onChange={(v) => patchOptions("showTimestamps", v)} />
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="p-0 gap-0 overflow-hidden flex flex-col bg-background lg:max-w-[960px] max-lg:max-w-none! max-lg:h-[100dvh] max-lg:top-0 max-lg:left-0 max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-none max-lg:border-0" aria-describedby={undefined}>
        <div className="flex items-center justify-between px-[24px] h-[52px] border-b border-border max-lg:shrink-0">
          <DialogTitle className="font-semibold text-[17px] text-foreground">Export</DialogTitle>
        </div>

        {/* Body - fixed height so toggling options never resizes the dialog */}
        <div className="h-[520px] max-lg:h-auto max-lg:flex-1 max-lg:min-h-0">
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
              {showNav && (
                <button
                  type="button"
                  onClick={() => setFilesOpen(true)}
                  className="flex w-full shrink-0 items-center gap-[10px] border-b border-border px-[16px] py-[10px] text-left lg:hidden"
                >
                  <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground">
                    <Icon icon={LeftToRightListBulletIcon} size={15} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                    {items.length === 1 ? "1 file in this export" : `${items.length} files in this export`}
                  </span>
                  <span className="flex shrink-0 items-center gap-[2px] text-[12.5px] font-medium text-primary">
                    Change
                    <Icon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                  </span>
                </button>
              )}
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
              <div className="flex-1 min-w-0 bg-muted/40 border-r border-border overflow-y-auto px-[24px] py-[20px] max-lg:hidden">
                {activeRecord && <TranscriptPreview record={activeRecord} options={shared.options} />}
              </div>
              {settingsPanel}
            </div>
          )}
        </div>

        {/* Below lg the file column lives here instead: over the dialog, with
            room for long names, the same remove, and the records that are still
            outside the export listed underneath so adding is one tap. */}
        {filesOpen && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end lg:hidden">
            <button
              type="button"
              aria-label="Close the file list"
              onClick={() => setFilesOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative flex max-h-[84%] flex-col rounded-t-[20px] border-t border-border bg-background">
              <div className="mx-auto mt-[8px] h-[4px] w-[36px] shrink-0 rounded-full bg-border" />
              <div className="flex shrink-0 items-center justify-between gap-[12px] px-[18px] pb-[10px] pt-[12px]">
                <p className="text-[15px] font-semibold text-foreground">Files in this export</p>
                <Button variant="ghost" onClick={() => setFilesOpen(false)} className="h-[30px] px-[12px] text-[13px] font-medium text-primary">
                  Done
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-[10px] pb-[18px]">
                {items.map((r) => (
                  <div key={r.id} className="flex items-center gap-[8px] rounded-[10px] px-[8px] py-[9px]">
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">{r.title}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove from export"
                        onClick={() => removeItem(r.id)}
                        className="flex size-[28px] shrink-0 items-center justify-center rounded-full text-muted-foreground"
                      >
                        <Icon icon={Cancel01Icon} size={13} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
                {addable.length > 0 && (
                  <>
                    <p className="mt-[8px] border-t border-border px-[8px] pb-[4px] pt-[14px] text-[11.5px] font-medium text-muted-foreground">
                      Add from your records
                    </p>
                    {addable.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => addItem(r)}
                        className="flex w-full items-center gap-[8px] rounded-[10px] px-[8px] py-[9px] text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground/75">{r.title}</span>
                        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full border border-primary/25 text-primary">
                          <Icon icon={Add01Icon} size={13} strokeWidth={2} />
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

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
      </DialogContent>
    </Dialog>
  );
}