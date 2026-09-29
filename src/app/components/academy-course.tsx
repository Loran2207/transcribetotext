import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clock01Icon, PlayIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { useIsPhone } from "./ui/use-mobile";
import { ScrollFade } from "./scroll-fade";
import { SceneCover } from "./academy-scene";
import { LessonPanel } from "./academy-page";
import { ACADEMY_SECTIONS, GUIDE_PERSON, NO_ANCHOR, type Guide } from "./onboarding/guides";
import { useOnboarding } from "./onboarding/onboarding-context";

/* Variant b of the Academy (branch academy-b, review 59): the same lessons,
   laid out as a course instead of a gallery. A white page header with the
   progress and the next lesson; on the left the syllabus by section, each
   lesson a row with its thumbnail and time; on the right the open lesson,
   large: its cover with the piece of interface, the steps, and Start tour.
   Nothing slides in on a wide screen; on a phone the list opens the lesson
   in the bottom sheet. */

export function AcademyCourse() {
  const ob = useOnboarding();
  const phone = useIsPhone();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const watched = useMemo(() => new Set([...ob.done, ...ob.seen]), [ob.done, ob.seen]);
  const next = ob.guides.find((g) => !ob.done.has(g.id));
  const [selId, setSelId] = useState<string>(() => (next ?? ob.guides[0]).id);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const sel = ob.guides.find((g) => g.id === selId) ?? ob.guides[0];
  const sheet = ob.guides.find((g) => g.id === sheetId) ?? null;
  const total = ob.guides.length;

  const pick = (g: Guide) => { ob.markSeen(g.id); if (phone) setSheetId(g.id); else setSelId(g.id); };
  const startTour = (g: Guide) => { setSheetId(null); ob.startGuide(g.id); };

  return (
    <div ref={scrollRef} data-tour="academy-page" className="flex-1 overflow-auto min-w-0">
      <ScrollFade scrollRef={scrollRef} />
      <div className="px-4 pt-[16px] pb-[40px] lg:px-[32px] lg:pt-[28px]">
        <header data-tour="academy-banner" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <h1 className="text-[20px] font-bold leading-[26px] tracking-[-0.3px] text-foreground lg:text-[28px] lg:leading-[34px] lg:tracking-[-0.56px]">Academy</h1>
            <p className="mt-[4px] text-[13.5px] leading-[19px] text-muted-foreground">Short guides, one per feature. Read one, or let {GUIDE_PERSON.name} show you on the real screens.</p>
          </div>
          <div className="flex items-center gap-4">
            <Progress watched={watched.size} total={total} />
            {next && (
              <Button data-tour="academy-continue" onClick={() => startTour(next)} className="h-9 max-w-full gap-[8px] px-[16px] text-[13px] font-semibold">
                <Icon icon={PlayIcon} size={12} strokeWidth={2.6} />
                <span className="min-w-0 max-w-[220px] truncate">{watched.size === 0 ? "Start" : "Continue"}: {next.title}</span>
              </Button>
            )}
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr]">
          <nav aria-label="Lessons" className="flex flex-col gap-5">
            {ACADEMY_SECTIONS.map((sec) => {
              const inSec = ob.guides.filter((g) => g.category === sec.id);
              if (!inSec.length) return null;
              return (
                <section key={sec.id}>
                  <div className="mb-[6px] flex items-baseline justify-between px-[4px]">
                    <h2 className="text-[13px] font-semibold text-foreground">{sec.title}</h2>
                    <span className="text-[12px] font-medium tabular-nums text-muted-foreground">{inSec.filter((g) => watched.has(g.id)).length} of {inSec.length}</span>
                  </div>
                  <ol className="flex flex-col gap-[2px]">
                    {inSec.map((g) => {
                      const done = ob.done.has(g.id);
                      const active = !phone && g.id === sel.id;
                      return (
                        <li key={g.id}>
                          <button type="button" data-academy-card={g.id} onClick={() => pick(g)} className={cn("group flex w-full items-center gap-[12px] rounded-[12px] p-[6px] pr-[10px] text-left transition-colors", active ? "bg-primary/[0.07] ring-1 ring-inset ring-primary/25" : "hover:bg-muted/70")}>
                            <span className="relative h-[44px] w-[66px] shrink-0 overflow-hidden rounded-[8px] bg-[#0A1630]">
                              <img src={g.cover} alt="" aria-hidden loading="lazy" className="h-full w-full select-none object-cover" />
                              {done && <span className="absolute inset-0 flex items-center justify-center bg-[#0A1630]/55"><Icon icon={Tick02Icon} size={16} strokeWidth={3} className="text-white" /></span>}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn("block truncate text-[13.5px] leading-[18px]", active ? "font-semibold text-foreground" : "font-medium text-foreground/85 group-hover:text-foreground")}>{g.title}</span>
                              <span className="flex items-center gap-[5px] text-[12px] leading-[16px] text-muted-foreground">
                                <Icon icon={Clock01Icon} size={11} strokeWidth={2.2} />{g.seconds}s
                                {done ? <span className="text-primary">· done</span> : ob.seen.has(g.id) ? <span>· read</span> : null}
                              </span>
                            </span>
                            {next?.id === g.id && !done && <span className="shrink-0 rounded-full bg-primary px-[7px] py-px text-[10px] font-bold uppercase tracking-[0.04em] text-primary-foreground">Next</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </nav>

          {!phone && (
            <div className="hidden lg:block">
              <div className="sticky top-0">
                <AnimatePresence mode="wait">
                  <motion.article key={sel.id} data-academy-panel="" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden rounded-[18px] border border-border bg-card">
                    <SceneCover id={sel.id} src={sel.cover} size="md" className="aspect-[16/9] w-full xl:aspect-[16/8]" />
                    <LessonBody guide={sel} done={ob.done.has(sel.id)} onStart={() => startTour(sel)} />
                  </motion.article>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
      {phone && <LessonPanel guide={sheet} done={sheet ? ob.done.has(sheet.id) : false} onClose={() => setSheetId(null)} onStart={() => sheet && startTour(sheet)} />}
    </div>
  );
}

function Progress({ watched, total }: { watched: number; total: number }) {
  const r = 15, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-[10px]">
      <svg width="38" height="38" viewBox="0 0 38 38" className="-rotate-90" aria-hidden>
        <circle cx="19" cy="19" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        <circle cx="19" cy="19" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - watched / Math.max(1, total))} className="text-primary transition-[stroke-dashoffset] duration-500" />
      </svg>
      <span className="text-[13px] leading-[17px] text-muted-foreground"><span className="block text-[15px] font-bold tabular-nums text-foreground">{watched} watched</span>of {total}</span>
    </div>
  );
}

function LessonBody({ guide, done, onStart }: { guide: Guide; done: boolean; onStart: () => void }) {
  const steps = guide.steps.filter((s) => s.anchor !== NO_ANCHOR);
  return (
    <div className="grid gap-6 p-[24px] xl:grid-cols-[1fr_minmax(260px,320px)]">
      <div>
        <p className="flex items-center gap-[6px] text-[12.5px] font-medium text-muted-foreground"><Icon icon={Clock01Icon} size={12} strokeWidth={2.2} />{guide.seconds}s{done && <span className="text-primary">· done</span>}</p>
        <h3 className="mt-[4px] text-[22px] font-bold leading-[28px] tracking-[-0.4px] text-foreground">{guide.title}</h3>
        <p className="mt-[6px] text-[14px] leading-[20px] text-foreground/80">{guide.summary}</p>
        <div className="mt-5 flex items-center gap-[12px] rounded-[12px] bg-muted/60 px-[12px] py-[10px]">
          <img src={GUIDE_PERSON.avatar} alt="" aria-hidden className="size-[32px] shrink-0 rounded-full bg-primary/10 object-cover object-top" />
          <p className="min-w-0 flex-1 text-[13px] leading-[18px] text-foreground/80"><span className="font-semibold text-foreground">{GUIDE_PERSON.name}</span>: "I'll show you on the real screens."</p>
        </div>
        <Button data-academy-panel-start="" onClick={onStart} className="mt-4 h-10 gap-[8px] px-[20px] text-[13.5px] font-semibold"><Icon icon={PlayIcon} size={12} strokeWidth={2.6} />{done ? "Take the tour again" : "Start tour"}</Button>
      </div>
      <ol className="flex flex-col">
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-[12px] py-[7px]">
            {i < steps.length - 1 && <span aria-hidden className="absolute left-[10px] top-[29px] h-[calc(100%-18px)] w-[2px] bg-border" />}
            <span className="relative z-[1] flex size-[20px] shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-[10.5px] font-bold tabular-nums text-muted-foreground">{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-[18px] text-foreground">{s.title}</span>
              <span className="block text-[12.5px] leading-[17px] text-muted-foreground">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
