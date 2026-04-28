import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import svgPaths from "../../imports/svg-jcr72uvvch";
import { useStarred } from "./starred-context";
import { SourceIcon, type SourceType } from "./source-icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useFolders, type FolderItem as CtxFolderItem } from "./folder-context";
import { useLanguage } from "./language-context";
import { useTranscriptionModals, type TranscriptionJob } from "./transcription-modals";
import { ChevronRight, FolderPlus, Copy, Share, FolderOpen, Upload, Trash, Edit } from "@hugeicons/core-free-icons";
import { ShareDialog } from "./share-dialog";
import { Icon } from "./ui/icon";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ExportFormatSubMenu, ExportFormatMenuItems } from "./export-format-menu";
import {
  exportRecords,
  type ExportableRecord,
  type ExportFormat,
} from "@/lib/export-formats";

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

/* ── Inline folder helpers ── */
const INLINE_FOLDER_PATH = "M13.3333 13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V5.33333C14.6667 4.97971 14.5262 4.64057 14.2761 4.39052C14.0261 4.14048 13.687 4 13.3333 4H8.06667C7.84368 4.00219 7.6237 3.94841 7.42687 3.84359C7.23004 3.73877 7.06264 3.58625 6.94 3.4L6.4 2.6C6.27859 2.41565 6.11332 2.26432 5.919 2.1596C5.72468 2.05488 5.50741 2.00004 5.28667 2H2.66667C2.31304 2 1.97391 2.14048 1.72386 2.39052C1.47381 2.64057 1.33333 2.97971 1.33333 3.33333V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333Z";
const INLINE_FOLDER_COLORS = [
  { id: "blue", color: "#3B82F6" }, { id: "green", color: "#22C55E" }, { id: "amber", color: "#F59E0B" }, { id: "red", color: "#EF4444" },
  { id: "purple", color: "#8B5CF6" }, { id: "pink", color: "#EC4899" }, { id: "cyan", color: "#06B6D4" }, { id: "gray", color: "#6B7280" },
];
function flattenFoldersInTable(folders: CtxFolderItem[], excludeId?: string): CtxFolderItem[] {
  const result: CtxFolderItem[] = [];
  function walk(items: CtxFolderItem[]) {
    for (const f of items) {
      if (f.id === excludeId) continue;
      result.push(f);
      if (f.children) walk(f.children);
    }
  }
  walk(folders);
  return result;
}

/* ══════════════════════════════════════════════
   Figma-exact Checkbox
   ══════════════════════════════════════════════ */

function FigmaCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onChange} className="relative size-[16px] shrink-0">
      <div
        className={`absolute inset-[6.25%] rounded-[4px] flex items-center justify-center border ${
          checked
            ? "bg-primary border-primary"
            : "bg-background border-foreground/25 shadow-sm"
        }`}
      >
        {checked && (
          <svg className="size-[10px]" fill="none" viewBox="0 0 16 11">
            <path clipRule="evenodd" d={svgPaths.p2d702f80} fill="white" fillRule="evenodd" />
          </svg>
        )}
      </div>
    </Button>
  );
}

/* ══════════════════════════════════════════════
   Row Actions (hover)
   ══════════════════════════════════════════════ */

function CopyToast({ text }: { text: string }) {
  return (
    <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[200] animate-[fadeInUp_0.25s_ease] pointer-events-none">
      <div className="flex items-center gap-[6px] h-[34px] px-[14px] rounded-full bg-foreground shadow-lg">
        <svg className="size-[14px] text-green-500" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="font-medium text-[12px] text-white">{text}</span>
      </div>
    </div>
  );
}

function RowActions({ isStarred, onStar, onEdit, onShare, onMoveFolder, onTrash, onExport, summary }: { isStarred: boolean; onStar: () => void; onEdit: () => void; onShare: () => void; onMoveFolder: () => void; onTrash: () => void; onExport: (format: ExportFormat) => void; summary: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const { t } = useLanguage();

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1500); });
  }

  return (
    <div className="flex items-center gap-[2px] relative">
      <Button variant="ghost" size="icon" className="size-[28px] rounded-full flex items-center justify-center transition-colors hover:bg-accent" title="Rename" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <svg className="size-[15px]" fill="none" viewBox="0 0 16 16"><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" /></svg>
      </Button>
      <Button variant="ghost" size="icon" className="size-[28px] rounded-full flex items-center justify-center transition-colors hover:bg-accent" title="Share" onClick={(e) => { e.stopPropagation(); onShare(); }}>
        <svg className="size-[15px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
          <circle cx="12" cy="2.667" r="1.667" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="4" cy="8" r="1.667" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="12" cy="13.333" r="1.667" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M5.58 6.94l4.84-2.82M10.42 11.88L5.58 9.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </Button>
      <Button variant="ghost" size="icon" className="size-[28px] rounded-full flex items-center justify-center transition-colors hover:bg-accent" title={isStarred ? "Unstar" : "Star"} onClick={(e) => { e.stopPropagation(); onStar(); }}>
        <svg className="size-[15px]" fill="none" viewBox="0 0 16 16"><path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" stroke={isStarred ? "#F59E0B" : "currentColor"} fill={isStarred ? "#F59E0B" : "none"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={isStarred ? "" : "text-muted-foreground"} /></svg>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-[28px] rounded-full flex items-center justify-center transition-colors hover:bg-accent" title="More" onClick={(e) => e.stopPropagation()}>
            <svg className="size-[15px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="3" r="1.2" fill="currentColor" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /><circle cx="8" cy="13" r="1.2" fill="currentColor" /></svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-[210px]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem className="gap-2" onSelect={() => copyToClipboard(summary, "summary")}>
            <svg className="size-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M3 11V3a1.5 1.5 0 011.5-1.5H11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
            {t("table.copySummary")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2" onSelect={onMoveFolder}>
            <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
            {t("table.moveToFolder")}
          </DropdownMenuItem>
          <ExportFormatSubMenu onSelect={onExport} />
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="gap-2" onSelect={onTrash}>
            <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
            {t("table.moveToTrash")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {copied && <CopyToast text={t("common.copied")} />}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Multi-select Column Header Dropdown
   ══════════════════════════════════════════════ */

function ColumnHeaderDropdown({ label, options, selected, onToggle, align = "left" }: {
  label: string;
  options: { id: string; label: string; icon?: string; sourceIcon?: SourceType }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const filterCount = selected.size;
  const isFiltered = filterCount > 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-[3px] transition-opacity hover:opacity-70 group">
        <span className={`uppercase tracking-[0.3404px] font-medium text-[11px] ${isFiltered ? "text-primary" : "text-foreground"}`}>
          {label}
        </span>
        {isFiltered && (
          <span className="ml-[2px] font-semibold text-[10px] text-primary">{filterCount}</span>
        )}
        <svg className={`size-[10px] transition-transform ${open ? "rotate-180" : ""} ${isFiltered ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 10 10">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`absolute top-[calc(100%+4px)] w-[220px] rounded-[10px] py-[6px] z-50 bg-popover border border-border shadow-md ${align === "right" ? "right-0" : "left-0"}`}>
          {isFiltered && (
            <>
              <Button variant="ghost" onClick={() => { selected.forEach((id) => onToggle(id)); }} className="flex items-center gap-[8px] w-full px-[14px] h-[30px] transition-colors hover:bg-accent rounded-none justify-start">
                <svg className="size-[12px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12.5 3.5l-9 9M3.5 3.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span className="font-medium text-[12px] text-muted-foreground">{t("table.clearFilter")}</span>
              </Button>
              <div className="h-px mx-[8px] my-[3px] bg-border" />
            </>
          )}
          {options.map((opt) => {
            const isSelected = selected.has(opt.id);
            return (
              <Button variant="ghost" key={opt.id} onClick={() => onToggle(opt.id)} className="flex items-center gap-[8px] w-full px-[14px] h-[34px] transition-colors hover:bg-accent rounded-none justify-start">
                <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary border-primary" : "bg-background border-border"}`}>
                  {isSelected && <svg className="size-[10px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                {opt.sourceIcon && <div className="w-[18px] shrink-0 flex items-center justify-center"><SourceIcon source={opt.sourceIcon} /></div>}
                {opt.icon && !opt.sourceIcon && <span className="text-[14px] w-[18px] text-center shrink-0">{opt.icon}</span>}
                <span className={`flex-1 text-left truncate text-[13px] ${isSelected ? "font-medium text-primary" : "text-foreground"}`}>{opt.label}</span>
              </Button>
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
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const isChanged = selected !== "newest";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-[3px] transition-opacity hover:opacity-70">
        <span className={`uppercase tracking-[0.3404px] font-medium text-[11px] ${isChanged ? "text-primary" : "text-foreground"}`}>{label}</span>
        <svg className={`size-[10px] transition-transform ${open ? "rotate-180" : ""} ${isChanged ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 10 10"><path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className={`absolute top-[calc(100%+4px)] w-[170px] rounded-[10px] py-[6px] z-50 bg-popover border border-border shadow-md ${align === "right" ? "right-0" : "left-0"}`}>
          {options.map((opt) => (
            <Button variant="ghost" key={opt.id} onClick={() => { onSelect(opt.id); setOpen(false); }} className="flex items-center gap-[8px] w-full px-[14px] h-[34px] transition-colors hover:bg-accent rounded-none justify-start">
              <span className={`flex-1 text-left truncate text-[13px] ${selected === opt.id ? "font-medium text-primary" : "text-foreground"}`}>{opt.label}</span>
              {selected === opt.id && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" /></svg>}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Search
   ══════════════════════════════════════════════ */

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { function h(e: KeyboardEvent) { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); } } document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, []);
  return (
    <div className="relative flex items-center">
      <svg className="absolute left-[10px] size-[14px] text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 16 16"><path d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <Input ref={inputRef} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Search records..."} className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-[30px] w-[200px] pl-[30px] pr-[52px] rounded-[12px] text-[13px]" />
      <div className="absolute right-[8px] flex items-center gap-[2px] rounded-[4px] px-[5px] h-[18px] pointer-events-none bg-muted border-[0.5px] border-input">
        <span className="font-medium text-[10px] text-muted-foreground leading-none">⌘K</span>
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

function MultiSelectTextBtn({ icon, label, onClick, variant = "primary" }: { icon: React.ReactNode; label: string; onClick: () => void; variant?: "primary" | "destructive" }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex items-center gap-[5px] h-[30px] px-[8px] rounded-full transition-opacity hover:opacity-70 ${variant === "destructive" ? "text-destructive" : "text-primary"}`}
    >
      {icon}
      <span className="font-medium text-[13px]">{label}</span>
    </button>
  );
}

function MultiSelectBar({ count, onCancel, onMoveFolder, onTrash, onCopySummary, onExport, onShare }: {
  count: number; onCancel: () => void; onMoveFolder: () => void; onTrash: () => void; onCopySummary: () => void; onExport: (format: ExportFormat) => void; onShare: () => void;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-[4px] h-[36px] bg-primary/5" style={{ borderBottom: "1px solid hsl(var(--primary) / 0.2)" }}>
      <div className="w-[40px] shrink-0 flex items-center justify-center">
        <FigmaCheckbox checked onChange={onCancel} />
      </div>
      <span className="font-semibold text-[13px] text-foreground">{count} {t("table.selected")}</span>
      <div className="h-[20px] w-px ml-[2px] bg-primary/20" />
      <MultiSelectTextBtn label="Summary" onClick={() => { onCopySummary(); setCopied("s"); setTimeout(() => setCopied(null), 1500); }} icon={<Icon icon={Copy} className="size-[14px]" strokeWidth={1.5} />} />
      <MultiSelectTextBtn label="Share" onClick={onShare} icon={<Icon icon={Share} className="size-[14px]" strokeWidth={1.5} />} />
      <MultiSelectTextBtn label="Folder" onClick={onMoveFolder} icon={<Icon icon={FolderOpen} className="size-[14px]" strokeWidth={1.5} />} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-[5px] h-[30px] px-[8px] rounded-full transition-opacity hover:opacity-70 text-primary"
          >
            <Icon icon={Upload} className="size-[14px]" strokeWidth={1.5} />
            <span className="font-medium text-[13px]">Export</span>
            <svg className="size-[10px] opacity-70" fill="none" viewBox="0 0 10 10">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-[230px]">
          <ExportFormatMenuItems onSelect={onExport} />
        </DropdownMenuContent>
      </DropdownMenu>
      <MultiSelectTextBtn label="Trash" onClick={onTrash} variant="destructive" icon={<Icon icon={Trash} className="size-[14px]" strokeWidth={1.5} />} />
      <div className="flex-1" />
      <Button variant="ghost" onClick={onCancel} className="h-[30px] px-[12px] rounded-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
        {t("common.cancel")}
      </Button>
      {copied && <CopyToast text={t("common.copied")} />}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Table Settings Popover
   ══════════════════════════════════════════════ */

/* ── Draggable Column Item ── */

function DraggableColumnItem({ col, index, isVisible, onToggle, moveColumn }: {
  col: ColumnId; index: number; isVisible: boolean; onToggle: () => void;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
}) {
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
      className={`flex items-center gap-[8px] w-full px-[12px] h-[34px] rounded-[6px] mx-[2px] transition-all ${isDragging ? "opacity-40 bg-primary/5" : "hover:bg-accent"}`}
      style={{ width: "calc(100% - 4px)" }}
    >
      {/* Drag handle */}
      <div ref={(node) => { drag(node); }} className="shrink-0 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-[2px] w-[14px] h-[14px]" title="Drag to reorder">
        <div className="flex gap-[2px]"><div className="size-[2px] rounded-full bg-muted-foreground" /><div className="size-[2px] rounded-full bg-muted-foreground" /></div>
        <div className="flex gap-[2px]"><div className="size-[2px] rounded-full bg-muted-foreground" /><div className="size-[2px] rounded-full bg-muted-foreground" /></div>
        <div className="flex gap-[2px]"><div className="size-[2px] rounded-full bg-muted-foreground" /><div className="size-[2px] rounded-full bg-muted-foreground" /></div>
      </div>
      {/* Label */}
      <span className={`flex-1 text-left text-[13px] ${isVisible ? "text-foreground" : "text-muted-foreground"}`}>
        {t(COLUMN_LABEL_KEYS[col])}
      </span>
      {/* Visibility toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 flex items-center justify-center size-[22px] rounded-[5px] transition-colors hover:bg-accent"
        title={isVisible ? "Hide column" : "Show column"}
      >
        {isVisible ? (
          <svg className="size-[14px] text-primary" fill="none" viewBox="0 0 16 16">
            <path d="M1.333 8S3.333 3.333 8 3.333 14.667 8 14.667 8 12.667 12.667 8 12.667 1.333 8 1.333 8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        ) : (
          <svg className="size-[14px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
            <path d="M6.586 6.586a2 2 0 002.828 2.828M2.458 2.458C1.227 3.393.333 4.667.333 4.667S2.333 9.333 7 9.333c.93 0 1.78-.188 2.542-.5M11.458 9.458C12.773 8.607 13.667 7.333 13.667 7.333S11.667 2.667 7 2.667c-.423 0-.833.04-1.225.114" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(1 1)" />
            <path d="M1.333 1.333l13.334 13.334" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </Button>
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
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className={`flex items-center justify-center size-[32px] rounded-full border transition-colors ${hasCustomization ? "border-primary bg-primary/5" : "border-border bg-background"}`} title="Table settings">
        <svg className={`size-[16px] ${hasCustomization ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24">
          <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </Button>
      {open && (
        <DndProvider backend={HTML5Backend}>
          <div className="absolute right-0 top-[calc(100%+6px)] w-[260px] rounded-[14px] py-[6px] z-50 bg-popover border border-border shadow-md">
            {/* View mode */}
            <div className="px-[14px] py-[4px]">
              <Button variant="ghost" onClick={() => onViewChange(viewMode === "table" ? "cards" : "table")} className="flex items-center gap-[10px] w-full h-[34px] rounded-[6px] px-[4px] transition-colors hover:bg-accent rounded-none justify-start">
                <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 ${viewMode === "cards" ? "bg-primary border-primary" : "bg-background border-border"}`}>
                  {viewMode === "cards" && <svg className="size-[9px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span className="flex-1 text-left text-[13px] text-foreground">{t("table.cardView")}</span>
              </Button>
            </div>
            {/* Group by date */}
            <div className="px-[14px] py-[2px]">
              <Button variant="ghost" onClick={() => onGroupChange(!groupByDate)} className="flex items-center gap-[10px] w-full h-[34px] rounded-[6px] px-[4px] transition-colors hover:bg-accent rounded-none justify-start">
                <div className={`size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 ${groupByDate ? "bg-primary border-primary" : "bg-background border-border"}`}>
                  {groupByDate && <svg className="size-[9px]" fill="none" viewBox="0 0 12 9"><path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span className="flex-1 text-left text-[13px] text-foreground">{t("table.groupByDate")}</span>
              </Button>
            </div>

            <div className="h-px mx-[12px] my-[6px] bg-border" />

            {/* Columns section */}
            <div className="px-[14px] mb-[4px]">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.5px]">{t("table.columns")}</p>
            </div>
            {/* Fixed: Name column (always visible) */}
            <div className="flex items-center gap-[8px] w-full px-[14px] h-[34px]">
              <div className="shrink-0 w-[14px]" />
              <span className="flex-1 text-left font-medium text-[13px] text-foreground">
                {t("table.name")}
              </span>
              <div className="shrink-0 flex items-center justify-center size-[22px]">
                <svg className="size-[10px] text-muted-foreground" fill="none" viewBox="0 0 12 12">
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
                <div className="h-px mx-[12px] my-[6px] bg-border" />
                <div className="px-[14px] py-[2px]">
                  <Button
                    variant="ghost"
                    onClick={onResetColumns}
                    className="flex items-center gap-[8px] w-full h-[32px] rounded-[6px] px-[4px] transition-colors hover:bg-accent rounded-none justify-start"
                  >
                    <svg className="size-[13px] shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16">
                      <path d="M2 7.333A6 6 0 018 2a6 6 0 016 6 6 6 0 01-6 6 5.98 5.98 0 01-4.243-1.757" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 3.333v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[12px] text-muted-foreground">{t("table.resetDefault")}</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </DndProvider>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Date separator + Stat badges + Inline editor
   ══════════════════════════════════════════════ */

function DateSeparator({ label }: { label: string }) {
  return <div className="flex items-center h-[36px] px-[16px] bg-secondary"><span className="font-semibold text-[12.5px] text-foreground">{label}</span></div>;
}

function StatBadge({ icon, count }: { icon: "tasks" | "screenshots"; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-[3px] h-[20px] px-[6px] rounded-[10px] shrink-0 bg-muted">
      {icon === "tasks" ? (
        <svg className="size-[11px] shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg className="size-[11px] shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1" /><path d="M2 11l3-2.5 2 1.5 3.5-3L14 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      <span className="font-medium text-[11px] text-muted-foreground">{count}</span>
    </div>
  );
}

/* Shared badge — outline pill matching screenshot */
function SharedBadge() {
  return (
    <span className="inline-flex items-center shrink-0 h-[17px] px-[6px] rounded-full border border-border">
      <span className="font-medium text-[11px] text-primary">Shared</span>
    </span>
  );
}

function InlineNameEditor({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  return (
    <Input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (text.trim()) onSave(text.trim()); else onCancel(); } if (e.key === "Escape") onCancel(); }}
      onBlur={() => { if (text.trim() && text.trim() !== value) onSave(text.trim()); else onCancel(); }}
      className="w-full h-[26px] px-[6px] rounded-[4px] border border-primary font-medium text-[14px] tracking-[-0.154px]"
    />
  );
}

/* ══════════════════════════════════════════════
   Card View
   ══════════════════════════════════════════════ */

function RecordCard({ record, isStarred, onStar }: { record: RecordRow; isStarred: boolean; onStar: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-[14px] p-[20px] transition-all bg-card border border-border cursor-default">
      <div className="flex items-start gap-[12px]">
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-semibold text-[15px] leading-[22px] text-foreground tracking-[-0.01em]">{record.name}</h3>
          <div className="flex items-center gap-[6px] mt-[4px] flex-wrap">
            <SourceIcon source={record.source} />
            <span className="text-[12px] text-primary">{record.time}</span>
            <span className="text-[10px] text-border">&middot;</span>
            <span className="text-[12px] text-muted-foreground">{record.duration}</span>
            <span className="text-[10px] text-border">&middot;</span>
            <LanguageBadge lang={record.language} />
          </div>
        </div>
        {record.thumbnail && (
          <div className="shrink-0 w-[120px] h-[68px] rounded-[8px] overflow-hidden bg-muted">
            <img src={record.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="mt-[10px]">
        <p className="text-[12.5px] leading-[19px] text-muted-foreground" style={{ display: "-webkit-box", WebkitLineClamp: expanded ? 999 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{record.summary}</p>
        {record.summary.length > 120 && <Button variant="ghost" onClick={() => setExpanded(!expanded)} className="mt-[2px] font-medium text-[12.5px] text-primary bg-transparent border-none cursor-pointer p-0">{expanded ? useLanguage().t("table.showLess") : useLanguage().t("table.showMore")}</Button>}
      </div>
      <div className="flex items-center justify-between mt-[14px] pt-[12px] border-t border-muted">
        <div className="flex items-center gap-[8px]">
          <div className="inline-flex items-center h-[22px] px-[8px] rounded-[4px] bg-muted"><span className="text-[11px] text-muted-foreground">{record.template}</span></div>
          <Button variant="ghost" size="icon" onClick={onStar} className="size-[24px] rounded-full flex items-center justify-center transition-colors">
            <svg className="size-[13px]" fill="none" viewBox="0 0 16 16"><path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" stroke={isStarred ? "#F59E0B" : "#c0c5cc"} fill={isStarred ? "#F59E0B" : "none"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Button>
        </div>
        <div className="flex items-center gap-[14px]">
          {record.tasks > 0 && <div className="flex items-center gap-[4px]"><svg className="size-[14px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="font-medium text-[12px] text-muted-foreground">{record.tasks}</span></div>}
          {record.screenshots > 0 && <div className="flex items-center gap-[4px]"><svg className="size-[14px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1" /><path d="M2 11l3-2.5 2 1.5 3.5-3L14 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="font-medium text-[12px] text-muted-foreground">{record.screenshots}</span></div>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Empty State
   ══════════════════════════════════════════════ */

function EmptyFilterState({ onClear }: { onClear: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-[56px] px-[24px]">
      <div className="size-[56px] rounded-full flex items-center justify-center mb-[16px] bg-muted">
        <svg className="size-[24px] text-muted-foreground" fill="none" viewBox="0 0 24 24">
          <path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-semibold text-[15px] text-foreground mb-[6px]">{t("table.noResults")}</p>
      <p className="text-[13px] text-muted-foreground text-center max-w-[280px] leading-[20px]">{t("table.noResultsDesc")}</p>
      <Button variant="outline" onClick={onClear} className="mt-[16px] flex items-center gap-[6px] h-[34px] px-[16px] rounded-full bg-background transition-colors">
        <svg className="size-[13px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12.5 3.5l-9 9M3.5 3.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span className="font-medium text-[13px] text-foreground">{t("table.clearAllFilters")}</span>
      </Button>
    </div>
  );
}

function EmptyTabState({ tab }: { tab: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-[48px]">
      <div className="size-[48px] rounded-full flex items-center justify-center mb-[12px] bg-muted">
        {tab === "Trash" ? (
          <svg className="size-[22px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : tab === "Starred" ? (
          <svg className="size-[22px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg className="size-[22px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M14 14H2V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10l3-4 3 2 3-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </div>
      <p className="font-medium text-[14px] text-muted-foreground">
        {tab === "Trash" ? t("table.trashEmpty") : tab === "Starred" ? t("table.noStarred") : t("table.noRecords")}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════
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
  const { t } = useLanguage();
  useEffect(() => { if (open) { setName(""); setSelectedColor("#3B82F6"); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[400px] overflow-hidden bg-popover" style={{ boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 className="font-semibold text-[17px] text-foreground">{t("folder.createNew")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center transition-colors"><svg className="size-[16px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></Button>
        </div>
        <div className="px-[24px] pt-[18px] pb-[8px]">
          <Label className="block font-medium text-[13px] text-foreground mb-[6px]">{t("folder.name")}</Label>
          <Input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } if (e.key === "Escape") onClose(); }} placeholder={t("folder.namePlaceholder")} className="w-full h-[40px] px-[14px] rounded-[12px] text-[14px]" />
          <Label className="block font-medium text-[13px] text-foreground mt-[18px] mb-[8px]">{t("folder.color")}</Label>
          <div className="flex items-center gap-[8px]">
            {folderColors.map((fc) => (
              <Button variant="ghost" size="icon" key={fc.id} onClick={() => setSelectedColor(fc.color)} className="size-[28px] rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: fc.color, boxShadow: selectedColor === fc.color ? `0 0 0 2px var(--popover), 0 0 0 4px ${fc.color}` : "none", transform: selectedColor === fc.color ? "scale(1.1)" : "scale(1)" }}>
                {selectedColor === fc.color && <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-[10px] mt-[20px] p-[12px] rounded-[12px] bg-secondary border border-border">
            <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" fill={selectedColor} opacity="0.15" stroke={selectedColor} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className={`font-medium text-[14px] ${name.trim() ? "text-foreground" : "text-muted-foreground"}`}>{name.trim() || t("folder.name")}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[18px] transition-colors"><span className="font-medium text-[13px] text-foreground">{t("common.cancel")}</span></Button>
          <Button onClick={() => { if (name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } }} disabled={!name.trim()} className="h-[36px] px-[18px] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white"><span className="font-medium text-[13px]">{t("folder.create")}</span></Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════
   Move to Folder Dialog
   ══════════════════════════════════════════════ */

type FolderItem = CtxFolderItem;

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
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedId === folder.id;
  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => onSelect(folder.id)}
        className={`flex items-center gap-[8px] w-full h-[38px] rounded-[8px] transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-accent"} rounded-none justify-start`}
        style={{ paddingLeft: `${12 + depth * 20}px`, paddingRight: "12px" }}
      >
        {hasChildren ? (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="size-[16px] shrink-0 flex items-center justify-center">
            <svg className={`size-[10px] transition-transform text-muted-foreground ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 10 10"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Button>
        ) : <div className="w-[16px] shrink-0" />}
        <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z" fill={folder.color} stroke={folder.color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className={`flex-1 text-left truncate text-[13.5px] ${isSelected ? "font-medium text-primary" : "text-foreground"}`}>{folder.name}</span>
        {isSelected && <svg className="size-[16px] shrink-0 text-primary" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </Button>
      {hasChildren && expanded && folder.children!.map((child) => (
        <FolderTreeItem key={child.id} folder={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function MoveToFolderDialog({ open, onClose, count, onMove, onCreateFolder, folders: ctxFolders }: { open: boolean; onClose: () => void; count: number; onMove: (folderId: string) => void; onCreateFolder: () => void; folders?: { id: string; name: string; color: string }[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { t } = useLanguage();
  useEffect(() => { if (open) setSelectedId(null); }, [open]);
  const allFolders = ctxFolders && ctxFolders.length > 0 ? ctxFolders.map(f => ({ ...f, children: undefined })) : defaultFolders;
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[420px] overflow-hidden bg-popover" style={{ boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[6px]">
          <h2 className="font-bold text-[17px] text-foreground">{t("folder.moveTitle", count, count !== 1 ? "s" : "")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center transition-colors"><svg className="size-[16px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></Button>
        </div>
        <p className="px-[24px] mb-[12px] text-[13px] text-muted-foreground">{t("folder.chooseDestination")}</p>
        <div className="px-[12px] max-h-[280px] overflow-y-auto">
          {allFolders.map((f) => <FolderTreeItem key={f.id} folder={f} depth={0} selectedId={selectedId} onSelect={setSelectedId} />)}
        </div>
        <div className="px-[24px] pt-[12px]">
          <Button variant="outline" onClick={onCreateFolder} className="flex items-center gap-[6px] h-[34px] px-[12px] rounded-full border border-dashed border-border bg-background transition-colors w-full justify-center">
            <svg className="size-[14px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <span className="font-medium text-[13px] text-muted-foreground">{t("folder.createNewFolder")}</span>
          </Button>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[18px] transition-colors"><span className="font-medium text-[13px] text-foreground">{t("common.cancel")}</span></Button>
          <Button onClick={() => { if (selectedId) { onMove(selectedId); onClose(); } }} disabled={!selectedId} className="h-[36px] px-[18px] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white"><span className="font-medium text-[13px]">{t("folder.moveHere")}</span></Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InlineFolderEditDialog({ open, folder, onClose, onSave }: { open: boolean; folder: FolderItem | null; onClose: () => void; onSave: (name: string, color: string) => void }) {
  const [name, setName] = useState(folder?.name ?? "");
  const [color, setColor] = useState(folder?.color ?? "#3B82F6");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && folder) { setName(folder.name); setColor(folder.color); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open, folder?.id]);
  if (!open || !folder) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[400px] overflow-hidden bg-popover" style={{ boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 className="font-semibold text-[17px] text-foreground">Edit folder</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center">
            <svg className="size-[16px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </Button>
        </div>
        <div className="px-[24px] pt-[18px] pb-[8px]">
          <Label className="block font-medium text-[13px] text-foreground mb-[6px]">Name</Label>
          <Input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onSave(name.trim(), color); onClose(); } if (e.key === "Escape") onClose(); }} placeholder="e.g. Client Meetings" className="w-full h-[40px] px-[14px] rounded-[12px] text-[14px]" />
          <Label className="block font-medium text-[13px] text-foreground mt-[18px] mb-[8px]">Color</Label>
          <div className="flex items-center gap-[8px]">
            {INLINE_FOLDER_COLORS.map((fc) => (
              <Button variant="ghost" size="icon" key={fc.id} onClick={() => setColor(fc.color)} className="size-[28px] rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: fc.color, boxShadow: color === fc.color ? `0 0 0 2px var(--popover), 0 0 0 4px ${fc.color}` : "none", transform: color === fc.color ? "scale(1.1)" : "scale(1)" }}>
                {color === fc.color && <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-[10px] mt-[20px] p-[12px] rounded-[12px] bg-secondary border border-border">
            <svg style={{ width: 22, height: 22 }} className="shrink-0" fill="none" viewBox="0 0 16 16"><path d={INLINE_FOLDER_PATH} fill={color} /></svg>
            <span className={`font-medium text-[14px] ${name.trim() ? "text-foreground" : "text-muted-foreground"}`}>{name.trim() || "Folder name"}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[18px]"><span className="font-medium text-[13px] text-foreground">Cancel</span></Button>
          <Button onClick={() => { if (name.trim()) { onSave(name.trim(), color); onClose(); } }} disabled={!name.trim()} className="h-[36px] px-[18px] rounded-full bg-primary text-white disabled:opacity-40"><span className="font-medium text-[13px]">Save</span></Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════
   Share (new ShareDialog is imported from ./share-dialog)
   ══════════════════════════════════════════════ */


/* ══════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════ */

const tabs = ["Recent", "Starred", "Shared", "Trash"] as const;
const DEMO_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export interface RecordRow {
  id: string; name: string; iconColor: string; iconType: "square" | "circle" | "link"; duration: string;
  dateCreated: string; dateGroup: string; template: string; language: string; source: SourceType;
  summary: string; tasks: number; screenshots: number; time: string; thumbnail?: string; videoUrl?: string;
}

export const records: RecordRow[] = [
  { id: "2", name: "Nexora <> QL | Instance Daily Sync", iconColor: "#22C55E", iconType: "link", duration: "32 min", dateCreated: "03/13/2026, 15:06", dateGroup: "Yesterday, Mar 13", template: "Meeting Notes", language: "en", source: "google-meet", summary: "The team discussed the integration of Nexora and QL for daily sync. T and Sandeep agreed to stick to the original plan, with orders grouped within their platform and sent to the TMS. Kirill demonstrated the tendering process...", tasks: 6, screenshots: 34, time: "2:02 PM", thumbnail: "https://images.unsplash.com/photo-1759752394755-1241472b589d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGRhc2hib2FyZCUyMGFuYWx5dGljcyUyMHNjcmVlbnxlbnwxfHx8fDE3NzM0MTU2NTR8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "1", name: "QTMS Platform Walkthrough", iconColor: "#3B82F6", iconType: "square", duration: "43 min", dateCreated: "03/11/2026, 08:28", dateGroup: "Tuesday, Mar 11", template: "1 by 1", language: "en", source: "zoom", summary: "The meeting focused on integrating supplier orders directly into the TMS without involving the planning stage. Kirill Kuts demonstrated how to map facilities and manage orders...", tasks: 5, screenshots: 28, time: "2:02 PM", thumbnail: "https://images.unsplash.com/photo-1771054244019-96f9db9720b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGNvbmZlcmVuY2UlMjBtZWV0aW5nJTIwc2NyZWVufGVufDF8fHx8MTc3MzQ4NzQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "3", name: "\u0441\u043a\u0430\u0437\u0430\u043b\u0430", iconColor: "#3B82F6", iconType: "square", duration: "1 min 49s", dateCreated: "03/11/2026, 11:57", dateGroup: "Tuesday, Mar 11", template: "1 by 1", language: "ru", source: "microphone", summary: "\u041a\u043e\u0440\u043e\u0442\u043a\u0430\u044f \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u044f \u0437\u0430\u043c\u0435\u0442\u043a\u0430 \u0441 \u043e\u0431\u0441\u0443\u0436\u0434\u0435\u043d\u0438\u0435\u043c \u0442\u0435\u043a\u0443\u0449\u0438\u0445 \u0437\u0430\u0434\u0430\u0447 \u0438 \u043f\u043b\u0430\u043d\u043e\u0432 \u043d\u0430 \u043d\u0435\u0434\u0435\u043b\u044e.", tasks: 2, screenshots: 0, time: "11:57 AM" },
  { id: "4", name: "Small Talk", iconColor: "#3B82F6", iconType: "square", duration: "3 min 39s", dateCreated: "03/11/2026, 08:49", dateGroup: "Tuesday, Mar 11", template: "Interview", language: "en", source: "zoom", summary: "A brief casual conversation covering team updates and weekend plans.", tasks: 0, screenshots: 0, time: "8:49 AM" },
  { id: "5", name: "Integration and Processing Update", iconColor: "#3B82F6", iconType: "square", duration: "7 min", dateCreated: "03/11/2026, 07:58", dateGroup: "Tuesday, Mar 11", template: "Action Items", language: "en", source: "teams", summary: "The conversation involves multiple speakers discussing technical matters related to a project or system integration.", tasks: 3, screenshots: 0, time: "1:50 PM" },
  { id: "6", name: "Nexora quick guide: get transcription and AI summary", iconColor: "#EF4444", iconType: "circle", duration: "1 min 21s", dateCreated: "03/10/2026, 19:09", dateGroup: "Monday, Mar 10", template: "Summary", language: "en", source: "mp4", summary: "A walkthrough video demonstrating how to use the transcription platform to generate AI-powered summaries.", tasks: 1, screenshots: 1, time: "8:46 AM", thumbnail: "https://images.unsplash.com/photo-1721804295754-1905f69c86ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2dpc3RpY3MlMjB0cnVja3MlMjBmbGVldCUyMG9yYW5nZXxlbnwxfHx8fDE3NzM1MDA5NDh8MA&ixlib=rb-4.1.0&q=80&w=1080", videoUrl: DEMO_VIDEO_URL },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateForRecord(date: Date) {
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const yyyy = date.getFullYear();
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return {
    dateCreated: `${mm}/${dd}/${yyyy}, ${hh}:${min}`,
    dateGroup: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

function normalizeSource(source: TranscriptionJob["source"], fileType: TranscriptionJob["fileType"]): SourceType {
  if (source) return source;
  return fileType === "audio" ? "mp3" : "mp4";
}

function normalizeLanguage(lang?: string, langBilingual?: string[]) {
  const isValid = (id?: string) => !!id && id !== "auto" && languageFlags[id] !== undefined;
  if (isValid(lang)) return lang as keyof typeof languageFlags;
  const bilingual = (langBilingual ?? []).find(id => isValid(id));
  if (bilingual) return bilingual as keyof typeof languageFlags;
  return "en";
}

function mapJobToRecord(job: TranscriptionJob): RecordRow {
  const createdDate = job.createdAt ? new Date(job.createdAt) : new Date();
  const isDone = job.status === "done";
  const isError = job.status === "error";
  const dateParts = formatDateForRecord(createdDate);
  return {
    id: job.id,
    name: job.name,
    iconColor: "#3B82F6",
    iconType: "square",
    duration: isDone ? (job.duration ?? "\u2014") : isError ? "Failed" : "In progress",
    dateCreated: dateParts.dateCreated,
    dateGroup: dateParts.dateGroup,
    template: job.langBilingual && job.langBilingual.length > 1 ? "1 by 1" : "Summary",
    language: normalizeLanguage(job.lang, job.langBilingual),
    source: normalizeSource(job.source, job.fileType),
    summary: isDone
      ? "Transcript is ready. Open the record to view summary and action items."
      : isError
        ? "This transcription failed. You can retry from upload status widget."
        : "Transcription is in progress.",
    tasks: 0,
    screenshots: 0,
    time: dateParts.time,
    videoUrl: job.fileType === "video" ? (job.mediaUrl ?? DEMO_VIDEO_URL) : undefined,
  };
}

/* cellTextStyle is computed inside TableRow */

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
   ══════════════════════════════════════════════ */

interface SavedView {
  id: string; name: string; typeFilter: Set<string>; templateFilter: Set<string>; langFilter: Set<string>; dateSort: string;
}

function SavedViewTab({ view, isActive, onLoad, onRename, onDelete }: { view: SavedView; isActive: boolean; onLoad: () => void; onRename: (name: string) => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setMenuOpen(false); } } document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  return (
    <div className="flex flex-col items-center relative pb-[8px] group" ref={ref}>
      {editing ? (
        <Input
          autoFocus
          defaultValue={view.name}
          className="h-[22px] w-[90px] px-[4px] rounded-[4px] border border-primary font-medium text-[13px]"
          onKeyDown={(e) => { if (e.key === "Enter") { onRename((e.target as HTMLInputElement).value.trim() || view.name); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          onBlur={(e) => { onRename(e.target.value.trim() || view.name); setEditing(false); }}
        />
      ) : (
        <Button variant="ghost" onClick={onLoad} className={`font-medium text-[14px] tracking-[-0.154px] ${isActive ? "text-primary" : "text-muted-foreground"}`}>
          {view.name}
        </Button>
      )}
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-primary" />}

      {/* Hover pencil icon */}
      {!editing && (
        <div className="absolute -right-[20px] top-[2px] opacity-0 group-hover:opacity-100">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="size-[18px] rounded-full flex items-center justify-center transition-colors">
            <svg className="size-[10px]" fill="none" viewBox="0 0 16 16"><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" /></svg>
          </Button>
        </div>
      )}

      {/* Edit/Delete dropdown */}
      {menuOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+4px)] w-[140px] rounded-[10px] py-[4px] z-50 bg-popover border border-border shadow-md">
          <Button variant="ghost" onClick={() => { setMenuOpen(false); setEditing(true); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] transition-colors hover:bg-accent rounded-none justify-start">
            <svg className="size-[13px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="text-[13px] text-foreground">{t("common.rename")}</span>
          </Button>
          <Button variant="ghost" onClick={() => { setMenuOpen(false); onDelete(); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] transition-colors hover:bg-destructive/10 rounded-none justify-start">
            <svg className="size-[13px] text-destructive" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="text-[13px] text-destructive">{t("common.delete")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */

interface RecordsTableProps {
  hideTopHeader?: boolean;
  showAddFolderButton?: boolean;
  scopedFolderId?: string | null;
  showInlineFolderRows?: boolean;
  onNavigateToRecords?: () => void;
  onOpenFolder?: (folderId: string) => void;
}

export function RecordsTable({ hideTopHeader = false, showAddFolderButton = false, scopedFolderId = null, showInlineFolderRows = true, onNavigateToRecords, onOpenFolder }: RecordsTableProps = {}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { jobs } = useTranscriptionModals();
  const { folders: userFolders, addFolder: addFolderToContext, folderAssignments, assignToFolder, deleteFolder, renameFolder, changeFolderColor, moveFolder } = useFolders();
  const [deletingInlineFolderId, setDeletingInlineFolderId] = useState<string | null>(null);
  const [editingInlineFolder, setEditingInlineFolder] = useState<FolderItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Recent");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
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
  const [shareDialogRecord, setShareDialogRecord] = useState<string | null>(null);
  const { starred, toggleStar, renameRecord, getName } = useStarred();

  function recordToExportable(record: RecordRow): ExportableRecord {
    return {
      title: record.name,
      summary: record.summary,
      segments: [], // table records don't carry full transcript segments
      metadata: {
        date: record.dateCreated,
        duration: record.duration,
        source: record.source,
        language: record.language,
      },
    };
  }

  function exportRecordsByIds(ids: string[], format: ExportFormat) {
    const targets = displayRecords
      .filter((r) => ids.includes(r.id))
      .map(recordToExportable);
    if (!targets.length) return;
    try {
      exportRecords(targets, format);
      const fmtUpper = format.toUpperCase();
      if (targets.length === 1) toast.success(`Exported as ${fmtUpper}`);
      else toast.success(`Exported ${targets.length} records as ${fmtUpper}`);
    } catch {
      toast.error("Export failed");
    }
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
    setSelectedRows(prev => {
      const next = new Set(prev);
      const allVisibleSelected = filteredRecords.length > 0 && filteredRecords.every(r => next.has(r.id));
      if (allVisibleSelected) {
        filteredRecords.forEach(r => next.delete(r.id));
      } else {
        filteredRecords.forEach(r => next.add(r.id));
      }
      return next;
    });
  }
  function clearSelection() { setSelectedRows(new Set()); }
  function clearAllFilters() { setSearchQuery(""); setTypeFilter(new Set()); setTemplateFilter(new Set()); setLangFilter(new Set()); setDateSort("newest"); }
  useEffect(() => { clearSelection(); }, [scopedFolderId]);
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

  const inlineFolders = useMemo(() => {
    if (!scopedFolderId) return userFolders;
    function find(list: FolderItem[], id: string): FolderItem | null {
      for (const f of list) { if (f.id === id) return f; const c = find(f.children ?? [], id); if (c) return c; } return null;
    }
    return find(userFolders, scopedFolderId)?.children ?? [];
  }, [userFolders, scopedFolderId]);

  const jobRecords = useMemo(() => jobs.map(mapJobToRecord), [jobs]);
  const allRecords = useMemo(() => [...jobRecords, ...records], [jobRecords]);
  const displayRecords = allRecords.map((r) => ({ ...r, name: getName(r.id, r.name) }));
  const activeRecords = displayRecords.filter((r) => !trashedIds.has(r.id));
  const trashRecords = displayRecords.filter((r) => trashedIds.has(r.id));
  const scopedActiveRecords = scopedFolderId ? activeRecords.filter((r) => folderAssignments[r.id] === scopedFolderId) : activeRecords;
  const scopedTrashRecords = scopedFolderId ? trashRecords.filter((r) => folderAssignments[r.id] === scopedFolderId) : trashRecords;

  // Shared records (mock: first 3 records are "shared with me")
  const sharedIds = new Set(records.slice(0, 3).map(r => r.id));

  let filteredRecords = activeTab === "Trash" ? scopedTrashRecords : scopedActiveRecords;
  if (searchQuery) filteredRecords = filteredRecords.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (activeTab === "Starred") filteredRecords = filteredRecords.filter((r) => starred.has(r.id));
  if (activeTab === "Shared") filteredRecords = filteredRecords.filter((r) => sharedIds.has(r.id) || false);
  if (activeTab !== "Trash") {
    if (typeFilter.size > 0) filteredRecords = filteredRecords.filter((r) => typeFilter.has(r.source));
    if (templateFilter.size > 0) filteredRecords = filteredRecords.filter((r) => templateFilter.has(r.template));
    if (langFilter.size > 0) filteredRecords = filteredRecords.filter((r) => langFilter.has(r.language));
  }
  if (dateSort === "newest") filteredRecords = [...filteredRecords].sort((a, b) => b.dateCreated.localeCompare(a.dateCreated));
  else filteredRecords = [...filteredRecords].sort((a, b) => a.dateCreated.localeCompare(b.dateCreated));

  const allSelected = filteredRecords.length > 0 && filteredRecords.every(r => selectedRows.has(r.id));

  const dateGroups: { label: string; records: typeof filteredRecords }[] = [];
  if (groupByDate) {
    const seen = new Map<string, typeof filteredRecords>();
    for (const r of filteredRecords) { const existing = seen.get(r.dateGroup); if (existing) existing.push(r); else seen.set(r.dateGroup, [r]); }
    for (const [label, recs] of seen) dateGroups.push({ label, records: recs });
  }

  const hasSelection = selectedRows.size > 0 && activeTab !== "Trash";

  const sharedCount = scopedActiveRecords.filter((r) => sharedIds.has(r.id) || false).length;

  // Tab counts
  const recentCount = scopedActiveRecords.length;
  const starredCount = scopedActiveRecords.filter((r) => starred.has(r.id)).length;
  const trashCount = scopedTrashRecords.length;

  return (
    <div className={hideTopHeader ? "mt-[0]" : "mt-[32px]"}>
      {/* Header: Title + Search + Settings + Add Folder */}
      {!hideTopHeader && (
        <div className="flex items-center gap-[12px] mb-[16px]">
          <button className="flex items-center gap-[4px] cursor-pointer group" onClick={onNavigateToRecords}>
            <span className="font-semibold text-[18px] text-foreground">{t("table.myRecords")}</span>
            <Icon icon={ChevronRight} className="size-[16px] text-foreground opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
          </button>
          <div className="flex-1" />
          <Button variant="pill-outline" onClick={() => setFolderModalOpen(true)} className="flex items-center gap-[6px] h-9 px-[14px] transition-colors cursor-pointer">
            <Icon icon={FolderPlus} className="size-[14px] text-foreground" strokeWidth={1.5} />
            <span className="font-medium text-[13px] text-foreground">{t("folder.addFolder")}</span>
          </Button>
        </div>
      )}

      <CreateFolderModal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} onCreate={(name, color) => { addFolderToContext(name, color); }} />
      <MoveToFolderDialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} count={selectedRows.size} onMove={(folderId) => { assignToFolder(Array.from(selectedRows), folderId); clearSelection(); }} onCreateFolder={() => { setMoveDialogOpen(false); setFolderModalOpen(true); }} folders={userFolders} />

      {/* Edit inline folder dialog */}
      <InlineFolderEditDialog
        open={!!editingInlineFolder}
        folder={editingInlineFolder}
        onClose={() => setEditingInlineFolder(null)}
        onSave={(name, color) => {
          if (!editingInlineFolder) return;
          renameFolder(editingInlineFolder.id, name);
          changeFolderColor(editingInlineFolder.id, color);
        }}
      />

      {/* Delete inline folder confirmation */}
      <AlertDialog open={!!deletingInlineFolderId} onOpenChange={(open) => { if (!open) setDeletingInlineFolderId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder will be deleted. Files inside will not be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingInlineFolderId) deleteFolder(deletingInlineFolderId);
                setDeletingInlineFolderId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ShareDialog
        open={!!shareDialogRecord}
        onOpenChange={(open) => { if (!open) setShareDialogRecord(null); }}
        resourceType="transcription"
        resourceId={shareDialogRecord ?? ""}
        resourceName={displayRecords.find(r => r.id === shareDialogRecord)?.name ?? ""}
      />

      {/* Tabs */}
      <div className="relative">
        <div className="flex items-center">
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); clearSelection(); clearAllFilters(); }} className="flex-1 min-w-0 gap-0">
            <TabsList variant="line" className="gap-6">
              {tabs.map((tab) => {
                const isTrash = tab === "Trash";
                const count = tab === "Recent" ? recentCount : tab === "Starred" ? starredCount : tab === "Shared" ? sharedCount : trashCount;
                return (
                  <TabsTrigger key={tab} value={tab} variant="line" className={activeTab === tab && isTrash ? "text-destructive data-[state=active]:text-destructive data-[state=active]:after:bg-destructive" : ""}>
                    {tab === "Recent" ? t("table.recent") : tab === "Starred" ? t("table.starred") : tab === "Shared" ? t("table.shared") : t("table.trash")}
                    <span className="opacity-50 font-[inherit]">{count}</span>
                  </TabsTrigger>
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
                <Button variant="ghost" onClick={saveCurrentView} className="flex items-center gap-[4px] pb-2 opacity-80 hover:opacity-100 transition-opacity">
                  <svg className="size-[12px] text-primary" fill="none" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  <span className="font-medium text-[13px] text-primary">{t("table.saveView")}</span>
                </Button>
              )}
            </TabsList>
          </Tabs>

          {/* Add Folder button (inline with tabs) */}
          {showAddFolderButton && (
            <Button variant="pill-outline" onClick={() => setFolderModalOpen(true)} className="flex items-center gap-[6px] h-[28px] px-[12px] ml-[8px] mb-[4px] shrink-0 transition-colors cursor-pointer">
              <Icon icon={FolderPlus} className="size-[13px] text-foreground" strokeWidth={1.5} />
              <span className="font-medium text-[12px] text-foreground">{t("folder.addFolder")}</span>
            </Button>
          )}

          {/* Clear filter indicator */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters} className="flex items-center gap-[5px] h-[28px] px-[10px] rounded-full border border-border !bg-transparent transition-colors shrink-0 ml-[12px] mb-[4px] hover:!bg-transparent hover:border-muted-foreground/40">
              <svg className="size-[11px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12.5 3.5l-9 9M3.5 3.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span className="font-medium text-[11.5px] text-muted-foreground">
                {(typeFilter.size > 0 ? 1 : 0) + (templateFilter.size > 0 ? 1 : 0) + (langFilter.size > 0 ? 1 : 0) + (searchQuery ? 1 : 0)} {t("table.filters")}
              </span>
            </Button>
          )}

        </div>
      </div>

      {/* ══════ TABLE VIEW ══════ */}
      {viewMode === "table" && (
        <div>
          <div className="w-full overflow-visible bg-card border-b border-border">
            {/* Header row — replaced by MultiSelectBar when rows are selected */}
            {hasSelection ? (
              <MultiSelectBar
                count={selectedRows.size}
                onCancel={clearSelection}
                onMoveFolder={() => setMoveDialogOpen(true)}
                onTrash={trashSelected}
                onShare={() => {
                  const selectedIds = Array.from(selectedRows);
                  if (!selectedIds.length) return;
                  // Open share dialog for first selected record
                  setShareDialogRecord(selectedIds[0]);
                }}
                onCopySummary={() => {
                  const texts = displayRecords.filter(r => selectedRows.has(r.id)).map(r => `${r.name}: ${r.summary}`).join("\n\n");
                  navigator.clipboard.writeText(texts);
                }}
                onExport={(format) => exportRecordsByIds(Array.from(selectedRows), format)}
              />
            ) : (
            <div className="flex items-center h-[36px] border-b border-border">
              <div className="w-[40px] shrink-0 flex items-center justify-center"><FigmaCheckbox checked={allSelected} onChange={toggleAll} /></div>
              <div className="flex-[2.2] min-w-0 px-[12px] flex items-center"><ColumnHeaderDropdown label={t("table.type")} options={typeFilterOptions} selected={typeFilter} onToggle={(id) => setTypeFilter((s) => toggleSetItem(s, id))} /></div>
              {/* Star column — no title */}
              <div className="w-[32px] shrink-0" />
              {visibleColumns.map((col) => {
                if (col === "template") return <div key={col} className="flex-[1] min-w-0 px-[12px] flex items-center"><ColumnHeaderDropdown label={t("table.template")} options={templateFilterOptions} selected={templateFilter} onToggle={(id) => setTemplateFilter((s) => toggleSetItem(s, id))} /></div>;
                if (col === "lang") return <div key={col} className="w-[50px] shrink-0 px-[6px] flex items-center justify-center"><ColumnHeaderDropdown label={t("table.lang")} options={langFilterOptions} selected={langFilter} onToggle={(id) => setLangFilter((s) => toggleSetItem(s, id))} align="right" /></div>;
                if (col === "duration") return <div key={col} className="w-[80px] shrink-0 px-[8px] flex items-center"><span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">{t("table.duration")}</span></div>;
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
                    <TableRow key={record.id} record={record} visibleColumns={visibleColumns} isSelected={selectedRows.has(record.id)} isStarred={starred.has(record.id)} isShared={sharedIds.has(record.id)} isHovered={hoveredRow === record.id} isEditing={editingId === record.id} isTrash={activeTab === "Trash"}
                      onToggleRow={() => toggleRow(record.id)} onMouseEnter={() => setHoveredRow(record.id)} onMouseLeave={() => setHoveredRow(null)}
                      onStar={() => toggleStar(record.id, { id: record.id, name: record.name, iconColor: record.iconColor, iconType: record.iconType, source: record.source })}
                      onShare={() => setShareDialogRecord(record.id)}
                      onEdit={() => setEditingId(record.id)} onSaveName={(n) => { renameRecord(record.id, n); setEditingId(null); }} onCancelEdit={() => setEditingId(null)}
                      onRestore={() => restoreFromTrash(record.id)} onMoveFolder={() => { setSelectedRows(new Set([record.id])); setMoveDialogOpen(true); }} onTrash={() => trashOne(record.id)}
                      onExport={(format) => exportRecordsByIds([record.id], format)}
                      onDoubleClick={() => navigate(`/transcriptions/${record.id}`, { state: { record } })}
                    />
                  ))}
                </div>
              ))
            ) : (
              <>
                {showInlineFolderRows && activeTab === "Recent" && inlineFolders.map((folder) => (
                  <div key={folder.id} className="group flex items-center h-[40px] transition-colors cursor-pointer border-b border-border hover:bg-accent" onDoubleClick={() => onOpenFolder?.(folder.id)}>
                    <div className="w-[40px] shrink-0" />
                    <div className="flex-[2.2] min-w-0 px-[12px] flex items-center gap-[8px]">
                      <svg className="size-[16px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={INLINE_FOLDER_PATH} fill={folder.color} /></svg>
                      <span className="font-medium text-[14px] text-foreground">{folder.name}</span>
                    </div>
                    {/* Star column placeholder */}
                    <div className="w-[32px] shrink-0" />
                    {visibleColumns.map((col) => (
                      <div key={col} className={col === "time" ? "flex-[1.3] min-w-0 px-[12px]" : col === "duration" ? "flex-[0.8] min-w-0 px-[12px]" : col === "language" ? "flex-[0.6] min-w-0 px-[12px]" : col === "template" ? "flex-[1.2] min-w-0 px-[12px]" : "flex-[0.8] min-w-0 px-[12px]"}>
                        {col === "time" && folder.createdAt ? <span className="text-[13px] text-muted-foreground">{new Date(folder.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span> : null}
                      </div>
                    ))}
                    <div className="w-[100px] shrink-0 flex items-center justify-end pr-[8px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                          onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                          className="flex size-[28px] shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg className="size-[14px]" fill="none" viewBox="0 0 16 16">
                            <circle cx="8" cy="3" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                          </svg>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6} className="w-[170px]">
                          <DropdownMenuItem className="gap-2" onClick={() => onOpenFolder?.(folder.id)}>
                            <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                            Open folder
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => setEditingInlineFolder(folder)}>
                            <Icon icon={Edit} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                              <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                              Move to folder
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-[210px]">
                              <DropdownMenuItem className="gap-2" onClick={() => moveFolder(folder.id, null)}>
                                <svg className="size-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.1" /></svg>
                                <span className="truncate">My Records (root)</span>
                              </DropdownMenuItem>
                              {flattenFoldersInTable(userFolders, folder.id).map((f) => (
                                <DropdownMenuItem key={f.id} className="gap-2" onClick={() => moveFolder(folder.id, f.id)}>
                                  <svg className="size-4 shrink-0" fill="none" viewBox="0 0 16 16"><path d={INLINE_FOLDER_PATH} fill={f.color} /></svg>
                                  <span className="truncate">{f.name}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => setDeletingInlineFolderId(folder.id)}>
                            <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} record={record} visibleColumns={visibleColumns} isSelected={selectedRows.has(record.id)} isStarred={starred.has(record.id)} isShared={sharedIds.has(record.id)} isHovered={hoveredRow === record.id} isEditing={editingId === record.id} isTrash={activeTab === "Trash"}
                    onToggleRow={() => toggleRow(record.id)} onMouseEnter={() => setHoveredRow(record.id)} onMouseLeave={() => setHoveredRow(null)}
                    onStar={() => toggleStar(record.id, { id: record.id, name: record.name, iconColor: record.iconColor, iconType: record.iconType, source: record.source })}
                    onShare={() => setShareDialogRecord(record.id)}
                    onEdit={() => setEditingId(record.id)} onSaveName={(n) => { renameRecord(record.id, n); setEditingId(null); }} onCancelEdit={() => setEditingId(null)}
                    onRestore={() => restoreFromTrash(record.id)} onMoveFolder={() => { setSelectedRows(new Set([record.id])); setMoveDialogOpen(true); }} onTrash={() => trashOne(record.id)}
                    onExport={(format) => exportRecordsByIds([record.id], format)}
                    onDoubleClick={() => navigate(`/transcriptions/${record.id}`, { state: { record } })}
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
                <div className="flex items-center gap-[6px] py-[10px] mb-[4px]"><span className="font-semibold text-[14px] text-foreground">{group.label}</span></div>
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

function TableRow({ record, visibleColumns, isSelected, isStarred, isShared, isHovered, isEditing, isTrash, onToggleRow, onMouseEnter, onMouseLeave, onStar, onShare, onEdit, onSaveName, onCancelEdit, onRestore, onMoveFolder, onTrash, onExport, onDoubleClick }: {
  record: RecordRow; visibleColumns: ColumnId[]; isSelected: boolean; isStarred: boolean; isShared: boolean; isHovered: boolean; isEditing: boolean; isTrash: boolean;
  onToggleRow: () => void; onMouseEnter: () => void; onMouseLeave: () => void; onStar: () => void; onShare: () => void; onEdit: () => void; onSaveName: (n: string) => void; onCancelEdit: () => void; onRestore: () => void; onMoveFolder: () => void; onTrash: () => void; onExport: (format: ExportFormat) => void; onDoubleClick: () => void;
}) {
  const { t: tRow } = useLanguage();

  function renderColumn(col: ColumnId) {
    if (col === "template") return <div key={col} className="flex-[1] min-w-0 px-[12px]"><div className="inline-flex items-center h-[22px] px-[8px] rounded-[4px] bg-muted"><span className="truncate text-[12px] text-muted-foreground">{record.template}</span></div></div>;
    if (col === "lang") return <div key={col} className="w-[50px] shrink-0 px-[6px] flex justify-center"><LanguageBadge lang={record.language} /></div>;
    if (col === "duration") return <div key={col} className="w-[80px] shrink-0 px-[8px]"><p className="leading-[20px] whitespace-nowrap text-[14px] text-muted-foreground tracking-[-0.154px]">{record.duration}</p></div>;
    if (col === "date") return (
      <div key={col} className="w-[130px] shrink-0 px-[8px]">
        <p className="leading-[20px] whitespace-nowrap text-[13px] text-muted-foreground tracking-[-0.154px]">{record.dateCreated}</p>
      </div>
    );
    return null;
  }

  const dateVisible = visibleColumns.includes("date");
  const rowBg = isSelected && !isTrash ? "bg-primary/5" : "";
  const hoverBg = "var(--accent)";
  // Color for the actions overlay background — matches the current row state
  const actionsBg = isSelected ? "#f0f4ff" : hoverBg;
  const [showSummary, setShowSummary] = useState(false);
  const summaryTimer = useRef<ReturnType<typeof setTimeout>>();
  const shortSummary = record.summary.length > 120 ? record.summary.slice(0, 120) + "\u2026" : record.summary;

  return (
    <div className={`flex items-center h-[40px] last:border-b-0 transition-colors cursor-pointer relative border-b border-border ${isTrash ? "opacity-60 hover:opacity-80" : "hover:bg-accent"} ${rowBg}`} onMouseEnter={(e) => { onMouseEnter(); summaryTimer.current = setTimeout(() => setShowSummary(true), 600); }} onMouseLeave={(e) => { onMouseLeave(); clearTimeout(summaryTimer.current); setShowSummary(false); }} onDoubleClick={onDoubleClick}>
      {/* Summary hover card */}
      {showSummary && record.summary && !isEditing && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-[60] pointer-events-none" style={{ animation: "fadeInUp 0.2s ease" }}>
          <div className="max-w-[340px] px-[14px] py-[10px] rounded-[10px] bg-background border border-border" style={{ boxShadow: "0px 8px 24px rgba(0,0,0,0.1), 0px 2px 6px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-[5px] mb-[5px]">
              <svg className="size-[11px] shrink-0 text-primary" fill="none" viewBox="0 0 16 16"><path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" /></svg>
              <span className="font-semibold text-[10px] text-primary uppercase tracking-[0.5px]">{tRow("table.summary")}</span>
            </div>
            <p className="text-[12px] leading-[17px] text-foreground">{shortSummary}</p>
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
            <p className="truncate leading-[20px] font-medium text-[14px] text-foreground tracking-[-0.154px]">{record.name}</p>
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
            <RowActions isStarred={isStarred} onStar={onStar} onEdit={onEdit} onShare={onShare} onMoveFolder={onMoveFolder} onTrash={onTrash} onExport={onExport} summary={record.summary} />
          </div>
        )}
        {/* Trash restore button */}
        {isTrash && !isEditing && (
          <div
            className={`absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end pr-[6px] transition-opacity duration-150 ${isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            style={{ width: "160px", background: `linear-gradient(to right, transparent 0px, ${hoverBg} 40px)` }}
          >
            <Button variant="outline" onClick={(e) => { e.stopPropagation(); onRestore(); }} className="flex items-center gap-[4px] h-[26px] px-[10px] rounded-full bg-card transition-colors">
              <svg className="size-[12px] text-foreground" fill="none" viewBox="0 0 16 16"><path d="M2 7.333A6 6 0 018 2a6 6 0 016 6 6 6 0 01-6 6 5.98 5.98 0 01-4.243-1.757" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 3.333v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="font-medium text-[11.5px] text-foreground">{tRow("common.restore")}</span>
            </Button>
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
