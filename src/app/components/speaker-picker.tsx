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
              <Name speaker={s} />
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
        <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
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
          <div className="px-4">
            {list.map((s) => {
              const isCurrent = s.id === current.id;
              return (
                <button key={s.id} type="button" disabled={isCurrent} onClick={() => setTarget({ speakerId: s.id })} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-muted/60", isCurrent && "bg-primary/[0.06]")}>
                  <SpeakerDot speaker={s} className="size-7 text-[11px]" />
                  <Name speaker={s} className={cn("text-[14px] font-medium", isCurrent ? "text-primary" : "text-foreground")} />
                  {isCurrent ? <Icon icon={Tick02Icon} size={16} className="shrink-0 text-primary" /> : <Icon icon={ArrowRight01Icon} size={16} className="shrink-0 text-muted-foreground/60" />}
                </button>
              );
            })}
            {list.length === 0 && !canAdd && <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No one by that name</p>}
          </div>
          <div className={cn("mt-2 border-t border-border/60 px-4 py-2 pb-[calc(8px+env(safe-area-inset-bottom))]", !canAdd && "hidden")}>
            <button type="button" onClick={() => setTarget({ name: trimmed })} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-primary transition-colors active:bg-muted/60">
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
   The voice's own words as quotes you can play, one name field whose
   suggestions come from the invite first, the scope switch, Save. A centred
   dialog on desktop and tablet; on a phone the same content is a bottom sheet. */
export interface Quote { text: string; timestamp: string }

function PlayGlyph() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" /></svg>;
}

/* A quote with its timecode; the play button seeks the recording there, so
   you can hear the voice while deciding who it is. */
function QuoteLine({ quote, onPlay }: { quote: Quote; onPlay?: (timestamp: string) => void }) {
  return (
    <div className="flex items-start gap-2 border-l-2 border-border pl-3">
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-foreground/80">“{quote.text}”</p>
      {onPlay && (
        <button type="button" onClick={() => onPlay(quote.timestamp)} className="mt-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-border/70 px-2 text-[11px] tabular-nums text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary" aria-label={`Play from ${quote.timestamp}`}>
          <PlayGlyph />{quote.timestamp}
        </button>
      )}
    </div>
  );
}

/* Name field with suggestions: people from the invite who are not matched to
   a voice yet come first, then the transcript's own voices, then add-new. */
function NameField({
  value,
  onChange,
  chosen,
  onChoose,
  candidates,
  attendees,
  isPhone,
  autoFocus,
  placeholder = "Type a name",
}: {
  value: string;
  onChange: (v: string) => void;
  chosen: PickerSpeaker | null;
  onChoose: (s: PickerSpeaker | null) => void;
  candidates: PickerSpeaker[];
  attendees: PickerSpeaker[];
  isPhone: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const trimmed = value.trim();
  const q = trimmed.toLowerCase();
  const match = (s: PickerSpeaker) => !q || s.name.toLowerCase().includes(q);
  const fromInvite = attendees.filter(match);
  const voices = candidates.filter(match);
  const exact = [...attendees, ...candidates].find((s) => s.name.toLowerCase() === q);
  const showList = !chosen && (isPhone || focused) && (fromInvite.length + voices.length > 0 || trimmed.length > 0);
  const row = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-foreground hover:bg-muted/60 active:bg-muted/60";
  const heading = "px-3 pt-1.5 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground";
  const rows = (
    <>
      {fromInvite.length > 0 && <p className={heading}>From the invite</p>}
      {fromInvite.map((s) => (
        <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChoose(s); onChange(""); }} className={row}>
          <SpeakerDot speaker={s} className="size-5 text-[9px]" /><Name speaker={s} />
        </button>
      ))}
      {voices.length > 0 && <p className={heading}>In this transcript</p>}
      {voices.map((s) => (
        <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChoose(s); onChange(""); }} className={row}>
          <SpeakerDot speaker={s} className="size-5 text-[9px]" /><Name speaker={s} />
        </button>
      ))}
      {trimmed.length > 0 && !exact && (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setFocused(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-primary hover:bg-primary/[0.06] active:bg-primary/[0.06]">
          <Icon icon={UserAdd01Icon} size={15} />Add new person “{trimmed}”
        </button>
      )}
    </>
  );
  return (
    <div className="relative">
      {chosen ? (
        <div className="flex h-10 items-center gap-2.5 rounded-full border border-input px-3">
          <SpeakerDot speaker={chosen} className="size-5 text-[9px]" />
          <Name speaker={chosen} className="text-sm" />
          <button type="button" onClick={() => onChoose(null)} aria-label="Clear" className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={14} /></button>
        </div>
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 120)} placeholder={placeholder} autoFocus={autoFocus && !isPhone} className="h-10 rounded-full px-4" />
      )}
      {/* desktop: floats under the field; kept mounted and hidden, not unmounted, because the Figma capture re-seats the DOM */}
      {!isPhone && !chosen && (
        <div className={cn("absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-[var(--elevation-md)]", !showList && "hidden")}>{rows}</div>
      )}
      {isPhone && showList && <div className="-mx-1.5 mt-2 rounded-xl bg-muted/40 p-1.5">{rows}</div>}
    </div>
  );
}

function ScopeSwitch({ scope, onChange, blockCount }: { scope: Scope; onChange: (s: Scope) => void; blockCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1 text-[13px]">
      {(["block", "all"] as Scope[]).map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className={cn("rounded-lg px-3 py-2 text-center transition-colors", scope === s ? "bg-background font-medium text-foreground shadow-[var(--elevation-sm)]" : "text-muted-foreground hover:text-foreground")}>
          {s === "block" ? "Only this block" : `All ${blocksLabel(blockCount)}`}
        </button>
      ))}
    </div>
  );
}

/* the same shell for both dialogs: centred on desktop and tablet, a sheet on the phone */
function DialogShell({ open, onOpenChange, title, isPhone, children, footer, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; isPhone: boolean; children: ReactNode; footer: ReactNode; wide?: boolean }) {
  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh] [&>div:first-child]:hidden">
          <DrawerHeader className="flex-row items-center justify-between pb-1 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <button type="button" onClick={() => onOpenChange(false)} aria-label="Close" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"><Icon icon={Cancel01Icon} size={16} /></button>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">{children}{footer}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gap-4 rounded-2xl p-6", wide ? "max-w-[520px]" : "max-w-[440px]")}>
        <DialogHeader className="text-left"><DialogTitle className="text-lg">{title}</DialogTitle></DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:justify-end">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
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
  onPlay,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: PickerSpeaker;
  speakers: PickerSpeaker[];
  attendees?: PickerSpeaker[];
  blockCount: number;
  quotes: Quote[];
  onPlay?: (timestamp: string) => void;
  onPick: (choice: SpeakerChoice) => void;
}) {
  const isPhone = useIsPhone();
  const [name, setName] = useState("");
  const [chosen, setChosen] = useState<PickerSpeaker | null>(null);
  const [scope, setScope] = useState<Scope>("block");
  const trimmed = name.trim();
  const exact = speakers.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  const canSave = !!chosen || (trimmed.length > 0 && !exact);
  useEffect(() => { if (!open) { setName(""); setChosen(null); setScope("block"); } }, [open]);

  const save = () => {
    /* a person from the invite is a new name for this voice; a transcript voice is a move */
    const isVoice = chosen && speakers.some((s) => s.id === chosen.id);
    onPick(chosen ? (isVoice ? choiceFor({ speakerId: chosen.id }, scope) : choiceFor({ name: chosen.name }, scope)) : choiceFor({ name: trimmed }, scope));
    onOpenChange(false);
  };

  const footer = isPhone ? (
    <Button onClick={save} disabled={!canSave} className="h-11 w-full">Save</Button>
  ) : (
    <>
      <Button variant="pill-outline" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button onClick={save} disabled={!canSave}>Save</Button>
    </>
  );

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title="Who is speaking?" isPhone={isPhone} footer={footer}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="size-2 rounded-full" style={{ backgroundColor: current.color }} />{current.name}
      </div>
      <div className="space-y-2">
        {quotes.slice(0, 2).map((qt, i) => <QuoteLine key={i} quote={qt} onPlay={onPlay} />)}
      </div>
      <NameField value={name} onChange={setName} chosen={chosen} onChoose={setChosen} candidates={speakers.filter((s) => s.id !== current.id)} attendees={attendees} isPhone={isPhone} autoFocus />
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
  onPlay,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voices: { speaker: PickerSpeaker; quotes: Quote[]; blockCount: number }[];
  attendees?: PickerSpeaker[];
  onPlay?: (timestamp: string) => void;
  onSave: (names: Record<string, string>) => void;
}) {
  const isPhone = useIsPhone();
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<Record<string, PickerSpeaker | null>>({});
  useEffect(() => { if (!open) { setTyped({}); setChosen({}); } }, [open]);
  const nameFor = (id: string) => chosen[id]?.name ?? typed[id]?.trim() ?? "";
  const filled = voices.filter((v) => nameFor(v.speaker.id).length > 0).length;
  const taken = new Set(Object.values(chosen).filter(Boolean).map((s) => s!.id));
  const save = () => {
    const names: Record<string, string> = {};
    voices.forEach((v) => { const n = nameFor(v.speaker.id); if (n) names[v.speaker.id] = n; });
    onSave(names);
    onOpenChange(false);
  };
  const footer = isPhone ? (
    <Button onClick={save} disabled={filled === 0} className="h-11 w-full">{filled > 1 ? `Save ${filled} names` : "Save name"}</Button>
  ) : (
    <>
      <Button variant="pill-outline" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button onClick={save} disabled={filled === 0}>{filled > 1 ? `Save ${filled} names` : "Save name"}</Button>
    </>
  );
  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={voices.length === 1 ? "Name the speaker" : `Name ${voices.length} speakers`} isPhone={isPhone} footer={footer} wide>
      <p className="-mt-2 text-[13px] text-muted-foreground">Listen, type who it is, and every block by that voice takes the name.</p>
      {voices.map((v, i) => (
        <div key={v.speaker.id} className={cn("space-y-2.5", i > 0 && "border-t border-border/60 pt-4")}>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: v.speaker.color }} />{v.speaker.name}
            <span className="font-normal normal-case tracking-normal">· {blocksLabel(v.blockCount)}</span>
          </div>
          {v.quotes.slice(0, 2).map((qt, k) => <QuoteLine key={k} quote={qt} onPlay={onPlay} />)}
          <NameField
            value={typed[v.speaker.id] ?? ""}
            onChange={(val) => setTyped((t) => ({ ...t, [v.speaker.id]: val }))}
            chosen={chosen[v.speaker.id] ?? null}
            onChoose={(s) => setChosen((c) => ({ ...c, [v.speaker.id]: s }))}
            candidates={[]}
            attendees={attendees.filter((a) => !taken.has(a.id) || chosen[v.speaker.id]?.id === a.id)}
            isPhone={isPhone}
            autoFocus={i === 0}
            placeholder="Who is this?"
          />
        </div>
      ))}
    </DialogShell>
  );
}
