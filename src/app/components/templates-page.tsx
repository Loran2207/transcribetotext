import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  TextAlignLeftIcon,
  CheckListIcon,
  StarsIcon,
  NoteEditIcon,
  Target01Icon,
  Menu01Icon,
  Folder01Icon,
  Delete01Icon,
  Layers,
  ArrowTurnBackwardIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { cn } from "@/app/components/ui/utils";
import { useTemplates } from "@/hooks/use-templates";
import { useFolders } from "./folder-context";
import { useAuth } from "./auth-context";
import { records } from "./records-table";
import type { Template, TemplateSection, CreateTemplateData } from "@/lib/templates";

// ---------------------------------------------------------------------------
// LocalStorage keys
// ---------------------------------------------------------------------------

const STARRED_KEY = "ttt_starred_templates";
const TRASHED_KEY = "ttt_trashed_templates";
const ACTIONS_KEY = "ttt_template_actions";

function loadSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) { localStorage.setItem(key, JSON.stringify([...s])); }

interface StoredAction { type: string; folderId: string | null }
function loadActions(): Record<string, StoredAction[]> {
  try { return JSON.parse(localStorage.getItem(ACTIONS_KEY) ?? "{}"); } catch { return {}; }
}
function saveActions(a: Record<string, StoredAction[]>) { localStorage.setItem(ACTIONS_KEY, JSON.stringify(a)); }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSection(): TemplateSection {
  return { id: crypto.randomUUID(), title: "", instruction: "" };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

const SECTION_ICONS = [
  { kw: ["summary", "overview"], icon: TextAlignLeftIcon },
  { kw: ["action", "task", "todo"], icon: CheckListIcon },
  { kw: ["decision", "key", "verdict"], icon: Target01Icon },
  { kw: ["insight", "analysis", "mood"], icon: StarsIcon },
  { kw: ["outline", "topic", "custom", "prompt"], icon: NoteEditIcon },
] as const;

function sectionIcon(title: string) {
  const l = title.toLowerCase();
  return SECTION_ICONS.find((e) => e.kw.some((k) => l.includes(k)))?.icon ?? Menu01Icon;
}

// ---------------------------------------------------------------------------
// Emoji mapping for template names
// ---------------------------------------------------------------------------

const TEMPLATE_EMOJI_MAP: { kw: string[]; emoji: string }[] = [
  { kw: ["general"], emoji: "\u{1F4CB}" },        // 📋
  { kw: ["sales", "bant", "discovery"], emoji: "\u{1F4B0}" }, // 💰
  { kw: ["1-on-1", "one-on-one", "1:1"], emoji: "\u{1F465}" }, // 👥
  { kw: ["team meeting", "team sync"], emoji: "\u{1F91D}" },   // 🤝
  { kw: ["candidate", "interview"], emoji: "\u{1F3AF}" },      // 🎯
  { kw: ["research"], emoji: "\u{1F50D}" },        // 🔍
  { kw: ["standup", "stand-up"], emoji: "\u{23F1}" },   // ⏱
  { kw: ["retrospective", "retro"], emoji: "\u{1F504}" }, // 🔄
  { kw: ["brainstorm"], emoji: "\u{1F4A1}" },      // 💡
  { kw: ["onboarding"], emoji: "\u{1F44B}" },      // 👋
  { kw: ["training"], emoji: "\u{1F393}" },        // 🎓
  { kw: ["project"], emoji: "\u{1F4C1}" },         // 📁
];

function templateEmoji(name: string): string {
  const l = name.toLowerCase();
  return TEMPLATE_EMOJI_MAP.find((e) => e.kw.some((k) => l.includes(k)))?.emoji ?? "\u{1F4C4}"; // 📄
}

// ---------------------------------------------------------------------------
// Table (list view)
// ---------------------------------------------------------------------------

function TH() {
  const c = "uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground";
  return (
    <div className="flex items-center h-[36px] border-b border-border">
      <div className={cn("flex-[2.2] min-w-0 px-[12px]", c)}>Name</div>
      <div className={cn("w-[32px] shrink-0", c)} />
      <div className={cn("flex-[1.5] min-w-0 px-[12px]", c)}>Description</div>
      <div className={cn("flex-[0.8] min-w-0 px-[12px]", c)}>Created by</div>
      <div className={cn("flex-[0.8] min-w-0 px-[12px]", c)}>Actions</div>
      <div className={cn("w-[130px] shrink-0 px-[8px]", c)}>Date</div>
    </div>
  );
}

function TemplateRowActions({ isStarred, onStar, onEdit, onTrash }: {
  isStarred: boolean; onStar: () => void; onEdit: () => void; onTrash: () => void;
}) {
  return (
    <div className="flex items-center gap-[2px]">
      <Button variant="ghost" size="icon" className="size-[28px] rounded-full flex items-center justify-center transition-colors hover:bg-accent" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <svg className="size-[15px]" fill="none" viewBox="0 0 16 16"><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" /></svg>
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
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTrash(); }} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-[10px]">
            <svg className="size-[15px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function TR({ t, isHovered, isStarred, isTrashed, folderName, onMouseEnter, onMouseLeave, onClick, onStar, onEdit, onTrash, onRestore }: {
  t: Template; isHovered: boolean; isStarred: boolean; isTrashed: boolean; folderName: string | null;
  onMouseEnter: () => void; onMouseLeave: () => void; onClick: () => void;
  onStar: () => void; onEdit: () => void; onTrash: () => void; onRestore: () => void;
}) {
  const sys = t.type === "built_in";
  const emoji = templateEmoji(t.name);
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="flex items-center h-[40px] transition-colors cursor-pointer border-b border-border hover:bg-accent relative group"
    >
      {/* Name cell with emoji */}
      <div className="flex-[2.2] min-w-0 px-[12px] flex items-center gap-[8px] relative">
        <span className="text-[16px] shrink-0 leading-none">{emoji}</span>
        <p className="truncate font-medium text-[14px] text-foreground tracking-[-0.154px]">{t.name}</p>

        {/* Hover actions overlay — extends into star column (right: -26px), matching records-table pattern */}
        {!isTrashed && (
          <div
            className={cn(
              "absolute top-0 bottom-0 z-20 flex items-center justify-end pr-[4px] transition-opacity duration-150",
              isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            )}
            style={{ right: "-26px", width: "180px", background: "linear-gradient(to right, transparent 0px, var(--accent) 48px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <TemplateRowActions isStarred={isStarred} onStar={onStar} onEdit={onEdit} onTrash={onTrash} />
          </div>
        )}

        {/* Trash restore button */}
        {isTrashed && (
          <div
            className={cn(
              "absolute top-0 bottom-0 z-20 flex items-center justify-end pr-[6px] transition-opacity duration-150",
              isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            )}
            style={{ right: "-26px", width: "120px", background: "linear-gradient(to right, transparent 0px, var(--accent) 48px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="size-[28px] rounded-full" title="Restore" onClick={(e) => { e.stopPropagation(); onRestore(); }}>
              <Icon icon={ArrowTurnBackwardIcon} size={15} className="text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      {/* Star column — shows filled star when starred, hidden during hover (hover actions have their own star) */}
      <div className="w-[32px] shrink-0 flex items-center justify-center">
        {!isTrashed && isStarred && !isHovered && (
          <svg className="size-[15px] shrink-0 pointer-events-none" fill="#F59E0B" viewBox="0 0 16 16">
            <path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Description */}
      <div className="flex-[1.5] min-w-0 px-[12px]">
        <p className="truncate text-[13px] text-muted-foreground">{t.description || "\u2014"}</p>
      </div>

      {/* Created by */}
      <div className="flex-[0.8] min-w-0 px-[12px] flex items-center gap-[6px]">
        {sys ? (
          <>
            <Icon icon={Layers} size={14} className="text-primary shrink-0" />
            <span className="text-[12px] text-muted-foreground">System</span>
          </>
        ) : (
          <>
            <Avatar className="size-[22px]">
              <AvatarFallback className="text-[9px] bg-accent text-accent-foreground">Me</AvatarFallback>
            </Avatar>
            <span className="text-[12px] text-muted-foreground">Me</span>
          </>
        )}
      </div>

      {/* Actions (folder) */}
      <div className="flex-[0.8] min-w-0 px-[12px] flex items-center gap-[6px]">
        {folderName ? (
          <>
            <Icon icon={Folder01Icon} size={13} className="text-muted-foreground shrink-0" />
            <span className="truncate text-[12px] text-muted-foreground">{folderName}</span>
          </>
        ) : (
          <span className="text-[12px] text-muted-foreground">\u2014</span>
        )}
      </div>

      {/* Date */}
      <div className="w-[130px] shrink-0 px-[8px]">
        <p className="text-[13px] text-muted-foreground tracking-[-0.154px]">{fmtDate(t.created_at)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Section Block (editable)
// ---------------------------------------------------------------------------

const DRAG_TYPE = "SECTION";

function DraggableSectionBlock({
  section, index, isOn, isReadOnly, onToggle, onMove, onUpdate, onRemove,
}: {
  section: TemplateSection; index: number; isOn: boolean; isReadOnly: boolean;
  onToggle: (on: boolean) => void; onMove: (from: number, to: number) => void;
  onUpdate: (updated: TemplateSection) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(!section.title);
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { index },
    canDrag: !isReadOnly && !isEditing,
    collect: (m) => ({ isDragging: m.isDragging() }),
  });
  const [, drop] = useDrop({
    accept: DRAG_TYPE,
    hover: (item: { index: number }) => {
      if (item.index === index) return;
      onMove(item.index, index);
      item.index = index;
    },
  });
  drag(drop(ref));

  const ico = sectionIcon(section.title);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card px-5 py-4 transition-all",
        isDragging && "opacity-40",
        !isOn && "opacity-50",
      )}
      style={{ cursor: isReadOnly ? "default" : isEditing ? "default" : "grab" }}
    >
      <div className="flex items-start gap-4">
        {/* Drag handle */}
        {!isReadOnly && (
          <div className="flex flex-col gap-[2px] pt-1.5 shrink-0 cursor-grab">
            <div className="flex gap-[2px]"><div className="size-[3px] rounded-full bg-muted-foreground/30" /><div className="size-[3px] rounded-full bg-muted-foreground/30" /></div>
            <div className="flex gap-[2px]"><div className="size-[3px] rounded-full bg-muted-foreground/30" /><div className="size-[3px] rounded-full bg-muted-foreground/30" /></div>
            <div className="flex gap-[2px]"><div className="size-[3px] rounded-full bg-muted-foreground/30" /><div className="size-[3px] rounded-full bg-muted-foreground/30" /></div>
          </div>
        )}
        <Icon icon={ico} size={20} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {isEditing && !isReadOnly ? (
            <div className="flex flex-col gap-2">
              <Input
                value={section.title}
                onChange={(e) => onUpdate({ ...section, title: e.target.value })}
                placeholder="Section name"
                className="h-8 text-[15px] font-semibold"
                autoFocus
              />
              <Textarea
                value={section.instruction}
                onChange={(e) => onUpdate({ ...section, instruction: e.target.value })}
                placeholder="AI instructions \u2014 describe what this section should contain..."
                className="text-[13px] min-h-[60px] resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[12px] text-primary"
                  onClick={() => { if (section.title.trim()) setIsEditing(false); else toast.error("Section name is required"); }}
                >
                  Done
                </Button>
                {!section.title.trim() && (
                  <Button variant="ghost" size="sm" className="h-7 text-[12px] text-destructive" onClick={onRemove}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={cn(!isReadOnly && "cursor-pointer group/section")}
              onClick={() => { if (!isReadOnly) setIsEditing(true); }}
            >
              <p className={cn("text-[15px] font-semibold text-foreground", !isReadOnly && "group-hover/section:text-primary transition-colors")}>
                {section.title || `Section ${index + 1}`}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                {section.instruction || "No instructions set. Click to edit."}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {!isReadOnly && !isEditing && (
            <button onClick={onRemove} className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors">
              <Icon icon={Delete01Icon} size={14} />
            </button>
          )}
          <Switch checked={isOn} onCheckedChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selection Rules
// ---------------------------------------------------------------------------

interface Rule { id: string; field: string; operator: string; value: string }

function RulesSection({ rules, onChange, readOnly }: { rules: Rule[]; onChange: (r: Rule[]) => void; readOnly: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[16px] font-semibold text-foreground">Template selection rules</h3>
        <p className="text-[13px] text-muted-foreground mt-1">When these conditions are met, the template is applied. Note: matching is case sensitive.</p>
      </div>
      {rules.map((r) => (
        <div key={r.id} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0 w-[42px]">When</span>
          <Select value={r.field} onValueChange={(v) => onChange(rules.map((x) => x.id === r.id ? { ...x, field: v } : x))} disabled={readOnly}>
            <SelectTrigger className="w-[180px] h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting_title">Meeting Title</SelectItem>
              <SelectItem value="ai_classification">AI Classification</SelectItem>
              <SelectItem value="host_email">Meeting Host Email</SelectItem>
              <SelectItem value="participant_email">Participant Email</SelectItem>
              <SelectItem value="host_department">Meeting Host Department</SelectItem>
            </SelectContent>
          </Select>
          <Select value={r.operator} onValueChange={(v) => onChange(rules.map((x) => x.id === r.id ? { ...x, operator: v } : x))} disabled={readOnly}>
            <SelectTrigger className="w-[100px] h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="is">is</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="starts_with">starts with</SelectItem>
            </SelectContent>
          </Select>
          <Input value={r.value} onChange={(e) => onChange(rules.map((x) => x.id === r.id ? { ...x, value: e.target.value } : x))} placeholder="e.g. Weekly Sync, Customer Call" className="flex-1 h-9 rounded-lg" disabled={readOnly} />
          {!readOnly && (
            <button onClick={() => onChange(rules.filter((x) => x.id !== r.id))} className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Icon icon={Delete01Icon} size={16} />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button onClick={() => onChange([...rules, { id: crypto.randomUUID(), field: "meeting_title", operator: "contains", value: "" }])} className="flex items-center gap-1 text-[13px] text-primary hover:text-primary/80 font-medium">
          <Icon icon={Add01Icon} size={14} /> Add condition
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface Action { id: string; type: string; folderId: string | null }

function flattenFolders(items: { id: string; name: string; children?: { id: string; name: string; children?: any[] }[] }[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const f of items) {
    result.push({ id: f.id, name: f.name, depth });
    if (f.children) result.push(...flattenFolders(f.children, depth + 1));
  }
  return result;
}

function ActionsSection({ actions, onChange, readOnly }: { actions: Action[]; onChange: (a: Action[]) => void; readOnly: boolean }) {
  const { folders } = useFolders();
  const allFolders = useMemo(() => flattenFolders(folders), [folders]);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[16px] font-semibold text-foreground">Actions</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Run actions like moving to a folder whenever a meeting is matched to this template.</p>
      </div>
      <div className="border-t border-border" />
      {actions.map((a) => (
        <div key={a.id} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0 whitespace-nowrap">When template is applied:</span>
          <Select value={a.type} onValueChange={(v) => onChange(actions.map((x) => x.id === a.id ? { ...x, type: v } : x))} disabled={readOnly}>
            <SelectTrigger className="w-[180px] h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="move_to_folder">Move to folder</SelectItem>
            </SelectContent>
          </Select>
          <Select value={a.folderId ?? ""} onValueChange={(v) => onChange(actions.map((x) => x.id === a.id ? { ...x, folderId: v || null } : x))} disabled={readOnly}>
            <SelectTrigger className="flex-1 h-9 rounded-lg"><SelectValue placeholder="Select a folder" /></SelectTrigger>
            <SelectContent>
              {allFolders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span className="flex items-center gap-2" style={{ paddingLeft: f.depth * 12 }}><Icon icon={Folder01Icon} size={13} className="text-muted-foreground" />{f.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!readOnly && (
            <button onClick={() => onChange(actions.filter((x) => x.id !== a.id))} className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Icon icon={Delete01Icon} size={16} />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button onClick={() => onChange([...actions, { id: crypto.randomUUID(), type: "move_to_folder", folderId: null }])} className="flex items-center gap-1 text-[13px] text-primary hover:text-primary/80 font-medium">
          <Icon icon={Add01Icon} size={14} /> Add action
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

function Preview({ sections, selectedRecordId, onChangeRecord }: {
  sections: TemplateSection[]; selectedRecordId: string; onChangeRecord: (id: string) => void;
}) {
  const rec = records.find((r) => r.id === selectedRecordId) ?? records[0];
  return (
    <div className="sticky top-6">
      {/* Record selector */}
      <div className="mb-3">
        <Select value={selectedRecordId} onValueChange={onChangeRecord}>
          <SelectTrigger className="h-9 rounded-lg text-[13px]">
            <SelectValue placeholder="Select a file for preview" />
          </SelectTrigger>
          <SelectContent>
            {records.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-[13px]">{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document preview */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--elevation-md)" }}>
        {/* Page header */}
        <div className="px-7 pt-6 pb-4 border-b border-border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
          <p className="text-[15px] font-semibold text-foreground">{rec?.name ?? "Sample Meeting"}</p>
          <p className="text-[12px] text-muted-foreground mt-1">{rec?.duration ?? "32 min"} &middot; {rec?.dateCreated ?? ""}</p>
        </div>

        {/* Sections content */}
        <div className="px-7 py-6">
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Enable sections to see preview</p>
          ) : (
            sections.map((s, i) => (
              <div key={s.id} className={i > 0 ? "mt-6" : ""}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon={sectionIcon(s.title)} size={15} className="text-foreground/60" />
                  <h4 className="text-[14px] font-semibold text-foreground">{s.title || `Section ${i + 1}`}</h4>
                </div>
                <p className="text-[13px] text-muted-foreground leading-[1.7]">
                  {s.instruction
                    ? `Based on the instructions "${s.instruction.slice(0, 60)}${s.instruction.length > 60 ? "..." : ""}", the AI will analyze the transcription and generate content for this section.`
                    : `AI-generated content for "${s.title || `Section ${i + 1}`}" will appear here based on the transcription content and template instructions.`}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Page
// ---------------------------------------------------------------------------

interface EditorState {
  name: string;
  sections: TemplateSection[];
  sectionToggles: Record<string, boolean>;
  rules: Rule[];
  actions: Action[];
}

function initEditor(t?: Template, storedActions?: StoredAction[]): EditorState {
  const secs = t?.sections?.length ? t.sections.map((s) => ({ ...s })) : [{ ...makeSection(), title: "Summary" }];
  const toggles: Record<string, boolean> = {};
  for (const s of secs) toggles[s.id] = true;
  const rules: Rule[] = (t?.auto_assign_keywords ?? []).filter((k) => k.trim()).map((k) => ({
    id: crypto.randomUUID(), field: "meeting_title", operator: "contains", value: k,
  }));
  const actions: Action[] = (storedActions ?? []).map((a) => ({
    id: crypto.randomUUID(), type: a.type, folderId: a.folderId,
  }));
  return { name: t?.name ?? "", sections: secs, sectionToggles: toggles, rules, actions };
}

function TemplateDetail({
  template, isCreateMode, onBack, onSave, onDuplicate, onDelete,
}: {
  template: Template | null; isCreateMode: boolean; onBack: () => void;
  onSave: (data: CreateTemplateData, actions: Action[]) => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const { user } = useAuth();
  const isBuiltIn = template?.type === "built_in";

  const storedActions = template ? loadActions()[template.id] : undefined;
  const [form, setForm] = useState<EditorState>(() => initEditor(template ?? undefined, storedActions));
  const [isEditingName, setIsEditingName] = useState(isCreateMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewRecordId, setPreviewRecordId] = useState(records[0]?.id ?? "");

  function updateForm(p: Partial<EditorState>) { setForm((prev) => ({ ...prev, ...p })); }

  function updateSection(id: string, updated: TemplateSection) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => s.id === id ? updated : s),
    }));
  }

  function removeSection(id: string) {
    setForm((prev) => {
      const next = prev.sections.filter((s) => s.id !== id);
      const toggles = { ...prev.sectionToggles };
      delete toggles[id];
      return { ...prev, sections: next, sectionToggles: toggles };
    });
  }

  function moveSection(from: number, to: number) {
    setForm((prev) => {
      const next = [...prev.sections];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...prev, sections: next };
    });
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("Template name is required"); return; }
    const active = form.sections.filter((s) => form.sectionToggles[s.id] !== false);
    if (active.length === 0) { toast.error("At least one section must be enabled"); return; }
    const keywords = form.rules.filter((r) => r.value.trim()).map((r) => r.value.trim());
    onSave({
      name: form.name.trim(),
      description: template?.description ?? null,
      instructions: template?.instructions ?? null,
      sections: active,
      auto_assign_keywords: keywords,
      is_default: template?.is_default ?? false,
    }, form.actions);
  }

  const enabled = form.sections.filter((s) => form.sectionToggles[s.id] !== false);
  const creatorName = isBuiltIn ? "System" : (user?.user_metadata?.full_name as string || "Me");
  const createdDate = template?.created_at ? fmtDate(template.created_at) : "Just now";

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 overflow-auto min-w-0">
        <div className="px-[32px] pt-[28px] pb-[48px]">

          {/* Breadcrumb + Duplicate button */}
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList className="text-[13px]">
                <BreadcrumbItem><BreadcrumbLink asChild><button type="button" onClick={onBack}>Templates</button></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>{isCreateMode ? "New template" : (template?.name ?? "Template")}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {isBuiltIn && !isCreateMode && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">Editing will create a copy</span>
                <Button variant="pill-outline" onClick={onDuplicate} className="h-8 px-[14px] gap-[6px] text-[12px]">
                  <Icon icon={Copy01Icon} size={13} /> Duplicate
                </Button>
              </div>
            )}
          </div>

          {/* Title + meta badge */}
          <div className="mt-5 mb-6">
            {isEditingName ? (
              <Input
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                onBlur={() => { if (form.name.trim()) setIsEditingName(false); }}
                onKeyDown={(e) => { if (e.key === "Enter" && form.name.trim()) setIsEditingName(false); if (e.key === "Escape") setIsEditingName(false); }}
                placeholder="Template name"
                className="h-auto border-none bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
                style={{ fontSize: "24px", lineHeight: "1.3" }}
                autoFocus
              />
            ) : (
              <h1
                className="text-2xl font-bold text-foreground leading-tight cursor-text hover:text-foreground/80 transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {form.name || "Untitled template"}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-2">
              {isBuiltIn ? (
                <Icon icon={Layers} size={14} className="text-primary" />
              ) : (
                <Avatar className="size-[20px]">
                  <AvatarFallback className="text-[8px] bg-accent text-accent-foreground">{creatorName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <span className="text-[12px] text-muted-foreground">{creatorName}</span>
              <span className="text-[12px] text-muted-foreground">&middot;</span>
              <span className="text-[12px] text-muted-foreground">{createdDate}</span>
            </div>
          </div>

          {/* Two-column */}
          <div className="flex gap-10">

            {/* Left — Editor */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">

              {/* Sections */}
              <div className="flex flex-col gap-3">
                {form.sections.map((s, i) => (
                  <DraggableSectionBlock
                    key={s.id}
                    section={s}
                    index={i}
                    isOn={form.sectionToggles[s.id] !== false}
                    isReadOnly={false}
                    onToggle={(on) => updateForm({ sectionToggles: { ...form.sectionToggles, [s.id]: on } })}
                    onMove={moveSection}
                    onUpdate={(updated) => updateSection(s.id, updated)}
                    onRemove={() => removeSection(s.id)}
                  />
                ))}
                <button onClick={() => {
                  const ns = makeSection();
                  updateForm({ sections: [...form.sections, ns], sectionToggles: { ...form.sectionToggles, [ns.id]: true } });
                }} className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 font-medium py-2">
                  <Icon icon={Add01Icon} size={14} /> Add section
                </button>
              </div>

              {/* Rules */}
              <div className="border-t border-border pt-6">
                <RulesSection rules={form.rules} onChange={(r) => updateForm({ rules: r })} readOnly={false} />
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-6">
                <ActionsSection actions={form.actions} onChange={(a) => updateForm({ actions: a })} readOnly={false} />
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                {!isCreateMode && !isBuiltIn && (
                  <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-destructive hover:text-destructive/80 text-sm">
                    <Icon icon={Delete02Icon} size={14} className="mr-1" /> Delete
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="ghost" onClick={onBack} className="text-sm">Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name.trim()} className="rounded-full h-9 px-[20px] text-[13px]">
                  {isCreateMode ? "Create template" : isBuiltIn ? "Save as copy" : "Save changes"}
                </Button>
              </div>
            </div>

            {/* Right — Preview */}
            <div className="w-[480px] shrink-0">
              <Preview sections={enabled} selectedRecordId={previewRecordId} onChangeRecord={setPreviewRecordId} />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete &ldquo;{template?.name}&rdquo;? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDeleteConfirm(false); onDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndProvider>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-auto min-w-0"><div className="px-[32px] pt-[28px] pb-[24px]">
      <div className="flex items-center justify-between mb-6"><Skeleton className="h-8 w-40" /><Skeleton className="h-9 w-[140px] rounded-full" /></div>
      <Skeleton className="h-[36px] w-full mb-px" />
      {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-[40px] w-full mb-px" />))}
    </div></div>
  );
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

function EmptyTabState({ tab }: { tab: string }) {
  const msgs: Record<string, { title: string; desc: string }> = {
    all: { title: "No templates yet", desc: "Create your first template to get started." },
    starred: { title: "No starred templates", desc: "Star templates to find them quickly." },
    system: { title: "No system templates", desc: "System templates will appear here." },
    custom: { title: "No custom templates", desc: "Create a template to customize your workflow." },
    trash: { title: "Trash is empty", desc: "Deleted templates will appear here." },
  };
  const m = msgs[tab] ?? msgs.all;
  return (
    <div className="flex flex-col items-center justify-center h-[120px] text-center">
      <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{m.desc}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type TabValue = "all" | "starred" | "system" | "custom" | "trash";

export function TemplatesPage() {
  const { templates, isLoading, create, update, remove } = useTemplates();
  const { folders } = useFolders();
  const [detailTarget, setDetailTarget] = useState<Template | "new" | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Starred
  const [starredIds, setStarredIds] = useState<Set<string>>(() => loadSet(STARRED_KEY));
  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveSet(STARRED_KEY, next);
      return next;
    });
  }, []);

  // Trash
  const [trashedIds, setTrashedIds] = useState<Set<string>>(() => loadSet(TRASHED_KEY));
  const trashOne = useCallback((id: string) => {
    setTrashedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveSet(TRASHED_KEY, next);
      return next;
    });
    toast("Template moved to trash");
  }, []);
  const restoreOne = useCallback((id: string) => {
    setTrashedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveSet(TRASHED_KEY, next);
      return next;
    });
    toast.success("Template restored");
  }, []);

  // Template actions (folder assignments)
  const [templateActions, setTemplateActions] = useState<Record<string, StoredAction[]>>(loadActions);

  // Folder name lookup for actions column
  const folderNameById = useMemo(() => {
    const map: Record<string, string> = {};
    function walk(items: typeof folders) { for (const f of items) { map[f.id] = f.name; if (f.children) walk(f.children); } }
    walk(folders);
    return map;
  }, [folders]);

  function getFolderName(templateId: string): string | null {
    const acts = templateActions[templateId];
    if (!acts?.length) return null;
    const moveAction = acts.find((a) => a.type === "move_to_folder" && a.folderId);
    return moveAction?.folderId ? (folderNameById[moveAction.folderId] ?? null) : null;
  }

  const editTemplate = detailTarget !== null && detailTarget !== "new" ? detailTarget : null;
  const isCreateMode = detailTarget === "new";

  // Categorize (memoized for stable references)
  const builtIn = useMemo(() => templates.filter((t) => t.type === "built_in"), [templates]);
  const custom = useMemo(() => templates.filter((t) => t.type === "custom"), [templates]);
  const activeTemplates = useMemo(() => templates.filter((t) => !trashedIds.has(t.id)), [templates, trashedIds]);
  const trashedTemplates = useMemo(() => templates.filter((t) => trashedIds.has(t.id)), [templates, trashedIds]);

  // Tab counts
  const allCount = activeTemplates.length;
  const starredCount = useMemo(() => activeTemplates.filter((t) => starredIds.has(t.id)).length, [activeTemplates, starredIds]);
  const systemCount = useMemo(() => builtIn.filter((t) => !trashedIds.has(t.id)).length, [builtIn, trashedIds]);
  const customCount = useMemo(() => custom.filter((t) => !trashedIds.has(t.id)).length, [custom, trashedIds]);
  const trashCount = trashedTemplates.length;

  // Display
  const display = useMemo(() => {
    switch (activeTab) {
      case "starred": return activeTemplates.filter((t) => starredIds.has(t.id));
      case "system": return builtIn.filter((t) => !trashedIds.has(t.id));
      case "custom": return custom.filter((t) => !trashedIds.has(t.id));
      case "trash": return trashedTemplates;
      default: return activeTemplates;
    }
  }, [activeTab, activeTemplates, trashedTemplates, builtIn, custom, starredIds, trashedIds]);

  const handleSave = useCallback(async (data: CreateTemplateData, actions: Action[]) => {
    const isEditingBuiltIn = editTemplate?.type === "built_in";

    // Save actions to localStorage
    const saveActionsForTemplate = (templateId: string) => {
      const stored: StoredAction[] = actions
        .filter((a) => a.folderId)
        .map((a) => ({ type: a.type, folderId: a.folderId }));
      const all = { ...loadActions(), [templateId]: stored };
      saveActions(all);
      setTemplateActions(all);
    };

    if (isCreateMode || isEditingBuiltIn) {
      // Create mode or editing built-in → create a new custom template
      const r = await create(data);
      if (r) {
        saveActionsForTemplate(r.id);
        setDetailTarget(null);
        if (isEditingBuiltIn) toast.success("Saved as a new custom template");
      }
    } else if (editTemplate) {
      const r = await update(editTemplate.id, data);
      if (r) {
        saveActionsForTemplate(editTemplate.id);
        setDetailTarget(null);
      }
    }
  }, [isCreateMode, editTemplate, create, update]);

  const handleDuplicate = useCallback(async () => {
    if (!editTemplate) return;
    const r = await create({
      name: `Copy of ${editTemplate.name}`, description: editTemplate.description,
      instructions: editTemplate.instructions,
      sections: editTemplate.sections.map((s) => ({ ...s, id: crypto.randomUUID() })),
      auto_assign_keywords: [...editTemplate.auto_assign_keywords], is_default: false,
    });
    if (r) setDetailTarget(r);
  }, [editTemplate, create]);

  const handleDelete = useCallback(async () => {
    if (!editTemplate) return;
    if (await remove(editTemplate.id)) setDetailTarget(null);
  }, [editTemplate, remove]);

  if (isLoading) return <LoadingSkeleton />;

  if (detailTarget !== null) {
    return (
      <TemplateDetail
        template={editTemplate} isCreateMode={isCreateMode}
        onBack={() => setDetailTarget(null)} onSave={handleSave}
        onDuplicate={handleDuplicate} onDelete={handleDelete}
      />
    );
  }

  const isTrashTab = activeTab === "trash";

  return (
    <div className="flex-1 overflow-auto min-w-0"><div className="px-[32px] pt-[28px] pb-[24px]">
      <div className="flex items-center justify-between gap-[12px] mb-[24px]">
        <p className="whitespace-nowrap text-foreground" style={{ fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", letterSpacing: "-0.56px" }}>Templates</p>
        <Button onClick={() => setDetailTarget("new")} className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
          <Icon icon={Add01Icon} size={14} /><span className="font-medium text-[13px]">New template</span>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TabValue); setHoveredRow(null); }} className="flex-1 min-w-0 gap-0">
        <TabsList variant="line" className="gap-6">
          <TabsTrigger value="all" variant="line">All <span className="opacity-50 font-[inherit]">{allCount}</span></TabsTrigger>
          <TabsTrigger value="starred" variant="line">Starred <span className="opacity-50 font-[inherit]">{starredCount}</span></TabsTrigger>
          <TabsTrigger value="system" variant="line">System <span className="opacity-50 font-[inherit]">{systemCount}</span></TabsTrigger>
          <TabsTrigger value="custom" variant="line">My templates <span className="opacity-50 font-[inherit]">{customCount}</span></TabsTrigger>
          <TabsTrigger
            value="trash"
            variant="line"
            className={activeTab === "trash" ? "text-destructive data-[state=active]:text-destructive data-[state=active]:after:bg-destructive" : ""}
          >
            Trash <span className="opacity-50 font-[inherit]">{trashCount}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <TH />
      {display.length > 0 ? display.map((t) => (
        <TR
          key={t.id}
          t={t}
          isHovered={hoveredRow === t.id}
          isStarred={starredIds.has(t.id)}
          isTrashed={isTrashTab}
          folderName={getFolderName(t.id)}
          onMouseEnter={() => setHoveredRow(t.id)}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => { if (!isTrashTab) setDetailTarget(t); }}
          onStar={() => toggleStar(t.id)}
          onEdit={() => { if (!isTrashTab) setDetailTarget(t); }}
          onTrash={() => trashOne(t.id)}
          onRestore={() => restoreOne(t.id)}
        />
      )) : (
        <EmptyTabState tab={activeTab} />
      )}
    </div></div>
  );
}
