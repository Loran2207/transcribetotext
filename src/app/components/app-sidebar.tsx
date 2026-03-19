import { House, Calendar, Layers, Puzzle, Settings, Globe, LogOut, Moon, Sun, Headphones, Plus, ChevronRight, PanelLeft, ChevronsLeft, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import svgPaths from "../../imports/svg-i3wf63n6gj";
const imgEllipse52 = "/images/avatar.png";
import { useStarred } from "./starred-context";
import { SourceIcon } from "./source-icons";
import { useTheme } from "./theme-context";
import { useFolders } from "./folder-context";
import { getDarkPalette } from "./dark-palette";
import { useLanguage, LANGUAGES } from "./language-context";

interface AppSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onToggleCollapse?: () => void;
}

/* ── Folder icon SVG path (filled, no stroke) — from Figma p1f315b00 ── */
const FOLDER_PATH = "M13.3333 13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V5.33333C14.6667 4.97971 14.5262 4.64057 14.2761 4.39052C14.0261 4.14048 13.687 4 13.3333 4H8.06667C7.84368 4.00219 7.6237 3.94841 7.42687 3.84359C7.23004 3.73877 7.06264 3.58625 6.94 3.4L6.4 2.6C6.27859 2.41565 6.11332 2.26432 5.919 2.1596C5.72468 2.05488 5.50741 2.00004 5.28667 2H2.66667C2.31304 2 1.97391 2.14048 1.72386 2.39052C1.47381 2.64057 1.33333 2.97971 1.33333 3.33333V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333Z";

/* ── Logo SVG ── */
function Logo() {
  const { navStyle } = useTheme();
  const navDk = navStyle === "dark";
  const textFill = navDk ? "#d2d6e0" : "#1E1E1E";
  const logoBlue = navDk ? "#5b8def" : "#2563EB";
  return (
    <div className="h-[30px] overflow-clip relative shrink-0 w-[180px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 180 30">
        <path d={svgPaths.p2badec00} fill={logoBlue} />
        <path d={svgPaths.p1a0b7800} fill={logoBlue} />
        <path clipRule="evenodd" d={svgPaths.p27195800} fill={logoBlue} fillRule="evenodd" />
        <path d={svgPaths.p13614280} fill={textFill} />
        <path d={svgPaths.p11015500} fill={textFill} />
        <path d={svgPaths.p1f84c200} fill={textFill} />
        <path d={svgPaths.p3c365b00} fill={textFill} />
        <path d={svgPaths.p10e82600} fill={textFill} />
        <path d={svgPaths.pc3be80} fill={textFill} />
        <path d={svgPaths.p1b650100} fill={textFill} />
        <path d={svgPaths.p2868a650} fill={textFill} />
        <path d={svgPaths.p284dfb60} fill={textFill} />
        <path d={svgPaths.p1bf24200} fill={textFill} />
        <path d={svgPaths.p3f098bc0} fill={textFill} />
        <path d={svgPaths.p27b8300} fill={textFill} />
        <path d={svgPaths.p2a7a24b0} fill={textFill} />
        <path d={svgPaths.p13ca3e70} fill={textFill} />
        <path d={svgPaths.padf6a00} fill={textFill} />
        <path d={svgPaths.p4d43600} fill={textFill} />
        <path d={svgPaths.p81b6100} fill={textFill} />
      </svg>
    </div>
  );
}

/* ── Create Folder Dialog ── */
const folderColors = [
  { id: "blue", color: "#3B82F6" }, { id: "green", color: "#22C55E" }, { id: "amber", color: "#F59E0B" }, { id: "red", color: "#EF4444" },
  { id: "purple", color: "#8B5CF6" }, { id: "pink", color: "#EC4899" }, { id: "cyan", color: "#06B6D4" }, { id: "gray", color: "#6B7280" },
];

function CreateFolderDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  useEffect(() => { if (open) { setName(""); setSelectedColor("#3B82F6"); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[16px] w-[400px] overflow-hidden" style={{ backgroundColor: c.bgPopover, boxShadow: c.shadow }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "17px", color: c.textPrimary }}>Create New Folder</h2>
          <button onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center transition-colors"><svg className="size-[16px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <div className="px-[24px] pt-[18px] pb-[8px]">
          <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary, display: "block", marginBottom: "6px" }}>Folder name</label>
          <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } if (e.key === "Escape") onClose(); }} placeholder="e.g. Client Meetings" className="w-full h-[40px] px-[14px] rounded-full outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all placeholder:text-[#b0b7c3]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: c.textSecondary, backgroundColor: c.bgInput, borderWidth: "1px", borderStyle: "solid", borderColor: c.borderInput }} />
          <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary, display: "block", marginTop: "18px", marginBottom: "8px" }}>Color</label>
          <div className="flex items-center gap-[8px]">
            {folderColors.map((fc) => (
              <button key={fc.id} onClick={() => setSelectedColor(fc.color)} className="size-[28px] rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: fc.color, boxShadow: selectedColor === fc.color ? `0 0 0 2px ${c.bgPopover}, 0 0 0 4px ${fc.color}` : "none", transform: selectedColor === fc.color ? "scale(1.1)" : "scale(1)" }}>
                {selectedColor === fc.color && <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-[10px] mt-[20px] p-[12px] rounded-[12px]" style={{ backgroundColor: c.bgSubtle, border: `1px solid ${c.border}` }}>
            <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={selectedColor} /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: name.trim() ? c.textPrimary : "#b0b7c3" }}>{name.trim() || "Folder name"}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <button onClick={onClose} className="h-[36px] px-[18px] rounded-full border transition-colors" style={{ borderColor: c.borderBtn, backgroundColor: isDark ? "transparent" : "white" }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Cancel</span></button>
          <button onClick={() => { if (name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } }} disabled={!name.trim()} className="h-[36px] px-[18px] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: "#2563eb", color: "white" }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px" }}>Create Folder</span></button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Profile menu dropdown ── */
function ProfileMenu({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme, navStyle, setNavStyle } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const navDk = navStyle === "dark";
  const dk = isDark;
  // Profile trigger colors (on sidebar bg)
  const triggerNameColor = navDk ? "#d2d6e0" : (dk ? "#e5e7eb" : "#1a1a1a");
  const triggerEmailColor = navDk ? "#6b7280" : "#737373";
  const triggerHoverBg = navDk ? "rgba(255,255,255,0.06)" : (dk ? "rgba(255,255,255,0.06)" : "#f6f8fa");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

  return (
    <div className="relative" ref={ref}>
      {/* ProfileMenu trigger — h-[51.188px], rounded-[12px], p-[8px], gap-[8px] */}
      <div
        onClick={() => { setOpen(!open); setLangOpen(false); }}
        className="h-[51.188px] rounded-[12px] w-full cursor-pointer transition-colors"
        style={{ backgroundColor: "transparent" }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = triggerHoverBg}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <div className="flex flex-row items-center size-full">
          <div className="flex gap-[8px] items-center p-[8px] size-full">
            {/* Avatar — 34×34 rounded-full */}
            <div className="relative rounded-full shrink-0 size-[34px]">
              <img alt="" className="absolute inset-0 size-full object-cover rounded-full" src={imgEllipse52} />
            </div>
            {/* Name + Email */}
            <div className="flex-1 min-w-0 flex flex-col items-start">
              <p className="truncate w-full text-left" style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "14px", lineHeight: "19.6px", color: triggerNameColor }}>Kirill Kuts</p>
              <p className="truncate w-full text-left" style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 400, fontSize: "12px", lineHeight: "15.6px", color: triggerEmailColor }}>k.kuts@gmail.com</p>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="absolute left-[4px] bottom-[calc(100%+6px)] w-[236px] rounded-[12px] py-[6px] z-50"
          style={{ backgroundColor: bg, border: `1px solid ${borderC}`, boxShadow: shadowStyle }}
        >
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
              <span className="shrink-0" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: textSecondary }}>{languages.find((l) => l.code === lang)?.short}</span>
              <svg className={`size-[12px] shrink-0 text-[#9ca3af] transition-transform ${langOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 12 12"><path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {langOpen && (
              <div className="absolute left-[calc(100%+4px)] bottom-0 w-[170px] rounded-[10px] py-[4px] z-50" style={{ backgroundColor: bg, border: `1px solid ${borderC}`, boxShadow: shadowStyle }}>
                {languages.map((l) => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); setOpen(false); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#9ca3af", letterSpacing: "0.3px" }}>{l.short}</span>
                    <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: lang === l.code ? 500 : 400, fontSize: "13px", color: lang === l.code ? "#2563eb" : textMenu }}>{l.label}</span>
                    {lang === l.code && (<svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
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

export function AppSidebar({ activePage, onNavigate, onToggleCollapse }: AppSidebarProps) {
  const [starredOpen, setStarredOpen] = useState(true);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const { starredRecords } = useStarred();
  const { folders: userFolders, addFolder } = useFolders();
  const { t } = useLanguage();

  const defaultFolders: { id: string; name: string; color: string }[] = [
    { id: "f1", name: "Client Meetings", color: "#3B82F6" },
    { id: "f2", name: "Internal Syncs", color: "#22C55E" },
    { id: "f3", name: "Product Demos", color: "#F59E0B" },
  ];
  const folders = userFolders.length > 0 ? userFolders : defaultFolders;

  const { theme, navStyle } = useTheme();
  const dk = theme === "dark";
  const navDk = navStyle === "dark";

  const sidebarBg = navDk ? "#1a1d2e" : (dk ? "#111115" : "#fafafa");
  const sidebarBorder = navDk ? "rgba(255,255,255,0.07)" : (dk ? "rgba(255,255,255,0.08)" : "#f0f0f0");
  const navHoverBg = navDk ? "rgba(255,255,255,0.06)" : (dk ? "rgba(255,255,255,0.06)" : "#f0f0f0");
  const activeNavBg = navDk ? "rgba(255,255,255,0.08)" : (dk ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.07)");
  const activeColor = navDk ? "#ffffff" : (dk ? "#3b82f6" : "#2563eb");
  const textColor = navDk ? "rgba(210,214,224,0.85)" : (dk ? "rgba(229,231,235,0.85)" : "#1a1a1a");
  const iconStroke = navDk ? "rgba(160,168,190,0.7)" : (dk ? "rgba(229,231,235,0.7)" : "#6b7280");
  const sectionLabelColor = navDk ? "rgba(160,168,190,0.5)" : (dk ? "rgba(229,231,235,0.5)" : "#9ca3af");
  const borderColor = navDk ? "rgba(255,255,255,0.07)" : (dk ? "rgba(255,255,255,0.08)" : "#e5e5e5");
  const plusColor = iconStroke;
  const chevronColor = iconStroke;
  const profileNameColor = navDk ? "#d2d6e0" : (dk ? "#e5e7eb" : "#1a1a1a");
  const profileEmailColor = navDk ? "#6b7280" : "#737373";
  const profileTriggerHover = navDk ? "rgba(255,255,255,0.06)" : (dk ? "rgba(255,255,255,0.06)" : "#f6f8fa");
  const noStarredColor = navDk ? "#555b6e" : (dk ? "#6b7280" : "#94a3b8");

  return (
    <div className="relative h-full w-[260px] shrink-0" style={{ backgroundColor: sidebarBg }}>
      <div className="flex flex-col items-start relative size-full">

        {/* ═══════════ SidebarHeader ═══════════ */}
        <div className="shrink-0 w-full h-[56px] flex items-center" style={{ backgroundColor: sidebarBg }}>
          <div className="flex items-center px-[16px] w-full">
            <Logo />
          </div>
        </div>

        {/* ═══════════ SidebarContent ═══════════ */}
        <div className="flex flex-col flex-1 items-start min-h-0 overflow-y-auto w-full">

          {/* ── Nav Group (SidebarGroup) ── */}
          <div className="shrink-0 w-full">
            <div className="flex flex-col items-start p-[8px] w-full">
              {/* SidebarMenu — gap-[4px] */}
              <div className="flex flex-col gap-[4px] items-start w-full">
                {([
                  { id: "dashboard", labelKey: "nav.home", Icon: House },
                  { id: "records", labelKey: "nav.myRecords", Icon: FileText },
                  { id: "calendar", labelKey: "nav.calendar", Icon: Calendar },
                  { id: "templates", labelKey: "nav.templates", Icon: Layers },
                ] as const).map(({ id, labelKey, Icon }) => {
                  const isActive = activePage === id;
                  return (
                    /* SidebarMenuItem */
                    <div key={id} className="flex flex-col items-center w-full">
                      {/* SidebarMenuButton — active: rounded-[100px] bg; inactive: rounded-[6px] */}
                      <button
                        onClick={() => onNavigate(id)}
                        className={`h-[32px] w-full transition-colors ${isActive ? "rounded-[100px]" : "rounded-[6px]"}`}
                        style={{ backgroundColor: isActive ? activeNavBg : "transparent" }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = navHoverBg; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <div className="flex flex-row items-center size-full">
                          <div className="flex gap-[8px] items-center p-[8px] size-full">
                            <Icon className="size-[16px] shrink-0" style={{ color: isActive ? activeColor : iconStroke }} strokeWidth={1.3} />
                            <p
                              className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left"
                              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "1", color: isActive ? activeColor : textColor }}
                            >{t(labelKey)}</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Starred Group (SidebarGroup) ── */}
          <div className="shrink-0 w-full">
            <div className="flex flex-col items-start p-[8px] w-full">
              {/* SidebarGroupLabel — h-[32px], opacity-70, rounded-[6px] */}
              <button
                onClick={() => setStarredOpen(!starredOpen)}
                className="h-[32px] rounded-[6px] w-full"
                style={{ opacity: 0.7 }}
              >
                <div className="flex flex-row items-center size-full">
                  <div className="flex gap-[8px] items-center px-[8px] size-full">
                    <p
                      className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", lineHeight: "16px", color: sectionLabelColor }}
                    >{t("nav.starred")}</p>
                    {/* Chevron — ChevronRight rotate-90 (=down), or 0 when collapsed */}
                    <div className="flex items-center justify-center shrink-0 size-[16px]">
                      <div className={`transition-transform duration-200 ${starredOpen ? "rotate-90" : ""}`}>
                        <ChevronRight className="size-[16px]" style={{ color: sectionLabelColor }} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* SidebarMenuSub — pl-[24px], py-[2px], gap-[4px] */}
              {starredOpen && (
                <div className="w-full">
                  <div className="flex flex-col gap-[4px] items-start pl-[24px] py-[2px] w-full relative">
                    {starredRecords.length === 0 ? (
                      <p className="px-[8px] py-[4px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: noStarredColor, fontStyle: "italic" }}>{t("nav.noStarred")}</p>
                    ) : (
                      starredRecords.map((record) => (
                        /* SidebarMenuSubItem — h-[28px], rounded-[100px] */
                        <button
                          key={record.id}
                          className="h-[28px] rounded-[100px] w-full transition-colors"
                          style={{ backgroundColor: "transparent" }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = navHoverBg}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <div className="flex flex-row items-center size-full">
                            <div className="flex gap-[8px] items-center px-[8px] size-full">
                              <SourceIcon source={record.source} />
                              <p
                                className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left"
                                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "1", color: textColor }}
                              >{record.name}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                    {/* Vertical border — left-[11px] */}
                    <div className="absolute bottom-0 left-[11px] top-0 w-0 pointer-events-none">
                      <div className="absolute inset-y-0 w-px -translate-x-[0.5px]" style={{ backgroundColor: borderColor }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Folders Group (SidebarGroup) ── */}
          <div className="shrink-0 w-full">
            <div className="flex flex-col items-start p-[8px] w-full">
              {/* SidebarGroupLabel — h-[32px], opacity-70, rounded-[6px] */}
              <div className="h-[32px] rounded-[6px] w-full" style={{ opacity: 0.7 }}>
                <div className="flex flex-row items-center size-full">
                  <div className="flex gap-[8px] items-center px-[8px] size-full">
                    <button
                      onClick={() => setFoldersOpen(!foldersOpen)}
                      className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", lineHeight: "16px", color: sectionLabelColor }}
                    >{t("nav.folders")}</button>
                    {/* Plus icon — 16×16, strokeWidth 1.33, color #1E293B */}
                    <button
                      onClick={() => setFolderDialogOpen(true)}
                      className="shrink-0 size-[16px] flex items-center justify-center"
                      title="New folder"
                    >
                      <Plus className="size-[16px]" style={{ color: plusColor }} strokeWidth={1.33} />
                    </button>
                    {/* Chevron */}
                    <button
                      onClick={() => setFoldersOpen(!foldersOpen)}
                      className="flex items-center justify-center shrink-0 size-[16px]"
                    >
                      <div className={`transition-transform duration-200 ${foldersOpen ? "rotate-90" : ""}`}>
                        <ChevronRight className="size-[16px]" style={{ color: chevronColor }} strokeWidth={1.5} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* SidebarMenuSub — pl-[24px], py-[2px], gap-[4px] */}
              {foldersOpen && (
                <div className="w-full">
                  <div className="flex flex-col gap-[4px] items-start pl-[24px] py-[2px] w-full relative">
                    {folders.map((folder) => (
                      /* SidebarMenuSubItem — h-[28px], rounded-[6px] */
                      <button
                        key={folder.id}
                        className="h-[28px] rounded-[6px] w-full transition-colors"
                        style={{ backgroundColor: "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = navHoverBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <div className="flex flex-row items-center size-full">
                          <div className="flex gap-[8px] items-center px-[8px] size-full">
                            {/* Folder icon — FILLED with solid color, no stroke */}
                            <div className="relative shrink-0 size-[16px]">
                              <svg className="absolute block size-full" fill="none" viewBox="0 0 16 16">
                                <path d={FOLDER_PATH} fill={folder.color} />
                              </svg>
                            </div>
                            <p
                              className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left"
                              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "1", color: textColor }}
                            >{folder.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {/* Vertical border — left-[11px] */}
                    <div className="absolute bottom-0 left-[11px] top-0 w-0 pointer-events-none">
                      <div className="absolute inset-y-0 w-px -translate-x-[0.5px]" style={{ backgroundColor: borderColor }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════ Help & Support (SidebarGroup) ═══════════ */}
        {/* Profile & Support moved to top bar */}

        {/* ═══════════ Profile Section ═══════════ */}
        {/* Moved to top bar */}

        {/* ═══════════ Bottom Section ═══════════ */}
        <div className="shrink-0 w-full">
          <div className="h-px mx-[16px]" style={{ backgroundColor: borderColor }} />
          <div className="flex flex-col gap-[2px] p-[8px] w-full">
            {/* Integrations & Apps */}
            <button
              onClick={() => onNavigate("integrations")}
              className={`h-[32px] w-full transition-colors ${activePage === "integrations" ? "rounded-[100px]" : "rounded-[6px]"}`}
              style={{ backgroundColor: activePage === "integrations" ? activeNavBg : "transparent" }}
              onMouseEnter={e => { if (activePage !== "integrations") e.currentTarget.style.backgroundColor = navHoverBg; }}
              onMouseLeave={e => { if (activePage !== "integrations") e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div className="flex flex-row items-center size-full">
                <div className="flex gap-[8px] items-center p-[8px] size-full">
                  <Puzzle className="size-[16px] shrink-0" style={{ color: activePage === "integrations" ? activeColor : iconStroke }} strokeWidth={1.3} />
                  <p className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "1", color: activePage === "integrations" ? activeColor : textColor }}>{t("nav.integrations")}</p>
                </div>
              </div>
            </button>
            {/* Collapse */}
            <button
              onClick={onToggleCollapse}
              className="h-[32px] rounded-[6px] w-full transition-colors"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = navHoverBg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <div className="flex flex-row items-center size-full">
                <div className="flex gap-[8px] items-center p-[8px] size-full">
                  <ChevronsLeft className="size-[16px] shrink-0" style={{ color: iconStroke }} strokeWidth={1.3} />
                  <p className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "1", color: textColor }}>Collapse</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} onCreate={(name, color) => addFolder(name, color)} />
    </div>
  );
}
