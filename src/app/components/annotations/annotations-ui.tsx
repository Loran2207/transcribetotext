import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import type { AnnotationsApi, LabelsApi } from "@/hooks/use-annotations";
import { HighlightButton, LabelChip, LabelIcon, LabelPicker, WASH, WASH_ON } from "./labels-ui";
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
  colorOf,
  playback,
}: {
  text: string;
  highlights: Highlight[];
  threads: Thread[];
  focus: Focus | null;
  pending?: { start: number; end: number };
  onMark?: (run: Run, rect: DOMRect) => void;
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
              onMark({ ...r, threads: th }, e.currentTarget.getBoundingClientRect());
            }}
            className={cn(
              hl && cn(HIGHLIGHT_SHAPE, WASH[color]),
              hlFocused && WASH_ON[color],
              th.length > 0 && "underline decoration-primary/50 decoration-[1.5px] underline-offset-[4px]",
              /* the thread being read: its words lit, but a highlight keeps its colour */
              thFocused && (hl ? "decoration-primary decoration-2 ring-1 ring-primary/40" : "rounded-[3px] bg-primary/15 decoration-primary"),
              isPending && "rounded-[3px] bg-primary/20",
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
        className={cn("flex items-center gap-0.5 rounded-full border border-border/70 bg-background/95 p-1 shadow-sm backdrop-blur-[2px] transition-all duration-150", shown)}
      >
        <HighlightButton labels={labels} sheet={sheet} variant="icon" current={current} onHighlight={onHighlight} onRemove={onRemoveHighlight} onManage={onManageLabels} />
        <Tip label="Comment">
          <Button variant="ghost" size="icon" aria-label="Comment on block" className={btn} onClick={onComment}>
            <Icon icon={CommentAdd01Icon} className={icon} strokeWidth={1.8} />
          </Button>
        </Tip>
        <Tip label="Copy text">
          <Button variant="ghost" size="icon" aria-label="Copy text" className={btn} onClick={onCopy}>
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

/* The bar on a highlighted passage: the same floating pill as the one over
   selected words. Closes on any press outside it and on scroll. */
export function MarkBar({
  rect,
  below,
  actions,
  lead,
  onClose,
}: {
  rect: { left: number; top: number; width: number; bottom: number };
  below?: boolean;
  actions: BarAction[];
  lead?: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  useLayoutEffect(() => {
    const w = ref.current?.offsetWidth ?? 0;
    setLeft(Math.max(8, Math.min(window.innerWidth - w - 8, rect.left + rect.width / 2 - w / 2)));
  }, [rect.left, rect.width]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
      className="fixed z-50 flex max-w-[calc(100vw-16px)] items-center gap-0.5 rounded-full border border-border/70 bg-background/95 p-1 shadow-sm backdrop-blur-[2px] animate-in fade-in zoom-in-95 duration-150"
      style={{ left: left ?? rect.left, top: below ? rect.bottom + 8 : rect.top - 44, visibility: left === null ? "hidden" : undefined }}
    >
      {lead}
      {lead && <span className="mx-0.5 h-4 w-px bg-border" />}
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

/* @ in a comment opens the people on the record; the pick goes in as @Full Name.
   In a bottom sheet the list sits in the flow under the field: floating, it
   either fell off the screen or covered the quote. */
function useMentions(text: string, setText: (t: string) => void, place: "up" | "down" | "inline" = "up") {
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
    <div data-mention-list="" className={cn("rounded-xl border border-border bg-popover p-1", place === "inline" ? "mt-2" : "absolute left-0 z-30 w-60 shadow-md", place === "up" && "bottom-full mb-1.5", place === "down" && "top-full mt-1.5")}>
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
function MentionNote({ people }: { people: Person[] }) {
  if (!people.length) return null;
  const names = people.map((p) => p.name);
  const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return <p className="mt-1.5 text-[12px] text-muted-foreground">{who} will get an email.</p>;
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
  mentions = "down",
}: {
  initial?: string;
  submitLabel: string;
  placeholder: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  mentions?: "up" | "down" | "inline";
}) {
  const [text, setText] = useState(initial);
  const m = useMentions(text, setText, mentions);
  const send = () => { const v = text.trim(); if (v) onSubmit(v); };
  return (
    <div>
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
      {mentions === "inline" && m.list}
      <MentionNote people={m.mentioned} />
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
        <DrawerContent data-comment-composer="" aria-describedby={undefined} className="[&>div:first-child]:hidden">
          <DrawerHeader className="pb-2 text-left">
            <DrawerTitle className="text-[17px] font-semibold">Comment</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-5">
            <QuoteLine text={quote} clamp={3} />
            <div className="mt-3">
              <CommentForm submitLabel="Comment" placeholder="Add a comment" onSubmit={onSubmit} onCancel={onCancel} mentions="inline" />
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
  const m = useMentions(text, setText);
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
      {m.list}
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
        <Button size="icon" className="size-7 shrink-0 rounded-full" aria-label="Send reply" onClick={send}>
          <Icon icon={ArrowUp02Icon} className="size-[14px]" strokeWidth={2.2} />
        </Button>
      )}
    </div>
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
  const [menu, setMenu] = useState(false);
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
          <span className="ml-auto flex shrink-0 items-center">
            {onResolve && (
              <Tip label="Resolve">
                <Button variant="ghost" size="icon" aria-label="Resolve" className="size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9" onClick={onResolve}>
                  <Icon icon={CheckmarkCircle02Icon} className="size-[16px]" strokeWidth={1.8} />
                </Button>
              </Tip>
            )}
            {(onEdit || onDelete) && (
              <DropdownMenu open={menu} onOpenChange={setMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More" className="size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9">
                    <Icon icon={MoreHorizontal} className="size-[16px]" strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36" onCloseAutoFocus={(e) => { if (editing) e.preventDefault(); }}>
                  {onEdit && (
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMenu(false); setEditing(true); }}>
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
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-[19px] text-foreground/90">{withMentions(text)}</p>
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
        <TimeChip timestamp={v.timeOf(t)} onSeek={v.seek} />
        {speaker && <span className="truncate">{speaker}</span>}
      </div>
      <Entry
        person={t.by}
        at={t.at}
        edited={t.edited}
        text={t.text}
        onResolve={t.resolved ? undefined : () => { v.api.resolve(t.id); toastUndo("Comment resolved", () => v.api.reopen(t.id), CheckmarkCircle02Icon); }}
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

function HighlightItem({ h, v, playing }: { h: Highlight; v: NotesView; playing: boolean }) {
  const text = v.textOf(h.segmentId).slice(h.start, h.end);
  const speaker = v.speakerOf(h.segmentId);
  const timestamp = v.timeOf(h);
  const focused = v.focus?.kind === "highlight" && v.focus.id === h.id;
  const linked = v.api.threads.filter((t) => !t.resolved && t.segmentId === h.segmentId && overlaps(t, h));
  const label = v.labels.labelOf(h.labelId);
  const editable = canRemove(v, h.by);
  const tool = "size-7 rounded-full text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:size-9";
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
        {playing && <span className="shrink-0 font-medium text-primary">Playing</span>}
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
          {editable && (
            <Tip label="Remove highlight">
              <Button variant="ghost" size="icon" aria-label="Remove highlight" className={tool} onClick={() => removeHighlightWithUndo(v.api, h.id)}>
                <Icon icon={Delete02Icon} className="size-[15px]" strokeWidth={1.8} />
              </Button>
            </Tip>
          )}
        </span>
      </div>
      <p className="text-[13px] leading-[20px] text-foreground/90">
        <span className={cn(HIGHLIGHT_SHAPE, WASH[label.color], "px-0.5")}>{text}</span>
      </p>
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
              <button type="button" aria-label={`Label: ${label.name}. Change`} className="rounded-full transition-opacity hover:opacity-80">
                <LabelChip label={label}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M6 9l6 6 6-6" /></svg>
                </LabelChip>
              </button>
            }
          />
        ) : (
          <LabelChip label={label} />
        )}
        {!h.by.you && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <PersonDot person={h.by} size={16} />
            <span className="truncate">by {h.by.name.split(" ")[0]}</span>
          </span>
        )}
        {linked.length > 0 && (
          <button type="button" className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline" onClick={() => v.openThread(linked[0].id)}>
            <Icon icon={Comment01Icon} className="size-[13px]" strokeWidth={2} />
            {linked.length === 1 ? "1 comment" : `${linked.length} comments`}
          </button>
        )}
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
    return <Empty icon={HighlighterIcon} title="No highlights yet" line="Select words in the transcript, or press Highlight in the player while it plays." />;
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
    "inline-flex h-7 max-w-[200px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors [@media(pointer:coarse)]:h-9",
    on ? "border-foreground/80 bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
  );
  return (
    <div className="flex flex-col px-2 pb-3 pt-2">
      <div className="flex items-center justify-between gap-2 px-1">
        {v.reel ? (
          <Button size="sm" className="h-7 gap-1.5 rounded-full px-3 text-xs" onClick={v.stopReel}>
            <Icon icon={StopIcon} className="size-[13px]" strokeWidth={2} />Stop
            <span className="tabular-nums opacity-80">· {v.reel.index + 1} of {v.reel.ids.length}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium text-primary hover:text-primary" onClick={() => v.playAll(list.map((h) => h.id))}>
            <Icon icon={PlayIcon} className="size-[13px]" strokeWidth={2} />Play all
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground" onClick={copyAll}>
          <Icon icon={Copy01Icon} className="size-[14px]" strokeWidth={1.8} />Copy all
        </Button>
      </div>
      {used.length > 1 && (
        <div data-label-filter="" className="mt-2 flex flex-wrap gap-1.5 px-1 pb-1">
          <button type="button" className={chip(active === "all")} onClick={() => setFilter("all")}>All<span className="tabular-nums opacity-70">{all.length}</span></button>
          {used.map(({ label, count }) => (
            <button key={label.id} type="button" className={chip(active === label.id)} onClick={() => setFilter(label.id)}>
              <LabelIcon label={label} className="size-3.5" />
              <span className="min-w-0 truncate">{label.name}</span><span className="tabular-nums opacity-70">{count}</span>
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
      <DrawerContent data-thread-sheet="" aria-describedby={undefined} className="max-h-[88vh] [&>div:first-child]:hidden">
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
