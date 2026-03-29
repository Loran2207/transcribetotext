import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Add01Icon,
  Cancel01Icon,
  Copy01Icon,
  Delete02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { cn } from "@/app/components/ui/utils";
import { useTemplates } from "@/hooks/use-templates";
import { useFolders } from "./folder-context";
import { useAuth } from "./auth-context";
import { records } from "./records-table";
import type {
  Template,
  TemplateSection,
  CreateTemplateData,
} from "@/lib/templates";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEmptySection(): TemplateSection {
  return { id: crypto.randomUUID(), title: "", instruction: "" };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

// Section icon mapping by keyword
const SECTION_ICONS = [
  { keywords: ["summary", "overview"], icon: TextAlignLeftIcon },
  { keywords: ["action", "task", "todo"], icon: CheckListIcon },
  { keywords: ["decision", "key"], icon: Target01Icon },
  { keywords: ["insight", "analysis"], icon: StarsIcon },
  { keywords: ["outline", "topic", "custom"], icon: NoteEditIcon },
] as const;

function getSectionIcon(title: string) {
  const lower = title.toLowerCase();
  for (const entry of SECTION_ICONS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry.icon;
  }
  return Menu01Icon;
}

// ---------------------------------------------------------------------------
// Table Components
// ---------------------------------------------------------------------------

function TemplateTableHeader() {
  return (
    <div className="flex items-center h-[36px] border-b border-border">
      <div className="flex-[2.2] min-w-0 px-[12px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Name</span>
      </div>
      <div className="flex-[2] min-w-0 px-[12px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Description</span>
      </div>
      <div className="flex-[0.8] min-w-0 px-[12px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Created by</span>
      </div>
      <div className="w-[130px] shrink-0 px-[8px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Date</span>
      </div>
    </div>
  );
}

function TemplateTableRow({ template, onClick }: { template: Template; onClick: () => void }) {
  const isSystem = template.type === "built_in";
  return (
    <div onClick={onClick} className="flex items-center h-[40px] last:border-b-0 transition-colors cursor-pointer border-b border-border hover:bg-accent">
      <div className="flex-[2.2] min-w-0 px-[12px] flex items-center gap-[8px]">
        <div className="flex items-center justify-center size-[24px] shrink-0 rounded-md bg-primary/10">
          <Icon icon={Layers} size={14} className="text-primary" />
        </div>
        <p className="truncate leading-[20px] font-medium text-[14px] text-foreground tracking-[-0.154px]">{template.name}</p>
      </div>
      <div className="flex-[2] min-w-0 px-[12px]">
        <p className="truncate text-[13px] text-muted-foreground">{template.description || "—"}</p>
      </div>
      <div className="flex-[0.8] min-w-0 px-[12px] flex items-center gap-[6px]">
        {isSystem ? (
          <>
            <div className="size-[22px] rounded-full bg-primary/10 flex items-center justify-center">
              <Icon icon={Layers} size={11} className="text-primary" />
            </div>
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
      <div className="w-[130px] shrink-0 px-[8px]">
        <p className="leading-[20px] whitespace-nowrap text-[13px] text-muted-foreground tracking-[-0.154px]">{formatDate(template.created_at)}</p>
      </div>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="flex-1 overflow-auto min-w-0">
      <div className="px-[32px] pt-[28px] pb-[24px]">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-[140px] rounded-full" />
        </div>
        <Skeleton className="h-[36px] w-full mb-px" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[40px] w-full mb-px" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selection Rules
// ---------------------------------------------------------------------------

interface SelectionRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

function SelectionRulesSection({
  rules,
  onChange,
  readOnly,
}: {
  rules: SelectionRule[];
  onChange: (rules: SelectionRule[]) => void;
  readOnly: boolean;
}) {
  function addRule() {
    onChange([...rules, { id: crypto.randomUUID(), field: "meeting_title", operator: "contains", value: "" }]);
  }

  function updateRule(id: string, patch: Partial<SelectionRule>) {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRule(id: string) {
    onChange(rules.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-[16px] font-semibold text-foreground">Template selection rules</h3>
        <p className="text-[13px] text-muted-foreground mt-1">
          When these conditions are met, the template is applied. Note: matching is case sensitive.
        </p>
      </div>

      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0 w-[40px]">When</span>
          <Select value={rule.field} onValueChange={(v) => updateRule(rule.id, { field: v })} disabled={readOnly}>
            <SelectTrigger className="w-[180px] h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting_title">Meeting Title</SelectItem>
              <SelectItem value="ai_classification">AI Classification</SelectItem>
              <SelectItem value="host_email">Meeting Host Email</SelectItem>
              <SelectItem value="participant_email">Participant Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={rule.operator} onValueChange={(v) => updateRule(rule.id, { operator: v })} disabled={readOnly}>
            <SelectTrigger className="w-[100px] h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="is">is</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="starts_with">starts with</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={rule.value}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            placeholder="e.g. Weekly Sync, Customer Call"
            className="flex-1 h-9 rounded-lg"
            disabled={readOnly}
          />
          {!readOnly && (
            <button onClick={() => removeRule(rule.id)} className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Icon icon={Delete01Icon} size={16} />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button onClick={addRule} className="flex items-center gap-1 text-[13px] text-primary hover:text-primary/80 transition-colors font-medium">
          <Icon icon={Add01Icon} size={14} />
          Add condition
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface TemplateAction {
  id: string;
  type: string;
  folderId: string | null;
}

function ActionsSection({
  actions,
  onChange,
  readOnly,
}: {
  actions: TemplateAction[];
  onChange: (actions: TemplateAction[]) => void;
  readOnly: boolean;
}) {
  const { folders } = useFolders();

  function addAction() {
    onChange([...actions, { id: crypto.randomUUID(), type: "move_to_folder", folderId: null }]);
  }

  function updateAction(id: string, patch: Partial<TemplateAction>) {
    onChange(actions.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeAction(id: string) {
    onChange(actions.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-[16px] font-semibold text-foreground">Actions</h3>
        <p className="text-[13px] text-muted-foreground mt-1">
          Run actions like moving to a folder whenever a meeting is matched to a template.
        </p>
      </div>

      <div className="border-t border-border" />

      {actions.map((action) => (
        <div key={action.id} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0 whitespace-nowrap">When template is applied:</span>
          <Select value={action.type} onValueChange={(v) => updateAction(action.id, { type: v })} disabled={readOnly}>
            <SelectTrigger className="w-[180px] h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="move_to_folder">Move to folder</SelectItem>
              <SelectItem value="share_to_email">Share to email</SelectItem>
            </SelectContent>
          </Select>
          {action.type === "move_to_folder" && (
            <Select value={action.folderId ?? ""} onValueChange={(v) => updateAction(action.id, { folderId: v || null })} disabled={readOnly}>
              <SelectTrigger className="flex-1 h-9 rounded-lg">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <span className="flex items-center gap-2">
                      <Icon icon={Folder01Icon} size={13} className="text-muted-foreground" />
                      {f.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {action.type === "share_to_email" && (
            <Input
              placeholder="email@example.com"
              className="flex-1 h-9 rounded-lg"
              disabled={readOnly}
            />
          )}
          {!readOnly && (
            <button onClick={() => removeAction(action.id)} className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Icon icon={Delete01Icon} size={16} />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button onClick={addAction} className="flex items-center gap-1 text-[13px] text-primary hover:text-primary/80 transition-colors font-medium">
          <Icon icon={Add01Icon} size={14} />
          Add action
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview — Document-style
// ---------------------------------------------------------------------------

function PreviewCard({ sections, previewRecordName }: { sections: TemplateSection[]; previewRecordName: string }) {
  return (
    <div className="sticky top-6">
      {/* Document card with shadow */}
      <div
        className="rounded-2xl border border-border bg-card overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)" }}
      >
        {/* Document header */}
        <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-[8px] rounded-full bg-primary" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Summary Preview</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">{previewRecordName}</p>
        </div>

        {/* Document body */}
        <div className="px-6 py-5">
          {sections.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">Enable sections to see preview</p>
          ) : (
            sections.map((s, i) => (
              <div key={s.id} className={i > 0 ? "mt-5" : ""}>
                <h3
                  className="text-foreground flex items-center gap-1.5"
                  style={{ fontWeight: 500, fontSize: "14px", marginBottom: "6px" }}
                >
                  <Icon icon={getSectionIcon(s.title)} size={14} className="text-primary/70" />
                  {s.title || `Section ${i + 1}`}
                </h3>
                <div className="space-y-1.5">
                  <div className="h-[10px] rounded-full bg-muted" style={{ width: `${85 + Math.random() * 15}%` }} />
                  <div className="h-[10px] rounded-full bg-muted" style={{ width: `${65 + Math.random() * 20}%` }} />
                  <div className="h-[10px] rounded-full bg-muted/60" style={{ width: `${40 + Math.random() * 25}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record selector below preview */}
      <div className="mt-3 flex items-center justify-center">
        <span className="text-[11px] text-muted-foreground">
          Preview based on: <span className="font-medium text-foreground">{previewRecordName}</span>
        </span>
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
  rules: SelectionRule[];
  actions: TemplateAction[];
}

function initEditorState(template?: Template): EditorState {
  const sections = template?.sections?.length
    ? template.sections.map((s) => ({ ...s }))
    : [{ ...makeEmptySection(), title: "Summary" }];

  const toggles: Record<string, boolean> = {};
  for (const s of sections) toggles[s.id] = true;

  // Convert auto_assign_keywords to rules
  const rules: SelectionRule[] = (template?.auto_assign_keywords ?? [])
    .filter((kw) => kw.trim())
    .map((kw) => ({ id: crypto.randomUUID(), field: "meeting_title", operator: "contains", value: kw }));

  return { name: template?.name ?? "", sections, sectionToggles: toggles, rules, actions: [] };
}

function TemplateDetail({
  template, isCreateMode, onBack, onSave, onDuplicate, onDelete,
}: {
  template: Template | null; isCreateMode: boolean; onBack: () => void;
  onSave: (data: CreateTemplateData) => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const isBuiltIn = template?.type === "built_in";
  const isReadOnly = isBuiltIn && !isCreateMode;

  const [form, setForm] = useState<EditorState>(() => initEditorState(template ?? undefined));
  const [isEditingName, setIsEditingName] = useState(isCreateMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Use first mock record as preview source
  const previewRecord = records[0];

  function updateForm(patch: Partial<EditorState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function updateSection(id: string, patch: Partial<TemplateSection>) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function addSection() {
    const s = makeEmptySection();
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, s],
      sectionToggles: { ...prev.sectionToggles, [s.id]: true },
    }));
  }

  function removeSection(id: string) {
    if (form.sections.length <= 1) return;
    setForm((prev) => {
      const { [id]: _, ...rest } = prev.sectionToggles;
      return { ...prev, sections: prev.sections.filter((s) => s.id !== id), sectionToggles: rest };
    });
  }

  function moveSection(id: string, dir: "up" | "down") {
    setForm((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === id);
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.sections.length) return prev;
      const next = [...prev.sections];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...prev, sections: next };
    });
  }

  function toggleSection(id: string, on: boolean) {
    setForm((prev) => ({ ...prev, sectionToggles: { ...prev.sectionToggles, [id]: on } }));
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("Template name is required"); return; }
    const active = form.sections.filter((s) => form.sectionToggles[s.id] !== false);
    if (active.length === 0) { toast.error("At least one section must be enabled"); return; }

    // Convert rules back to keywords
    const keywords = form.rules
      .filter((r) => r.value.trim())
      .map((r) => r.value.trim());

    onSave({
      name: form.name.trim(),
      description: template?.description ?? null,
      instructions: template?.instructions ?? null,
      sections: active,
      auto_assign_keywords: keywords,
      is_default: template?.is_default ?? false,
    });
  }

  const enabledSections = form.sections.filter((s) => form.sectionToggles[s.id] !== false);

  return (
    <>
      <div className="flex-1 overflow-auto min-w-0">
        <div className="px-[32px] pt-[28px] pb-[48px]">

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList className="text-[13px]">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button type="button" onClick={onBack}>Templates</button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isCreateMode ? "New template" : (template?.name ?? "Template")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Two-column layout */}
          <div className="flex gap-10 mt-6">

            {/* Left — Editor */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">

              {/* Inline editable name */}
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</span>
                {isEditingName ? (
                  <Input
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    onBlur={() => { if (form.name.trim()) setIsEditingName(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && form.name.trim()) setIsEditingName(false); }}
                    placeholder="Template name"
                    className="text-[26px] font-semibold h-auto border-0 shadow-none focus-visible:ring-0 px-0 py-1 bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-[26px] font-semibold text-foreground cursor-text py-1 hover:text-foreground/80 transition-colors"
                    onClick={() => { if (!isReadOnly) setIsEditingName(true); }}
                  >
                    {form.name || "Untitled template"}
                  </h1>
                )}
              </div>

              {/* Section blocks */}
              <div className="flex flex-col gap-3">
                {form.sections.map((section, idx) => {
                  const isOn = form.sectionToggles[section.id] !== false;
                  const sectionIcon = getSectionIcon(section.title);

                  return (
                    <div
                      key={section.id}
                      className={cn(
                        "rounded-xl border border-border bg-card px-4 py-4 transition-opacity",
                        !isOn && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Drag handle area */}
                        {!isReadOnly && (
                          <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                            <button
                              onClick={() => moveSection(section.id, "up")}
                              disabled={idx === 0}
                              className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-0 transition-all p-0.5"
                            >
                              <Icon icon={ArrowUp01Icon} size={11} />
                            </button>
                            {/* Drag dots */}
                            <div className="flex flex-col gap-[2px] py-0.5">
                              <div className="flex gap-[2px]"><div className="size-[3px] rounded-full bg-muted-foreground/30" /><div className="size-[3px] rounded-full bg-muted-foreground/30" /></div>
                              <div className="flex gap-[2px]"><div className="size-[3px] rounded-full bg-muted-foreground/30" /><div className="size-[3px] rounded-full bg-muted-foreground/30" /></div>
                              <div className="flex gap-[2px]"><div className="size-[3px] rounded-full bg-muted-foreground/30" /><div className="size-[3px] rounded-full bg-muted-foreground/30" /></div>
                            </div>
                            <button
                              onClick={() => moveSection(section.id, "down")}
                              disabled={idx === form.sections.length - 1}
                              className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-0 transition-all p-0.5"
                            >
                              <Icon icon={ArrowDown01Icon} size={11} />
                            </button>
                          </div>
                        )}

                        {/* Icon */}
                        <div className="shrink-0 pt-0.5">
                          <Icon icon={sectionIcon} size={18} className="text-muted-foreground" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {isReadOnly ? (
                            <p className="text-[15px] font-semibold text-foreground">{section.title || `Section ${idx + 1}`}</p>
                          ) : (
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              placeholder={`Section ${idx + 1}`}
                              className="text-[15px] font-semibold h-auto border-0 shadow-none focus-visible:ring-0 px-0 py-0 bg-transparent"
                            />
                          )}
                          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                            {section.instruction || "No instructions set."}
                          </p>
                        </div>

                        {/* Toggle */}
                        <div className="shrink-0 pt-1">
                          <Switch
                            checked={isOn}
                            onCheckedChange={(checked) => toggleSection(section.id, checked)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!isReadOnly && (
                  <button
                    onClick={addSection}
                    className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 transition-colors font-medium py-2"
                  >
                    <Icon icon={Add01Icon} size={14} />
                    Add section
                  </button>
                )}
              </div>

              {/* Template selection rules */}
              <div className="border-t border-border pt-6">
                <SelectionRulesSection
                  rules={form.rules}
                  onChange={(rules) => updateForm({ rules })}
                  readOnly={isReadOnly}
                />
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-6">
                <ActionsSection
                  actions={form.actions}
                  onChange={(actions) => updateForm({ actions })}
                  readOnly={isReadOnly}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                {isReadOnly ? (
                  <>
                    <p className="flex-1 text-xs text-muted-foreground">Built-in templates are read-only</p>
                    <Button variant="pill-outline" onClick={onDuplicate} className="h-9 px-[16px] gap-[7px]">
                      <Icon icon={Copy01Icon} size={14} />
                      Duplicate &amp; edit
                    </Button>
                  </>
                ) : (
                  <>
                    {!isCreateMode && (
                      <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-destructive hover:text-destructive/80 text-sm">
                        <Icon icon={Delete02Icon} size={14} className="mr-1" />
                        Delete
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
            <div className="w-[340px] shrink-0">
              <PreviewCard
                sections={enabledSections}
                previewRecordName={previewRecord?.name ?? "Sample Meeting"}
              />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{template?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDeleteConfirm(false); onDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TemplatesPage() {
  const { templates, isLoading, create, update, remove } = useTemplates();

  const [detailTarget, setDetailTarget] = useState<Template | "new" | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "built_in" | "custom">("all");

  const isDetailView = detailTarget !== null;
  const editTemplate = detailTarget !== null && detailTarget !== "new" ? detailTarget : null;
  const isCreateMode = detailTarget === "new";

  const builtIn = templates.filter((t) => t.type === "built_in");
  const custom = templates.filter((t) => t.type === "custom");

  const displayTemplates = useMemo(() => {
    if (activeTab === "built_in") return builtIn;
    if (activeTab === "custom") return custom;
    return templates;
  }, [templates, builtIn, custom, activeTab]);

  const handleSave = useCallback(async (data: CreateTemplateData) => {
    if (isCreateMode) {
      const result = await create(data);
      if (result) setDetailTarget(null);
    } else if (editTemplate) {
      const result = await update(editTemplate.id, data);
      if (result) setDetailTarget(null);
    }
  }, [isCreateMode, editTemplate, create, update]);

  const handleDuplicate = useCallback(async () => {
    if (!editTemplate) return;
    const result = await create({
      name: `Copy of ${editTemplate.name}`,
      description: editTemplate.description,
      instructions: editTemplate.instructions,
      sections: editTemplate.sections.map((s) => ({ ...s, id: crypto.randomUUID() })),
      auto_assign_keywords: [...editTemplate.auto_assign_keywords],
      is_default: false,
    });
    if (result) setDetailTarget(result);
  }, [editTemplate, create]);

  const handleDelete = useCallback(async () => {
    if (!editTemplate) return;
    const success = await remove(editTemplate.id);
    if (success) setDetailTarget(null);
  }, [editTemplate, remove]);

  if (isLoading) return <TemplatesSkeleton />;

  if (isDetailView) {
    return (
      <TemplateDetail
        template={editTemplate}
        isCreateMode={isCreateMode}
        onBack={() => setDetailTarget(null)}
        onSave={handleSave}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="flex-1 overflow-auto min-w-0">
      <div className="px-[32px] pt-[28px] pb-[24px]">
        <div className="flex items-center justify-between gap-[12px] mb-[24px]">
          <p className="whitespace-nowrap text-foreground" style={{ fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", letterSpacing: "-0.56px" }}>
            Templates
          </p>
          <Button
            onClick={() => setDetailTarget("new")}
            className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Icon icon={Add01Icon} size={14} />
            <span className="font-medium text-[13px]">New template</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "all" | "built_in" | "custom")} className="flex-1 min-w-0 gap-0">
          <TabsList variant="line" className="gap-6">
            <TabsTrigger value="all" variant="line">All <span className="opacity-50 font-[inherit]">{templates.length}</span></TabsTrigger>
            <TabsTrigger value="built_in" variant="line">Built-in <span className="opacity-50 font-[inherit]">{builtIn.length}</span></TabsTrigger>
            <TabsTrigger value="custom" variant="line">My templates <span className="opacity-50 font-[inherit]">{custom.length}</span></TabsTrigger>
          </TabsList>
        </Tabs>

        <TemplateTableHeader />

        {displayTemplates.length > 0 ? (
          displayTemplates.map((t) => (
            <TemplateTableRow key={t.id} template={t} onClick={() => setDetailTarget(t)} />
          ))
        ) : (
          <div className="flex items-center justify-center h-[120px] text-sm text-muted-foreground">No templates yet</div>
        )}
      </div>
    </div>
  );
}
