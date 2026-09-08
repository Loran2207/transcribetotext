import { Zap, ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { usePlan } from "./use-plan";
import { useLanguage } from "./language-context";

/* Upgrade banner for the mobile/tablet dashboard - free users only. A vivid
   primary-gradient card with a value line and a prominent Upgrade CTA. Pro
   users see nothing here. Desktop (>=lg) keeps the right-panel upsell and never
   renders this. */
export function UpgradeBanner({ desktop = false, bare = false }: { desktop?: boolean; bare?: boolean } = {}) {
  const plan = usePlan();
  const { t } = useLanguage();
  if (plan !== "free") return null;

  return (
    <div className={bare ? "" : ((desktop ? "" : "lg:hidden") + " mt-[12px]")}>
      <button
        type="button"
        className="group relative flex w-full items-center gap-[12px] overflow-hidden rounded-[16px] px-[16px] py-[13px] text-left transition-transform active:scale-[0.99]"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 78%, var(--foreground)) 100%)",
          boxShadow: bare ? "none" : "0 4px 12px color-mix(in oklch, var(--primary) 32%, transparent), 0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <span className="shrink-0 hidden md:flex items-center justify-center size-[40px] rounded-full bg-primary-foreground/15">
          <Icon icon={Zap} className="size-[20px] text-primary-foreground" strokeWidth={2} fill="currentColor" />
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-[2px]">
          <span className="whitespace-nowrap text-primary-foreground" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>{t("dash.banner.unlockPro")}</span>
          <span className="truncate text-primary-foreground/80" style={{ fontWeight: 400, fontSize: "12px", lineHeight: "16px" }}><span className="md:hidden">{t("dash.banner.proSubShort")}</span><span className="hidden md:inline">{t("dash.banner.proSub")}</span></span>
        </span>
        <span className="shrink-0 flex items-center gap-[3px] h-[34px] pl-[15px] pr-[11px] rounded-full bg-primary-foreground">
          <span className="text-primary" style={{ fontWeight: 600, fontSize: "13px" }}>{t("calendar.upgrade")}</span>
          <Icon icon={ChevronRight} className="size-[14px] text-primary" strokeWidth={2.5} />
        </span>
      </button>
    </div>
  );
}
