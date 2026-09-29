import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight01Icon, Cancel01Icon, Clock01Icon, PlayIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";
import { useIsPhone } from "./ui/use-mobile";
import { ScrollFade } from "./scroll-fade";
import { ACADEMY_SECTIONS, GUIDE_PERSON, NO_ANCHOR, type Guide } from "./onboarding/guides";
import { useOnboarding } from "./onboarding/onboarding-context";

/* The Academy: every feature of the product as a short lesson you can read
   or be walked through. Separate from Account Setup on purpose (Artem +
   Kirill, 29.09): setup is done once, the Academy is competence.

   Page: a wide banner in the in-app banner language (photograph, navy wash,
   Mia at the right edge, one number, one segmented bar, one Continue button),
   then the lessons grouped in four sections as cover cards. A card opens the
   lesson as a right panel (web) or a bottom sheet (phone): what you will be
   able to do, the steps in plain words, and Start tour. Opening it counts as
   watched; finishing the tour counts as done. */

const PHOTO = "/images/onboarding-start.jpg";
const NAVY = "#0A1630";
const WASH = "linear-gradient(90deg, #0A1630 0%, #0A1630 46%, rgba(10,22,48,0.7) 68%, rgba(10,22,48,0.25) 100%)";

export function AcademyPage() {
  const ob = useOnboarding();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const openGuide = ob.guides.find((g) => g.id === openId) ?? null;

  const watched = useMemo(() => new Set([...ob.done, ...ob.seen]), [ob.done, ob.seen]);
  const total = ob.guides.length;
  const next = ob.guides.find((g) => !ob.done.has(g.id));

  const open = (g: Guide) => { setOpenId(g.id); ob.markSeen(g.id); };
  const startTour = (g: Guide) => { setOpenId(null); ob.startGuide(g.id); };

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto min-w-0" data-tour="academy-page">
      <ScrollFade scrollRef={scrollRef} />
      <div className="px-4 pt-[16px] pb-[40px] lg:px-[32px] lg:pt-[28px]">
        <Banner watched={watched.size} total={total} next={next} onContinue={() => next && startTour(next)} />

        {ACADEMY_SECTIONS.map((sec) => {
          const inSec = ob.guides.filter((g) => g.category === sec.id);
          const doneIn = inSec.filter((g) => watched.has(g.id)).length;
          return (
            <section key={sec.id} className="mt-10">
              <div className="mb-[14px] flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.2px] text-foreground">{sec.title}</h2>
                  <p className="mt-[2px] text-[13px] leading-[18px] text-muted-foreground">{sec.subtitle}</p>
                </div>
                <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-muted-foreground">{doneIn} of {inSec.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2 xl:grid-cols-3">
                {inSec.map((g) => (
                  <LessonCard key={g.id} guide={g} index={ob.guides.indexOf(g) + 1} done={ob.done.has(g.id)} seen={ob.seen.has(g.id)} isNext={next?.id === g.id} onOpen={() => open(g)} onStart={() => startTour(g)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <LessonPanel guide={openGuide} index={openGuide ? ob.guides.indexOf(openGuide) + 1 : 0} done={openGuide ? ob.done.has(openGuide.id) : false} onClose={() => setOpenId(null)} onStart={() => openGuide && startTour(openGuide)} />
    </div>
  );
}

/* ── the banner ── */
function Banner({ watched, total, next, onContinue }: { watched: number; total: number; next: Guide | undefined; onContinue: () => void }) {
  const ob = useOnboarding();
  return (
    <div data-tour="academy-banner" className="relative overflow-hidden rounded-[20px]" style={{ background: NAVY, boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}>
      <img src={PHOTO} alt="" aria-hidden className="absolute inset-y-0 right-0 h-full w-[62%] select-none object-cover" style={{ objectPosition: "70% 45%" }} />
      <span aria-hidden className="absolute inset-0" style={{ background: WASH }} />
      {/* Mia, the guide, standing at the right edge over the wash; web only */}
      <img src={GUIDE_PERSON.figure} alt="" aria-hidden className="pointer-events-none absolute bottom-0 right-[24px] hidden h-[112%] select-none object-contain object-bottom lg:block" style={{ filter: "drop-shadow(0 18px 30px rgba(10,22,48,0.5))" }} />
      <div className="relative flex min-h-[200px] flex-col justify-between gap-6 px-[24px] py-[24px] lg:min-h-[228px] lg:px-[32px] lg:py-[28px] lg:pr-[320px]">
        <div>
          <h1 className="text-[24px] font-bold leading-[30px] tracking-[-0.5px] text-white lg:text-[30px] lg:leading-[36px] lg:tracking-[-0.6px]">Academy</h1>
          <p className="mt-[6px] max-w-[520px] text-[14px] leading-[20px] text-white/75">Ten short lessons, one per feature. Read it in a minute or let {GUIDE_PERSON.name} walk you through it right in the app.</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-[8px] text-white">
              <span className="text-[34px] font-bold leading-none tracking-[-0.8px] tabular-nums">{watched}</span>
              <span className="text-[14px] font-medium text-white/75">of {total} lessons watched</span>
            </div>
            <div className="mt-[10px] flex w-[280px] max-w-full gap-[4px]" aria-hidden>
              {ob.guides.map((g) => {
                const state = ob.done.has(g.id) ? "done" : ob.seen.has(g.id) ? "seen" : "none";
                return <span key={g.id} className={cn("h-[6px] flex-1 rounded-full transition-colors", state === "done" ? "bg-white" : state === "seen" ? "bg-white/55" : "bg-white/20")} />;
              })}
            </div>
          </div>
          {next ? (
            <button type="button" data-tour="academy-continue" onClick={onContinue} className="flex h-[40px] shrink-0 items-center gap-[10px] rounded-full bg-white pl-[18px] pr-[14px] text-[13.5px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]">
              <Icon icon={PlayIcon} size={14} strokeWidth={2.4} />
              <span className="truncate">{watched === 0 ? "Start" : "Continue"}: {next.title}</span>
              <span className="text-[12px] font-medium tabular-nums text-[#0A1630]/60">{next.seconds}s</span>
            </button>
          ) : (
            <span className="flex h-[40px] items-center gap-[8px] rounded-full border border-white/30 px-[16px] text-[13.5px] font-semibold text-white"><Icon icon={Tick02Icon} size={14} strokeWidth={3} />Every lesson done</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── a lesson card ── */
function LessonCard({ guide, index, done, seen, isNext, onOpen, onStart }: { guide: Guide; index: number; done: boolean; seen: boolean; isNext: boolean; onOpen: () => void; onStart: () => void }) {
  return (
    <div data-academy-card={guide.id} className={cn("group relative flex flex-col overflow-hidden rounded-[16px] border bg-card text-left transition-[box-shadow,border-color] hover:shadow-[var(--elevation-md)]", isNext ? "border-primary/40" : "border-border")}>
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#0A1630]">
          <img src={guide.cover} alt="" className={cn("h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.03]", done && "opacity-80")} loading="lazy" />
          <span className="absolute left-[12px] top-[12px] flex h-[24px] items-center gap-[5px] rounded-full px-[9px] text-[11.5px] font-semibold tabular-nums text-[#0A1630]" style={{ background: done ? "#fff" : "rgba(255,255,255,0.88)" }}>
            {done ? <><Icon icon={Tick02Icon} size={12} strokeWidth={3} />Done</> : seen ? "Read" : <><Icon icon={Clock01Icon} size={12} strokeWidth={2.2} />{guide.seconds}s</>}
          </span>
          <span className="absolute right-[12px] top-[12px] flex size-[24px] items-center justify-center rounded-full bg-[#0A1630]/70 text-[11px] font-bold tabular-nums text-white">{index}</span>
        </div>
        <div className="flex flex-1 flex-col px-[16px] pt-[14px] pb-[12px]">
          <p className="text-[15px] font-semibold leading-[20px] tracking-[-0.1px] text-foreground">{guide.title}</p>
          <p className="mt-[4px] text-[13px] leading-[18px] text-muted-foreground">{guide.summary}</p>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-border px-[16px] py-[10px]">
        <button type="button" onClick={onOpen} className="text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">Read the steps</button>
        <button type="button" data-academy-start={guide.id} onClick={onStart} className={cn("flex h-[28px] items-center gap-[6px] rounded-full px-[12px] text-[12px] font-semibold transition-colors", isNext ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-card text-foreground hover:bg-muted")}>
          <Icon icon={PlayIcon} size={11} strokeWidth={2.6} />{done ? "Again" : "Start tour"}
        </button>
      </div>
    </div>
  );
}

/* ── the lesson panel: read the steps, then start the tour ── */
function LessonPanel({ guide, index, done, onClose, onStart }: { guide: Guide | null; index: number; done: boolean; onClose: () => void; onStart: () => void }) {
  const phone = useIsPhone();
  const openState = guide !== null;
  /* keep the last guide while the panel animates out */
  const [last, setLast] = useState<Guide | null>(guide);
  useEffect(() => { if (guide) setLast(guide); }, [guide]);
  const g = guide ?? last;
  if (!g) return null;
  const steps = g.steps.filter((s) => s.anchor !== NO_ANCHOR);

  const body = (
    <div className="flex flex-col">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0A1630]">
        <img src={g.cover} alt="" className="h-full w-full select-none object-cover" />
        <span className="absolute left-[14px] top-[14px] flex h-[24px] items-center gap-[5px] rounded-full bg-white/90 px-[9px] text-[11.5px] font-semibold tabular-nums text-[#0A1630]">
          {done ? <><Icon icon={Tick02Icon} size={12} strokeWidth={3} />Done</> : <><Icon icon={Clock01Icon} size={12} strokeWidth={2.2} />{g.seconds}s</>}
        </span>
      </div>
      <div className="px-[20px] pt-[18px] pb-[8px]">
        <p className="text-[12px] font-medium text-muted-foreground">Lesson {index}</p>
        <h3 className="mt-[2px] text-[20px] font-bold leading-[26px] tracking-[-0.3px] text-foreground">{g.title}</h3>
        <p className="mt-[8px] text-[14px] leading-[20px] text-foreground/80">{g.summary}</p>
        <div className="mt-[14px] flex items-center gap-[10px] rounded-[12px] bg-muted/60 px-[12px] py-[10px]">
          <img src={GUIDE_PERSON.avatar} alt="" aria-hidden className="size-[32px] shrink-0 rounded-full bg-primary/10 object-cover object-top" />
          <p className="text-[13px] leading-[18px] text-foreground/80"><span className="font-semibold text-foreground">{GUIDE_PERSON.name}</span>, {GUIDE_PERSON.title}: "Read the steps below, or press Start tour and I'll show you on the real screens."</p>
        </div>
      </div>
      <div className="px-[20px] pt-[10px]">
        <p className="text-[12px] font-semibold text-muted-foreground">Steps</p>
        <ol className="mt-[8px] flex flex-col">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-[12px] py-[9px]">
              {i < steps.length - 1 && <span aria-hidden className="absolute left-[11px] top-[32px] h-[calc(100%-22px)] w-[2px] bg-border" />}
              <span className="relative z-[1] flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-[11px] font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 pt-[1px]">
                <span className="block text-[13.5px] font-semibold leading-[18px] text-foreground">{s.title}</span>
                <span className="block text-[13px] leading-[18px] text-muted-foreground">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center gap-[10px] border-t border-border px-[20px] py-[14px]">
      <Button data-academy-panel-start="" onClick={onStart} className="h-10 flex-1 gap-[8px] text-[13.5px] font-semibold"><Icon icon={PlayIcon} size={13} strokeWidth={2.6} />{done ? "Take the tour again" : "Start tour"}<span className="text-[12px] font-medium tabular-nums text-primary-foreground/70">{g.seconds}s</span></Button>
      <Button variant="pill-outline" onClick={onClose} className="h-10 px-[16px] text-[13.5px] font-semibold">Close</Button>
    </div>
  );

  if (phone) {
    return (
      <Drawer open={openState} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent data-academy-panel="" className="[&>div:first-child]:hidden">
          <DrawerTitle className="sr-only">{g.title}</DrawerTitle>
          <DrawerDescription className="sr-only">{g.summary}</DrawerDescription>
          <div className="max-h-[78vh] overflow-y-auto">{body}</div>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>{footer}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Sheet open={openState} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" data-academy-panel="" className="flex w-[440px] max-w-[92vw] flex-col gap-0 p-0 sm:max-w-[440px] [&>button]:hidden">
        <SheetTitle className="sr-only">{g.title}</SheetTitle>
        <SheetDescription className="sr-only">{g.summary}</SheetDescription>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[12px] top-[12px] z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"><Icon icon={Cancel01Icon} size={16} /></button>
        <div className="flex-1 overflow-y-auto">{body}</div>
        {footer}
      </SheetContent>
    </Sheet>
  );
}

/* the small arrow used in the section link */
export const AcademyArrow = ArrowRight01Icon;
