import { useState } from "react";
import { Cancel01Icon, ArrowDown01Icon, AppleIcon, ComputerIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
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

/* Told once, on the web portal's home, and only on a computer: the same
   account records calls there, no bot in the meeting. A cross puts it away.
   Phones and tablets never see it: the app cannot be installed from them. */
export function DesktopAppBanner({ onGet }: { onGet?: () => void }) {
  const { desktop, installed } = useShell();
  const { hidden, hide } = useDesktopBannerHidden();
  if (desktop || hidden) return null;
  const cta = installed ? "Open the app" : "Get the app";
  return (
    <div className="relative mt-[12px] hidden w-full lg:block">
      <div
        className="group relative block w-full overflow-hidden rounded-[16px] text-left"
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
          {/* the choice is the whole story: Mac or Windows, and the download starts */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ml-auto flex h-[36px] shrink-0 items-center gap-[6px] rounded-full bg-white pl-[16px] pr-[12px] text-[13px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7] data-[state=open]:bg-[#EEF2F7]">
                {cta}
                <Icon icon={ArrowDown01Icon} className="size-[14px]" strokeWidth={2.2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[120] min-w-[220px]">
              <DropdownMenuItem className="gap-2" onClick={() => { onGet?.(); toast("Downloading for Mac", { description: "The app opens this account when it starts." }); }}><Icon icon={AppleIcon} className="size-4" strokeWidth={1.8} />Download for Mac</DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => { onGet?.(); toast("Downloading for Windows", { description: "The app opens this account when it starts." }); }}><Icon icon={ComputerIcon} className="size-4" strokeWidth={1.8} />Download for Windows</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>
      <button type="button" aria-label="Hide this banner" onClick={hide} className="absolute right-[12px] top-[12px] flex size-[28px] items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
        <Icon icon={Cancel01Icon} className="size-[14px]" strokeWidth={2} />
      </button>
    </div>
  );
}
