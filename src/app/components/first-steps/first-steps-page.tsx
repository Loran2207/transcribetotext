import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft01Icon, ArrowRight01Icon, PlayIcon, Settings02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollFade } from "../scroll-fade";
import { SceneCover } from "../academy-scene";
import { useTranscriptionModals } from "../transcription-modals";
import { useOnboarding } from "../onboarding/onboarding-context";
import { SETUP_GROUPS, SETUP_REQUIRED, isSetupDone, type SetupItem } from "../onboarding/guides";

/* First steps as a page (variant b, review 60, Kirill 29.09): the same steps
   as the Home card of variant a, given room. A dark photographic head with one
   big progress ring and the gift; below it, the steps on a rail on the left and
   the open step large on the right, with its photograph, its piece of
   interface, the one action that does it, a lesson that shows how, and Back /
   Next to walk the list in order. "Customize" holds the two switches: the
   helper on every page and the row in the sidebar (Vektor's display
   preferences, in our language). */

const GIFT = "/images/onboarding-gift.png";
const HERO = "/images/first-steps/hero.jpg";

export function ProgressRing({ done, total, size, stroke, light = false }: { done: number; total: number; size: number; stroke: number; light?: boolean }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={light ? "text-white/15" : "text-border"} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - done / Math.max(1, total))} className={cn("transition-[stroke-dashoffset] duration-700 ease-out", light ? "text-white" : "text-primary")} />
    </svg>
  );
}

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
  const reduce = useReducedMotion();
  const run = useRunStep();
  const scrollRef = useRef<HTMLDivElement>(null);
  const has = (id: string) => ob.actions.has(id);
  const total = SETUP_REQUIRED.length;
  const doneCount = SETUP_REQUIRED.filter((x) => isSetupDone(x, has)).length;
  const firstOpen = useMemo(() => ob.setup.find((x) => !isSetupDone(x, has)) ?? ob.setup[0], [ob.actions]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selId, setSelId] = useState(firstOpen.id);
  const sel = ob.setup.find((x) => x.id === selId) ?? ob.setup[0];
  const index = ob.setup.findIndex((x) => x.id === sel.id);
  const selDone = isSetupDone(sel, has);
  const group = SETUP_GROUPS.find((g) => g.id === sel.group);

  /* when the open step gets done, move on to the next open one */
  const wasDone = useRef(selDone);
  useEffect(() => {
    if (selDone && !wasDone.current) {
      const next = ob.setup.slice(index + 1).find((x) => !isSetupDone(x, has));
      if (next) window.setTimeout(() => setSelId(next.id), 900);
    }
    wasDone.current = selDone;
  }, [selDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (d: number) => { const n = ob.setup[index + d]; if (n) setSelId(n.id); };

  let n = 0;
  return (
    <div ref={scrollRef} data-tour="page-first-steps" className="flex-1 overflow-auto min-w-0">
      <ScrollFade scrollRef={scrollRef} />
      <div className="@container px-4 pt-[16px] pb-[104px] lg:px-[32px] lg:pt-[24px]">
        {/* the head: one photograph, one ring, the gift */}
        <header className="relative overflow-hidden rounded-[18px] bg-[#0A1630]" style={{ boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}>
          <img src={HERO} alt="" aria-hidden className="absolute inset-0 h-full w-full select-none object-cover object-[85%_50%] @[640px]:object-[60%_50%]" />
          <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(10,22,48,0.85) 0%, rgba(10,22,48,0.55) 45%, rgba(10,22,48,0.1) 100%)" }} />
          <div className="relative flex flex-col gap-6 px-[24px] py-[24px] @[640px]:flex-row @[640px]:items-center @[640px]:justify-between lg:px-[32px] lg:py-[30px]">
            <div className="flex flex-col items-start gap-[16px] @[520px]:flex-row @[520px]:items-center @[520px]:gap-[20px]">
              <div className="relative shrink-0">
                <span className="@[520px]:hidden"><ProgressRing done={doneCount} total={total} size={68} stroke={6} light /></span>
                <span className="hidden @[520px]:block"><ProgressRing done={doneCount} total={total} size={96} stroke={8} light /></span>
                <span className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-[20px] font-bold leading-none tabular-nums tracking-[-0.5px] @[520px]:text-[26px]">{doneCount}</span>
                  <span className="mt-[3px] text-[10px] font-semibold text-white/65 @[520px]:text-[11px]">of {total}</span>
                </span>
              </div>
              <div>
                <h1 className="text-[24px] font-bold leading-[30px] tracking-[-0.5px] text-white lg:text-[28px] lg:leading-[34px]">First steps</h1>
                <p className="mt-[4px] max-w-[380px] text-[14px] leading-[20px] text-white/75">Try every way in once, then make the account yours. Each step is done by doing it.</p>
                <p className="mt-[10px] inline-flex items-center gap-[7px] rounded-full bg-white/10 py-[5px] pl-[6px] pr-[12px] text-[12.5px] font-semibold text-white ring-1 ring-inset ring-white/20">
                  <img src={GIFT} alt="" aria-hidden className="size-[18px] select-none object-contain" />
                  {ob.allDone ? "Your free month is unlocked" : "1 month free when they are done"}
                </p>
              </div>
            </div>
            <div className="shrink-0 self-start @[640px]:self-center"><DisplayPrefs dark /></div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
          {/* the rail */}
          <nav aria-label="Steps" className="order-2 flex flex-col gap-4 lg:order-1">
            {SETUP_GROUPS.map((grp) => (
              <section key={grp.id}>
                <h2 className="mb-[4px] px-[6px] text-[12.5px] font-semibold text-muted-foreground">{grp.title}</h2>
                <ol className="flex flex-col">
                  {ob.setup.filter((x) => x.group === grp.id).map((x, i, arr) => {
                    n += 1;
                    const done = isSetupDone(x, has);
                    const active = x.id === sel.id;
                    return (
                      <li key={x.id} className="relative">
                        {i < arr.length - 1 && <span aria-hidden className={cn("absolute left-[21px] top-[34px] z-[1] h-[calc(100%-22px)] w-[2px]", done ? "bg-primary" : "bg-border")} />}
                        <button type="button" data-first-step={x.id} onClick={() => { setSelId(x.id); scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }} className={cn("group relative flex w-full items-center gap-[12px] rounded-[12px] px-[10px] py-[9px] text-left transition-colors", active ? "bg-primary/[0.07] ring-1 ring-inset ring-primary/25" : "hover:bg-muted/70")}>
                          <span className={cn("relative z-[2] flex size-[24px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors", done ? "bg-primary text-primary-foreground" : active ? "border-2 border-primary bg-card text-primary" : "border-2 border-border bg-card text-muted-foreground")}>
                            {done ? <Icon icon={Tick02Icon} size={12} strokeWidth={3} /> : n}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-[13.5px] leading-[18px]", done ? "text-muted-foreground" : active ? "font-semibold text-foreground" : "font-medium text-foreground/85")}>{x.title}</span>
                          </span>
                          {x.optional && !done && <span className="shrink-0 text-[11.5px] font-medium text-muted-foreground">Optional</span>}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </nav>

          {/* the open step */}
          <div className="order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.article key={sel.id} data-first-steps-step={sel.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden rounded-[18px] border border-border bg-card">
                <SceneCover id={sel.id} widget={sel.widget} src={sel.cover} size="md" className="aspect-[16/9] w-full xl:aspect-[16/8]" />
                <div className="p-[22px] lg:p-[26px]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12.5px] font-semibold text-muted-foreground">Step {index + 1} of {ob.setup.length}<span className="text-border"> · </span>{group?.title}{sel.optional && <span> · Optional</span>}</p>
                    <span className="flex shrink-0 items-center gap-[4px]">
                      <Button variant="ghost" size="icon" aria-label="Previous step" disabled={index === 0} onClick={() => go(-1)} className="size-8"><Icon icon={ArrowLeft01Icon} size={16} /></Button>
                      <Button variant="pill-outline" data-first-steps-next="" disabled={index === ob.setup.length - 1} onClick={() => go(1)} className="h-8 gap-[4px] px-[12px] text-[12.5px] font-semibold">Next<Icon icon={ArrowRight01Icon} size={14} /></Button>
                    </span>
                  </div>
                  <h2 className="mt-[6px] text-[22px] font-bold leading-[28px] tracking-[-0.4px] text-foreground">{sel.title}</h2>
                  <p className="mt-[6px] max-w-[520px] text-[14.5px] leading-[21px] text-foreground/80">{sel.why}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-[10px]">
                    {selDone ? (
                      <span className="flex h-10 items-center gap-[7px] rounded-full bg-primary/10 px-[16px] text-[13.5px] font-semibold text-primary"><Icon icon={Tick02Icon} size={14} strokeWidth={3} />Done</span>
                    ) : (
                      <Button data-first-steps-do="" onClick={() => run(sel)} className="h-10 gap-[8px] px-[20px] text-[13.5px] font-semibold">{sel.action}</Button>
                    )}
                    {sel.how && sel.run !== "calendar" && (
                      <Button variant="pill-outline" onClick={() => ob.startGuide(sel.how)} className="h-10 gap-[7px] px-[16px] text-[13.5px] font-semibold"><Icon icon={PlayIcon} size={11} strokeWidth={2.6} />Show me how</Button>
                    )}
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
