import { toast } from "sonner";
import {
  AlertCircle,
  CheckmarkCircle02Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { Icon } from "./ui/icon";

/* Every toast the app sends has one shape: a status mark, a line saying what
   happened, a quiet second line, and at most one way to act on it.

   The action is a text button, never a filled one. A toast is an aside - a
   second solid accent in the corner competes with the page the reader is
   actually on, and the record name is the thing that should carry the weight. */

type Tone = "success" | "error";

const TONE: Record<Tone, { chip: string; ink: string }> = {
  success: { chip: "bg-success-wash", ink: "text-success" },
  error: { chip: "bg-destructive-wash", ink: "text-destructive" },
};

// Long enough to read a file name and reach for the action, short enough to
// stay out of the way when ten of them land at once.
const DURATION = 4000;

export function ToastCard({
  tone = "success",
  glyph,
  title,
  meta,
  action,
  secondary,
  mark,
}: {
  tone?: Tone;
  glyph?: unknown;
  title: string;
  meta?: string;
  action?: { label: string; onClick: () => void; pressed?: boolean };
  secondary?: { label: string; onClick: () => void };
  mark?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div
      /* The width belongs to the card, not to the list around it: a toast with a
         short line is still a toast, and one that sizes itself to its content
         makes a stack of them look ragged.

         No shadow here. A stack of three cards each casting its own shadow
         turns into a grey smear along the edges - the elevation belongs to the
         top card only, and the Toaster puts it there. */
      className="flex w-[356px] max-w-[calc(100vw-24px)] items-center gap-[12px] rounded-[14px] border border-border bg-popover px-[14px] py-[12px]"
    >
      {mark ?? (
        <span className={"flex size-[28px] shrink-0 items-center justify-center rounded-full " + t.chip}>
          <Icon
            icon={glyph ?? (tone === "error" ? AlertCircle : CheckmarkCircle02Icon)}
            className={"size-[16px] " + t.ink}
            strokeWidth={2}
          />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold leading-[18px] -tracking-[0.1px] text-foreground">
          {title}
        </p>
        {meta ? (
          <p className="mt-[2px] truncate text-[12px] leading-[16px] text-muted-foreground">{meta}</p>
        ) : null}
      </div>

      {secondary ? (
        <button type="button" onClick={secondary.onClick} className="shrink-0 rounded-full px-[10px] py-[6px] text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          {secondary.label}
        </button>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className={"-mr-[4px] shrink-0 rounded-full px-[10px] py-[6px] text-[12.5px] font-semibold text-primary transition-colors hover:bg-primary/8 " + (action.pressed ? "bg-primary/12" : "")}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

/* One record finished while the user was somewhere else. */
export function toastReady(name: string, onOpen: () => void) {
  toast.custom(
    (id) => (
      <ToastCard
        title={name}
        meta="Transcription is ready"
        action={{ label: "Open", onClick: () => { toast.dismiss(id); onOpen(); } }}
      />
    ),
    { duration: DURATION }
  );
}

/* Ten files can finish within a second of each other. Ten toasts would bury the
   screen, so a batch collapses into one line that still names what arrived. */
export function toastManyReady(names: string[], onViewAll: () => void) {
  const shown = names.slice(0, 2).join(", ");
  const rest = names.length - 2;
  toast.custom(
    (id) => (
      <ToastCard
        title={names.length + " transcriptions are ready"}
        meta={rest > 0 ? shown + " and " + rest + " more" : names.join(", ")}
        action={{ label: "View all", onClick: () => { toast.dismiss(id); onViewAll(); } }}
      />
    ),
    { duration: DURATION + 2000 }
  );
}

/* The export has left the browser. No action: the file is already in the
   downloads folder and the app cannot open it. */
export function toastExported(title: string, meta: string) {
  toast.custom(() => <ToastCard glyph={Download01Icon} title={title} meta={meta} />, {
    duration: DURATION,
  });
}

/* A failure leaves the queue on screen, so the toast only points at it. */
export function toastFailed(name: string, onOpenQueue: () => void) {
  toast.custom(
    (id) => (
      <ToastCard
        tone="error"
        title={name}
        meta="Transcription failed"
        action={{ label: "Details", onClick: () => { toast.dismiss(id); onOpenQueue(); } }}
      />
    ),
    { duration: DURATION + 2000 }
  );
}

/* Access was taken away. There is no confirmation dialog in front of this - the
   spec is explicit that the action applies at once - so the way back is here,
   and it stays a second longer than the others because it is the only chance to
   change your mind. */
export function toastAccessRemoved(name: string, onUndo?: () => void) {
  toast.custom(
    (id) => (
      <ToastCard
        title="Access removed"
        meta={name}
        action={{ label: "Undo", onClick: () => { toast.dismiss(id); onUndo?.(); } }}
      />
    ),
    { duration: 5000 }
  );
}

/* The other side of the same act, seen by the person it was taken from while
   they still had the record open. No action: the record is gone, and the app is
   already carrying them back to Shared with me. */
export function toastAccessRevoked(what: "record" | "folder" = "record") {
  toast.custom(
    () => (
      <ToastCard
        tone="error"
        title={"Access to this " + what + " was removed"}
        meta="Taking you back to Shared with me"
      />
    ),
    { duration: 5000 }
  );
}
