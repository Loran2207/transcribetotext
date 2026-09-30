import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { STEP_TOURS } from "./guides";
import { GUIDES, INTRO_STEP, SETUP, SETUP_ACTION_IDS, SETUP_REQUIRED, setupComplete, setupIds, type Guide, type TourTarget } from "./guides";

/* State of the guide: the Academy (ten lessons, competence) and Account Setup
   (the first steps, real actions that makes the account useful). Two different
   motivations, kept apart on purpose (Artem + Kirill, 29.09): the Academy is
   read or toured, Account Setup is done, and the gift rewards the setup.

   Storage: one key, `ttt_onboarding_v1`:
   - done: lessons finished by a tour
   - seen: lessons read in the Academy panel (count as watched)
   - actions: real actions performed (setup items; a matching lesson is ticked too)
   Real actions arrive as `window.dispatchEvent(new CustomEvent("ttt-onboarding",
   { detail: "<id>" }))` from the component that did the thing.

   Demo flags (capture and QA):
   - `ttt_demo_onboarding=fresh`  nothing done
   - `ttt_demo_onboarding=half`   three lessons done, two setup actions done
   - `ttt_demo_onboarding=five`   all lessons but the last, all setup but the last
   - `ttt_demo_onboarding=done`   everything done, reward shown
   - `ttt_demo_onboarding=off`    widget hidden */

const KEY = "ttt_onboarding_v1";
const EVENT = "ttt-onboarding";

type Stored = { done: string[]; seen: string[]; actions: string[]; hidden: boolean; rewardClaimed: boolean; expanded: boolean; introSeen: boolean; helper: boolean; nav: boolean };
const EMPTY: Stored = { done: [], seen: [], actions: [], hidden: false, rewardClaimed: false, expanded: true, introSeen: false, helper: true, nav: true };

function load(): Stored {
  if (typeof window === "undefined") return EMPTY;
  const demo = window.localStorage.getItem("ttt_demo_onboarding");
  const gid = (n: number) => GUIDES.slice(0, n).map((g) => g.id);
  const sid = (n: number) => SETUP_REQUIRED.slice(0, n).flatMap(setupIds);
  if (demo === "fresh") return { ...EMPTY };
  if (demo === "half") return { ...EMPTY, introSeen: true, done: gid(3), seen: gid(4), actions: sid(2) };
  if (demo === "five") return { ...EMPTY, introSeen: true, done: gid(GUIDES.length - 1), seen: gid(GUIDES.length - 1), actions: sid(SETUP_REQUIRED.length - 1) };
  if (demo === "done") return { ...EMPTY, introSeen: true, done: gid(GUIDES.length), seen: gid(GUIDES.length), actions: sid(SETUP_REQUIRED.length) };
  if (demo === "off") return { ...EMPTY, hidden: true };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
    return { ...EMPTY, ...parsed, done: arr(parsed.done), seen: arr(parsed.seen), actions: arr(parsed.actions) };
  } catch {
    return EMPTY;
  }
}

function save(s: Stored) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

export type Tour = { guide: Guide; step: number };
/* what to celebrate right after something finishes: one lesson, the whole Academy, or the setup (the gift) */
export type Celebration = { kind: "guide"; guide: Guide; index: number } | { kind: "academy" } | "all" | null;

type Ctx = {
  guides: Guide[];
  setup: typeof SETUP;
  done: Set<string>;
  seen: Set<string>;
  actions: Set<string>;
  /* the gift: every setup action done */
  allDone: boolean;
  academyDone: boolean;
  hidden: boolean;
  rewardClaimed: boolean;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  /* variant b display preferences: the helper on every page, the row in the sidebar */
  showHelper: boolean;
  setShowHelper: (v: boolean) => void;
  showNav: boolean;
  setShowNav: (v: boolean) => void;
  hide: () => void;
  reset: () => void;
  markDone: (id: string) => void;
  markSeen: (id: string) => void;
  claimReward: () => void;
  tour: Tour | null;
  celebration: Celebration;
  dismissCelebration: () => void;
  startGuide: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  navigate: (t: TourTarget) => void;
  registerNavigator: (fn: (t: TourTarget) => void) => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored>(load);
  const [tour, setTour] = useState<Tour | null>(null);
  const [celebration, setCelebration] = useState<Celebration>(null);
  const navigator = useRef<((t: TourTarget) => void) | null>(null);

  useEffect(() => { save(stored); }, [stored]);

  const markDone = useCallback((id: string) => {
    setStored((s) => (s.done.includes(id) ? s : { ...s, done: [...s.done, id] }));
  }, []);
  const markSeen = useCallback((id: string) => {
    setStored((s) => (s.seen.includes(id) ? s : { ...s, seen: [...s.seen, id] }));
  }, []);

  /* real actions count: a setup item is done, and the lesson with the same id is ticked */
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const setupItem = SETUP_ACTION_IDS.includes(id);
      const guide = GUIDES.find((g) => g.id === id);
      if (setupItem) setTour((t) => (t && t.guide.forStep === id ? null : t));
      if (!setupItem && !guide) return;
      setStored((s) => {
        const actions = setupItem && !s.actions.includes(id) ? [...s.actions, id] : s.actions;
        const done = guide && !s.done.includes(id) ? [...s.done, id] : s.done;
        if (actions === s.actions && done === s.done) return s;
        const nowComplete = setupComplete((x) => actions.includes(x));
        const wasComplete = setupComplete((x) => s.actions.includes(x));
        if (nowComplete && !wasComplete) setCelebration("all");
        else if (guide && done !== s.done) setCelebration({ kind: "guide", guide, index: GUIDES.findIndex((g) => g.id === id) });
        return { ...s, actions, done };
      });
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  const go = useCallback((t: TourTarget) => { navigator.current?.(t); }, []);

  const startGuide = useCallback((id: string) => {
    const base = GUIDES.find((g) => g.id === id) ?? STEP_TOURS.find((g) => g.id === id); if (!base) return;
    /* she says hello on the first lesson started, and again on any later start as long as
       nothing is finished yet (the person closed the tour and came back) */
    const hello = !base.forStep && (!stored.introSeen || stored.done.length === 0);
    const guide: Guide = hello ? { ...base, steps: [INTRO_STEP, ...base.steps] } : base;
    setStored((s) => ({ ...s, expanded: false, introSeen: true }));
    go(guide.steps[0].go);
    setTour({ guide, step: 0 });
  }, [go, stored.introSeen, stored.done.length]);

  const endTour = useCallback(() => setTour(null), []);

  const finishGuide = useCallback((guide: Guide) => {
    setStored((s) => {
      if (s.done.includes(guide.id)) return s;
      const done = [...s.done, guide.id];
      const all = GUIDES.every((g) => done.includes(g.id));
      setCelebration(all ? { kind: "academy" } : { kind: "guide", guide, index: GUIDES.findIndex((g) => g.id === guide.id) });
      return { ...s, done };
    });
  }, []);

  const nextStep = useCallback(() => {
    setTour((t) => {
      if (!t) return t;
      const last = t.step >= t.guide.steps.length - 1;
      if (last) { if (t.guide.completeBy !== "action" && !t.guide.forStep) finishGuide(t.guide); return null; }
      const next = t.guide.steps[t.step + 1];
      go(next.go);
      return { guide: t.guide, step: t.step + 1 };
    });
  }, [go, finishGuide]);

  const prevStep = useCallback(() => {
    setTour((t) => {
      if (!t || t.step === 0) return t;
      const prev = t.guide.steps[t.step - 1];
      go(prev.go);
      return { guide: t.guide, step: t.step - 1 };
    });
  }, [go]);

  const value = useMemo<Ctx>(() => {
    const done = new Set(stored.done);
    const seen = new Set(stored.seen);
    const actions = new Set(stored.actions);
    return {
      guides: GUIDES,
      setup: SETUP,
      done,
      seen,
      actions,
      allDone: setupComplete((x) => actions.has(x)),
      academyDone: GUIDES.every((g) => done.has(g.id)),
      hidden: stored.hidden,
      rewardClaimed: stored.rewardClaimed,
      expanded: stored.expanded,
      setExpanded: (v) => setStored((s) => ({ ...s, expanded: v })),
      showHelper: stored.helper !== false,
      setShowHelper: (v) => setStored((s) => ({ ...s, helper: v })),
      showNav: stored.nav !== false,
      setShowNav: (v) => setStored((s) => ({ ...s, nav: v })),
      hide: () => setStored((s) => ({ ...s, hidden: true })),
      reset: () => { setTour(null); setCelebration(null); setStored({ ...EMPTY }); },
      markDone,
      markSeen,
      claimReward: () => setStored((s) => ({ ...s, rewardClaimed: true, hidden: true })),
      tour,
      celebration,
      dismissCelebration: () => setCelebration(null),
      startGuide,
      nextStep,
      prevStep,
      endTour,
      navigate: go,
      registerNavigator: (fn) => { navigator.current = fn; },
    };
  }, [stored, tour, celebration, markDone, markSeen, startGuide, nextStep, prevStep, endTour, go]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding outside OnboardingProvider");
  return ctx;
}

/* For components that want to give credit for a real action without pulling
   the whole context: fire and forget. */
export function creditOnboarding(id: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}
