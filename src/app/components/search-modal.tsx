import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X, Calendar, FolderOpen, FileText, ChevronLeft, ChevronRight, Clock, Zap, ChevronDown, User } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-primary font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

/* ── Filter Chip with chevron ── */
function FilterChip({ label, icon, active, count, onClick, hasChevron }: {
  label: string; icon: React.ReactNode; active: boolean; count?: number; onClick: () => void; hasChevron?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-[5px] h-[28px] px-[10px] rounded-full shrink-0 ${active ? "bg-primary/[0.08] border-primary" : "bg-transparent"}`}
    >
      {icon}
      <span className={`font-medium text-[12px] ${active ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="font-semibold text-[12px] text-primary">
          {count}
        </span>
      )}
      {hasChevron && <Icon icon={ChevronDown} className={`size-[10px] ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2} />}
    </Button>
  );
}

/* ── Dropdown Panel ── */
function FilterDropdown({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <div
      className="absolute top-[calc(100%+6px)] left-0 rounded-[12px] py-[6px] z-10 overflow-hidden bg-popover border border-border shadow-md"
      style={{ width: width || 260 }}
    >
      {children}
    </div>
  );
}

/* ── Date Filter Panel ── */
function DateFilterPanel({ selectedPreset, selectedDate, onSelectPreset, onSelectDate, onClear }: {
  selectedPreset: string | null; selectedDate: Date | null;
  onSelectPreset: (id: string) => void; onSelectDate: (d: Date) => void; onClear: () => void;
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
    <div className="absolute top-[calc(100%+6px)] left-0 w-[300px] rounded-[12px] z-10 overflow-hidden bg-popover border border-border shadow-md">
      <div className="flex items-center justify-between px-[14px] pt-[12px] pb-[4px]">
        <span className="font-medium text-[12px] text-muted-foreground uppercase tracking-[0.5px]">Created</span>
        <Button variant="link" onClick={onClear} className="h-auto p-0 font-medium text-[12px]">Clear</Button>
      </div>
      <div className="px-[6px] py-[4px]">
        {DATE_PRESETS.map((p) => (
          <Button variant="ghost" key={p.id} onClick={() => onSelectPreset(p.id)} className={`flex items-center gap-[8px] w-full h-[34px] px-[10px] rounded-[8px] justify-start ${selectedPreset === p.id ? "bg-primary/5" : ""}`}>
            <Icon icon={Calendar} className={`size-[13px] ${selectedPreset === p.id ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
            <span className={`flex-1 text-left text-[13px] ${selectedPreset === p.id ? "font-medium text-primary" : "font-normal text-foreground"}`}>{p.label}</span>
            {p.pro && <Icon icon={Zap} className="size-[11px] text-primary" strokeWidth={2} fill="var(--primary)" />}
          </Button>
        ))}
      </div>
      <div className="h-px mx-[10px] bg-border" />
      <div className="flex items-center justify-between px-[14px] pt-[10px] pb-[6px]">
        <span className="font-semibold text-[13px] text-foreground">{MONTHS[calMonth].slice(0, 3)} {calYear}</span>
        <div className="flex items-center gap-[2px]">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="size-[26px] rounded-full"><Icon icon={ChevronLeft} className="size-[13px] text-muted-foreground" strokeWidth={1.5} /></Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="size-[26px] rounded-full"><Icon icon={ChevronRight} className="size-[13px] text-muted-foreground" strokeWidth={1.5} /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 px-[10px]">
        {DAYS.map((d) => (<div key={d} className="flex items-center justify-center h-[24px]"><span className="font-semibold text-[9px] text-muted-foreground tracking-[0.5px]">{d}</span></div>))}
      </div>
      <div className="grid grid-cols-7 px-[10px] pb-[12px]">
        {days.map((d, i) => {
          const sel = isSelected(d.date);
          const tod = isToday(d.date);
          return (
            <Button variant={sel ? "default" : "ghost"} key={i} onClick={() => onSelectDate(d.date)} className={`flex flex-col items-center justify-center h-[32px] rounded-full p-0 ${sel ? "bg-primary" : ""}`} style={{ opacity: d.current ? 1 : 0.3 }}>
              <span className={`text-[12px] ${tod || sel ? "font-semibold" : "font-normal"} ${sel ? "text-primary-foreground" : tod ? "text-primary" : "text-foreground"}`}>{d.day}</span>
              {tod && !sel && <div className="size-[3px] rounded-full -mt-[1px] bg-primary" />}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Scope Selector (Recordings / Folders) ── */
function ScopeSelector({ scope, onChange }: { scope: "recordings" | "folders"; onChange: (s: "recordings" | "folders") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <Button variant="outline"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-[6px] h-[30px] pl-[10px] pr-[6px] rounded-[8px] shrink-0 bg-muted"
      >
        <span className="font-medium text-[13px] text-foreground">
          {scope === "recordings" ? "Recordings" : "Folders"}
        </span>
        <Icon icon={ChevronDown} className="size-[12px] text-muted-foreground" strokeWidth={2} />
      </Button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-[160px] rounded-[10px] py-[4px] z-20 bg-popover border border-border shadow-md">
          <Button variant="ghost" onClick={() => { onChange("recordings"); setOpen(false); }} className={`flex items-center gap-[8px] w-full h-[34px] px-[12px] rounded-none justify-start ${scope === "recordings" ? "bg-primary/5" : ""}`}>
            <Icon icon={FileText} className={`size-[14px] ${scope === "recordings" ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
            <span className={`text-[13px] ${scope === "recordings" ? "font-medium text-primary" : "font-normal text-foreground"}`}>Recordings</span>
          </Button>
          <Button variant="ghost" onClick={() => { onChange("folders"); setOpen(false); }} className={`flex items-center gap-[8px] w-full h-[34px] px-[12px] rounded-none justify-start ${scope === "folders" ? "bg-primary/5" : ""}`}>
            <Icon icon={FolderOpen} className={`size-[14px] ${scope === "folders" ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
            <span className={`text-[13px] ${scope === "folders" ? "font-medium text-primary" : "font-normal text-foreground"}`}>Folders</span>
          </Button>
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
        className="relative w-[640px] rounded-[16px] overflow-visible flex flex-col bg-popover"
        style={{
          boxShadow: "0px 24px 64px rgba(0,0,0,0.12), 0px 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          maxHeight: "70vh",
        }}
        onClick={() => closeDropdowns()}
      >
        {/* ─── Search Header ─── */}
        <div className="flex items-center gap-[8px] px-[14px] h-[52px] shrink-0 border-b border-border">
          <ScopeSelector scope={scope} onChange={setScope} />
          <div className="flex items-center gap-[8px] flex-1 min-w-0" onClick={e => e.stopPropagation()}>
            <Icon icon={Search} className="size-[15px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={scope === "recordings" ? "Search recordings..." : "Search folders..."}
              className="flex-1 h-full bg-transparent border-0 shadow-none focus-visible:ring-0 min-w-0 text-[14px] font-normal px-0 rounded-none"
            />
          </div>
          <div className="flex items-center gap-[6px] shrink-0">
            {hasQuery && (
              <span className="font-normal text-[11px] text-muted-foreground">
                Enter ↵
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="size-[28px] rounded-full">
              <Icon icon={X} className="size-[15px] text-muted-foreground" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* ─── Filter Chips ─── */}
        <div className="flex items-center gap-[6px] px-[14px] py-[8px] shrink-0 flex-wrap border-b border-border">
          {/* Folders */}
          {scope === "recordings" && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <FilterChip
                label="Folders" hasChevron
                icon={<Icon icon={FolderOpen} className={`size-[12px] ${selectedFolders.size > 0 ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />}
                active={selectedFolders.size > 0} count={selectedFolders.size}
                onClick={() => setActiveDropdown(activeDropdown === "folders" ? null : "folders")}
              />
              {activeDropdown === "folders" && (
                <FilterDropdown>
                  <div className="px-[10px] pt-[4px] pb-[2px]">
                    <span className="font-medium text-[10px] text-muted-foreground tracking-[0.5px] uppercase">Folders</span>
                  </div>
                  {folders.map(f => (
                    <Button variant="ghost" key={f.id} onClick={() => toggleSet(setSelectedFolders, f.id)} className={`flex items-center gap-[8px] w-[calc(100%-8px)] h-[32px] px-[10px] rounded-[8px] mx-[4px] justify-start ${selectedFolders.has(f.id) ? "bg-primary/5" : ""}`}>
                      <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={f.color} /></svg>
                      <span className="flex-1 text-left truncate font-normal text-[13px] text-foreground">{f.name}</span>
                      {selectedFolders.has(f.id) && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </Button>
                  ))}
                </FilterDropdown>
              )}
            </div>
          )}

          {/* Title Only toggle */}
          {scope === "recordings" && (
            <FilterChip
              label="Title only"
              icon={<span className={`font-bold text-[11px] ${titleOnly ? "text-primary" : "text-muted-foreground"}`}>Aa</span>}
              active={titleOnly}
              onClick={() => setTitleOnly(!titleOnly)}
            />
          )}

          {/* Transcription type */}
          {scope === "recordings" && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <FilterChip
                label="Type" hasChevron
                icon={<svg className="size-[12px]" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="3" height="10" rx="1.5" fill={selectedTypes.size > 0 ? "var(--primary)" : "var(--muted-foreground)"} opacity="0.6" /><rect x="6.5" y="1" width="3" height="14" rx="1.5" fill={selectedTypes.size > 0 ? "var(--primary)" : "var(--muted-foreground)"} /><rect x="12" y="5" width="3" height="6" rx="1.5" fill={selectedTypes.size > 0 ? "var(--primary)" : "var(--muted-foreground)"} opacity="0.4" /></svg>}
                active={selectedTypes.size > 0} count={selectedTypes.size}
                onClick={() => setActiveDropdown(activeDropdown === "types" ? null : "types")}
              />
              {activeDropdown === "types" && (
                <FilterDropdown>
                  <div className="px-[10px] pt-[4px] pb-[2px]">
                    <span className="font-medium text-[10px] text-muted-foreground tracking-[0.5px] uppercase">Source</span>
                  </div>
                  {DOC_TYPES.map(dt => (
                    <Button variant="ghost" key={dt.id} onClick={() => toggleSet(setSelectedTypes, dt.id)} className={`flex items-center gap-[8px] w-[calc(100%-8px)] h-[32px] px-[10px] rounded-[8px] mx-[4px] justify-start ${selectedTypes.has(dt.id) ? "bg-primary/5" : ""}`}>
                      <div className="shrink-0"><SourceIcon source={dt.source} /></div>
                      <span className="flex-1 text-left font-normal text-[13px] text-foreground">{dt.label}</span>
                      {selectedTypes.has(dt.id) && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </Button>
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
                icon={<Icon icon={User} className={`size-[12px] ${selectedCreators.size > 0 ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />}
                active={selectedCreators.size > 0} count={selectedCreators.size}
                onClick={() => setActiveDropdown(activeDropdown === "creators" ? null : "creators")}
              />
              {activeDropdown === "creators" && (
                <FilterDropdown width={200}>
                  {CREATOR_OPTIONS.map(cr => (
                    <Button variant="ghost" key={cr.id} onClick={() => toggleSet(setSelectedCreators, cr.id)} className={`flex items-center gap-[8px] w-[calc(100%-8px)] h-[32px] px-[10px] rounded-[8px] mx-[4px] justify-start ${selectedCreators.has(cr.id) ? "bg-primary/5" : ""}`}>
                      <Icon icon={User} className={`size-[13px] ${selectedCreators.has(cr.id) ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
                      <span className="flex-1 text-left font-normal text-[13px] text-foreground">{cr.label}</span>
                      {selectedCreators.has(cr.id) && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </Button>
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
              icon={<Icon icon={Calendar} className={`size-[12px] ${(datePreset || selectedDate) ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />}
              active={datePreset !== null || selectedDate !== null}
              onClick={() => setActiveDropdown(activeDropdown === "date" ? null : "date")}
            />
            {activeDropdown === "date" && (
              <DateFilterPanel
                selectedPreset={datePreset} selectedDate={selectedDate}
                onSelectPreset={(id) => { setDatePreset(id); setSelectedDate(null); }}
                onSelectDate={(d) => { setSelectedDate(d); setDatePreset(null); }}
                onClear={() => { setDatePreset(null); setSelectedDate(null); }}
              />
            )}
          </div>

          {/* Clear all */}
          {(hasFilters || titleOnly) && (
            <Button variant="ghost" size="icon" onClick={clearAllFilters} className="size-[28px] rounded-full shrink-0" title="Clear all filters">
              <Icon icon={X} className="size-[13px] text-destructive" strokeWidth={2} />
            </Button>
          )}
        </div>

        {/* ─── Body ─── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Recording results */}
          {scope === "recordings" && (hasQuery || hasFilters) && recordingResults.length > 0 && (
            <div className="px-[10px] py-[6px]">
              <div className="px-[8px] pt-[6px] pb-[4px]">
                <span className="font-medium text-[11px] text-muted-foreground tracking-[0.3px]">Best matches</span>
              </div>
              {recordingResults.map(r => (
                <Button variant="ghost"
                  key={r.id}
                  className="flex items-start gap-[10px] w-full px-[10px] py-[12px] rounded-[10px] text-left group h-auto hover:bg-primary/[0.03] justify-start"
                >
                  <div className="shrink-0 mt-[2px]"><SourceIcon source={r.source} /></div>
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="font-medium text-[14px] text-foreground leading-[1.4]">
                      <HighlightText text={r.name} query={query} />
                    </div>
                    {/* Meta */}
                    <div className="flex items-center gap-[4px] mt-[2px] flex-wrap">
                      <span className="font-normal text-[12px] text-muted-foreground">{r.date}</span>
                      <span className="text-muted-foreground text-[12px]">|</span>
                      <span className="font-normal text-[12px] text-muted-foreground">{r.duration}</span>
                      <span className="text-muted-foreground text-[12px]">|</span>
                      <span className="font-normal text-[12px] text-muted-foreground">{r.creator}</span>
                    </div>
                    {/* Summary with highlights */}
                    {!titleOnly && (
                      <div className="mt-[4px] font-normal text-[13px] text-muted-foreground leading-[1.45]">
                        <HighlightText text={r.summary.length > 140 ? r.summary.slice(0, 140) + "..." : r.summary} query={query} />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Folder results */}
          {scope === "folders" && (hasQuery || hasFilters) && folderResults.length > 0 && (
            <div className="px-[10px] py-[6px]">
              <div className="px-[8px] pt-[6px] pb-[4px]">
                <span className="font-medium text-[11px] text-muted-foreground tracking-[0.3px]">Matching folders</span>
              </div>
              {folderResults.map(f => (
                <Button variant="ghost"
                  key={f.id}
                  className="flex items-center gap-[10px] w-full h-[40px] px-[10px] rounded-[10px] justify-start"
                >
                  <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={f.color} /></svg>
                  <div className="flex-1 min-w-0 text-left">
                    <span className="font-medium text-[14px] text-foreground">
                      <HighlightText text={f.name} query={query} />
                    </span>
                  </div>
                  <span className="shrink-0 font-normal text-[12px] text-muted-foreground">{f.count} recordings</span>
                </Button>
              ))}
            </div>
          )}

          {/* No results */}
          {(hasQuery || hasFilters) && resultCount === 0 && (
            <div className="flex flex-col items-center justify-center py-[36px]">
              <Icon icon={Search} className="size-[26px] mb-[8px] text-muted-foreground" strokeWidth={1} />
              <span className="font-medium text-[14px] text-muted-foreground">No results found</span>
              <span className="font-normal text-[12px] text-muted-foreground mt-[3px]">Try adjusting your search or filters</span>
            </div>
          )}

          {/* Recent searches */}
          {!hasQuery && !hasFilters && (
            <div className="px-[10px] py-[6px]">
              <div className="px-[8px] pt-[6px] pb-[4px]">
                <span className="font-medium text-[11px] text-muted-foreground tracking-[0.3px]">Recent searches</span>
              </div>
              {recentSearches.length === 0 ? (
                <div className="px-[8px] py-[14px] text-center">
                  <span className="font-normal text-[13px] text-muted-foreground italic">No recent searches</span>
                </div>
              ) : recentSearches.map(rs => (
                <div
                  key={rs.id}
                  className="flex items-center gap-[8px] w-full h-[36px] px-[10px] rounded-[10px] transition-colors cursor-pointer group hover:bg-accent"
                  onClick={() => setQuery(rs.query)}
                >
                  <Icon icon={Clock} className="size-[13px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span className="flex-1 text-left truncate font-normal text-[13px] text-foreground">{rs.query}</span>
                  <span className="shrink-0 font-normal text-[11px] text-muted-foreground">{rs.timestamp}</span>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeRecent(rs.id); }} className="size-[18px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-muted">
                    <Icon icon={X} className="size-[9px] text-muted-foreground" strokeWidth={2} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="shrink-0 flex items-center gap-[12px] px-[16px] h-[36px] border-t border-border">
          {(hasQuery || hasFilters) && (
            <span className="font-normal text-[11.5px] text-muted-foreground">
              {resultCount} result{resultCount !== 1 ? "s" : ""}
            </span>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-[6px]">
            <div className="flex items-center gap-[4px]">
              <kbd className="flex items-center justify-center h-[18px] px-[5px] rounded-[4px] bg-muted border border-border font-medium text-[10px] text-muted-foreground leading-none">Ctrl</kbd>
              <span className="font-normal text-[10px] text-muted-foreground">+</span>
              <span className="font-normal text-[10px] text-muted-foreground">Click to open in a new tab</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
