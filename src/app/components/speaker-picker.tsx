import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "./ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useIsPhone } from "./ui/use-mobile";

export interface PickerSpeaker {
  id: string;
  name: string;
  color: string;
  initial: string;
}

/* One click, one outcome. Picking a person that already exists moves only
   this block to them (the common fix: the model gave one line to the wrong
   voice). Typing a name the transcript does not know offers two rows that
   say the scope in words: rename this voice everywhere, or add a new person
   for this block only. Nothing is renamed silently across the transcript. */
export type SpeakerChoice =
  | { kind: "move"; speakerId: string }
  | { kind: "move-all"; speakerId: string }
  | { kind: "rename"; name: string }
  | { kind: "add"; name: string };

function SpeakerDot({ speaker, size = "size-5 text-[9px]" }: { speaker: PickerSpeaker; size?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${size}`} style={{ backgroundColor: speaker.color }}>
      {speaker.initial}
    </span>
  );
}

function PlusIcon() {
  return (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    </span>
  );
}

function SpeakerList({
  current,
  speakers,
  blockCount,
  onPick,
}: {
  current: PickerSpeaker;
  speakers: PickerSpeaker[];
  blockCount: number;
  onPick: (choice: SpeakerChoice) => void;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const known = speakers.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  const others = speakers.filter((s) => s.id !== current.id);
  const blocks = blockCount === 1 ? "1 block" : `${blockCount} blocks`;

  return (
    <Command shouldFilter={trimmed.length > 0} className="bg-transparent">
      <CommandInput value={query} onValueChange={setQuery} placeholder="Find or type a name" autoFocus />
      <CommandList className="max-h-[320px]">
        <CommandGroup heading="Who said this?">
          {others.map((s) => (
            <CommandItem key={s.id} value={s.name} onSelect={() => onPick({ kind: "move", speakerId: s.id })} className="gap-2.5 py-2">
              <SpeakerDot speaker={s} />
              <span className="truncate">{s.name}</span>
            </CommandItem>
          ))}
          <CommandItem value={`${current.name} current`} disabled className="gap-2.5 py-2 opacity-60 data-[disabled=true]:opacity-60">
            <SpeakerDot speaker={current} />
            <span className="truncate">{current.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">now</span>
          </CommandItem>
        </CommandGroup>
        {trimmed.length > 0 && !known && (
          <>
            <CommandSeparator />
            <CommandGroup forceMount>
              <CommandItem forceMount value={`rename ${trimmed}`} onSelect={() => onPick({ kind: "rename", name: trimmed })} className="gap-2.5 py-2">
                <SpeakerDot speaker={{ ...current, initial: trimmed[0]?.toUpperCase() ?? current.initial }} />
                <span className="min-w-0 whitespace-normal leading-snug">Rename {current.name} to “{trimmed}” <span className="text-muted-foreground">({blocks})</span></span>
              </CommandItem>
              <CommandItem forceMount value={`add ${trimmed}`} onSelect={() => onPick({ kind: "add", name: trimmed })} className="gap-2.5 py-2">
                <PlusIcon />
                <span className="min-w-0 whitespace-normal leading-snug">Add “{trimmed}” for this block only</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}

/* Variant A (ships): a plain dropdown right on the speaker name. On a phone
   the same list opens as a bottom sheet, because a popover there would
   clip against the screen edge and hide the keyboard. */
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
  const pick = (choice: SpeakerChoice) => {
    setOpen(false);
    onPick(choice);
  };

  if (isPhone) {
    return (
      <>
        <span onClick={() => setOpen(true)} className="contents">{children}</span>
        <Drawer open={isOpen} onOpenChange={setOpen}>
          <DrawerContent className="[&>div:first-child]:hidden">
            <DrawerHeader className="pb-0 text-left">
              <DrawerTitle className="text-base">Change speaker</DrawerTitle>
            </DrawerHeader>
            <div className="px-2 pb-6">
              <SpeakerList current={current} speakers={speakers} blockCount={blockCount} onPick={pick} />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[300px] p-0 shadow-[var(--elevation-md)]">
        <SpeakerList current={current} speakers={speakers} blockCount={blockCount} onPick={pick} />
      </PopoverContent>
    </Popover>
  );
}

/* Variant B (kept for comparison in Figma, behind ttt_demo_speaker_dialog=1):
   the same decision as a centred dialog with a radio list, a name field and
   an explicit scope switch. Heavier by one screen and two extra controls. */
export function SpeakerDialog({
  open,
  onOpenChange,
  current,
  speakers,
  blockCount,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: PickerSpeaker;
  speakers: PickerSpeaker[];
  blockCount: number;
  onPick: (choice: SpeakerChoice) => void;
}) {
  const [selected, setSelected] = useState<string>(current.id);
  const [newName, setNewName] = useState("");
  const [scope, setScope] = useState<"block" | "all">("block");
  const trimmed = newName.trim();
  const canSave = trimmed.length > 0 || selected !== current.id;

  const save = () => {
    if (trimmed.length > 0) {
      onPick(scope === "all" ? { kind: "rename", name: trimmed } : { kind: "add", name: trimmed });
    } else if (scope === "all") {
      onPick({ kind: "move-all", speakerId: selected });
    } else {
      onPick({ kind: "move", speakerId: selected });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-2xl p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg">Who said this?</DialogTitle>
        </DialogHeader>
        <RadioGroup value={trimmed ? "" : selected} onValueChange={(v) => { setSelected(v); setNewName(""); }} className="gap-1">
          {speakers.map((s) => (
            <Label key={s.id} htmlFor={`spk-${s.id}`} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal hover:bg-muted/60">
              <RadioGroupItem id={`spk-${s.id}`} value={s.id} />
              <SpeakerDot speaker={s} />
              <span className="truncate">{s.name}</span>
              {s.id === current.id && <span className="ml-auto text-xs text-muted-foreground">now</span>}
            </Label>
          ))}
        </RadioGroup>
        <div className="flex items-center gap-3 px-3">
          <PlusIcon />
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Or type a new name" className="h-9 rounded-full" />
        </div>
        <RadioGroup value={scope} onValueChange={(v) => setScope(v as "block" | "all")} className="mt-1 gap-1 rounded-xl bg-muted/50 p-1.5 text-sm">
          <Label htmlFor="scope-block" className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 font-normal"><RadioGroupItem id="scope-block" value="block" />Only this block</Label>
          <Label htmlFor="scope-all" className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 font-normal"><RadioGroupItem id="scope-all" value="all" />All {blockCount} blocks by {current.name}</Label>
        </RadioGroup>
        <DialogFooter className="mt-2 gap-2 sm:justify-end">
          <Button variant="pill-outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
