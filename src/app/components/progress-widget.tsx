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

/* The table shows a flag beside the language, so the queue does too, from the
   same emoji the rest of the project uses. Jobs carry the language by name. */
const LANG_FLAG: Record<string, string> = {
  English: "\u{1F1FA}\u{1F1F8}",
  Russian: "\u{1F1F7}\u{1F1FA}",
  Spanish: "\u{1F1EA}\u{1F1F8}",
  German: "\u{1F1E9}\u{1F1EA}",
  French: "\u{1F1EB}\u{1F1F7}",
  Japanese: "\u{1F1EF}\u{1F1F5}",
};

function LangCell({ lang }: { lang?: string }) {
  if (!lang) return null;
  const flag = LANG_FLAG[lang];
  return (
    <span className="inline-flex items-center gap-[5px]">
      {flag ? <span className="text-[13px] leading-none">{flag}</span> : null}
      {lang}
    </span>
  );
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
  /* One neutral tile for everything that is running. The YouTube mark is red,
     Meet is four colours, Zoom is blue - a tinted tile behind them only added a
     second, arbitrary colour to each row. Failures keep their red, because
     there the tile is the status. */
  const tint = failed
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";
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
  const meta = [whenLabel(job.createdAt), job.duration].filter(Boolean) as string[];
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
          <p className="mt-0.5 flex items-center gap-[6px] truncate text-[11.5px] text-muted-foreground sm:hidden">
            {failed ? (
              errorLabel
            ) : (
              <>
                <span>{(STATUS_LABEL[job.status] ?? job.status) + (pct !== null ? " " + pct + "%" : "")}</span>
                <span>·</span>
                <span>{whenLabel(job.createdAt)}</span>
                <span>·</span>
                <LangCell lang={job.lang} />
              </>
            )}
          </p>
          <p className="mt-0.5 hidden items-center gap-[6px] truncate text-[11.5px] text-muted-foreground sm:flex">
            {failed ? (
              errorLabel
            ) : (
              <>
                <span>{whenLabel(job.createdAt)}</span>
                <span>·</span>
                <LangCell lang={job.lang} />
                {job.duration ? (<><span>·</span><span>{job.duration}</span></>) : null}
              </>
            )}
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

  /* No ring around the button. A dashed arc is the one thing the Figma capture
     redraws as literal dashes, and the state is carried better by the counters
     anyway: the border takes the tint of whatever is happening. */
  const rim =
    progressJobs.length > 0
      ? "border-primary/35"
      : failedJobs.length > 0
        ? "border-destructive/35"
        : "border-border";

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
      <AlertDialogContent className="max-w-[420px] rounded-[18px] max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:w-full max-md:max-w-none! max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-[22px] max-md:p-[20px]">
        <AlertDialogHeader className="text-left">
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
              : confirm && confirm.kind === "one"
                ? "\"" + confirm.job.name + "\" leaves the queue and is deleted for good. This cannot be undone."
                : ""}
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
            className={"relative flex items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:bg-accent " + rim}
            style={{
              width: HISTORY_FAB_SIZE,
              height: HISTORY_FAB_SIZE,
              boxShadow: "0 8px 20px -6px rgba(16,24,40,0.16), 0 2px 6px -2px rgba(16,24,40,0.08)",
            }}
          >
            <svg className="size-[24px] text-foreground" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V8M8.5 11.5L12 8l3.5 3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 16.5A2.5 2.5 0 007.5 19h9a2.5 2.5 0 002.5-2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Two counters, the way notifications count: blue for what is
                running, red for what broke. Either can stand alone. */}
            {(progressJobs.length > 0 || failedJobs.length > 0) && (
              <span className="absolute -right-[9px] -top-[9px] flex items-center">
                {progressJobs.length > 0 && (
                  <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-background bg-primary px-[4px] text-[10.5px] font-semibold text-primary-foreground">
                    {progressJobs.length}
                  </span>
                )}
                {failedJobs.length > 0 && (
                  <span
                    className={
                      "relative flex h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-background bg-destructive px-[4px] text-[10.5px] font-semibold text-destructive-foreground " +
                      (progressJobs.length > 0 ? "-ml-[7px]" : "")
                    }
                  >
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
      {/* a sheet needs the page behind it to step back */}
      <div className={"fixed inset-0 bg-black/40 sm:hidden " + (confirm ? "z-[30]" : "z-[140]")} onClick={() => setExpanded(false)} />
      <div
        /* A phone gets a sheet from the bottom edge, which is what the queue
           always was there; a desktop keeps the panel hanging off its button. */
        className={
          "fixed flex flex-col overflow-hidden border border-border bg-popover " +
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[78vh] max-sm:rounded-b-none max-sm:rounded-t-[20px] max-sm:border-x-0 max-sm:border-b-0 " +
          "sm:bottom-[92px] sm:right-[16px] sm:w-[620px] sm:max-w-[calc(100vw-24px)] sm:rounded-[16px] " +
          layer
        }
        style={{ boxShadow: "0 22px 60px rgba(16,24,40,0.09), 0 6px 18px rgba(16,24,40,0.035)" }}
      >
        {/* the grabber a sheet is expected to have */}
        <div className="mx-auto mt-[8px] h-[4px] w-[36px] shrink-0 rounded-full bg-border sm:hidden" />
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

        <div className="overflow-y-auto max-sm:max-h-[calc(78vh-104px)] sm:max-h-[340px]">
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
