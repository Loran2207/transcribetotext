import { useRef, useState, type ReactElement, type ReactNode } from "react";
import { flushSync } from "react-dom";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  ArrowDown01Icon,
  Bookmark02Icon,
  Cancel01Icon,
  Delete02Icon,
  FileAudioIcon,
  Globe02Icon,
  HighlighterIcon,
  MoreHorizontalIcon,
  PaintBoardIcon,
  PlusSignIcon,
  Settings02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useIsPhone } from "@/app/components/ui/use-mobile";
import { ActionSheet, ActionSheetItem } from "@/app/components/action-sheet";
import { Icon } from "@/app/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import type { LabelsApi } from "@/hooks/use-annotations";
import { DEFAULT_LABELS, LABEL_COLORS, LABEL_PICKER, SIMPLE_HIGHLIGHTS, SIMPLE_LABEL, type Label, type LabelColor } from "@/lib/annotations";
import { NameField, PencilIcon } from "@/app/components/speaker-picker";

/* A label's colour in each place it shows: the wash on the words, the mark on
   the player and the label's icon. Nothing else is filled with it: the words
   already carry the colour, a second fill would only repeat it. Written out
   in full so the stylesheet keeps every one of them. */
export const WASH: Record<LabelColor, string> = {
  amber: "bg-amber-200/70",
  sky: "bg-sky-200/70",
  emerald: "bg-emerald-200/70",
  violet: "bg-violet-200/70",
  rose: "bg-rose-200/70",
  slate: "bg-slate-200/90",
  orange: "bg-orange-200/70",
  lime: "bg-lime-200/80",
  cyan: "bg-cyan-200/70",
  fuchsia: "bg-fuchsia-200/70",
  indigo: "bg-indigo-200/70",
  teal: "bg-teal-200/70",
  red: "bg-red-200/70",
  yellow: "bg-yellow-200/80",
  blue: "bg-blue-200/70",
  pink: "bg-pink-200/70",
};
export const WASH_ON: Record<LabelColor, string> = {
  amber: "bg-amber-300",
  sky: "bg-sky-300",
  emerald: "bg-emerald-300",
  violet: "bg-violet-300",
  rose: "bg-rose-300",
  slate: "bg-slate-300",
  orange: "bg-orange-300",
  lime: "bg-lime-300",
  cyan: "bg-cyan-300",
  fuchsia: "bg-fuchsia-300",
  indigo: "bg-indigo-300",
  teal: "bg-teal-300",
  red: "bg-red-300",
  yellow: "bg-yellow-300",
  blue: "bg-blue-300",
  pink: "bg-pink-300",
};
/* Under the pointer the wash deepens a step toward its focused shade, so the
   words read as something you can click before you do. */
export const WASH_HOVER: Record<LabelColor, string> = {
  amber: "hover:bg-amber-300/80",
  sky: "hover:bg-sky-300/80",
  emerald: "hover:bg-emerald-300/80",
  violet: "hover:bg-violet-300/80",
  rose: "hover:bg-rose-300/80",
  slate: "hover:bg-slate-300/90",
  orange: "hover:bg-orange-300/80",
  lime: "hover:bg-lime-300/80",
  cyan: "hover:bg-cyan-300/80",
  fuchsia: "hover:bg-fuchsia-300/80",
  indigo: "hover:bg-indigo-300/80",
  teal: "hover:bg-teal-300/80",
  red: "hover:bg-red-300/80",
  yellow: "hover:bg-yellow-300/80",
  blue: "hover:bg-blue-300/80",
  pink: "hover:bg-pink-300/80",
};
export const DOT: Record<LabelColor, string> = {
  amber: "bg-amber-400",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
  orange: "bg-orange-500",
  lime: "bg-lime-500",
  cyan: "bg-cyan-500",
  fuchsia: "bg-fuchsia-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  blue: "bg-blue-500",
  pink: "bg-pink-400",
};
/* the label's icon: one bookmark, in the label's colour (as Notta marks its types) */
const INK: Record<LabelColor, string> = {
  amber: "text-amber-500",
  sky: "text-sky-500",
  emerald: "text-emerald-500",
  violet: "text-violet-500",
  rose: "text-rose-500",
  slate: "text-slate-500",
  orange: "text-orange-500",
  lime: "text-lime-600",
  cyan: "text-cyan-500",
  fuchsia: "text-fuchsia-500",
  indigo: "text-indigo-500",
  teal: "text-teal-500",
  red: "text-red-500",
  yellow: "text-yellow-600",
  blue: "text-blue-500",
  pink: "text-pink-500",
};
/* the light shade of a label's own colour behind its icon while it is pressed or chosen (templates tint theirs the same way) */
const TINT: Record<LabelColor, string> = {
  amber: "bg-amber-100",
  sky: "bg-sky-100",
  emerald: "bg-emerald-100",
  violet: "bg-violet-100",
  rose: "bg-rose-100",
  slate: "bg-slate-100",
  orange: "bg-orange-100",
  lime: "bg-lime-100",
  cyan: "bg-cyan-100",
  fuchsia: "bg-fuchsia-100",
  indigo: "bg-indigo-100",
  teal: "bg-teal-100",
  red: "bg-red-100",
  yellow: "bg-yellow-100",
  blue: "bg-blue-100",
  pink: "bg-pink-100",
};
const TINT_HOVER: Record<LabelColor, string> = {
  amber: "hover:bg-amber-100",
  sky: "hover:bg-sky-100",
  emerald: "hover:bg-emerald-100",
  violet: "hover:bg-violet-100",
  rose: "hover:bg-rose-100",
  slate: "hover:bg-slate-100",
  orange: "hover:bg-orange-100",
  lime: "hover:bg-lime-100",
  cyan: "hover:bg-cyan-100",
  fuchsia: "hover:bg-fuchsia-100",
  indigo: "hover:bg-indigo-100",
  teal: "hover:bg-teal-100",
  red: "hover:bg-red-100",
  yellow: "hover:bg-yellow-100",
  blue: "hover:bg-blue-100",
  pink: "hover:bg-pink-100",
};
/* the chosen swatch: a ring in its own colour, as the folder colours show it */
const RING: Record<LabelColor, string> = {
  amber: "ring-amber-400",
  sky: "ring-sky-500",
  emerald: "ring-emerald-500",
  violet: "ring-violet-500",
  rose: "ring-rose-500",
  slate: "ring-slate-400",
  orange: "ring-orange-500",
  lime: "ring-lime-500",
  cyan: "ring-cyan-500",
  fuchsia: "ring-fuchsia-500",
  indigo: "ring-indigo-500",
  teal: "ring-teal-500",
  red: "ring-red-500",
  yellow: "ring-yellow-400",
  blue: "ring-blue-500",
  pink: "ring-pink-400",
};
export const labelTile = (label: Label) => TINT[label.color];
export function LabelIcon({ label, className }: { label: Label; className?: string }) {
  return <Icon icon={Bookmark02Icon} aria-hidden className={cn("size-4 shrink-0", INK[label.color], className)} strokeWidth={2} />;
}

/* A label beside a highlight: its icon in colour, its name in plain text */
export function LabelChip({ label, className, children }: { label: Label; className?: string; children?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 max-w-[180px] items-center gap-1 whitespace-nowrap text-[12px] font-medium text-foreground", className)}>
      <LabelIcon label={label} className="size-3.5" />
      <span className="min-w-0 truncate">{label.name}</span>
      {children}
    </span>
  );
}

/* Which label a highlight gets. A plain menu at the button on a desk; a sheet
   from the bottom on a touch screen, where a small menu is hard to hit. On a
   highlight that exists, the same list changes its label or takes it off. */
export function LabelPicker({
  labels,
  currentId,
  sheet,
  trigger,
  tip,
  onPick,
  onRemove,
  onManage,
  open: openProp,
  onOpenChange,
  align = "start",
  side = "bottom",
  title = "Label",
  heading,
}: {
  labels: LabelsApi;
  currentId?: string;
  sheet: boolean;
  trigger: ReactElement;
  tip?: string;
  onPick: (id: string) => void;
  /* what picking a label will do, over the desktop list */
  heading?: string;
  onRemove?: () => void;
  onManage?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "end" | "center";
  side?: "top" | "bottom";
  title?: string;
}) {
  const [own, setOwn] = useState(false);
  const open = openProp ?? own;
  /* a new label made right here is picked at once (as "Add a new speaker" in a block's menu) */
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const stopAdding = () => { setAdding(false); setName(""); };
  const [tipOpen, setTipOpen] = useState(false);
  const quietTip = useRef(false);
  const setOpen = (o: boolean) => { setOwn(o); if (!o) { stopAdding(); quietTip.current = true; setTipOpen(false); } onOpenChange?.(o); };
  const taken = (n: string) => !!n.trim() && labels.labels.some((l) => l.name.trim().toLowerCase() === n.trim().toLowerCase());
  const addAndPick = () => {
    const n = name.trim();
    if (!n || taken(n)) return;
    const inUse = new Set(labels.labels.map((l) => l.color));
    const id = labels.add(n, LABEL_COLORS.find((c) => !inUse.has(c)) ?? "slate");
    setOpen(false);
    onPick(id);
  };
  const escape = (e: KeyboardEvent) => { if (adding) { e.preventDefault(); stopAdding(); } };
  const addRow = (phone: boolean) => onManage && (adding ? (
    <div data-adding-label="" onKeyDown={(e) => e.stopPropagation()} className={phone ? "px-3 py-1" : "px-1 py-1"}>
      <div className="flex items-center gap-1.5">
        <NameField value={name} onChange={setName} onCommit={addAndPick} onCancel={stopAdding} label="New label name" placeholder="New label's name" saveLabel="Add label" kind="add" phone={phone} blocked={taken(name)} maxLength={24} />
      </div>
      {taken(name) && <p className="px-1 pt-1 text-[12px] text-muted-foreground">Already a label</p>}
    </div>
  ) : phone ? (
    <button type="button" data-add-label="" onClick={() => setAdding(true)} className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-primary active:bg-primary/[0.06]">
      <Icon icon={PlusSignIcon} className="size-[18px]" strokeWidth={2} />
      Add a label
    </button>
  ) : (
    <DropdownMenuItem data-add-label="" onSelect={(e) => { e.preventDefault(); setAdding(true); }} className="gap-2.5 font-medium text-primary focus:text-primary">
      <Icon icon={PlusSignIcon} className="size-4 text-primary" strokeWidth={2} />
      Add a label
    </DropdownMenuItem>
  ));
  if (sheet) {
    return (
      <>
        <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent data-label-sheet="" aria-describedby={undefined} onEscapeKeyDown={escape} className="[&>div:first-child]:hidden">
            <DrawerHeader className="flex-row items-center justify-between pb-1 text-left">
              <DrawerTitle className="text-[17px] font-semibold">{title}</DrawerTitle>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:size-9"><Icon icon={Cancel01Icon} size={16} /></button>
            </DrawerHeader>
            <div className="flex flex-col px-1 pb-5">
              <div className="flex max-h-[52dvh] flex-col overflow-y-auto overscroll-contain">
              {labels.labels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { setOpen(false); onPick(l.id); }}
                  className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-foreground active:bg-muted"
                >
                  <LabelIcon label={l} className="size-[18px]" />
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  {l.id === currentId && <Icon icon={Tick02Icon} className="size-[18px] text-primary" strokeWidth={2} />}
                </button>
              ))}
              </div>
              {addRow(true)}
              {(onRemove || onManage) && <div className="mx-3 my-1 h-px bg-border" />}
              {onRemove && (
                <button type="button" onClick={() => { setOpen(false); onRemove(); }} className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-destructive active:bg-muted">
                  <Icon icon={Delete02Icon} className="size-[18px]" strokeWidth={1.8} />
                  Remove highlight
                </button>
              )}
              {onManage && (
                <button type="button" onClick={() => { setOpen(false); onManage(); }} className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-foreground active:bg-muted">
                  <Icon icon={Settings02Icon} className="size-[18px] text-muted-foreground" strokeWidth={1.8} />
                  Manage labels
                </button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
  const button = tip ? (
    <Tooltip open={tipOpen && !open} onOpenChange={(o) => { if (!(o && quietTip.current)) setTipOpen(o); }}>
      {/* the Radix trigger itself: it passes the tooltip's ref on to the button */}
      <TooltipTrigger asChild onPointerLeave={() => { quietTip.current = false; }} onBlur={() => { quietTip.current = false; }}><DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger></TooltipTrigger>
      <TooltipContent side="top">{tip}</TooltipContent>
    </Tooltip>
  ) : (
    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
  );
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {button}
      <DropdownMenuContent data-label-menu="" align={align} side={side} className="w-60" onEscapeKeyDown={escape} onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("input")) e.preventDefault(); }}>
        {heading && <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">{heading}</p>}
        <div className="max-h-[min(320px,45vh)] overflow-y-auto overscroll-contain">
        {labels.labels.map((l) => (
          <DropdownMenuItem key={l.id} onSelect={() => onPick(l.id)} className="gap-2.5">
            <LabelIcon label={l} />
            <span className="min-w-0 flex-1 truncate">{l.name}</span>
            {l.id === currentId && <Icon icon={Tick02Icon} className="size-4 text-primary" strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        </div>
        {addRow(false)}
        {(onRemove || onManage) && <DropdownMenuSeparator />}
        {onRemove && (
          <DropdownMenuItem variant="destructive" onSelect={onRemove} className="gap-2.5">
            <Icon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
            Remove highlight
          </DropdownMenuItem>
        )}
        {onManage && (
          <DropdownMenuItem onSelect={onManage} className="gap-2.5">
            <Icon icon={Settings02Icon} className="size-4 text-muted-foreground" strokeWidth={1.8} />
            Manage labels
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* The Highlight button everywhere it lives (the selection bar, the block bar,
   the player). One press opens the labels and the label you pick marks the
   words: nothing is marked with a label you did not choose. On a block that
   is already highlighted the same list changes the label or takes it off. */
export function HighlightButton({
  labels,
  sheet,
  onHighlight,
  onManage,
  variant,
  current,
  onRemove,
  open,
  onOpenChange,
  side,
  shortcut,
  label,
  tip: tipText,
  short = false,
  heading,
}: {
  labels: LabelsApi;
  sheet: boolean;
  onHighlight: (labelId: string) => void;
  onManage?: () => void;
  variant: "bar" | "icon" | "player";
  /* the live recording bar says Mark, not Highlight: it is about what was just said, not about words on the page */
  label?: string;
  tip?: string;
  /* the word is dropped below lg, not only on a phone: the recording bar has Pause, Stop and the microphone to fit beside it */
  short?: boolean;
  /* the label of the highlight this button already holds (a highlighted block) */
  current?: Label;
  onRemove?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /* where the list opens: away from the words it is about */
  side?: "top" | "bottom";
  shortcut?: string;
  /* what the pick does: the sheet title on touch, a small heading over the desktop list */
  heading?: string;
}) {
  const cls = cn(
    "rounded-full text-muted-foreground hover:text-foreground data-[state=open]:bg-muted/70 data-[state=open]:text-foreground",
    variant === "bar" && cn("h-7 gap-1.5 text-xs text-foreground [@media(pointer:coarse)]:h-9", SIMPLE_HIGHLIGHTS ? "px-2.5" : "pl-2.5 pr-2"),
    variant === "icon" && "size-7 [@media(pointer:coarse)]:size-9",
    variant === "player" && cn("h-8 gap-1.5 border border-border bg-background text-xs font-medium text-foreground hover:border-muted-foreground/40 max-sm:px-2 [@media(pointer:coarse)]:h-9", SIMPLE_HIGHLIGHTS ? "px-3 max-md:relative max-md:size-8 max-md:justify-center max-md:gap-0 max-md:px-0 max-md:after:absolute max-md:after:-inset-0.5 max-md:[@media(pointer:coarse)]:h-8" : "pl-2.5 pr-2"),
    current && "bg-muted text-foreground hover:bg-muted",
  );
  const arrow = <Icon icon={ArrowDown01Icon} className="size-3 opacity-70" strokeWidth={2.2} />;
  /* said over the list: what the pick will do */
  const head = variant === "icon" ? (current ? "Change the label" : "Highlight the paragraph") : variant === "bar" ? "Highlight the selected words" : undefined;
  const tip = tipText ?? (variant === "icon"
    ? current ? `Highlighted as ${current.name}` : "Highlight the paragraph"
    : `${label ?? "Highlight"}${shortcut ? `  (${shortcut})` : ""}`);
  if (SIMPLE_HIGHLIGHTS) {
    /* one tap marks; on a highlighted block the same tap takes the highlight off */
    const simpleTip = tipText ?? (variant === "icon" ? (current ? "Remove highlight" : "Highlight the paragraph") : `${label ?? "Highlight"}${shortcut ? `  (${shortcut})` : ""}`);
    const press = () => { if (current) onRemove?.(); else onHighlight(SIMPLE_LABEL.id); };
    const button = (
      <Button variant="ghost" size="sm" aria-label={variant === "icon" ? simpleTip : (label ?? "Highlight")} aria-pressed={variant === "icon" ? Boolean(current) : undefined} className={cls} onClick={press}>
        <Icon icon={HighlighterIcon} className={cn(variant === "icon" ? "size-[15px]" : "size-[14px]", current && INK[current.color])} strokeWidth={1.8} />
        {variant === "bar" && <>Highlight</>}
        {variant === "player" && <span className={short ? "max-lg:hidden" : "max-md:hidden"}>{label ?? "Highlight"}</span>}
      </Button>
    );
    return (
      <span className="inline-flex items-center" data-highlight-button={variant}>
        {sheet ? button : (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="top">{simpleTip}</TooltipContent>
          </Tooltip>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center" data-highlight-button={variant}>
      <LabelPicker
        labels={labels}
        currentId={current?.id}
        sheet={sheet}
        tip={sheet ? undefined : tip}
        title={heading ?? head ?? "Label"}
        heading={heading ?? head}
        side={side ?? (variant === "player" ? "top" : "bottom")}
        align={variant === "icon" ? "end" : "start"}
        open={open}
        onOpenChange={onOpenChange}
        onPick={onHighlight}
        onRemove={current ? onRemove : undefined}
        onManage={onManage}
        trigger={
          <Button variant="ghost" size="sm" aria-label={variant === "icon" ? tip : "Highlight"} aria-pressed={variant === "icon" ? Boolean(current) : undefined} className={cls}>
            <Icon icon={HighlighterIcon} className={cn(variant === "icon" ? "size-[15px]" : "size-[14px]", current && INK[current.color])} strokeWidth={1.8} />
            {variant === "bar" && <>Highlight{arrow}</>}
            {variant === "player" && <><span className={short ? "max-lg:hidden" : "max-md:hidden"}>{label ?? "Highlight"}</span>{arrow}</>}
          </Button>
        }
      />
    </span>
  );
}

/* Rename, recolour, add and remove labels, the way the product manages speakers
   (Kirill 24.09 and 04.10): every row says what it is; the pencil renames in a field
   with a check to save and an x to cancel; "Add a label" at the bottom opens the same
   field; Escape always leaves without a change. Colours are offered as the folder
   colours are: swatches in the form, the chosen one ringed in its own colour with a
   check. Labels are in every recording unless made for this one only. Every
   highlight keeps working: one whose label is removed takes the first label. A
   centred card on a tablet and up, a sheet from the bottom on a phone; on touch a
   label's other actions open the product's action sheet. */
function Swatches({ value, onPick, label }: { value: LabelColor; onPick: (c: LabelColor) => void; label: string }) {
  return (
    <div data-label-colours="" role="radiogroup" aria-label={label} className="grid w-fit grid-cols-8 gap-2 pb-3 pl-1 pt-1">
      {LABEL_PICKER.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-label={c}
          aria-checked={value === c}
          onClick={() => onPick(c)}
          className={cn("flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform [@media(pointer:coarse)]:size-8", DOT[c], value === c ? cn("ring-2", RING[c]) : "hover:scale-110")}
        >
          {value === c && <Icon icon={Tick02Icon} className="size-3.5 text-white" strokeWidth={2.5} />}
        </button>
      ))}
    </div>
  );
}

export function ManageLabelsDialog({ labels, open, onOpenChange, onCloseAutoFocus, counts, elsewhere = {}, touch = false }: { labels: LabelsApi; open: boolean; onOpenChange: (o: boolean) => void; onCloseAutoFocus?: (e: Event) => void; counts: Record<string, number>; elsewhere?: Record<string, number>; touch?: boolean }) {
  const phone = useIsPhone();
  const canHover = !phone && !touch;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState<LabelColor>("amber");
  const [everywhere, setEverywhere] = useState(true);
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null);
  /* the swatches open under one row at a time: a label's id, or "new" for the label being added */
  const [colourFor, setColourFor] = useState<string | null>(null);
  /* "Change color" from a row's menu: the colours open once the menu is gone, and take its focus */
  const colourNext = useRef<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  /* Undo lives in the dialog: a toast behind its overlay cannot be pressed */
  const [removed, setRemoved] = useState<{ label: Label; index: number } | null>(null);
  const [actionsFor, setActionsFor] = useState<Label | null>(null);
  const taken = (name: string, except?: string) => !!name.trim() && labels.labels.some((x) => x.id !== except && x.name.trim().toLowerCase() === name.trim().toLowerCase());
  const used = (l: Label) => (counts[l.id] ?? 0) + (l.record ? 0 : elsewhere[l.id] ?? 0);
  /* the four built-in labels are in every recording; so is one used in another recording */
  const builtIn = (l: Label) => DEFAULT_LABELS.some((d) => d.id === l.id);
  const canKeepHere = (l: Label) => !l.record && !builtIn(l) && !elsewhere[l.id];
  const asks = (l: Label) => used(l) > 0 || (!l.record && builtIn(l));
  const consequence = (l: Label) => {
    const fallback = (labels.labels.find((x) => x.id !== l.id) ?? l).name;
    if (!l.record && builtIn(l)) return `Its highlights in every recording will show as ${fallback}.`;
    const n = used(l);
    if (!n) return "";
    return `${n === 1 ? "1 highlight" : `${n} highlights`}${!l.record && elsewhere[l.id] ? " across your recordings" : ""} will show as ${fallback}.`;
  };
  const reset = () => { setAdding(false); setDraft(""); setRenaming(null); setColourFor(null); setAsking(null); setRemoved(null); };
  /* Escape first leaves what is open inside (a field, the colours, a question), then the dialog */
  const escape = (e: KeyboardEvent) => {
    if (!adding && !renaming && !colourFor && !asking) return;
    e.preventDefault();
    if (colourFor) { setColourFor(null); refocus(`[data-label-row="${colourFor}"] button[aria-label^="Color of"]`); }
    else if (renaming) endRename(renaming.id);
    else if (asking) setAsking(null);
    else cancelAdd();
  };
  const close = (o: boolean) => { if (!o) reset(); onOpenChange(o); };
  const refocus = (selector: string) => window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-manage-labels] ${selector}`)?.focus({ preventScroll: true }));
  const removeNow = (l: Label, asked = false) => {
    const index = labels.labels.findIndex((x) => x.id === l.id);
    labels.remove(l.id);
    setAsking(null);
    /* ask or Undo, never both: a removal you confirmed needs no second way back */
    setRemoved(asked ? null : { label: l, index });
  };
  const startAdd = () => {
    const inUse = new Set(labels.labels.map((l) => l.color));
    setDraftColor(LABEL_COLORS.find((c) => !inUse.has(c)) ?? "slate");
    setDraft("");
    setEverywhere(true);
    setRenaming(null);
    setColourFor(null);
    setAdding(true);
  };
  const cancelAdd = () => { setAdding(false); setDraft(""); refocus("[data-add-label]"); };
  const addLabel = () => {
    const name = draft.trim();
    if (!name || taken(name)) return;
    labels.add(name, draftColor, !everywhere);
    cancelAdd();
  };
  const startRename = (l: Label) => { setAdding(false); setColourFor(null); setRenaming({ id: l.id, draft: l.name }); };
  const endRename = (id: string) => { setRenaming(null); refocus(`[data-label-row="${id}"] button[aria-label^="Rename"]`); };
  const commitRename = () => {
    if (!renaming) return;
    const name = renaming.draft.trim();
    if (!name || taken(name, renaming.id)) return;
    labels.update(renaming.id, { name });
    endRename(renaming.id);
  };
  /* the label's icon is its colour button: a light shade of its own colour while pressed */
  const colourButton = (key: string, color: LabelColor, name: string) => (
    <button
      type="button"
      aria-label={`Color of ${name || "the new label"}`}
      aria-expanded={colourFor === key}
      onClick={() => setColourFor(colourFor === key ? null : key)}
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full transition-colors [@media(pointer:coarse)]:size-9", TINT_HOVER[color], colourFor === key && TINT[color])}
    >
      <Icon icon={Bookmark02Icon} aria-hidden className={cn("size-4", INK[color])} strokeWidth={2} />
    </button>
  );
  const reveal = canHover ? "opacity-0 group-hover/label:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100" : "";
  const tool = cn("flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground", canHover ? "size-8" : "size-9", reveal);
  const note = (text: string) => <p className="pb-1 pl-10 text-[12px] text-muted-foreground">{text}</p>;
  const group = (name: string) => <p className="px-2 pb-1 pt-2 text-[12px] font-medium text-muted-foreground">{name}</p>;
  const row = (l: Label) => asking === l.id ? (
    <div key={l.id} className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
      <span className="min-w-0 flex-1 text-[13px] text-foreground">
        Remove <span className="font-semibold">{l.name}</span>? {consequence(l)}
      </span>
      <Button variant="pill-outline" size="sm" className="h-8 px-3 text-[13px] [@media(pointer:coarse)]:h-9" onClick={() => setAsking(null)}>Cancel</Button>
      <Button variant="destructive" size="sm" className="h-8 rounded-full px-3 text-[13px] [@media(pointer:coarse)]:h-9" onClick={() => removeNow(l, true)}>Remove</Button>
    </div>
  ) : (
    <div key={l.id}>
      <div data-label-row={l.id} className={cn("group/label flex min-h-11 items-center gap-2 rounded-xl pr-1.5", renaming?.id !== l.id && "hover:bg-muted/40")}>
        {colourButton(l.id, l.color, l.name)}
        {renaming?.id === l.id ? (
          <NameField value={renaming.draft} onChange={(v) => setRenaming({ id: l.id, draft: v })} onCommit={commitRename} onCancel={() => endRename(l.id)} label="Label name" saveLabel="Save name" kind="rename" phone={phone} blocked={taken(renaming.draft, l.id)} maxLength={24} />
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate px-2 text-[14px] text-foreground">{l.name}</span>
            <span className="shrink-0 pr-1 text-[12px] tabular-nums text-muted-foreground">{used(l) ? (used(l) === 1 ? "1 highlight" : `${used(l)} highlights`) : "No highlights"}</span>
            <button type="button" aria-label={`Rename ${l.name}`} onClick={() => startRename(l)} className={tool}>
              <PencilIcon className="size-[15px]" />
            </button>
            {canHover ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={`More for ${l.name}`} className={tool}>
                    <Icon icon={MoreHorizontalIcon} className="size-[16px]" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => { if (colourNext.current !== l.id) return; colourNext.current = null; e.preventDefault(); flushSync(() => setColourFor(l.id)); document.querySelector<HTMLElement>(`[data-manage-labels] [data-label-row="${l.id}"] ~ [data-label-colours] [aria-checked="true"]`)?.focus({ preventScroll: true }); }}>
                  <DropdownMenuItem className="gap-2.5" onSelect={() => { colourNext.current = l.id; }}><Icon icon={PaintBoardIcon} className="size-4" strokeWidth={1.8} />Change color</DropdownMenuItem>
                  {l.record && <DropdownMenuItem className="gap-2.5" onSelect={() => labels.setOnlyHere(l.id, false)}><Icon icon={Globe02Icon} className="size-4" strokeWidth={1.8} />Use in all recordings</DropdownMenuItem>}
                  {canKeepHere(l) && <DropdownMenuItem className="gap-2.5" onSelect={() => labels.setOnlyHere(l.id, true)}><Icon icon={FileAudioIcon} className="size-4" strokeWidth={1.8} />Use in this recording only</DropdownMenuItem>}
                  {labels.labels.length > 1 && <DropdownMenuSeparator />}
                  {labels.labels.length > 1 && <DropdownMenuItem variant="destructive" className="gap-2.5" onSelect={() => (asks(l) ? setAsking(l.id) : removeNow(l))}><Icon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />Remove</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button type="button" aria-label={`More for ${l.name}`} className={tool} onClick={() => setActionsFor(l)}>
                <Icon icon={MoreHorizontalIcon} className="size-[16px]" strokeWidth={2} />
              </button>
            )}
          </>
        )}
      </div>
      {renaming?.id === l.id && taken(renaming.draft, l.id) && note("Already a label")}
      {colourFor === l.id && <Swatches value={l.color} label={`Color of ${l.name}`} onPick={(c) => { labels.update(l.id, { color: c }); setColourFor(null); refocus(`[data-label-row="${l.id}"] button[aria-label^="Color of"]`); }} />}
    </div>
  );
  const removedRow = removed && (
    <div key="removed" data-label-removed="" className="flex min-h-11 items-center gap-2 rounded-xl bg-muted/50 pl-3 pr-1.5 text-[13px] text-foreground">
      <span className="min-w-0 flex-1 truncate"><span className="font-semibold">{removed.label.name}</span> removed</span>
      <Button variant="pill-outline" size="sm" className="h-7 px-3 text-[12px] [@media(pointer:coarse)]:h-9" onClick={() => { labels.restore(removed.label, removed.index); setRemoved(null); }}>Undo</Button>
    </div>
  );
  const rowsIn = (onlyHere: boolean) => {
    const out: ReactNode[] = [];
    const inGroup = (l: Label) => !!l.record === onlyHere;
    labels.labels.forEach((l, i) => {
      if (removed && i === removed.index && inGroup(removed.label)) out.push(removedRow);
      if (inGroup(l)) out.push(row(l));
    });
    if (removed && removed.index >= labels.labels.length && inGroup(removed.label)) out.push(removedRow);
    return out;
  };
  const here = rowsIn(true);
  const body = (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-2", phone ? "px-2" : "px-3")}>
      {group("In all recordings")}
      {rowsIn(false)}
      {here.length > 0 && group("Only in this recording")}
      {here}
    </div>
  );
  /* the bottom of the list: "Add a label", which opens the same field as renaming */
  const footer = (
    <div className={cn("shrink-0 border-t border-border/60", phone ? "px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-1.5" : "px-3 pb-3 pt-1.5")}>
      {adding ? (
        <div data-adding-label="">
          <div className="flex min-h-11 items-center gap-2 pr-1.5">
            <span className="flex size-8 shrink-0 items-center justify-center [@media(pointer:coarse)]:size-9"><LabelIcon label={{ id: "new", name: draft, color: draftColor }} /></span>
            <NameField value={draft} onChange={setDraft} onCommit={addLabel} onCancel={cancelAdd} label="New label name" placeholder="New label's name" saveLabel="Add label" kind="add" phone={phone} blocked={taken(draft)} maxLength={24} />
          </div>
          {taken(draft) && note("Already a label")}
          <Swatches value={draftColor} label="Color of the new label" onPick={setDraftColor} />
          <label data-label-everywhere="" className="flex h-9 cursor-pointer items-center gap-2.5 pl-2.5 text-[13px] text-foreground select-none">
            <Checkbox checked={everywhere} onCheckedChange={(v) => setEverywhere(v === true)} />
            Use in all recordings
          </label>
        </div>
      ) : (
        <button type="button" data-add-label="" onClick={startAdd} className={cn("flex w-full items-center gap-2 rounded-xl pr-3 text-left font-medium text-primary transition-colors hover:bg-primary/[0.06] active:bg-primary/[0.06]", phone ? "h-11 text-[14px]" : "h-10 text-[13px]")}>
          <span className="flex size-8 shrink-0 items-center justify-center"><Icon icon={PlusSignIcon} size={15} /></span>
          <span className="px-2">Add a label</span>
        </button>
      )}
    </div>
  );
  const actions = actionsFor && (
    <ActionSheet open onOpenChange={(o) => { if (!o) setActionsFor(null); }} mark={<LabelIcon label={actionsFor} className="size-[18px]" />} tile={labelTile(actionsFor)} title={actionsFor.name} kind={actionsFor.record ? "Only in this recording" : "In all recordings"}>
      <ActionSheetItem icon={PaintBoardIcon} label="Change color" onClick={() => { const id = actionsFor.id; setActionsFor(null); window.setTimeout(() => setColourFor(id), 320); }} />
      {actionsFor.record && <ActionSheetItem icon={Globe02Icon} label="Use in all recordings" onClick={() => { labels.setOnlyHere(actionsFor.id, false); setActionsFor(null); }} />}
      {canKeepHere(actionsFor) && <ActionSheetItem icon={FileAudioIcon} label="Use in this recording only" onClick={() => { labels.setOnlyHere(actionsFor.id, true); setActionsFor(null); }} />}
      {labels.labels.length > 1 && <ActionSheetItem icon={Delete02Icon} label="Remove" destructive onClick={() => { const l = actionsFor; setActionsFor(null); if (asks(l)) setAsking(l.id); else removeNow(l); }} />}
    </ActionSheet>
  );
  if (phone) {
    return (
      <>
        <Drawer open={open} onOpenChange={close}>
          <DrawerContent data-manage-labels="" aria-describedby={undefined} onEscapeKeyDown={escape} onCloseAutoFocus={onCloseAutoFocus} className="max-h-[92vh] [&>div:first-child]:hidden">
            <DrawerHeader className="flex-row items-center justify-between pb-1 text-left">
              <DrawerTitle className="text-[17px]">Labels</DrawerTitle>
              <button type="button" onClick={() => close(false)} aria-label="Close" className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Icon icon={Cancel01Icon} size={16} /></button>
            </DrawerHeader>
            <p className="shrink-0 px-4 pb-2 text-[12px] leading-relaxed text-muted-foreground">Labels sort your highlights in the list, the summary and the export.</p>
            {body}
            {footer}
          </DrawerContent>
        </Drawer>
        {actions}
      </>
    );
  }
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent data-manage-labels="" onEscapeKeyDown={escape} onCloseAutoFocus={onCloseAutoFocus} className="flex max-h-[min(88dvh,720px)] flex-col gap-0 p-0 outline-none sm:max-w-[440px] [&>button:last-child]:hidden" aria-describedby={undefined}>
        <DialogHeader className="shrink-0 flex-row items-center justify-between px-5 pb-2 pt-4 text-left">
          <DialogTitle className="text-[17px]">Labels</DialogTitle>
          <button type="button" onClick={() => close(false)} aria-label="Close" className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:size-9"><Icon icon={Cancel01Icon} size={16} /></button>
        </DialogHeader>
        <p className="shrink-0 px-5 pb-2 text-[12px] leading-relaxed text-muted-foreground">Labels sort your highlights in the list, the summary and the export.</p>
        {body}
        {footer}
      </DialogContent>
      {actions}
    </Dialog>
  );
}

export type PlayerMarker = { id: string; at: number; kind: "highlight" | "comment"; label?: Label; title: string; seconds: number };

/* Every highlight and open comment as a mark on the player's line: the
   label's colour for a highlight, the comment blue for a thread. A mark plays
   from its moment. */
export function PlayerMarkers({ markers, onSeek }: { markers: PlayerMarker[]; onSeek: (seconds: number) => void }) {
  if (!markers.length) return null;
  return (
    <div data-player-markers="" className="pointer-events-none absolute inset-x-0 top-1/2 h-0">
      {markers.map((m) => (
        <Tooltip key={m.id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={m.title}
              onClick={() => onSeek(m.seconds)}
              className="group/mark pointer-events-auto absolute flex h-5 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center after:absolute after:inset-0 after:content-[''] [@media(pointer:coarse)]:after:-inset-x-3 [@media(pointer:coarse)]:after:-inset-y-2"
              style={{ left: `${Math.max(0.5, Math.min(99.5, m.at))}%` }}
            >
              <span className={cn("rounded-full ring-[1.5px] ring-background transition-transform group-hover/mark:scale-150", m.kind === "highlight" ? cn("h-2.5 w-[3px]", m.label ? DOT[m.label.color] : "bg-amber-400") : "size-[7px] bg-primary")} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" align={m.at < 15 ? "start" : m.at > 85 ? "end" : "center"} alignOffset={-6} collisionPadding={16} className="max-w-[260px]">{m.title}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
