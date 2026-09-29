import { useEffect, useMemo, useRef, useState } from "react";
import { Cancel01Icon, Clock01Icon, PlayIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";
import { useIsPhone } from "./ui/use-mobile";
import { ScrollFade } from "./scroll-fade";
import { ACADEMY_SECTIONS, GUIDE_PERSON, NO_ANCHOR, type Guide } from "./onboarding/guides";
import { useOnboarding } from "./onboarding/onboarding-context";

/* The Academy: every feature as a short lesson you can read or be walked
   through. Separate from Account Setup: setup is done once, the Academy is
   competence.

   Review 55 (Kirill, 29.09): the covers are generated product renders, glass
   interface panels floating in a cobalt night, one per lesson; the card shows
   the cover clean, with only a translucent time chip; no lesson numbers. The
   banner is taller and uses the same render language. The lesson panel keeps
   the page dim; Enter starts the tour, Escape closes. Every tour now opens on
   the whole page before a control lights. */

const NAVY = "#0A1630";

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
      <div className="px-4 pt-[16px] pb-[40px] lg:px-[32px] lg:pt-[24px]">
        <Banner watched={watched.size} total={total} next={next} onContinue={() => next && startTour(next)} />

        {ACADEMY_SECTIONS.map((sec) => {
          const inSec = ob.guides.filter((g) => g.category === sec.id);
          const doneIn = inSec.filter((g) => watched.has(g.id)).length;
          return (
            <section key={sec.id} className="mt-9">
              <div className="mb-[12px] flex items-baseline justify-between gap-4">
                <h2 className="text-[16px] font-semibold leading-[22px] tracking-[-0.2px] text-foreground">{sec.title}<span className="ml-[8px] text-[13px] font-normal text-muted-foreground">{sec.subtitle}</span></h2>
                <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-muted-foreground">{doneIn} of {inSec.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
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

/* ── the banner: the next lesson's render as the backdrop, the numbers on the left ── */
function Banner({ watched, total, next, onContinue }: { watched: number; total: number; next: Guide | undefined; onContinue: () => void }) {
  const ob = useOnboarding();
  const backdrop = (next ?? ob.guides[ob.guides.length - 1]).cover;
  return (
    <div data-tour="academy-banner" className="relative overflow-hidden rounded-[18px]" style={{ background: NAVY, boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}>
      <img src={backdrop} alt="" aria-hidden className="absolute inset-y-0 right-0 h-full w-[68%] select-none object-cover" style={{ objectPosition: "60% 50%" }} />
      <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0A1630 0%, #0A1630 38%, rgba(10,22,48,0.85) 55%, rgba(10,22,48,0.15) 100%)" }} />
      <div className="relative flex min-h-[176px] flex-col justify-between gap-6 px-[24px] py-[22px] lg:min-h-[196px] lg:px-[28px] lg:py-[26px]">
        <div>
          <h1 className="text-[24px] font-bold leading-[30px] tracking-[-0.5px] text-white lg:text-[26px] lg:leading-[32px]">Academy</h1>
          <p className="mt-[4px] max-w-[440px] text-[13.5px] leading-[19px] text-white/70">{total} short guides, one per feature. Read one in a minute or let {GUIDE_PERSON.name} walk you through it on the real screens.</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <div className="flex items-baseline gap-[8px] text-white">
              <span className="text-[30px] font-bold leading-none tracking-[-0.7px] tabular-nums">{watched}</span>
              <span className="text-[13.5px] font-medium text-white/70">of {total} watched</span>
            </div>
            <div className="mt-[10px] flex w-[260px] max-w-full gap-[4px]" aria-hidden>
              {ob.guides.map((g) => {
                const state = ob.done.has(g.id) ? "done" : ob.seen.has(g.id) ? "seen" : "none";
                return <span key={g.id} className={cn("h-[5px] flex-1 rounded-full transition-colors", state === "done" ? "bg-white" : state === "seen" ? "bg-white/55" : "bg-white/20")} />;
              })}
            </div>
          </div>
          {next ? (
            <button type="button" data-tour="academy-continue" onClick={onContinue} className="flex h-[38px] shrink-0 items-center gap-[8px] rounded-full bg-white pl-[16px] pr-[12px] text-[13.5px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]">
              <Icon icon={PlayIcon} size={13} strokeWidth={2.6} />
              <span className="max-w-[260px] truncate">{watched === 0 ? "Start" : "Continue"}: {next.title}</span>
              <span className="text-[12px] font-medium tabular-nums text-[#0A1630]/55">{next.seconds}s</span>
            </button>
          ) : (
            <span className="flex h-[38px] items-center gap-[6px] rounded-full border border-white/30 px-[14px] text-[13.5px] font-semibold text-white"><Icon icon={Tick02Icon} size={13} strokeWidth={3} />All done</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── a lesson card: the render, clean; one translucent chip; title and one line ── */
function LessonCard({ guide, done, seen, isNext, onOpen, onStart }: { guide: Guide; done: boolean; seen: boolean; isNext: boolean; onOpen: () => void; onStart: () => void }) {
  return (
    <div data-academy-card={guide.id} className={cn("group relative flex flex-col overflow-hidden rounded-[14px] border bg-card transition-[box-shadow,border-color] hover:shadow-[var(--elevation-md)]", isNext ? "border-primary/40" : "border-border")}>
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[3/2] w-full overflow-hidden" style={{ background: NAVY }}>
          <img src={guide.cover} alt="" className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
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
  if (!g) return null;
  const steps = g.steps.filter((s) => s.anchor !== NO_ANCHOR);

  const body = (
    <div className="flex flex-col">
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: NAVY }}>
        <img src={g.cover} alt="" className="h-full w-full select-none object-cover" />
      </div>
      <div className="px-[20px] pt-[16px] pb-[6px]">
        <p className="flex items-center gap-[6px] text-[12px] font-medium text-muted-foreground"><Icon icon={Clock01Icon} size={12} strokeWidth={2.2} />{g.seconds}s{done && <span className="text-primary">· done</span>}</p>
        <h3 className="mt-[4px] text-[19px] font-bold leading-[25px] tracking-[-0.3px] text-foreground">{g.title}</h3>
        <p className="mt-[6px] text-[13.5px] leading-[19px] text-foreground/80">{g.summary}</p>
      </div>
      <div className="px-[20px] pt-[10px]">
        <ol className="flex flex-col">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-[12px] py-[8px]">
              {i < steps.length - 1 && <span aria-hidden className="absolute left-[10px] top-[30px] h-[calc(100%-20px)] w-[2px] bg-border" />}
              <span className="relative z-[1] flex size-[20px] shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-[10.5px] font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold leading-[18px] text-foreground">{s.title}</span>
                <span className="block text-[13px] leading-[18px] text-muted-foreground">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-[10px] mb-[8px] flex items-center gap-[10px] rounded-[10px] bg-muted/60 px-[12px] py-[9px]">
          <img src={GUIDE_PERSON.avatar} alt="" aria-hidden className="size-[28px] shrink-0 rounded-full bg-primary/10 object-cover object-top" />
          <p className="text-[12.5px] leading-[17px] text-foreground/80"><span className="font-semibold text-foreground">{GUIDE_PERSON.name}</span>: "Or press Enter and I'll show you on the real screens."</p>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center gap-[10px] border-t border-border px-[20px] py-[12px]">
      <Button data-academy-panel-start="" onClick={onStart} className="h-9 flex-1 gap-[8px] text-[13px] font-semibold"><Icon icon={PlayIcon} size={12} strokeWidth={2.6} />{done ? "Take the tour again" : "Start tour"}<kbd className="ml-[2px] rounded-[4px] bg-white/20 px-[5px] text-[10.5px] font-semibold">Enter</kbd></Button>
      <Button variant="pill-outline" onClick={onClose} className="h-9 gap-[6px] px-[14px] text-[13px] font-semibold">Close<kbd className="rounded-[4px] border border-border px-[5px] text-[10.5px] font-semibold text-muted-foreground">Esc</kbd></Button>
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
      <SheetContent side="right" data-academy-panel="" overlayClassName="bg-[#0A1630]/35" className="flex w-[420px] max-w-[92vw] flex-col gap-0 border-l p-0 shadow-[var(--elevation-md)] sm:max-w-[420px] [&>button]:hidden">
        <SheetTitle className="sr-only">{g.title}</SheetTitle>
        <SheetDescription className="sr-only">{g.summary}</SheetDescription>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-[12px] top-[12px] z-10 flex size-8 items-center justify-center rounded-full bg-[#0A1630]/55 text-white transition-colors hover:bg-[#0A1630]/75"><Icon icon={Cancel01Icon} size={16} /></button>
        <div className="flex-1 overflow-y-auto">{body}</div>
        {footer}
      </SheetContent>
    </Sheet>
  );
}
