import { useMemo, useRef, useState } from "react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { useIsPhone } from "./ui/use-mobile";
import { ScrollFade } from "./scroll-fade";
import { ACADEMY_SECTIONS, GUIDE_PERSON, NO_ANCHOR, SETUP_REQUIRED, isSetupDone, type Guide } from "./onboarding/guides";
import { useOnboarding } from "./onboarding/onboarding-context";
import { DetailCard, DetailSheet, GuideGlyph, HeadChip, HeadGo, LearnHead, LearnLayout, ListRow, ListSection, PAGE, type DetailProps } from "./learn/learn-frame";

/* Variant b of the Academy (branch academy-b): the lessons as a course. Built
   from the same frame as the First steps page (learn/learn-frame.tsx), so the
   two pages line up exactly (review 62). Guide me is the main action. */

function StepsList({ guide }: { guide: Guide }) {
  const steps = guide.steps.filter((s) => s.anchor !== NO_ANCHOR);
  return (
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
  );
}

export function AcademyCourse() {
  const ob = useOnboarding();
  const phone = useIsPhone();
  const scrollRef = useRef<HTMLDivElement>(null);
  const watched = useMemo(() => new Set([...ob.done, ...ob.seen]), [ob.done, ob.seen]);
  const next = ob.guides.find((g) => !ob.done.has(g.id));
  const [selId, setSelId] = useState<string>(() => (next ?? ob.guides[0]).id);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const total = ob.guides.length;
  const stepsHas = (id: string) => ob.actions.has(id);
  const stepsDone = SETUP_REQUIRED.filter((x) => isSetupDone(x, stepsHas)).length;
  const stepsTotal = SETUP_REQUIRED.length;

  const pick = (g: Guide) => { ob.markSeen(g.id); if (phone) setSheetId(g.id); else setSelId(g.id); };
  const startTour = (g: Guide) => { setSheetId(null); ob.startGuide(g.id); };

  const detail = (g: Guide): DetailProps => {
    const i = ob.guides.findIndex((x) => x.id === g.id);
    const done = ob.done.has(g.id);
    return {
      attr: { "data-academy-panel": "" },
      coverId: g.id,
      cover: g.cover,
      meta: <>Lesson {i + 1} of {total}<span className="text-border"> · </span>{g.seconds}s{done && <span className="text-primary"> · done</span>}</>,
      onPrev: i > 0 ? () => pick(ob.guides[i - 1]) : undefined,
      onNext: i < total - 1 ? () => pick(ob.guides[i + 1]) : undefined,
      title: g.title,
      text: g.summary,
      actions: <Button data-academy-panel-start="" onClick={() => startTour(g)} className="h-10 gap-[8px] px-[20px] text-[13.5px] font-semibold"><GuideGlyph />{done ? "Guide me again" : "Guide me"}</Button>,
      mia: "I'll take you through it on the real screens.",
      aside: <StepsList guide={g} />,
    };
  };
  const sel = ob.guides.find((g) => g.id === selId) ?? ob.guides[0];
  const sheet = ob.guides.find((g) => g.id === sheetId) ?? null;

  return (
    <div ref={scrollRef} data-tour="academy-page" className="flex-1 overflow-auto min-w-0">
      <ScrollFade scrollRef={scrollRef} />
      <div className={PAGE}>
        <LearnHead tour="academy-banner" photo="/images/academy3/banner.jpg" done={watched.size} total={total} title="Academy"
          subtitle={`Short guides, one per feature. Pick one and ${GUIDE_PERSON.name} guides you through it on the real screens.`}
          actions={<>
            {!ob.allDone && <HeadChip attr={{ "data-academy-first-steps": "" }} onClick={() => ob.navigate({ page: "first-steps" })} done={stepsDone} total={stepsTotal} label="First steps" />}
            {next && <HeadGo attr={{ "data-tour": "academy-continue" }} onClick={() => startTour(next)}>Guide me: {next.title}</HeadGo>}
          </>} />
        <LearnLayout
          list={ACADEMY_SECTIONS.map((sec) => {
            const inSec = ob.guides.filter((g) => g.category === sec.id);
            if (!inSec.length) return null;
            return (
              <ListSection key={sec.id} title={sec.title} count={`${inSec.filter((g) => watched.has(g.id)).length} of ${inSec.length}`}>
                {inSec.map((g) => {
                  const done = ob.done.has(g.id);
                  return (
                    <ListRow key={g.id} attr={{ "data-academy-card": g.id }} thumb={g.cover} title={g.title} done={done} active={!phone && g.id === sel.id} next={next?.id === g.id} onClick={() => pick(g)}
                      meta={<><Icon icon={Clock01Icon} size={11} strokeWidth={2.2} />{g.seconds}s{done ? <span className="text-primary">· done</span> : ob.seen.has(g.id) ? <span>· read</span> : null}</>} />
                  );
                })}
              </ListSection>
            );
          })}
          detail={!phone && <DetailCard {...detail(sel)} />}
        />
      </div>
      {phone && <DetailSheet open={!!sheet} onClose={() => setSheetId(null)} props={sheet ? detail(sheet) : null} />}
    </div>
  );
}
