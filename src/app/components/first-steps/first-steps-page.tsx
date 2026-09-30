import { useEffect, useMemo, useRef, useState } from "react";
import { Settings02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollFade } from "../scroll-fade";
import { useTranscriptionModals } from "../transcription-modals";
import { useOnboarding } from "../onboarding/onboarding-context";
import { GUIDE_PERSON, SETUP_GROUPS, SETUP_REQUIRED, isSetupDone, stepTourId, type SetupItem } from "../onboarding/guides";
import { DetailCard, DetailSheet, GuideGlyph, HeadChip, HeadGo, LearnHead, LearnLayout, ListRow, ListSection, PAGE, ProgressRing, type DetailProps } from "../learn/learn-frame";
import { useIsPhone } from "../ui/use-mobile";

/* First steps as a page (variant b, reviews 60-62). Built from the same frame
   as the Academy (learn/learn-frame.tsx) so the two pages line up exactly:
   the head with the ring, the list on the left, the open step on the right,
   a sheet on a phone. Guide me walks to the step and hands over; doing it
   yourself is the second button. The goal, the free month, closes the list.
   "Customize" holds the two switches: the helper on every page and the row
   in the sidebar (Vektor's display preferences, in our language). */

const GIFT = "/images/onboarding-gift.png";
const HERO = "/images/first-steps/hero.jpg";

export { ProgressRing };

export function useRunStep() {
  const ob = useOnboarding();
  const { setOpenModal } = useTranscriptionModals();
  return (x: SetupItem) => {
    if (x.run === "modal" && x.modal) { setOpenModal(x.modal); return; }
    if (x.run === "calendar") { ob.startGuide("meetings"); return; }
    if (x.run === "profile") { ob.navigate({ page: "settings" }); return; }
    ob.startGuide(x.how);
  };
}

export function DisplayPrefs({ dark = false }: { dark?: boolean }) {
  const ob = useOnboarding();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" data-first-steps-customize="" className={cn("flex h-9 items-center gap-[7px] rounded-full px-[14px] text-[13px] font-semibold transition-colors", dark ? "bg-white/10 text-white hover:bg-white/15" : "border border-border bg-card text-foreground hover:bg-muted")}>
          <Icon icon={Settings02Icon} size={15} strokeWidth={2} />Customize
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[300px] rounded-[14px] p-[6px]">
        <p className="px-[10px] pt-[8px] pb-[4px] text-[12px] font-semibold text-muted-foreground">Show First steps</p>
        {([
          ["helper", "On every page", "A small helper at the bottom of the screen.", ob.showHelper, ob.setShowHelper],
          ["nav", "In the sidebar", "A row with your progress, above the Academy.", ob.showNav, ob.setShowNav],
        ] as const).map(([k, t, d, on, set]) => (
          <label key={k} data-pref={k} className="flex cursor-pointer items-start gap-[12px] rounded-[10px] px-[10px] py-[9px] hover:bg-muted/70">
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold leading-[18px] text-foreground">{t}</span>
              <span className="block text-[12px] leading-[16px] text-muted-foreground">{d}</span>
            </span>
            <Switch checked={on} onCheckedChange={(v) => set(v)} className="mt-[2px]" />
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function FirstStepsPage() {
  const ob = useOnboarding();
  const phone = useIsPhone();
  const run = useRunStep();
  const scrollRef = useRef<HTMLDivElement>(null);
  const has = (id: string) => ob.actions.has(id);
  const total = SETUP_REQUIRED.length;
  const doneCount = SETUP_REQUIRED.filter((x) => isSetupDone(x, has)).length;
  const nextOpen = SETUP_REQUIRED.find((x) => !isSetupDone(x, has)) ?? ob.setup.find((x) => !isSetupDone(x, has));
  const firstOpen = useMemo(() => nextOpen ?? ob.setup[0], []); // eslint-disable-line react-hooks/exhaustive-deps
  const [selId, setSelId] = useState(firstOpen.id);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const sel = ob.setup.find((x) => x.id === selId) ?? ob.setup[0];
  const selDone = isSetupDone(sel, has);
  const academyWatched = new Set([...ob.done, ...ob.seen]).size;

  /* when the open step gets done, move on to the next open one */
  const wasDone = useRef(selDone);
  useEffect(() => {
    if (selDone && !wasDone.current) {
      const i = ob.setup.findIndex((x) => x.id === sel.id);
      const next = ob.setup.slice(i + 1).find((x) => !isSetupDone(x, has));
      if (next) window.setTimeout(() => setSelId(next.id), 900);
    }
    wasDone.current = selDone;
  }, [selDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (x: SetupItem) => { if (phone) setSheetId(x.id); else setSelId(x.id); };
  const guide = (x: SetupItem) => { setSheetId(null); ob.startGuide(stepTourId(x.id)); };

  const detail = (x: SetupItem): DetailProps => {
    const i = ob.setup.findIndex((y) => y.id === x.id);
    const grp = SETUP_GROUPS.find((g) => g.id === x.group);
    const done = isSetupDone(x, has);
    return {
      attr: { "data-first-steps-step": x.id },
      coverId: x.id,
      widget: x.widget,
      cover: x.cover,
      meta: <>Step {i + 1} of {ob.setup.length}<span className="text-border"> · </span>{grp?.title}{x.optional && <span> · Optional</span>}{done && <span className="text-primary"> · done</span>}</>,
      onPrev: i > 0 ? () => pick(ob.setup[i - 1]) : undefined,
      onNext: i < ob.setup.length - 1 ? () => pick(ob.setup[i + 1]) : undefined,
      title: x.title,
      text: x.why,
      actions: done ? (
        <span className="flex h-10 items-center gap-[7px] rounded-full bg-primary/10 px-[16px] text-[13.5px] font-semibold text-primary"><Icon icon={Tick02Icon} size={14} strokeWidth={3} />Done</span>
      ) : (
        <>
          <Button data-first-steps-show="" onClick={() => guide(x)} className="h-10 gap-[8px] px-[20px] text-[13.5px] font-semibold"><GuideGlyph />Guide me</Button>
          <Button variant="pill-outline" data-first-steps-do="" onClick={() => { setSheetId(null); run(x); }} className="h-10 px-[16px] text-[13.5px] font-semibold">{x.action}</Button>
        </>
      ),
      mia: "I'll take you to the exact spot and hand it over to you.",
    };
  };
  const sheet = ob.setup.find((x) => x.id === sheetId) ?? null;

  return (
    <div ref={scrollRef} data-tour="page-first-steps" className="flex-1 overflow-auto min-w-0">
      <ScrollFade scrollRef={scrollRef} />
      <div className={PAGE}>
        <LearnHead tour="first-steps-banner" photo={HERO} done={doneCount} total={total} title="First steps"
          subtitle={`Try every way in once, then make the account yours. ${GUIDE_PERSON.name} guides you to each one.`}
          actions={<>
            <HeadChip attr={{ "data-first-steps-academy": "" }} onClick={() => ob.navigate({ page: "academy" })} done={academyWatched} total={ob.guides.length} label="Academy" />
            {nextOpen && <HeadGo attr={{ "data-first-steps-show-next": "" }} onClick={() => guide(nextOpen)}>Guide me: {nextOpen.title}</HeadGo>}
          </>} />
        <LearnLayout
          list={<>
            {SETUP_GROUPS.map((grp) => {
              const items = ob.setup.filter((x) => x.group === grp.id);
              const req = items.filter((x) => !x.optional);
              return (
                <ListSection key={grp.id} title={grp.title} count={`${req.filter((x) => isSetupDone(x, has)).length} of ${req.length}`}>
                  {items.map((x) => (
                    <ListRow key={x.id} attr={{ "data-first-step": x.id }} thumb={x.cover} title={x.title} done={isSetupDone(x, has)} active={!phone && x.id === sel.id} next={nextOpen?.id === x.id} onClick={() => pick(x)}
                      meta={x.optional ? <span>Optional · {x.why}</span> : <span className="truncate">{x.why}</span>} />
                  ))}
                </ListSection>
              );
            })}
            {/* the goal: what all of this is for */}
            <div data-first-steps-goal="" className="relative overflow-hidden rounded-[16px] bg-[#0A1630] px-[16px] py-[16px] text-white" style={{ boxShadow: "0 6px 18px rgba(10,22,48,0.18)" }}>
              <span aria-hidden className="absolute -right-6 -top-8 size-[140px] rounded-full bg-primary/40 blur-2xl" />
              <img src={GIFT} alt="" aria-hidden className="absolute right-[10px] top-1/2 size-[64px] -translate-y-1/2 select-none object-contain" />
              <div className="relative pr-[72px]">
                <p className="text-[12px] font-semibold text-white/60">Your goal</p>
                <p className="mt-[2px] text-[16px] font-bold leading-[21px] tracking-[-0.2px]">{ob.allDone ? "Your free month is unlocked" : "1 month free"}</p>
                <p className="mt-[3px] text-[12.5px] leading-[17px] text-white/70">{ob.allDone ? "The code is in Plan Management." : `${total - doneCount} ${total - doneCount === 1 ? "step" : "steps"} to go. The photo is a bonus, not a condition.`}</p>
                <span className="mt-[10px] block h-[5px] overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${Math.round((doneCount / Math.max(1, total)) * 100)}%` }} /></span>
              </div>
            </div>
            {/* where First steps shows: kept out of the head so both pages' heads carry the same two buttons */}
            <div className="flex items-center justify-between gap-3 px-[4px]">
              <span className="text-[12.5px] text-muted-foreground">Helper on every page, row in the sidebar</span>
              <DisplayPrefs />
            </div>
          </>}
          detail={!phone && <DetailCard {...detail(sel)} />}
        />
      </div>
      {phone && <DetailSheet open={!!sheet} onClose={() => setSheetId(null)} props={sheet ? detail(sheet) : null} />}
    </div>
  );
}
