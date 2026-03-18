import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import svgPaths from "../../imports/svg-jcr72uvvch";
import { useStarred } from "./starred-context";
import { SourceIcon, type SourceType } from "./source-icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useTheme } from "./theme-context";
import { getDarkPalette } from "./dark-palette";
import { useFolders } from "./folder-context";
import { useLanguage } from "./language-context";
import { ChevronRight } from "lucide-react";

/* ══════════════════════════════════════════════
   Column Configuration Types
   ══════════════════════════════════════════════ */

type ColumnId = "template" | "lang" | "duration" | "date";

const COLUMN_LABEL_KEYS: Record<ColumnId, string> = {
  template: "table.template",
  lang: "table.colLanguage",
  duration: "table.duration",
  date: "table.colDateCreated",
};

const DEFAULT_COLUMN_ORDER: ColumnId[] = ["template", "lang", "duration", "date"];

/* ════════════���══��════════════════════════════��═
   Figma-exact Checkbox
   ═══════��════════════════════════════════��═════ */

function FigmaCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  const { isDark } = useTheme();
  return (
    <button onClick={onChange} className="relative size-[16px] shrink-0">
      {checked ? (
        <div className="absolute bg-[#2563eb] inset-[6.25%] rounded-[4px] flex items-center justify-center">
          <svg className="size-[10px]" fill="none" viewBox="0 0 16 11">
            <path clipRule="evenodd" d={svgPaths.p2d702f80} fill="white" fillRule="evenodd" />
          </svg>
        </div>
      ) : (
        <div className="absolute inset-[6.25%] rounded-[4px]" style={{ backgroundColor: isDark ? "#2a2a35" : "white" }}>
          <div aria-hidden className="absolute border border-solid inset-[-0.5px] pointer-events-none rounded-[4.5px]" style={{ borderColor: isDark ? "#4b4b5a" : "#c0c8d2", boxShadow: isDark ? "none" : "0px 2px 5px 0px rgba(60,66,87,0.08),0px 1px 1px 0px rgba(0,0,0,0.12)" }} />
        </div>
      )}
    </button>
  );
}

/* ═══════════════���═���════════════���═══════════════
   Row Actions (hover)
   ══════════════════════════════════════════════ */

function CopyToast({ text }: { text: string }) {
  return (
    <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[200] animate-[fadeInUp_0.25s_ease] pointer-events-none">
      <div className="flex items-center gap-[6px] h-[34px] px-[14px] rounded-full bg-[#1a1a1a] shadow-lg">
        <svg className="size-[14px] text-[#22C55E]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "white" }}>{text}</span>
      </div>
    </div>
  );
}

function RowActions({ isStarred, onStar, onEdit, onShare, onMoveFolder, onTrash, summary, tasksCount }: { isStarred: boolean; onStar: () => void; onEdit: () => void; onShare: () => void; onMoveFolder: () => void; onTrash: () => void; summary: string; tasksCount: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1500); });
    setMenuOpen(false);
  }

  const hoverBg = isDark ? "rgba(255,255,255,0.08)" : "#ebeef1";
  return (
    <div className="flex items-center gap-[2px] relative" ref={ref}>
      <button className="size-[28px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} title="Rename" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <svg className="size-[15px]" fill="none" viewBox="0 0 16 16"><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke={c.textMuted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button className="size-[28px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} title="Share" onClick={(e) => { e.stopPropagation(); onShare(); }}>
        <svg className="size-[15px]" fill="none" viewBox="0 0 16 16">
          <circle cx="12" cy="2.667" r="1.667" stroke={c.textMuted} strokeWidth="1.2"/>
          <circle cx="4" cy="8" r="1.667" stroke={c.textMuted} strokeWidth="1.2"/>
          <circle cx="12" cy="13.333" r="1.667" stroke={c.textMuted} strokeWidth="1.2"/>
          <path d="M5.58 6.94l4.84-2.82M10.42 11.88L5.58 9.06" stroke={c.textMuted} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
      <button className="size-[28px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} title={isStarred ? "Unstar" : "Star"} onClick={(e) => { e.stopPropagation(); onStar(); }}>
        <svg className="size-[15px]" fill="none" viewBox="0 0 16 16"><path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" stroke={isStarred ? "#F59E0B" : c.textMuted} fill={isStarred ? "#F59E0B" : "none"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button className="size-[28px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} title="More" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
        <svg className="size-[15px]" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="3" r="1.2" fill={c.textMuted} /><circle cx="8" cy="8" r="1.2" fill={c.textMuted} /><circle cx="8" cy="13" r="1.2" fill={c.textMuted} /></svg>
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-[calc(100%+4px)] w-[200px] rounded-[10px] py-[4px] z-50" style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(summary, "summary"); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="size-[15px] shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M3 11V3a1.5 1.5 0 011.5-1.5H11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{t("table.copySummary")}</span>
          </button>
          {tasksCount > 0 && (
            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(`${tasksCount} tasks`, "tasks"); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <svg className="size-[15px] shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.1" /><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{t("table.copyTasks")}</span>
            </button>
          )}
          <div className="h-px mx-[8px] my-[2px]" style={{ backgroundColor: c.border }} />
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMoveFolder(); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="size-[15px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" stroke={c.textMuted} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{t("table.moveToFolder")}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onTrash(); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="size-[15px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="#EF4444" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#EF4444" }}>{t("table.moveToTrash")}</span>
          </button>
        </div>
      )}
      {copied && <CopyToast text={t("common.copied")} />}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Multi-select Column Header Dropdown
   ══════════════════════════════════��═══════════ */

function ColumnHeaderDropdown({ label, options, selected, onToggle, align = "left" }: {
  label: string;
  options: { id: string; label: string; icon?: string; sourceIcon?: SourceType }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const filterCount = selected.size;
  const isFiltered = filterCount > 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-[3px] h-full transition-colors group">
        <span className="uppercase tracking-[0.3404px]" style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: isFiltered ? "#2563eb" : (isDark ? "#c9cdd3" : "#1a1f36") }}>
          {label}
        </span>
        {isFiltered && (
          <span className="ml-[2px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "10px", color: "#2563eb" }}>{filterCount}</span>
        )}
        <svg className={`size-[10px] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 10 10" style={{ color: isFiltered ? "#2563eb" : "#9ca3af" }}>
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`absolute top-[calc(100%+4px)] w-[220px] rounded-[10px] py-[6px] z-50 ${align === "right" ? "right-0" : "left-0"}`} style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
          {isFiltered && (
            <>
              <button onClick={() => { selected.forEach((id) => onToggle(id)); }} className="flex items-center gap-[8px] w-full px-[14px] h-[30px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <svg className="size-[12px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M12.5 3.5l-9 9M3.5 3.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textMuted }}>{t("table.clearFilter")}</span>
              </button>
              <div className="h-px mx-[8px] my-[3px]" style={{ backgroundColor: c.border }} />
            </>
          )}
          {options.map((opt) => {
            const isSelected = selected.has(opt.id);
            return (
              <button key={opt.id} onClick={() => onToggle(opt.id)} className="flex items-center gap-[8px] w-full px-[14px] h-[34px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-[#2563eb] border-[#2563eb]" : ""}`} style={isSelected ? {} : { backgroundColor: isDark ? "#2a2a35" : "white", borderColor: isDark ? "#4b4b5a" : "#d1d5db" }}>
                  {isSelected && <svg className="size-[10px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                {opt.sourceIcon && <div className="w-[18px] shrink-0 flex items-center justify-center"><SourceIcon source={opt.sourceIcon} /></div>}
                {opt.icon && !opt.sourceIcon && <span className="text-[14px] w-[18px] text-center shrink-0">{opt.icon}</span>}
                <span className="flex-1 text-left truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: isSelected ? 500 : 400, fontSize: "13px", color: isSelected ? "#2563eb" : c.textSecondary }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Sort header (Date column) */
function SortHeaderDropdown({ label, options, selected, onSelect, align = "left" }: {
  label: string; options: { id: string; label: string }[]; selected: string; onSelect: (id: string) => void; align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const isChanged = selected !== "newest";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-[3px] h-full transition-colors group">
        <span className="uppercase tracking-[0.3404px]" style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: isChanged ? "#2563eb" : c.textHeader }}>{label}</span>
        <svg className={`size-[10px] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 10 10" style={{ color: isChanged ? "#2563eb" : "#9ca3af" }}><path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className={`absolute top-[calc(100%+4px)] w-[170px] rounded-[10px] py-[6px] z-50 ${align === "right" ? "right-0" : "left-0"}`} style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
          {options.map((opt) => (
            <button key={opt.id} onClick={() => { onSelect(opt.id); setOpen(false); }} className="flex items-center gap-[8px] w-full px-[14px] h-[34px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <span className="flex-1 text-left truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: selected === opt.id ? 500 : 400, fontSize: "13px", color: selected === opt.id ? "#2563eb" : c.textSecondary }}>{opt.label}</span>
              {selected === opt.id && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════��════════
   Search
   ══════════════════════════════════════════════ */

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  useEffect(() => { function h(e: KeyboardEvent) { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); } } document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, []);
  return (
    <div className="relative flex items-center">
      <svg className="absolute left-[10px] size-[14px] text-[#9ca3af] pointer-events-none" fill="none" viewBox="0 0 16 16"><path d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <input ref={inputRef} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Search records..."} className="h-[30px] w-[200px] pl-[30px] pr-[52px] rounded-full outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary, backgroundColor: c.bgInput, borderWidth: "1px", borderStyle: "solid", borderColor: c.borderInput }} />
      <div className="absolute right-[8px] flex items-center gap-[2px] rounded-[4px] px-[5px] h-[18px] pointer-events-none" style={{ backgroundColor: c.bgMuted, border: `0.5px solid ${c.borderInput}` }}>
        <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: "#9ca3af", lineHeight: 1 }}>⌘K</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Language flag
   ══════════════════════════════════════════════ */

const languageFlags: Record<string, { flag: string; label: string }> = {
  en: { flag: "\u{1F1FA}\u{1F1F8}", label: "English" },
  ru: { flag: "\u{1F1F7}\u{1F1FA}", label: "Russian" },
  es: { flag: "\u{1F1EA}\u{1F1F8}", label: "Spanish" },
  de: { flag: "\u{1F1E9}\u{1F1EA}", label: "German" },
  fr: { flag: "\u{1F1EB}\u{1F1F7}", label: "French" },
  ja: { flag: "\u{1F1EF}\u{1F1F5}", label: "Japanese" },
};

function LanguageBadge({ lang }: { lang: string }) {
  const info = languageFlags[lang] ?? { flag: "\u{1F310}", label: lang };
  return <span className="text-[16px] leading-none" title={info.label}>{info.flag}</span>;
}

/* ══════════════════════════════════════════════
   Multi-select Action Bar
   ══════════════════════════════════════════════ */

function MultiSelectTextBtn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-[5px] h-[30px] px-[8px] rounded-full transition-opacity hover:opacity-70"
      style={{ backgroundColor: "transparent", border: "none" }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color }}>{label}</span>
    </button>
  );
}

function MultiSelectBar({ count, onCancel, onMoveFolder, onTrash, onCopySummary, onExport }: {
  count: number; onCancel: () => void; onMoveFolder: () => void; onTrash: () => void; onCopySummary: () => void; onExport: () => void;
}) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const barBg = isDark ? "rgba(37,99,235,0.1)" : "#f0f4ff";
  const barBorder = isDark ? "rgba(37,99,235,0.2)" : "#d6e0f5";
  const blue = "#2563eb";
  const red = "#EF4444";
  const hoverBg = isDark ? "rgba(255,255,255,0.08)" : "#f0f2f5";
  return (
    <div className="flex items-center gap-[4px] h-[36px] px-[4px]" style={{ backgroundColor: barBg, borderBottom: `1px solid ${barBorder}` }}>
      <button
        onClick={() => onCancel()}
        title="Deselect all"
        className="w-[40px] shrink-0 flex items-center justify-center transition-opacity hover:opacity-70"
      >
        <div className="size-[16px] rounded-[4px] bg-[#2563eb] flex items-center justify-center">
          <svg className="size-[10px]" fill="none" viewBox="0 0 16 11"><path clipRule="evenodd" d={svgPaths.p2d702f80} fill="white" fillRule="evenodd" /></svg>
        </div>
      </button>
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: c.textPrimary }}>{count} {t("table.selected")}</span>
      <div className="h-[20px] w-px ml-[2px]" style={{ backgroundColor: barBorder }} />
      <MultiSelectTextBtn label="Summary" color={blue} onClick={() => { onCopySummary(); setCopied("s"); setTimeout(() => setCopied(null), 1500); }} icon={<svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M3 11V3a1.5 1.5 0 011.5-1.5H11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>} />
      <MultiSelectTextBtn label="Folder" color={blue} onClick={onMoveFolder} icon={<svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
      <MultiSelectTextBtn label="Export" color={blue} onClick={onExport} icon={<svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M8 10V2M4.667 4.667L8 1.333l3.333 3.334" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 10v2.667A1.333 1.333 0 003.333 14h9.334A1.333 1.333 0 0014 12.667V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
      <MultiSelectTextBtn label="Trash" color={red} onClick={onTrash} icon={<svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
      <div className="flex-1" />
      <button onClick={onCancel} className="h-[30px] px-[12px] rounded-full transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textMuted }}>{t("common.cancel")}</span>
      </button>
      {copied && <CopyToast text={t("common.copied")} />}
    </div>
  );
}

/* ═════════════════════���═══════��════════════════
   Table Settings Popover
   ══════════════════════════════════════════════ */

/* ── Draggable Column Item ── */

function DraggableColumnItem({ col, index, isVisible, onToggle, moveColumn }: {
  col: ColumnId; index: number; isVisible: boolean; onToggle: () => void;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
}) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: "COLUMN_ITEM",
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: "COLUMN_ITEM",
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  preview(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-[8px] w-full px-[12px] h-[34px] rounded-[6px] mx-[2px] transition-all ${isDragging ? "opacity-40 bg-[#f0f4ff]" : "hover:bg-[#f6f8fa]"}`}
      style={{ width: "calc(100% - 4px)" }}
    >
      {/* Drag handle */}
      <div ref={(node) => { drag(node); }} className="shrink-0 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-[2px] w-[14px] h-[14px]" title="Drag to reorder">
        <div className="flex gap-[2px]"><div className="size-[2px] rounded-full bg-[#c4c9d2]" /><div className="size-[2px] rounded-full bg-[#c4c9d2]" /></div>
        <div className="flex gap-[2px]"><div className="size-[2px] rounded-full bg-[#c4c9d2]" /><div className="size-[2px] rounded-full bg-[#c4c9d2]" /></div>
        <div className="flex gap-[2px]"><div className="size-[2px] rounded-full bg-[#c4c9d2]" /><div className="size-[2px] rounded-full bg-[#c4c9d2]" /></div>
      </div>
      {/* Label */}
      <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: isVisible ? c.textSecondary : (isDark ? "#555" : "#b0b7c3") }}>
        {t(COLUMN_LABEL_KEYS[col])}
      </span>
      {/* Visibility toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 flex items-center justify-center size-[22px] rounded-[5px] transition-colors"
        style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        title={isVisible ? "Hide column" : "Show column"}
      >
        {isVisible ? (
          <svg className="size-[14px]" fill="none" viewBox="0 0 16 16" style={{ color: "#2563eb" }}>
            <path d="M1.333 8S3.333 3.333 8 3.333 14.667 8 14.667 8 12.667 12.667 8 12.667 1.333 8 1.333 8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        ) : (
          <svg className="size-[14px]" fill="none" viewBox="0 0 16 16" style={{ color: "#c4c9d2" }}>
            <path d="M6.586 6.586a2 2 0 002.828 2.828M2.458 2.458C1.227 3.393.333 4.667.333 4.667S2.333 9.333 7 9.333c.93 0 1.78-.188 2.542-.5M11.458 9.458C12.773 8.607 13.667 7.333 13.667 7.333S11.667 2.667 7 2.667c-.423 0-.833.04-1.225.114" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(1 1)" />
            <path d="M1.333 1.333l13.334 13.334" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ── Table Settings Popover ── */

function TableSettingsPopover({ viewMode, onViewChange, groupByDate, onGroupChange, columnOrder, hiddenColumns, onColumnOrderChange, onToggleColumnVisibility, onResetColumns }: {
  viewMode: "table" | "cards"; onViewChange: (v: "table" | "cards") => void;
  groupByDate: boolean; onGroupChange: (v: boolean) => void;
  columnOrder: ColumnId[]; hiddenColumns: Set<ColumnId>;
  onColumnOrderChange: (order: ColumnId[]) => void;
  onToggleColumnVisibility: (col: ColumnId) => void;
  onResetColumns: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const hasCustomization = groupByDate || viewMode === "cards" || hiddenColumns.size > 0 || JSON.stringify(columnOrder) !== JSON.stringify(DEFAULT_COLUMN_ORDER);

  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    const updated = [...columnOrder];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, removed);
    onColumnOrderChange(updated);
  }, [columnOrder, onColumnOrderChange]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-center size-[32px] rounded-full border transition-colors" style={{ borderColor: hasCustomization ? "#2563eb" : c.borderBtn, backgroundColor: hasCustomization ? (isDark ? "rgba(37,99,235,0.15)" : "#eff4ff") : (isDark ? "transparent" : "white") }} title="Table settings">
        <svg className="size-[16px]" fill="none" viewBox="0 0 24 24" style={{ color: hasCustomization ? "#2563eb" : "#6a7383" }}>
          <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <DndProvider backend={HTML5Backend}>
          <div className="absolute right-0 top-[calc(100%+6px)] w-[260px] rounded-[14px] py-[6px] z-50" style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
            {/* View mode */}
            <div className="px-[14px] py-[4px]">
              <button onClick={() => onViewChange(viewMode === "table" ? "cards" : "table")} className="flex items-center gap-[10px] w-full h-[34px] rounded-[6px] px-[4px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 ${viewMode === "cards" ? "bg-[#2563eb] border-[#2563eb]" : ""}`} style={viewMode === "cards" ? {} : { backgroundColor: isDark ? "#2a2a35" : "white", borderColor: isDark ? "#4b4b5a" : "#d1d5db" }}>
                  {viewMode === "cards" && <svg className="size-[9px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{t("table.cardView")}</span>
              </button>
            </div>
            {/* Group by date */}
            <div className="px-[14px] py-[2px]">
              <button onClick={() => onGroupChange(!groupByDate)} className="flex items-center gap-[10px] w-full h-[34px] rounded-[6px] px-[4px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 ${groupByDate ? "bg-[#2563eb] border-[#2563eb]" : ""}`} style={groupByDate ? {} : { backgroundColor: isDark ? "#2a2a35" : "white", borderColor: isDark ? "#4b4b5a" : "#d1d5db" }}>
                  {groupByDate && <svg className="size-[9px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{t("table.groupByDate")}</span>
              </button>
            </div>

            <div className="h-px mx-[12px] my-[6px]" style={{ backgroundColor: c.border }} />

            {/* Columns section */}
            <div className="px-[14px] mb-[4px]">
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("table.columns")}</p>
            </div>
            {/* Fixed: Name column (always visible) */}
            <div className="flex items-center gap-[8px] w-full px-[14px] h-[34px]">
              <div className="shrink-0 w-[14px]" />
              <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>
                {t("table.name")}
              </span>
              <div className="shrink-0 flex items-center justify-center size-[22px]">
                <svg className="size-[10px]" fill="none" viewBox="0 0 12 12" style={{ color: "#c4c9d2" }}>
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {/* Draggable columns */}
            <div className="px-[2px]">
              {columnOrder.map((col, idx) => (
                <DraggableColumnItem
                  key={col}
                  col={col}
                  index={idx}
                  isVisible={!hiddenColumns.has(col)}
                  onToggle={() => onToggleColumnVisibility(col)}
                  moveColumn={moveColumn}
                />
              ))}
            </div>

            {/* Reset */}
            {(hiddenColumns.size > 0 || JSON.stringify(columnOrder) !== JSON.stringify(DEFAULT_COLUMN_ORDER)) && (
              <>
                <div className="h-px mx-[12px] my-[6px]" style={{ backgroundColor: c.border }} />
                <div className="px-[14px] py-[2px]">
                  <button
                    onClick={onResetColumns}
                    className="flex items-center gap-[8px] w-full h-[32px] rounded-[6px] px-[4px] transition-colors"
                    style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}>
                      <path d="M2 7.333A6 6 0 018 2a6 6 0 016 6 6 6 0 01-6 6 5.98 5.98 0 01-4.243-1.757" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 3.333v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textMuted }}>{t("table.resetDefault")}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </DndProvider>
      )}
    </div>
  );
}

/* ══���═══════════════════════════════════════════
   Date separator + Stat badges + Inline editor
   ══════════════════════════════════════════════ */

function DateSeparator({ label }: { label: string }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  return <div className="flex items-center h-[36px] px-[16px]" style={{ backgroundColor: c.bgSubtle }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "12.5px", color: c.textPrimary }}>{label}</span></div>;
}

function StatBadge({ icon, count }: { icon: "tasks" | "screenshots"; count: number }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-[3px] h-[20px] px-[6px] rounded-[10px] shrink-0" style={{ backgroundColor: isDark ? "#1e1e26" : "#f3f4f6" }}>
      {icon === "tasks" ? (
        <svg className="size-[11px] shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg className="size-[11px] shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1" /><path d="M2 11l3-2.5 2 1.5 3.5-3L14 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textMuted }}>{count}</span>
    </div>
  );
}

/* Shared badge — outline pill matching screenshot */
function SharedBadge() {
  const { isDark } = useTheme();
  return (
    <span className="inline-flex items-center shrink-0 h-[17px] px-[6px] rounded-full"
      style={{ border: `1px solid ${isDark ? "rgba(59,130,246,0.4)" : "#bfdbfe"}`, backgroundColor: "transparent" }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#2563eb" }}>Shared</span>
    </span>
  );
}

function InlineNameEditor({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  return (
    <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (text.trim()) onSave(text.trim()); else onCancel(); } if (e.key === "Escape") onCancel(); }}
      onBlur={() => { if (text.trim() && text.trim() !== value) onSave(text.trim()); else onCancel(); }}
      className="w-full h-[26px] px-[6px] rounded-[4px] border border-[#2563eb] outline-none"
      style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textSecondary, backgroundColor: c.bgInput, letterSpacing: "-0.154px" }}
    />
  );
}

/* ═════════════════════════════════════════════��
   Card View
   ═══════════���══════════════════════════════════ */

function RecordCard({ record, isStarred, onStar }: { record: RecordRow; isStarred: boolean; onStar: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  return (
    <div className="rounded-[14px] p-[20px] transition-all" style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, cursor: "default" }}>
      <div className="flex items-start gap-[12px]">
        <div className="flex-1 min-w-0">
          <h3 className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "15px", lineHeight: "22px", color: c.textPrimary, letterSpacing: "-0.01em" }}>{record.name}</h3>
          <div className="flex items-center gap-[6px] mt-[4px] flex-wrap">
            <SourceIcon source={record.source} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#2563eb" }}>{record.time}</span>
            <span style={{ fontSize: "10px", color: isDark ? "#4b5563" : "#d1d5db" }}>&middot;</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textMuted }}>{record.duration}</span>
            <span style={{ fontSize: "10px", color: isDark ? "#4b5563" : "#d1d5db" }}>&middot;</span>
            <LanguageBadge lang={record.language} />
          </div>
        </div>
        {record.thumbnail && (
          <div className="shrink-0 w-[120px] h-[68px] rounded-[8px] overflow-hidden" style={{ backgroundColor: c.bgMuted }}>
            <img src={record.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="mt-[10px]">
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12.5px", lineHeight: "19px", color: isDark ? "#9ca3af" : "#4b5563", display: "-webkit-box", WebkitLineClamp: expanded ? 999 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{record.summary}</p>
        {record.summary.length > 120 && <button onClick={() => setExpanded(!expanded)} className="mt-[2px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12.5px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{expanded ? useLanguage().t("table.showLess") : useLanguage().t("table.showMore")}</button>}
      </div>
      <div className="flex items-center justify-between mt-[14px] pt-[12px]" style={{ borderTop: `1px solid ${c.borderMuted}` }}>
        <div className="flex items-center gap-[8px]">
          <div className="inline-flex items-center h-[22px] px-[8px] rounded-[4px]" style={{ backgroundColor: c.bgMuted }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textMuted }}>{record.template}</span></div>
          <button onClick={onStar} className="size-[24px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }}>
            <svg className="size-[13px]" fill="none" viewBox="0 0 16 16"><path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" stroke={isStarred ? "#F59E0B" : "#c0c5cc"} fill={isStarred ? "#F59E0B" : "none"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-[14px]">
          {record.tasks > 0 && <div className="flex items-center gap-[4px]"><svg className="size-[14px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textMuted }}>{record.tasks}</span></div>}
          {record.screenshots > 0 && <div className="flex items-center gap-[4px]"><svg className="size-[14px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1" /><path d="M2 11l3-2.5 2 1.5 3.5-3L14 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textMuted }}>{record.screenshots}</span></div>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Empty State
   ══════════════════════════════════════════════ */

function EmptyFilterState({ onClear }: { onClear: () => void }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-[56px] px-[24px]">
      <div className="size-[56px] rounded-full flex items-center justify-center mb-[16px]" style={{ backgroundColor: c.bgMuted }}>
        <svg className="size-[24px]" fill="none" viewBox="0 0 24 24" style={{ color: "#9ca3af" }}>
          <path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "15px", color: c.textPrimary, marginBottom: "6px" }}>{t("table.noResults")}</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#9ca3af", textAlign: "center", maxWidth: "280px", lineHeight: "20px" }}>{t("table.noResultsDesc")}</p>
      <button onClick={onClear} className="mt-[16px] flex items-center gap-[6px] h-[34px] px-[16px] rounded-full border transition-colors" style={{ borderColor: c.borderBtn, backgroundColor: isDark ? "transparent" : "white" }}>
        <svg className="size-[13px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}><path d="M12.5 3.5l-9 9M3.5 3.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>{t("table.clearAllFilters")}</span>
      </button>
    </div>
  );
}

function EmptyTabState({ tab }: { tab: string }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-[48px]">
      <div className="size-[48px] rounded-full flex items-center justify-center mb-[12px]" style={{ backgroundColor: c.bgMuted }}>
        {tab === "Trash" ? (
          <svg className="size-[22px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : tab === "Starred" ? (
          <svg className="size-[22px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg className="size-[22px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M14 14H2V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10l3-4 3 2 3-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textMuted }}>
        {tab === "Trash" ? t("table.trashEmpty") : tab === "Starred" ? t("table.noStarred") : t("table.noRecords")}
      </p>
    </div>
  );
}

/* ═══════════════���═══════════════��══════════════
   Create Folder Modal
   ══════════════════════════════════════════════ */

const folderColors = [
  { id: "blue", color: "#3B82F6" }, { id: "green", color: "#22C55E" }, { id: "amber", color: "#F59E0B" }, { id: "red", color: "#EF4444" },
  { id: "purple", color: "#8B5CF6" }, { id: "pink", color: "#EC4899" }, { id: "cyan", color: "#06B6D4" }, { id: "gray", color: "#6B7280" },
];

function CreateFolderModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  useEffect(() => { if (open) { setName(""); setSelectedColor("#3B82F6"); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[400px] overflow-hidden" style={{ backgroundColor: c.bgPopover, boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "17px", color: c.textPrimary }}>{t("folder.createNew")}</h2>
          <button onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }}><svg className="size-[16px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <div className="px-[24px] pt-[18px] pb-[8px]">
          <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary, display: "block", marginBottom: "6px" }}>{t("folder.name")}</label>
          <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } if (e.key === "Escape") onClose(); }} placeholder={t("folder.namePlaceholder")} className="w-full h-[40px] px-[14px] rounded-full outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all placeholder:text-[#b0b7c3]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: c.textSecondary, backgroundColor: c.bgInput, borderWidth: "1px", borderStyle: "solid", borderColor: c.borderInput }} />
          <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary, display: "block", marginTop: "18px", marginBottom: "8px" }}>{t("folder.color")}</label>
          <div className="flex items-center gap-[8px]">
            {folderColors.map((fc) => (
              <button key={fc.id} onClick={() => setSelectedColor(fc.color)} className="size-[28px] rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: fc.color, boxShadow: selectedColor === fc.color ? `0 0 0 2px ${c.bgPopover}, 0 0 0 4px ${fc.color}` : "none", transform: selectedColor === fc.color ? "scale(1.1)" : "scale(1)" }}>
                {selectedColor === fc.color && <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-[10px] mt-[20px] p-[12px] rounded-[12px]" style={{ backgroundColor: c.bgSubtle, border: `1px solid ${c.border}` }}>
            <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" fill={selectedColor} opacity="0.15" stroke={selectedColor} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: name.trim() ? c.textPrimary : "#b0b7c3" }}>{name.trim() || t("folder.name")}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <button onClick={onClose} className="h-[36px] px-[18px] rounded-full border transition-colors" style={{ borderColor: c.borderBtn, backgroundColor: isDark ? "transparent" : "white" }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>{t("common.cancel")}</span></button>
          <button onClick={() => { if (name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } }} disabled={!name.trim()} className="h-[36px] px-[18px] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: "#2563eb", color: "white" }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px" }}>{t("folder.create")}</span></button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════
   Move to Folder Dialog
   ═════════���══════════��═════════════════��═══════ */

interface FolderItem { id: string; name: string; color: string; children?: FolderItem[] }

const defaultFolders: FolderItem[] = [
  { id: "f1", name: "Client Meetings", color: "#3B82F6", children: [
    { id: "f1a", name: "Nexora", color: "#3B82F6" },
    { id: "f1b", name: "Zenifa", color: "#3B82F6" },
  ] },
  { id: "f2", name: "Internal Syncs", color: "#22C55E" },
  { id: "f3", name: "Product Demos", color: "#F59E0B" },
];

function FolderTreeItem({ folder, depth, selectedId, onSelect }: { folder: FolderItem; depth: number; selectedId: string | null; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedId === folder.id;
  return (
    <div>
      <button
        onClick={() => onSelect(folder.id)}
        className="flex items-center gap-[8px] w-full h-[38px] rounded-[8px] transition-colors"
        style={{ paddingLeft: `${12 + depth * 20}px`, paddingRight: "12px", backgroundColor: isSelected ? (isDark ? "rgba(37,99,235,0.12)" : "#eff4ff") : "transparent" }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = c.bgHover; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="size-[16px] shrink-0 flex items-center justify-center">
            <svg className={`size-[10px] transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 10 10" style={{ color: "#9ca3af" }}><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : <div className="w-[16px] shrink-0" />}
        <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" fill={folder.color} stroke={folder.color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="flex-1 text-left truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: isSelected ? 500 : 400, fontSize: "13.5px", color: isSelected ? "#2563eb" : c.textSecondary }}>{folder.name}</span>
        {isSelected && <svg className="size-[16px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      {hasChildren && expanded && folder.children!.map((child) => (
        <FolderTreeItem key={child.id} folder={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function MoveToFolderDialog({ open, onClose, count, onMove, onCreateFolder, folders: ctxFolders }: { open: boolean; onClose: () => void; count: number; onMove: (folderId: string) => void; onCreateFolder: () => void; folders?: { id: string; name: string; color: string }[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  useEffect(() => { if (open) setSelectedId(null); }, [open]);
  const allFolders = ctxFolders && ctxFolders.length > 0 ? ctxFolders.map(f => ({ ...f, children: undefined })) : defaultFolders;
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[420px] overflow-hidden" style={{ backgroundColor: c.bgPopover, boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[6px]">
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "17px", color: c.textPrimary }}>{t("folder.moveTitle", count, count !== 1 ? "s" : "")}</h2>
          <button onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }}><svg className="size-[16px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <p className="px-[24px] mb-[12px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted }}>{t("folder.chooseDestination")}</p>
        <div className="px-[12px] max-h-[280px] overflow-y-auto">
          {allFolders.map((f) => <FolderTreeItem key={f.id} folder={f} depth={0} selectedId={selectedId} onSelect={setSelectedId} />)}
        </div>
        <div className="px-[24px] pt-[12px]">
          <button onClick={onCreateFolder} className="flex items-center gap-[6px] h-[34px] px-[12px] rounded-full border border-dashed transition-colors w-full justify-center" style={{ borderColor: c.borderBtn, backgroundColor: isDark ? "transparent" : "white" }}>
            <svg className="size-[14px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textMuted }}>{t("folder.createNewFolder")}</span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <button onClick={onClose} className="h-[36px] px-[18px] rounded-full border transition-colors" style={{ borderColor: c.borderBtn, backgroundColor: isDark ? "transparent" : "white" }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>{t("common.cancel")}</span></button>
          <button onClick={() => { if (selectedId) { onMove(selectedId); onClose(); } }} disabled={!selectedId} className="h-[36px] px-[18px] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: "#2563eb", color: "white" }}><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px" }}>{t("folder.moveHere")}</span></button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═════════════════��════════════════════════════
   Share Config + Toggle + Dialog
   ══════════════════════════════════════════════ */

interface ShareConfig {
  isPublic: boolean;
  shareTranscript: boolean;
  shareAINotes: boolean;
  hideVideo: boolean;
  expiration: string;
  addPassword: boolean;
  searchIndexing: boolean;
}

const DEFAULT_SHARE_CONFIG: ShareConfig = {
  isPublic: false,
  shareTranscript: true,
  shareAINotes: true,
  hideVideo: false,
  expiration: "never",
  addPassword: false,
  searchIndexing: false,
};

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative inline-flex shrink-0 h-[22px] w-[40px] rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? "#2563eb" : "#d1d5db" }}
    >
      <span
        className="absolute size-[18px] rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)", top: "2px" }}
      />
    </button>
  );
}

const EXPIRATION_OPTIONS = [
  { id: "never", label: "never" },
  { id: "1d", label: "1 day" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];

function ShareDialog({ open, onClose, recordName, config, onSave }: {
  open: boolean; onClose: () => void; recordName: string; config: ShareConfig; onSave: (cfg: ShareConfig) => void;
}) {
  const [cfg, setCfg] = useState<ShareConfig>(config);
  const [copied, setCopied] = useState(false);
  const [expirationOpen, setExpirationOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const expirationRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  useEffect(() => { if (open) { setCfg(config); setPasswordValue(""); setShowPassword(false); } }, [open]);
  useEffect(() => {
    function h(e: MouseEvent) { if (expirationRef.current && !expirationRef.current.contains(e.target as Node)) setExpirationOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  function update<K extends keyof ShareConfig>(key: K, value: ShareConfig[K]) {
    const next = { ...cfg, [key]: value };
    setCfg(next);
    onSave(next);
  }

  function copyLink() {
    const mockUrl = `https://app.transcribetotext.ai/share/${Math.random().toString(36).slice(2, 10)}`;
    navigator.clipboard.writeText(mockUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    const next = { ...cfg, isPublic: true };
    setCfg(next);
    onSave(next);
  }

  if (!open) return null;

  const rowDivider: React.CSSProperties = { borderBottom: `1px solid ${c.border}` };
  const labelStyle: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: c.textSecondary };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" onClick={() => { onSave(cfg); onClose(); }} />
      <div className="relative rounded-[20px] w-[460px] overflow-hidden" style={{ backgroundColor: c.bgPopover, boxShadow: "0px 32px 72px rgba(0,0,0,0.22), 0px 4px 16px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-[24px] pt-[20px] pb-[16px]">
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "17px", color: c.textPrimary }}>Share publicly</h2>
          <div className="flex items-center gap-[2px]">
            
            <button
              className="size-[30px] rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              onClick={() => { onSave(cfg); onClose(); }}
              title="Close"
            >
              <svg className="size-[13px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Public sharing toggle — always visible */}
        <div className="mx-[16px] mb-[8px]">
          <div
            className="flex items-center gap-[14px] px-[16px] py-[13px] rounded-[12px] transition-all"
            style={{
              backgroundColor: cfg.isPublic ? (isDark ? "rgba(37,99,235,0.08)" : "#f0f5ff") : (isDark ? "#1e1e28" : "#f8f9fb"),
              border: `1px solid ${cfg.isPublic ? (isDark ? "rgba(37,99,235,0.25)" : "#c7d9ff") : c.border}`
            }}
          >
            <div className="size-[36px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.isPublic ? (isDark ? "rgba(37,99,235,0.15)" : "#dbeafe") : (isDark ? "#2a2a35" : "#eef0f3") }}>
              <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" style={{ color: cfg.isPublic ? "#2563eb" : c.textMuted }}>
                <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M3 12h18M12 3c-2.5 3-4 5.7-4 9s1.5 6 4 9M12 3c2.5 3 4 5.7 4 9s-1.5 6-4 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: cfg.isPublic ? (isDark ? "#93b4ff" : "#1d4ed8") : c.textPrimary }}>Public sharing</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textMuted }}>Anyone with the link can view without login</p>
            </div>
            <ToggleSwitch checked={cfg.isPublic} onChange={() => update("isPublic", !cfg.isPublic)} />
          </div>
        </div>

        {/* Expandable content — only when public sharing is ON */}
        {cfg.isPublic && (
          <>
            {/* What to share */}
            <div className="px-[24px] pt-[10px] pb-[4px]">
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.6px" }}>What to share</p>
              <div className="grid grid-cols-2 gap-[8px] mt-[10px]">
                <button
                  onClick={() => update("shareTranscript", !cfg.shareTranscript)}
                  className="flex items-center justify-between px-[12px] py-[11px] rounded-[10px] border transition-all"
                  style={{ borderColor: cfg.shareTranscript ? "#2563eb" : c.border, backgroundColor: cfg.shareTranscript ? (isDark ? "rgba(37,99,235,0.1)" : "#eff4ff") : "transparent" }}
                >
                  <div className="flex items-center gap-[8px]">
                    <svg className="size-[16px] shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: cfg.shareTranscript ? "#2563eb" : c.textMuted }}>
                      <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: cfg.shareTranscript ? "#2563eb" : c.textSecondary }}>Transcript</span>
                  </div>
                  <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 ${cfg.shareTranscript ? "bg-[#2563eb] border-[#2563eb]" : ""}`} style={cfg.shareTranscript ? {} : { backgroundColor: isDark ? "#2a2a35" : "white", borderColor: isDark ? "#4b4b5a" : "#d1d5db" }}>
                    {cfg.shareTranscript && <svg className="size-[9px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>
                <button
                  onClick={() => update("shareAINotes", !cfg.shareAINotes)}
                  className="flex items-center justify-between px-[12px] py-[11px] rounded-[10px] border transition-all"
                  style={{ borderColor: cfg.shareAINotes ? "#2563eb" : c.border, backgroundColor: cfg.shareAINotes ? (isDark ? "rgba(37,99,235,0.1)" : "#eff4ff") : "transparent" }}
                >
                  <div className="flex items-center gap-[8px]">
                    <svg className="size-[16px] shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: cfg.shareAINotes ? "#2563eb" : c.textMuted }}>
                      <path d="M4 6h16M4 10h10M4 14h12M4 18h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: cfg.shareAINotes ? "#2563eb" : c.textSecondary }}>AI Notes</span>
                  </div>
                  <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 ${cfg.shareAINotes ? "bg-[#2563eb] border-[#2563eb]" : ""}`} style={cfg.shareAINotes ? {} : { backgroundColor: isDark ? "#2a2a35" : "white", borderColor: isDark ? "#4b4b5a" : "#d1d5db" }}>
                    {cfg.shareAINotes && <svg className="size-[9px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>
              </div>
            </div>

            {/* Copy Link button */}
            <div className="px-[24px] pt-[14px] pb-[16px]">
              <button
                onClick={copyLink}
                className="w-full h-[44px] rounded-full flex items-center justify-center gap-[8px] transition-all"
                style={{ backgroundColor: copied ? "#16a34a" : "#2563eb", color: "white" }}
                onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1d4ed8"; }}
                onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLButtonElement).style.backgroundColor = copied ? "#16a34a" : "#2563eb"; }}
              >
                {copied ? (
                  <>
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px" }}>Link copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                      <path d="M6.667 8.667a3.333 3.333 0 004.893.52l2-2a3.333 3.333 0 00-4.713-4.713L7.78 3.54" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.333 7.333a3.333 3.333 0 00-4.893-.52l-2 2a3.333 3.333 0 004.713 4.713l1.06-1.06" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px" }}>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Settings rows */}
            <div style={{ borderTop: `1px solid ${c.border}` }}>
              {/* Hide video */}
              <div className="flex items-center justify-between h-[50px] px-[24px]" style={rowDivider}>
                <span style={labelStyle}>Hide video</span>
                <ToggleSwitch checked={cfg.hideVideo} onChange={() => update("hideVideo", !cfg.hideVideo)} />
              </div>

              {/* Link expiration */}
              <div className="flex items-center justify-between h-[50px] px-[24px]" style={rowDivider} ref={expirationRef}>
                <span style={labelStyle}>Link expiration</span>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpirationOpen(!expirationOpen); }}
                    className="flex items-center gap-[5px] h-[28px] px-[10px] rounded-full transition-colors"
                    style={{ backgroundColor: isDark ? "#2a2a35" : "#f0f2f5", border: `1px solid ${c.border}` }}
                  >
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>
                      {EXPIRATION_OPTIONS.find(o => o.id === cfg.expiration)?.label ?? "never"}
                    </span>
                    <svg className={`size-[12px] transition-transform ${expirationOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {expirationOpen && (
                    <div className="absolute right-0 bottom-[calc(100%+4px)] w-[140px] rounded-[10px] py-[4px] z-50" style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
                      {EXPIRATION_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={(e) => { e.stopPropagation(); update("expiration", opt.id); setExpirationOpen(false); }}
                          className="flex items-center justify-between w-full px-[14px] h-[34px] transition-colors"
                          style={{ backgroundColor: "transparent" }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: cfg.expiration === opt.id ? 500 : 400, fontSize: "13px", color: cfg.expiration === opt.id ? "#2563eb" : c.textSecondary }}>{opt.label}</span>
                          {cfg.expiration === opt.id && <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add password */}
              <div className="px-[24px]" style={cfg.addPassword ? {} : { borderBottom: "none" }}>
                <div className="flex items-center justify-between h-[50px]" style={cfg.addPassword ? rowDivider : {}}>
                  <div className="flex items-center gap-[8px]">
                    
                    <span style={labelStyle}>Add password</span>
                  </div>
                  <ToggleSwitch checked={cfg.addPassword} onChange={() => { update("addPassword", !cfg.addPassword); if (cfg.addPassword) setPasswordValue(""); }} />
                </div>
                {cfg.addPassword && (
                  <div className="pb-[14px]">
                    <div className="relative flex items-center">
                      <svg className="absolute left-[12px] size-[14px] pointer-events-none" fill="none" viewBox="0 0 24 24" style={{ color: c.textMuted }}>
                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a password…"
                        value={passwordValue}
                        onChange={e => setPasswordValue(e.target.value)}
                        className="w-full h-[38px] pl-[36px] pr-[42px] rounded-[10px] outline-none transition-all"
                        style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary, backgroundColor: isDark ? "#1e1e28" : "#f6f8fa", border: `1px solid ${c.border}` }}
                        onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.boxShadow = "none"; }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-[10px] size-[22px] rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg className="size-[13px]" fill="none" viewBox="0 0 24 24" style={{ color: c.textMuted }}>
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M3 3l18 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg className="size-[13px]" fill="none" viewBox="0 0 24 24" style={{ color: c.textMuted }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Bottom padding */}
        <div className="h-[16px]" />
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════ */

const tabs = ["Recent", "Starred", "Shared", "Trash"] as const;

interface RecordRow {
  id: string; name: string; iconColor: string; iconType: "square" | "circle" | "link"; duration: string;
  dateCreated: string; dateGroup: string; template: string; language: string; source: SourceType;
  summary: string; tasks: number; screenshots: number; time: string; thumbnail?: string;
}

const records: RecordRow[] = [
  { id: "2", name: "Nexora <> QL | Instance Daily Sync", iconColor: "#22C55E", iconType: "link", duration: "32 min", dateCreated: "03/13/2026, 15:06", dateGroup: "Yesterday, Mar 13", template: "Meeting Notes", language: "en", source: "google-meet", summary: "The team discussed the integration of Nexora and QL for daily sync. T and Sandeep agreed to stick to the original plan, with orders grouped within their platform and sent to the TMS. Kirill demonstrated the tendering process...", tasks: 6, screenshots: 34, time: "2:02 PM", thumbnail: "https://images.unsplash.com/photo-1759752394755-1241472b589d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGRhc2hib2FyZCUyMGFuYWx5dGljcyUyMHNjcmVlbnxlbnwxfHx8fDE3NzM0MTU2NTR8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "1", name: "QTMS Platform Walkthrough", iconColor: "#3B82F6", iconType: "square", duration: "43 min", dateCreated: "03/11/2026, 08:28", dateGroup: "Tuesday, Mar 11", template: "1 by 1", language: "en", source: "zoom", summary: "The meeting focused on integrating supplier orders directly into the TMS without involving the planning stage. Kirill Kuts demonstrated how to map facilities and manage orders...", tasks: 5, screenshots: 28, time: "2:02 PM", thumbnail: "https://images.unsplash.com/photo-1771054244019-96f9db9720b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGNvbmZlcmVuY2UlMjBtZWV0aW5nJTIwc2NyZWVufGVufDF8fHx8MTc3MzQ4NzQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "3", name: "\u0441\u043a\u0430\u0437\u0430\u043b\u0430", iconColor: "#3B82F6", iconType: "square", duration: "1 min 49s", dateCreated: "03/11/2026, 11:57", dateGroup: "Tuesday, Mar 11", template: "1 by 1", language: "ru", source: "microphone", summary: "\u041a\u043e\u0440\u043e\u0442\u043a\u0430\u044f \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u044f \u0437\u0430\u043c\u0435\u0442\u043a\u0430 \u0441 \u043e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435\u043c \u0442\u0435\u043a\u0443\u0449\u0438\u0445 \u0437\u0430\u0434\u0430\u0447 \u0438 \u043f\u043b\u0430\u043d\u043e\u0432 \u043d\u0430 \u043d\u0435\u0434\u0435\u043b\u044e.", tasks: 2, screenshots: 0, time: "11:57 AM" },
  { id: "4", name: "Small Talk", iconColor: "#3B82F6", iconType: "square", duration: "3 min 39s", dateCreated: "03/11/2026, 08:49", dateGroup: "Tuesday, Mar 11", template: "Interview", language: "en", source: "zoom", summary: "A brief casual conversation covering team updates and weekend plans.", tasks: 0, screenshots: 0, time: "8:49 AM" },
  { id: "5", name: "Integration and Processing Update", iconColor: "#3B82F6", iconType: "square", duration: "7 min", dateCreated: "03/11/2026, 07:58", dateGroup: "Tuesday, Mar 11", template: "Action Items", language: "en", source: "teams", summary: "The conversation involves multiple speakers discussing technical matters related to a project or system integration.", tasks: 3, screenshots: 0, time: "1:50 PM" },
  { id: "6", name: "Nexora quick guide: get transcription and AI summary", iconColor: "#EF4444", iconType: "circle", duration: "1 min 21s", dateCreated: "03/10/2026, 19:09", dateGroup: "Monday, Mar 10", template: "Summary", language: "en", source: "mp4", summary: "A walkthrough video demonstrating how to use the transcription platform to generate AI-powered summaries.", tasks: 1, screenshots: 1, time: "8:46 AM", thumbnail: "https://images.unsplash.com/photo-1721804295754-1905f69c86ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2dpc3RpY3MlMjB0cnVja3MlMjBmbGVldCUyMG9yYW5nZXxlbnwxfHx8fDE3NzM1MDA5NDh8MA&ixlib=rb-4.1.0&q=80&w=1080" },
];

/* cellTextStyle is computed inside TableRow to support dark mode */

const typeFilterOptions: { id: string; label: string; sourceIcon?: SourceType }[] = [
  { id: "google-meet", label: "Google Meet", sourceIcon: "google-meet" }, { id: "zoom", label: "Zoom", sourceIcon: "zoom" },
  { id: "teams", label: "Teams", sourceIcon: "teams" }, { id: "microphone", label: "Microphone", sourceIcon: "microphone" },
  { id: "mp4", label: "MP4 File", sourceIcon: "mp4" }, { id: "mp3", label: "MP3 File", sourceIcon: "mp3" },
  { id: "youtube", label: "YouTube", sourceIcon: "youtube" }, { id: "dropbox", label: "Dropbox", sourceIcon: "dropbox" },
];

const templateFilterOptions = [
  { id: "Meeting Notes", label: "Meeting Notes" }, { id: "1 by 1", label: "1 by 1" },
  { id: "Interview", label: "Interview" }, { id: "Action Items", label: "Action Items" }, { id: "Summary", label: "Summary" },
];

const langFilterOptions: { id: string; label: string; icon?: string }[] = [
  { id: "en", label: "English", icon: "\u{1F1FA}\u{1F1F8}" }, { id: "ru", label: "Russian", icon: "\u{1F1F7}\u{1F1FA}" },
  { id: "es", label: "Spanish", icon: "\u{1F1EA}\u{1F1F8}" }, { id: "de", label: "German", icon: "\u{1F1E9}\u{1F1EA}" },
  { id: "fr", label: "French", icon: "\u{1F1EB}\u{1F1F7}" },
];

const dateFilterOptions = [{ id: "newest", label: "Newest first" }, { id: "oldest", label: "Oldest first" }];

/* ══════════════════════════════════════════════
   Saved View type + tab component
   ════════��═════════════════════════════════════ */

interface SavedView {
  id: string; name: string; typeFilter: Set<string>; templateFilter: Set<string>; langFilter: Set<string>; dateSort: string;
}

function SavedViewTab({ view, isActive, onLoad, onRename, onDelete }: { view: SavedView; isActive: boolean; onLoad: () => void; onRename: (name: string) => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setMenuOpen(false); } } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  return (
    <div className="flex flex-col items-center relative pb-[8px] group" ref={ref}>
      {editing ? (
        <input
          autoFocus
          defaultValue={view.name}
          className="h-[22px] w-[90px] px-[4px] rounded-[4px] border border-[#2563eb] outline-none"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary, backgroundColor: c.bgInput }}
          onKeyDown={(e) => { if (e.key === "Enter") { onRename((e.target as HTMLInputElement).value.trim() || view.name); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          onBlur={(e) => { onRename(e.target.value.trim() || view.name); setEditing(false); }}
        />
      ) : (
        <button onClick={onLoad} style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "14px", letterSpacing: "-0.154px", color: isActive ? "#2563eb" : "#697386" }}>
          {view.name}
        </button>
      )}
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#2563eb]" />}

      {/* Hover pencil icon */}
      {!editing && (
        <div className="absolute -right-[20px] top-[2px] opacity-0 group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="size-[18px] rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: "transparent" }}>
            <svg className="size-[10px]" fill="none" viewBox="0 0 16 16"><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}

      {/* Edit/Delete dropdown */}
      {menuOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+4px)] w-[140px] rounded-[10px] py-[4px] z-50" style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
          <button onClick={() => { setMenuOpen(false); setEditing(true); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="size-[13px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{t("common.rename")}</span>
          </button>
          <button onClick={() => { setMenuOpen(false); onDelete(); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="size-[13px]" fill="none" viewBox="0 0 16 16" style={{ color: "#EF4444" }}><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#EF4444" }}>{t("common.delete")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═════════��════════════════════════════���═══════
   Main Component
   ══════════════════════════════════════════════ */

export function RecordsTable() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t } = useLanguage();
  const { folders: userFolders, addFolder: addFolderToContext, folderAssignments, assignToFolder } = useFolders();
  const [activeTab, setActiveTab] = useState<string>("Recent");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [templateFilter, setTemplateFilter] = useState<Set<string>>(new Set());
  const [langFilter, setLangFilter] = useState<Set<string>>(new Set());
  const [dateSort, setDateSort] = useState("newest");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [groupByDate, setGroupByDate] = useState(false);
  const [trashedIds, setTrashedIds] = useState<Set<string>>(new Set());
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>([...DEFAULT_COLUMN_ORDER]);
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnId>>(new Set());
  const [sharedConfigs, setSharedConfigs] = useState<Map<string, ShareConfig>>(new Map());
  const [shareDialogRecord, setShareDialogRecord] = useState<string | null>(null);
  const { starred, toggleStar, renameRecord, getName } = useStarred();

  function handleSaveShare(recordId: string, cfg: ShareConfig) {
    setSharedConfigs(prev => { const next = new Map(prev); if (cfg.isPublic) { next.set(recordId, cfg); } else { next.delete(recordId); } return next; });
  }

  function toggleColumnVisibility(col: ColumnId) {
    setHiddenColumns((prev) => { const next = new Set(prev); if (next.has(col)) next.delete(col); else next.add(col); return next; });
  }
  function resetColumns() {
    setColumnOrder([...DEFAULT_COLUMN_ORDER]);
    setHiddenColumns(new Set());
  }
  const visibleColumns = columnOrder.filter((c) => !hiddenColumns.has(c));

  function toggleSetItem(set: Set<string>, id: string): Set<string> { const next = new Set(set); if (next.has(id)) next.delete(id); else next.add(id); return next; }
  function toggleRow(id: string) { setSelectedRows((prev) => toggleSetItem(prev, id)); }
  function toggleAll() {
    if (allSelected) { setSelectedRows(new Set()); setAllSelected(false); }
    else { setSelectedRows(new Set(filteredRecords.map((r) => r.id))); setAllSelected(true); }
  }
  function clearSelection() { setSelectedRows(new Set()); setAllSelected(false); }
  function clearAllFilters() { setSearchQuery(""); setTypeFilter(new Set()); setTemplateFilter(new Set()); setLangFilter(new Set()); setDateSort("newest"); }
  const hasActiveFilters = searchQuery !== "" || typeFilter.size > 0 || templateFilter.size > 0 || langFilter.size > 0;
  const showSaveView = (typeFilter.size > 0 || templateFilter.size > 0 || langFilter.size > 0) && !activeTab.startsWith("sv_");
  function trashSelected() { setTrashedIds((prev) => { const next = new Set(prev); selectedRows.forEach((id) => next.add(id)); return next; }); clearSelection(); }
  function trashOne(id: string) { setTrashedIds((prev) => { const next = new Set(prev); next.add(id); return next; }); }
  function restoreFromTrash(id: string) { setTrashedIds((prev) => { const next = new Set(prev); next.delete(id); return next; }); }

  function saveCurrentView() {
    const id = "sv_" + Date.now();
    const newView: SavedView = { id, name: "My View", typeFilter: new Set(typeFilter), templateFilter: new Set(templateFilter), langFilter: new Set(langFilter), dateSort };
    setSavedViews((prev) => [...prev, newView]);
    // Clear filters from current tab and switch to new view
    clearAllFilters();
    setActiveTab(id);
    // Load the saved filters into active state
    setTypeFilter(new Set(newView.typeFilter));
    setTemplateFilter(new Set(newView.templateFilter));
    setLangFilter(new Set(newView.langFilter));
    setDateSort(newView.dateSort);
  }
  function loadView(view: SavedView) { setTypeFilter(new Set(view.typeFilter)); setTemplateFilter(new Set(view.templateFilter)); setLangFilter(new Set(view.langFilter)); setDateSort(view.dateSort); setActiveTab(view.id); }
  function renameView(id: string, name: string) { setSavedViews((prev) => prev.map((v) => v.id === id ? { ...v, name } : v)); setEditingViewId(null); }
  function deleteView(id: string) { setSavedViews((prev) => prev.filter((v) => v.id !== id)); }

  const displayRecords = records.map((r) => ({ ...r, name: getName(r.id, r.name) }));
  const activeRecords = displayRecords.filter((r) => !trashedIds.has(r.id));
  const trashRecords = displayRecords.filter((r) => trashedIds.has(r.id));

  // Shared records (mock: first 3 records are "shared with me")
  const sharedIds = new Set(records.slice(0, 3).map(r => r.id));

  let filteredRecords = activeTab === "Trash" ? trashRecords : activeRecords;
  if (searchQuery) filteredRecords = filteredRecords.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (activeTab === "Starred") filteredRecords = filteredRecords.filter((r) => starred.has(r.id));
  if (activeTab === "Shared") filteredRecords = filteredRecords.filter((r) => sharedIds.has(r.id));
  if (activeTab !== "Trash") {
    if (typeFilter.size > 0) filteredRecords = filteredRecords.filter((r) => typeFilter.has(r.source));
    if (templateFilter.size > 0) filteredRecords = filteredRecords.filter((r) => templateFilter.has(r.template));
    if (langFilter.size > 0) filteredRecords = filteredRecords.filter((r) => langFilter.has(r.language));
  }
  if (dateSort === "newest") filteredRecords = [...filteredRecords].sort((a, b) => b.dateCreated.localeCompare(a.dateCreated));
  else filteredRecords = [...filteredRecords].sort((a, b) => a.dateCreated.localeCompare(b.dateCreated));

  const dateGroups: { label: string; records: typeof filteredRecords }[] = [];
  if (groupByDate) {
    const seen = new Map<string, typeof filteredRecords>();
    for (const r of filteredRecords) { const existing = seen.get(r.dateGroup); if (existing) existing.push(r); else seen.set(r.dateGroup, [r]); }
    for (const [label, recs] of seen) dateGroups.push({ label, records: recs });
  }

  const hasSelection = selectedRows.size > 0 && activeTab !== "Trash";

  const sharedCount = activeRecords.filter((r) => sharedIds.has(r.id)).length;

  // Tab counts
  const recentCount = activeRecords.length;
  const starredCount = activeRecords.filter((r) => starred.has(r.id)).length;
  const trashCount = trashedIds.size;

  return (
    <div className="mt-[32px]">
      {/* Header: Title + Search + Settings + Add Folder */}
      <div className="flex items-center gap-[12px] mb-[16px]">
        
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "18px", color: c.textPrimary }}>{t("table.myRecords")}</p>
        <button className="flex items-center transition-opacity cursor-pointer ml-[3px]" style={{ backgroundColor: "transparent" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.6"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          <ChevronRight className="size-[16px]" style={{ color: c.textPrimary }} strokeWidth={1.5} />
        </button>
        <div className="flex-1" />
        <button onClick={() => setFolderModalOpen(true)} className="flex items-center gap-[6px] h-[32px] px-[14px] rounded-full transition-colors cursor-pointer" style={{ backgroundColor: "transparent", border: "1px solid #d1d5db" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
          <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 7.333v4M6 9.333h4" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#1a1a1a" }}>{t("folder.addFolder")}</span>
        </button>
      </div>

      <CreateFolderModal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} onCreate={(name, color) => { addFolderToContext(name, color); }} />
      <MoveToFolderDialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} count={selectedRows.size} onMove={(folderId) => { assignToFolder(Array.from(selectedRows), folderId); clearSelection(); }} onCreateFolder={() => { setMoveDialogOpen(false); setFolderModalOpen(true); }} folders={userFolders} />
      {shareDialogRecord && (
        <ShareDialog
          open={!!shareDialogRecord}
          onClose={() => setShareDialogRecord(null)}
          recordName={displayRecords.find(r => r.id === shareDialogRecord)?.name ?? ""}
          config={sharedConfigs.get(shareDialogRecord) ?? DEFAULT_SHARE_CONFIG}
          onSave={(cfg) => handleSaveShare(shareDialogRecord, cfg)}
        />
      )}

      {/* Tabs */}
      <div className="relative">
        <div className="flex items-center">
          <div className="flex items-start gap-[24px] flex-1 min-w-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const isTrash = tab === "Trash";
              const count = tab === "Recent" ? recentCount : tab === "Starred" ? starredCount : tab === "Shared" ? sharedCount : trashCount;
              return (
                <button key={tab} onClick={() => { setActiveTab(tab); clearSelection(); clearAllFilters(); }} className="flex flex-col items-center relative pb-[8px]">
                  <span className="flex items-center gap-[4px]" style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "14px", letterSpacing: "-0.154px", color: isActive ? (isTrash ? "#EF4444" : "#2563eb") : "#697386", transition: "color 0.15s" }}>
                    {tab === "Recent" ? t("table.recent") : tab === "Starred" ? t("table.starred") : tab === "Shared" ? t("table.shared") : t("table.trash")}
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: isActive ? (isTrash ? "#EF4444" : "#2563eb") : "#9ca3af" }}>{count}</span>
                  </span>
                  {isActive && <div className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full ${isTrash ? "bg-[#EF4444]" : "bg-[#2563eb]"}`} />}
                </button>
              );
            })}

            {/* Saved views */}
            {savedViews.map((view) => {
              const isActive = activeTab === view.id;
              return (
                <SavedViewTab key={view.id} view={view} isActive={isActive} onLoad={() => loadView(view)} onRename={(name) => renameView(view.id, name)} onDelete={() => { deleteView(view.id); if (isActive) { setActiveTab("Recent"); clearAllFilters(); } }} />
              );
            })}

            {/* Save View button */}
            {showSaveView && (
              <button onClick={saveCurrentView} className="flex items-center gap-[4px] pb-[8px] opacity-80 hover:opacity-100 transition-opacity">
                <svg className="size-[12px]" fill="none" viewBox="0 0 16 16" style={{ color: "#2563eb" }}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#2563eb" }}>{t("table.saveView")}</span>
              </button>
            )}
          </div>

          {/* Clear filter indicator */}
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="flex items-center gap-[5px] h-[26px] px-[10px] rounded-full border transition-colors shrink-0 ml-[12px] mb-[4px]" style={{ borderColor: c.border, backgroundColor: c.bgSubtle }}>
              <svg className="size-[11px]" fill="none" viewBox="0 0 16 16" style={{ color: "#9ca3af" }}><path d="M12.5 3.5l-9 9M3.5 3.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11.5px", color: c.textMuted }}>
                {(typeFilter.size > 0 ? 1 : 0) + (templateFilter.size > 0 ? 1 : 0) + (langFilter.size > 0 ? 1 : 0) + (searchQuery ? 1 : 0)} {t("table.filters")}
              </span>
            </button>
          )}

        </div>
        <div className="h-px" style={{ backgroundColor: c.border }} />
      </div>

      {/* ══════ TABLE VIEW ══════ */}
      {viewMode === "table" && (
        <div>
          <div className="w-full overflow-visible" style={{ backgroundColor: c.bgCard, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
            {/* Header row — replaced by MultiSelectBar when rows are selected */}
            {hasSelection ? (
              <MultiSelectBar count={selectedRows.size} onCancel={clearSelection} onMoveFolder={() => setMoveDialogOpen(true)} onTrash={trashSelected} onCopySummary={() => { const texts = records.filter(r => selectedRows.has(r.id)).map(r => `${r.name}: ${r.summary}`).join("\n\n"); navigator.clipboard.writeText(texts); }} onExport={() => { const data = records.filter(r => selectedRows.has(r.id)).map(r => ({ name: r.name, summary: r.summary, tasks: r.tasks, duration: r.duration, date: r.dateCreated })); const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "export.json"; a.click(); URL.revokeObjectURL(url); }} />
            ) : (
            <div className="flex items-center h-[36px]" style={{ borderBottom: `1px solid ${c.border}` }}>
              <div className="w-[40px] shrink-0 flex items-center justify-center"><FigmaCheckbox checked={allSelected} onChange={toggleAll} /></div>
              <div className="flex-[2.2] min-w-0 px-[12px] flex items-center"><ColumnHeaderDropdown label={t("table.type")} options={typeFilterOptions} selected={typeFilter} onToggle={(id) => setTypeFilter((s) => toggleSetItem(s, id))} /></div>
              {/* Star column — no title */}
              <div className="w-[32px] shrink-0" />
              {visibleColumns.map((col) => {
                if (col === "template") return <div key={col} className="flex-[1] min-w-0 px-[12px] flex items-center"><ColumnHeaderDropdown label={t("table.template")} options={templateFilterOptions} selected={templateFilter} onToggle={(id) => setTemplateFilter((s) => toggleSetItem(s, id))} /></div>;
                if (col === "lang") return <div key={col} className="w-[50px] shrink-0 px-[6px] flex items-center justify-center"><ColumnHeaderDropdown label={t("table.lang")} options={langFilterOptions} selected={langFilter} onToggle={(id) => setLangFilter((s) => toggleSetItem(s, id))} align="right" /></div>;
                if (col === "duration") return <div key={col} className="w-[80px] shrink-0 px-[8px] flex items-center"><span className="uppercase tracking-[0.3404px]" style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textHeader }}>{t("table.duration")}</span></div>;
                if (col === "date") return <div key={col} className="w-[130px] shrink-0 px-[8px] flex items-center"><SortHeaderDropdown label={t("table.date")} options={[{ id: "newest", label: t("table.newestFirst") }, { id: "oldest", label: t("table.oldestFirst") }]} selected={dateSort} onSelect={setDateSort} align="right" /></div>;
                return null;
              })}
            </div>
            )}

            {filteredRecords.length === 0 ? (
              hasActiveFilters ? <EmptyFilterState onClear={clearAllFilters} /> : <EmptyTabState tab={activeTab} />
            ) : groupByDate ? (
              dateGroups.map((group) => (
                <div key={group.label}>
                  <DateSeparator label={group.label} />
                  {group.records.map((record) => (
                    <TableRow key={record.id} record={record} visibleColumns={visibleColumns} isSelected={selectedRows.has(record.id)} isStarred={starred.has(record.id)} isShared={sharedConfigs.has(record.id)} isHovered={hoveredRow === record.id} isEditing={editingId === record.id} isTrash={activeTab === "Trash"}
                      onToggleRow={() => toggleRow(record.id)} onMouseEnter={() => setHoveredRow(record.id)} onMouseLeave={() => setHoveredRow(null)}
                      onStar={() => toggleStar(record.id, { id: record.id, name: record.name, iconColor: record.iconColor, iconType: record.iconType, source: record.source })}
                      onShare={() => setShareDialogRecord(record.id)}
                      onEdit={() => setEditingId(record.id)} onSaveName={(n) => { renameRecord(record.id, n); setEditingId(null); }} onCancelEdit={() => setEditingId(null)}
                      onRestore={() => restoreFromTrash(record.id)} onMoveFolder={() => { setSelectedRows(new Set([record.id])); setMoveDialogOpen(true); }} onTrash={() => trashOne(record.id)}
                    />
                  ))}
                </div>
              ))
            ) : (
              <>
                {activeTab === "Recent" && userFolders.map((folder) => (
                  <div key={folder.id} className="flex items-center h-[40px] transition-colors cursor-pointer" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <div className="w-[40px] shrink-0" />
                    <div className="flex-[2.2] min-w-0 px-[12px] flex items-center gap-[8px]">
                      <svg className="size-[16px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" fill={folder.color} stroke={folder.color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textSecondary }}>{folder.name}</span>
                    </div>
                    {/* Star column placeholder */}
                    <div className="w-[32px] shrink-0" />
                    {visibleColumns.map((col) => (
                      <div key={col} className={col === "time" ? "flex-[1.3] min-w-0 px-[12px]" : col === "duration" ? "flex-[0.8] min-w-0 px-[12px]" : col === "language" ? "flex-[0.6] min-w-0 px-[12px]" : col === "template" ? "flex-[1.2] min-w-0 px-[12px]" : "flex-[0.8] min-w-0 px-[12px]"}>
                        {col === "time" && folder.createdAt ? <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted }}>{new Date(folder.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span> : null}
                      </div>
                    ))}
                    <div className="w-[100px] shrink-0" />
                  </div>
                ))}
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} record={record} visibleColumns={visibleColumns} isSelected={selectedRows.has(record.id)} isStarred={starred.has(record.id)} isShared={sharedConfigs.has(record.id)} isHovered={hoveredRow === record.id} isEditing={editingId === record.id} isTrash={activeTab === "Trash"}
                    onToggleRow={() => toggleRow(record.id)} onMouseEnter={() => setHoveredRow(record.id)} onMouseLeave={() => setHoveredRow(null)}
                    onStar={() => toggleStar(record.id, { id: record.id, name: record.name, iconColor: record.iconColor, iconType: record.iconType, source: record.source })}
                    onShare={() => setShareDialogRecord(record.id)}
                    onEdit={() => setEditingId(record.id)} onSaveName={(n) => { renameRecord(record.id, n); setEditingId(null); }} onCancelEdit={() => setEditingId(null)}
                    onRestore={() => restoreFromTrash(record.id)} onMoveFolder={() => { setSelectedRows(new Set([record.id])); setMoveDialogOpen(true); }} onTrash={() => trashOne(record.id)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════ CARD VIEW ══════ */}
      {viewMode === "cards" && (
        <div className="pb-[24px]">
          {groupByDate ? (
            dateGroups.map((group) => (
              <div key={group.label} className="mb-[8px]">
                <div className="flex items-center gap-[6px] py-[10px] mb-[4px]"><span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: c.textPrimary }}>{group.label}</span></div>
                <div className="grid grid-cols-2 gap-[12px]">
                  {group.records.map((record) => <RecordCard key={record.id} record={record} isStarred={starred.has(record.id)} onStar={() => toggleStar(record.id, { id: record.id, name: record.name, iconColor: record.iconColor, iconType: record.iconType, source: record.source })} />)}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-2 gap-[12px]">
              {filteredRecords.length === 0 ? (
                <div className="col-span-2">{hasActiveFilters ? <EmptyFilterState onClear={clearAllFilters} /> : <EmptyTabState tab={activeTab} />}</div>
              ) : filteredRecords.map((record) => <RecordCard key={record.id} record={record} isStarred={starred.has(record.id)} onStar={() => toggleStar(record.id, { id: record.id, name: record.name, iconColor: record.iconColor, iconType: record.iconType, source: record.source })} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Table Row
   ══════════════════════════════════════════════ */

function TableRow({ record, visibleColumns, isSelected, isStarred, isShared, isHovered, isEditing, isTrash, onToggleRow, onMouseEnter, onMouseLeave, onStar, onShare, onEdit, onSaveName, onCancelEdit, onRestore, onMoveFolder, onTrash }: {
  record: RecordRow; visibleColumns: ColumnId[]; isSelected: boolean; isStarred: boolean; isShared: boolean; isHovered: boolean; isEditing: boolean; isTrash: boolean;
  onToggleRow: () => void; onMouseEnter: () => void; onMouseLeave: () => void; onStar: () => void; onShare: () => void; onEdit: () => void; onSaveName: (n: string) => void; onCancelEdit: () => void; onRestore: () => void; onMoveFolder: () => void; onTrash: () => void;
}) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const { t: tRow } = useLanguage();
  const cellTextStyle: React.CSSProperties = { fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: c.textTable, letterSpacing: "-0.154px" };

  function renderColumn(col: ColumnId) {
    if (col === "template") return <div key={col} className="flex-[1] min-w-0 px-[12px]"><div className="inline-flex items-center h-[22px] px-[8px] rounded-[4px]" style={{ backgroundColor: c.bgMuted }}><span className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textMuted }}>{record.template}</span></div></div>;
    if (col === "lang") return <div key={col} className="w-[50px] shrink-0 px-[6px] flex justify-center"><LanguageBadge lang={record.language} /></div>;
    if (col === "duration") return <div key={col} className="w-[80px] shrink-0 px-[8px]"><p className="leading-[20px] whitespace-nowrap" style={cellTextStyle}>{record.duration}</p></div>;
    if (col === "date") return (
      <div key={col} className="w-[130px] shrink-0 px-[8px]">
        <p className="leading-[20px] whitespace-nowrap" style={{ ...cellTextStyle, fontSize: "13px" }}>{record.dateCreated}</p>
      </div>
    );
    return null;
  }

  const dateVisible = visibleColumns.includes("date");
  const rowBg = isSelected && !isTrash ? c.bgSelected : "transparent";
  const hoverBg = isDark ? "rgba(255,255,255,0.03)" : "#f8f9fb";
  // Color for the actions overlay background — matches the current row state
  const actionsBg = isSelected ? c.bgSelected : hoverBg;
  const [showSummary, setShowSummary] = useState(false);
  const summaryTimer = useRef<ReturnType<typeof setTimeout>>();
  const shortSummary = record.summary.length > 120 ? record.summary.slice(0, 120) + "…" : record.summary;

  return (
    <div className={`flex items-center h-[40px] last:border-b-0 transition-colors cursor-pointer relative ${isTrash ? "opacity-60 hover:opacity-80" : ""}`} style={{ backgroundColor: rowBg, borderBottom: `1px solid ${c.border}` }} onMouseEnter={(e) => { onMouseEnter(); if (!isSelected && !isTrash) e.currentTarget.style.backgroundColor = hoverBg; summaryTimer.current = setTimeout(() => setShowSummary(true), 600); }} onMouseLeave={(e) => { onMouseLeave(); e.currentTarget.style.backgroundColor = rowBg; clearTimeout(summaryTimer.current); setShowSummary(false); }}>
      {/* Summary hover card */}
      {showSummary && record.summary && !isEditing && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-[60] pointer-events-none" style={{ animation: "fadeInUp 0.2s ease" }}>
          <div className="max-w-[340px] px-[14px] py-[10px] rounded-[10px]" style={{ backgroundColor: isDark ? "#1e1e26" : "white", border: `1px solid ${isDark ? "#37374180" : "#e5e7eb"}`, boxShadow: isDark ? "0px 8px 24px rgba(0,0,0,0.4)" : "0px 8px 24px rgba(0,0,0,0.1), 0px 2px 6px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-[5px] mb-[5px]">
              <svg className="size-[11px] shrink-0 text-[#2563eb]" fill="none" viewBox="0 0 16 16"><path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" /></svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "10px", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tRow("table.summary")}</span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", lineHeight: "17px", color: c.textSecondary }}>{shortSummary}</p>
          </div>
        </div>
      )}
      <div className="w-[40px] shrink-0 flex items-center justify-center">{!isTrash && <FigmaCheckbox checked={isSelected} onChange={onToggleRow} />}</div>
      {/* Name cell — holds name text AND hover actions overlay (right-aligned, fades from left) */}
      <div className="flex-[2.2] min-w-0 px-[12px] flex items-center gap-[8px] relative">
        <SourceIcon source={record.source} />
        {isEditing ? (
          <InlineNameEditor value={record.name} onSave={onSaveName} onCancel={onCancelEdit} />
        ) : (
          <div className="flex items-center gap-[6px] min-w-0 flex-1">
            <p className="truncate leading-[20px]" style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textSecondary, letterSpacing: "-0.154px" }}>{record.name}</p>
            {isShared && !isTrash && <SharedBadge />}
          </div>
        )}
        {/* Actions overlay — appears at right edge of name cell on hover */}
        {!isTrash && !isEditing && (
          <div
            className={`absolute top-0 bottom-0 z-20 flex items-center justify-end pr-[4px] transition-opacity duration-150 ${isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            style={{ right: "-26px", width: "180px", background: `linear-gradient(to right, transparent 0px, ${actionsBg} 48px)` }}
            onClick={e => e.stopPropagation()}
          >
            <RowActions isStarred={isStarred} onStar={onStar} onEdit={onEdit} onShare={onShare} onMoveFolder={onMoveFolder} onTrash={onTrash} summary={record.summary} tasksCount={record.tasks} />
          </div>
        )}
        {/* Trash restore button */}
        {isTrash && !isEditing && (
          <div
            className={`absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end pr-[6px] transition-opacity duration-150 ${isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            style={{ width: "160px", background: `linear-gradient(to right, transparent 0px, ${hoverBg} 40px)` }}
          >
            <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="flex items-center gap-[4px] h-[26px] px-[10px] rounded-full border transition-colors" style={{ backgroundColor: c.bgCard, borderColor: c.borderBtn }}>
              <svg className="size-[12px]" fill="none" viewBox="0 0 16 16"><path d="M2 7.333A6 6 0 018 2a6 6 0 016 6 6 6 0 01-6 6 5.98 5.98 0 01-4.243-1.757" stroke={c.textSecondary} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 3.333v4h4" stroke={c.textSecondary} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11.5px", color: c.textSecondary }}>{tRow("common.restore")}</span>
            </button>
          </div>
        )}
      </div>
      {/* Star column — purely decorative, only shows active yellow star */}
      <div className="w-[32px] shrink-0 flex items-center justify-center">
        {!isTrash && isStarred && (
          <svg className="size-[15px] shrink-0 pointer-events-none" fill="#F59E0B" viewBox="0 0 16 16">
            <path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" />
          </svg>
        )}
      </div>
      {visibleColumns.map((col) => renderColumn(col))}
    </div>
  );
}
