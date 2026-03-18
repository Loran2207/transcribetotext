import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X, Calendar, FolderOpen, FileText, ChevronLeft, ChevronRight, Clock, Zap, ChevronDown, User } from "lucide-react";
import { useTheme } from "./theme-context";
import { getDarkPalette } from "./dark-palette";
import { useFolders } from "./folder-context";
import { SourceIcon, type SourceType } from "./source-icons";

/* ── Mock data ── */
const RECENT_SEARCHES = [
  { id: "rs1", query: "Q4 Product Review", timestamp: "2 hours ago" },
  { id: "rs2", query: "Client onboarding call", timestamp: "Yesterday" },
  { id: "rs3", query: "Sprint retrospective", timestamp: "3 days ago" },
];

const MOCK_RESULTS: SearchResult[] = [
  { id: "sr1", name: "Workflow Process and Load Addition Discussion", source: "google-meet", date: "Mar 14, 2026 07:58", duration: "1min 6s", creator: "Kirill Kuts", summary: "integration points. Request for current workflow overview. Question posed: What is the basic/default workflow" },
  { id: "sr2", name: "Client Onboarding — Nexora Inc.", source: "zoom", date: "Mar 12, 2026 10:30", duration: "32min 8s", creator: "Kirill Kuts", summary: "Discussed the onboarding workflow for enterprise clients. Key action items include setting up automated workflow notifications and scheduling follow-up." },
  { id: "sr3", name: "Sprint Retrospective #24", source: "teams", date: "Mar 10, 2026 19:09", duration: "1min 21s", creator: "Kirill Kuts", summary: "Let's explore how Nexora can improve your workflow and enhance your productivity." },
  { id: "sr4", name: "Product Demo — Enterprise Workflow", source: "zoom", date: "Mar 8, 2026 14:20", duration: "51min 20s", creator: "Kirill Kuts", summary: "Demonstrated the new workflow automation features. Customer feedback was positive on the drag-and-drop workflow builder." },
  { id: "sr5", name: "Interview — Senior Developer", source: "google-meet", date: "Mar 5, 2026 11:00", duration: "1h 2min", creator: "Kirill Kuts", summary: "Technical discussion covering CI/CD workflow, code review practices, and development workflow preferences." },
  { id: "sr6", name: "Weekly standup recording", source: "microphone", date: "Mar 3, 2026 09:15", duration: "12min 33s", creator: "Kirill Kuts", summary: "Quick team sync on current sprint status. Updated workflow priorities and blockers." },
];

const MOCK_FOLDERS = [
  { id: "mf1", name: "Client Meetings", color: "#3B82F6", count: 24 },
  { id: "mf2", name: "Internal Syncs", color: "#22C55E", count: 18 },
  { id: "mf3", name: "Product Demos", color: "#F59E0B", count: 12 },
  { id: "mf4", name: "Workflow Documents", color: "#8B5CF6", count: 7 },
];

interface SearchResult {
  id: string; name: string; source: SourceType; date: string; duration: string; creator: string; summary: string;
}

/* ── Document type options ── */
const DOC_TYPES: { id: string; label: string; source: SourceType }[] = [
  { id: "google-meet", label: "Google Meet", source: "google-meet" },
  { id: "zoom", label: "Zoom", source: "zoom" },
  { id: "teams", label: "Teams", source: "teams" },
  { id: "microphone", label: "Microphone", source: "microphone" },
  { id: "mp4", label: "MP4 File", source: "mp4" },
  { id: "mp3", label: "MP3 File", source: "mp3" },
  { id: "youtube", label: "YouTube", source: "youtube" },
  { id: "dropbox", label: "Dropbox", source: "dropbox" },
];

const CREATOR_OPTIONS = [
  { id: "kirill", label: "Kirill Kuts" },
  { id: "team", label: "Team Members" },
];

/* ── Date presets ── */
const DATE_PRESETS = [
  { id: "yesterday", label: "Yesterday", pro: false },
  { id: "7days", label: "Last 7 days", pro: false },
  { id: "30days", label: "Last 30 days", pro: false },
  { id: "90days", label: "Last 90 days", pro: true },
  { id: "1year", label: "Last 1 year", pro: true },
];

/* ── Calendar helpers ── */
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const days: { day: number; current: boolean; date: Date }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrev - i, current: false, date: new Date(year, month - 1, daysInPrev - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
  }
  return days;
}

/* ── Highlight matching text ── */
function HighlightText({ text, query, color }: { text: string; query: string; color: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} style={{ color: "#2563eb", fontWeight: 600 }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

/* ── Filter Chip with chevron ── */
function FilterChip({ label, icon, active, count, onClick, hasChevron, c }: {
  label: string; icon: React.ReactNode; active: boolean; count?: number; onClick: () => void; hasChevron?: boolean;
  c: ReturnType<typeof getDarkPalette>;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[5px] h-[28px] px-[10px] rounded-full transition-all shrink-0"
      style={{
        backgroundColor: active ? "rgba(37,99,235,0.08)" : "transparent",
        border: `1px solid ${active ? "#2563eb" : c.border}`,
      }}
    >
      {icon}
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: active ? "#2563eb" : c.textMuted }}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "12px", color: "#2563eb" }}>
          {count}
        </span>
      )}
      {hasChevron && <ChevronDown className="size-[10px]" style={{ color: active ? "#2563eb" : c.textFaint }} strokeWidth={2} />}
    </button>
  );
}

/* ── Dropdown Panel ── */
function FilterDropdown({ children, c, width }: { children: React.ReactNode; c: ReturnType<typeof getDarkPalette>; width?: number }) {
  return (
    <div
      className="absolute top-[calc(100%+6px)] left-0 rounded-[12px] py-[6px] z-10 overflow-hidden"
      style={{ width: width || 260, backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
    >
      {children}
    </div>
  );
}

/* ── Date Filter Panel ── */
function DateFilterPanel({ selectedPreset, selectedDate, onSelectPreset, onSelectDate, onClear, c, isDark }: {
  selectedPreset: string | null; selectedDate: Date | null;
  onSelectPreset: (id: string) => void; onSelectDate: (d: Date) => void; onClear: () => void;
  c: ReturnType<typeof getDarkPalette>; isDark: boolean;
}) {
  const today = new Date(2026, 2, 16);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const days = getCalendarDays(calYear, calMonth);
  function prevMonth() { if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); } else setCalMonth(calMonth - 1); }
  function nextMonth() { if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); } else setCalMonth(calMonth + 1); }
  const isToday = (d: Date) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const isSelected = (d: Date) => selectedDate && d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();

  return (
    <div className="absolute top-[calc(100%+6px)] left-0 w-[300px] rounded-[12px] z-10 overflow-hidden" style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
      <div className="flex items-center justify-between px-[14px] pt-[12px] pb-[4px]">
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Created</span>
        <button onClick={onClear} className="transition-opacity hover:opacity-70">
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#2563eb" }}>Clear</span>
        </button>
      </div>
      <div className="px-[6px] py-[4px]">
        {DATE_PRESETS.map((p) => (
          <button key={p.id} onClick={() => onSelectPreset(p.id)} className="flex items-center gap-[8px] w-full h-[34px] px-[10px] rounded-[8px] transition-colors" style={{ backgroundColor: selectedPreset === p.id ? (isDark ? "rgba(37,99,235,0.12)" : "#f0f4ff") : "transparent" }} onMouseEnter={e => { if (selectedPreset !== p.id) e.currentTarget.style.backgroundColor = c.bgHover; }} onMouseLeave={e => { if (selectedPreset !== p.id) e.currentTarget.style.backgroundColor = "transparent"; }}>
            <Calendar className="size-[13px]" style={{ color: selectedPreset === p.id ? "#2563eb" : c.textMuted }} strokeWidth={1.5} />
            <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: selectedPreset === p.id ? 500 : 400, fontSize: "13px", color: selectedPreset === p.id ? "#2563eb" : c.textSecondary }}>{p.label}</span>
            {p.pro && <Zap className="size-[11px]" style={{ color: "#2563eb" }} strokeWidth={2} fill="#2563eb" />}
          </button>
        ))}
      </div>
      <div className="h-px mx-[10px]" style={{ backgroundColor: c.border }} />
      <div className="flex items-center justify-between px-[14px] pt-[10px] pb-[6px]">
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: c.textPrimary }}>{MONTHS[calMonth].slice(0, 3)} {calYear}</span>
        <div className="flex items-center gap-[2px]">
          <button onClick={prevMonth} className="size-[26px] rounded-full flex items-center justify-center transition-colors" onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}><ChevronLeft className="size-[13px]" style={{ color: c.textMuted }} strokeWidth={1.5} /></button>
          <button onClick={nextMonth} className="size-[26px] rounded-full flex items-center justify-center transition-colors" onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}><ChevronRight className="size-[13px]" style={{ color: c.textMuted }} strokeWidth={1.5} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 px-[10px]">
        {DAYS.map((d) => (<div key={d} className="flex items-center justify-center h-[24px]"><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "9px", color: c.textFaint, letterSpacing: "0.5px" }}>{d}</span></div>))}
      </div>
      <div className="grid grid-cols-7 px-[10px] pb-[12px]">
        {days.map((d, i) => {
          const sel = isSelected(d.date);
          const tod = isToday(d.date);
          return (
            <button key={i} onClick={() => onSelectDate(d.date)} className="flex flex-col items-center justify-center h-[32px] rounded-full transition-colors" style={{ backgroundColor: sel ? "#2563eb" : "transparent", opacity: d.current ? 1 : 0.3 }} onMouseEnter={e => { if (!sel) e.currentTarget.style.backgroundColor = c.bgHover; }} onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = "transparent"; }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: tod || sel ? 600 : 400, fontSize: "12px", color: sel ? "white" : (tod ? "#2563eb" : c.textSecondary) }}>{d.day}</span>
              {tod && !sel && <div className="size-[3px] rounded-full -mt-[1px]" style={{ backgroundColor: "#2563eb" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Scope Selector (Recordings / Folders) ── */
function ScopeSelector({ scope, onChange, c, isDark }: { scope: "recordings" | "folders"; onChange: (s: "recordings" | "folders") => void; c: ReturnType<typeof getDarkPalette>; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-[6px] h-[30px] pl-[10px] pr-[6px] rounded-[8px] transition-colors shrink-0"
        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6", border: `1px solid ${c.border}` }}
        onMouseEnter={e => e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.15)" : "#d1d5db"}
        onMouseLeave={e => e.currentTarget.style.borderColor = c.border}
      >
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>
          {scope === "recordings" ? "Recordings" : "Folders"}
        </span>
        <ChevronDown className="size-[12px]" style={{ color: c.textMuted }} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-[160px] rounded-[10px] py-[4px] z-20" style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
          <button onClick={() => { onChange("recordings"); setOpen(false); }} className="flex items-center gap-[8px] w-full h-[34px] px-[12px] transition-colors" style={{ backgroundColor: scope === "recordings" ? (isDark ? "rgba(37,99,235,0.12)" : "#f0f4ff") : "transparent" }} onMouseEnter={e => { if (scope !== "recordings") e.currentTarget.style.backgroundColor = c.bgHover; }} onMouseLeave={e => { if (scope !== "recordings") e.currentTarget.style.backgroundColor = "transparent"; }}>
            <FileText className="size-[14px]" style={{ color: scope === "recordings" ? "#2563eb" : c.textMuted }} strokeWidth={1.5} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: scope === "recordings" ? 500 : 400, fontSize: "13px", color: scope === "recordings" ? "#2563eb" : c.textSecondary }}>Recordings</span>
          </button>
          <button onClick={() => { onChange("folders"); setOpen(false); }} className="flex items-center gap-[8px] w-full h-[34px] px-[12px] transition-colors" style={{ backgroundColor: scope === "folders" ? (isDark ? "rgba(37,99,235,0.12)" : "#f0f4ff") : "transparent" }} onMouseEnter={e => { if (scope !== "folders") e.currentTarget.style.backgroundColor = c.bgHover; }} onMouseLeave={e => { if (scope !== "folders") e.currentTarget.style.backgroundColor = "transparent"; }}>
            <FolderOpen className="size-[14px]" style={{ color: scope === "folders" ? "#2563eb" : c.textMuted }} strokeWidth={1.5} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: scope === "folders" ? 500 : 400, fontSize: "13px", color: scope === "folders" ? "#2563eb" : c.textSecondary }}>Folders</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   SEARCH MODAL
   ════════════════════════════════════════════════════ */
interface SearchModalProps { open: boolean; onClose: () => void; onNavigate?: (page: string) => void; }

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { folders: userFolders } = useFolders();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);
  const [scope, setScope] = useState<"recordings" | "folders">("recordings");
  const [titleOnly, setTitleOnly] = useState(false);

  // Filter dropdowns
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [datePreset, setDatePreset] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const defaultFolders = [
    { id: "f1", name: "Client Meetings", color: "#3B82F6" },
    { id: "f2", name: "Internal Syncs", color: "#22C55E" },
    { id: "f3", name: "Product Demos", color: "#F59E0B" },
  ];
  const folders = userFolders.length > 0 ? userFolders : defaultFolders;

  const closeDropdowns = useCallback(() => setActiveDropdown(null), []);

  useEffect(() => {
    if (open) { setQuery(""); closeDropdowns(); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open, closeDropdowns]);

  useEffect(() => {
    if (!open) return;
    function h(e: KeyboardEvent) {
      if (e.key === "Escape") { if (activeDropdown) closeDropdowns(); else onClose(); }
    }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose, activeDropdown, closeDropdowns]);

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // Search logic
  const hasQuery = query.trim().length > 0;
  const hasFilters = selectedFolders.size > 0 || selectedTypes.size > 0 || selectedCreators.size > 0 || datePreset !== null || selectedDate !== null;

  const recordingResults = hasQuery
    ? MOCK_RESULTS.filter(r => {
        const q = query.toLowerCase();
        if (titleOnly) return r.name.toLowerCase().includes(q);
        return r.name.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
      })
    : hasFilters ? MOCK_RESULTS : [];

  const folderResults = hasQuery
    ? MOCK_FOLDERS.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : hasFilters ? MOCK_FOLDERS : [];

  const results = scope === "recordings" ? recordingResults : folderResults;
  const resultCount = results.length;

  function removeRecent(id: string) { setRecentSearches(prev => prev.filter(r => r.id !== id)); }
  function clearAllFilters() { setSelectedFolders(new Set()); setSelectedTypes(new Set()); setSelectedCreators(new Set()); setDatePreset(null); setSelectedDate(null); setTitleOnly(false); }

  const FOLDER_PATH = "M13.3333 13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V5.33333C14.6667 4.97971 14.5262 4.64057 14.2761 4.39052C14.0261 4.14048 13.687 4 13.3333 4H8.06667C7.84368 4.00219 7.6237 3.94841 7.42687 3.84359C7.23004 3.73877 7.06264 3.58625 6.94 3.4L6.4 2.6C6.27859 2.41565 6.11332 2.26432 5.919 2.1596C5.72468 2.05488 5.50741 2.00004 5.28667 2H2.66667C2.31304 2 1.97391 2.14048 1.72386 2.39052C1.47381 2.64057 1.33333 2.97971 1.33333 3.33333V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333Z";

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" onClick={() => { closeDropdowns(); onClose(); }} />

      <div
        className="relative w-[640px] rounded-[16px] overflow-visible flex flex-col"
        style={{
          backgroundColor: c.bgPopover,
          boxShadow: isDark
            ? "0px 24px 64px rgba(0,0,0,0.6), 0px 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)"
            : "0px 24px 64px rgba(0,0,0,0.12), 0px 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          maxHeight: "70vh",
        }}
        onClick={() => closeDropdowns()}
      >
        {/* ─── Search Header ─── */}
        <div className="flex items-center gap-[8px] px-[14px] h-[52px] shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          <ScopeSelector scope={scope} onChange={setScope} c={c} isDark={isDark} />
          <div className="flex items-center gap-[8px] flex-1 min-w-0" onClick={e => e.stopPropagation()}>
            <Search className="size-[15px] shrink-0" style={{ color: c.textMuted }} strokeWidth={1.5} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={scope === "recordings" ? "Search recordings..." : "Search folders..."}
              className="flex-1 h-full bg-transparent outline-none min-w-0 placeholder:text-[#9ca3af]"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: c.textPrimary }}
            />
          </div>
          <div className="flex items-center gap-[6px] shrink-0">
            {hasQuery && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textFaint }}>
                Enter ↵
              </span>
            )}
            <button onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <X className="size-[15px]" style={{ color: c.textMuted }} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ─── Filter Chips ─── */}
        <div className="flex items-center gap-[6px] px-[14px] py-[8px] shrink-0 flex-wrap" style={{ borderBottom: `1px solid ${c.border}` }}>
          {/* Folders */}
          {scope === "recordings" && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <FilterChip
                label="Folders" hasChevron
                icon={<FolderOpen className="size-[12px]" style={{ color: selectedFolders.size > 0 ? "#2563eb" : c.textMuted }} strokeWidth={1.5} />}
                active={selectedFolders.size > 0} count={selectedFolders.size}
                onClick={() => setActiveDropdown(activeDropdown === "folders" ? null : "folders")} c={c}
              />
              {activeDropdown === "folders" && (
                <FilterDropdown c={c}>
                  <div className="px-[10px] pt-[4px] pb-[2px]">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: c.textFaint, letterSpacing: "0.5px", textTransform: "uppercase" }}>Folders</span>
                  </div>
                  {folders.map(f => (
                    <button key={f.id} onClick={() => toggleSet(setSelectedFolders, f.id)} className="flex items-center gap-[8px] w-full h-[32px] px-[10px] rounded-[8px] mx-[4px] transition-colors" style={{ width: "calc(100% - 8px)", backgroundColor: selectedFolders.has(f.id) ? (isDark ? "rgba(37,99,235,0.12)" : "#f0f4ff") : "transparent" }} onMouseEnter={e => { if (!selectedFolders.has(f.id)) e.currentTarget.style.backgroundColor = c.bgHover; }} onMouseLeave={e => { if (!selectedFolders.has(f.id)) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={f.color} /></svg>
                      <span className="flex-1 text-left truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{f.name}</span>
                      {selectedFolders.has(f.id) && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                  ))}
                </FilterDropdown>
              )}
            </div>
          )}

          {/* Title Only toggle */}
          {scope === "recordings" && (
            <FilterChip
              label="Title only"
              icon={<span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: titleOnly ? "#2563eb" : c.textMuted }}>Aa</span>}
              active={titleOnly}
              onClick={() => setTitleOnly(!titleOnly)} c={c}
            />
          )}

          {/* Transcription type */}
          {scope === "recordings" && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <FilterChip
                label="Type" hasChevron
                icon={<svg className="size-[12px]" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="3" height="10" rx="1.5" fill={selectedTypes.size > 0 ? "#2563eb" : (c.textMuted)} opacity="0.6" /><rect x="6.5" y="1" width="3" height="14" rx="1.5" fill={selectedTypes.size > 0 ? "#2563eb" : (c.textMuted)} /><rect x="12" y="5" width="3" height="6" rx="1.5" fill={selectedTypes.size > 0 ? "#2563eb" : (c.textMuted)} opacity="0.4" /></svg>}
                active={selectedTypes.size > 0} count={selectedTypes.size}
                onClick={() => setActiveDropdown(activeDropdown === "types" ? null : "types")} c={c}
              />
              {activeDropdown === "types" && (
                <FilterDropdown c={c}>
                  <div className="px-[10px] pt-[4px] pb-[2px]">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: c.textFaint, letterSpacing: "0.5px", textTransform: "uppercase" }}>Source</span>
                  </div>
                  {DOC_TYPES.map(dt => (
                    <button key={dt.id} onClick={() => toggleSet(setSelectedTypes, dt.id)} className="flex items-center gap-[8px] w-full h-[32px] px-[10px] rounded-[8px] mx-[4px] transition-colors" style={{ width: "calc(100% - 8px)", backgroundColor: selectedTypes.has(dt.id) ? (isDark ? "rgba(37,99,235,0.12)" : "#f0f4ff") : "transparent" }} onMouseEnter={e => { if (!selectedTypes.has(dt.id)) e.currentTarget.style.backgroundColor = c.bgHover; }} onMouseLeave={e => { if (!selectedTypes.has(dt.id)) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <div className="shrink-0"><SourceIcon source={dt.source} /></div>
                      <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{dt.label}</span>
                      {selectedTypes.has(dt.id) && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                  ))}
                </FilterDropdown>
              )}
            </div>
          )}

          {/* Creator */}
          {scope === "recordings" && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <FilterChip
                label="Creator" hasChevron
                icon={<User className="size-[12px]" style={{ color: selectedCreators.size > 0 ? "#2563eb" : c.textMuted }} strokeWidth={1.5} />}
                active={selectedCreators.size > 0} count={selectedCreators.size}
                onClick={() => setActiveDropdown(activeDropdown === "creators" ? null : "creators")} c={c}
              />
              {activeDropdown === "creators" && (
                <FilterDropdown c={c} width={200}>
                  {CREATOR_OPTIONS.map(cr => (
                    <button key={cr.id} onClick={() => toggleSet(setSelectedCreators, cr.id)} className="flex items-center gap-[8px] w-full h-[32px] px-[10px] rounded-[8px] mx-[4px] transition-colors" style={{ width: "calc(100% - 8px)", backgroundColor: selectedCreators.has(cr.id) ? (isDark ? "rgba(37,99,235,0.12)" : "#f0f4ff") : "transparent" }} onMouseEnter={e => { if (!selectedCreators.has(cr.id)) e.currentTarget.style.backgroundColor = c.bgHover; }} onMouseLeave={e => { if (!selectedCreators.has(cr.id)) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <User className="size-[13px]" style={{ color: selectedCreators.has(cr.id) ? "#2563eb" : c.textMuted }} strokeWidth={1.5} />
                      <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{cr.label}</span>
                      {selectedCreators.has(cr.id) && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                  ))}
                </FilterDropdown>
              )}
            </div>
          )}

          {/* Date */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <FilterChip
              label={datePreset ? DATE_PRESETS.find(p => p.id === datePreset)?.label || "Date" : selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Date"}
              hasChevron
              icon={<Calendar className="size-[12px]" style={{ color: (datePreset || selectedDate) ? "#2563eb" : c.textMuted }} strokeWidth={1.5} />}
              active={datePreset !== null || selectedDate !== null}
              onClick={() => setActiveDropdown(activeDropdown === "date" ? null : "date")} c={c}
            />
            {activeDropdown === "date" && (
              <DateFilterPanel
                selectedPreset={datePreset} selectedDate={selectedDate}
                onSelectPreset={(id) => { setDatePreset(id); setSelectedDate(null); }}
                onSelectDate={(d) => { setSelectedDate(d); setDatePreset(null); }}
                onClear={() => { setDatePreset(null); setSelectedDate(null); }}
                c={c} isDark={isDark}
              />
            )}
          </div>

          {/* Clear all */}
          {(hasFilters || titleOnly) && (
            <button onClick={clearAllFilters} className="flex items-center justify-center size-[28px] rounded-full transition-opacity hover:opacity-70 shrink-0" title="Clear all filters">
              <X className="size-[13px]" style={{ color: "#EF4444" }} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ─── Body ─── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Recording results */}
          {scope === "recordings" && (hasQuery || hasFilters) && recordingResults.length > 0 && (
            <div className="px-[10px] py-[6px]">
              <div className="px-[8px] pt-[6px] pb-[4px]">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textFaint, letterSpacing: "0.3px" }}>Best matches</span>
              </div>
              {recordingResults.map(r => (
                <button
                  key={r.id}
                  className="flex items-start gap-[10px] w-full px-[10px] py-[12px] rounded-[10px] transition-colors text-left group"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(37,99,235,0.06)" : "#f8faff"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div className="shrink-0 mt-[2px]"><SourceIcon source={r.source} /></div>
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textPrimary, lineHeight: "1.4" }}>
                      <HighlightText text={r.name} query={query} color="#2563eb" />
                    </div>
                    {/* Meta */}
                    <div className="flex items-center gap-[4px] mt-[2px] flex-wrap">
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textFaint }}>{r.date}</span>
                      <span style={{ color: c.textFaint, fontSize: "12px" }}>|</span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textFaint }}>{r.duration}</span>
                      <span style={{ color: c.textFaint, fontSize: "12px" }}>|</span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textFaint }}>{r.creator}</span>
                    </div>
                    {/* Summary with highlights */}
                    {!titleOnly && (
                      <div className="mt-[4px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted, lineHeight: "1.45" }}>
                        <HighlightText text={r.summary.length > 140 ? r.summary.slice(0, 140) + "..." : r.summary} query={query} color="#2563eb" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Folder results */}
          {scope === "folders" && (hasQuery || hasFilters) && folderResults.length > 0 && (
            <div className="px-[10px] py-[6px]">
              <div className="px-[8px] pt-[6px] pb-[4px]">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textFaint, letterSpacing: "0.3px" }}>Matching folders</span>
              </div>
              {folderResults.map(f => (
                <button
                  key={f.id}
                  className="flex items-center gap-[10px] w-full h-[40px] px-[10px] rounded-[10px] transition-colors"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={f.color} /></svg>
                  <div className="flex-1 min-w-0 text-left">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textPrimary }}>
                      <HighlightText text={f.name} query={query} color="#2563eb" />
                    </span>
                  </div>
                  <span className="shrink-0" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textFaint }}>{f.count} recordings</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {(hasQuery || hasFilters) && resultCount === 0 && (
            <div className="flex flex-col items-center justify-center py-[36px]">
              <Search className="size-[26px] mb-[8px]" style={{ color: c.textFaint }} strokeWidth={1} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textMuted }}>No results found</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textFaint, marginTop: "3px" }}>Try adjusting your search or filters</span>
            </div>
          )}

          {/* Recent searches */}
          {!hasQuery && !hasFilters && (
            <div className="px-[10px] py-[6px]">
              <div className="px-[8px] pt-[6px] pb-[4px]">
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textFaint, letterSpacing: "0.3px" }}>Recent searches</span>
              </div>
              {recentSearches.length === 0 ? (
                <div className="px-[8px] py-[14px] text-center">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textFaint, fontStyle: "italic" }}>No recent searches</span>
                </div>
              ) : recentSearches.map(rs => (
                <div
                  key={rs.id}
                  className="flex items-center gap-[8px] w-full h-[36px] px-[10px] rounded-[10px] transition-colors cursor-pointer group"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  onClick={() => setQuery(rs.query)}
                >
                  <Clock className="size-[13px] shrink-0" style={{ color: c.textFaint }} strokeWidth={1.5} />
                  <span className="flex-1 text-left truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{rs.query}</span>
                  <span className="shrink-0" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textFaint }}>{rs.timestamp}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeRecent(rs.id); }} className="size-[18px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: c.bgMuted }}>
                    <X className="size-[9px]" style={{ color: c.textMuted }} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="shrink-0 flex items-center gap-[12px] px-[16px] h-[36px]" style={{ borderTop: `1px solid ${c.border}` }}>
          {(hasQuery || hasFilters) && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11.5px", color: c.textFaint }}>
              {resultCount} result{resultCount !== 1 ? "s" : ""}
            </span>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-[6px]">
            <div className="flex items-center gap-[4px]">
              <kbd className="flex items-center justify-center h-[16px] px-[4px] rounded-[3px]" style={{ backgroundColor: c.bgMuted, border: `0.5px solid ${c.border}`, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "9px", color: c.textFaint }}>ctrl</kbd>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: c.textFaint }}>+</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: c.textFaint }}>Click to open in a new tab</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}