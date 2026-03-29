import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  Layers,
  TextAlignLeftIcon,
  CheckListIcon,
  StarsIcon,
  NoteEditIcon,
  Target01Icon,
  Menu01Icon,
  Folder01Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
// Table (list view)
// ---------------------------------------------------------------------------

function TH() {
  const c = "uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground";
  return (
    <div className="flex items-center h-[36px] border-b border-border">
      <div className={cn("flex-[2.2] min-w-0 px-[12px]", c)}>Name</div>
      <div className={cn("flex-[2] min-w-0 px-[12px]", c)}>Description</div>
      <div className={cn("flex-[0.8] min-w-0 px-[12px]", c)}>Created by</div>
      <div className={cn("w-[130px] shrink-0 px-[8px]", c)}>Date</div>
    </div>
  );
}

function TR({ t, onClick }: { t: Template; onClick: () => void }) {
  const sys = t.type === "built_in";
  return (
    <div onClick={onClick} className="flex items-center h-[40px] transition-colors cursor-pointer border-b border-border hover:bg-accent">
      <div className="flex-[2.2] min-w-0 px-[12px] flex items-center gap-[8px]">
        <div className="size-[24px] shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon icon={Layers} size={14} className="text-primary" />
        </div>
        <p className="truncate font-medium text-[14px] text-foreground tracking-[-0.154px]">{t.name}</p>
      </div>
      <div className="flex-[2] min-w-0 px-[12px]">
        <p className="truncate text-[13px] text-muted-foreground">{t.description || "—"}</p>
      </div>
      <div className="flex-[0.8] min-w-0 px-[12px] flex items-center gap-[6px]">
        {sys ? (
          <><div className="size-[22px] rounded-full bg-primary/10 flex items-center justify-center"><Icon icon={Layers} size={11} className="text-primary" /></div><span className="text-[12px] text-muted-foreground">System</span></>
        ) : (
          <><Avatar className="size-[22px]"><AvatarFallback className="text-[9px] bg-accent text-accent-foreground">Me</AvatarFallback></Avatar><span className="text-[12px] text-muted-foreground">Me</span></>
        )}
      </div>
      <div className="w-[130px] shrink-0 px-[8px]">
        <p className="text-[13px] text-muted-foreground tracking-[-0.154px]">{fmtDate(t.created_at)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Section Block
// ---------------------------------------------------------------------------

const DRAG_TYPE = "SECTION";

function DraggableSectionBlock({
  section, index, isOn, isReadOnly, onToggle, onMove,
}: {
  section: TemplateSection; index: number; isOn: boolean; isReadOnly: boolean;
  onToggle: (on: boolean) => void; onMove: (from: number, to: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { index },
    canDrag: !isReadOnly,
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
      style={{ cursor: isReadOnly ? "default" : "grab" }}
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
          <p className="text-[15px] font-semibold text-foreground">{section.title || `Section ${index + 1}`}</p>
          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{section.instruction || "No instructions set."}</p>
        </div>
        <Switch checked={isOn} onCheckedChange={onToggle} className="shrink-0 mt-0.5" />
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

function ActionsSection({ actions, onChange, readOnly }: { actions: Action[]; onChange: (a: Action[]) => void; readOnly: boolean }) {
  const { folders } = useFolders();
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
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span className="flex items-center gap-2"><Icon icon={Folder01Icon} size={13} className="text-muted-foreground" />{f.name}</span>
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

function initEditor(t?: Template): EditorState {
  const secs = t?.sections?.length ? t.sections.map((s) => ({ ...s })) : [{ ...makeSection(), title: "Summary" }];
  const toggles: Record<string, boolean> = {};
  for (const s of secs) toggles[s.id] = true;
  const rules: Rule[] = (t?.auto_assign_keywords ?? []).filter((k) => k.trim()).map((k) => ({
    id: crypto.randomUUID(), field: "meeting_title", operator: "contains", value: k,
  }));
  return { name: t?.name ?? "", sections: secs, sectionToggles: toggles, rules, actions: [] };
}

function TemplateDetail({
  template, isCreateMode, onBack, onSave, onDuplicate, onDelete,
}: {
  template: Template | null; isCreateMode: boolean; onBack: () => void;
  onSave: (data: CreateTemplateData) => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const { user } = useAuth();
  const isBuiltIn = template?.type === "built_in";
  const isReadOnly = isBuiltIn && !isCreateMode;

  const [form, setForm] = useState<EditorState>(() => initEditor(template ?? undefined));
  const [isEditingName, setIsEditingName] = useState(isCreateMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewRecordId, setPreviewRecordId] = useState(records[0]?.id ?? "");

  function updateForm(p: Partial<EditorState>) { setForm((prev) => ({ ...prev, ...p })); }

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
    });
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
            {isReadOnly && (
              <Button variant="pill-outline" onClick={onDuplicate} className="h-8 px-[14px] gap-[6px] text-[12px]">
                <Icon icon={Copy01Icon} size={13} /> Duplicate
              </Button>
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
                className="text-[28px] font-bold h-auto border-0 shadow-none focus-visible:ring-0 px-0 py-0 bg-transparent tracking-[-0.56px]"
                autoFocus
              />
            ) : (
              <h1
                className="text-[28px] font-bold text-foreground tracking-[-0.56px] cursor-text hover:text-foreground/80 transition-colors"
                onClick={() => { if (!isReadOnly) setIsEditingName(true); }}
              >
                {form.name || "Untitled template"}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-2">
              {isBuiltIn ? (
                <div className="size-[20px] rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon icon={Layers} size={10} className="text-primary" />
                </div>
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
                    isReadOnly={isReadOnly}
                    onToggle={(on) => updateForm({ sectionToggles: { ...form.sectionToggles, [s.id]: on } })}
                    onMove={moveSection}
                  />
                ))}
                {!isReadOnly && (
                  <button onClick={() => {
                    const ns = makeSection();
                    updateForm({ sections: [...form.sections, ns], sectionToggles: { ...form.sectionToggles, [ns.id]: true } });
                  }} className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 font-medium py-2">
                    <Icon icon={Add01Icon} size={14} /> Add section
                  </button>
                )}
              </div>

              {/* Rules */}
              <div className="border-t border-border pt-6">
                <RulesSection rules={form.rules} onChange={(r) => updateForm({ rules: r })} readOnly={isReadOnly} />
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-6">
                <ActionsSection actions={form.actions} onChange={(a) => updateForm({ actions: a })} readOnly={isReadOnly} />
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                {!isReadOnly && (
                  <>
                    {!isCreateMode && (
                      <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-destructive hover:text-destructive/80 text-sm">
                        <Icon icon={Delete02Icon} size={14} className="mr-1" /> Delete
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="ghost" onClick={onBack} className="text-sm">Cancel</Button>
                    <Button onClick={handleSave} disabled={!form.name.trim()} className="rounded-full h-9 px-[20px] text-[13px]">
                      {isCreateMode ? "Create template" : "Save changes"}
                    </Button>
                  </>
                )}
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
// Main
// ---------------------------------------------------------------------------

export function TemplatesPage() {
  const { templates, isLoading, create, update, remove } = useTemplates();
  const [detailTarget, setDetailTarget] = useState<Template | "new" | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "built_in" | "custom">("all");

  const editTemplate = detailTarget !== null && detailTarget !== "new" ? detailTarget : null;
  const isCreateMode = detailTarget === "new";
  const builtIn = templates.filter((t) => t.type === "built_in");
  const custom = templates.filter((t) => t.type === "custom");
  const display = useMemo(() => activeTab === "built_in" ? builtIn : activeTab === "custom" ? custom : templates, [templates, builtIn, custom, activeTab]);

  const handleSave = useCallback(async (data: CreateTemplateData) => {
    if (isCreateMode) { const r = await create(data); if (r) setDetailTarget(null); }
    else if (editTemplate) { const r = await update(editTemplate.id, data); if (r) setDetailTarget(null); }
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

  return (
    <div className="flex-1 overflow-auto min-w-0"><div className="px-[32px] pt-[28px] pb-[24px]">
      <div className="flex items-center justify-between gap-[12px] mb-[24px]">
        <p className="whitespace-nowrap text-foreground" style={{ fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", letterSpacing: "-0.56px" }}>Templates</p>
        <Button onClick={() => setDetailTarget("new")} className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
          <Icon icon={Add01Icon} size={14} /><span className="font-medium text-[13px]">New template</span>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "built_in" | "custom")} className="flex-1 min-w-0 gap-0">
        <TabsList variant="line" className="gap-6">
          <TabsTrigger value="all" variant="line">All <span className="opacity-50 font-[inherit]">{templates.length}</span></TabsTrigger>
          <TabsTrigger value="built_in" variant="line">Built-in <span className="opacity-50 font-[inherit]">{builtIn.length}</span></TabsTrigger>
          <TabsTrigger value="custom" variant="line">My templates <span className="opacity-50 font-[inherit]">{custom.length}</span></TabsTrigger>
        </TabsList>
      </Tabs>
      <TH />
      {display.length > 0 ? display.map((t) => <TR key={t.id} t={t} onClick={() => setDetailTarget(t)} />) : (
        <div className="flex items-center justify-center h-[120px] text-sm text-muted-foreground">No templates yet</div>
      )}
    </div></div>
  );
}
