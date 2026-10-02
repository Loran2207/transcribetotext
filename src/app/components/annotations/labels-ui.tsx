import { useState, type ReactElement, type ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  Add01Icon,
  ArrowDown01Icon,
  Bookmark02Icon,
  Delete02Icon,
  HighlighterIcon,
  MoreHorizontalIcon,
  Settings02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Icon } from "@/app/components/ui/icon";
import { Input } from "@/app/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/components/ui/utils";
import type { LabelsApi } from "@/hooks/use-annotations";
import { LABEL_COLORS, type Label, type LabelColor } from "@/lib/annotations";

/* A label's colour in each place it shows: the wash on the words, the mark on
   the player, the label's icon, the chip in the list. Written out in full so
   the stylesheet keeps every one of them. */
export const WASH: Record<LabelColor, string> = {
  amber: "bg-amber-200/70",
  sky: "bg-sky-200/70",
  emerald: "bg-emerald-200/70",
  violet: "bg-violet-200/70",
  rose: "bg-rose-200/70",
  slate: "bg-slate-200/90",
};
export const WASH_ON: Record<LabelColor, string> = {
  amber: "bg-amber-300",
  sky: "bg-sky-300",
  emerald: "bg-emerald-300",
  violet: "bg-violet-300",
  rose: "bg-rose-300",
  slate: "bg-slate-300",
};
export const DOT: Record<LabelColor, string> = {
  amber: "bg-amber-400",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
};
/* the label's icon: one bookmark, in the label's colour (as Notta marks its types) */
const INK: Record<LabelColor, string> = {
  amber: "text-amber-500",
  sky: "text-sky-500",
  emerald: "text-emerald-500",
  violet: "text-violet-500",
  rose: "text-rose-500",
  slate: "text-slate-500",
};
const CHIP: Record<LabelColor, string> = {
  amber: "bg-amber-100 text-amber-900",
  sky: "bg-sky-100 text-sky-900",
  emerald: "bg-emerald-100 text-emerald-900",
  violet: "bg-violet-100 text-violet-900",
  rose: "bg-rose-100 text-rose-900",
  slate: "bg-slate-100 text-slate-800",
};

/* the pressed Highlight button takes the colour of the label it holds */
export const PRESSED: Record<LabelColor, string> = {
  amber: "bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-900",
  sky: "bg-sky-100 text-sky-800 hover:bg-sky-100 hover:text-sky-900",
  emerald: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900",
  violet: "bg-violet-100 text-violet-800 hover:bg-violet-100 hover:text-violet-900",
  rose: "bg-rose-100 text-rose-800 hover:bg-rose-100 hover:text-rose-900",
  slate: "bg-slate-100 text-slate-800 hover:bg-slate-100 hover:text-slate-900",
};

export function LabelIcon({ label, className }: { label: Label; className?: string }) {
  return <Icon icon={Bookmark02Icon} aria-hidden className={cn("size-4 shrink-0", INK[label.color], className)} strokeWidth={2} />;
}

export function LabelChip({ label, className, children }: { label: Label; className?: string; children?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 max-w-[180px] items-center gap-1 whitespace-nowrap rounded-full pl-1.5 pr-2 text-[12px] font-medium", CHIP[label.color], className)}>
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
  title = "Highlight as",
}: {
  labels: LabelsApi;
  currentId?: string;
  sheet: boolean;
  trigger: ReactElement;
  tip?: string;
  onPick: (id: string) => void;
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
  const setOpen = (o: boolean) => { setOwn(o); onOpenChange?.(o); };
  if (sheet) {
    return (
      <>
        <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent data-label-sheet="" aria-describedby={undefined} className="[&>div:first-child]:hidden">
            <DrawerHeader className="pb-1 text-left">
              <DrawerTitle className="text-[17px] font-semibold">{title}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col px-2 pb-5">
              {labels.labels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { setOpen(false); onPick(l.id); }}
                  className="flex h-12 items-center gap-3 rounded-xl px-3 text-left text-[15px] text-foreground active:bg-muted"
                >
                  <LabelIcon label={l} className="size-[18px]" />
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  {l.id === currentId && <Icon icon={Tick02Icon} className="size-[18px] text-primary" strokeWidth={2} />}
                </button>
              ))}
              {(onRemove || onManage) && <div className="mx-3 my-1 h-px bg-border" />}
              {onRemove && (
                <button type="button" onClick={() => { setOpen(false); onRemove(); }} className="flex h-12 items-center gap-3 rounded-xl px-3 text-left text-[15px] text-destructive active:bg-muted">
                  <Icon icon={Delete02Icon} className="size-[18px]" strokeWidth={1.8} />
                  Remove highlight
                </button>
              )}
              {onManage && (
                <button type="button" onClick={() => { setOpen(false); onManage(); }} className="flex h-12 items-center gap-3 rounded-xl px-3 text-left text-[15px] text-muted-foreground active:bg-muted">
                  <Icon icon={Settings02Icon} className="size-[18px]" strokeWidth={1.8} />
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
    <Tooltip>
      {/* the Radix trigger itself: it passes the tooltip's ref on to the button */}
      <TooltipTrigger asChild><DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger></TooltipTrigger>
      <TooltipContent side="top">{tip}</TooltipContent>
    </Tooltip>
  ) : (
    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
  );
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {button}
      <DropdownMenuContent data-label-menu="" align={align} side={side} className="w-52" onMouseDown={(e) => e.preventDefault()}>
        {labels.labels.map((l) => (
          <DropdownMenuItem key={l.id} onSelect={() => onPick(l.id)} className="gap-2.5">
            <LabelIcon label={l} />
            <span className="min-w-0 flex-1 truncate">{l.name}</span>
            {l.id === currentId && <Icon icon={Tick02Icon} className="size-4 text-primary" strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        {(onRemove || onManage) && <DropdownMenuSeparator />}
        {onRemove && (
          <DropdownMenuItem variant="destructive" onSelect={onRemove} className="gap-2.5">
            <Icon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
            Remove highlight
          </DropdownMenuItem>
        )}
        {onManage && (
          <DropdownMenuItem onSelect={onManage} className="gap-2.5 text-muted-foreground">
            <Icon icon={Settings02Icon} className="size-4" strokeWidth={1.8} />
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
}: {
  labels: LabelsApi;
  sheet: boolean;
  onHighlight: (labelId: string) => void;
  onManage?: () => void;
  variant: "bar" | "icon" | "player";
  /* the label of the highlight this button already holds (a highlighted block) */
  current?: Label;
  onRemove?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /* where the list opens: away from the words it is about */
  side?: "top" | "bottom";
  shortcut?: string;
}) {
  const cls = cn(
    "rounded-full text-muted-foreground hover:text-foreground data-[state=open]:bg-muted/70 data-[state=open]:text-foreground",
    variant === "bar" && "h-7 gap-1.5 pl-2.5 pr-2 text-xs",
    variant === "icon" && "size-7 [@media(pointer:coarse)]:size-9",
    variant === "player" && "h-8 gap-1.5 border border-border pl-2.5 pr-2 text-xs font-medium text-foreground max-sm:px-2",
    current && PRESSED[current.color],
  );
  const arrow = <Icon icon={ArrowDown01Icon} className="size-3 opacity-70" strokeWidth={2.2} />;
  const tip = variant === "icon"
    ? current ? `Highlighted as ${current.name}` : "Highlight block"
    : `Highlight${shortcut ? `  (${shortcut})` : ""}`;
  return (
    <span className="inline-flex items-center" data-highlight-button={variant}>
      <LabelPicker
        labels={labels}
        currentId={current?.id}
        sheet={sheet}
        tip={sheet ? undefined : tip}
        title={current ? "Label" : "Highlight as"}
        side={side ?? (variant === "player" ? "top" : "bottom")}
        open={open}
        onOpenChange={onOpenChange}
        onPick={onHighlight}
        onRemove={current ? onRemove : undefined}
        onManage={onManage}
        trigger={
          <Button variant="ghost" size="sm" aria-label={variant === "icon" ? tip : "Highlight"} aria-pressed={variant === "icon" ? Boolean(current) : undefined} className={cls}>
            <Icon icon={HighlighterIcon} className={variant === "icon" ? "size-[15px]" : "size-[14px]"} strokeWidth={1.8} />
            {variant === "bar" && <>Highlight{arrow}</>}
            {variant === "player" && <><span className="max-sm:hidden">Highlight</span>{arrow}</>}
          </Button>
        }
      />
    </span>
  );
}

/* Rename, recolour, add and remove labels. Labels are in every recording
   unless made for this one only; a new label is in every recording until
   its box is cleared. Every highlight keeps working: one whose label is
   removed takes the first label. */
export function ManageLabelsDialog({ labels, open, onOpenChange, counts, onRemoved }: { labels: LabelsApi; open: boolean; onOpenChange: (o: boolean) => void; counts: Record<string, number>; onRemoved?: (label: Label, index: number, fallback: Label) => void }) {
  const [draft, setDraft] = useState("");
  const [everywhere, setEverywhere] = useState(true);
  const [asking, setAsking] = useState<string | null>(null);
  const removeNow = (l: Label) => {
    const index = labels.labels.findIndex((x) => x.id === l.id);
    const fallback = labels.labels.find((x) => x.id !== l.id) ?? labels.labels[0];
    labels.remove(l.id);
    setAsking(null);
    onRemoved?.(l, index, fallback);
  };
  const addLabel = () => {
    const name = draft.trim();
    if (!name) return;
    const used = new Set(labels.labels.map((l) => l.color));
    const color = LABEL_COLORS.find((c) => !used.has(c)) ?? "slate";
    labels.add(name, color, !everywhere);
    setDraft("");
    setEverywhere(true);
  };
  const shared = labels.labels.filter((l) => !l.record);
  const here = labels.labels.filter((l) => l.record);
  const group = (name: string) => <p className="px-2 pb-1 pt-2 text-[12px] font-medium text-muted-foreground">{name}</p>;
  const row = (l: Label) => asking === l.id ? (
    <div key={l.id} className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
      <span className="min-w-0 flex-1 text-[13px] text-foreground">
        Remove <span className="font-semibold">{l.name}</span>? {counts[l.id] ? `${counts[l.id] === 1 ? "1 highlight" : `${counts[l.id]} highlights`} will show as ${(labels.labels.find((x) => x.id !== l.id) ?? l).name}.` : ""}
      </span>
      <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-[13px]" onClick={() => setAsking(null)}>Cancel</Button>
      <Button variant="destructive" size="sm" className="h-8 rounded-full px-3 text-[13px]" onClick={() => removeNow(l)}>Remove</Button>
    </div>
  ) : (
    <div key={l.id} className="flex h-11 items-center gap-2 rounded-xl px-2 hover:bg-muted/40">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`Colour of ${l.name}`} className="flex size-8 items-center justify-center rounded-full hover:bg-muted">
            <LabelIcon label={l} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-auto gap-1.5 p-2">
          {LABEL_COLORS.map((c) => (
            <button key={c} type="button" aria-label={c} onClick={() => labels.update(l.id, { color: c })} className={cn("flex size-7 items-center justify-center rounded-full", l.color === c && "ring-2 ring-primary/40")}>
              <span className={cn("size-4 rounded-full", DOT[c])} />
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <input
        value={l.name}
        maxLength={24}
        aria-label="Label name"
        onChange={(e) => labels.update(l.id, { name: e.target.value })}
        onBlur={(e) => { if (!e.target.value.trim()) labels.update(l.id, { name: "Untitled" }); }}
        className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[14px] text-foreground outline-none transition-colors hover:border-border focus:border-ring max-lg:text-[16px]"
      />
      <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">{counts[l.id] ? (counts[l.id] === 1 ? "1 highlight" : `${counts[l.id]} highlights`) : ""}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`More for ${l.name}`} className="size-8 rounded-full text-muted-foreground hover:text-foreground">
            <Icon icon={MoreHorizontalIcon} className="size-[16px]" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => labels.setOnlyHere(l.id, !l.record)}>{l.record ? "Use in all recordings" : "Keep in this recording only"}</DropdownMenuItem>
          {labels.labels.length > 1 && <DropdownMenuSeparator />}
          {labels.labels.length > 1 && <DropdownMenuItem variant="destructive" onSelect={() => (counts[l.id] ? setAsking(l.id) : removeNow(l))}>Remove</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-manage-labels="" className="gap-0 p-0 sm:max-w-[440px]" aria-describedby={undefined}>
        <DialogHeader className="px-5 pb-2 pt-5 text-left">
          <DialogTitle className="text-[17px]">Labels</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col px-3 pb-2">
          {group("In all recordings")}
          {shared.map(row)}
          {here.length > 0 && group("Only in this recording")}
          {here.map(row)}
          <div className="mt-1 flex h-11 items-center gap-2 px-2">
            <span className="flex size-8 items-center justify-center text-muted-foreground"><Icon icon={Add01Icon} className="size-[15px]" strokeWidth={2} /></span>
            <Input
              value={draft}
              placeholder="Add a label"
              maxLength={24}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
              className="h-8 flex-1 border-none bg-transparent px-1.5 text-[14px] shadow-none focus-visible:ring-0 max-lg:text-[16px]"
            />
            {draft.trim() && <Button size="sm" className="h-8 rounded-full px-3 text-[13px]" onClick={addLabel}>Add</Button>}
          </div>
          {draft.trim() && (
            <label data-label-everywhere="" className="flex h-9 cursor-pointer items-center gap-2.5 px-4 text-[13px] text-foreground select-none">
              <Checkbox checked={everywhere} onCheckedChange={(v) => setEverywhere(v === true)} />
              Use in all recordings
            </label>
          )}
        </div>
        <div className="flex justify-end border-t border-border px-5 py-3">
          <Button size="sm" className="h-8 rounded-full px-4 text-[13px]" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
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
              className="group/mark pointer-events-auto absolute flex h-5 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${Math.max(0.5, Math.min(99.5, m.at))}%` }}
            >
              <span className={cn("rounded-full ring-[1.5px] ring-background transition-transform group-hover/mark:scale-150", m.kind === "highlight" ? cn("h-2.5 w-[3px]", m.label ? DOT[m.label.color] : "bg-amber-400") : "size-[7px] bg-primary")} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px]">{m.title}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
