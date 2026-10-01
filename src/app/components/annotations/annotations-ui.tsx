import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowUp01Icon,
  ArrowUp02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Comment01Icon,
  CommentAdd01Icon,
  Copy01Icon,
  Delete02Icon,
  HighlighterIcon,
  MoreHorizontal,
  PencilEdit02Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";
import { Textarea } from "@/app/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Popover, PopoverAnchor, PopoverContent } from "@/app/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import { ToastCard } from "@/app/components/app-toast";
import type { AnnotationsApi } from "@/hooks/use-annotations";
import {
  coversBlock,
  cutRuns,
  overlaps,
  timeAgo,
  type Anchor,
  type Highlight,
  type Person,
  type Run,
  type Thread,
} from "@/lib/annotations";

/* One yellow for every highlight, a block or a few words, in the text and in
   the list. Comments are a different mark (an underline), so the two can sit
   on the same words and still read apart. */
export const HIGHLIGHT_WASH = "rounded-[3px] bg-amber-200/70 box-decoration-clone";

export type Focus = { kind: "thread" | "highlight"; id: string };

/* What the lists and sheets need from the page. */
export type NotesView = {
  api: AnnotationsApi;
  /* your own record; on a record shared with you, you remove only your own notes */
  owner: boolean;
  focus: Focus | null;
  textOf: (segmentId: number) => string;
  speakerOf: (segmentId: number) => string | undefined;
  timestampOf: (segmentId: number) => string;
  goTo: (anchor: Anchor, focus: Focus) => void;
  openThread: (threadId: string) => void;
  commentOn: (anchor: Anchor, highlightId?: string) => void;
  seek: (timestamp: string) => void;
};

const canRemove = (v: NotesView, by: Person) => Boolean(by.you) || v.owner;

export function toastUndo(title: string, onUndo: () => void) {
  toast.custom(
    (id) => (
      <ToastCard
        glyph={Delete02Icon}
        title={title}
        action={{ label: "Undo", onClick: () => { toast.dismiss(id); onUndo(); } }}
      />
    ),
    { duration: 5000 },
  );
}

export function removeHighlightWithUndo(api: AnnotationsApi, id: string) {
  const removed = api.removeHighlight(id);
  if (removed) toastUndo("Highlight removed", () => api.restoreHighlight(removed));
}

function deleteThreadWithUndo(api: AnnotationsApi, id: string) {
  const removed = api.deleteThread(id);
  if (removed) toastUndo(removed.replies.length > 0 ? "Thread deleted" : "Comment deleted", () => api.restoreThread(removed));
}

function deleteReplyWithUndo(api: AnnotationsApi, threadId: string, replyId: string) {
  const removed = api.deleteReply(threadId, replyId);
  if (removed) toastUndo("Reply deleted", () => api.restoreReply(threadId, removed.reply, removed.index));
}

export function PersonDot({ person, size = 24 }: { person: Person; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), backgroundColor: person.color }}
    >
      {person.initial}
    </span>
  );
}

function Tip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function TimeChip({ timestamp, onSeek }: { timestamp: string; onSeek: (t: string) => void }) {
  return (
    <button
      type="button"
      title="Play from here"
      onClick={(e) => { e.stopPropagation(); onSeek(timestamp); }}
      className="inline-flex items-center gap-1 tabular-nums transition-colors hover:text-primary"
    >
      {timestamp}
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="opacity-60"><path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" /></svg>
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// In the transcript
// ════════════════════════════════════════════════════════════

/* The block text with its notes: highlights washed yellow, the words a
   comment is about underlined. A comment on a whole block is not underlined
   (a paragraph of underline is noise); the count at the edge says it is there. */
export function AnnotatedText({
  text,
  highlights,
  threads,
  focus,
  pending,
  onMark,
}: {
  text: string;
  highlights: Highlight[];
  threads: Thread[];
  focus: Focus | null;
  pending?: { start: number; end: number };
  onMark?: (run: Run, rect: DOMRect) => void;
}) {
  const shown = threads.filter((t) => !t.resolved && (!coversBlock(t, text.length) || focus?.id === t.id));
  const ranges = pending ? [...shown, { id: "__pending", start: pending.start, end: pending.end }] : shown;
  const runs = cutRuns(text, highlights, ranges);
  return (
    <>
      {runs.map((r, i) => {
        const th = r.threads.filter((id) => id !== "__pending");
        const isPending = r.threads.length !== th.length;
        const hl = r.highlights.length > 0;
        if (!hl && th.length === 0 && !isPending) return <span key={i}>{r.text}</span>;
        const thFocused = focus?.kind === "thread" && th.includes(focus.id);
        const hlFocused = focus?.kind === "highlight" && r.highlights.includes(focus.id);
        return (
          <span
            key={i}
            data-hl={hl ? r.highlights.join(" ") : undefined}
            data-th={th.length ? th.join(" ") : undefined}
            onClick={(e) => {
              if (!onMark || isPending) return;
              const sel = window.getSelection();
              if (sel && !sel.isCollapsed) return;
              e.stopPropagation();
              onMark({ ...r, threads: th }, e.currentTarget.getBoundingClientRect());
            }}
            className={cn(
              hl && HIGHLIGHT_WASH,
              hlFocused && "bg-amber-300",
              th.length > 0 && "underline decoration-primary/50 decoration-[1.5px] underline-offset-[4px]",
              thFocused && "rounded-[3px] bg-primary/15 decoration-primary",
              isPending && "rounded-[3px] bg-primary/20",
              (hl || th.length > 0) && !isPending && "cursor-pointer transition-colors",
            )}
          >
            {r.text}
          </span>
        );
      })}
    </>
  );
}

/* The block's own bar: shows on hover (or on a tap, on touch). The count of
   open comments stays at the edge at rest, so a block with a discussion is
   visible without hovering. */
export function BlockActions({
  highlighted,
  openCount,
  revealed,
  quiet,
  canShare,
  onHighlight,
  onComment,
  onShare,
  onCopy,
  onOpenComments,
}: {
  highlighted: boolean;
  openCount: number;
  revealed: boolean;
  /* a bar on a highlight or a comment field is open on this block: one floating thing at a time */
  quiet: boolean;
  canShare: boolean;
  onHighlight: () => void;
  onComment: () => void;
  onShare: () => void;
  onCopy: () => void;
  onOpenComments: () => void;
}) {
  const btn = "size-7 rounded-full text-muted-foreground hover:text-foreground";
  const icon = "size-[15px]";
  return (
    <div className="absolute right-2 top-3 z-20 flex items-center gap-1.5">
      <div
        data-block-actions=""
        className={cn(
          "flex items-center gap-1 rounded-full border border-border/70 bg-background/95 p-1.5 shadow-sm backdrop-blur-[2px] transition-all duration-150",
          revealed
            ? "translate-y-0 opacity-100"
            : quiet
            ? "pointer-events-none translate-y-1 opacity-0"
            : "pointer-events-none translate-y-1 opacity-0 group-hover/seg:pointer-events-auto group-hover/seg:translate-y-0 group-hover/seg:opacity-100 group-focus-within/seg:pointer-events-auto group-focus-within/seg:translate-y-0 group-focus-within/seg:opacity-100",
        )}
      >
        <Tip label={highlighted ? "Remove highlight" : "Highlight"}>
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={highlighted}
            aria-label={highlighted ? "Remove highlight" : "Highlight block"}
            className={cn(btn, highlighted && "bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-800")}
            onClick={onHighlight}
          >
            <Icon icon={HighlighterIcon} className={icon} strokeWidth={1.8} />
          </Button>
        </Tip>
        <Tip label="Comment">
          <Button variant="ghost" size="icon" aria-label="Comment on block" className={btn} onClick={onComment}>
            <Icon icon={CommentAdd01Icon} className={icon} strokeWidth={1.8} />
          </Button>
        </Tip>
        {canShare && (
          <Tip label="Share">
            <Button variant="ghost" size="icon" aria-label="Share segment" className={btn} onClick={onShare}>
              <Icon icon={Share08Icon} className={icon} strokeWidth={1.8} />
            </Button>
          </Tip>
        )}
        <Tip label="Copy text">
          <Button variant="ghost" size="icon" aria-label="Copy text" className={btn} onClick={onCopy}>
            <Icon icon={Copy01Icon} className={icon} strokeWidth={1.8} />
          </Button>
        </Tip>
      </div>
      {openCount > 0 && (
        <button
          type="button"
          data-comment-chip=""
          aria-label={openCount === 1 ? "1 comment" : `${openCount} comments`}
          onClick={onOpenComments}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-primary/10 px-2 text-[12px] font-semibold tabular-nums text-primary transition-colors hover:bg-primary/15"
        >
          <Icon icon={Comment01Icon} className="size-[13px]" strokeWidth={2} />
          {openCount}
        </button>
      )}
    </div>
  );
}

export type BarAction = { key: string; label: string; icon: unknown; onClick: () => void; danger?: boolean };

/* The bar on a highlighted passage: the same floating pill as the one over
   selected words. Closes on any press outside it and on scroll. */
export function MarkBar({
  rect,
  below,
  actions,
  onClose,
}: {
  rect: { left: number; top: number; width: number; bottom: number };
  below?: boolean;
  actions: BarAction[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", away, true);
      window.addEventListener("scroll", onClose, true);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", away, true);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);
  const x = Math.max(12, Math.min(window.innerWidth - 12, rect.left + rect.width / 2));
  return createPortal(
    <div
      ref={ref}
      data-mark-bar=""
      className="fixed z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border/70 bg-background/95 p-1 shadow-sm backdrop-blur-[2px] animate-in fade-in zoom-in-95 duration-150"
      style={{ left: x, top: below ? rect.bottom + 8 : rect.top - 44 }}
    >
      {actions.map((a) => (
        <Button
          key={a.key}
          size="sm"
          variant="ghost"
          className={cn("h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground", a.danger && "hover:text-destructive")}
          onClick={() => { a.onClick(); onClose(); }}
        >
          <Icon icon={a.icon} className="size-[14px]" strokeWidth={1.8} />
          {a.label}
        </Button>
      ))}
    </div>,
    document.body,
  );
}

// ════════════════════════════════════════════════════════════
// Writing
// ════════════════════════════════════════════════════════════

function CommentForm({
  initial = "",
  submitLabel,
  placeholder,
  onSubmit,
  onCancel,
}: {
  initial?: string;
  submitLabel: string;
  placeholder: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  const send = () => { const v = text.trim(); if (v) onSubmit(v); };
  return (
    <div>
      <Textarea
        autoFocus
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onCancel(); }
        }}
        className="min-h-[72px] text-[16px] leading-[22px] lg:text-[13px] lg:leading-[19px]"
      />
      <div className="mt-2 flex justify-end gap-1.5">
        <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-[13px] text-muted-foreground" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-8 rounded-full px-3.5 text-[13px]" disabled={!text.trim()} onClick={send}>{submitLabel}</Button>
      </div>
    </div>
  );
}

function QuoteLine({ text, clamp = 2 }: { text: string; clamp?: 2 | 3 }) {
  return (
    <div className="flex gap-2">
      <span className="w-[2px] shrink-0 rounded-full bg-primary/40" />
      <p className={cn("text-[13px] leading-[18px] text-foreground/70", clamp === 2 ? "line-clamp-2" : "line-clamp-3")}>{text}</p>
    </div>
  );
}

/* A new comment is written right where the words are: a small card under them
   on a desk, a sheet from the bottom on a phone, with the words quoted on top
   because the keyboard hides the transcript. */
export function CommentComposer({
  sheet,
  rect,
  quote,
  onSubmit,
  onCancel,
}: {
  sheet: boolean;
  rect: { left: number; top: number; width: number; height: number };
  quote: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  if (sheet) {
    return (
      <Drawer open onOpenChange={(o) => { if (!o) onCancel(); }}>
        <DrawerContent data-comment-composer="" className="[&>div:first-child]:hidden">
          <DrawerHeader className="pb-2 text-left">
            <DrawerTitle className="text-[17px] font-semibold">Comment</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-5">
            <QuoteLine text={quote} clamp={3} />
            <div className="mt-3">
              <CommentForm submitLabel="Comment" placeholder="Add a comment" onSubmit={onSubmit} onCancel={onCancel} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Popover open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <PopoverAnchor asChild>
        <span aria-hidden className="pointer-events-none fixed" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />
      </PopoverAnchor>
      <PopoverContent data-comment-composer="" side="bottom" align="start" sideOffset={8} className="w-[320px] p-3">
        <CommentForm submitLabel="Comment" placeholder="Add a comment" onSubmit={onSubmit} onCancel={onCancel} />
      </PopoverContent>
    </Popover>
  );
}

function ReplyField({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);
  const send = () => { const v = text.trim(); if (!v) return; onSend(v); setText(""); };
  return (
    <div className="mt-3 flex items-end gap-1.5 rounded-[18px] border border-border bg-background py-1 pl-3 pr-1 transition-colors focus-within:border-primary/50">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        aria-label="Reply"
        placeholder="Reply"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
        }}
        className="min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[16px] leading-[20px] text-foreground outline-none placeholder:text-muted-foreground lg:text-[13px]"
      />
      {text.trim() && (
        <Button size="icon" className="size-7 shrink-0 rounded-full" aria-label="Send reply" onClick={send}>
          <Icon icon={ArrowUp02Icon} className="size-[14px]" strokeWidth={2.2} />
        </Button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Threads
// ════════════════════════════════════════════════════════════

function Entry({
  person,
  at,
  edited,
  text,
  onResolve,
  onEdit,
  onDelete,
}: {
  person: Person;
  at: number;
  edited?: boolean;
  text: string;
  onResolve?: () => void;
  onEdit?: (text: string) => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="mt-3 flex gap-2.5">
      <PersonDot person={person} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-foreground">{person.name}</span>
          <span className="shrink-0 text-[12px] text-muted-foreground">{timeAgo(at)}{edited ? " · edited" : ""}</span>
          <span className="ml-auto flex shrink-0 items-center">
            {onResolve && (
              <Tip label="Resolve">
                <Button variant="ghost" size="icon" aria-label="Resolve" className="size-7 rounded-full text-muted-foreground hover:text-foreground" onClick={onResolve}>
                  <Icon icon={CheckmarkCircle02Icon} className="size-[16px]" strokeWidth={1.8} />
                </Button>
              </Tip>
            )}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More" className="size-7 rounded-full text-muted-foreground hover:text-foreground">
                    <Icon icon={MoreHorizontal} className="size-[16px]" strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {onEdit && (
                    <DropdownMenuItem onSelect={() => setEditing(true)}>
                      <Icon icon={PencilEdit02Icon} className="size-4" strokeWidth={1.8} />Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                      <Icon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </span>
        </div>
        {editing && onEdit ? (
          <div className="mt-1.5">
            <CommentForm initial={text} submitLabel="Save" placeholder="Edit comment" onSubmit={(v) => { onEdit(v); setEditing(false); }} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-[19px] text-foreground/90">{text}</p>
        )}
      </div>
    </div>
  );
}

export function ThreadCard({ t, v, inSheet = false }: { t: Thread; v: NotesView; inSheet?: boolean }) {
  const focused = !inSheet && v.focus?.kind === "thread" && v.focus.id === t.id;
  const [expanded, setExpanded] = useState(false);
  const speaker = v.speakerOf(t.segmentId);
  const resolvedBy = t.resolved ? (t.resolved.by.you ? "you" : t.resolved.by.name) : "";

  if (t.resolved && !expanded) {
    return (
      <div
        data-thread-card={t.id}
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => { if (e.key === "Enter") setExpanded(true); }}
        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
      >
        <Icon icon={CheckmarkCircle02Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-foreground/75">{t.quote}</span>
          <span className="block text-[12px] text-muted-foreground">Resolved by {resolvedBy}</span>
        </span>
      </div>
    );
  }

  return (
    <div
      data-thread-card={t.id}
      onClick={(e) => {
        if (inSheet || (e.target as HTMLElement).closest("button, textarea, a, [role=menuitem]")) return;
        v.goTo(t, { kind: "thread", id: t.id });
      }}
      className={cn(
        "rounded-xl border bg-card p-3 transition-[border-color,box-shadow] duration-200",
        !inSheet && "cursor-pointer",
        focused ? "border-primary/45 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_12%,transparent)]" : "border-border/70",
      )}
    >
      {t.resolved && (
        <div className="-mx-3 -mt-3 mb-3 flex items-center gap-2 rounded-t-xl border-b border-border/60 bg-muted/40 py-1.5 pl-3 pr-1.5 text-[12px] text-muted-foreground">
          <Icon icon={CheckmarkCircle02Icon} className="size-[14px]" strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate">Resolved by {resolvedBy}</span>
          <Button variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-xs font-medium text-primary hover:text-primary" onClick={() => v.api.reopen(t.id)}>Reopen</Button>
          <Button variant="ghost" size="icon" aria-label="Collapse" className="size-7 rounded-full text-muted-foreground" onClick={() => setExpanded(false)}>
            <Icon icon={ArrowUp01Icon} className="size-[14px]" strokeWidth={2} />
          </Button>
        </div>
      )}
      <QuoteLine text={t.quote} />
      <div className="mt-1.5 flex items-center gap-1.5 pl-[10px] text-[12px] text-muted-foreground">
        <TimeChip timestamp={t.timestamp} onSeek={v.seek} />
        {speaker && <><span aria-hidden>·</span><span className="truncate">{speaker}</span></>}
      </div>
      <Entry
        person={t.by}
        at={t.at}
        edited={t.edited}
        text={t.text}
        onResolve={t.resolved ? undefined : () => v.api.resolve(t.id)}
        onEdit={t.by.you ? (text) => v.api.editThread(t.id, text) : undefined}
        onDelete={canRemove(v, t.by) ? () => deleteThreadWithUndo(v.api, t.id) : undefined}
      />
      {t.replies.map((r) => (
        <Entry
          key={r.id}
          person={r.by}
          at={r.at}
          edited={r.edited}
          text={r.text}
          onEdit={r.by.you ? (text) => v.api.editReply(t.id, r.id, text) : undefined}
          onDelete={canRemove(v, r.by) ? () => deleteReplyWithUndo(v.api, t.id, r.id) : undefined}
        />
      ))}
      {!t.resolved && <ReplyField onSend={(text) => v.api.reply(t.id, text)} />}
    </div>
  );
}

function Empty({ icon, title, line }: { icon: unknown; title: string; line: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/5">
        <Icon icon={icon} className="size-5 text-primary/70" strokeWidth={1.7} />
      </span>
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-[230px] text-[13px] leading-[19px] text-muted-foreground">{line}</p>
    </div>
  );
}

/* A card the transcript pointed at scrolls into view in whichever list is on
   screen (the desk panel or the phone tab). */
function useRevealFocused(focus: Focus | null, attr: string) {
  useEffect(() => {
    if (!focus) return;
    const id = window.setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(`[${attr}="${focus.id}"]`));
      els.find((el) => el.offsetParent !== null)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [focus, attr]);
}

export function CommentsList({ v }: { v: NotesView }) {
  useRevealFocused(v.focus?.kind === "thread" ? v.focus : null, "data-thread-card");
  if (v.api.threads.length === 0) {
    return <Empty icon={Comment01Icon} title="No comments yet" line="Select words in the transcript, then press Comment." />;
  }
  return (
    <div className="flex flex-col gap-2 p-3">
      {v.api.threads.map((t) => <ThreadCard key={t.id} t={t} v={v} />)}
    </div>
  );
}

function HighlightItem({ h, v }: { h: Highlight; v: NotesView }) {
  const text = v.textOf(h.segmentId).slice(h.start, h.end);
  const speaker = v.speakerOf(h.segmentId);
  const timestamp = v.timestampOf(h.segmentId);
  const focused = v.focus?.kind === "highlight" && v.focus.id === h.id;
  const linked = v.api.threads.filter((t) => !t.resolved && t.segmentId === h.segmentId && overlaps(t, h));
  const tool = "size-7 rounded-full text-muted-foreground hover:text-foreground";
  return (
    <div
      data-highlight-item={h.id}
      role="button"
      tabIndex={0}
      onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) v.goTo(h, { kind: "highlight", id: h.id }); }}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) v.goTo(h, { kind: "highlight", id: h.id }); }}
      className={cn("group/hl cursor-pointer rounded-xl px-3 py-2 transition-colors hover:bg-muted/50", focused && "bg-amber-50 hover:bg-amber-50")}
    >
      <div className="flex h-7 items-center gap-1.5 text-[12px] text-muted-foreground">
        <TimeChip timestamp={timestamp} onSeek={v.seek} />
        {speaker && <><span aria-hidden>·</span><span className="truncate">{speaker}</span></>}
        <span className="ml-auto flex shrink-0 items-center transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/hl:opacity-100 [@media(hover:hover)]:group-focus-within/hl:opacity-100">
          <Tip label="Comment">
            <Button variant="ghost" size="icon" aria-label="Comment on highlight" className={tool} onClick={() => v.commentOn(h, h.id)}>
              <Icon icon={CommentAdd01Icon} className="size-[15px]" strokeWidth={1.8} />
            </Button>
          </Tip>
          <Tip label="Copy">
            <Button variant="ghost" size="icon" aria-label="Copy highlight" className={tool} onClick={() => { void navigator.clipboard?.writeText(text); toast("Text copied"); }}>
              <Icon icon={Copy01Icon} className="size-[15px]" strokeWidth={1.8} />
            </Button>
          </Tip>
          {canRemove(v, h.by) && (
            <Tip label="Remove highlight">
              <Button variant="ghost" size="icon" aria-label="Remove highlight" className={tool} onClick={() => removeHighlightWithUndo(v.api, h.id)}>
                <Icon icon={Delete02Icon} className="size-[15px]" strokeWidth={1.8} />
              </Button>
            </Tip>
          )}
        </span>
      </div>
      <p className="text-[13px] leading-[20px] text-foreground/90">
        <span className={cn(HIGHLIGHT_WASH, "px-0.5")}>{text}</span>
      </p>
      {(!h.by.you || linked.length > 0) && (
        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-muted-foreground">
          {!h.by.you && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <PersonDot person={h.by} size={16} />
              <span className="truncate">Highlighted by {h.by.name.split(" ")[0]}</span>
            </span>
          )}
          {linked.length > 0 && (
            <button type="button" className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline" onClick={() => v.openThread(linked[0].id)}>
              <Icon icon={Comment01Icon} className="size-[13px]" strokeWidth={2} />
              {linked.length === 1 ? "1 comment" : `${linked.length} comments`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function HighlightsList({ v, title }: { v: NotesView; title: string }) {
  useRevealFocused(v.focus?.kind === "highlight" ? v.focus : null, "data-highlight-item");
  const list = v.api.highlights;
  if (list.length === 0) {
    return <Empty icon={HighlighterIcon} title="No highlights yet" line="Select words in the transcript, then press Highlight." />;
  }
  const copyAll = () => {
    const body = list
      .map((h) => {
        const who = v.speakerOf(h.segmentId);
        return `${v.timestampOf(h.segmentId)}${who ? ` ${who}` : ""}\n"${v.textOf(h.segmentId).slice(h.start, h.end)}"`;
      })
      .join("\n\n");
    void navigator.clipboard?.writeText(`Highlights: ${title}\n\n${body}`);
    toast(list.length === 1 ? "Highlight copied" : `${list.length} highlights copied`);
  };
  return (
    <div className="flex flex-col px-2 pb-3 pt-1.5">
      <div className="flex justify-end px-1 pb-0.5">
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground" onClick={copyAll}>
          <Icon icon={Copy01Icon} className="size-[14px]" strokeWidth={1.8} />Copy all
        </Button>
      </div>
      {list.map((h) => <HighlightItem key={h.id} h={h} v={v} />)}
    </div>
  );
}

/* On a phone the discussion on a block opens from the bottom, over the
   transcript, with the quote on every card. */
export function ThreadSheet({ threads, v, onClose }: { threads: Thread[]; v: NotesView; onClose: () => void }) {
  return (
    <Drawer open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent data-thread-sheet="" className="max-h-[88vh] [&>div:first-child]:hidden">
        <DrawerHeader className="flex-row items-center justify-between pb-1 text-left">
          <DrawerTitle className="text-[17px] font-semibold">Comments</DrawerTitle>
          <Button variant="ghost" size="icon" aria-label="Close" className="size-9 rounded-full text-muted-foreground" onClick={onClose}>
            <Icon icon={Cancel01Icon} className="size-[18px]" strokeWidth={1.8} />
          </Button>
        </DrawerHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-6">
          {threads.map((t) => <ThreadCard key={t.id} t={t} v={v} inSheet />)}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
