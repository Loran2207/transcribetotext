import { Video01Icon, Calendar03Icon, ArrowExpand01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { SourceIcon } from "../source-icons";
import { UPCOMING } from "./desktop-notice";

/* The moment before a call: Zoom shows its own preview, we sit beside it with
   what the reader needs to walk in prepared, and one button that arms the
   recording. Nothing starts until the call does. */
export function JoinPanel({ os }: { os: "mac" | "win" }) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className={`flex h-[44px] shrink-0 items-center gap-[10px] ${os === "mac" ? "pl-[84px]" : "pl-[16px]"} pr-[8px]`}>
        <span className="flex items-center gap-[8px] text-[13px] text-muted-foreground"><Icon icon={Calendar03Icon} className="size-[14px]" strokeWidth={1.9} />Up next</span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{UPCOMING.title}</span>
        <button type="button" className="flex h-7 items-center gap-[6px] rounded-full border border-border px-[10px] text-[12px] font-medium transition-colors hover:bg-muted"><Icon icon={ArrowExpand01Icon} className="size-[13px]" strokeWidth={1.9} />Full window</button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-[20px] py-[6px]">
        <div className="flex items-center gap-[12px] rounded-[14px] border border-border p-[14px]">
          <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] border border-border bg-white"><SourceIcon source={UPCOMING.source} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-semibold">{UPCOMING.title}</span>
            <span className="block text-[12.5px] text-muted-foreground">{UPCOMING.time} · in {UPCOMING.startsIn} · {UPCOMING.people.join(", ")}</span>
          </span>
        </div>
        <p className="mt-[20px] text-[12px] font-semibold uppercase tracking-[0.4px] text-muted-foreground">Your brief</p>
        <p className="mt-[6px] text-[13.5px] leading-[20px]">Third sync since the soft launch on Monday. Yesterday covered bug fixes and client triage; the pricing tiers are still owed to Maria.</p>
        <p className="mt-[16px] text-[12px] font-semibold uppercase tracking-[0.4px] text-muted-foreground">From the last two calls</p>
        <ul className="mt-[6px] flex flex-col gap-[8px] text-[13.5px] leading-[20px]">
          {[
            ["Sep 8", "React and calendar bug fixes, plans for the week, client tasks and triage."],
            ["Sep 7", "Soft launch: pricing fix, AI planner flow, carrier onboarding demo, rate matrix optimisation."],
          ].map(([d, t]) => (
            <li key={d} className="flex gap-[10px]"><span className="w-[44px] shrink-0 text-muted-foreground">{d}</span><span>{t}</span></li>
          ))}
        </ul>
        <p className="mt-[16px] text-[12px] font-semibold uppercase tracking-[0.4px] text-muted-foreground">Open from last time</p>
        <ul className="mt-[6px] flex flex-col gap-[6px] text-[13.5px] leading-[20px]">
          {["Send the pricing tiers to Maria", "Confirm who owns the export"].map((t) => (
            <li key={t} className="flex items-center gap-[10px]"><span className="size-[14px] shrink-0 rounded-[4px] border border-border" />{t}</li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-[12px] border-t border-border px-[16px] py-[12px]">
        <button type="button" className="flex h-[38px] items-center gap-[8px] rounded-full bg-primary px-[16px] text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><Icon icon={Video01Icon} className="size-[16px]" strokeWidth={2} />Join and record</button>
        <button type="button" className="h-[38px] rounded-full px-[12px] text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Join only</button>
        <span className="ml-auto text-[12px] text-muted-foreground">Recording starts when the call does</span>
      </div>
    </div>
  );
}

/* Zoom's own pre-join window, drawn only so the desk frame has something real
   to sit beside. Not ours to design. */
export function ZoomPreJoin({ mac }: { mac: boolean }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[12px] bg-[#1B1B1F] text-white">
      <div className="flex h-[36px] items-center px-[14px] text-[12.5px] font-medium text-white/80">{mac ? <span className="mr-[12px] flex gap-[7px]"><span className="size-[11px] rounded-full bg-[#FF5F57]" /><span className="size-[11px] rounded-full bg-[#FEBC2E]" /><span className="size-[11px] rounded-full bg-[#28C840]" /></span> : null}{UPCOMING.title}</div>
      <div className="relative m-[12px] flex flex-1 items-center justify-center rounded-[10px] bg-[#111114]">
        <span className="flex size-[96px] items-center justify-center rounded-[14px] bg-[#2B8A3E] text-[36px] font-semibold">Y</span>
        <div className="absolute bottom-[14px] flex items-center gap-[24px] rounded-[12px] bg-[#26262B] px-[22px] py-[10px] text-[12px] text-white/85">
          <span className="flex flex-col items-center gap-[4px]"><span className="size-[18px] rounded-[4px] border border-white/60" />Audio</span>
          <span className="flex flex-col items-center gap-[4px]"><span className="size-[18px] rounded-[4px] border border-[#FF5F57]" />Video</span>
        </div>
      </div>
      <div className="flex items-center gap-[10px] px-[12px] pb-[10px] text-[12.5px]">
        {["External Headset", "MacBook Pro Camera"].map((d) => <span key={d} className="flex h-[36px] flex-1 items-center rounded-[8px] border border-white/15 px-[12px] text-white/80">{d}</span>)}
      </div>
      <div className="flex h-[56px] items-center justify-between px-[16px] text-[12.5px] text-white/70"><span>Always show this preview when joining</span><span className="rounded-[8px] bg-[#0E72ED] px-[24px] py-[8px] font-semibold text-white">Join</span></div>
    </div>
  );
}
