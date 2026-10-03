import { useRef, useState, type ReactElement, type ReactNode } from "react";
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
  PencilEdit02Icon,
  Settings02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useIsPhone } from "@/app/components/ui/use-mobile";
import { ActionSheet, ActionSheetItem } from "@/app/components/action-sheet";
import { Icon } from "@/app/components/ui/icon";
import { Input } from "@/app/components/ui/input";
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
import { DEFAULT_LABELS, LABEL_COLORS, type Label, type LabelColor } from "@/lib/annotations";

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
};
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
        <div className="max-h-[min(320px,45vh)] overflow-y-auto overscroll-contain">
        {labels.labels.map((l) => (
          <DropdownMenuItem key={l.id} onSelect={() => onPick(l.id)} className="gap-2.5">
            <LabelIcon label={l} />
            <span className="min-w-0 flex-1 truncate">{l.name}</span>
            {l.id === currentId && <Icon icon={Tick02Icon} className="size-4 text-primary" strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        </div>
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
    variant === "bar" && "h-7 gap-1.5 pl-2.5 pr-2 text-xs text-foreground",
    variant === "icon" && "size-7 [@media(pointer:coarse)]:size-9",
    variant === "player" && "h-8 gap-1.5 border border-border pl-2.5 pr-2 text-xs font-medium text-foreground max-sm:px-2",
    current && "bg-muted text-foreground hover:bg-muted",
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
   removed takes the first label. A form like the product's others: a centred
   card on a tablet and up, a sheet from the bottom on a phone, where a
   label's own actions open the product's action sheet. */
export function ManageLabelsDialog({ labels, open, onOpenChange, counts, elsewhere = {}, touch = false }: { labels: LabelsApi; open: boolean; onOpenChange: (o: boolean) => void; counts: Record<string, number>; elsewhere?: Record<string, number>; touch?: boolean }) {
  const [draft, setDraft] = useState("");
  const [everywhere, setEverywhere] = useState(true);
  const [asking, setAsking] = useState<string | null>(null);
  /* Undo lives in the dialog: a toast behind its overlay cannot be pressed */
  const [removed, setRemoved] = useState<{ label: Label; index: number } | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const phone = useIsPhone();
  const [actionsFor, setActionsFor] = useState<Label | null>(null);
  const [colourFor, setColourFor] = useState<string | null>(null);
  const names = useRef<Record<string, HTMLInputElement | null>>({});
  const rename = (id: string) => window.setTimeout(() => { const el = names.current[id]; el?.focus(); el?.select(); }, 60);
  const taken = (name: string, except?: string) => labels.labels.some((x) => x.id !== except && x.name.trim().toLowerCase() === name.trim().toLowerCase());
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
  const close = (o: boolean) => { if (!o) { setRemoved(null); setAsking(null); } onOpenChange(o); };
  const removeNow = (l: Label) => {
    const index = labels.labels.findIndex((x) => x.id === l.id);
    labels.remove(l.id);
    setAsking(null);
    setRemoved({ label: l, index });
  };
  const addLabel = () => {
    const name = draft.trim();
    if (!name || taken(name)) return;
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
        Remove <span className="font-semibold">{l.name}</span>? {consequence(l)}
      </span>
      <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-[13px]" onClick={() => setAsking(null)}>Cancel</Button>
      <Button variant="destructive" size="sm" className="h-8 rounded-full px-3 text-[13px]" onClick={() => removeNow(l)}>Remove</Button>
    </div>
  ) : (
    <div key={l.id}>
    <div className="flex h-11 items-center gap-2 rounded-xl pr-2 hover:bg-muted/40">
      <button type="button" aria-label={`Colour of ${l.name}`} aria-expanded={colourFor === l.id} onClick={() => setColourFor(colourFor === l.id ? null : l.id)} className={cn("flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-muted", colourFor === l.id && "bg-muted")}>
        <LabelIcon label={l} />
      </button>
      <input
        ref={(el) => { names.current[l.id] = el; }}
        value={l.name}
        maxLength={24}
        aria-label="Label name"
        onFocus={() => setRenaming({ id: l.id, name: l.name })}
        onChange={(e) => labels.update(l.id, { name: e.target.value })}
        onBlur={(e) => {
          const v = e.target.value.trim();
          /* a name already in the list goes back to what it was */
          if (v && taken(v, l.id)) labels.update(l.id, { name: renaming?.id === l.id ? renaming.name : "Untitled" });
          else if (!v) labels.update(l.id, { name: "Untitled" });
          setRenaming(null);
        }}
        className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[14px] text-foreground outline-none transition-colors hover:border-border focus:border-ring max-lg:text-[16px]"
      />
      <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">{counts[l.id] ? (counts[l.id] === 1 ? "1 highlight" : `${counts[l.id]} highlights`) : ""}</span>
      {phone || touch ? (
        <Button variant="ghost" size="icon" aria-label={`More for ${l.name}`} className="size-9 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setActionsFor(l)}>
          <Icon icon={MoreHorizontalIcon} className="size-[16px]" strokeWidth={2} />
        </Button>
      ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`More for ${l.name}`} className="size-8 rounded-full text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
            <Icon icon={MoreHorizontalIcon} className="size-[16px]" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="gap-2.5" onSelect={() => rename(l.id)}><Icon icon={PencilEdit02Icon} className="size-4" strokeWidth={1.8} />Rename</DropdownMenuItem>
          <DropdownMenuItem className="gap-2.5" onSelect={() => window.setTimeout(() => setColourFor(l.id), 60)}><Icon icon={PaintBoardIcon} className="size-4" strokeWidth={1.8} />Change colour</DropdownMenuItem>
          {l.record && <DropdownMenuItem className="gap-2.5" onSelect={() => labels.setOnlyHere(l.id, false)}><Icon icon={Globe02Icon} className="size-4" strokeWidth={1.8} />Use in all recordings</DropdownMenuItem>}
          {canKeepHere(l) && <DropdownMenuItem className="gap-2.5" onSelect={() => labels.setOnlyHere(l.id, true)}><Icon icon={FileAudioIcon} className="size-4" strokeWidth={1.8} />Keep in this recording only</DropdownMenuItem>}
          {labels.labels.length > 1 && <DropdownMenuSeparator />}
          {labels.labels.length > 1 && <DropdownMenuItem variant="destructive" className="gap-2.5" onSelect={() => (asks(l) ? setAsking(l.id) : removeNow(l))}><Icon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />Remove</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
      )}
    </div>
    {colourFor === l.id && (
      <div data-label-colours="" role="group" aria-label={`Colour of ${l.name}`} className="grid w-fit grid-cols-6 gap-1 pb-2">
        {LABEL_COLORS.map((c) => (
          <button key={c} type="button" aria-label={c} aria-pressed={l.color === c} onClick={() => { labels.update(l.id, { color: c }); setColourFor(null); }} className={cn("flex size-8 items-center justify-center rounded-full hover:bg-muted [@media(pointer:coarse)]:size-9", l.color === c && "ring-2 ring-inset ring-primary/40")}>
            <span className={cn("size-4 rounded-full", DOT[c])} />
          </button>
        ))}
      </div>
    )}
    </div>
  );
  const removedRow = (
    <>
        {removed && (
          <div data-label-removed="" className="mx-3 mb-1 flex h-10 shrink-0 items-center gap-2 rounded-xl bg-muted/60 px-3 text-[13px] text-foreground">
            <span className="min-w-0 flex-1 truncate"><span className="font-semibold">{removed.label.name}</span> removed</span>
            <Button variant="ghost" size="sm" className="h-7 rounded-full px-3 text-[13px] font-medium text-primary hover:text-primary" onClick={() => { labels.restore(removed.label, removed.index); setRemoved(null); }}>Undo</Button>
          </div>
        )}
    </>
  );
  const body = (
        <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-2", phone ? "px-2" : "px-3")}>
          {group("In all recordings")}
          {shared.map(row)}
          {here.length > 0 && group("Only in this recording")}
          {here.map(row)}
          <div className="mt-1 flex h-11 items-center gap-2 px-2">
            <Input
              value={draft}
              placeholder="Add a label"
              maxLength={24}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
              className="h-9 flex-1 rounded-lg border-input bg-background px-2.5 text-[14px] shadow-none max-lg:text-[16px]"
            />
            {draft.trim() && (taken(draft)
              ? <span className="shrink-0 pr-1 text-[12px] text-muted-foreground">Already a label</span>
              : <Button variant="pill-outline" size="sm" className="h-8 px-3 text-[13px] [@media(pointer:coarse)]:h-9" onClick={addLabel}>Add</Button>)}
          </div>
          {draft.trim() && (
            <label data-label-everywhere="" className="flex h-9 cursor-pointer items-center gap-2.5 px-2 text-[13px] text-foreground select-none">
              <Checkbox checked={everywhere} onCheckedChange={(v) => setEverywhere(v === true)} />
              Use in all recordings
            </label>
          )}
        </div>
  );
  const done = <Button size="sm" className="h-8 rounded-full px-4 text-[13px] [@media(pointer:coarse)]:h-9" onClick={() => close(false)}>Done</Button>;
  const actions = actionsFor && (
    <ActionSheet open onOpenChange={(o) => { if (!o) setActionsFor(null); }} mark={<LabelIcon label={actionsFor} className="size-[18px]" />} title={actionsFor.name} kind={actionsFor.record ? "Only in this recording" : "In all recordings"}>
      <ActionSheetItem icon={PencilEdit02Icon} label="Rename" onClick={() => { const id = actionsFor.id; setActionsFor(null); rename(id); }} />
      <ActionSheetItem icon={PaintBoardIcon} label="Change colour" onClick={() => { const id = actionsFor.id; setActionsFor(null); window.setTimeout(() => setColourFor(id), 320); }} />
      {actionsFor.record && <ActionSheetItem icon={Globe02Icon} label="Use in all recordings" onClick={() => { labels.setOnlyHere(actionsFor.id, false); setActionsFor(null); }} />}
      {canKeepHere(actionsFor) && <ActionSheetItem icon={FileAudioIcon} label="Keep in this recording only" onClick={() => { labels.setOnlyHere(actionsFor.id, true); setActionsFor(null); }} />}
      {labels.labels.length > 1 && <ActionSheetItem icon={Delete02Icon} label="Remove" destructive onClick={() => { const l = actionsFor; setActionsFor(null); if (asks(l)) setAsking(l.id); else removeNow(l); }} />}
    </ActionSheet>
  );
  if (phone) {
    return (
      <>
        <Drawer open={open} onOpenChange={close}>
          <DrawerContent data-manage-labels="" aria-describedby={undefined} className="max-h-[92vh] [&>div:first-child]:hidden">
            <DrawerHeader className="flex-row items-center justify-between pb-1 text-left">
              <DrawerTitle className="text-[17px]">Labels</DrawerTitle>
              <button type="button" onClick={() => close(false)} aria-label="Close" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={16} /></button>
            </DrawerHeader>
            {removedRow}
            {body}
            <div className="flex shrink-0 items-center justify-end gap-[8px] border-t border-border px-4 pt-[14px] pb-[calc(12px+env(safe-area-inset-bottom))]">{done}</div>
          </DrawerContent>
        </Drawer>
        {actions}
      </>
    );
  }
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent data-manage-labels="" className="flex max-h-[min(88dvh,720px)] flex-col gap-0 p-0 sm:max-w-[440px]" aria-describedby={undefined}>
        <DialogHeader className="shrink-0 px-5 pb-2 pt-5 text-left">
          <DialogTitle className="text-[17px]">Labels</DialogTitle>
        </DialogHeader>
        {removedRow}
        {body}
        <div className="flex shrink-0 justify-end border-t border-border px-5 py-3">
          {done}
        </div>
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
              className="group/mark pointer-events-auto absolute flex h-5 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
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
