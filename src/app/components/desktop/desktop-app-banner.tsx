import { ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { useShell } from "./shell";

/* Told once, on the web portal's home: the same account records calls on the
   computer, no bot in the meeting. The picture is the desktop app's own. Two
   sizes: the wide card under the four tiles on a large screen, and a slide of
   the same height as the Pro banner inside the phone and tablet carousel. The
   copy wraps; nothing is cut with dots. */
export function DesktopAppBanner({ onGet, compact = false }: { onGet: () => void; compact?: boolean }) {
  const { desktop, installed } = useShell();
  if (desktop) return null;
  const cta = installed ? "Open the app" : "Get the app";
  if (compact) {
    return (
      <button type="button" onClick={onGet} className="relative flex h-full w-full items-center overflow-hidden rounded-[16px] text-left" style={{ background: "#0A1630", boxShadow: "0 4px 12px rgba(10,22,48,0.28), 0 1px 3px rgba(0,0,0,0.08)" }}>
        <img src="/images/desktop/banner.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[46%] object-cover" style={{ objectPosition: "center 42%" }} />
        <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0A1630 0%, #0A1630 52%, rgba(10,22,48,0.2) 100%)" }} />
        <span className="relative flex min-w-0 flex-1 flex-col gap-[3px] pl-[16px] pr-[8px]">
          <span className="flex items-center gap-[6px]">
            <span className="rounded-full bg-white px-[6px] py-[1px] text-[10px] font-bold uppercase tracking-[0.04em] text-[#0A1630]">New</span>
            <span className="text-[15px] font-bold tracking-[-0.2px] text-white">Record calls on your computer</span>
          </span>
          <span className="text-[12px] leading-[16px] text-white/75">{installed ? "No bot in the meeting. Open the desktop app." : "No bot in the meeting. Get the desktop app."}</span>
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onGet}
      className="group relative mt-[12px] hidden w-full overflow-hidden rounded-[16px] text-left transition-transform active:scale-[0.995] lg:block"
      style={{ height: 132, background: "#0A1630", boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <img src="/images/desktop/banner.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[58%] object-cover" style={{ objectPosition: "center 42%" }} />
      <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0A1630 0%, #0A1630 44%, rgba(10,22,48,0.35) 70%, rgba(10,22,48,0.05) 100%)" }} />
      <span className="relative flex h-full items-center gap-[24px] px-[24px]">
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
  );
}
