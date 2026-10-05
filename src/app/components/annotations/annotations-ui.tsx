import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  PlayIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Popover, PopoverAnchor, PopoverContent } from "@/app/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useIsPhone } from "@/app/components/ui/use-mobile";
import { ActionSheet, ActionSheetItem } from "@/app/components/action-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import type { AnnotationsApi, LabelsApi } from "@/hooks/use-annotations";
import { HighlightButton, LabelChip, LabelIcon, LabelPicker, WASH, WASH_ON, labelTile } from "./labels-ui";
import {
  TEAM,
  coversBlock,
  cutRuns,
  overlaps,
  timeAgo,
  type Anchor,
  type Highlight,
  type Label,
  type LabelColor,
  type Person,
  type Run,
  type Thread,
} from "@/lib/annotations";

/* A highlight is washed in its label's colour, a block or a few words, in the
   text and in the list. Comments are a different mark (an underline), so the
   two can sit on the same words and still read apart. */
export const HIGHLIGHT_SHAPE = "rounded-[3px] box-decoration-clone";

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
  /* when the words are said (the player's own estimate), as 1:17 */
  timeOf: (anchor: Anchor) => string;
  labels: LabelsApi;
  /* touch: label pickers open as sheets */
  sheet: boolean;
  /* only on your own record: labels belong to the workspace */
  manageLabels?: () => void;
  /* the highlights playing back to back, if any */
  reel: { ids: string[]; index: number } | null;
  playAll: (ids: string[]) => void;
  stopReel: () => void;
};

const canRemove = (v: NotesView, by: Person) => Boolean(by.you) || v.owner;

/* The house toast (one card, Undo as its pill), the same as the speaker undo toasts. */
export function toastUndo(title: string, onUndo: () => void, glyph: unknown = Delete02Icon) {
  toast(title, {
    icon: <Icon icon={glyph} size={16} className="text-primary" />,
    cancel: { label: "Undo", onClick: onUndo },
    /* a finger needs 36px */
    classNames: { cancelButton: "[@media(pointer:coarse)]:!h-9 [@media(pointer:coarse)]:!px-3" },
    duration: 5000,
  });
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
      className="inline-flex items-center gap-1 tabular-nums transition-colors hover:text-primary [@media(pointer:coarse)]:-my-2.5 [@media(pointer:coarse)]:py-2.5"
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
  colorOf,
  playback,
}: {
  text: string;
  highlights: Highlight[];
  threads: Thread[];
  focus: Focus | null;
  pending?: { start: number; end: number };
  onMark?: (run: Run, rect: DOMRect, lines: DOMRect[]) => void;
  colorOf: (highlightId: string) => LabelColor;
  /* the block being played: what was said dims, the sentence and the word being
     said are marked, on top of the notes rather than instead of them */
  playback?: { start: number; end: number; word?: { start: number; end: number } };
}) {
  const shown = threads.filter((t) => !t.resolved && (!coversBlock(t, text.length) || focus?.id === t.id));
  const ranges: { id: string; start: number; end: number }[] = pending ? [...shown, { id: "__pending", start: pending.start, end: pending.end }] : [...shown];
  if (playback) {
    ranges.push({ id: "__said", start: playback.start, end: playback.end });
    if (playback.word) ranges.push({ id: "__word", start: playback.word.start, end: playback.word.end });
  }
  const runs = cutRuns(text, highlights, ranges);
  return (
    <>
      {runs.map((r, i) => {
        const th = r.threads.filter((id) => !id.startsWith("__"));
        const isPending = r.threads.includes("__pending");
        const hl = r.highlights.length > 0;
        const inSentence = r.threads.includes("__said");
        const inWord = r.threads.includes("__word");
        const said = playback ? r.end <= playback.start : false;
        const sound = cn(said && "text-foreground/45", inSentence && "text-primary", inWord && (hl ? "font-medium" : "rounded-[3px] bg-primary-wash py-[2px]"));
        if (!hl && th.length === 0 && !isPending) return <span key={i} className={sound || undefined}>{r.text}</span>;
        const thFocused = focus?.kind === "thread" && th.includes(focus.id);
        const hlFocused = focus?.kind === "highlight" && r.highlights.includes(focus.id);
        /* where two people's marks overlap, the later one's colour shows */
        const color = hl ? colorOf(r.highlights[r.highlights.length - 1]) : "amber";
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
              onMark({ ...r, threads: th }, e.currentTarget.getBoundingClientRect(), Array.from(e.currentTarget.getClientRects()));
            }}
            className={cn(
              hl && cn(HIGHLIGHT_SHAPE, WASH[color]),
              hlFocused && WASH_ON[color],
              th.length > 0 && "underline decoration-primary/50 decoration-[1.5px] underline-offset-[4px]",
              /* the thread being read, and the words a new comment is being written on: a firmer
                 underline, no fill that could pass for a highlight; a highlight keeps its colour */
              thFocused && "decoration-primary decoration-2",
              isPending && "underline decoration-primary decoration-2 underline-offset-[4px]",
              (hl || th.length > 0) && !isPending && "cursor-pointer transition-colors",
              sound,
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
  current,
  raised = false,
  openCount,
  revealed,
  quiet,
  labels,
  sheet,
  onManageLabels,
  onHighlight,
  onRemoveHighlight,
  onComment,
  onCopy,
  onOpenComments,
}: {
  /* the label of the block's own whole-block highlight, when it has one */
  current?: Label;
  /* a block with no top padding (a continuation): the bar sits over the gap above it */
  raised?: boolean;
  openCount: number;
  revealed: boolean;
  /* a bar on a highlight or a comment field is open on this block: one floating thing at a time */
  quiet: boolean;
  labels: LabelsApi;
  sheet: boolean;
  onManageLabels?: () => void;
  onHighlight: (labelId: string) => void;
  onRemoveHighlight: () => void;
  onComment: () => void;
  onCopy: () => void;
  onOpenComments: () => void;
}) {
  const btn = "size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9";
  const icon = "size-[15px]";
  const shown = revealed
    ? "pointer-events-auto translate-y-0 opacity-100"
    : quiet
    ? "pointer-events-none translate-y-1 opacity-0"
    : "pointer-events-none translate-y-1 opacity-0 group-hover/seg:pointer-events-auto group-hover/seg:translate-y-0 group-hover/seg:opacity-100 group-focus-within/seg:pointer-events-auto group-focus-within/seg:translate-y-0 group-focus-within/seg:opacity-100";
  const count = (inBar: boolean) => (
    <button
      type="button"
      data-comment-chip={inBar ? undefined : ""}
      data-comment-count={inBar ? "" : undefined}
      tabIndex={inBar ? undefined : -1}
      aria-label={openCount === 1 ? "1 comment" : `${openCount} comments`}
      onClick={onOpenComments}
      className="pointer-events-auto inline-flex h-7 items-center gap-1 rounded-full bg-primary/10 px-2 text-[12px] font-semibold tabular-nums text-primary transition-colors hover:bg-primary/15 [@media(pointer:coarse)]:h-9 [@media(pointer:coarse)]:px-2.5"
    >
      <Icon icon={Comment01Icon} className="size-[13px]" strokeWidth={2} />
      {openCount}
    </button>
  );
  return (
    <div className={cn("pointer-events-none absolute right-2 z-20 flex items-center gap-1.5", raised ? "-top-4" : "top-1")}>
      <div
        data-block-actions=""
        className={cn("flex items-center gap-0.5 rounded-full border border-border/70 bg-background p-1 shadow-sm backdrop-blur-[2px] transition-all duration-150", shown)}
      >
        <HighlightButton labels={labels} sheet={sheet} variant="icon" current={current} onHighlight={onHighlight} onRemove={onRemoveHighlight} onManage={onManageLabels} />
        <Tip label="Comment">
          <Button variant="ghost" size="icon" aria-label="Comment on block" className={btn} onClick={onComment}>
            <Icon icon={CommentAdd01Icon} className={icon} strokeWidth={1.8} />
          </Button>
        </Tip>
        <Tip label="Copy text">
          <Button variant="ghost" size="icon" aria-label="Copy text" className={btn} onClick={(e) => { if (sheet) e.currentTarget.blur(); onCopy(); }}>
            <Icon icon={Copy01Icon} className={icon} strokeWidth={1.8} />
          </Button>
        </Tip>
        {openCount > 0 && <span className="ml-0.5">{count(true)}</span>}
      </div>
      {/* at rest the count stands alone at the edge; while the bar shows it is inside the bar */}
      {openCount > 0 && (
        <span className={cn("absolute right-0 top-1/2 -translate-y-1/2 transition-opacity", revealed ? "pointer-events-none opacity-0" : "group-hover/seg:pointer-events-none group-hover/seg:opacity-0 group-focus-within/seg:pointer-events-none group-focus-within/seg:opacity-0")}>{count(false)}</span>
      )}
    </div>
  );
}

export type BarAction = { key: string; label: string; icon: unknown; onClick: () => void; danger?: boolean };

/* The first or the last line of a passage: a bar above the words starts
   where they start on that line, not at the edge of the whole block */
export function edgeLine(rects: DOMRect[], last: boolean): { left: number; width: number } | null {
  const on = rects.filter((r) => r.width > 0 && r.height > 0);
  if (on.length === 0) return null;
  const y = last ? Math.max(...on.map((r) => r.bottom)) : Math.min(...on.map((r) => r.top));
  const row = on.filter((r) => Math.abs((last ? r.bottom : r.top) - y) < 4);
  const left = Math.min(...row.map((r) => r.left));
  return { left, width: Math.max(...row.map((r) => r.right)) - left };
}

/* a floating bar opens at the first word, its first button over it, and stays inside the transcript column */
export function clampToColumn(start: number, width: number) {
  const column = document.querySelector("[data-transcript-scroll]")?.getBoundingClientRect();
  const lo = (column?.left ?? 0) + 12;
  const hi = (column?.right ?? window.innerWidth) - width - 12;
  if (hi < lo) return Math.max(8, (window.innerWidth - width) / 2);
  return Math.max(lo, Math.min(start - 8, hi));
}

/* The bar on a highlighted passage: the same floating pill as the one over
   selected words. Closes on any press outside it and on scroll. */
export function MarkBar({
  rect,
  line,
  below,
  actions,
  lead,
  onClose,
}: {
  rect: { left: number; top: number; width: number; bottom: number };
  /* the line the bar sits beside */
  line?: { left: number; width: number };
  below?: boolean;
  actions: BarAction[];
  lead?: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [height, setHeight] = useState(38);
  useLayoutEffect(() => {
    setLeft(clampToColumn((line ?? rect).left, ref.current?.offsetWidth ?? 0));
  }, [rect.left, rect.width, line?.left, line?.width]);
  useLayoutEffect(() => { setHeight(ref.current?.offsetHeight ?? 38); }, []);
  useEffect(() => {
    /* an Escape a layer above already used (a menu, a composer) leaves the bar */
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  useEffect(() => {
    const away = (e: Event) => {
      const t = e.target as Element | null;
      if (ref.current?.contains(t as Node) || t?.closest?.("[data-label-menu], [data-label-sheet], [data-manage-labels]")) return;
      onClose();
    };
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
  return createPortal(
    <div
      ref={ref}
      data-mark-bar=""
      className="fixed z-50 flex max-w-[calc(100vw-16px)] items-center gap-0.5 rounded-full border border-border/70 bg-background p-1 shadow-sm backdrop-blur-[2px] animate-in fade-in zoom-in-95 duration-150"
      style={{ left: left ?? rect.left, top: below ? rect.bottom + 8 : rect.top - height - 6, visibility: left === null ? "hidden" : undefined }}
    >
      {lead}
      {lead && <span className="mx-0.5 h-4 w-px bg-border" />}
      {actions.map((a) => (
        <Button
          key={a.key}
          data-bar-action={a.key}
          size="sm"
          variant="ghost"
          className={cn("h-7 gap-1.5 rounded-full px-2.5 text-xs text-foreground [@media(pointer:coarse)]:h-9", a.danger && "hover:text-destructive")}
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

/* @ in a comment opens the people on the record; the pick goes in as @Full Name.
   The list sits in the flow under the field: floating, it fell off the
   screen near the bottom or covered the words above. */
function useMentions(text: string, setText: (t: string) => void, place: "up" | "down" | "inline" | "above" = "up") {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const q = (query ?? "").toLowerCase();
  const options = query === null ? [] : TEAM.filter((p) => p.name.toLowerCase().split(" ").some((w) => w.startsWith(q)));
  const sync = (value: string, caret: number) => {
    const m = /(^|\s)@([A-Za-z]*)$/.exec(value.slice(0, caret));
    setQuery(m ? m[2] : null);
    setActive(0);
  };
  const pick = (p: Person) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/@([A-Za-z]*)$/, `@${p.name} `);
    setText(before + text.slice(caret));
    setQuery(null);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(before.length, before.length); });
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!options.length) return false;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % options.length); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); return true; }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(options[Math.min(active, options.length - 1)]); return true; }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setQuery(null); return true; }
    return false;
  };
  const list = options.length ? (
    <div data-mention-list="" className={cn(place === "inline" ? "-mx-2 mt-1.5" : place === "above" ? "-mx-2 mb-1.5" : "absolute left-0 z-30 w-60 rounded-xl border border-border bg-popover p-1 shadow-md", place === "up" && "bottom-full mb-1.5", place === "down" && "top-full mt-1.5")}>
      {options.map((p, i) => (
        <button
          key={p.name}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); pick(p); }}
          className={cn("flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] text-foreground", i === active ? "bg-muted" : "hover:bg-muted/60")}
        >
          <PersonDot person={p} size={22} />
          {p.name}
        </button>
      ))}
    </div>
  ) : null;
  const mentioned = TEAM.filter((p) => text.includes(`@${p.name}`));
  return { ref, sync, onKeyDown, list, mentioned };
}

/* says what a mention does: the person hears about it */
function MentionNote({ people, above = false }: { people: Person[]; above?: boolean }) {
  if (!people.length) return null;
  const names = people.map((p) => p.name);
  const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return <p className={cn("text-[12px] text-muted-foreground", above ? "mb-1.5" : "mt-1.5")}>{who} will get an email.</p>;
}

const MENTION = new RegExp(`@(${TEAM.map((p) => p.name).join("|")})`, "g");
function withMentions(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(<span key={at} className="font-medium text-primary">@{m[1]}</span>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function CommentForm({
  initial = "",
  submitLabel,
  placeholder,
  onSubmit,
  onCancel,
  onDirty,
  mentions = "inline",
  grow = "down",
}: {
  initial?: string;
  submitLabel: string;
  placeholder: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  /* the field has words in it: a press outside does not throw them away */
  onDirty?: (dirty: boolean) => void;
  mentions?: "up" | "down" | "inline";
  /* the field opened above the words grows upward: what appears (the @ list, the email note) goes above it, so the field stays put */
  grow?: "down" | "up";
}) {
  const [text, setText] = useState(initial);
  const up = grow === "up" && mentions === "inline";
  const m = useMentions(text, setText, up ? "above" : mentions);
  useEffect(() => { onDirty?.(text.trim() !== initial.trim()); }, [text, initial, onDirty]);
  const send = () => { const v = text.trim(); if (v) onSubmit(v); };
  const fresh = m.mentioned.filter((p) => !initial.includes(`@${p.name}`));
  return (
    <div>
      {up && m.list}
      {up && <MentionNote people={fresh} above />}
      <div className="relative">
        {mentions !== "inline" && m.list}
        <textarea
          ref={m.ref}
          autoFocus
          value={text}
          placeholder={placeholder}
          onChange={(e) => { setText(e.target.value); m.sync(e.target.value, e.target.selectionStart); }}
          onKeyDown={(e) => {
            if (m.onKeyDown(e)) return;
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onCancel(); }
          }}
          className="flex min-h-[72px] w-full resize-none rounded-[12px] border border-input bg-transparent px-3 py-2 text-[16px] leading-[22px] outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:text-[13px] lg:leading-[19px]"
        />
      </div>
      {!up && mentions === "inline" && m.list}
      {!up && <MentionNote people={fresh} />}
      <div className="mt-2 flex justify-end gap-1.5">
        <Button variant="pill-outline" size="sm" className="h-8 px-3 text-[13px] [@media(pointer:coarse)]:h-9" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-8 rounded-full px-3.5 text-[13px] [@media(pointer:coarse)]:h-9" disabled={!text.trim()} onClick={send}>{submitLabel}</Button>
      </div>
    </div>
  );
}

/* Escape peels one layer at a time: an open @ list takes it before the card or sheet around it */
const fieldTakesEscape = (e: KeyboardEvent) => { if (document.querySelector("[data-mention-list]")) e.preventDefault(); };
/* in a sheet of threads, a field being written in (an edit, a reply with words) takes Escape first */
const threadFieldTakesEscape = (e: KeyboardEvent) => {
  const t = document.activeElement;
  if (document.querySelector("[data-mention-list]") || (t instanceof HTMLTextAreaElement && (t.value.trim() || t.closest("[data-edit-form]")))) e.preventDefault();
};

function QuoteLine({ text, clamp = 2 }: { text: string; clamp?: 2 | 3 }) {
  return (
    <div className="flex gap-2">
      <span className="w-[2px] shrink-0 rounded-full bg-primary/40" />
      <p className={cn("text-[13px] leading-[18px] text-foreground/70", clamp === 2 ? "line-clamp-2" : "line-clamp-3")}>{text}</p>
    </div>
  );
}

/* A new comment is written right where the words are on a desk: a small card
   under them. On touch it is a form like the product's others: a centred card
   on a tablet, a sheet from the bottom on a phone, with the words quoted on
   top because the keyboard hides the transcript. */
export function CommentComposer({
  sheet,
  rect,
  quote,
  onSubmit,
  onCancel,
  onOutside,
  onCloseAutoFocus,
}: {
  sheet: boolean;
  rect: { left: number; top: number; width: number; height: number };
  quote: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  /* a press outside the card on a desk: you went elsewhere, nothing comes back */
  onOutside?: () => void;
  /* once the field is gone: the focus goes back to what opened it */
  onCloseAutoFocus?: (e: Event) => void;
}) {
  const dirty = useRef(false);
  const setDirty = useRef((d: boolean) => { dirty.current = d; }).current;
  /* the x, Cancel, Escape and a swipe always leave; only a stray press outside keeps the words typed */
  const guard = (e: Event) => { if (dirty.current) e.preventDefault(); };
  const phone = useIsPhone();
  if (sheet && !phone) {
    return (
      <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
        <DialogContent data-comment-composer="" aria-describedby={undefined} onCloseAutoFocus={onCloseAutoFocus} onInteractOutside={guard} onEscapeKeyDown={fieldTakesEscape} className="gap-0 p-5 sm:max-w-[480px] [&>button:last-child]:hidden">
          <DialogHeader className="flex-row items-center justify-between pb-2 text-left">
            <DialogTitle className="text-[17px] font-semibold">Comment</DialogTitle>
            <button type="button" onClick={onCancel} aria-label="Close" className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:size-9"><Icon icon={Cancel01Icon} size={16} /></button>
          </DialogHeader>
          <QuoteLine text={quote} clamp={3} />
          <div className="mt-3">
            <CommentForm submitLabel="Comment" placeholder="Add a comment" onSubmit={onSubmit} onCancel={onCancel} onDirty={setDirty} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  if (sheet) {
    return (
      <Drawer open onOpenChange={(o) => { if (!o) onCancel(); }}>
        <DrawerContent data-comment-composer="" aria-describedby={undefined} onCloseAutoFocus={onCloseAutoFocus} onInteractOutside={guard} onEscapeKeyDown={fieldTakesEscape} className="[&>div:first-child]:hidden">
          <DrawerHeader className="flex-row items-center justify-between pb-2 text-left">
            <DrawerTitle className="text-[17px] font-semibold">Comment</DrawerTitle>
            <button type="button" onClick={onCancel} aria-label="Close" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={16} /></button>
          </DrawerHeader>
          <div className="px-4 pb-5">
            <QuoteLine text={quote} clamp={3} />
            <div className="mt-3">
              <CommentForm submitLabel="Comment" placeholder="Add a comment" onSubmit={onSubmit} onCancel={onCancel} onDirty={setDirty} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  const room = window.innerHeight - 128 - (rect.top + rect.height) - 8;
  const side = room >= 160 + TEAM.length * 36 ? "bottom" : "top";
  return (
    <Popover open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <PopoverAnchor asChild>
        <span aria-hidden className="pointer-events-none fixed" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />
      </PopoverAnchor>
      {/* the player sits under the transcript: near it the field opens above the words, so the @ list never makes it jump */}
      <PopoverContent data-comment-composer="" side={side} align="start" sideOffset={8} onCloseAutoFocus={onCloseAutoFocus} collisionPadding={{ top: 8, left: 8, right: 8, bottom: 128 }} onInteractOutside={(e) => { guard(e); if (!e.defaultPrevented) onOutside?.(); }} onEscapeKeyDown={fieldTakesEscape} className="w-[320px] p-3">
        <CommentForm submitLabel="Comment" placeholder="Add a comment" onSubmit={onSubmit} onCancel={onCancel} onDirty={setDirty} grow={side === "top" ? "up" : "down"} />
      </PopoverContent>
    </Popover>
  );
}

function ReplyField({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const m = useMentions(text, setText, "inline");
  const ref = m.ref;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);
  const send = () => { const v = text.trim(); if (!v) return; onSend(v); setText(""); };
  return (
    <div className="mt-3">
    <div className="relative flex items-end gap-1.5 rounded-[18px] border border-border bg-background py-1 pl-3 pr-1 transition-colors focus-within:border-primary/50">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        aria-label="Reply"
        placeholder="Reply"
        onChange={(e) => { setText(e.target.value); m.sync(e.target.value, e.target.selectionStart); }}
        onKeyDown={(e) => {
          if (m.onKeyDown(e)) return;
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
        }}
        className="min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[16px] leading-[20px] text-foreground outline-none placeholder:text-muted-foreground lg:text-[13px]"
      />
      {text.trim() && (
        <Button size="icon" className="size-7 shrink-0 rounded-full [@media(pointer:coarse)]:size-9" aria-label="Send reply" onClick={send}>
          <Icon icon={ArrowUp02Icon} className="size-[14px]" strokeWidth={2.2} />
        </Button>
      )}
    </div>
    {m.list}
    <MentionNote people={m.mentioned} />
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
  sheet = false,
  reply = false,
  quiet = false,
  locked = false,
  onEditing,
}: {
  person: Person;
  at: number;
  edited?: boolean;
  text: string;
  onResolve?: () => void;
  onEdit?: (text: string) => void;
  onDelete?: () => void;
  /* touch: More opens the product's action sheet, not a small menu */
  sheet?: boolean;
  reply?: boolean;
  /* the thread is not the chosen one: its tools wait for it to be chosen (or the pointer) */
  quiet?: boolean;
  /* a comment in this thread is being edited: no tools beside the others */
  locked?: boolean;
  onEditing?: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  useEffect(() => { onEditing?.(editing); }, [editing, onEditing]);
  const [menu, setMenu] = useState(false);
  const editBox = useRef<HTMLDivElement>(null);
  const wantsEdit = useRef(false);
  const focusEdit = () => {
    const t = editBox.current?.querySelector("textarea");
    if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
  };
  useEffect(() => { if (editing) window.setTimeout(() => editBox.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 80); }, [editing]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [menu]);
  return (
    <div className="mt-3 flex gap-2.5">
      <PersonDot person={person} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-foreground">{person.name}</span>
          <span className="shrink-0 text-[12px] text-muted-foreground">{timeAgo(at)}{edited ? " · edited" : ""}</span>
          <span className={cn("ml-auto flex shrink-0 items-center transition-opacity", (editing || locked) && "hidden", quiet && "pointer-events-none opacity-0 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 [@media(hover:hover)]:group-hover/card:pointer-events-auto [@media(hover:hover)]:group-hover/card:opacity-100")}>
            {onResolve && (
              <Tip label="Resolve">
                <Button variant="ghost" size="icon" aria-label="Resolve" className="size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9" onClick={onResolve}>
                  <Icon icon={CheckmarkCircle02Icon} className="size-[16px]" strokeWidth={1.8} />
                </Button>
              </Tip>
            )}
            {(onEdit || onDelete) && sheet && (
              <>
                <Button variant="ghost" size="icon" aria-label="More" className="size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9" onClick={() => setMenu(true)}>
                  <Icon icon={MoreHorizontal} className="size-[16px]" strokeWidth={2} />
                </Button>
                <ActionSheet open={menu} onOpenChange={setMenu} mark={<PersonDot person={person} size={24} />} title={person.you ? (reply ? "Your reply" : "Your comment") : `${person.name.split(" ")[0]}'s ${reply ? "reply" : "comment"}`} kind={text.length > 60 ? text.slice(0, 60) + "..." : text}>
                  {onEdit && <ActionSheetItem icon={PencilEdit02Icon} label="Edit" onClick={() => { setMenu(false); setEditing(true); window.setTimeout(focusEdit, 360); }} />}
                  {onDelete && <ActionSheetItem icon={Delete02Icon} label="Delete" destructive onClick={() => { setMenu(false); onDelete(); }} />}
                </ActionSheet>
              </>
            )}
            {(onEdit || onDelete) && !sheet && (
              <DropdownMenu open={menu} onOpenChange={setMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More" className="size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9">
                    <Icon icon={MoreHorizontal} className="size-[16px]" strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36" onCloseAutoFocus={(e) => { if (wantsEdit.current) { wantsEdit.current = false; e.preventDefault(); focusEdit(); } }}>
                  {onEdit && (
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); wantsEdit.current = true; setMenu(false); setEditing(true); }}>
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
          <div ref={editBox} data-edit-form="" className="mt-1.5 scroll-mb-48">
            <CommentForm initial={text} submitLabel="Save" placeholder="Edit comment" onSubmit={(v) => { onEdit(v); setEditing(false); }} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-[19px] text-foreground/90">{withMentions(text)}</p>
        )}
      </div>
    </div>
  );
}

export function ThreadCard({ t, v, inSheet = false, onDone }: { t: Thread; v: NotesView; inSheet?: boolean; onDone?: () => void }) {
  const focused = !inSheet && v.focus?.kind === "thread" && v.focus.id === t.id;
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const onEditing = useCallback((key: string) => (on: boolean) => setEditing((cur) => (cur[key] === on ? cur : { ...cur, [key]: on })), []);
  const anyEditing = Object.values(editing).some(Boolean);
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
        "group/card rounded-xl transition-colors",
        inSheet ? "py-1" : "cursor-pointer px-3 py-2.5",
        !inSheet && (focused ? "bg-muted/60" : "hover:bg-muted/50"),
      )}
    >
      {t.resolved && (
        <div className="-mr-1.5 -mt-1 mb-2 flex items-center gap-2 text-[12px] text-muted-foreground">
          <Icon icon={CheckmarkCircle02Icon} className="size-[14px]" strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate">Resolved by {resolvedBy}</span>
          <Button variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-xs font-medium text-primary hover:text-primary [@media(pointer:coarse)]:h-9" onClick={() => v.api.reopen(t.id)}>Reopen</Button>
          <Button variant="ghost" size="icon" aria-label="Collapse" className="size-7 rounded-full text-muted-foreground [@media(pointer:coarse)]:size-9" onClick={() => setExpanded(false)}>
            <Icon icon={ArrowUp01Icon} className="size-[14px]" strokeWidth={2} />
          </Button>
        </div>
      )}
      <QuoteLine text={t.quote} />
      <div className="mt-1.5 flex items-center gap-1.5 pl-[10px] text-[12px] text-muted-foreground">
        <TimeChip timestamp={v.timeOf(t)} onSeek={v.seek} />
        {speaker && <span className="truncate">{speaker}</span>}
      </div>
      <Entry
        person={t.by}
        at={t.at}
        edited={t.edited}
        text={t.text}
        onResolve={t.resolved ? undefined : () => { onDone?.(); v.api.resolve(t.id); toastUndo("Comment resolved", () => v.api.reopen(t.id), CheckmarkCircle02Icon); }}
        onEdit={t.by.you ? (text) => v.api.editThread(t.id, text) : undefined}
        onDelete={canRemove(v, t.by) ? () => { onDone?.(); deleteThreadWithUndo(v.api, t.id); } : undefined}
        sheet={v.sheet}
        quiet={!inSheet && !focused}
        locked={anyEditing}
        onEditing={onEditing(t.id)}
      />
      {t.replies.map((r) => (
        <Entry
          key={r.id}
          person={r.by}
          at={r.at}
          edited={r.edited}
          text={r.text}
          onEdit={r.by.you ? (text) => v.api.editReply(t.id, r.id, text) : undefined}
          onDelete={canRemove(v, r.by) ? () => { onDone?.(); deleteReplyWithUndo(v.api, t.id, r.id); } : undefined}
          sheet={v.sheet}
          reply
          quiet={!inSheet && !focused}
          locked={anyEditing}
          onEditing={onEditing(r.id)}
        />
      ))}
      {!t.resolved && <div className={(inSheet || focused) && !anyEditing ? undefined : "hidden"}><ReplyField onSend={(text) => v.api.reply(t.id, text)} /></div>}
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
    return <Empty icon={Comment01Icon} title="No comments yet" line="Select words in the transcript, then choose Comment." />;
  }
  return (
    <div className="flex flex-col gap-2 px-2 py-2">
      {v.api.threads.map((t) => <ThreadCard key={t.id} t={t} v={v} />)}
    </div>
  );
}

function HighlightItem({ h, v, playing }: { h: Highlight; v: NotesView; playing: boolean }) {
  const text = v.textOf(h.segmentId).slice(h.start, h.end);
  const speaker = v.speakerOf(h.segmentId);
  const timestamp = v.timeOf(h);
  const focused = v.focus?.kind === "highlight" && v.focus.id === h.id;
  const linked = v.api.threads.filter((t) => !t.resolved && t.segmentId === h.segmentId && overlaps(t, h));
  const label = v.labels.labelOf(h.labelId);
  const editable = canRemove(v, h.by);
  const tool = "size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9";
  const [menu, setMenu] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(text); toast("Text copied"); };
  return (
    <div
      data-highlight-item={h.id}
      role="button"
      tabIndex={0}
      onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) v.goTo(h, { kind: "highlight", id: h.id }); }}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) v.goTo(h, { kind: "highlight", id: h.id }); }}
      className={cn("group/hl cursor-pointer rounded-xl px-3 py-2 transition-colors hover:bg-muted/50", (focused || playing) && "bg-muted/60 hover:bg-muted/60")}
    >
      <div className="flex h-7 items-center gap-1.5 text-[12px] text-muted-foreground">
        <TimeChip timestamp={timestamp} onSeek={v.seek} />
        {speaker && <span className="truncate">{speaker}</span>}
        {playing && <span className="shrink-0 font-medium text-primary">· Playing</span>}
        {/* touch: one More per highlight instead of three tools on every row */}
        {v.sheet ? (
          <>
            <Button variant="ghost" size="icon" aria-label="More" className={cn(tool, "ml-auto")} onClick={() => setMenu(true)}>
              <Icon icon={MoreHorizontal} className="size-[16px]" strokeWidth={2} />
            </Button>
            <ActionSheet open={menu} onOpenChange={setMenu} mark={<LabelIcon label={label} className="size-5" />} tile={labelTile(label)} title={label.name} kind={text.length > 60 ? text.slice(0, 60) + "..." : text}>
              <ActionSheetItem icon={CommentAdd01Icon} label="Comment" onClick={() => { setMenu(false); v.commentOn(h, h.id); }} />
              <ActionSheetItem icon={Copy01Icon} label="Copy" onClick={() => { setMenu(false); copy(); }} />
              {editable && <ActionSheetItem icon={Delete02Icon} label="Remove highlight" destructive onClick={() => { setMenu(false); removeHighlightWithUndo(v.api, h.id); }} />}
            </ActionSheet>
          </>
        ) : (
        <span className="ml-auto flex shrink-0 items-center transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/hl:opacity-100 [@media(hover:hover)]:group-focus-within/hl:opacity-100">
          <Tip label="Comment">
            <Button variant="ghost" size="icon" aria-label="Comment on highlight" className={tool} onClick={() => v.commentOn(h, h.id)}>
              <Icon icon={CommentAdd01Icon} className="size-[15px]" strokeWidth={1.8} />
            </Button>
          </Tip>
          <Tip label="Copy">
            <Button variant="ghost" size="icon" aria-label="Copy highlight" className={tool} onClick={copy}>
              <Icon icon={Copy01Icon} className="size-[15px]" strokeWidth={1.8} />
            </Button>
          </Tip>
          {editable && (
            <Tip label="Remove highlight">
              <Button variant="ghost" size="icon" aria-label="Remove highlight" className={tool} onClick={() => removeHighlightWithUndo(v.api, h.id)}>
                <Icon icon={Delete02Icon} className="size-[15px]" strokeWidth={1.8} />
              </Button>
            </Tip>
          )}
        </span>
        )}
      </div>
      <p className="text-[13px] leading-[20px] text-foreground">{text}</p>
      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
        {editable ? (
          <LabelPicker
            labels={v.labels}
            currentId={label.id}
            sheet={v.sheet}
            title="Label"
            onPick={(id) => v.api.setLabel(h.id, id)}
            onManage={v.manageLabels}
            trigger={
              <button type="button" aria-label={`Label: ${label.name}. Change`} className="-mx-1.5 rounded-md px-1.5 transition-colors hover:bg-muted data-[state=open]:bg-muted [@media(pointer:coarse)]:-my-1.5 [@media(pointer:coarse)]:py-1.5">
                <LabelChip label={label}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M6 9l6 6 6-6" /></svg>
                </LabelChip>
              </button>
            }
          />
        ) : (
          <LabelChip label={label} />
        )}
        {!h.by.you && <span className="min-w-0 truncate">by {h.by.name.split(" ")[0]}</span>}
        {linked.length > 0 && (() => {
          const n = linked.reduce((sum, t) => sum + 1 + t.replies.length, 0);
          return (
            <button type="button" className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline [@media(pointer:coarse)]:-my-2.5 [@media(pointer:coarse)]:py-2.5" onClick={() => v.openThread(linked[0].id)}>
              <Icon icon={Comment01Icon} className="size-[13px]" strokeWidth={2} />
              {n === 1 ? "1 comment" : `${n} comments`}
            </button>
          );
        })()}
      </div>
    </div>
  );
}

/* The highlights, in the order they were said. Filter by label, play them
   back to back, copy them as a list. */
export function HighlightsList({ v, title }: { v: NotesView; title: string }) {
  useRevealFocused(v.focus?.kind === "highlight" ? v.focus : null, "data-highlight-item");
  const [filter, setFilter] = useState<string>("all");
  const all = v.api.highlights;
  const used = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of all) { const id = v.labels.labelOf(h.labelId).id; counts.set(id, (counts.get(id) ?? 0) + 1); }
    return v.labels.labels.filter((l) => counts.has(l.id)).map((l) => ({ label: l, count: counts.get(l.id) ?? 0 }));
  }, [all, v.labels]);
  const active = filter !== "all" && used.some((u) => u.label.id === filter) ? filter : "all";
  const list = active === "all" ? all : all.filter((h) => v.labels.labelOf(h.labelId).id === active);
  const playingId = v.reel ? v.reel.ids[v.reel.index] : null;
  if (all.length === 0) {
    return <Empty icon={HighlighterIcon} title="No highlights yet" line="Select words in the transcript, or highlight what is playing from the player." />;
  }
  const copyAll = () => {
    const body = list
      .map((h) => {
        const who = v.speakerOf(h.segmentId);
        return `${v.timeOf(h)}${who ? ` ${who}` : ""} · ${v.labels.labelOf(h.labelId).name}\n"${v.textOf(h.segmentId).slice(h.start, h.end)}"`;
      })
      .join("\n\n");
    void navigator.clipboard?.writeText(`Highlights: ${title}\n\n${body}`);
    toast(list.length === 1 ? "Highlight copied" : `${list.length} highlights copied`);
  };
  const chip = (on: boolean) => cn(
    "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors [@media(pointer:coarse)]:h-9",
    on ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-muted-foreground/40",
  );
  return (
    <div className="flex flex-col px-2 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2 px-1">
        {v.reel ? (
          <Button variant="pill-outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs font-medium [@media(pointer:coarse)]:h-9" onClick={v.stopReel}>
            <Icon icon={StopIcon} className="size-[13px]" strokeWidth={2} />Stop
            <span className="tabular-nums text-muted-foreground">· {v.reel.index + 1} of {v.reel.ids.length}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" data-list-play="" className="h-7 gap-1.5 rounded-full px-2 text-xs font-medium text-primary hover:text-primary [@media(pointer:coarse)]:h-9" onClick={() => v.playAll(list.map((h) => h.id))}>
            <Icon icon={PlayIcon} className="size-[13px]" strokeWidth={2} />{active === "all" ? "Play all" : "Play"}
          </Button>
        )}
        <Button variant="ghost" size="sm" data-list-copy="" className="h-7 gap-1.5 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:h-9" onClick={copyAll}>
          <Icon icon={Copy01Icon} className="size-[14px]" strokeWidth={1.8} />{active === "all" ? "Copy all" : "Copy"}
        </Button>
      </div>
      {used.length > 1 && (
        <div data-label-filter="" role="group" aria-label="Filter by label" className="mt-2 flex flex-wrap gap-1.5 px-3">
          <button type="button" aria-pressed={active === "all"} className={chip(active === "all")} onClick={() => setFilter("all")}>
            All<span className={cn("tabular-nums", active === "all" ? "opacity-60" : "text-muted-foreground")}>{all.length}</span>
          </button>
          {used.map(({ label, count }) => (
            <button key={label.id} type="button" aria-pressed={active === label.id} className={chip(active === label.id)} onClick={() => setFilter(label.id)}>
              <span className="min-w-0 truncate">{label.name}</span><span className={cn("tabular-nums", active === label.id ? "opacity-60" : "text-muted-foreground")}>{count}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-1">
        {list.map((h) => <HighlightItem key={h.id} h={h} v={v} playing={playingId === h.id} />)}
      </div>
    </div>
  );
}

/* On a phone the discussion on a block opens from the bottom, over the
   transcript, with the quote on every card. */
export function ThreadSheet({ threads, v, onClose }: { threads: Thread[]; v: NotesView; onClose: () => void }) {
  return (
    <Drawer open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent data-thread-sheet="" aria-describedby={undefined} onEscapeKeyDown={threadFieldTakesEscape} className="max-h-[88vh] [&>div:first-child]:hidden">
        <DrawerHeader className="flex-row items-center justify-between pb-1 text-left">
          <DrawerTitle className="text-[17px] font-semibold">Comments</DrawerTitle>
          <Button variant="ghost" size="icon" aria-label="Close" className="size-9 rounded-full text-muted-foreground" onClick={onClose}>
            <Icon icon={Cancel01Icon} className="size-[18px]" strokeWidth={1.8} />
          </Button>
        </DrawerHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-6">
          {threads.map((t) => <ThreadCard key={t.id} t={t} v={v} inSheet onDone={onClose} />)}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
