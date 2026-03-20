import { useState, useRef, useEffect } from "react";
import { Search, CircleHelp, Settings, Globe, LogOut, Moon, Sun, PanelLeft, Zap, ChevronDown } from "lucide-react";
const imgEllipse52 = "/images/avatar.png";
import { useTheme } from "./theme-context";
import { getDarkPalette } from "./dark-palette";
import { useLanguage, LANGUAGES } from "./language-context";
import { SearchModal } from "./search-modal";

interface TopBarProps {
  onNavigate: (page: string) => void;
}

/* ── Profile Dropdown ── */
function ProfileDropdown({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme, navStyle, setNavStyle } = useTheme();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setLangOpen(false); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const languages = LANGUAGES;

  const bg = isDark ? "#1e1e26" : "white";
  const borderC = isDark ? "#37374180" : "#ebeef1";
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "#f6f8fa";
  const textPrimary = isDark ? "#e5e7eb" : "#1a1a1a";
  const textSecondary = isDark ? "#9ca3af" : "#9ca3af";
  const textMenu = isDark ? "#d1d5db" : "#30313d";
  const iconColor = isDark ? "#9ca3af" : "#6a7383";
  const dividerColor = isDark ? "#373741" : "#ebeef1";
  const shadowStyle = isDark
    ? "0px 8px 24px rgba(0,0,0,0.40), 0px 2px 8px rgba(0,0,0,0.25)"
    : "0px 8px 24px rgba(0,0,0,0.10), 0px 2px 8px rgba(0,0,0,0.04)";

  const navDk = navStyle === "dark";
  const triggerTextColor = navDk ? "#d2d6e0" : (isDark ? "#e5e7eb" : "#30313d");
  const triggerSubColor = navDk ? "#7c829a" : (isDark ? "#6b7280" : "#9ca3af");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setLangOpen(false); }}
        className="flex items-center gap-[8px] h-[36px] px-[8px] rounded-full transition-colors"
        style={{ backgroundColor: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = navDk ? "rgba(255,255,255,0.06)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <div className="size-[28px] rounded-full overflow-hidden shrink-0">
          <img src={imgEllipse52} alt="Avatar" className="size-full object-cover" />
        </div>
        <div className="flex flex-col items-start">
          <span className="flex items-center gap-[4px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12.5px", color: triggerTextColor, whiteSpace: "nowrap" }}>
            kutskrikirill@gmail.com
            <ChevronDown className="size-[10px]" style={{ color: triggerSubColor }} strokeWidth={2} />
          </span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10.5px", color: triggerSubColor, whiteSpace: "nowrap" }}>Free Plan</span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[236px] rounded-[12px] py-[6px] z-50" style={{ backgroundColor: bg, border: `1px solid ${borderC}`, boxShadow: shadowStyle }}>
          <div className="flex items-center gap-[10px] px-[14px] py-[8px] mb-[2px]">
            <img alt="" className="shrink-0 size-[32px] rounded-full object-cover" src={imgEllipse52} />
            <div className="flex flex-col min-w-0">
              <p className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: textPrimary }}>Kirill Kuts</p>
              <p className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: textSecondary }}>{t("profile.proPlan")}</p>
            </div>
          </div>
          <div className="h-px mx-[10px] my-[2px]" style={{ backgroundColor: dividerColor }} />
          <button onClick={() => { setOpen(false); onNavigate("settings"); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <Settings className="size-[16px] shrink-0" style={{ color: iconColor }} strokeWidth={1.5} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: textMenu }}>{t("profile.settings")}</span>
          </button>
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <Globe className="size-[16px] shrink-0" style={{ color: iconColor }} strokeWidth={1.5} />
              <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: textMenu }}>{t("profile.language")}</span>
              <span className="shrink-0" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: textSecondary }}>{languages.find(l => l.code === lang)?.short}</span>
              <svg className={`size-[12px] shrink-0 text-[#9ca3af] transition-transform ${langOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 12 12"><path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {langOpen && (
              <div className="absolute right-[calc(100%+4px)] top-0 w-[170px] rounded-[10px] py-[4px] z-50" style={{ backgroundColor: bg, border: `1px solid ${borderC}`, boxShadow: shadowStyle }}>
                {languages.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); setOpen(false); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#9ca3af", letterSpacing: "0.3px" }}>{l.short}</span>
                    <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: lang === l.code ? 500 : 400, fontSize: "13px", color: lang === l.code ? "#2563eb" : textMenu }}>{l.label}</span>
                    {lang === l.code && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="h-px mx-[10px] my-[2px]" style={{ backgroundColor: dividerColor }} />
          <button onClick={() => setOpen(false)} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <LogOut className="size-[16px] shrink-0 text-[#EF4444]" strokeWidth={1.5} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#EF4444" }}>{t("profile.logOut")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Top Bar ── */
export function TopBar({ onNavigate }: TopBarProps) {
  const { isDark, navStyle } = useTheme();
  const navDk = navStyle === "dark";
  const dk = isDark;

  const barBg = navDk ? "#1a1d2e" : (dk ? "#111115" : "#fafafa");
  const borderBottom = navDk ? "rgba(255,255,255,0.07)" : (dk ? "rgba(255,255,255,0.08)" : "#f0f0f0");
  const inputBg = navDk ? "rgba(255,255,255,0.06)" : (dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)");
  const inputBorder = navDk ? "rgba(255,255,255,0.08)" : (dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)");
  const iconCol = navDk ? "#7c829a" : (dk ? "#9ca3af" : "#9ca3af");
  const textCol = navDk ? "rgba(210,214,224,0.7)" : (dk ? "#9ca3af" : "#6a7383");
  const kbdBg = navDk ? "rgba(255,255,255,0.08)" : (dk ? "rgba(255,255,255,0.08)" : "white");
  const kbdShadow = navDk
    ? "0px 1px 2px rgba(0,0,0,0.3), 0px 0px 0px 0.5px rgba(255,255,255,0.06)"
    : dk
      ? "0px 1px 2px rgba(0,0,0,0.3), 0px 0px 0px 0.5px rgba(255,255,255,0.06)"
      : "0px 1px 2px rgba(0,0,0,0.06), 0px 0px 0px 0.5px rgba(0,0,0,0.04)";
  const trialBg = navDk ? "rgba(37,99,235,0.1)" : (dk ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.06)");
  const trialBorder = "transparent";
  const trialText = navDk ? "#60a5fa" : (dk ? "#60a5fa" : "#2563eb");
  const iconHover = navDk ? "rgba(255,255,255,0.06)" : (dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)");

  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="shrink-0 flex items-center px-[16px] h-[56px] gap-[12px]" style={{ backgroundColor: barBg }}>
      {/* Search trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        className="relative flex items-center flex-1 max-w-[380px] h-[32px] rounded-full transition-all cursor-pointer"
        style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
        onMouseEnter={e => e.currentTarget.style.borderColor = isDark || navDk ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = inputBorder}
      >
        <Search className="absolute left-[12px] size-[14px]" style={{ color: iconCol }} strokeWidth={1.5} />
        <span className="pl-[32px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: textCol }}>Quick Find</span>
        <div className="absolute right-[10px] flex items-center gap-[3px]">
          <kbd className="flex items-center justify-center h-[18px] px-[5px] rounded-[3px]" style={{ backgroundColor: kbdBg, boxShadow: kbdShadow, fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: iconCol }}>Ctrl</kbd>
          <kbd className="flex items-center justify-center size-[18px] rounded-[3px]" style={{ backgroundColor: kbdBg, boxShadow: kbdShadow, fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: iconCol }}>K</kbd>
        </div>
      </button>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Trial CTA */}
      <button className="flex items-center gap-[6px] h-[30px] px-[14px] rounded-full transition-colors shrink-0" style={{ backgroundColor: trialBg }}>
        <Zap className="size-[12px]" style={{ color: trialText }} strokeWidth={2} fill={trialText} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "12px", color: trialText, whiteSpace: "nowrap" }}>Start my 3-day free trial now</span>
      </button>

      {/* Icon buttons */}
      <div className="flex items-center gap-[2px]">
        <button onClick={() => onNavigate("support")} className="size-[32px] rounded-full flex items-center justify-center transition-colors shrink-0" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = iconHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} title="Support">
          <CircleHelp className="size-[16px]" style={{ color: iconCol }} strokeWidth={1.5} />
        </button>
        
      </div>

      {/* Profile */}
      <ProfileDropdown onNavigate={onNavigate} />
    </div>
  );
}
