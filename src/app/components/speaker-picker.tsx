import type React from "react";
import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { Search01Icon, PlusSignIcon, UserAdd01Icon, ArrowRight01Icon, ArrowLeft01Icon, Tick02Icon, Cancel01Icon, MoreHorizontalCircle01Icon, UserGroupIcon, Delete02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Icon } from "./ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { useIsPhone } from "./ui/use-mobile";
import { cn } from "./ui/utils";

export interface PickerSpeaker {
  id: string;
  name: string;
  color: string;
  initial: string;
  avatar?: string;
  you?: boolean;
}

/* The scope is always asked the same way, in words, next to the name you
   point at: only this block, or every block by the voice you started from.
   Picking an existing person with "all" merges the voices; typing a new name
   with "all" renames the voice everywhere. Nothing is renamed silently. */
export type SpeakerChoice =
  | { kind: "move"; speakerId: string }
  | { kind: "move-all"; speakerId: string }
  | { kind: "rename"; name: string }
  | { kind: "add"; name: string };

type Scope = "block" | "all";

/* the one pencil of the product: the records table's rename glyph (Kirill 23.09,
   "везде поставить одну иконку"). Used on names, rows, the header chip and Edit transcript. */
export function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16" aria-hidden>
      <path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpeakerDot({ speaker, className }: { speaker: PickerSpeaker; className?: string }) {
  if (speaker.avatar) return <img src={speaker.avatar} alt="" className={cn("size-6 shrink-0 rounded-full object-cover", className)} />;
  return (
    <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white", className)} style={{ backgroundColor: speaker.color }}>
      {speaker.initial}
    </span>
  );
}

function Name({ speaker, className }: { speaker: PickerSpeaker; className?: string }) {
  return (
    <span className={cn("min-w-0 flex-1 truncate", className)}>
      {speaker.name}{speaker.you && <span className="ml-1 font-normal text-muted-foreground">(you)</span>}
    </span>
  );
}

const blocksLabel = (n: number) => (n === 1 ? "1 block" : `${n} blocks`);

function choiceFor(target: { speakerId?: string; name?: string }, scope: Scope): SpeakerChoice {
  if (target.speakerId) return scope === "all" ? { kind: "move-all", speakerId: target.speakerId } : { kind: "move", speakerId: target.speakerId };
  return scope === "all" ? { kind: "rename", name: target.name ?? "" } : { kind: "add", name: target.name ?? "" };
}

/* The two scope rows. Desktop shows them as a side menu that opens on hover,
   the phone shows them as the second step of the sheet. */
function ScopeRows({ current, blockCount, onPick, className }: { current: PickerSpeaker; blockCount: number; onPick: (scope: Scope) => void; className?: string }) {
  const row = "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted/60 active:bg-muted/60";
  return (
    <div className={className}>
      <button type="button" className={row} onClick={() => onPick("block")}>Only this block</button>
      <button type="button" className={row} onClick={() => onPick("all")}>
        <span>All {blocksLabel(blockCount)} by <span className="font-medium">{current.name}</span></span>
      </button>
    </div>
  );
}

function useSpeakerQuery(speakers: PickerSpeaker[]) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  const list = q ? speakers.filter((s) => s.name.toLowerCase().includes(q)) : speakers;
  const exact = speakers.some((s) => s.name.toLowerCase() === q);
  return { query, setQuery, trimmed, list, canAdd: trimmed.length > 0 && !exact };
}

/* Explains the split the first time: shown above the list only while some of
   the block stays unselected, closed with the x and never shown again. */
const SPLIT_NOTE_KEY = "ttt_split_note_seen";
function SplitNote({ note, phone = false }: { note: string; phone?: boolean }) {
  const [seen, setSeen] = useState<boolean>(() => { try { return window.localStorage.getItem(SPLIT_NOTE_KEY) === "1"; } catch { return false; } });
  if (seen) return null;
  const hide = () => { setSeen(true); try { window.localStorage.setItem(SPLIT_NOTE_KEY, "1"); } catch { /* private mode */ } };
  return (
    <div data-split-note="" className={cn("flex items-start gap-1.5 text-[11px] leading-[15px] text-primary", phone ? "mx-4 mb-1 px-1 text-[12px] leading-[16px]" : "border-b border-border/60 px-3.5 py-2")}>
      <Icon icon={InformationCircleIcon} size={13} className="mt-px shrink-0" />
      <span className="min-w-0 flex-1">{note}</span>
      <button type="button" aria-label="Got it" onClick={hide} className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-primary/60 hover:bg-primary/[0.06] hover:text-primary active:bg-primary/[0.06]"><Icon icon={Cancel01Icon} size={13} /></button>
    </div>
  );
}

/* ── Variant A, desktop: dropdown on the name, side menu for the scope ── */
function SpeakerMenu({ current, speakers, blockCount, onPick, scopeless = false, onManage, onRename, note, onPreview }: { current: PickerSpeaker; speakers: PickerSpeaker[]; blockCount: number; onPick: (choice: SpeakerChoice) => void; scopeless?: boolean; onManage?: () => void; onRename?: (id: string, name: string) => void; note?: string; onPreview?: (speakerId: string | null) => void }) {
  const { query, setQuery, trimmed, list, canAdd } = useSpeakerQuery(speakers);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [addMode, setAddMode] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const commitRename = (id: string) => { const v = draft.trim(); const was = speakers.find((x) => x.id === id)?.name; setEditing(null); if (v && v !== was) onRename?.(id, v); };
  const [armed, setArmed] = useState<string | null>(null);
  const pinned = useRef(false);
  const [top, setTop] = useState(0);
  const timer = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const stay = () => { if (timer.current) window.clearTimeout(timer.current); };
  /* hover opens the side menu and lets it go; a click (touch, keyboard) pins it */
  const leave = () => { stay(); if (!pinned.current) timer.current = window.setTimeout(() => setArmed(null), 160); };
  const arm = (key: string, el: HTMLElement, pin = false) => {
    /* for a piece of text there is no scope to ask: the row itself is the answer */
    if (scopeless && pin) { onPick(key === "add" ? { kind: "add", name: trimmed } : { kind: "move", speakerId: key }); return; }
    if (scopeless) return;
    stay();
    const b = box.current?.getBoundingClientRect();
    if (b) setTop(el.getBoundingClientRect().top - b.top);
    if (pin) pinned.current = true;
    setArmed(key);
  };
  const target = armed === "add" ? { name: trimmed } : armed ? { speakerId: armed } : null;

  return (
    <div ref={box} className="relative" onMouseLeave={leave} onMouseEnter={stay}>
      <div className="flex items-center gap-2 border-b border-border/60 px-3.5 pt-3 pb-2.5">
        <Icon icon={Search01Icon} size={14} className="shrink-0 text-muted-foreground/60" />
        <input
          ref={search}
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); pinned.current = false; setArmed(null); }}
          placeholder={addMode ? "New speaker's name" : "Search or type a name"}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      {note && <SplitNote note={note} />}
      <div className="p-1.5">
        {list.length > 0 && <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground">{scopeless ? "Who said this part?" : "Speakers"}</p>}
        {list.map((s) => {
          const isCurrent = s.id === current.id;
          if (editing === s.id) {
            return (
              <div key={s.id} data-speaker-row={s.id} className="flex items-center gap-2.5 rounded-xl px-3 py-1.5">
                <SpeakerDot speaker={s} />
                <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => commitRename(s.id)} onKeyDown={(e) => { if (e.key === "Enter") commitRename(s.id); if (e.key === "Escape") setEditing(null); e.stopPropagation(); }} aria-label="Speaker name" className="h-8 min-w-0 flex-1 rounded-[7px] px-2 text-[13px]" />
              </div>
            );
          }
          return (
            <div
              key={s.id}
              data-speaker-row={s.id}
              role="button"
              tabIndex={isCurrent ? -1 : 0}
              aria-disabled={isCurrent}
              onMouseEnter={(e) => { if (!isCurrent) { arm(s.id, e.currentTarget); onPreview?.(s.id); } }}
              onMouseLeave={() => onPreview?.(null)}
              onFocus={(e) => { if (!isCurrent) { arm(s.id, e.currentTarget); onPreview?.(s.id); } }}
              onBlur={() => onPreview?.(null)}
              onClick={(e) => { if (!isCurrent) arm(s.id, e.currentTarget, true); }}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isCurrent) { e.preventDefault(); arm(s.id, e.currentTarget, true); } }}
              className={cn(
                "group/row flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors",
                isCurrent ? "text-primary" : "text-foreground hover:bg-muted/60",
                armed === s.id && "bg-muted/60",
              )}
            >
              <SpeakerDot speaker={s} />
              <Name speaker={s} />
              {/* the same row also renames: the pencil of "Edit transcript", shown on hover (Kirill 23.09: manage right here) */}
              {onRename && (
                <button type="button" data-rename-row={s.id} aria-label={`Rename ${s.name}`} onClick={(e) => { e.stopPropagation(); setDraft(s.name); setEditing(s.id); }} onMouseEnter={(e) => e.stopPropagation()} className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover/row:opacity-100 focus-visible:opacity-100">
                  <PencilIcon className="size-[13px]" />
                </button>
              )}
              {isCurrent ? (
                <Icon icon={Tick02Icon} size={15} className="shrink-0 text-primary" />
              ) : (
                !scopeless && <Icon icon={ArrowRight01Icon} size={14} className={cn("shrink-0 text-muted-foreground/70 transition-opacity", armed === s.id ? "opacity-100" : "opacity-0 group-hover/row:opacity-100")} />
              )}
            </div>
          );
        })}
        {list.length === 0 && !canAdd && <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">No one by that name</p>}
      </div>
      <div className="border-t border-border/60 p-1.5">
        {canAdd ? (
          <button
            type="button"
            data-add-speaker=""
            onMouseEnter={(e) => arm("add", e.currentTarget)}
            onFocus={(e) => arm("add", e.currentTarget)}
            onClick={(e) => arm("add", e.currentTarget, true)}
            className={cn("group/row flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-primary transition-colors hover:bg-primary/[0.06]", armed === "add" && "bg-primary/[0.06]")}
          >
            <Icon icon={PlusSignIcon} size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">Add <span className="font-semibold">{trimmed}</span> as a new speaker</span>
            {!scopeless && <Icon icon={ArrowRight01Icon} size={14} className={cn("shrink-0 text-primary/70 transition-opacity", armed === "add" ? "opacity-100" : "opacity-0 group-hover/row:opacity-100")} />}
          </button>
        ) : (
          /* always a way in (Kirill 23.09): with nothing typed the row hands you the search field */
          <button type="button" data-add-speaker="" onClick={() => { setAddMode(true); search.current?.focus(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-primary transition-colors hover:bg-primary/[0.06]">
            <Icon icon={PlusSignIcon} size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">Add a new speaker</span>
          </button>
        )}
      </div>
      {target && (
        <div
          className="absolute left-[calc(100%+6px)] w-[236px] rounded-xl border border-border bg-popover p-1.5 shadow-[var(--elevation-md)]"
          style={{ top }}
          onMouseEnter={stay}
          onMouseLeave={leave}
        >
          <ScopeRows current={current} blockCount={blockCount} onPick={(scope) => onPick(choiceFor(target, scope))} />
        </div>
      )}
    </div>
  );
}

/* ── Variant A, phone: the same list as a bottom sheet, scope as step two ── */
function SpeakerSheet({ current, speakers, blockCount, onPick, onClose, scopeless = false, title = "Change speaker", onManage, onRename, note }: { current: PickerSpeaker; speakers: PickerSpeaker[]; blockCount: number; onPick: (choice: SpeakerChoice) => void; onClose: () => void; scopeless?: boolean; title?: string; onManage?: () => void; onRename?: (id: string, name: string) => void; note?: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [addMode, setAddMode] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const commitRename = (id: string) => { const v = draft.trim(); const was = speakers.find((x) => x.id === id)?.name; setEditing(null); if (v && v !== was) onRename?.(id, v); };
  const { query, setQuery, trimmed, list, canAdd } = useSpeakerQuery(speakers);
  const [target, setTarget] = useState<{ speakerId?: string; name?: string } | null>(null);
  const targetName = target?.speakerId ? speakers.find((s) => s.id === target.speakerId)?.name : target?.name;
  return (
    <>
      <DrawerHeader className="flex-row items-center justify-between pb-2 text-left">
        {target ? (
          <button type="button" onClick={() => setTarget(null)} className="-ml-1 inline-flex items-center gap-1 text-[15px] font-semibold text-foreground">
            <Icon icon={ArrowLeft01Icon} size={18} className="text-muted-foreground" />{targetName}
          </button>
        ) : (
          <DrawerTitle>{title}</DrawerTitle>
        )}
        <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60">
          <Icon icon={Cancel01Icon} size={16} />
        </button>
      </DrawerHeader>
          {note && <SplitNote note={note} phone />}
      {target ? (
        <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <ScopeRows current={current} blockCount={blockCount} onPick={(scope) => onPick(choiceFor(target, scope))} className="[&>button]:py-3 [&>button]:text-[14px] [&>button]:rounded-xl" />
        </div>
      ) : (
        <>
          <div className="px-4 pb-2">
            <div className="flex h-10 items-center gap-2 rounded-xl bg-muted/50 px-3">
              <Icon icon={Search01Icon} size={15} className="shrink-0 text-muted-foreground/60" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} ref={search} placeholder={addMode ? "New speaker's name" : "Search or type a name"} className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/60" />
            </div>
          </div>
          <div className="px-4">
            {list.map((s) => {
              const isCurrent = s.id === current.id;
              return (
                editing === s.id ? (
                  <div key={s.id} data-speaker-row={s.id} className="flex items-center gap-3 rounded-xl px-3 py-1.5">
                    <SpeakerDot speaker={s} />
                    <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => commitRename(s.id)} onKeyDown={(e) => { if (e.key === "Enter") commitRename(s.id); if (e.key === "Escape") setEditing(null); }} aria-label="Speaker name" className="h-10 min-w-0 flex-1 rounded-xl px-3 text-[14px]" />
                  </div>
                ) :
                <div key={s.id} data-speaker-row={s.id} role="button" tabIndex={isCurrent ? -1 : 0} aria-disabled={isCurrent} onClick={() => { if (isCurrent) return; scopeless ? onPick({ kind: "move", speakerId: s.id }) : setTarget({ speakerId: s.id }); }} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-muted/60", isCurrent && "bg-primary/[0.06]")}>
                  <SpeakerDot speaker={s} className="size-7 text-[11px]" />
                  <Name speaker={s} className={cn("text-[14px] font-medium", isCurrent ? "text-primary" : "text-foreground")} />
                  {onRename && (
                    <button type="button" data-rename-row={s.id} aria-label={`Rename ${s.name}`} onClick={(e) => { e.stopPropagation(); setDraft(s.name); setEditing(s.id); }} className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted/60">
                      <PencilIcon className="size-[15px]" />
                    </button>
                  )}
                  {isCurrent ? <Icon icon={Tick02Icon} size={16} className="shrink-0 text-primary" /> : !scopeless && <Icon icon={ArrowRight01Icon} size={16} className="shrink-0 text-muted-foreground/60" />}
                </div>
              );
            })}
            {list.length === 0 && !canAdd && <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No one by that name</p>}
          </div>
          <div className="mt-2 border-t border-border/60 px-4 py-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
            {canAdd ? (
              <button type="button" data-add-speaker="" onClick={() => (scopeless ? onPick({ kind: "add", name: trimmed }) : setTarget({ name: trimmed }))} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-primary transition-colors active:bg-muted/60">
                <Icon icon={PlusSignIcon} size={15} /><span>Add <span className="font-semibold">{trimmed}</span> as a new speaker</span>
              </button>
            ) : (
              <button type="button" data-add-speaker="" onClick={() => { setAddMode(true); search.current?.focus(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-primary transition-colors active:bg-muted/60">
                <Icon icon={PlusSignIcon} size={15} /><span>Add a new speaker</span>
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function SpeakerPicker({
  current,
  speakers,
  blockCount,
  onPick,
  children,
  open,
  onOpenChange,
  scopeless = false,
  sheetTitle,
  onManage,
  onRename,
  note,
  onPreview,
  side,
}: {
  current: PickerSpeaker;
  speakers: PickerSpeaker[];
  blockCount: number;
  onPick: (choice: SpeakerChoice) => void;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /* a piece of text: rows answer directly, no side menu, no step two */
  scopeless?: boolean;
  sheetTitle?: string;
  /* opens the speakers panel (the whole list) from inside the block menu */
  onManage?: () => void;
  /* rename a voice right in the list */
  onRename?: (id: string, name: string) => void;
  /* one-time explanation above the list (the split case) */
  note?: string;
  /* a row is hovered: the page can show what the pick would do */
  onPreview?: (speakerId: string | null) => void;
  /* where the menu opens; the selection bar opens it upward so the picked words stay visible */
  side?: "top" | "bottom";
}) {
  const isPhone = useIsPhone();
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const pick = (choice: SpeakerChoice) => { onPreview?.(null); setOpen(false); onPick(choice); };
  const manage = onManage ? () => { setOpen(false); onManage(); } : undefined;
  useEffect(() => { if (!isOpen) onPreview?.(null); }, [isOpen]);

  if (isPhone) {
    return (
      <>
        <span onClick={() => setOpen(true)} className="contents">{children}</span>
        <Drawer open={isOpen} onOpenChange={setOpen}>
          <DrawerContent className="[&>div:first-child]:hidden">
            {isOpen && <SpeakerSheet current={current} speakers={speakers} blockCount={blockCount} onPick={pick} onClose={() => setOpen(false)} scopeless={scopeless} title={sheetTitle} onManage={manage} onRename={onRename} note={note} />}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" side={side} sideOffset={6} className="w-[300px] overflow-visible p-0">
        <SpeakerMenu current={current} speakers={speakers} blockCount={blockCount} onPick={pick} scopeless={scopeless} onManage={manage} onRename={onRename} note={note} onPreview={onPreview} />
      </PopoverContent>
    </Popover>
  );
}

/* ── Variant B (Figma reference, ttt_demo_speaker_dialog=1) ──
   The voice's own words as quotes you can play, one name field whose
   suggestions come from the invite first, the scope switch, Save. A centred
   dialog on desktop and tablet; on a phone the same content is a bottom sheet. */
export interface Quote { text: string; timestamp: string }

function PlayGlyph() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" /></svg>;
}
function PauseGlyph() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;
}

/* A quote with its timecode. The chip seeks the recording there and plays;
   while that quote is playing the chip turns primary and offers pause. */
function QuoteLine({ quote, playing, onPlay, onPause }: { quote: Quote; playing?: boolean; onPlay?: (timestamp: string) => void; onPause?: () => void }) {
  return (
    <div className="flex items-start gap-2 border-l-2 border-border pl-3">
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-foreground/80">“{quote.text}”</p>
      {onPlay && (
        <button
          type="button"
          onClick={() => (playing ? onPause?.() : onPlay(quote.timestamp))}
          aria-label={playing ? "Pause" : `Play from ${quote.timestamp}`}
          aria-pressed={playing}
          className={cn(
            "mt-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] tabular-nums transition-colors",
            playing ? "border-primary bg-primary text-primary-foreground" : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-primary",
          )}
        >
          {playing ? <PauseGlyph /> : <PlayGlyph />}{quote.timestamp}
        </button>
      )}
    </div>
  );
}

/* The name control is the house searchable select: a closed field with a
   chevron (nothing unrolls by itself), which opens to a search box and grouped
   rows: people from the invite first, then the transcript's voices, then add
   the typed name as a new person. On the phone the same list sits in the flow. */
function NameSelect({
  chosen,
  onChoose,
  onAddNew,
  candidates,
  attendees,
  isPhone,
  placeholder = "Who is this?",
}: {
  chosen: PickerSpeaker | null;
  onChoose: (s: PickerSpeaker | null) => void;
  onAddNew: (name: string) => void;
  candidates: PickerSpeaker[];
  attendees: PickerSpeaker[];
  isPhone: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    inputRef.current?.focus();
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  const match = (s: PickerSpeaker) => !q || s.name.toLowerCase().includes(q);
  const fromInvite = attendees.filter(match);
  const voices = candidates.filter(match);
  const exact = [...attendees, ...candidates].find((s) => s.name.toLowerCase() === q);
  const pick = (s: PickerSpeaker) => { onChoose(s); setOpen(false); setQuery(""); };
  const heading = "px-[12px] pt-[8px] pb-[4px] text-[10px] font-semibold tracking-wide text-muted-foreground";
  const row = (s: PickerSpeaker) => (
    <Button key={s.id} variant="ghost" onClick={() => pick(s)} className="flex h-[36px] w-full items-center gap-[10px] rounded-none px-[12px] transition-colors hover:bg-accent">
      <SpeakerDot speaker={s} className="size-5 text-[9px]" />
      <span className="flex-1 truncate text-left text-[13px] text-foreground">{s.name}{s.you && <span className="ml-1 text-muted-foreground">(you)</span>}</span>
    </Button>
  );
  const list = (
    <>
      <div className="p-[8px] pb-[4px]">
        <div className="relative">
          <Icon icon={Search01Icon} size={13} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or type a name" className="h-[32px] w-full rounded-[7px] pl-[28px] pr-[8px] text-[13px]" />
        </div>
      </div>
      <div className="overflow-y-auto pb-[4px]" style={{ maxHeight: "180px" }}>
        {fromInvite.length > 0 && <p className={heading}>From the invite</p>}
        {fromInvite.map(row)}
        {voices.length > 0 && <p className={heading}>In this transcript</p>}
        {voices.map(row)}
        {trimmed.length > 0 && !exact && (
          <Button variant="ghost" onClick={() => { onAddNew(trimmed); setOpen(false); setQuery(""); }} className="flex h-[36px] w-full items-center gap-[10px] rounded-none px-[12px] text-[13px] font-medium text-primary hover:bg-primary/[0.06] hover:text-primary">
            <Icon icon={UserAdd01Icon} size={15} /><span className="flex-1 truncate text-left">Add new person “{trimmed}”</span>
          </Button>
        )}
        {fromInvite.length + voices.length === 0 && trimmed.length === 0 && <p className="py-[16px] text-center text-[13px] text-muted-foreground">Type a name</p>}
      </div>
    </>
  );
  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-[40px] w-full items-center gap-[8px] rounded-[12px] border border-input bg-transparent px-[14px] text-sm transition-all"
      >
        {chosen ? (
          <>
            <SpeakerDot speaker={chosen} className="size-5 text-[9px]" />
            <span className="flex-1 truncate text-left text-sm text-foreground">{chosen.name}{chosen.you && <span className="ml-1 text-muted-foreground">(you)</span>}</span>
            <span role="button" aria-label="Clear" onClick={(e) => { e.stopPropagation(); onChoose(null); }} className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={14} /></span>
          </>
        ) : (
          <span className="flex-1 text-left text-sm text-muted-foreground">{placeholder}</span>
        )}
        <svg className={`size-[12px] shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Button>
      {/* desktop and tablet: floats under the field like the language selector;
          phone: the same box sits in the sheet's flow, a floating list would scroll away under the footer */}
      {open && !isPhone && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[12px] border border-border bg-popover shadow-md">{list}</div>
      )}
      {open && isPhone && <div className="mt-[6px] overflow-hidden rounded-[12px] border border-border bg-popover">{list}</div>}
    </div>
  );
}

/* the house mode toggle (Mono / Bi in the Record dialog), two options */
function ScopeSwitch({ scope, onChange, blockCount }: { scope: Scope; onChange: (s: Scope) => void; blockCount: number }) {
  return (
    <div className="flex h-[40px] items-center rounded-[12px] border border-border bg-muted/70 p-[3px]">
      {(["block", "all"] as Scope[]).map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className={`flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-[9px] px-[14px] text-[12px] font-medium transition-all ${scope === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {s === "block" ? "Only this block" : `All ${blocksLabel(blockCount)}`}
        </button>
      ))}
    </div>
  );
}

/* the same shell for both dialogs: centred on desktop and tablet, a sheet on
   the phone. The footer is the house one everywhere: Cancel and the primary
   action, right-aligned, on a top border (see Transcribe from link). */
function DialogShell({ open, onOpenChange, title, isPhone, children, footer, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; isPhone: boolean; children: ReactNode; footer: ReactNode; wide?: boolean }) {
  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh] [&>div:first-child]:hidden">
          <DrawerHeader className="flex-row items-center justify-between pb-1 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <button type="button" onClick={() => onOpenChange(false)} aria-label="Close" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={16} /></button>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">{children}</div>
          <div className="flex items-center justify-end gap-[8px] border-t border-border px-4 pt-[14px] pb-[calc(12px+env(safe-area-inset-bottom))]">{footer}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gap-4", wide ? "sm:max-w-[520px]" : "sm:max-w-[440px]")}>
        <DialogHeader className="text-left"><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:justify-end">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FooterButtons({ onCancel, onSave, saveLabel, canSave }: { onCancel: () => void; onSave: () => void; saveLabel: string; canSave: boolean }) {
  return (
    <>
      <Button variant="pill-outline" onClick={onCancel} className="h-[36px] px-[18px]"><span className="text-[13px] font-medium text-foreground">Cancel</span></Button>
      <Button onClick={onSave} disabled={!canSave} className="h-[36px] px-[18px] disabled:opacity-40"><span className="text-[13px] font-semibold">{saveLabel}</span></Button>
    </>
  );
}

export function SpeakerDialog({
  open,
  onOpenChange,
  current,
  speakers,
  attendees = [],
  blockCount,
  quotes,
  playing,
  onPlay,
  onPause,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: PickerSpeaker;
  speakers: PickerSpeaker[];
  attendees?: PickerSpeaker[];
  blockCount: number;
  quotes: Quote[];
  /* the recording is playing right now (the dialog remembers which chip started it) */
  playing?: boolean;
  onPlay?: (timestamp: string) => void;
  onPause?: () => void;
  onPick: (choice: SpeakerChoice) => void;
}) {
  const isPhone = useIsPhone();
  const [chosen, setChosen] = useState<PickerSpeaker | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("block");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  useEffect(() => { if (!open) { setChosen(null); setAdded(null); setScope("block"); setStartedAt(null); } }, [open]);
  useEffect(() => { if (!playing) setStartedAt(null); }, [playing]);
  const canSave = !!chosen || !!added;

  const save = () => {
    const isVoice = chosen && speakers.some((s) => s.id === chosen.id);
    if (chosen) onPick(isVoice ? choiceFor({ speakerId: chosen.id }, scope) : choiceFor({ name: chosen.name }, scope));
    else if (added) onPick(choiceFor({ name: added }, scope));
    onOpenChange(false);
  };
  const play = (ts: string) => { setStartedAt(ts); onPlay?.(ts); };
  const pause = () => { setStartedAt(null); onPause?.(); };
  /* a typed new person is shown in the field as a chosen chip too */
  const value: PickerSpeaker | null = chosen ?? (added ? { id: "new", name: added, color: "#6366f1", initial: added[0]?.toUpperCase() ?? "?" } : null);

  const footer = <FooterButtons onCancel={() => onOpenChange(false)} onSave={save} saveLabel="Save" canSave={canSave} />;

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title="Who is speaking?" isPhone={isPhone} footer={footer}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="size-2 rounded-full" style={{ backgroundColor: current.color }} />{current.name}
      </div>
      <div className="space-y-2">
        {quotes.slice(0, 2).map((qt, i) => <QuoteLine key={i} quote={qt} playing={!!playing && startedAt === qt.timestamp} onPlay={onPlay ? play : undefined} onPause={pause} />)}
      </div>
      <NameSelect chosen={value} onChoose={(s) => { setChosen(s); setAdded(null); }} onAddNew={(n) => { setAdded(n); setChosen(null); }} candidates={speakers.filter((s) => s.id !== current.id)} attendees={attendees} isPhone={isPhone} />
      <ScopeSwitch scope={scope} onChange={setScope} blockCount={blockCount} />
    </DialogShell>
  );
}

/* Name every voice the model could not match, in one go: each voice with two
   quotes to play and one name field. The way Wispr Flow does it after a call,
   with the invite's names offered first. */
export function NameSpeakersDialog({
  open,
  onOpenChange,
  voices,
  attendees = [],
  playing,
  onPlay,
  onPause,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voices: { speaker: PickerSpeaker; quotes: Quote[]; blockCount: number }[];
  attendees?: PickerSpeaker[];
  playing?: boolean;
  onPlay?: (timestamp: string) => void;
  onPause?: () => void;
  onSave: (names: Record<string, string>) => void;
}) {
  const isPhone = useIsPhone();
  const [picked, setPicked] = useState<Record<string, PickerSpeaker | null>>({});
  const [startedAt, setStartedAt] = useState<string | null>(null);
  useEffect(() => { if (!open) { setPicked({}); setStartedAt(null); } }, [open]);
  useEffect(() => { if (!playing) setStartedAt(null); }, [playing]);
  const nameFor = (id: string) => picked[id]?.name ?? "";
  const filled = voices.filter((v) => nameFor(v.speaker.id).length > 0).length;
  const taken = new Set(Object.values(picked).filter(Boolean).map((s) => s!.id));
  const play = (ts: string) => { setStartedAt(ts); onPlay?.(ts); };
  const pause = () => { setStartedAt(null); onPause?.(); };
  const save = () => {
    const names: Record<string, string> = {};
    voices.forEach((v) => { const n = nameFor(v.speaker.id); if (n) names[v.speaker.id] = n; });
    onSave(names);
    onOpenChange(false);
  };
  const footer = <FooterButtons onCancel={() => onOpenChange(false)} onSave={save} saveLabel={filled > 1 ? `Save ${filled} names` : "Save name"} canSave={filled > 0} />;
  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={voices.length === 1 ? "Name the speaker" : `Name ${voices.length} speakers`} isPhone={isPhone} footer={footer} wide>
      <p className="text-[13px] text-muted-foreground">Listen, pick who it is, and every block by that voice takes the name.</p>
      {voices.map((v, i) => (
        <div key={v.speaker.id} className={cn("space-y-2.5", i > 0 && "border-t border-border/60 pt-4")}>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: v.speaker.color }} />{v.speaker.name}
            <span className="font-normal normal-case tracking-normal">· {blocksLabel(v.blockCount)}</span>
          </div>
          {v.quotes.slice(0, 2).map((qt, k) => <QuoteLine key={k} quote={qt} playing={!!playing && startedAt === qt.timestamp} onPlay={onPlay ? play : undefined} onPause={pause} />)}
          <NameSelect
            chosen={picked[v.speaker.id] ?? null}
            onChoose={(s) => setPicked((c) => ({ ...c, [v.speaker.id]: s }))}
            onAddNew={(n) => setPicked((c) => ({ ...c, [v.speaker.id]: { id: `new-${v.speaker.id}`, name: n, color: v.speaker.color, initial: n[0]?.toUpperCase() ?? "?" } }))}
            candidates={[]}
            attendees={attendees.filter((a) => !taken.has(a.id) || picked[v.speaker.id]?.id === a.id)}
            isPhone={isPhone}
          />
        </div>
      ))}
    </DialogShell>
  );
}

/* ── The speakers panel: everyone in this recording in one list ──
   Opened from the "N speakers" chip in the header or from "Manage speakers"
   inside a block's menu. Rename in place (pencil), merge one voice into
   another (the old label disappears, its blocks move), remove a voice nobody
   speaks as, add a person who will be picked on blocks later. The list is the
   same on every width; a phone gets it as a bottom sheet. */
export interface ManagedSpeaker extends PickerSpeaker { blockCount: number }
export interface SpeakersPanelActions {
  onRename: (id: string, name: string) => void;
  /* remove a voice; when it has blocks they move to `mergeInto` */
  onRemove: (id: string, mergeInto?: string) => void;
  onAdd: (name: string) => void;
}

/* true on devices whose primary pointer can hover (mouse, trackpad); false for a finger */
function useCanHover() {
  const [can, setCan] = useState<boolean>(() => (typeof window === "undefined" ? true : window.matchMedia("(hover: hover)").matches));
  useEffect(() => { const mql = window.matchMedia("(hover: hover)"); const on = () => setCan(mql.matches); mql.addEventListener("change", on); return () => mql.removeEventListener("change", on); }, []);
  return can;
}

function SpeakerRow({ speaker, phone, actions, onAskRemove }: { speaker: ManagedSpeaker; phone: boolean; actions: SpeakersPanelActions; onAskRemove: (sp: ManagedSpeaker) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(speaker.name);
  const commit = () => { const v = draft.trim(); setEditing(false); if (v && v !== speaker.name) actions.onRename(speaker.id, v); else setDraft(speaker.name); };
  const blocks = speaker.blockCount === 0 ? "Not on any block yet" : speaker.blockCount === 1 ? "1 block" : `${speaker.blockCount} blocks`;
  /* Kirill 24.09: nothing on the row at rest. A pointer reveals the grey row, the pencil and
     the dots on hover; a finger has no hover, so it always sees one "..." that holds both. */
  const touch = phone || !useCanHover();
  return (
    <div data-speaker-manage-row={speaker.id} className={cn("group/mrow flex items-center gap-3 rounded-xl px-3", phone ? "py-2.5" : "py-2", !touch && "hover:bg-muted has-[[data-state=open]]:bg-muted")}>
      <SpeakerDot speaker={speaker} />
      {editing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(speaker.name); setEditing(false); } }}
          className="h-8 min-w-0 flex-1 rounded-[7px] px-2 text-[13px]"
          aria-label="Speaker name"
        />
      ) : (
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-foreground">{speaker.name}{speaker.you && <span className="ml-1 font-normal text-muted-foreground">(you)</span>}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{blocks}</span>
        </div>
      )}
      {!editing && (
        <div className={cn("flex shrink-0 items-center gap-0.5", touch ? "" : "opacity-0 transition-opacity group-hover/mrow:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100")}>
          {!touch && (
            <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground" aria-label={`Rename ${speaker.name}`} data-rename-speaker={speaker.id} onClick={() => setEditing(true)}>
              <PencilIcon className="size-[14px]" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground" aria-label={`More for ${speaker.name}`} data-more-speaker={speaker.id}>
                <Icon icon={MoreHorizontalCircle01Icon} size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem className="gap-2" data-rename-speaker-item={speaker.id} onClick={() => setEditing(true)}>
                <PencilIcon className="size-[15px]" />Rename
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="gap-2" data-remove-speaker={speaker.id} onClick={() => onAskRemove(speaker)}>
                <Icon icon={Delete02Icon} size={15} />Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

/* Removing a voice: its blocks cannot vanish. A dialog (a sheet on the phone)
   with the house select: pick who takes the blocks, read what will happen,
   confirm. Kirill 23.09: a separate dialog, not a step inside the panel. */
export function RemoveSpeakerDialog({ speaker, others, open, onOpenChange, onConfirm }: { speaker: ManagedSpeaker | null; others: ManagedSpeaker[]; open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (id: string, mergeInto?: string) => void }) {
  const isPhone = useIsPhone();
  const [target, setTarget] = useState<string>("");
  useEffect(() => { if (open) setTarget(others[0]?.id ?? ""); }, [open, speaker?.id]);
  if (!speaker) return null;
  const needsTarget = speaker.blockCount > 0 && others.length > 0;
  const to = others.find((o) => o.id === target);
  const blocks = speaker.blockCount === 1 ? "1 block" : `${speaker.blockCount} blocks`;
  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={`Remove ${speaker.name}`} isPhone={isPhone} footer={
      <>
        <Button variant="pill-outline" onClick={() => onOpenChange(false)} className="h-[36px] px-[18px]"><span className="text-[13px] font-medium text-foreground">Cancel</span></Button>
        <Button variant="destructive" data-remove-confirm="" disabled={needsTarget && !to} onClick={() => { onConfirm(speaker.id, needsTarget ? target : undefined); onOpenChange(false); }} className="h-[36px] px-[18px] disabled:opacity-40"><span className="text-[13px] font-semibold">Remove</span></Button>
      </>
    }>
      <div data-remove-dialog="" className="flex flex-col gap-3">
        {needsTarget ? (
          <>
            <p className="text-[13px] text-muted-foreground">{speaker.name} has {blocks} in this transcript. Pick who said them.</p>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger data-remove-target-trigger="" className="h-10 w-full rounded-[12px] border-input text-[13px]">
                <SelectValue placeholder="Choose a speaker" />
              </SelectTrigger>
              <SelectContent>
                {others.map((o) => (
                  <SelectItem key={o.id} value={o.id} data-remove-target={o.id}>
                    <span className="flex items-center gap-2.5"><SpeakerDot speaker={o} /><span className="truncate">{o.name}{o.you ? " (you)" : ""}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {to && <p className="text-[13px] text-foreground">{blocks} will move to <span className="font-medium">{to.name}</span>. {speaker.name} disappears from the list.</p>}
          </>
        ) : (
          <p className="text-[13px] text-muted-foreground">{speaker.blockCount === 0 ? `${speaker.name} is not on any block. The name disappears from the list.` : `${speaker.name} is the only voice here. Their ${blocks} stay, unnamed.`}</p>
        )}
      </div>
    </DialogShell>
  );
}

function SpeakersList({ speakers, suggestions = [], phone, actions, onAskRemove }: { speakers: ManagedSpeaker[]; suggestions?: PickerSpeaker[]; phone: boolean; actions: SpeakersPanelActions; onAskRemove: (sp: ManagedSpeaker) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const add = (v: string) => { const t = v.trim(); if (t) actions.onAdd(t); setName(""); setAdding(false); };
  const q = name.trim().toLowerCase();
  const offers = suggestions.filter((a) => !speakers.some((sp) => sp.name.toLowerCase() === a.name.toLowerCase())).filter((a) => !q || a.name.toLowerCase().includes(q)).slice(0, 4);
  return (
    <>
      <div className={cn("p-1.5", phone ? "max-h-[60vh] overflow-y-auto px-2.5" : "max-h-[min(52vh,380px)] overflow-y-auto")}>
        {speakers.map((sp) => <SpeakerRow key={sp.id} speaker={sp} phone={phone} actions={actions} onAskRemove={onAskRemove} />)}
      </div>
      <div className={cn("border-t border-border/60 p-1.5", phone && "px-2.5 pb-[calc(8px+env(safe-area-inset-bottom))]")}>
        {adding ? (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="New speaker name" onKeyDown={(e) => { if (e.key === "Enter") add(name); if (e.key === "Escape") { setName(""); setAdding(false); } }} className="h-8 min-w-0 flex-1 rounded-[7px] px-2 text-[13px]" />
              <Button size="sm" className="h-8 px-3 text-[12px]" disabled={!name.trim()} onClick={() => add(name)}>Add</Button>
            </div>
            {/* people on the invite who have no voice yet: one tap instead of typing (the meeting card already knows them) */}
            {offers.length > 0 && (
              <div className="pb-0.5">
                <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">From the invite</p>
                {offers.map((a) => (
                  <button key={a.id} type="button" data-add-attendee={a.id} onClick={() => add(a.name)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-muted/60 active:bg-muted/60">
                    <SpeakerDot speaker={a} /><span className="truncate">{a.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <button type="button" data-add-speaker="" onClick={() => setAdding(true)} className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] font-medium text-primary transition-colors hover:bg-primary/[0.06] active:bg-primary/[0.06]", phone ? "py-2.5 text-[14px]" : "py-2")}>
            <Icon icon={PlusSignIcon} size={15} className="shrink-0" />Add speaker
          </button>
        )}
      </div>
    </>
  );
}

export function SpeakersPanel({ speakers, suggestions, actions, open, onOpenChange, children }: { speakers: ManagedSpeaker[]; suggestions?: PickerSpeaker[]; actions: SpeakersPanelActions; open: boolean; onOpenChange: (open: boolean) => void; children?: ReactNode }) {
  const isPhone = useIsPhone();
  const [removing, setRemoving] = useState<ManagedSpeaker | null>(null);
  const askRemove = (sp: ManagedSpeaker) => { onOpenChange(false); setRemoving(sp); };
  const dialog = <RemoveSpeakerDialog speaker={removing} others={speakers.filter((o) => o.id !== removing?.id)} open={removing !== null} onOpenChange={(o) => { if (!o) setRemoving(null); }} onConfirm={(id, to) => actions.onRemove(id, to)} />;
  if (isPhone) {
    return (
      <>
        {dialog}
        {children && <span onClick={() => onOpenChange(true)} className="contents">{children}</span>}
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="[&>div:first-child]:hidden">
            <DrawerHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2 text-left">
              <DrawerTitle className="text-[17px] font-semibold">Speakers</DrawerTitle>
              <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} className="-mr-1 flex size-8 items-center justify-center rounded-full text-muted-foreground active:bg-muted/60"><Icon icon={Cancel01Icon} size={18} /></button>
            </DrawerHeader>
            <SpeakersList speakers={speakers} suggestions={suggestions} phone actions={actions} onAskRemove={askRemove} />
          </DrawerContent>
        </Drawer>
      </>
    );
  }
  return (
    <>
      {dialog}
      <Popover open={open} onOpenChange={onOpenChange}>
        {children ? <PopoverTrigger asChild>{children}</PopoverTrigger> : <PopoverTrigger asChild><span className="absolute" aria-hidden /></PopoverTrigger>}
        <PopoverContent align="start" sideOffset={6} className="w-[320px] p-0" data-speakers-panel="" onOpenAutoFocus={(e) => e.preventDefault()}>
          <p className="border-b border-border/60 px-3.5 pt-3 pb-2.5 text-[13px] font-semibold text-foreground">Speakers</p>
          <SpeakersList speakers={speakers} suggestions={suggestions} phone={false} actions={actions} onAskRemove={askRemove} />
        </PopoverContent>
      </Popover>
    </>
  );
}

/* the header chip: the same bordered pill as the folder and meeting chips in
   the meta line, so it reads as something you press. Stacked faces (up to
   three, then +N) and the count; hover names everyone (pointer devices only).
   Not rendered when the recording has one voice. */
export const SpeakersChip = forwardRef<HTMLButtonElement, { speakers: PickerSpeaker[] } & React.ButtonHTMLAttributes<HTMLButtonElement>>(function SpeakersChip({ speakers, className, ...rest }, ref) {
  const shown = speakers.slice(0, 3);
  const more = speakers.length - shown.length;
  const names = speakers.map((sp) => sp.name + (sp.you ? " (you)" : "")).join(", ");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button ref={ref} type="button" data-speakers-chip="" {...rest} className="inline-flex items-center gap-1.5 rounded-full border border-border py-[3px] pl-[5px] pr-2 text-xs text-foreground transition-colors hover:bg-muted/60 data-[state=open]:bg-muted/60" aria-label={`Speakers: ${names}`}>
          <span className="flex -space-x-1">
            {shown.map((sp) => sp.avatar
              ? <img key={sp.id} src={sp.avatar} alt="" className="size-4 rounded-full border border-background object-cover" />
              : <span key={sp.id} className="inline-flex size-4 items-center justify-center rounded-full border border-background text-[8px] font-semibold text-white" style={{ backgroundColor: sp.color }}>{sp.initial}</span>)}
            {more > 0 && <span className="inline-flex size-4 items-center justify-center rounded-full border border-background bg-muted text-[8px] font-semibold text-muted-foreground">+{more}</span>}
          </span>
          <span className="whitespace-nowrap">{speakers.length === 1 ? "1 speaker" : `${speakers.length} speakers`}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[320px]">
        <span className="block">{names}</span>
        <span className="block opacity-70">Click to rename, remove or add</span>
      </TooltipContent>
    </Tooltip>
  );
});
