import { useState, useEffect, useCallback } from "react";
import { SourceIcon } from "./source-icons";
import { useTheme } from "./theme-context";
import { getDarkPalette } from "./dark-palette";
import { useLanguage } from "./language-context";
import { Smartphone, Zap, ChevronRight, ChevronUp, Check, Info, Mic, Globe, X } from "lucide-react";
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
  const { isDark } = useTheme();

  const bgFill = isDark ? "#2a2219" : "#FEF2EB";
  const starColor = isDark ? "#FF6B6B" : "#FF0000";

  return (
    <div className="relative w-full overflow-hidden rounded-[12px] shrink-0" style={{ height: 63, minHeight: 63 }}>
      {/* Ticket-shaped background */}
      <svg className="absolute inset-0 w-full h-full" fill="none" viewBox="0 0 324 63" preserveAspectRatio="none">
        <path d={promoSvgPaths.p19ebcd71} fill={bgFill} />
      </svg>

      {/* Text content */}
      <p className="absolute left-[19px] top-[12px] whitespace-nowrap" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", lineHeight: "19.5px", color: isDark ? "#e5e7eb" : "#1a1a1a" }}>
        {"Your 10% off code: "}<span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: isDark ? "#FF6B6B" : "red" }}>onbd21</span>
      </p>
      <p className="absolute left-[19px] top-[34px] whitespace-nowrap cursor-pointer flex items-center gap-[2px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", lineHeight: "16.5px", color: isDark ? "#FF6B6B" : "red" }}>
        Buy now <ChevronRight className="size-[11px]" strokeWidth={2} />
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
            <path clipRule="evenodd" d={promoSvgPaths.p2854d8c0} fill={starColor} fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 231.68, top: 14.57, width: 5.092, height: 4.613, animation: "sparkle 2.8s ease-in-out infinite 0s" }}>
        <div className="shrink-0 rotate-[-5.01deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill={starColor} fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 223.89, top: 16.31, width: 5.092, height: 4.613, animation: "sparkle 3.2s ease-in-out infinite 0.8s" }}>
        <div className="shrink-0 rotate-[-5.01deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill={starColor} fillRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Decorative sparkle stars — right cluster (right of gift) */}
      <div className="absolute flex items-center justify-center" style={{ left: 297.94, top: 19.32, width: 4.224, height: 4.541, animation: "sparkle 2.6s ease-in-out infinite 1.2s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 2.634, height: 3.074 }} fill="none" viewBox="0 0 2.63446 3.07354">
            <path clipRule="evenodd" d={promoSvgPaths.p2854d8c0} fill={starColor} fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 301.52, top: 16.26, width: 5.889, height: 5.572, animation: "sparkle 3s ease-in-out infinite 0.5s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill={starColor} fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 293.72, top: 14.58, width: 5.889, height: 5.572, animation: "sparkle 2.5s ease-in-out infinite 1.6s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 3.952, height: 3.513 }} fill="none" viewBox="0 0 3.95169 3.51261">
            <path clipRule="evenodd" d={promoSvgPaths.p2720d600} fill={starColor} fillRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 299.52, top: 13, width: 3.97, height: 3.757, animation: "sparkle 2.2s ease-in-out infinite 0.9s" }}>
        <div className="shrink-0 rotate-[19.8deg]">
          <svg className="block" style={{ width: 2.664, height: 2.368 }} fill="none" viewBox="0 0 2.66416 2.36814">
            <path clipRule="evenodd" d={promoSvgPaths.pc72f600} fill={starColor} fillRule="evenodd" />
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
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

  const cardBg = isDark ? "#1a1a22" : "white";
  const cardBorder = isDark ? "#2a2a35" : "#e8e8ec";

  return (
    null
  );
}

/* Slide 1: Scan to install app */
function SlideInstallApp() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  return (
    <div className="px-[18px] pt-[18px] pb-[10px] flex gap-[14px]">
      <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
        <div className="flex items-center gap-[6px]">
          <span style={{ fontSize: "16px", lineHeight: 1 }}>🔥</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "14px", color: c.textPrimary, letterSpacing: "-0.2px" }}>Scan to install Nexora app</span>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textMuted, lineHeight: "18px", marginTop: "2px" }}>Handle meetings and recordings anywhere.</p>
      </div>
      {/* QR Code placeholder */}
      <div className="shrink-0 flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: isDark ? "#2a2a35" : "#f3f4f6", border: `1px solid ${isDark ? "#3a3a48" : "#e5e7eb"}` }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="1" stroke={isDark ? "#888" : "#374151"} strokeWidth="1.5" fill="none" />
          <rect x="5" y="5" width="6" height="6" rx="0.5" fill={isDark ? "#888" : "#374151"} />
          <rect x="30" y="2" width="12" height="12" rx="1" stroke={isDark ? "#888" : "#374151"} strokeWidth="1.5" fill="none" />
          <rect x="33" y="5" width="6" height="6" rx="0.5" fill={isDark ? "#888" : "#374151"} />
          <rect x="2" y="30" width="12" height="12" rx="1" stroke={isDark ? "#888" : "#374151"} strokeWidth="1.5" fill="none" />
          <rect x="5" y="33" width="6" height="6" rx="0.5" fill={isDark ? "#888" : "#374151"} />
          <rect x="18" y="2" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="18" y="8" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="24" y="2" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="2" y="18" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="8" y="18" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="2" y="24" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="18" y="18" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="24" y="18" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="18" y="24" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="30" y="18" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="36" y="18" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="30" y="24" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="24" y="30" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="30" y="30" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="36" y="30" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="18" y="36" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="24" y="36" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
          <rect x="36" y="36" width="3" height="3" fill={isDark ? "#666" : "#6b7280"} />
        </svg>
      </div>
    </div>
  );
}

/* Slide 2: AI Brain */
function SlideAIBrain() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const cardBtnBg = isDark ? "#2a2a35" : "white";
  const cardBtnBorder = isDark ? "#3a3a48" : "#e5e7eb";

  return (
    <div className="px-[18px] pt-[18px] pb-[10px] flex flex-col gap-[10px]">
      <div className="flex flex-col gap-[4px]">
        <div className="flex items-center gap-[6px]">
          <span style={{ fontSize: "16px", lineHeight: 1 }}>🚀</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "14px", color: c.textPrimary, letterSpacing: "-0.2px" }}>AI Chat Is Now Nexora Brain</span>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textMuted, lineHeight: "18px", marginTop: "2px" }}>Analyze meetings and turn conversations into visuals and insights.</p>
      </div>
      <button
        className="w-full h-[36px] rounded-[10px] flex items-center justify-center cursor-pointer transition-colors"
        style={{ backgroundColor: cardBtnBg, border: `1px solid ${cardBtnBorder}` }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#333340" : "#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = cardBtnBg}
      >
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textPrimary }}>Visualize with Nexora Brain</span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Free Plan Card
   ══════════════════════════════════════════════ */

function FreePlanCard() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
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

  const cardBg = isDark ? "#1a1a22" : "white";
  const cardBorder = isDark ? "#2a2a35" : "#e8e8ec";
  const upgradeGradient = "linear-gradient(135deg, #6366f1 0%, #2563eb 50%, #0ea5e9 100%)";
  const featuresBg = isDark ? "rgba(37,99,235,0.04)" : "#f8faff";

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)" }}>
      {/* Header with plan name */}
      <div className="px-[18px] pt-[16px] pb-[14px]">
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px", color: c.textPrimary }}>You on Free Plan</span>
      </div>

      {/* Usage section */}
      <div className="px-[18px] pt-[0px] pb-[14px]">
        <div className="flex items-baseline justify-between mb-[6px]">
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: c.textPrimary }}>
            {usedMins} <span style={{ fontWeight: 400, color: c.textMuted }}>of {totalMins} mins</span>
          </span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textMuted }}>{Math.round(pct)}%</span>
        </div>
        <div className="w-full h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "#2a2a35" : "#eef0f4" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #2563eb, #6366f1)", minWidth: "6px" }} />
        </div>
        <p className="mt-[6px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10.5px", color: c.textMuted }}>Resets on 04/10/2026 20:09</p>
      </div>

      {/* Divider */}
      <div className="mx-[18px] h-px" style={{ backgroundColor: isDark ? "#2a2a35" : "#f0f0f3" }} />

      {/* Usage check — collapsible */}
      <button onClick={() => setUsageOpen(!usageOpen)} className="w-full px-[18px] py-[10px] flex items-center justify-between cursor-pointer transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textSecondary }}>Check feature usage</span>
        {usageOpen ? (
          <ChevronUp className="size-[14px]" style={{ color: c.textMuted }} strokeWidth={1.5} />
        ) : (
          <ChevronRight className="size-[14px]" style={{ color: c.textMuted }} strokeWidth={1.5} />
        )}
      </button>

      {/* Collapsible usage details */}
      {usageOpen && (
        <div className="px-[18px] pb-[10px] flex flex-col">
          {usageItems.map((item, i) => {
            const usagePct = item.total > 0 ? (item.used / item.total) * 100 : 0;
            return (
              <div key={i} className="py-[8px]" style={{ borderBottom: i < usageItems.length - 1 ? `1px solid ${isDark ? "#2a2a35" : "#f0f0f3"}` : "none" }}>
                <div className="flex items-center justify-between mb-[5px]">
                  <div className="flex items-center gap-[4px]">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11.5px", color: c.textSecondary }}>{item.label}</span>
                    {item.hasInfo && <Info className="size-[11px]" style={{ color: c.textMuted, opacity: 0.6 }} strokeWidth={1.5} />}
                  </div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11.5px", color: c.textMuted }}>{item.used}/{item.total}</span>
                </div>
                <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "#2a2a35" : "#eef0f3" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${usagePct}%`, backgroundColor: "#2563eb", minWidth: usagePct > 0 ? "4px" : "0" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div className="mx-[18px] h-px" style={{ backgroundColor: isDark ? "#2a2a35" : "#f0f0f3" }} />

      {/* CTA section */}
      <div className="px-[18px] py-[16px] flex flex-col items-center gap-[10px]">
        <button
          className="w-full h-[38px] rounded-full flex items-center justify-center gap-[6px] transition-all cursor-pointer"
          style={{
            background: upgradeGradient,
            boxShadow: isDark ? "0 2px 12px rgba(37,99,235,0.25), 0 1px 3px rgba(0,0,0,0.2)" : "0 2px 12px rgba(37,99,235,0.2), 0 1px 3px rgba(0,0,0,0.06)",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = isDark ? "0 4px 18px rgba(37,99,235,0.35), 0 2px 5px rgba(0,0,0,0.25)" : "0 4px 18px rgba(37,99,235,0.3), 0 2px 5px rgba(0,0,0,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isDark ? "0 2px 12px rgba(37,99,235,0.25), 0 1px 3px rgba(0,0,0,0.2)" : "0 2px 12px rgba(37,99,235,0.2), 0 1px 3px rgba(0,0,0,0.06)"; }}
        >
          <Zap className="size-[14px]" style={{ color: "white" }} strokeWidth={2} fill="white" />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: "white", letterSpacing: "0.1px" }}>Upgrade to Pro</span>
        </button>
        <button
          className="flex items-center gap-[2px] cursor-pointer transition-opacity"
          style={{ background: "none", border: "none", padding: 0, opacity: 0.85 }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.85"; }}
        >
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#2563eb" }}>Start my 3-day free trial now</span>
          <ChevronRight className="size-[14px]" style={{ color: "#2563eb" }} strokeWidth={2} />
        </button>
      </div>

      {/* Pro features */}
      <div className="mx-[10px] mb-[10px] px-[14px] py-[14px] rounded-[10px]" style={{ backgroundColor: featuresBg }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11.5px", color: c.textMuted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unlock with Pro</p>
        <div className="flex flex-col gap-[7px]">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-[8px]">
              <div className="flex items-center justify-center size-[16px] rounded-full" style={{ background: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.1)" }}>
                <Check className="size-[10px] shrink-0" style={{ color: "#2563eb" }} strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 450, fontSize: "12px", color: c.textSecondary }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Meeting Item
   ════════════════════════════��═════════════════ */

function MeetingItem({ meeting }: { meeting: Meeting }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex gap-[14px] py-[12px] rounded-[10px] px-[8px] -mx-[8px] transition-colors duration-200 overflow-hidden"
      style={{ backgroundColor: hovered ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)") : "transparent" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-[110px] shrink-0 flex flex-col gap-[5px]">
        <div className="flex items-center gap-[6px]">
          <SourceIcon source={platformSourceMap[meeting.platform]} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textSecondary }}>{meeting.time}</span>
        </div>
        <div className="flex items-center gap-[5px] ml-[22px]">
          <div className="w-[26px] h-[14px] rounded-full relative cursor-pointer" style={{ backgroundColor: isDark ? "#3a3a48" : "#e5e7eb" }}>
            <div className="size-[10px] rounded-full bg-white absolute left-[2px] top-[2px] shadow-sm" />
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: "#9ca3af" }}>{t("panel.autoJoin")}</span>
        </div>
      </div>
      <div className="w-px shrink-0 self-stretch" style={{ backgroundColor: c.border }} />
      <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
        <p className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textPrimary }}>{meeting.title}</p>
        <div className="flex items-center gap-[5px]">
          <svg className="size-[12px] text-[#9ca3af] shrink-0" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          <span className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: "#9ca3af" }}>{t("panel.attendees")}: {meeting.attendees}</span>
        </div>
      </div>

      {/* Hover action buttons — slide in from right */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center gap-[6px] pr-[10px] pl-[24px]"
        style={{
          background: hovered
            ? `linear-gradient(to right, transparent, ${isDark ? "#1a1a22" : "#fafafa"} 20%)`
            : "transparent",
          transform: hovered ? "translateX(0)" : "translateX(100%)",
          opacity: hovered ? 1 : 0,
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <button
          className="h-[28px] px-[10px] rounded-full flex items-center gap-[5px] transition-colors whitespace-nowrap"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "white",
            border: `1px solid ${isDark ? "#3a3a48" : "#e2e4e9"}`,
            color: c.textSecondary,
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.12)" : "#f5f5f5"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "white"}
        >
          <Mic className="size-[12px]" strokeWidth={1.5} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px" }}>Instant record</span>
        </button>
        <button
          className="h-[28px] px-[10px] rounded-full flex items-center gap-[5px] transition-colors whitespace-nowrap"
          style={{
            backgroundColor: isDark ? "rgba(37,99,235,0.1)" : "white",
            border: `1px solid ${isDark ? "rgba(37,99,235,0.3)" : "#bfdbfe"}`,
            color: "#2563eb",
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(37,99,235,0.18)" : "#eff6ff"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(37,99,235,0.1)" : "white"}
        >
          <Globe className="size-[12px]" strokeWidth={1.5} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px" }}>Online meeting</span>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Right Panel
   ══════════════════════════════════════════════ */

const DEFAULT_WIDTH = 360;

export function RightPanel() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
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
      <div className="h-full flex flex-col overflow-y-auto transition-colors duration-200" style={{ width: DEFAULT_WIDTH, backgroundColor: c.bg }}>
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
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: c.textPrimary }}>Today's Events ({todayCount})</span>
                <button className="flex items-center transition-opacity cursor-pointer" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.6"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  <ChevronRight className="size-[16px]" style={{ color: c.textPrimary }} strokeWidth={2} />
                </button>
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
