import { useState, type ReactElement, type ReactNode } from "react";
import {
  Add01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  HighlighterIcon,
  Settings02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/app/components/ui/button";
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

/* A label's colour in each place it shows: the wash on the words, the dot on
   buttons and on the player, the chip in the list. Written out in full so the
   stylesheet keeps every one of them. */
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
const CHIP: Record<LabelColor, string> = {
  amber: "bg-amber-100 text-amber-900",
  sky: "bg-sky-100 text-sky-900",
  emerald: "bg-emerald-100 text-emerald-900",
  violet: "bg-violet-100 text-violet-900",
  rose: "bg-rose-100 text-rose-900",
  slate: "bg-slate-100 text-slate-800",
};

export function LabelDot({ label, className }: { label: Label; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT[label.color], className)} />;
}

export function LabelChip({ label, className, children }: { label: Label; className?: string; children?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium", CHIP[label.color], className)}>
      <LabelDot label={label} className="size-2" />
      {label.name}
      {children}
    </span>
  );
}

/* Which label a highlight gets. A plain menu at the button on a desk; a sheet
   from the bottom on a touch screen, where a small menu is hard to hit. */
export function LabelPicker({
  labels,
  currentId,
  sheet,
  trigger,
  onPick,
  onManage,
  align = "start",
  side = "bottom",
  title = "Highlight as",
}: {
  labels: LabelsApi;
  currentId?: string;
  sheet: boolean;
  trigger: ReactElement;
  onPick: (id: string) => void;
  onManage: () => void;
  align?: "start" | "end" | "center";
  side?: "top" | "bottom";
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  if (sheet) {
    return (
      <>
        <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent data-label-sheet="" className="[&>div:first-child]:hidden">
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
                  <LabelDot label={l} className="size-3" />
                  <span className="flex-1">{l.name}</span>
                  {l.id === currentId && <Icon icon={Tick02Icon} className="size-[18px] text-primary" strokeWidth={2} />}
                </button>
              ))}
              <div className="mx-3 my-1 h-px bg-border" />
              <button type="button" onClick={() => { setOpen(false); onManage(); }} className="flex h-12 items-center gap-3 rounded-xl px-3 text-left text-[15px] text-muted-foreground active:bg-muted">
                <Icon icon={Settings02Icon} className="size-[16px]" strokeWidth={1.8} />
                Manage labels
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent data-label-menu="" align={align} side={side} className="w-48" onMouseDown={(e) => e.preventDefault()}>
        {labels.labels.map((l) => (
          <DropdownMenuItem key={l.id} onSelect={() => onPick(l.id)} className="gap-2.5">
            <LabelDot label={l} />
            <span className="flex-1">{l.name}</span>
            {l.id === currentId && <Icon icon={Tick02Icon} className="size-4 text-primary" strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onManage} className="gap-2.5 text-muted-foreground">
          <Icon icon={Settings02Icon} className="size-4" strokeWidth={1.8} />
          Manage labels
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* The Highlight button everywhere it lives (the selection bar, the block bar,
   the player): one press marks with the label shown on the button, the arrow
   picks another. */
export function HighlightSplit({
  labels,
  sheet,
  onHighlight,
  onManage,
  variant,
  pressed = false,
  shortcut,
}: {
  labels: LabelsApi;
  sheet: boolean;
  onHighlight: (labelId: string, picked: boolean) => void;
  onManage: () => void;
  variant: "bar" | "icon" | "player";
  pressed?: boolean;
  shortcut?: string;
}) {
  const label = labels.current;
  const main = cn(
    "rounded-full text-muted-foreground hover:text-foreground",
    variant === "bar" && "h-7 gap-1.5 rounded-r-none pl-2.5 pr-1.5 text-xs",
    variant === "icon" && "size-7 rounded-r-none",
    variant === "player" && "h-8 gap-1.5 rounded-r-none border border-r-0 border-border pl-2.5 pr-2 text-xs font-medium text-foreground max-sm:pl-2 max-sm:pr-1.5",
    pressed && "bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-900",
  );
  const arrow = cn(
    "rounded-full rounded-l-none text-muted-foreground hover:text-foreground data-[state=open]:bg-muted/70",
    variant === "bar" && "h-7 w-5 px-0",
    variant === "icon" && "h-7 w-4 px-0",
    variant === "player" && "h-8 w-6 border border-l-0 border-border px-0",
  );
  const icon = (
    <span className="relative inline-flex">
      <Icon icon={HighlighterIcon} className={variant === "icon" ? "size-[15px]" : "size-[14px]"} strokeWidth={1.8} />
      <LabelDot label={label} className="absolute -bottom-0.5 -right-1 size-[7px] ring-[1.5px] ring-background" />
    </span>
  );
  const tip = `Highlight as ${label.name}${shortcut ? `  (${shortcut})` : ""}`;
  return (
    <span className="inline-flex items-center" data-highlight-split={variant}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={variant === "icon" ? pressed : undefined}
            aria-label={variant === "icon" ? (pressed ? "Remove highlight" : "Highlight block") : `Highlight as ${label.name}`}
            className={main}
            onClick={() => onHighlight(label.id, false)}
          >
            {icon}
            {variant === "bar" && "Highlight"}
            {variant === "player" && <span className="max-sm:hidden">Highlight</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{variant === "icon" && pressed ? "Remove highlight" : tip}</TooltipContent>
      </Tooltip>
      <LabelPicker
        labels={labels}
        currentId={label.id}
        sheet={sheet}
        side={variant === "player" ? "top" : "bottom"}
        onPick={(id) => { labels.pick(id); onHighlight(id, true); }}
        onManage={onManage}
        trigger={
          <Button variant="ghost" size="sm" aria-label="Choose a label" className={arrow}>
            <Icon icon={ArrowDown01Icon} className="size-3" strokeWidth={2.2} />
          </Button>
        }
      />
    </span>
  );
}

/* Rename, recolour, add and remove labels. Every highlight keeps working:
   one whose label is removed takes the first label. */
export function ManageLabelsDialog({ labels, open, onOpenChange, counts }: { labels: LabelsApi; open: boolean; onOpenChange: (o: boolean) => void; counts: Record<string, number> }) {
  const [draft, setDraft] = useState("");
  const addLabel = () => {
    const name = draft.trim();
    if (!name) return;
    const used = new Set(labels.labels.map((l) => l.color));
    const color = LABEL_COLORS.find((c) => !used.has(c)) ?? "slate";
    labels.add(name, color);
    setDraft("");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-manage-labels="" className="gap-0 p-0 sm:max-w-[420px]" aria-describedby={undefined}>
        <DialogHeader className="px-5 pb-2 pt-5 text-left">
          <DialogTitle className="text-[17px]">Labels</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col px-3 pb-2">
          {labels.labels.map((l) => (
            <div key={l.id} className="flex h-11 items-center gap-2 rounded-xl px-2 hover:bg-muted/40">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label={`Colour of ${l.name}`} className="flex size-8 items-center justify-center rounded-full hover:bg-muted">
                    <LabelDot label={l} className="size-3.5" />
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
                aria-label="Label name"
                onChange={(e) => labels.update(l.id, { name: e.target.value })}
                onBlur={(e) => { if (!e.target.value.trim()) labels.update(l.id, { name: "Untitled" }); }}
                className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-[14px] text-foreground outline-none focus:bg-muted/50 max-lg:text-[16px]"
              />
              <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">{counts[l.id] ? counts[l.id] : ""}</span>
              {labels.labels.length > 1 && (
                <Button variant="ghost" size="icon" aria-label={`Remove ${l.name}`} className="size-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => labels.remove(l.id)}>
                  <Icon icon={Cancel01Icon} className="size-[14px]" strokeWidth={2} />
                </Button>
              )}
            </div>
          ))}
          <div className="mt-1 flex h-11 items-center gap-2 px-2">
            <span className="flex size-8 items-center justify-center text-muted-foreground"><Icon icon={Add01Icon} className="size-[15px]" strokeWidth={2} /></span>
            <Input
              value={draft}
              placeholder="Add a label"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
              className="h-8 flex-1 border-none bg-transparent px-1.5 text-[14px] shadow-none focus-visible:ring-0 max-lg:text-[16px]"
            />
            {draft.trim() && <Button size="sm" className="h-8 rounded-full px-3 text-[13px]" onClick={addLabel}>Add</Button>}
          </div>
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
              className={cn(
                "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-[1.5px] ring-background transition-transform hover:scale-150",
                m.kind === "highlight" ? cn("h-2.5 w-[3px]", m.label ? DOT[m.label.color] : "bg-amber-400") : "size-[7px] bg-primary",
              )}
              style={{ left: `${Math.max(0.5, Math.min(99.5, m.at))}%` }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px]">{m.title}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
