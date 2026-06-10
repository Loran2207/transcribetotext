import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Icon } from "@/app/components/ui/icon";
import { toast } from "sonner";
import { Loading01Icon, CheckmarkCircle02Icon, Alert02Icon, ArrowDown01Icon, ArrowUp01Icon, Download01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { usePlan } from "./use-plan";
import {
  runExportPlan, DEFAULT_EXPORT_OPTIONS, FORMAT_META,
  type ExportableRecord, type ExportFormat, type ExportContentOptions, type ExportFilePlan, type ExportManifest,
} from "@/lib/export-formats";

/* ══════════════════════════════════════════════
   Export Dialog v3 — single & multi record export
   · multi: Chrome-style tabs — "All files" + one tab
     per file; a file tab shows ITS preview + settings
   · per-file overrides happen by editing inside a file
     tab; "Reset to shared settings" undoes them
   · fixed-height shell, processing → success manifest
   ══════════════════════════════════════════════ */

type Phase = "form" | "processing" | "success" | "error";

interface FileSettings {
  format: ExportFormat;
  includeTranscript: boolean;
  includeSummary: boolean;
  options: ExportContentOptions;
}

const DEFAULT_SETTINGS: FileSettings = {
  format: "txt",
  includeTranscript: true,
  includeSummary: false,
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

/* Transcript preview (left pane) */
function TranscriptPreview({ record }: { record: ExportableRecord }) {
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

export function ExportDialog({ open, onClose, records }: {
  open: boolean; onClose: () => void; records: ExportableRecord[];
}) {
  const plan = usePlan();
  const multi = records.length > 1;

  const [phase, setPhase] = useState<Phase>("form");
  const [shared, setShared] = useState<FileSettings>(DEFAULT_SETTINGS);
  const [overrides, setOverrides] = useState<Record<string, FileSettings>>({});
  const [activeTab, setActiveTab] = useState<string>("all"); // "all" | record id
  const [moreOpen, setMoreOpen] = useState(false);
  const [manifest, setManifest] = useState<ExportManifest | null>(null);
  const [progress, setProgress] = useState(0);

  // Reset on open; ttt_export_demo forces a phase for design captures (off by default).
  useEffect(() => {
    if (!open) return;
    const demo = typeof window !== "undefined" ? window.localStorage.getItem("ttt_export_demo") : null;
    setShared(DEFAULT_SETTINGS); setOverrides({}); setActiveTab("all"); setMoreOpen(false); setProgress(0); setManifest(null);
    if (demo === "error") setPhase("error");
    else if (demo === "processing") { setPhase("processing"); setProgress(Math.max(1, Math.floor(records.length / 2))); }
    else if (demo === "success") {
      setManifest({
        downloadName: multi ? `transcripts-${records.length}.zip` : `${safeName(records[0]?.title ?? "transcript")}.txt`,
        zipped: multi,
        files: records.map((r) => ({ name: `${safeName(r.title)}.txt`, format: "txt", bytes: 2048 + (r.title.length * 37) })),
      });
      setPhase("success");
    }
    else setPhase("form");
  }, [open, records, multi]);

  const settingsOf = (id: string): FileSettings => overrides[id] ?? shared;
  const editingFileId = multi && activeTab !== "all" ? activeTab : null;
  const current: FileSettings = editingFileId ? settingsOf(editingFileId) : shared;
  const activeRecord = editingFileId ? records.find((r) => r.id === editingFileId) ?? records[0] : records[0];

  function patchCurrent(patch: Partial<FileSettings>) {
    if (editingFileId) setOverrides((prev) => ({ ...prev, [editingFileId]: { ...settingsOf(editingFileId), ...patch } }));
    else setShared((prev) => ({ ...prev, ...patch }));
  }
  const patchOptions = (k: keyof ExportContentOptions, v: boolean) => patchCurrent({ options: { ...current.options, [k]: v } });
  const resetOverride = (id: string) => setOverrides((prev) => { const next = { ...prev }; delete next[id]; return next; });

  const plans: ExportFilePlan[] = useMemo(
    () => records.map((r) => { const st = settingsOf(r.id); return { record: r, format: st.format, includeTranscript: st.includeTranscript, includeSummary: st.includeSummary, options: st.options }; }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, shared, overrides]
  );
  const activePlans = plans.filter((p) => p.includeTranscript || p.includeSummary);
  const nothingSelected = activePlans.length === 0;
  const fileCount = activePlans.reduce((a, p) => a + (p.includeTranscript ? 1 : 0) + (p.includeSummary ? 1 : 0), 0);

  const footerSummary = useMemo(() => {
    if (nothingSelected) return "Nothing selected";
    if (fileCount === 1) {
      const p = activePlans[0];
      const base = safeName(p.record.title);
      return p.includeTranscript ? `${base}.${FORMAT_META[p.format].extension}` : `${base}-summary.txt`;
    }
    const mix = new Map<string, number>();
    for (const p of activePlans) {
      if (p.includeTranscript) mix.set(p.format, (mix.get(p.format) ?? 0) + 1);
      if (p.includeSummary) mix.set("summary", (mix.get("summary") ?? 0) + 1);
    }
    const mixStr = [...mix.entries()].map(([f, n]) => `${n}× ${f === "summary" ? "summary" : f.toUpperCase()}`).join(" · ");
    return `${mixStr}  →  transcripts-${activePlans.length}.zip`;
  }, [activePlans, fileCount, nothingSelected]);

  async function handleExport() {
    setPhase("processing");
    setProgress(0);
    try {
      for (let i = 0; i < activePlans.length; i++) {
        await new Promise((r) => setTimeout(r, Math.min(350, 900 / activePlans.length)));
        setProgress(i + 1);
      }
      const m = await runExportPlan(plans);
      // Single-file export: no confirmation screen — download and close.
      if (m.files.length === 1) { toast.success(m.downloadName + " downloaded"); onClose(); return; }
      setManifest(m);
      setPhase("success");
    } catch {
      setPhase("error");
    }
  }

  /* ── settings panel (right) — shared for both tabs ── */
  const settingsPanel = (
    <div className="w-[340px] shrink-0 overflow-y-auto px-[24px] py-[6px]">
      {phase === "error" && (
        <div className="flex items-start gap-[8px] mt-[14px] px-[12px] py-[10px] rounded-[10px] bg-destructive/5 border border-destructive/20">
          <Icon icon={Alert02Icon} size={15} className="text-destructive shrink-0 mt-[1px]" strokeWidth={1.7} />
          <p className="flex-1 min-w-0 font-medium text-[12.5px] text-destructive leading-[18px]">Could not export. Please try again.</p>
        </div>
      )}

      <div className="mt-[14px] mb-[4px]">
        {editingFileId ? (
          <div className="flex items-center gap-[8px]">
            <p className="flex-1 min-w-0 truncate text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.5px]">Settings · this file</p>
            {overrides[editingFileId] && (
              <button type="button" onClick={() => resetOverride(editingFileId)} className="shrink-0 text-[12px] font-medium text-primary hover:underline">Reset to shared</button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.5px]">{multi ? "Settings · all files" : "Settings"}</p>
            {multi && <p className="mt-[3px] text-[11.5px] leading-[16px] text-muted-foreground">Open a file tab above to customize one file separately.</p>}
          </div>
        )}
      </div>

      <SectionRow title="Transcript" enabled={current.includeTranscript} onToggle={(v) => patchCurrent({ includeTranscript: v })}>
        <div className={current.includeTranscript ? "mt-[12px] flex flex-col gap-[12px]" : "hidden"}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">File format</span>
            <Select value={current.format} onValueChange={(v) => patchCurrent({ format: v as ExportFormat })}>
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
            <OptionCheck id="opt-speakers" label="Show speaker names" checked={current.options.showSpeakers} onChange={(v) => patchOptions("showSpeakers", v)} />
            <OptionCheck id="opt-timestamps" label="Show timestamps" checked={current.options.showTimestamps} onChange={(v) => patchOptions("showTimestamps", v)} />
            <OptionCheck id="opt-combine-same" label="Combine paragraphs of the same speaker" checked={current.options.combineSameSpeaker} onChange={(v) => patchOptions("combineSameSpeaker", v)} />
            <OptionCheck id="opt-combine-all" label="Combine all paragraphs" checked={current.options.combineAll} onChange={(v) => patchOptions("combineAll", v)} />
          </div>
        </div>
      </SectionRow>

      <SectionRow title="Summary" enabled={current.includeSummary} onToggle={(v) => patchCurrent({ includeSummary: v })}>
        <p className={current.includeSummary ? "mt-[6px] text-[12.5px] leading-[18px] text-muted-foreground" : "hidden"}>Exports the AI summary as a separate .txt file.</p>
      </SectionRow>

      <SectionRow title="Translation" enabled={false} onToggle={() => {}} disabled>
        <p className="mt-[6px] text-[12.5px] leading-[18px] text-muted-foreground">No translation available for the selected {multi ? "records" : "record"}.</p>
      </SectionRow>

      <SectionRow title="Audio" enabled={false} onToggle={() => {}} disabled>
        <p className="mt-[6px] text-[12.5px] leading-[18px] text-muted-foreground">No audio attached to the selected {multi ? "records" : "record"}.</p>
      </SectionRow>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-[960px]" aria-describedby={undefined}>
        <div className="flex items-center justify-between px-[24px] h-[52px] border-b border-border">
          <DialogTitle className="font-semibold text-[17px] text-foreground">Export</DialogTitle>
        </div>

        {/* Chrome-style file tabs — multi only */}
        {multi && phase !== "processing" && phase !== "success" && (
          <div className="export-tabs flex items-end gap-[2px] px-[14px] pt-[8px] bg-muted/50 border-b border-border overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={"-mb-px flex items-center gap-[7px] h-[34px] px-[14px] rounded-t-[10px] text-[12.5px] whitespace-nowrap transition-colors " +
                (activeTab === "all" ? "bg-background border border-border border-b-background font-medium text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04]")}
            >
              All files
              <span className="inline-flex items-center justify-center h-[16px] min-w-[16px] px-[4px] rounded-full bg-foreground/[0.07] text-[10.5px] font-semibold">{records.length}</span>
            </button>
            {records.map((r) => {
              const st = settingsOf(r.id);
              const isActive = activeTab === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setActiveTab(r.id)}
                  className={"-mb-px flex items-center gap-[7px] h-[34px] px-[12px] rounded-t-[10px] text-[12.5px] whitespace-nowrap transition-colors " +
                    (isActive ? "bg-background border border-border border-b-background font-medium text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04]")}
                >
                  <FormatIcon format={st.includeTranscript ? st.format : "txt"} size={16} />
                  <span className="max-w-[130px] truncate">{r.title}</span>
                  {overrides[r.id] && <span className="size-[6px] rounded-full bg-primary shrink-0" title="Customized" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Body — fixed height so toggling options never resizes the dialog */}
        <div className={multi ? "h-[486px]" : "h-[520px]"}>
          {phase === "processing" ? (
            <div className="flex h-full flex-col items-center justify-center px-[24px]">
              <div className="size-[64px] rounded-full bg-primary/5 flex items-center justify-center mb-[18px]">
                <Icon icon={Loading01Icon} size={28} className="text-primary animate-spin" strokeWidth={1.6} />
              </div>
              <p className="font-semibold text-[16px] text-foreground mb-[4px]">Preparing your export…</p>
              <p className="text-[13px] text-muted-foreground mb-[18px]">{multi ? `File ${Math.min(progress + 1, activePlans.length)} of ${activePlans.length}` : "This only takes a moment"}</p>
              <div className="w-[320px] h-[6px] rounded-full bg-muted overflow-hidden mb-[24px]">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.max(8, (progress / Math.max(1, activePlans.length)) * 100)}%` }} />
              </div>
              {multi && (
                <div className="w-[380px] max-h-[180px] overflow-y-auto flex flex-col gap-[2px]">
                  {activePlans.map((p, i) => (
                    <div key={p.record.id} className="flex items-center gap-[10px] h-[30px]">
                      {i < progress
                        ? <Icon icon={Tick02Icon} size={14} className="text-primary shrink-0" strokeWidth={2.2} />
                        : <span className="size-[14px] shrink-0 rounded-full border border-border" />}
                      <span className={"flex-1 truncate text-[12.5px] " + (i < progress ? "text-foreground" : "text-muted-foreground")}>{p.record.title}</span>
                      <FormatIcon format={p.includeTranscript ? p.format : "txt"} size={20} />
                    </div>
                  ))}
                </div>
              )}
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
                  : <><span className="font-medium text-foreground">{manifest.downloadName}</span> has been downloaded</>}
              </p>
              <div className="w-[520px] max-h-[260px] overflow-y-auto rounded-[12px] border border-border divide-y divide-border">
                {manifest.files.map((f) => (
                  <div key={f.name} className="flex items-center gap-[12px] h-[42px] px-[14px]">
                    <FormatIcon format={f.format} size={24} />
                    <span className="flex-1 truncate text-[13px] text-foreground">{f.name}</span>
                    <span className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">{formatBytes(f.bytes)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Left pane */}
              <div className="flex-1 min-w-0 bg-muted/40 border-r border-border overflow-y-auto px-[24px] py-[20px]">
                {multi && activeTab === "all" ? (
                  <div className="flex flex-col gap-[2px]">
                    <p className="font-semibold text-[13px] text-foreground">{records.length} records selected</p>
                    <p className="mb-[10px] text-[11.5px] text-muted-foreground">Click a file to preview and customize it.</p>
                    {records.map((r) => {
                      const st = settingsOf(r.id);
                      const off = !st.includeTranscript && !st.includeSummary;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => setActiveTab(r.id)}
                          className="flex items-center gap-[10px] h-[42px] px-[10px] -mx-[10px] rounded-[10px] text-left border border-transparent hover:bg-foreground/[0.03] transition-colors"
                        >
                          <FormatIcon format={st.includeTranscript ? st.format : "txt"} size={24} />
                          <span className={"flex-1 truncate text-[13px] " + (off ? "text-muted-foreground line-through" : "text-foreground")}>{r.title}</span>
                          {overrides[r.id] && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.4px] text-primary">Custom</span>}
                          <span className="shrink-0 text-[11.5px] text-muted-foreground">{r.metadata?.duration ?? ""}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  activeRecord && <TranscriptPreview record={activeRecord} />
                )}
              </div>
              {settingsPanel}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-[12px] px-[24px] h-[60px] border-t border-border bg-background">
          {phase === "success" && manifest ? (
            <>
              <div className="flex items-center gap-[8px] flex-1 min-w-0">
                {manifest.zipped && <FormatIcon format="zip" size={22} />}
                <p className="truncate text-[12.5px] text-muted-foreground">{manifest.downloadName}</p>
              </div>
              <Button variant="pill-outline" onClick={handleExport} className="h-[36px] px-[16px] gap-[6px]">
                <Icon icon={Download01Icon} size={14} strokeWidth={1.7} />
                <span className="font-medium text-[13px]">Download again</span>
              </Button>
              <Button onClick={onClose} className="h-[36px] px-[18px]">
                <span className="font-semibold text-[13px]">Done</span>
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
                <span className="font-semibold text-[13px]">{phase === "error" ? "Try again" : "Export"}</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}