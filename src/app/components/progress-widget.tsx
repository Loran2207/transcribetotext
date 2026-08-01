import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Loading03Icon,
  RefreshIcon,
  Trash,
  Video01Icon,
  X,
} from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { SourceIcon } from "./source-icons";
import {
  FAB_RIGHT,
  HISTORY_FAB_RIGHT,
  HISTORY_FAB_SIZE,
  HISTORY_FAB_BOTTOM,
} from "./mobile-fab-layout";
import { router } from "../routes";
// Live bindings: only read while rendering, so the cycle with the provider
// module resolves before anything here runs.
import { ERROR_LABELS, type TranscriptionJob } from "./transcription-modals";

/* The queue that does not belong in My Records.
   Two tabs and nothing else: what is still running, and what broke. Finished
   work leaves the widget for the table and announces itself with a toast, so
   there is no third history list to keep in sync. */

const IN_PROGRESS: TranscriptionJob["status"][] = [
  "uploading",
  "processing",
  "transcribing",
  "connecting",
  "recording",
];

const STATUS_LABEL: Record<string, string> = {
  uploading: "Uploading",
  processing: "Processing",
  transcribing: "Transcribing",
  connecting: "Connecting",
  recording: "Recording",
};

// How many failures load before the user asks for more. Failed can collect for
// months, so the tab never fetches the whole history at once.
const FAILED_PAGE = 20;

// The queue belongs to a signed-in session, so it stays off the doors.
const CLOSED_TO_WIDGET = ["/login", "/signup", "/check-email", "/auth", "/forgot-password", "/reset-password", "/share", "/checkout"];

/* The failure toast sits outside this component and needs to open it, so the
   opener is a module-level signal rather than a prop threaded through the
   provider. */
let requestOpen: (() => void) | null = null;
export function openQueue() {
  if (requestOpen) requestOpen();
}

function isInProgress(job: TranscriptionJob) {
  return IN_PROGRESS.includes(job.status);
}

/* Percentage only where there is real progress behind it. Connecting a bot and
   recording a call have no bar to fill. */
function progressOf(job: TranscriptionJob): number | null {
  if (job.status === "uploading") {
    return Math.max(0, Math.min(100, Math.round(job.uploadProgress ?? job.progress ?? 0)));
  }
  if (job.status === "processing" || job.status === "transcribing") {
    return Math.max(0, Math.min(100, Math.round(job.transcriptionProgress ?? job.progress ?? 0)));
  }
  return null;
}

/* When the file was handed over. A queue is easier to trust when you can see
   that the oldest item has been waiting nine minutes, not nine hours. */
function whenLabel(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : hours + " hours ago";
  return new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function JobIcon({ job }: { job: TranscriptionJob }) {
  const failed = job.status === "error";
  const tint = failed
    ? "bg-destructive/10 text-destructive"
    : job.fileType === "audio"
      ? "bg-primary/8 text-primary"
      : "bg-violet-500/8 text-violet-600";
  return (
    <span className={"flex size-9 shrink-0 items-center justify-center rounded-[10px] " + tint}>
      {failed ? (
        <Icon icon={AlertCircle} className="size-[17px]" strokeWidth={1.8} />
      ) : job.source && job.source !== "mp3" && job.source !== "mp4" ? (
        <SourceIcon source={job.source} size={17} />
      ) : job.kind === "meeting" ? (
        <Icon icon={Video01Icon} className="size-[16px]" strokeWidth={1.7} />
      ) : (
        <Icon icon={Loading03Icon} className="size-[16px]" strokeWidth={1.8} />
      )}
    </span>
  );
}

/* One row, laid out the way a record is laid out in My Records: icon, name and
   a quiet meta line under it. The status is stated once, on the right, so the
   name is free to be just the name. */
function JobRow({
  job,
  onRemove,
  onRetry,
  onReconnect,
}: {
  job: TranscriptionJob;
  onRemove: (job: TranscriptionJob) => void;
  onRetry: (id: string) => void;
  onReconnect: (id: string) => void;
}) {
  const failed = job.status === "error";
  const pct = progressOf(job);
  const meta = [whenLabel(job.createdAt), job.lang, job.duration].filter(Boolean) as string[];
  const errorLabel = failed
    ? (job.errorType ? ERROR_LABELS[job.errorType] ?? "Upload failed" : "Upload failed")
    : "";
  const canRetry = failed && job.errorType !== "no_audio";
  const isBotFailure = failed && job.errorType === "bot_failed";

  return (
    <div className="group/row border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <JobIcon job={job} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-foreground">{job.name}</p>
          {/* Narrow, the status joins the meta line: a phone has no room for a
              name, a status and a percentage on one row, and the name is the
              part that identifies the record. */}
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground sm:hidden">
            {failed
              ? errorLabel
              : [(STATUS_LABEL[job.status] ?? job.status) + (pct !== null ? " " + pct + "%" : ""), ...meta]
                  .join("  ·  ")}
          </p>
          <p className="mt-0.5 hidden truncate text-[11.5px] text-muted-foreground sm:block">
            {failed ? errorLabel : meta.join("  ·  ")}
          </p>
        </div>

        {failed ? (
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 hidden text-[11.5px] text-muted-foreground sm:inline">
              {whenLabel(job.createdAt)}
            </span>
            {(canRetry || isBotFailure) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (isBotFailure ? onReconnect(job.id) : onRetry(job.id))}
                className="h-8 gap-1.5 px-3 text-[12.5px] font-medium text-primary hover:bg-primary/8"
              >
                <Icon icon={RefreshIcon} className="size-[13px]" strokeWidth={1.9} />
                {isBotFailure ? "Reconnect" : "Retry"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 max-sm:hidden">
            <span className="text-[12.5px] font-medium text-foreground">
              {STATUS_LABEL[job.status] ?? job.status}
            </span>
            {pct !== null && (
              <span className="w-[34px] text-right text-[12.5px] tabular-nums text-muted-foreground">
                {pct}%
              </span>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(job)}
          aria-label={"Delete " + job.name}
          title="Delete"
          className="size-7 shrink-0 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/row:text-muted-foreground"
        >
          <Icon icon={X} className="size-[13px]" strokeWidth={2} />
        </Button>
      </div>

      {pct !== null && (
        <div className="h-[2px] w-full bg-border/70">
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: pct + "%" }} />
        </div>
      )}
    </div>
  );
}

export interface ProgressWidgetProps {
  jobs: TranscriptionJob[];
  onRetry: (id: string) => void;
  onReconnect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ProgressWidget({ jobs, onRetry, onReconnect, onRemove }: ProgressWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"progress" | "failed">("progress");
  const [failedShown, setFailedShown] = useState(FAILED_PAGE);
  const [confirm, setConfirm] = useState<{ kind: "one"; job: TranscriptionJob } | { kind: "all" } | null>(null);
  const [path, setPath] = useState(() => router.state.location.pathname);
  // The confirmation is modal, so the queue drops behind its scrim.
  const layer = confirm ? "z-[40]" : "z-[150]";

  // The provider sits outside the router, so the path comes from the router
  // itself rather than from a hook.
  useEffect(() => router.subscribe((state) => setPath(state.location.pathname)), []);

  const widgetJobs = useMemo(() => jobs.filter((job) => job.source !== "microphone"), [jobs]);
  const progressJobs = useMemo(() => widgetJobs.filter(isInProgress), [widgetJobs]);
  const failedJobs = useMemo(() => widgetJobs.filter((job) => job.status === "error"), [widgetJobs]);

  // Capture flags: ttt_demo_widget = expanded | expanded_failed.
  useEffect(() => {
    let flag = "";
    try { flag = window.localStorage.getItem("ttt_demo_widget") || ""; } catch { /* ignore */ }
    if (flag === "expanded" || flag === "expanded_failed") {
      setExpanded(true);
      setTab(flag === "expanded_failed" ? "failed" : "progress");
    }
  }, []);

  useEffect(() => {
    if (tab === "failed" && failedJobs.length === 0 && progressJobs.length > 0) setTab("progress");
  }, [tab, failedJobs.length, progressJobs.length]);

  useEffect(() => {
    requestOpen = () => {
      setExpanded(true);
      setTab(failedJobs.length > 0 ? "failed" : "progress");
    };
    return () => {
      requestOpen = null;
    };
  }, [failedJobs.length]);

  if (widgetJobs.length === 0) return null;
  if (CLOSED_TO_WIDGET.some((prefix) => path.startsWith(prefix))) return null;

  /* Collapsed, the queue is one button in the corner: no pill that stretches
     with the longest status, no wording that changes width every few seconds.
     The counts sit in a badge - blue for what is running, red for what broke -
     and the full sentence is left for the tooltip and the open panel. */
  const counts = new Map<string, number>();
  progressJobs.forEach((job) => counts.set(job.status, (counts.get(job.status) ?? 0) + 1));
  let dominant: string = progressJobs[0]?.status ?? "processing";
  let dominantCount = 0;
  counts.forEach((n, status) => {
    if (n > dominantCount) { dominantCount = n; dominant = status; }
  });
  const uniform = counts.size <= 1;
  const pillLabel = progressJobs.length === 0
    ? failedJobs.length === 1 ? "1 file failed" : failedJobs.length + " files failed"
    : uniform
      ? (STATUS_LABEL[dominant] ?? "Processing") + (progressJobs.length > 1 ? " " + progressJobs.length + " files" : "")
      : (STATUS_LABEL[dominant] ?? "Processing") + " " + dominantCount + " of " + progressJobs.length;

  /* The ring carries the aggregate of everything with a real percentage. A
     five-hour file in a long queue can sit at the same status for an hour, so
     seeing the arc move is the difference between waiting and worrying. */
  const measured = progressJobs
    .map(progressOf)
    .filter((n): n is number => n !== null);
  const ringPct = measured.length
    ? Math.round(measured.reduce((a, b) => a + b, 0) / measured.length)
    : null;
  const RING = 163; // circumference at r=26

  function requestRemove(job: TranscriptionJob) {
    setConfirm({ kind: "one", job });
  }

  function confirmRemove() {
    if (!confirm) return;
    if (confirm.kind === "one") {
      onRemove(confirm.job.id);
    } else {
      const doomed = tab === "failed" ? failedJobs : progressJobs;
      doomed.forEach((job) => onRemove(job.id));
    }
    setConfirm(null);
  }

  const confirmDialog = (
    <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
      <AlertDialogContent className="max-w-[420px] rounded-[18px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[17px] font-bold tracking-tight">
            {confirm && confirm.kind === "all"
              ? tab === "failed" ? "Delete all failed records?" : "Delete everything in the queue?"
              : "Delete this record?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-1.5 text-[13px] leading-[1.55]">
            {confirm && confirm.kind === "all"
              ? tab === "failed"
                ? "All " + failedJobs.length + " failed records will be deleted for good."
                : "All " + progressJobs.length + " records in the queue will be deleted for good, and whatever is still running stops."
              : "The record will be deleted for good. This cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2">
          <AlertDialogCancel className="h-9 px-4 text-[13px] font-medium">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmRemove}
            className="h-9 bg-destructive px-5 text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (!expanded) {
    return createPortal(
      <>
        <div
          className={"fixed " + layer}
          style={{ right: HISTORY_FAB_RIGHT, bottom: HISTORY_FAB_BOTTOM }}
        >
          <button
            type="button"
            onClick={() => setExpanded(true)}
            title={pillLabel}
            aria-label={pillLabel}
            className="relative flex items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
            style={{
              width: HISTORY_FAB_SIZE,
              height: HISTORY_FAB_SIZE,
              boxShadow: "0 8px 20px -6px rgba(16,24,40,0.16), 0 2px 6px -2px rgba(16,24,40,0.08)",
            }}
          >
            {progressJobs.length > 0 &&
              (ringPct === null ? (
                <svg className="absolute animate-spin" style={{ inset: -4 }} viewBox="0 0 56 56" fill="none">
                  <circle cx="28" cy="28" r="26" stroke="var(--primary)" strokeOpacity="0.16" strokeWidth="2" />
                  <path d="M28 2a26 26 0 0126 26" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="absolute" style={{ inset: -4 }} viewBox="0 0 56 56" fill="none">
                  <circle cx="28" cy="28" r="26" stroke="var(--primary)" strokeOpacity="0.16" strokeWidth="2" />
                  <circle
                    cx="28"
                    cy="28"
                    r="26"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={(RING * ringPct) / 100 + " " + RING}
                    transform="rotate(-90 28 28)"
                  />
                </svg>
              ))}

            <svg className="size-[20px] text-foreground" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V8M8.5 11.5L12 8l3.5 3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 16.5A2.5 2.5 0 007.5 19h9a2.5 2.5 0 002.5-2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Running and broken read as two halves of one badge, so a mixed
                queue does not need a sentence to be understood. */}
            {(progressJobs.length > 0 || failedJobs.length > 0) && (
              <span className="absolute -right-[9px] -top-[9px] flex items-center overflow-hidden rounded-full border-2 border-background">
                {progressJobs.length > 0 && (
                  <span className="min-w-[18px] bg-primary px-[5px] text-center text-[10.5px] font-semibold leading-[18px] text-primary-foreground">
                    {progressJobs.length}
                  </span>
                )}
                {failedJobs.length > 0 && (
                  <span className="min-w-[18px] bg-destructive px-[5px] text-center text-[10.5px] font-semibold leading-[18px] text-destructive-foreground">
                    {failedJobs.length}
                  </span>
                )}
              </span>
            )}
          </button>
        </div>
        {confirmDialog}
      </>,
      document.body
    );
  }

  const rows = tab === "failed" ? failedJobs.slice(0, failedShown) : progressJobs;
  const bulkCount = tab === "failed" ? failedJobs.length : progressJobs.length;

  return createPortal(
    <>
      <div
        className={"fixed flex flex-col overflow-hidden rounded-[16px] border border-border bg-popover " + layer}
        style={{
          right: FAB_RIGHT,
          bottom: HISTORY_FAB_BOTTOM,
          width: "620px",
          maxWidth: "calc(100vw - 24px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex shrink-0 items-end justify-between border-b border-border px-4 pt-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v === "failed" ? "failed" : "progress")} className="min-w-0 flex-1 gap-0">
            <TabsList variant="line" className="gap-6 border-b-0">
              <TabsTrigger value="progress" variant="line" className="text-[13px] font-semibold">
                In progress <span className="font-[inherit] opacity-50">{progressJobs.length}</span>
              </TabsTrigger>
              <TabsTrigger value="failed" variant="line" className="text-[13px] font-semibold data-[state=active]:text-destructive data-[state=active]:after:bg-destructive">
                Failed <span className="font-[inherit] opacity-50">{failedJobs.length}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-2 flex items-center gap-0.5 pb-1.5">
            {bulkCount > 0 && (
              <Button
                variant="ghost"
                onClick={() => setConfirm({ kind: "all" })}
                title={tab === "failed" ? "Delete all failed" : "Delete everything in the queue"}
                className="flex h-7 items-center gap-1 px-2 text-[11.5px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Icon icon={Trash} className="size-[13px]" strokeWidth={1.7} />
                <span className="font-medium">Delete all</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(false)}
              title="Collapse"
              className="size-7 text-muted-foreground hover:bg-accent"
            >
              <svg className="size-[11px]" fill="none" viewBox="0 0 16 16">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="max-h-[340px] overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                {tab === "failed" ? "Nothing has failed." : "Nothing is running right now."}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground/70">
                {tab === "failed"
                  ? "Records that break show up here."
                  : "Finished transcriptions move to My Records."}
              </p>
            </div>
          ) : (
            rows.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onRemove={requestRemove}
                onRetry={onRetry}
                onReconnect={onReconnect}
              />
            ))
          )}

          {tab === "failed" && failedJobs.length > failedShown && (
            <div className="p-3">
              <Button
                variant="pill-outline"
                onClick={() => setFailedShown((n) => n + FAILED_PAGE)}
                className="h-9 w-full text-[13px] font-medium"
              >
                Load more
                <span className="ml-1 text-muted-foreground">
                  {failedShown} of {failedJobs.length}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
      {confirmDialog}
    </>,
    document.body
  );
}
