import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search01Icon, PlusSignIcon, UserAdd01Icon, ArrowRight01Icon, ArrowLeft01Icon, Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useIsPhone } from "./ui/use-mobile";
import { cn } from "./ui/utils";

export interface PickerSpeaker {
  id: string;
  name: string;
  color: string;
  initial: string;
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

function SpeakerDot({ speaker, className }: { speaker: PickerSpeaker; className?: string }) {
  return (
    <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white", className)} style={{ backgroundColor: speaker.color }}>
      {speaker.initial}
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

/* ── Variant A, desktop: dropdown on the name, side menu for the scope ── */
function SpeakerMenu({ current, speakers, blockCount, onPick }: { current: PickerSpeaker; speakers: PickerSpeaker[]; blockCount: number; onPick: (choice: SpeakerChoice) => void }) {
  const { query, setQuery, trimmed, list, canAdd } = useSpeakerQuery(speakers);
  const [armed, setArmed] = useState<string | null>(null);
  const pinned = useRef(false);
  const [top, setTop] = useState(0);
  const timer = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const stay = () => { if (timer.current) window.clearTimeout(timer.current); };
  /* hover opens the side menu and lets it go; a click (touch, keyboard) pins it */
  const leave = () => { stay(); if (!pinned.current) timer.current = window.setTimeout(() => setArmed(null), 160); };
  const arm = (key: string, el: HTMLElement, pin = false) => {
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
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); pinned.current = false; setArmed(null); }}
          placeholder="Search or type a name"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      <div className="p-1.5">
        {list.length > 0 && <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground">Speakers</p>}
        {list.map((s) => {
          const isCurrent = s.id === current.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={isCurrent}
              onMouseEnter={(e) => { if (!isCurrent) arm(s.id, e.currentTarget); }}
              onFocus={(e) => { if (!isCurrent) arm(s.id, e.currentTarget); }}
              onClick={(e) => { if (!isCurrent) arm(s.id, e.currentTarget, true); }}
              className={cn(
                "group/row flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors",
                isCurrent ? "text-primary" : "text-foreground hover:bg-muted/60",
                armed === s.id && "bg-muted/60",
              )}
            >
              <SpeakerDot speaker={s} />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              {isCurrent ? (
                <Icon icon={Tick02Icon} size={15} className="shrink-0 text-primary" />
              ) : (
                <Icon icon={ArrowRight01Icon} size={14} className={cn("shrink-0 text-muted-foreground/70 transition-opacity", armed === s.id ? "opacity-100" : "opacity-0 group-hover/row:opacity-100")} />
              )}
            </button>
          );
        })}
        {list.length === 0 && !canAdd && <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">No one by that name</p>}
      </div>
      {canAdd && (
        <div className="border-t border-border/60 p-1.5">
          <button
            type="button"
            onMouseEnter={(e) => arm("add", e.currentTarget)}
            onFocus={(e) => arm("add", e.currentTarget)}
            onClick={(e) => arm("add", e.currentTarget, true)}
            className={cn("group/row flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-primary transition-colors hover:bg-primary/[0.06]", armed === "add" && "bg-primary/[0.06]")}
          >
            <Icon icon={PlusSignIcon} size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">Add <span className="font-semibold">{trimmed}</span> as a new speaker</span>
            <Icon icon={ArrowRight01Icon} size={14} className={cn("shrink-0 text-primary/70 transition-opacity", armed === "add" ? "opacity-100" : "opacity-0 group-hover/row:opacity-100")} />
          </button>
        </div>
      )}
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
function SpeakerSheet({ current, speakers, blockCount, onPick, onClose }: { current: PickerSpeaker; speakers: PickerSpeaker[]; blockCount: number; onPick: (choice: SpeakerChoice) => void; onClose: () => void }) {
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
          <DrawerTitle>Change speaker</DrawerTitle>
        )}
        <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60">
          <Icon icon={Cancel01Icon} size={16} />
        </button>
      </DrawerHeader>
      {target ? (
        <div className="px-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <ScopeRows current={current} blockCount={blockCount} onPick={(scope) => onPick(choiceFor(target, scope))} className="[&>button]:py-3 [&>button]:text-[14px] [&>button]:rounded-xl" />
        </div>
      ) : (
        <>
          <div className="px-4 pb-2">
            <div className="flex h-10 items-center gap-2 rounded-xl bg-muted/50 px-3">
              <Icon icon={Search01Icon} size={15} className="shrink-0 text-muted-foreground/60" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or type a name" className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/60" />
            </div>
          </div>
          <div className="px-1">
            {list.map((s) => {
              const isCurrent = s.id === current.id;
              return (
                <button key={s.id} type="button" disabled={isCurrent} onClick={() => setTarget({ speakerId: s.id })} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-muted/60", isCurrent && "bg-primary/[0.06]")}>
                  <SpeakerDot speaker={s} className="size-7 text-[11px]" />
                  <span className={cn("min-w-0 flex-1 truncate text-[14px] font-medium", isCurrent ? "text-primary" : "text-foreground")}>{s.name}</span>
                  {isCurrent ? <Icon icon={Tick02Icon} size={16} className="shrink-0 text-primary" /> : <Icon icon={ArrowRight01Icon} size={16} className="shrink-0 text-muted-foreground/60" />}
                </button>
              );
            })}
            {list.length === 0 && !canAdd && <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No one by that name</p>}
          </div>
          <div className={cn("border-t border-border/60 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]", !canAdd && "hidden")}>
            <button type="button" onClick={() => setTarget({ name: trimmed })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-primary transition-colors active:bg-muted/60">
              <Icon icon={PlusSignIcon} size={15} /><span>Add <span className="font-semibold">{trimmed}</span> as a new speaker</span>
            </button>
          </div>
          {!canAdd && <div className="pb-[calc(8px+env(safe-area-inset-bottom))]" />}
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
}: {
  current: PickerSpeaker;
  speakers: PickerSpeaker[];
  blockCount: number;
  onPick: (choice: SpeakerChoice) => void;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isPhone = useIsPhone();
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const pick = (choice: SpeakerChoice) => { setOpen(false); onPick(choice); };

  if (isPhone) {
    return (
      <>
        <span onClick={() => setOpen(true)} className="contents">{children}</span>
        <Drawer open={isOpen} onOpenChange={setOpen}>
          <DrawerContent className="[&>div:first-child]:hidden">
            {isOpen && <SpeakerSheet current={current} speakers={speakers} blockCount={blockCount} onPick={pick} onClose={() => setOpen(false)} />}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[300px] overflow-visible p-0">
        <SpeakerMenu current={current} speakers={speakers} blockCount={blockCount} onPick={pick} />
      </PopoverContent>
    </Popover>
  );
}

/* ── Variant B (Figma reference, ttt_demo_speaker_dialog=1) ──
   A centred dialog: the voice's own words as quotes, one name field with
   suggestions, the scope switch, Save. */
export function SpeakerDialog({
  open,
  onOpenChange,
  current,
  speakers,
  blockCount,
  quotes,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: PickerSpeaker;
  speakers: PickerSpeaker[];
  blockCount: number;
  quotes: string[];
  onPick: (choice: SpeakerChoice) => void;
}) {
  const [name, setName] = useState("");
  const [chosen, setChosen] = useState<PickerSpeaker | null>(null);
  const [scope, setScope] = useState<Scope>("block");
  const [focused, setFocused] = useState(false);
  const trimmed = name.trim();
  const q = trimmed.toLowerCase();
  const suggestions = speakers.filter((s) => s.id !== current.id && (!q || s.name.toLowerCase().includes(q)));
  const exact = speakers.find((s) => s.name.toLowerCase() === q);
  const showList = focused && !chosen && (trimmed.length > 0 || suggestions.length > 0);
  const canSave = !!chosen || (trimmed.length > 0 && !exact);
  useEffect(() => { if (!open) { setName(""); setChosen(null); setScope("block"); } }, [open]);

  const save = () => {
    onPick(chosen ? choiceFor({ speakerId: chosen.id }, scope) : choiceFor({ name: trimmed }, scope));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] gap-4 rounded-2xl p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg">Who is speaking?</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: current.color }} />{current.name}
        </div>
        <div className="space-y-2">
          {quotes.slice(0, 2).map((t, i) => (
            <p key={i} className="border-l-2 border-border pl-3 text-[13px] leading-relaxed text-foreground/80">“{t}”</p>
          ))}
        </div>
        <div className="relative">
          {chosen ? (
            <div className="flex h-10 items-center gap-2.5 rounded-full border border-input px-3">
              <SpeakerDot speaker={chosen} className="size-5 text-[9px]" />
              <span className="min-w-0 flex-1 truncate text-sm">{chosen.name}</span>
              <button type="button" onClick={() => setChosen(null)} aria-label="Clear" className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={14} /></button>
            </div>
          ) : (
            <Input value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 120)} placeholder="Type a name" autoFocus className="h-10 rounded-full px-4" />
          )}
          {/* kept mounted and hidden, not unmounted: the capture re-seats overlays in the DOM and a late unmount would crash React */}
          {!chosen && (
            <div className={cn("absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-[var(--elevation-md)]", !showList && "hidden")}>
              {suggestions.map((s) => (
                <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setChosen(s); setName(""); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-foreground hover:bg-muted/60">
                  <SpeakerDot speaker={s} className="size-5 text-[9px]" />{s.name}
                </button>
              ))}
              {trimmed.length > 0 && !exact && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setFocused(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-primary hover:bg-primary/[0.06]">
                  <Icon icon={UserAdd01Icon} size={15} />Add new person “{trimmed}”
                </button>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1 text-[13px]">
          {(["block", "all"] as Scope[]).map((s) => (
            <button key={s} type="button" onClick={() => setScope(s)} className={cn("rounded-lg px-3 py-2 text-center transition-colors", scope === s ? "bg-background font-medium text-foreground shadow-[var(--elevation-sm)]" : "text-muted-foreground hover:text-foreground")}>
              {s === "block" ? "Only this block" : `All ${blocksLabel(blockCount)}`}
            </button>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="pill-outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
