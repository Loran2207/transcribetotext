import { useState } from "react";
import { ChevronRight, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { useShell } from "./shell";

const HIDDEN_KEY = "ttt_app_banner_hidden";

/* Hidden once, hidden for good on this browser. The desktop app itself never
   shows the banner, so the flag is only read on the web. */
export function useDesktopBannerHidden() {
  const [hidden, setHidden] = useState(() => typeof window !== "undefined" && window.localStorage.getItem(HIDDEN_KEY) === "1");
  const hide = () => { window.localStorage.setItem(HIDDEN_KEY, "1"); setHidden(true); };
  return { hidden, hide };
}

/* Told once, on the web portal's home: the same account records calls on the
   computer, no bot in the meeting. Two sizes: the wide card under the four
   tiles on a large screen, with a cross to put it away, and a slide of the same
   build as the Pro banner inside the phone and tablet carousel. Slides carry no
   shadow: the scroller clips anything past its edge. */
export function DesktopAppBanner({ onGet, compact = false }: { onGet: () => void; compact?: boolean }) {
  const { desktop, installed } = useShell();
  const { hidden, hide } = useDesktopBannerHidden();
  if (desktop || hidden) return null;
  const cta = installed ? "Open the app" : "Get the app";
  if (compact) {
    return (
      <button type="button" onClick={onGet} className="group relative flex w-full items-center gap-[12px] overflow-hidden rounded-[16px] px-[16px] py-[13px] text-left transition-transform active:scale-[0.99]" style={{ background: "#0A1630" }}>
        <img src="/images/desktop/banner.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[52%] object-cover" style={{ objectPosition: "center 42%" }} />
        <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0A1630 0%, #0A1630 48%, rgba(10,22,48,0.55) 100%)" }} />
        <span className="relative flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="flex items-center gap-[6px]">
            <span className="rounded-full bg-white px-[6px] py-[1px] text-[10px] font-bold uppercase tracking-[0.04em] text-[#0A1630]">New</span>
            <span className="whitespace-nowrap text-white" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>Record calls on your computer</span>
          </span>
          <span className="truncate text-white/75" style={{ fontWeight: 400, fontSize: "12px", lineHeight: "16px" }}>No bot in the meeting</span>
        </span>
        <span className="relative flex h-[34px] shrink-0 items-center gap-[3px] rounded-full bg-white pl-[15px] pr-[11px]">
          <span className="text-[#0A1630]" style={{ fontWeight: 600, fontSize: "13px" }}>{installed ? "Open" : "Get it"}</span>
          <Icon icon={ChevronRight} className="size-[14px] text-[#0A1630]" strokeWidth={2.5} />
        </span>
      </button>
    );
  }
  return (
    <div className="relative mt-[12px] hidden w-full lg:block">
      <button
        type="button"
        onClick={onGet}
        className="group relative block w-full overflow-hidden rounded-[16px] text-left transition-transform active:scale-[0.995]"
        style={{ height: 112, background: "#0A1630", boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}
      >
        <img src="/images/desktop/banner.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[58%] object-cover" style={{ objectPosition: "center 42%" }} />
        <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0A1630 0%, #0A1630 44%, rgba(10,22,48,0.35) 70%, rgba(10,22,48,0.05) 100%)" }} />
        <span className="relative flex h-full items-center gap-[24px] pl-[24px] pr-[64px]">
          <span className="flex min-w-0 max-w-[460px] flex-col gap-[4px]">
            <span className="flex items-center gap-[8px]">
              <span className="rounded-full bg-white px-[7px] py-[1px] text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#0A1630]">New</span>
              <span className="text-[17px] font-bold tracking-[-0.2px] text-white">Record calls on your computer</span>
            </span>
            <span className="text-[13px] leading-[18px] text-white/78">No bot in the meeting. The transcript runs live beside your notes, and the note lands in this account.</span>
          </span>
          <span className="ml-auto flex h-[36px] shrink-0 items-center gap-[4px] rounded-full bg-white pl-[16px] pr-[12px] text-[13px] font-semibold text-[#0A1630] transition-colors group-hover:bg-[#EEF2F7]">
            {cta}
            <Icon icon={ChevronRight} className="size-[14px]" strokeWidth={2.5} />
          </span>
        </span>
      </button>
      <button type="button" aria-label="Hide this banner" onClick={hide} className="absolute right-[12px] top-[12px] flex size-[28px] items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
        <Icon icon={Cancel01Icon} className="size-[14px]" strokeWidth={2} />
      </button>
    </div>
  );
}
