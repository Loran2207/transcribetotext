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
import { Loading01Icon, CheckmarkCircle02Icon, Alert02Icon, ArrowDown01Icon, ArrowUp01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { usePlan } from "./use-plan";
import {
  runExport, describeExportFilename, DEFAULT_EXPORT_OPTIONS,
  type ExportableRecord, type ExportFormat, type ExportContentOptions,
} from "@/lib/export-formats";

/* ══════════════════════════════════════════════
   Export Dialog — single & multi record export
   Left: content preview · Right: what + format
   ══════════════════════════════════════════════ */

type Phase = "form" | "exporting" | "success" | "error";

interface FormatChoice { format: ExportFormat; label: string; pro: boolean; }
const FORMAT_CHOICES: FormatChoice[] = [
  { format: "txt", label: "txt", pro: false },
  { format: "docx", label: "docx", pro: true },
  { format: "pdf", label: "pdf", pro: true },
  { format: "srt", label: "srt", pro: true },
  { format: "vtt", label: "vtt", pro: true },
];

function SectionRow({ title, enabled, onToggle, disabled, children }: {
  title: string; enabled: boolean; onToggle: (v: boolean) => void; disabled?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-b-0 py-[16px]">
      <div className="flex items-center justify-between">
        <span className={disabled ? "font-semibold text-[15px] text-muted-foreground" : "font-semibold text-[15px] text-foreground"}>{title}</span>
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
      <Label htmlFor={id} className="font-normal text-[13px] text-foreground cursor-pointer">{label}</Label>
    </div>
  );
}

export function ExportDialog({ open, onClose, records }: {
  open: boolean; onClose: () => void; records: ExportableRecord[];
}) {
  const plan = usePlan();
  const multi = records.length > 1;

  const [phase, setPhase] = useState<Phase>("form");
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("txt");
  const [moreOpen, setMoreOpen] = useState(true);
  const [opts, setOpts] = useState<ExportContentOptions>(DEFAULT_EXPORT_OPTIONS);
  const [exportedFile, setExportedFile] = useState<string | null>(null);

  // Reset on open; ttt_export_demo forces a phase for design captures (off by default).
  useEffect(() => {
    if (!open) return;
    const demo = typeof window !== "undefined" ? window.localStorage.getItem("ttt_export_demo") : null;
    setPhase(demo === "error" ? "error" : demo === "success" ? "success" : "form");
    if (demo === "success" && records.length) {
      setExportedFile(describeExportFilename({ records, format: "txt", includeTranscript: true, includeSummary: false, options: DEFAULT_EXPORT_OPTIONS }));
    }
    setIncludeTranscript(true); setIncludeSummary(false); setFormat("txt"); setOpts(DEFAULT_EXPORT_OPTIONS);
  }, [open, records]);

  const filename = useMemo(() => {
    if (!records.length) return "";
    try { return describeExportFilename({ records, format, includeTranscript, includeSummary, options: opts }); }
    catch { return ""; }
  }, [records, format, includeTranscript, includeSummary, opts]);

  const nothingSelected = !includeTranscript && !includeSummary;

  async function handleExport() {
    setPhase("exporting");
    try {
      await new Promise((r) => setTimeout(r, 500));
      const file = await runExport({ records, format, includeTranscript, includeSummary, options: opts });
      setExportedFile(file);
      setPhase("success");
    } catch {
      setPhase("error");
    }
  }

  const setOpt = (k: keyof ExportContentOptions, v: boolean) => setOpts((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-[860px]" aria-describedby={undefined}>
        <div className="flex items-center justify-between px-[24px] h-[56px] border-b border-border">
          <DialogTitle className="font-semibold text-[17px] text-foreground">Export</DialogTitle>
        </div>

        {phase === "success" ? (
          <div className="flex flex-col items-center justify-center py-[64px] px-[24px]">
            <div className="size-[64px] rounded-full bg-primary/5 flex items-center justify-center mb-[16px]">
              <Icon icon={CheckmarkCircle02Icon} size={30} className="text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-[16px] text-foreground mb-[6px]">Export complete</p>
            <p className="text-[13px] text-muted-foreground text-center max-w-[360px] leading-[20px] mb-[20px]">
              {exportedFile ? <>Your file <span className="font-medium text-foreground">{exportedFile}</span> has been downloaded.</> : "Your file has been downloaded."}
            </p>
            <div className="flex items-center gap-[10px]">
              <Button variant="pill-outline" onClick={handleExport} className="h-[36px] px-[16px] gap-[6px]">
                <Icon icon={Download01Icon} size={14} strokeWidth={1.7} />
                <span className="font-medium text-[13px]">Download again</span>
              </Button>
              <Button onClick={onClose} className="h-[36px] px-[18px]">
                <span className="font-semibold text-[13px]">Done</span>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex max-h-[520px]">
              {/* Left: preview */}
              <div className="flex-1 min-w-0 bg-muted/40 border-r border-border overflow-y-auto px-[24px] py-[18px]">
                {multi ? (
                  <div className="flex flex-col gap-[2px]">
                    <p className="font-semibold text-[13px] text-foreground mb-[8px]">{records.length} records selected</p>
                    {records.map((r) => (
                      <div key={r.id} className="flex items-center gap-[10px] h-[36px] border-b border-border/60 last:border-b-0">
                        <div className="size-[8px] rounded-full bg-primary/50 shrink-0" />
                        <span className="flex-1 truncate text-[13px] text-foreground">{r.title}</span>
                        <span className="shrink-0 text-[11.5px] text-muted-foreground">{r.duration ?? ""}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-[14px]">
                    {records[0] && records[0].segments.length === 0 && (
                      <div>
                        <p className="font-semibold text-[13px] text-foreground mb-[6px]">{records[0].title}</p>
                        <p className="text-[12.5px] leading-[19px] text-foreground/80">{records[0].summary || "Transcript preview is not available for this record."}</p>
                      </div>
                    )}
                    {records[0]?.segments.map((seg, i) => (
                      <div key={i}>
                        <p className="text-[12px] mb-[2px]">
                          <span className="font-semibold text-foreground">{seg.speaker}</span>
                          <span className="text-muted-foreground ml-[8px]">{seg.timestamp}</span>
                        </p>
                        <p className="text-[12.5px] leading-[19px] text-foreground/80">{seg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: options */}
              <div className="w-[340px] shrink-0 overflow-y-auto px-[24px] py-[4px]">
                {phase === "error" && (
                  <div className="flex items-start gap-[8px] mt-[14px] px-[12px] py-[10px] rounded-[10px] bg-destructive/5 border border-destructive/20">
                    <Icon icon={Alert02Icon} size={15} className="text-destructive shrink-0 mt-[1px]" strokeWidth={1.7} />
                    <p className="flex-1 min-w-0 font-medium text-[12.5px] text-destructive">Could not export. Please try again.</p>
                  </div>
                )}

                <SectionRow title="Transcript" enabled={includeTranscript} onToggle={setIncludeTranscript}>
                  {includeTranscript && (
                    <div className="mt-[12px] flex flex-col gap-[12px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">File format</span>
                        <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                          <SelectTrigger className="w-[130px] h-[32px] rounded-[8px] text-[13px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FORMAT_CHOICES.map((fc) => (
                              <SelectItem key={fc.format} value={fc.format} disabled={fc.pro && plan === "free"}>
                                <span className="flex items-center gap-[6px]">
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
                      {moreOpen && (
                        <div className="flex flex-col gap-[10px]">
                          <OptionCheck id="opt-speakers" label="Show speaker names" checked={opts.showSpeakers} onChange={(v) => setOpt("showSpeakers", v)} />
                          <OptionCheck id="opt-timestamps" label="Show timestamps" checked={opts.showTimestamps} onChange={(v) => setOpt("showTimestamps", v)} />
                          <OptionCheck id="opt-combine-same" label="Combine paragraphs of the same speaker" checked={opts.combineSameSpeaker} onChange={(v) => setOpt("combineSameSpeaker", v)} />
                          <OptionCheck id="opt-combine-all" label="Combine all paragraphs" checked={opts.combineAll} onChange={(v) => setOpt("combineAll", v)} />
                        </div>
                      )}
                    </div>
                  )}
                </SectionRow>

                <SectionRow title="Summary" enabled={includeSummary} onToggle={setIncludeSummary}>
                  {includeSummary && (
                    <p className="mt-[8px] text-[12.5px] leading-[18px] text-muted-foreground">Exports the AI summary as a separate .txt file.</p>
                  )}
                </SectionRow>

                <SectionRow title="Translation" enabled={false} onToggle={() => {}} disabled>
                  <p className="mt-[8px] text-[12.5px] leading-[18px] text-muted-foreground">No translation available for the selected {multi ? "records" : "record"}.</p>
                </SectionRow>

                <SectionRow title="Audio" enabled={false} onToggle={() => {}} disabled>
                  <p className="mt-[8px] text-[12.5px] leading-[18px] text-muted-foreground">No audio attached to the selected {multi ? "records" : "record"}.</p>
                </SectionRow>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-[12px] px-[24px] h-[60px] border-t border-border bg-background">
              <p className="flex-1 min-w-0 truncate text-[12.5px] text-muted-foreground">
                <span className="font-semibold text-foreground">Filename:</span> {nothingSelected ? "—" : filename}
              </p>
              <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[16px]">
                <span className="font-medium text-[13px]">Cancel</span>
              </Button>
              <Button onClick={handleExport} disabled={nothingSelected || phase === "exporting"} className="h-[36px] px-[20px] gap-[6px]">
                {phase === "exporting" && <Icon icon={Loading01Icon} size={14} className="animate-spin" strokeWidth={2} />}
                <span className="font-semibold text-[13px]">{phase === "error" ? "Try again" : "Export"}</span>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}