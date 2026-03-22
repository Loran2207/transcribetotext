import { useState, useEffect, useCallback } from "react";
import { SourceIcon } from "./source-icons";
import { useLanguage } from "./language-context";
import { Smartphone, Zap, ChevronRight, ChevronUp, Check, Info, Mic, Globe, X } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import promoSvgPaths from "../../imports/svg-panhyaoz26";
const imgGiftBox = "/images/gift-box.png";

/* ══════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════ */

interface Meeting {
  id: string; day: string; dayLabel: string; time: string; title: string;
  platform: "meet" | "zoom" | "teams"; attendees: number; autoJoin: boolean;
}

const meetings: Meeting[] = [
  { id: "1", day: "03/16", dayLabel: "Monday", time: "14:00 ~ 15:00", title: "Nexora <> QL | Instance Daily Sync", platform: "meet", attendees: 4, autoJoin: false },
  { id: "2", day: "03/17", dayLabel: "Tuesday", time: "15:00 ~ 16:00", title: "Nexora Product Team Sync", platform: "meet", attendees: 6, autoJoin: false },
  { id: "3", day: "03/18", dayLabel: "Wednesday", time: "14:00 ~ 15:00", title: "Nexora <> QL | Instance Daily Sync", platform: "teams", attendees: 3, autoJoin: false },
];

const platformSourceMap = { meet: "google-meet", zoom: "zoom", teams: "teams" } as const;

/* ══════════════════════════════════════════════
   Promo Card
   ══════════════════════════════════════════════ */

function PromoCard() {
  return (
    <div className="relative w-full overflow-hidden rounded-[12px] shrink-0" style={{ height: 63, minHeight: 63 }}>
      {/* Ticket-shaped background */}
      <svg className="absolute inset-0 w-full h-full" fill="none" viewBox="0 0 324 63" preserveAspectRatio="none">
        <path d={promoSvgPaths.p19ebcd71} fill="#FEF2EB" />
      </svg>

      {/* Text content */}
      <p className="absolute left-[19px] top-[12px] whitespace-nowrap text-foreground" style={{ fontWeight: 600, fontSize: "13px", lineHeight: "19.5px" }}>
        {"Your 10% off code: "}<span className="text-destructive" style={{ fontWeight: 700 }}>onbd21</span>
      </p>
      <p className="absolute left-[19px] top-[34px] whitespace-nowrap cursor-pointer flex items-center gap-[2px] text-destructive" style={{ fontWeight: 400, fontSize: "11px", lineHeight: "16.5px" }}>
        Buy now <Icon icon={ChevronRight} className="size-[11px]" strokeWidth={2} />
      </p>

      {/* Gift box image — clipped by overflow-hidden */}
      <div className="absolute flex items-center justify-center" style={{ left: 211, top: -20, width: 113, height: 113 }}>
        <div className="shrink-0 rotate-[-4.31deg]">
          <div className="relative" style={{ width: 105.378, height: 105.378 }}>
            <img src={imgGiftBox} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Decorative sparkle stars — left cluster (near left edge of gift) */}
      <div className="absolute flex items-center justify-center" style={{ left: 229.51, top: 20.19, width: 3.471, height: 3.95, animation: "sparkle 2.4s ease-in-out infinite 0.3s" }}>
        <div className="shrink-0 rotate-[-5.01deg]">
          <svg className="block" style={{ width: 2.634, height: 3.074 }} fill="none" viewBox="0 0 2.63446 3.07354">
            <path clipRule="evenodd" d={promoSvgPaths.p2854d8c0} fill="var(--destructive)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 231.68, top: 14.57, width: 5.092, height: 4.613, animation: "sparkle 2.8s ease-in-out infinite 0s" }}>
        <div className="shrink-0 rotate-[-5.01deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill="var(--destructive)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 223.89, top: 16.31, width: 5.092, height: 4.613, animation: "sparkle 3.2s ease-in-out infinite 0.8s" }}>
        <div className="shrink-0 rotate-[-5.01deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill="var(--destructive)" fillRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Decorative sparkle stars — right cluster (right of gift) */}
      <div className="absolute flex items-center justify-center" style={{ left: 297.94, top: 19.32, width: 4.224, height: 4.541, animation: "sparkle 2.6s ease-in-out infinite 1.2s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 2.634, height: 3.074 }} fill="none" viewBox="0 0 2.63446 3.07354">
            <path clipRule="evenodd" d={promoSvgPaths.p2854d8c0} fill="var(--destructive)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 301.52, top: 16.26, width: 5.889, height: 5.572, animation: "sparkle 3s ease-in-out infinite 0.5s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill="var(--destructive)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 293.72, top: 14.58, width: 5.889, height: 5.572, animation: "sparkle 2.5s ease-in-out infinite 1.6s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill="var(--destructive)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 299.52, top: 13, width: 3.97, height: 3.757, animation: "sparkle 2.2s ease-in-out infinite 0.9s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 2.664, height: 2.368 }} fill="none" viewBox="0 0 2.66416 2.36814">
            <path clipRule="evenodd" d={promoSvgPaths.pc72f600} fill="var(--destructive)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Tips Carousel (Install App + AI Brain)
   ══════════════════════════════════════════════ */

const SLIDE_INTERVAL = 6000;
const SLIDE_COUNT = 2;

function TipsCarousel() {
  const [dismissed, setDismissed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (index === activeSlide || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSlide(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  }, [activeSlide, isTransitioning]);

  useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => {
      goToSlide((activeSlide + 1) % SLIDE_COUNT);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [activeSlide, dismissed, goToSlide]);

  if (dismissed) return null;

  return (
    null
  );
}

/* Slide 1: Scan to install app */
function SlideInstallApp() {
  return (
    <div className="px-[18px] pt-[18px] pb-[10px] flex gap-[14px]">
      <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
        <div className="flex items-center gap-[6px]">
          <span style={{ fontSize: "16px", lineHeight: 1 }}>🔥</span>
          <span className="text-foreground" style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.2px" }}>Scan to install Nexora app</span>
        </div>
        <p className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "12px", lineHeight: "18px", marginTop: "2px" }}>Handle meetings and recordings anywhere.</p>
      </div>
      {/* QR Code placeholder */}
      <div className="shrink-0 flex items-center justify-center bg-muted border border-border" style={{ width: 64, height: 64, borderRadius: 8 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-foreground" />
          <rect x="5" y="5" width="6" height="6" rx="0.5" fill="currentColor" className="text-foreground" />
          <rect x="30" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-foreground" />
          <rect x="33" y="5" width="6" height="6" rx="0.5" fill="currentColor" className="text-foreground" />
          <rect x="2" y="30" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-foreground" />
          <rect x="5" y="33" width="6" height="6" rx="0.5" fill="currentColor" className="text-foreground" />
          <rect x="18" y="2" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="18" y="8" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="24" y="2" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="2" y="18" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="8" y="18" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="2" y="24" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="18" y="18" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="24" y="18" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="18" y="24" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="30" y="18" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="36" y="18" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="30" y="24" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="24" y="30" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="30" y="30" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="36" y="30" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="18" y="36" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="24" y="36" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
          <rect x="36" y="36" width="3" height="3" fill="currentColor" className="text-muted-foreground" />
        </svg>
      </div>
    </div>
  );
}

/* Slide 2: AI Brain */
function SlideAIBrain() {
  return (
    <div className="px-[18px] pt-[18px] pb-[10px] flex flex-col gap-[10px]">
      <div className="flex flex-col gap-[4px]">
        <div className="flex items-center gap-[6px]">
          <span style={{ fontSize: "16px", lineHeight: 1 }}>🚀</span>
          <span className="text-foreground" style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.2px" }}>AI Chat Is Now Nexora Brain</span>
        </div>
        <p className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "12px", lineHeight: "18px", marginTop: "2px" }}>Analyze meetings and turn conversations into visuals and insights.</p>
      </div>
      <Button variant="outline"
        className="w-full h-[36px] rounded-[10px]"
      >
        <span className="text-foreground" style={{ fontWeight: 500, fontSize: "13px" }}>Visualize with Nexora Brain</span>
      </Button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Free Plan Card
   ══════════════════════════════════════════════ */

function FreePlanCard() {
  const [usageOpen, setUsageOpen] = useState(false);
  const usedMins = 10;
  const totalMins = 120;
  const pct = (usedMins / totalMins) * 100;

  const usageItems = [
    { label: "File transcription", used: 2, total: 50 },
    { label: "Real-time translation", used: 1, total: 2 },
    { label: "AI summary", used: 5, total: 10 },
    { label: "Bilingual Transcription and Translation", used: 0, total: 4 },
    { label: "Knowledge Q&A", used: 0, total: 500, hasInfo: true },
    { label: "Image & Slides generation", used: 1, total: 30, hasInfo: true },
  ];

  const features = ["AI Notes", "Recordings and transcripts export", "Transcript translation", "Up to 5 hours per transcription"];

  return (
    <div className="rounded-[14px] overflow-hidden bg-card border border-border shadow-sm">
      {/* Header with plan name */}
      <div className="px-[18px] pt-[16px] pb-[14px]">
        <span className="text-foreground" style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>You on Free Plan</span>
      </div>

      {/* Usage section */}
      <div className="px-[18px] pt-[0px] pb-[14px]">
        <div className="flex items-baseline justify-between mb-[6px]">
          <span className="text-foreground" style={{ fontWeight: 600, fontSize: "13px" }}>
            {usedMins} <span className="text-muted-foreground" style={{ fontWeight: 400 }}>of {totalMins} mins</span>
          </span>
          <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "11px" }}>{Math.round(pct)}%</span>
        </div>
        <div className="w-full h-[5px] rounded-full overflow-hidden bg-muted">
          <div className="h-full rounded-full transition-all bg-primary" style={{ width: `${pct}%`, minWidth: "6px" }} />
        </div>
        <p className="mt-[6px] text-muted-foreground" style={{ fontWeight: 400, fontSize: "10.5px" }}>Resets on 04/10/2026 20:09</p>
      </div>

      {/* Divider */}
      <div className="mx-[18px] h-px bg-border" />

      {/* Usage check — collapsible */}
      <Button variant="ghost" onClick={() => setUsageOpen(!usageOpen)} className="w-full px-[18px] py-[10px] h-auto rounded-none flex items-center justify-between">
        <span className="text-foreground" style={{ fontWeight: 500, fontSize: "12px" }}>Check feature usage</span>
        {usageOpen ? (
          <Icon icon={ChevronUp} className="size-[14px] text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <Icon icon={ChevronRight} className="size-[14px] text-muted-foreground" strokeWidth={1.5} />
        )}
      </Button>

      {/* Collapsible usage details */}
      {usageOpen && (
        <div className="px-[18px] pb-[10px] flex flex-col">
          {usageItems.map((item, i) => {
            const usagePct = item.total > 0 ? (item.used / item.total) * 100 : 0;
            return (
              <div key={i} className={`py-[8px] ${i < usageItems.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center justify-between mb-[5px]">
                  <div className="flex items-center gap-[4px]">
                    <span className="text-foreground" style={{ fontWeight: 400, fontSize: "11.5px" }}>{item.label}</span>
                    {item.hasInfo && <Icon icon={Info} className="size-[11px] text-muted-foreground opacity-60" strokeWidth={1.5} />}
                  </div>
                  <span className="text-muted-foreground" style={{ fontWeight: 500, fontSize: "11.5px" }}>{item.used}/{item.total}</span>
                </div>
                <div className="w-full h-[3px] rounded-full overflow-hidden bg-muted">
                  <div className="h-full rounded-full transition-all bg-primary" style={{ width: `${usagePct}%`, minWidth: usagePct > 0 ? "4px" : "0" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div className="mx-[18px] h-px bg-border" />

      {/* CTA section */}
      <div className="px-[18px] py-[16px] flex flex-col items-center gap-[10px]">
        <Button
          className="w-full h-[38px] rounded-full gap-[6px] hover:-translate-y-px bg-primary text-primary-foreground"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
            boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 20%, transparent), 0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <Icon icon={Zap} className="size-[14px] text-primary-foreground" strokeWidth={2} fill="currentColor" />
          <span className="text-primary-foreground" style={{ fontWeight: 600, fontSize: "13px", letterSpacing: "0.1px" }}>Upgrade to Pro</span>
        </Button>
        <Button variant="link" className="gap-[2px] opacity-85 hover:opacity-100 h-auto p-0">
          <span className="text-primary" style={{ fontWeight: 500, fontSize: "12px" }}>Start my 3-day free trial now</span>
          <Icon icon={ChevronRight} className="size-[14px] text-primary" strokeWidth={2} />
        </Button>
      </div>

      {/* Pro features */}
      <div className="mx-[10px] mb-[10px] px-[14px] py-[14px] rounded-[10px] bg-primary/[0.03]">
        <p className="text-muted-foreground" style={{ fontWeight: 600, fontSize: "11.5px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unlock with Pro</p>
        <div className="flex flex-col gap-[7px]">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-[8px]">
              <div className="flex items-center justify-center size-[16px] rounded-full bg-primary/10">
                <Icon icon={Check} className="size-[10px] shrink-0 text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-foreground" style={{ fontWeight: 450, fontSize: "12px" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Meeting Item
   ══════════════════════════════════════════════ */

function MeetingItem({ meeting }: { meeting: Meeting }) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative flex gap-[14px] py-[12px] rounded-[10px] px-[8px] -mx-[8px] transition-colors duration-200 overflow-hidden ${hovered ? "bg-foreground/[0.015]" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-[110px] shrink-0 flex flex-col gap-[5px]">
        <div className="flex items-center gap-[6px]">
          <SourceIcon source={platformSourceMap[meeting.platform]} />
          <span className="text-foreground" style={{ fontWeight: 500, fontSize: "12px" }}>{meeting.time}</span>
        </div>
        <div className="flex items-center gap-[5px] ml-[22px]">
          <div className="w-[26px] h-[14px] rounded-full relative cursor-pointer bg-muted">
            <div className="size-[10px] rounded-full bg-background absolute left-[2px] top-[2px] shadow-sm" />
          </div>
          <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "10px" }}>{t("panel.autoJoin")}</span>
        </div>
      </div>
      <div className="w-px shrink-0 self-stretch bg-border" />
      <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
        <p className="truncate text-foreground" style={{ fontWeight: 500, fontSize: "13px" }}>{meeting.title}</p>
        <div className="flex items-center gap-[5px]">
          <svg className="size-[12px] text-muted-foreground shrink-0" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          <span className="truncate text-muted-foreground" style={{ fontWeight: 400, fontSize: "11px" }}>{t("panel.attendees")}: {meeting.attendees}</span>
        </div>
      </div>

      {/* Hover action buttons — slide in from right */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center gap-[6px] pr-[10px] pl-[24px]"
        style={{
          background: hovered
            ? "linear-gradient(to right, transparent, var(--secondary) 20%)"
            : "transparent",
          transform: hovered ? "translateX(0)" : "translateX(100%)",
          opacity: hovered ? 1 : 0,
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <Button variant="outline" size="sm"
          className="h-[28px] px-[10px] rounded-full gap-[5px] text-foreground"
        >
          <Icon icon={Mic} className="size-[12px]" strokeWidth={1.5} />
          <span style={{ fontWeight: 500, fontSize: "11px" }}>Instant record</span>
        </Button>
        <Button variant="outline" size="sm"
          className="h-[28px] px-[10px] rounded-full gap-[5px] text-primary border-primary/30 hover:bg-primary/[0.05]"
        >
          <Icon icon={Globe} className="size-[12px]" strokeWidth={1.5} />
          <span style={{ fontWeight: 500, fontSize: "11px" }}>Online meeting</span>
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Right Panel
   ══════════════════════════════════════════════ */

const DEFAULT_WIDTH = 360;

export function RightPanel() {
  const { t } = useLanguage();

  const meetingGrouped = [
    { day: "03/16", dayLabel: "Monday", items: meetings.filter((m) => m.day === "03/16") },
    { day: "03/17", dayLabel: "Tuesday", items: meetings.filter((m) => m.day === "03/17") },
    { day: "03/18", dayLabel: "Wednesday", items: meetings.filter((m) => m.day === "03/18") },
  ];

  const todayStr = "03/16";
  const todayCount = meetings.filter((m) => m.day === todayStr).length;

  return (
    <div className="flex shrink-0 h-full">
      <div className="h-full flex flex-col overflow-y-auto transition-colors duration-200 bg-background" style={{ width: DEFAULT_WIDTH }}>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-[18px] py-[18px] flex flex-col gap-[14px]">
          {/* Widget Cards */}
          <PromoCard />
          <TipsCarousel />
          <FreePlanCard />

          {/* Spacer before events */}
          <div className="h-[10px]" />

          {/* Today's Events */}
          <div>
            <div className="flex items-center justify-between mb-[4px]">
              <div className="flex items-center gap-[2px]">
                <span className="text-foreground" style={{ fontWeight: 600, fontSize: "14px" }}>Today's Events ({todayCount})</span>
                <Button variant="ghost" size="icon" className="size-[20px] rounded-full hover:opacity-60">
                  <Icon icon={ChevronRight} className="size-[16px] text-foreground" strokeWidth={2} />
                </Button>
              </div>
            </div>
            {meetingGrouped.filter(g => g.day === todayStr).map((group) => (
              <div key={group.day}>
                {group.items.map((m) => <MeetingItem key={m.id} meeting={m} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
