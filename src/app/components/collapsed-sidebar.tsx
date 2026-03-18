import { useState, useRef, useEffect } from "react";
import svgPaths from "../../imports/svg-i3wf63n6gj";
import { useStarred } from "./starred-context";
import { SourceIcon } from "./source-icons";
import { House, Calendar, Layers, Puzzle, Star, Folder, ChevronsRight, FileText } from "lucide-react";
import { useTheme } from "./theme-context";
import { useFolders } from "./folder-context";
import { useLanguage } from "./language-context";

interface CollapsedSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onExpand: () => void;
}

/* ── Full Logo (same as expanded sidebar, clipped by narrow width) ── */
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

/* ── Hover Popover ── */
function HoverPopover({ icon, activeIcon, label, isActive, onClick, children }: {
  icon: React.ReactNode; activeIcon?: React.ReactNode; label: string; isActive?: boolean; onClick?: () => void;
  children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { isDark, navStyle } = useTheme();

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const showPopover = (hovered || pinned) && children;

  function handleMouseEnter() { clearTimeout(timeoutRef.current); setHovered(true); }
  function handleMouseLeave() { timeoutRef.current = setTimeout(() => setHovered(false), 200); }

  const navDkP = navStyle === "dark";
  const activeBg = navDkP ? "rgba(255,255,255,0.08)" : (isDark ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.07)");
  const hoverBg = navDkP ? "rgba(255,255,255,0.04)" : (isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6");
  const popoverBg = isDark ? "#1e1e26" : "white";
  const popoverBorder = isDark ? "#37374180" : "#ebeef1";
  const popoverShadow = isDark ? "0px 8px 24px rgba(0,0,0,0.40)" : "0px 8px 24px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)";

  return (
    <div className="relative w-full" ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        onClick={() => { if (children) { setPinned(!pinned); } else if (onClick) onClick(); }}
        className="h-[32px] w-full rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: isActive ? activeBg : "transparent" }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
        title={label}
      >
        {isActive && activeIcon ? activeIcon : icon}
      </button>
      {!children && hovered && !pinned && (
        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 h-[28px] px-[10px] rounded-[6px] bg-[#1a1a1a] flex items-center whitespace-nowrap pointer-events-none z-50" style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.15)" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "white" }}>{label}</span>
        </div>
      )}
      {showPopover && (
        <div className="absolute left-[calc(100%+6px)] top-0 w-[220px] rounded-[12px] py-[8px] z-50" style={{ backgroundColor: popoverBg, border: `1px solid ${popoverBorder}`, boxShadow: popoverShadow }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <p className="px-[14px] py-[4px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
          {children}
        </div>
      )}
    </div>
  );
}

export function CollapsedSidebar({ activePage, onNavigate, onExpand }: CollapsedSidebarProps) {
  const { starredRecords } = useStarred();
  const { theme, navStyle } = useTheme();
  const dk = theme === "dark";
  const navDk = navStyle === "dark";
  const sidebarBg = navDk ? "#1a1d2e" : (dk ? "#111115" : "#fafafa");
  const borderColor = navDk ? "rgba(255,255,255,0.07)" : (dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)");
  const divider = navDk ? "rgba(255,255,255,0.07)" : (dk ? "rgba(255,255,255,0.08)" : "#ebeef1");
  const iconColor = navDk ? "rgba(160,168,190,0.7)" : (dk ? "rgba(229,231,235,0.7)" : "rgba(17,19,19,0.8)");
  const activeColor = navDk ? "#ffffff" : (dk ? "#3b82f6" : "#2563eb");

  const { folders: userFolders } = useFolders();
  const { t } = useLanguage();
  const allFolders = userFolders.length > 0 ? userFolders : [
    { id: "f1", name: "Client Meetings", color: "#3B82F6" },
    { id: "f2", name: "Internal Syncs", color: "#22C55E" },
    { id: "f3", name: "Product Demos", color: "#F59E0B" },
  ];

  return (
    <aside className="flex flex-col items-center h-full w-[56px] shrink-0 transition-colors duration-200" style={{ backgroundColor: sidebarBg }}>
      {/* Top: Logo — same layout as expanded sidebar, clipped by 56px width */}
      <div className="shrink-0 w-full h-[56px] flex items-center overflow-hidden" style={{ backgroundColor: sidebarBg }}>
        <div className="flex items-center px-[16px] w-full shrink-0" style={{ minWidth: "260px" }}>
          <Logo />
        </div>
      </div>

      <div className="h-px w-[28px] my-[4px]" style={{ backgroundColor: divider }} />

      {/* Primary nav */}
      <div className="flex flex-col items-center gap-[4px] mt-[4px] px-[8px] w-full">
        <HoverPopover icon={<House className="size-[16px]" style={{ color: iconColor }} strokeWidth={1.3} />} activeIcon={<House className="size-[16px]" style={{ color: activeColor }} strokeWidth={1.3} />} label={t("nav.home")} isActive={activePage === "dashboard"} onClick={() => onNavigate("dashboard")} />
        <HoverPopover icon={<FileText className="size-[16px]" style={{ color: iconColor }} strokeWidth={1.3} />} activeIcon={<FileText className="size-[16px]" style={{ color: activeColor }} strokeWidth={1.3} />} label={t("nav.myRecords")} isActive={activePage === "records"} onClick={() => onNavigate("records")} />
        <HoverPopover icon={<Calendar className="size-[16px]" style={{ color: iconColor }} strokeWidth={1.3} />} activeIcon={<Calendar className="size-[16px]" style={{ color: activeColor }} strokeWidth={1.3} />} label={t("nav.calendar")} isActive={activePage === "calendar"} onClick={() => onNavigate("calendar")} />
        <HoverPopover icon={<Layers className="size-[16px]" style={{ color: iconColor }} strokeWidth={1.3} />} activeIcon={<Layers className="size-[16px]" style={{ color: activeColor }} strokeWidth={1.3} />} label={t("nav.templates")} isActive={activePage === "templates"} onClick={() => onNavigate("templates")} />
      </div>

      <div className="h-px w-[28px] my-[8px]" style={{ backgroundColor: divider }} />

      {/* Starred - with popover */}
      <div className="flex flex-col items-center px-[8px] w-full gap-[4px]">
        <HoverPopover
          icon={<Star className="size-[16px]" style={{ color: iconColor }} strokeWidth={1.3} />}
          label={t("nav.starred")}
        >
          {starredRecords.length === 0 ? (
            <p className="px-[14px] py-[8px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#b0b7c3", fontStyle: "italic" }}>{t("sidebar.noStarredFiles")}</p>
          ) : (
            starredRecords.map((record) => (
              <button key={record.id} className="flex items-center gap-[8px] w-full px-[14px] h-[34px] hover:bg-[#f6f8fa] transition-colors">
                <SourceIcon source={record.source} />
                <span className="flex-1 min-w-0 truncate text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#30313d" }}>{record.name}</span>
              </button>
            ))
          )}
        </HoverPopover>
      </div>

      {/* Folders - with popover */}
      <div className="flex flex-col items-center px-[8px] w-full gap-[4px]">
        <HoverPopover
          icon={<Folder className="size-[16px]" style={{ color: iconColor }} strokeWidth={1.3} />}
          label={t("nav.folders")}
        >
          {allFolders.map((folder) => (
            <button key={folder.id} className="flex items-center gap-[8px] w-full px-[14px] h-[34px] hover:bg-[#f6f8fa] transition-colors">
              <svg className="size-[16px] shrink-0" fill="none" viewBox="0 0 16 16">
                <path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" fill={folder.color} stroke={folder.color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="flex-1 min-w-0 truncate text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#30313d" }}>{folder.name}</span>
            </button>
          ))}
        </HoverPopover>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: Integrations + Expand */}
      <div className="shrink-0 pb-[8px] w-full px-[8px]">
        <HoverPopover icon={<Puzzle className="size-[16px]" style={{ color: iconColor }} strokeWidth={1.3} />} activeIcon={<Puzzle className="size-[16px]" style={{ color: activeColor }} strokeWidth={1.3} />} label={t("nav.integrations")} isActive={activePage === "integrations"} onClick={() => onNavigate("integrations")} />
        <div className="h-px w-[28px] mx-auto my-[8px]" style={{ backgroundColor: divider }} />
        <button
          onClick={onExpand}
          className="size-[36px] rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = navDk ? "rgba(255,255,255,0.06)" : (dk ? "rgba(255,255,255,0.06)" : "#f3f4f6")}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          title="Expand sidebar"
        >
          <ChevronsRight className="size-[18px]" style={{ color: iconColor }} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}