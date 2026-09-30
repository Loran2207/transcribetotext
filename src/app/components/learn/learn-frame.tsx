import type React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../ui/drawer";
import { SceneCover } from "../academy-scene";
import { GUIDE_PERSON } from "../onboarding/guides";

/* One frame for the two learning pages of variant b, First steps and the
   Academy (review 62, Kirill 30.09: "it jumps when I switch between them").
   Both are built from these pieces, so the head, the list, the rows and the
   open item have the same sizes, type and places; progress lives in one
   place, the ring in the head. */

export function ProgressRing({ done, total, size, stroke, light = false }: { done: number; total: number; size: number; stroke: number; light?: boolean }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={light ? "text-white/15" : "text-border"} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - done / Math.max(1, total))} className={cn("transition-[stroke-dashoffset] duration-700 ease-out", light ? "text-white" : "text-primary")} />
    </svg>
  );
}

export const PAGE = "@container px-4 pt-[16px] pb-[104px] lg:px-[32px] lg:pt-[24px]";

/* the head: one photograph, the ring with the count, the title, one line, the actions */
export function LearnHead({ tour, photo, done, total, title, subtitle, actions }: { tour: string; photo: string; done: number; total: number; title: string; subtitle: string; actions: React.ReactNode }) {
  return (
    <header data-tour={tour} className="@container relative overflow-hidden rounded-[18px] bg-[#0A1630]" style={{ boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}>
      <img src={photo} alt="" aria-hidden decoding="async" className="absolute inset-0 h-full w-full select-none object-cover object-[88%_50%] @[640px]:object-[60%_50%]" />
      <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(10,22,48,0.9) 0%, rgba(10,22,48,0.6) 50%, rgba(10,22,48,0.12) 100%)" }} />
      <div className="relative flex min-h-[160px] flex-col justify-center gap-5 px-[24px] py-[26px] @[760px]:flex-row @[760px]:items-center @[760px]:justify-between lg:px-[32px]">
        <div className="flex items-center gap-[18px]">
          <div className="relative shrink-0">
            <ProgressRing done={done} total={total} size={84} stroke={7} light />
            <span className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-[22px] font-bold leading-none tabular-nums tracking-[-0.5px]">{done}</span>
              <span className="mt-[3px] text-[10.5px] font-semibold text-white/60">of {total}</span>
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-[30px] tracking-[-0.5px] text-white lg:text-[28px] lg:leading-[34px]">{title}</h1>
            <p className="mt-[4px] max-w-[420px] text-[14px] leading-[20px] text-white/75">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">{actions}</div>
      </div>
    </header>
  );
}

/* the head's two kinds of button: a quiet link to the other page, and the next thing to do */
export function HeadChip({ onClick, done, total, label, attr }: { onClick: () => void; done: number; total: number; label: string; attr: Record<string, string> }) {
  return (
    <button type="button" {...attr} onClick={onClick} className="flex h-9 items-center gap-[7px] rounded-full bg-white/10 px-[14px] text-[13px] font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/15">
      <ProgressRing done={done} total={total} size={18} stroke={3} light />{label}<span className="tabular-nums text-white/60">{done}/{total}</span>
    </button>
  );
}
export function HeadGo({ onClick, children, attr }: { onClick: () => void; children: React.ReactNode; attr: Record<string, string> }) {
  return (
    <button type="button" {...attr} onClick={onClick} className="flex h-9 max-w-full items-center gap-[8px] rounded-full bg-white pl-[14px] pr-[16px] text-[13px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7]">
      <GuideGlyph /><span className="min-w-0 max-w-[240px] truncate">{children}</span>
    </button>
  );
}

export function GuideGlyph({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" /></svg>;
}

/* the list on the left, the open item on the right; on a phone, the list and a sheet */
export function LearnLayout({ list, detail }: { list: React.ReactNode; detail: React.ReactNode }) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
      <nav className="flex min-w-0 flex-col gap-5">{list}</nav>
      <div className="hidden min-w-0 lg:block"><div className="sticky top-0">{detail}</div></div>
    </div>
  );
}

export function ListSection({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-[6px] flex items-baseline justify-between px-[4px]">
        <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
        <span className="text-[12px] font-medium tabular-nums text-muted-foreground">{count}</span>
      </div>
      <ol className="flex flex-col gap-[2px]">{children}</ol>
    </section>
  );
}

export function ListRow({ attr, thumb, title, meta, done, active, next, onClick }: { attr: Record<string, string>; thumb: string; title: string; meta: React.ReactNode; done: boolean; active: boolean; next: boolean; onClick: () => void }) {
  return (
    <li>
      <button type="button" {...attr} onClick={onClick} className={cn("group flex h-[56px] w-full items-center gap-[12px] rounded-[12px] p-[6px] pr-[10px] text-left transition-colors", active ? "bg-primary/[0.07] ring-1 ring-inset ring-primary/25" : "hover:bg-muted/70")}>
        <span className="relative h-[44px] w-[66px] shrink-0 overflow-hidden rounded-[8px] bg-[#0A1630]">
          <img src={thumb} alt="" aria-hidden decoding="async" className="h-full w-full select-none object-cover" />
          {done && <span className="absolute inset-0 flex items-center justify-center bg-[#0A1630]/55"><Icon icon={Tick02Icon} size={16} strokeWidth={3} className="text-white" /></span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[13.5px] leading-[18px]", done ? "font-medium text-muted-foreground" : active ? "font-semibold text-foreground" : "font-medium text-foreground/85 group-hover:text-foreground")}>{title}</span>
          <span className="flex min-w-0 items-center gap-[5px] truncate text-[12px] leading-[16px] text-muted-foreground">{meta}</span>
        </span>
        {next && !done && <span className="shrink-0 rounded-full bg-primary px-[7px] py-px text-[10px] font-bold uppercase tracking-[0.04em] text-primary-foreground">Next</span>}
      </button>
    </li>
  );
}

export function MiaLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-[12px] rounded-[12px] bg-muted/60 px-[12px] py-[10px]">
      <img src={GUIDE_PERSON.avatar} alt="" aria-hidden className="size-[32px] shrink-0 rounded-full bg-primary/10 object-cover object-top" />
      <p className="min-w-0 flex-1 text-[13px] leading-[18px] text-foreground/80"><span className="font-semibold text-foreground">{GUIDE_PERSON.name}</span>: "{text}"</p>
    </div>
  );
}

/* the open item: its cover with the piece of interface, where it sits, what it is, what to do */
export type DetailProps = { attr: Record<string, string>; coverId: string; widget?: string; cover: string; meta: React.ReactNode; onPrev?: () => void; onNext?: () => void; title: string; text: string; actions: React.ReactNode; mia: string; aside?: React.ReactNode };

export function DetailBody({ coverId, widget, cover, meta, onPrev, onNext, title, text, actions, mia, aside, sheet = false }: DetailProps & { sheet?: boolean }) {
  return (
    <>
      <SceneCover id={coverId} widget={widget} src={cover} size="md" className="aspect-[16/9] w-full xl:aspect-[16/8]" />
      <div className={cn("grid gap-6 p-[24px]", aside && !sheet && "xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]")}>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[12.5px] font-semibold text-muted-foreground">{meta}</p>
            {!sheet && (onPrev || onNext) && (
              <span className="flex shrink-0 items-center gap-[4px]">
                <Button variant="ghost" size="icon" aria-label="Previous" disabled={!onPrev} onClick={onPrev} className="size-8"><Icon icon={ArrowLeft01Icon} size={16} /></Button>
                <Button variant="pill-outline" data-learn-next="" disabled={!onNext} onClick={onNext} className="h-8 gap-[4px] px-[12px] text-[12.5px] font-semibold">Next<Icon icon={ArrowRight01Icon} size={14} /></Button>
              </span>
            )}
          </div>
          <h2 className="mt-[6px] text-[22px] font-bold leading-[28px] tracking-[-0.4px] text-foreground">{title}</h2>
          <p className="mt-[6px] max-w-[520px] text-[14px] leading-[20px] text-foreground/80">{text}</p>
          <div className="mt-5 flex flex-wrap items-center gap-[10px]">{actions}</div>
          <div className="mt-5"><MiaLine text={mia} /></div>
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </>
  );
}

export function DetailCard(props: DetailProps) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.article key={props.coverId} {...props.attr} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden rounded-[18px] border border-border bg-card">
        <DetailBody {...props} />
      </motion.article>
    </AnimatePresence>
  );
}

/* on a phone the open item slides up from the bottom */
export function DetailSheet({ open, onClose, props }: { open: boolean; onClose: () => void; props: DetailProps | null }) {
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent data-learn-sheet="" className="[&>div:first-child]:hidden">
        <DrawerTitle className="sr-only">{props?.title ?? ""}</DrawerTitle>
        <DrawerDescription className="sr-only">{props?.text ?? ""}</DrawerDescription>
        <div className="max-h-[82vh] overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>{props && <DetailBody {...props} sheet />}</div>
      </DrawerContent>
    </Drawer>
  );
}
