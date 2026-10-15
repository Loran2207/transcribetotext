import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, Clock01Icon, Maximize01Icon, PlayIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { useIsPhone } from "./ui/use-mobile";
import { ScrollFade } from "./scroll-fade";
import { BannerStage, SceneCover } from "./academy-scene";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ACADEMY_SECTIONS, GUIDE_PERSON, NO_ANCHOR, type Guide } from "./onboarding/guides";
import { Orb } from "./onboarding/orb/orb";
import { STEP_SHOTS } from "./onboarding/step-shots";
import { useOnboarding } from "./onboarding/onboarding-context";

/* The Academy: every feature as a short lesson you can read or be walked
   through. Separate from Account Setup: setup is done once, the Academy is
   competence.

   Review 56 (Kirill, 29.09): covers and banner speak the marketing site v2
   language, see academy-scene.tsx. Real night photographs; the banner plays
   the scenes of one meeting; each card holds still with one frosted piece of
   its interface (review 57). Tabs with counters as on Templates. The copy
   never states how many guides exist: the Academy will keep growing. */

const NAVY = "#0A1630";

export function AcademyPage() {
  const ob = useOnboarding();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const openGuide = ob.guides.find((g) => g.id === openId) ?? null;

  const watched = useMemo(() => new Set([...ob.done, ...ob.seen]), [ob.done, ob.seen]);
  const total = ob.guides.length;
  const next = ob.guides.find((g) => !ob.done.has(g.id));

  const open = (g: Guide) => { setOpenId(g.id); ob.markSeen(g.id); };
  const startTour = (g: Guide) => { setOpenId(null); ob.startGuide(g.id); };

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto min-w-0" data-tour="academy-page">
      <ScrollFade scrollRef={scrollRef} />
      <div className="@container px-4 pt-[16px] pb-[40px] lg:px-[32px] lg:pt-[24px]">
        <Banner watched={watched.size} total={total} next={next} onContinue={() => next && startTour(next)} />

        <Tabs value={tab} onValueChange={setTab} className="mt-[22px] gap-0">
          <div className="overflow-x-auto -mx-4 px-4 lg:-mx-[32px] lg:px-[32px] border-b border-border [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <TabsList variant="line" data-tour="academy-tabs" className="gap-5 whitespace-nowrap w-max border-0">
              <TabsTrigger value="all" variant="line" className="max-lg:text-[13px]">All <span className="opacity-50 font-[inherit] ml-1">{total}</span></TabsTrigger>
              {ACADEMY_SECTIONS.map((sec) => (
                <TabsTrigger key={sec.id} value={sec.id} variant="line" className="max-lg:text-[13px]">{sec.tab} <span className="opacity-50 font-[inherit] ml-1">{ob.guides.filter((g) => g.category === sec.id).length}</span></TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {ACADEMY_SECTIONS.filter((sec) => tab === "all" || tab === sec.id).map((sec) => {
          const inSec = ob.guides.filter((g) => g.category === sec.id);
          const doneIn = inSec.filter((g) => watched.has(g.id)).length;
          return (
            <section key={sec.id} className="mt-7">
              <div className="mb-[12px] flex items-baseline justify-between gap-4">
                <h2 className="text-[16px] font-semibold leading-[22px] tracking-[-0.2px] text-foreground">{sec.title}<span className="ml-[8px] text-[13px] font-normal text-muted-foreground">{sec.subtitle}</span></h2>
                <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-muted-foreground">{doneIn} of {inSec.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-[14px] @[520px]:grid-cols-2 @[680px]:grid-cols-3 @[1040px]:grid-cols-4">
                {inSec.map((g) => (
                  <LessonCard key={g.id} guide={g} done={ob.done.has(g.id)} seen={ob.seen.has(g.id)} isNext={next?.id === g.id} onOpen={() => open(g)} onStart={() => startTour(g)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <LessonPanel guide={openGuide} done={openGuide ? ob.done.has(openGuide.id) : false} onClose={() => setOpenId(null)} onStart={() => openGuide && startTour(openGuide)} />
    </div>
  );
}

/* ── the banner: one wide night photograph; the numbers on the left, a live transcript on the right ── */
function Banner({ watched, total, next, onContinue }: { watched: number; total: number; next: Guide | undefined; onContinue: () => void }) {
  const ob = useOnboarding();
  return (
    <div data-tour="academy-banner" className="@container relative overflow-hidden rounded-[18px]" style={{ background: NAVY, boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}>
      <img src="/images/academy3/banner.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full select-none object-cover object-[92%_45%] @[640px]:object-[50%_45%]" />
      {/* on a narrow banner the words sit over the photograph: the in-app banner's navy wash from the left keeps them readable */}
      <span aria-hidden className="absolute inset-0 @[640px]:hidden" style={{ background: "linear-gradient(90deg, rgba(10,22,48,0.92) 0%, rgba(10,22,48,0.7) 55%, rgba(10,22,48,0.25) 100%)" }} />
      <div className="relative flex min-h-[220px] flex-col justify-between gap-6 px-[24px] py-[24px] lg:min-h-[280px] lg:px-[32px] lg:py-[30px]">
        <div>
          <h1 className="text-[26px] font-bold leading-[32px] tracking-[-0.6px] text-white lg:text-[30px] lg:leading-[36px]">Academy</h1>
          <p className="mt-[6px] max-w-[400px] text-[14px] leading-[20px] text-white/75 @[860px]:max-w-[380px]">Short guides, one per feature. Read one in a minute or let the guide walk you through it on the real screens.</p>
        </div>
        <div className="flex flex-col items-start gap-[16px]">
          <div>
            <div className="flex items-baseline gap-[8px] text-white">
              <span className="text-[30px] font-bold leading-none tracking-[-0.7px] tabular-nums">{watched}</span>
              <span className="text-[13.5px] font-medium text-white/75">of {total} watched</span>
            </div>
            <div className="mt-[10px] flex w-[240px] max-w-full gap-[4px]" aria-hidden>
              {ob.guides.map((g) => {
                const state = ob.done.has(g.id) ? "done" : ob.seen.has(g.id) ? "seen" : "none";
                return <span key={g.id} className={cn("h-[5px] flex-1 rounded-full transition-colors", state === "done" ? "bg-white" : state === "seen" ? "bg-white/55" : "bg-white/20")} />;
              })}
            </div>
          </div>
          {next ? (
            <button type="button" data-tour="academy-continue" onClick={onContinue} className="flex h-[40px] max-w-full items-center gap-[8px] rounded-full bg-white pl-[16px] pr-[14px] text-[13.5px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]">
              <Icon icon={PlayIcon} size={13} strokeWidth={2.6} />
              <span className="min-w-0 max-w-[240px] truncate">{watched === 0 ? "Start" : "Continue"}: {next.title}</span>
              <span className="text-[12px] font-medium tabular-nums text-[#0A1630]/55">{next.seconds}s</span>
            </button>
          ) : (
            <span className="flex h-[40px] items-center gap-[6px] rounded-full border border-white/30 px-[14px] text-[13.5px] font-semibold text-white"><Icon icon={Tick02Icon} size={13} strokeWidth={3} />All done</span>
          )}
        </div>
      </div>
      {/* review 59: the scene shows only where it fits beside the words, never over them */}
      <div className="pointer-events-none absolute bottom-[30px] hidden w-[330px] @[860px]:block" style={{ left: LIVE_LEFT }}>
        <BannerStage />
      </div>
    </div>
  );
}

const LIVE_LEFT = "max(44%, 460px)";

/* ── a lesson card: the photograph with its scene; one translucent chip; title and one line ── */
function LessonCard({ guide, done, seen, isNext, onOpen, onStart }: { guide: Guide; done: boolean; seen: boolean; isNext: boolean; onOpen: () => void; onStart: () => void }) {
  return (
    <div data-academy-card={guide.id} className={cn("group relative flex flex-col overflow-hidden rounded-[14px] border bg-card transition-[box-shadow,border-color,transform] duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[var(--elevation-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0", isNext ? "border-primary/40" : "border-border")}>
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[3/2] w-full overflow-hidden" style={{ background: NAVY }}>
          <SceneCover id={guide.id} src={guide.cover} className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
          <span className={cn("absolute left-[10px] top-[10px] flex h-[22px] items-center gap-[4px] rounded-full px-[8px] text-[11px] font-semibold tabular-nums text-white", done ? "bg-white/90 !text-[#0A1630]" : "bg-[#0A1630]/45 ring-1 ring-white/20")}>
            {done ? <><Icon icon={Tick02Icon} size={11} strokeWidth={3} />Done</> : <><Icon icon={Clock01Icon} size={11} strokeWidth={2.2} />{guide.seconds}s{seen && <span className="text-white/60"> · read</span>}</>}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-[14px] pt-[12px] pb-[10px]">
          <p className="text-[14px] font-semibold leading-[19px] tracking-[-0.1px] text-foreground">{guide.title}</p>
          <p className="mt-[3px] line-clamp-2 text-[12.5px] leading-[17px] text-muted-foreground">{guide.summary}</p>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-border px-[14px] py-[8px]">
        <button type="button" onClick={onOpen} className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">Read</button>
        <button type="button" data-academy-start={guide.id} onClick={onStart} className={cn("flex h-[26px] items-center gap-[5px] rounded-full px-[10px] text-[12px] font-semibold transition-colors", isNext ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-card text-foreground hover:bg-muted")}>
          <Icon icon={PlayIcon} size={10} strokeWidth={2.6} />{done ? "Again" : "Tour"}
        </button>
      </div>
    </div>
  );
}

/* ── the lesson panel: read the steps, then start the tour ── */
function LessonPanel({ guide, done, onClose, onStart }: { guide: Guide | null; done: boolean; onClose: () => void; onStart: () => void }) {
  const phone = useIsPhone();
  const openState = guide !== null;
  const [last, setLast] = useState<Guide | null>(guide);
  useEffect(() => { if (guide) setLast(guide); }, [guide]);
  useEffect(() => {
    if (!openState) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); onStart(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [openState, onStart]);
  const g = guide ?? last;
  /* the gallery: a step's picture opened large, the whole screen with the step's words beside it */
  const [shot, setShot] = useState<number | null>(null);
  useEffect(() => { if (!openState) setShot(null); }, [openState]);
  if (!g) return null;
  /* the panel is read, not walked: navigation steps stay out and every step shows its reading line */
  const steps = g.steps.filter((s) => s.anchor !== NO_ANCHOR && !s.nav);
  const shots = STEP_SHOTS[g.id] ?? [];

  const body = (
    <div className="flex flex-col">
      <SceneCover id={g.id} src={g.cover} size="md" className="aspect-[16/10] w-full" />
      <div className="px-[20px] pt-[16px] pb-[4px]">
        <p className="flex items-center gap-[6px] text-[12px] font-medium text-muted-foreground"><Icon icon={Clock01Icon} size={12} strokeWidth={2.2} />{g.seconds}s<span className="text-border">|</span>{steps.length} steps{done && <><span className="text-border">|</span><span className="text-primary">done</span></>}</p>
        <h3 className="mt-[4px] text-[19px] font-bold leading-[25px] tracking-[-0.3px] text-foreground">{g.title}</h3>
        <p className="mt-[6px] text-[13.5px] leading-[19px] text-foreground/80">{g.summary}</p>
      </div>
      {/* what the lesson teaches, as a list to read: one line per step, no tour voice */}
      <div className="px-[20px] pt-[14px] pb-[8px]">
        {/* each step with the real screen it happens on (tools/academy-shots.mjs), on a thin rail */}
        <ol className="relative flex flex-col gap-[20px] before:absolute before:bottom-[6px] before:left-[8.5px] before:top-[22px] before:w-px before:bg-border">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-[12px]">
              <span className="relative z-[1] mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-card text-[10.5px] font-bold tabular-nums text-primary ring-1 ring-primary/25">{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-[8px]">
                <span className="text-[13px] leading-[18px] text-foreground/80"><span className="font-semibold text-foreground">{s.title}.</span> {s.read ?? s.body}</span>
                {shots.includes(i) && (
                  <button type="button" onClick={() => setShot(i)} aria-label={`See the screen of step ${i + 1} large`} className={cn("group relative block w-full cursor-zoom-in overflow-hidden rounded-[10px] bg-muted ring-1 ring-border transition-shadow hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", phone && "mx-auto max-w-[300px]")}>
                    <img src={`/academy/steps/${g.id}-${i}${phone ? "-m" : ""}.webp`} alt="" loading="lazy" decoding="async" className={cn("w-full select-none object-cover", phone ? "aspect-[3/4]" : "aspect-[8/5]")} />
                    <span aria-hidden className="absolute right-[8px] top-[8px] flex size-7 items-center justify-center rounded-full bg-[#0A1630]/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"><Icon icon={Maximize01Icon} size={13} strokeWidth={2.2} /></span>
                  </button>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  /* on a phone the only button is the lesson itself: the close is the x on the cover, and a
     keyboard hint means nothing there */
  const footer = (
    <div className={cn("flex items-center gap-[10px] border-t border-border px-[20px] py-[12px]", phone && "pb-[calc(12px+env(safe-area-inset-bottom))]")}>
      <Button data-academy-panel-start="" onClick={onStart} className={cn("flex-1 gap-[8px] pl-[6px] text-[13px] font-semibold", phone ? "h-11 text-[14px]" : "h-9")}><Orb size={24} className="ring-white/30" />{done ? "Show me again" : "Show me on the real screens"}{!phone && <kbd className="ml-[2px] rounded-[4px] bg-white/20 px-[5px] text-[10.5px] font-semibold">Enter</kbd>}</Button>
      {!phone && <Button variant="pill-outline" onClick={onClose} className="h-9 gap-[6px] px-[14px] text-[13px] font-semibold">Close<kbd className="rounded-[4px] border border-border px-[5px] text-[10.5px] font-semibold text-muted-foreground">Esc</kbd></Button>}
    </div>
  );
  const closeX = <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[12px] top-[12px] z-10 flex size-8 items-center justify-center rounded-full bg-[#0A1630]/55 text-white transition-colors hover:bg-[#0A1630]/75 [@media(pointer:coarse)]:size-9"><Icon icon={Cancel01Icon} size={16} /></button>;

  const gallery = shot !== null && <StepGallery guide={g} steps={steps} shots={shots} index={shot} phone={phone} onIndex={setShot} onClose={() => setShot(null)} />;

  if (phone) {
    return (<>
      {gallery}
      <Drawer open={openState} onOpenChange={(o) => { if (!o) onClose(); }}>
        {/* the whole height of the phone: the cover at the top with the x, the steps scrolling
            under a fade, the one button pinned at the bottom. No handle, no border line. */}
        <DrawerContent data-academy-panel="" className="!mt-0 h-[calc(100dvh-20px)] !max-h-none overflow-hidden !rounded-t-[18px] !border-0 bg-card [&>div:first-child]:!hidden">
          <DrawerTitle className="sr-only">{g.title}</DrawerTitle>
          <DrawerDescription className="sr-only">{g.summary}</DrawerDescription>
          {closeX}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto pb-[16px]">{body}</div>
            <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[28px] bg-gradient-to-t from-card to-transparent" />
          </div>
          {footer}
        </DrawerContent>
      </Drawer>
    </>);
  }
  return (<>
    {gallery}
    <Sheet open={openState} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" data-academy-panel="" overlayClassName="bg-[#0A1630]/35" className="flex w-[420px] max-w-[92vw] flex-col gap-0 border-l p-0 shadow-[var(--elevation-md)] sm:max-w-[420px] [&>button]:hidden">
        <SheetTitle className="sr-only">{g.title}</SheetTitle>
        <SheetDescription className="sr-only">{g.summary}</SheetDescription>
        {closeX}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto pb-[16px]">{body}</div>
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[28px] bg-gradient-to-t from-card to-transparent" />
        </div>
        {footer}
      </SheetContent>
    </Sheet>
  </>);
}

/* ── the gallery: one step's whole screen, large, with its words beside it ──
   Opened from a picture in the lesson panel. Left and right (or the arrows)
   walk the steps that have a picture; Escape and the x close it. On a phone
   the picture sits on top and the words under it. The light stays on the
   control in the picture, so the words always point at something visible. */
function StepGallery({ guide, steps, shots, index, phone, onIndex, onClose }: { guide: Guide; steps: Guide["steps"]; shots: number[]; index: number; phone: boolean; onIndex: (i: number) => void; onClose: () => void }) {
  const at = shots.indexOf(index);
  const prev = at > 0 ? shots[at - 1] : null;
  const next = at >= 0 && at < shots.length - 1 ? shots[at + 1] : null;
  const step = steps[index];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev !== null) { e.preventDefault(); onIndex(prev); }
      if (e.key === "ArrowRight" && next !== null) { e.preventDefault(); onIndex(next); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [prev, next, onIndex]);
  if (!step) return null;
  const src = `/academy/steps/${guide.id}-${index}${phone ? "-m" : ""}-f.webp`;
  const words = (
    <div className="flex min-w-0 flex-col">
      <p className="text-[12px] font-medium text-muted-foreground">Step {at + 1} of {shots.length}<span className="mx-[6px] text-border">|</span>{guide.title}</p>
      <h3 className="mt-[6px] text-[17px] font-bold leading-[23px] tracking-[-0.2px] text-foreground">{step.title}</h3>
      <p className="mt-[8px] text-[13.5px] leading-[20px] text-foreground/80">{step.read ?? step.body}</p>
    </div>
  );
  const arrows = (
    <div className="flex items-center gap-[8px]">
      <Button variant="pill-outline" size="icon" aria-label="Previous step" disabled={prev === null} onClick={() => prev !== null && onIndex(prev)} className="size-9"><Icon icon={ArrowLeft01Icon} size={16} /></Button>
      <Button variant="pill-outline" size="icon" aria-label="Next step" disabled={next === null} onClick={() => next !== null && onIndex(next)} className="size-9"><Icon icon={ArrowRight01Icon} size={16} /></Button>
    </div>
  );
  if (phone) {
    return (
      <Drawer open onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent data-academy-gallery="" className="!mt-0 h-[calc(100dvh-20px)] !max-h-none overflow-hidden !rounded-t-[18px] !border-0 bg-card [&>div:first-child]:!hidden">
          <DrawerTitle className="sr-only">{step.title}</DrawerTitle>
          <DrawerDescription className="sr-only">{step.read ?? step.body}</DrawerDescription>
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[12px] top-[12px] z-10 flex size-9 items-center justify-center rounded-full bg-[#0A1630]/55 text-white"><Icon icon={Cancel01Icon} size={16} /></button>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 items-start justify-center bg-muted px-[16px] pt-[16px]">
              <img key={src} src={src} alt="" decoding="async" className="h-full max-h-full w-auto max-w-full select-none rounded-t-[14px] object-contain object-top ring-1 ring-border" />
            </div>
            <div className="shrink-0 px-[20px] pt-[16px] pb-[calc(14px+env(safe-area-inset-bottom))]">
              {words}
              <div className="mt-[14px] flex items-center justify-between">
                {arrows}
                <Button variant="pill-outline" onClick={onClose} className="h-9 px-[14px] text-[13px] font-semibold">Back to the lesson</Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent data-academy-gallery="" className="grid-cols-[minmax(0,1fr)_300px] gap-0 overflow-hidden p-0 sm:max-w-[min(1240px,94vw)]">
        <DialogTitle className="sr-only">{step.title}</DialogTitle>
        <DialogDescription className="sr-only">{step.read ?? step.body}</DialogDescription>
        <div className="flex items-center justify-center bg-muted p-[16px]">
          <img key={src} src={src} alt="" decoding="async" className="max-h-[calc(100vh-120px)] w-full select-none rounded-[10px] object-contain ring-1 ring-border" />
        </div>
        <div className="flex flex-col border-l border-border p-[22px] pt-[48px]">
          {words}
          <div className="mt-auto flex items-center justify-between pt-[20px]">
            {arrows}
            <span className="text-[12px] text-muted-foreground"><kbd className="rounded-[4px] border border-border px-[5px] text-[10.5px] font-semibold">Left</kbd> <kbd className="rounded-[4px] border border-border px-[5px] text-[10.5px] font-semibold">Right</kbd></span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
