import { useState, type ReactNode } from "react";
import { Cancel01Icon, ArrowDown01Icon, AppleIcon, ArrowRight01Icon, ComputerIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Icon } from "../ui/icon";
import { useDemo, useShell } from "./shell";

const HIDDEN_KEY = "ttt_app_banner_hidden";

/* Hidden once, hidden for good on this browser. The desktop app itself never
   shows the banner, so the flag is only read on the web. */
export function useDesktopBannerHidden() {
  const [hidden, setHidden] = useState(() => typeof window !== "undefined" && window.localStorage.getItem(HIDDEN_KEY) === "1");
  const hide = () => { window.localStorage.setItem(HIDDEN_KEY, "1"); setHidden(true); };
  return { hidden, hide };
}

/* Where the web tells about the desktop app (Artem, 10.09: try several places,
   pick two). The prototype keeps one: the card in the right panel, where the
   discount ticket used to be. The others exist for the Figma frames and the
   states panel: ?banner=panel|home|top|sidebar. */
export type BannerVariant = "panel" | "home" | "top" | "sidebar";
export function useBannerVariant(): BannerVariant {
  const v = useDemo("banner");
  return v === "home" || v === "top" || v === "sidebar" ? v : "panel";
}
/* true when this surface should carry the desktop story: web shell, on a computer, not put away */
function useBannerOn(variant: BannerVariant) {
  const { desktop, installed } = useShell();
  const { hidden, hide } = useDesktopBannerHidden();
  const current = useBannerVariant();
  return { on: !desktop && !hidden && current === variant, hide, installed };
}

/* Mac or Windows, and the download starts: the same two rows behind every button */
function GetAppMenu({ trigger, onGet }: { trigger: ReactNode; onGet?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="z-[120] min-w-[220px]">
        <DropdownMenuItem className="gap-2" onClick={() => { onGet?.(); toast("Downloading for Mac", { description: "The app opens this account when it starts." }); }}><Icon icon={AppleIcon} className="size-4" strokeWidth={1.8} />Download for Mac</DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => { onGet?.(); toast("Downloading for Windows", { description: "The app opens this account when it starts." }); }}><Icon icon={ComputerIcon} className="size-4" strokeWidth={1.8} />Download for Windows</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NAVY = "#0A1630";

/* Variant "home": the wide banner under the two cards on the web portal's home. */
export function DesktopAppBanner({ onGet }: { onGet?: () => void }) {
  const { on, hide, installed } = useBannerOn("home");
  if (!on) return null;
  const cta = installed ? "Open the app" : "Get the app";
  return (
    <div className="relative mt-[12px] hidden w-full lg:block">
      <div
        className="group relative block w-full overflow-hidden rounded-[16px] text-left"
        style={{ height: 112, background: NAVY, boxShadow: "0 8px 24px rgba(10,22,48,0.18), 0 1px 3px rgba(0,0,0,0.08)" }}
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
          <GetAppMenu onGet={onGet} trigger={
            <button type="button" className="ml-auto flex h-[36px] shrink-0 items-center gap-[6px] rounded-full bg-white pl-[16px] pr-[12px] text-[13px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7] data-[state=open]:bg-[#EEF2F7]">
              {cta}
              <Icon icon={ArrowDown01Icon} className="size-[14px]" strokeWidth={2.2} />
            </button>
          } />
        </span>
      </div>
      <button type="button" aria-label="Hide this banner" onClick={hide} className="absolute right-[12px] top-[12px] flex size-[28px] items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
        <Icon icon={Cancel01Icon} className="size-[14px]" strokeWidth={2} />
      </button>
    </div>
  );
}

/* Variant "panel" (the prototype's one): a card in the right panel, in the
   slot the discount ticket had, and exactly the ticket's height (Kirill,
   12.09). On phones and tablets the same card rides in the promo carousel
   with no button at all: the app cannot be installed from there, the card can
   only be put away. */
export function DesktopAppCard({ onGet, mobile = false }: { onGet?: () => void; mobile?: boolean }) {
  const { desktop, installed } = useShell();
  const { hidden, hide } = useDesktopBannerHidden();
  const variant = useBannerVariant();
  if (desktop || hidden || (!mobile && variant !== "panel")) return null;
  return (
    <div className="relative w-full shrink-0 overflow-hidden rounded-[12px] text-white" style={{ height: 63, minHeight: 63, background: NAVY }}>
      <img src="/images/desktop/banner.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[38%] object-cover" style={{ objectPosition: "center 42%" }} />
      <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0A1630 0%, #0A1630 62%, rgba(10,22,48,0.6) 80%, rgba(10,22,48,0.2) 100%)" }} />
      <p className="absolute left-[16px] top-[12px] flex items-center gap-[6px] whitespace-nowrap text-[13px] font-semibold leading-[19px]">
        <span className="rounded-full bg-white px-[5px] py-px text-[9.5px] font-bold uppercase leading-[13px] tracking-[0.04em] text-[#0A1630]">New</span>
        Record calls on your computer
      </p>
      {mobile ? (
        <p className="absolute left-[16px] top-[34px] whitespace-nowrap text-[11px] leading-[16.5px] text-white/75">Also on Mac and Windows, from a computer</p>
      ) : (
        <GetAppMenu onGet={onGet} trigger={
          <button type="button" className="absolute left-[16px] top-[34px] flex items-center gap-[2px] whitespace-nowrap text-[11px] leading-[16.5px] text-white/85 hover:text-white data-[state=open]:text-white">
            {installed ? "Open the app" : "Get the app"} <Icon icon={ArrowRight01Icon} className="size-[11px]" strokeWidth={2} />
          </button>
        } />
      )}
      <button type="button" aria-label="Hide this card" onClick={hide} className="absolute right-[6px] top-[6px] flex size-[22px] items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
        <Icon icon={Cancel01Icon} className="size-[11px]" strokeWidth={2} />
      </button>
    </div>
  );
}

/* Variant "top": one line above everything, the height of a system strip. */
export function DesktopAppStrip({ onGet }: { onGet?: () => void }) {
  const { on, hide, installed } = useBannerOn("top");
  if (!on) return null;
  return (
    <div className="relative hidden h-[38px] shrink-0 items-center justify-center gap-[10px] px-[48px] text-[12.5px] text-white lg:flex" style={{ background: NAVY }}>
      <span className="rounded-full bg-white px-[6px] py-[1px] text-[10px] font-bold uppercase tracking-[0.04em] text-[#0A1630]">New</span>
      <span><span className="font-semibold">Record calls on your computer.</span> <span className="text-white/78">No bot in the meeting, the note lands in this account.</span></span>
      <GetAppMenu onGet={onGet} trigger={
        <button type="button" className="flex items-center gap-[3px] font-semibold underline-offset-[3px] hover:underline data-[state=open]:underline">
          {installed ? "Open the app" : "Get the app"}<Icon icon={ArrowRight01Icon} className="size-[13px]" strokeWidth={2.2} />
        </button>
      } />
      <button type="button" aria-label="Hide this banner" onClick={hide} className="absolute right-[12px] top-1/2 flex size-[24px] -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white">
        <Icon icon={Cancel01Icon} className="size-[12px]" strokeWidth={2} />
      </button>
    </div>
  );
}

/* Variant "sidebar": a plaque above the plan plaque, like a piece of news. */
export function SidebarAppPlaque({ onGet }: { onGet?: () => void }) {
  const { on, hide, installed } = useBannerOn("sidebar");
  if (!on) return null;
  return (
    <div className="relative mx-2 mb-2 overflow-hidden rounded-2xl p-3 text-white group-data-[collapsible=icon]:hidden" style={{ background: NAVY }}>
      <span className="flex items-center gap-[6px]">
        <span className="rounded-full bg-white px-[6px] py-[1px] text-[10px] font-bold uppercase tracking-[0.04em] text-[#0A1630]">New</span>
        <span className="text-[12.5px] font-semibold">Desktop app</span>
      </span>
      <p className="mt-[6px] text-[12px] leading-[17px] text-white/78">Record calls on your computer, no bot in the meeting.</p>
      <GetAppMenu onGet={onGet} trigger={
        <button type="button" className="mt-[10px] flex h-8 w-full items-center justify-center gap-[5px] rounded-full bg-white text-[12.5px] font-semibold text-[#0A1630] transition-colors hover:bg-[#EEF2F7] data-[state=open]:bg-[#EEF2F7]">
          {installed ? "Open the app" : "Get the app"}<Icon icon={ArrowDown01Icon} className="size-[12px]" strokeWidth={2.2} />
        </button>
      } />
      <button type="button" aria-label="Hide" onClick={hide} className="absolute right-[8px] top-[8px] flex size-[22px] items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white">
        <Icon icon={Cancel01Icon} className="size-[11px]" strokeWidth={2} />
      </button>
    </div>
  );
}
