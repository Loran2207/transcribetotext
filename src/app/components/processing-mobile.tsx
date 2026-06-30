import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckmarkCircle02Icon, Loading03Icon, RefreshIcon, Upload, Video01Icon, Trash, X } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "./ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { SourceIcon } from "./source-icons";
import { useTranscriptionModals, ERROR_LABELS, mapJobToRecordState, type TranscriptionJob } from "./transcription-modals";

/* Mobile (<768) upload-processing surface. The 680px desktop FloatingProgressWidget
   is unusable on a phone, so below md we show a slim status pill docked above the
   bottom-nav while jobs are active (otherwise a compact icon-only history circle),
   opening a bottom sheet with the Uploaded / History / Failed tabs as compact job
   cards. Wired to the same job context as the desktop widget. */

function MobileJobCard({ job, retryJob, reconnectBot, removeJob }: {
  job: TranscriptionJob;
  retryJob: (id: string) => void;
  reconnectBot: (id: string) => void;
  removeJob: (id: string) => void;
}) {
  const isActive = job.status === "uploading" || job.status === "processing";
  const isDone = job.status === "done";
  const isError = job.status === "error";
  const isConnecting = job.status === "connecting";
  const isRecording = job.status === "recording";
  const isMeeting = job.kind === "meeting";
  const isBotFailed = isError && job.errorType === "bot_failed";
  const canRetry = isError && job.errorType !== "no_audio";
  const errLabel = job.errorType ? (ERROR_LABELS[job.errorType] ?? "Upload failed") : "Upload failed";
  const uploadPct = Math.max(0, Math.min(100, Math.round(job.uploadProgress ?? (job.status === "uploading" ? job.progress : 100))));
  const transcribePct = Math.max(0, Math.min(100, Math.round(job.transcriptionProgress ?? (job.status === "processing" ? job.progress : (job.status === "done" ? 100 : 0)))));
  const statusLabel = job.status === "uploading"
    ? "Uploading"
    : job.status === "processing"
      ? (transcribePct < 15 ? "Processing" : transcribePct < 75 ? "Transcribing" : "Summarizing")
      : job.status === "done" ? "Completed" : "Failed";
  const phasePct = job.status === "uploading" ? uploadPct : transcribePct;
  const langText = job.lang ? (job.lang === "auto" ? "Auto" : job.lang.toUpperCase()) + (job.translationLang ? " → " + job.translationLang.toUpperCase() : "") : "";
  const metaText = langText + (job.duration ? (langText ? " · " : "") + job.duration : "");

  function openTranscription() {
    const recordState = mapJobToRecordState(job);
    try { window.sessionStorage.setItem("uploaded-record:" + job.id, JSON.stringify(recordState)); } catch (e) { void e; }
    window.location.assign("/transcriptions/" + job.id);
  }

  return (
    <div className={"rounded-[12px] border px-[11px] py-[9px] " + (isError ? "border-destructive/25 bg-destructive/[0.04]" : "border-border bg-card")}>
      <div className="flex items-center gap-[10px]">
        <div className={"size-[30px] rounded-[8px] flex items-center justify-center shrink-0 " + (isError ? "bg-destructive/10" : "bg-muted")}>
          {isError ? (
            <Icon icon={AlertCircle} className="size-[15px] text-destructive" strokeWidth={1.9} />
          ) : isMeeting ? (
            <Icon icon={Video01Icon} className="size-[14px] text-primary" strokeWidth={1.7} />
          ) : (
            <SourceIcon source={job.source ?? (job.fileType === "audio" ? "mp3" : "mp4")} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[8px]">
            <p className={"flex-1 min-w-0 truncate " + (isError ? "text-destructive" : "text-foreground")} style={{ fontWeight: 600, fontSize: 13 }} title={job.name}>{job.name}</p>
            {isActive && <span className="shrink-0 text-primary tabular-nums" style={{ fontWeight: 600, fontSize: 12 }}>{phasePct}%</span>}
            {isConnecting && <span className="shrink-0 flex items-center gap-[4px] text-muted-foreground" style={{ fontSize: 11 }}><Icon icon={Loading03Icon} className="size-[12px] animate-spin text-primary" strokeWidth={2} />Connecting</span>}
            {isRecording && <span className="shrink-0 flex items-center gap-[4px] text-destructive" style={{ fontSize: 11 }}><span className="relative flex size-[7px]"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" /><span className="relative inline-flex size-[7px] rounded-full bg-destructive" /></span>Recording</span>}
            {isDone && (
              <Button variant="ghost" onClick={openTranscription} className="shrink-0 h-[26px] rounded-full pl-[9px] pr-[11px] gap-[4px] text-emerald-600 hover:bg-emerald-600/10">
                <Icon icon={CheckmarkCircle02Icon} className="size-[14px]" strokeWidth={2} /><span style={{ fontWeight: 600, fontSize: 11.5 }}>Open</span>
              </Button>
            )}
            {isError && (isBotFailed ? (
              <Button variant="ghost" onClick={() => reconnectBot(job.id)} className="shrink-0 h-[26px] rounded-full px-[10px] gap-[4px] text-primary hover:bg-primary/10"><Icon icon={RefreshIcon} className="size-[12px]" strokeWidth={1.9} /><span style={{ fontWeight: 600, fontSize: 11 }}>Reconnect</span></Button>
            ) : canRetry ? (
              <Button variant="ghost" onClick={() => retryJob(job.id)} className="shrink-0 h-[26px] rounded-full px-[10px] gap-[4px] text-destructive hover:bg-destructive/10"><Icon icon={RefreshIcon} className="size-[12px]" strokeWidth={1.9} /><span style={{ fontWeight: 600, fontSize: 11 }}>Retry</span></Button>
            ) : (
              <Button variant="ghost" onClick={() => removeJob(job.id)} className="shrink-0 h-[26px] rounded-full px-[10px] gap-[4px] text-foreground hover:bg-accent"><Icon icon={Upload} className="size-[12px]" strokeWidth={1.8} /><span style={{ fontWeight: 600, fontSize: 11 }}>Re-upload</span></Button>
            ))}
          </div>
          <div className="mt-[5px]">
            {isActive && (
              <div className="flex items-center gap-[8px]">
                <span className="shrink-0 text-muted-foreground" style={{ fontSize: 10.5, minWidth: 58 }}>{statusLabel}</span>
                <div className="h-[5px] flex-1 rounded-full overflow-hidden bg-muted">
                  <div className="h-full" style={{ width: phasePct + "%", background: job.status === "processing" ? "linear-gradient(90deg,#2563eb,#7c3aed)" : "var(--primary)" }} />
                </div>
              </div>
            )}
            {isDone && metaText && <span className="text-muted-foreground" style={{ fontSize: 11 }}>{metaText}</span>}
            {isError && <p className="truncate text-destructive" style={{ fontSize: 11 }} title={errLabel}>{errLabel}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileProcessing() {
  const { jobs, retryJob, reconnectBot, removeJob, clearFailedJobs } = useTranscriptionModals();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"uploaded" | "history" | "failed">("uploaded");

  const widgetJobs = useMemo(() => jobs.filter((j) => j.source !== "microphone"), [jobs]);
  const hasJobs = widgetJobs.length > 0;

  const activeBatchIds = useMemo(() => {
    const ids = new Set<string>();
    widgetJobs.forEach((j) => { if ((j.status === "uploading" || j.status === "processing") && j.batchId) ids.add(j.batchId); });
    return ids;
  }, [widgetJobs]);
  const latestBatchId = widgetJobs[0]?.batchId ?? null;

  const uploadedNowJobs = useMemo(() => {
    if (widgetJobs.length === 0) return [];
    if (activeBatchIds.size > 0) {
      const a = widgetJobs.filter((j) => (j.batchId ? activeBatchIds.has(j.batchId) : (j.status === "uploading" || j.status === "processing")));
      if (a.length > 0) return a;
    }
    if (latestBatchId) {
      const l = widgetJobs.filter((j) => j.batchId === latestBatchId);
      if (l.length > 0) return l;
    }
    return [widgetJobs[0]];
  }, [widgetJobs, activeBatchIds, latestBatchId]);

  const historyJobs = widgetJobs;
  const failedJobs = useMemo(() => historyJobs.filter((j) => j.status === "error"), [historyJobs]);

  const summaryJobs = uploadedNowJobs.length > 0 ? uploadedNowJobs : widgetJobs;
  const allDone = summaryJobs.length > 0 && summaryJobs.every((j) => j.status === "done" || j.status === "error");
  const uploadingCount = summaryJobs.filter((j) => j.status === "uploading").length;
  const processingCount = summaryJobs.filter((j) => j.status === "processing").length;
  const doneCount = summaryJobs.filter((j) => j.status === "done" || j.status === "error").length;
  const errorCount = summaryJobs.filter((j) => j.status === "error").length;
  const connectingCount = summaryJobs.filter((j) => j.status === "connecting").length;
  const recordingCount = summaryJobs.filter((j) => j.status === "recording").length;
  const activeCount = widgetJobs.filter((j) => j.status === "uploading" || j.status === "processing" || j.status === "connecting" || j.status === "recording").length;

  const pillLabel = processingCount > 0
    ? uploadingCount > 0
      ? "Uploading " + uploadingCount + " · Transcribing " + processingCount
      : "Transcribing " + doneCount + "/" + summaryJobs.length
    : "Uploading " + doneCount + "/" + summaryJobs.length;
  const activityLabel = recordingCount > 0
    ? "Recording (" + recordingCount + ")"
    : connectingCount > 0
      ? (connectingCount > 1 ? "Connecting bots (" + connectingCount + ")" : "Connecting bot")
      : pillLabel;
  const isErrorPill = allDone && errorCount > 0;

  if (!hasJobs) return null;

  const visibleJobs = activeTab === "history" ? historyJobs : activeTab === "failed" ? failedJobs : uploadedNowJobs;
  const showPill = activeCount > 0;

  return (
    <>
      {!open && showPill && createPortal(
        <div className="fixed left-[16px] right-[16px] z-[45] flex" style={{ bottom: "calc(82px + env(safe-area-inset-bottom))" }}>
          <button
            onClick={() => { setActiveTab("uploaded"); setOpen(true); }}
            className={"w-full flex items-center gap-[10px] h-[46px] px-[16px] rounded-full " + (isErrorPill ? "bg-card text-foreground border border-border" : "bg-primary text-primary-foreground")}
            style={{ boxShadow: isErrorPill ? "0 8px 22px -8px rgba(16,24,40,0.18)" : "0 8px 22px -8px rgba(37,99,235,0.45)" }}
          >
            <svg className="size-[15px] shrink-0 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" /><path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            <span className="flex-1 text-left truncate" style={{ fontWeight: 600, fontSize: 13.5 }}>{activityLabel}</span>
            {activeCount > 0 && (
              <span className={"inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-full text-[11px] font-semibold shrink-0 " + (isErrorPill ? "bg-muted text-foreground" : "bg-white/20 text-white")}>{activeCount}</span>
            )}
            <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>,
        document.body
      )}

      {!open && !showPill && createPortal(
        <button
          onClick={() => { setActiveTab(errorCount > 0 ? "failed" : "history"); setOpen(true); }}
          className={"fixed right-[16px] z-[45] flex items-center justify-center size-[50px] rounded-full bg-card border " + (errorCount > 0 ? "border-destructive/30" : "border-border")}
          style={{ bottom: "calc(82px + env(safe-area-inset-bottom))", boxShadow: "0 8px 20px rgba(16,24,40,0.12)" }}
          aria-label="Upload history"
        >
          <svg className="size-[20px] text-foreground" viewBox="0 0 24 24" fill="none">
            <path d="M12 16V8M8.5 11.5L12 8l3.5 3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 16.5A2.5 2.5 0 007.5 19h9a2.5 2.5 0 002.5-2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {errorCount > 0 && (
            <span className="absolute -top-[4px] -right-[4px] min-w-[20px] h-[20px] px-[5px] rounded-full text-[11px] font-semibold flex items-center justify-center text-white bg-destructive">
              {errorCount}
            </span>
          )}
        </button>,
        document.body
      )}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="[&>div:first-child]:hidden">
          <div className="flex items-center justify-between px-[18px] pt-[18px] pb-[2px]">
            <DrawerTitle style={{ fontSize: 18, fontWeight: 600 }}>Uploads</DrawerTitle>
            <button onClick={() => setOpen(false)} aria-label="Close" className="-mr-[4px] size-[32px] rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
              <Icon icon={X} className="size-[18px]" strokeWidth={2} />
            </button>
          </div>
          <div className="px-[18px] pt-[16px]">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v === "history" ? "history" : v === "failed" ? "failed" : "uploaded")}>
              <TabsList variant="line" className="gap-[24px]">
                <TabsTrigger value="uploaded" variant="line" className="text-[13px] font-semibold">Uploaded <span className="opacity-50">{uploadedNowJobs.length}</span></TabsTrigger>
                <TabsTrigger value="history" variant="line" className="text-[13px] font-semibold">History <span className="opacity-50">{historyJobs.length}</span></TabsTrigger>
                <TabsTrigger value="failed" variant="line" className="text-[13px] font-semibold data-[state=active]:text-destructive data-[state=active]:after:bg-destructive">Failed <span className="opacity-50">{failedJobs.length}</span></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="px-[16px] pt-[14px] pb-[12px] flex flex-col gap-[8px] overflow-auto" style={{ maxHeight: "54vh" }}>
            {visibleJobs.length === 0 ? (
              <p className="py-[28px] text-center text-muted-foreground" style={{ fontSize: 13 }}>
                {activeTab === "uploaded" ? "No files in the current upload batch yet." : activeTab === "failed" ? "No failed uploads." : "History is empty."}
              </p>
            ) : (
              visibleJobs.map((job) => <MobileJobCard key={job.id} job={job} retryJob={retryJob} reconnectBot={reconnectBot} removeJob={removeJob} />)
            )}
          </div>
          {activeTab === "failed" && failedJobs.length > 0 && (
            <div className="px-[16px] pt-[2px] pb-[20px]">
              <Button variant="pill-outline" onClick={clearFailedJobs} className="w-full h-[40px] gap-[6px] text-muted-foreground">
                <Icon icon={Trash} className="size-[14px]" strokeWidth={1.7} />Clear failed
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
