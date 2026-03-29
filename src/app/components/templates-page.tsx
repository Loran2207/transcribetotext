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
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Label } from "@/app/components/ui/label";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
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
import { useAuth } from "./auth-context";
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

// ---------------------------------------------------------------------------
// Table — matches RecordsTable pattern exactly
// ---------------------------------------------------------------------------

function TemplateTableHeader() {
  return (
    <div className="flex items-center h-[36px] border-b border-border">
      {/* Name */}
      <div className="flex-[2.2] min-w-0 px-[12px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Name</span>
      </div>
      {/* Description */}
      <div className="flex-[2] min-w-0 px-[12px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Description</span>
      </div>
      {/* Created by */}
      <div className="flex-[0.8] min-w-0 px-[12px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Created by</span>
      </div>
      {/* Date */}
      <div className="w-[130px] shrink-0 px-[8px] flex items-center">
        <span className="uppercase tracking-[0.3404px] font-medium text-[11px] text-foreground">Date</span>
      </div>
    </div>
  );
}

function TemplateTableRow({
  template,
  onClick,
}: {
  template: Template;
  onClick: () => void;
}) {
  const isSystem = template.type === "built_in";

  return (
    <div
      onClick={onClick}
      className="flex items-center h-[40px] last:border-b-0 transition-colors cursor-pointer border-b border-border hover:bg-accent"
    >
      {/* Name */}
      <div className="flex-[2.2] min-w-0 px-[12px] flex items-center gap-[8px]">
        <div className="flex items-center justify-center size-[24px] shrink-0 rounded-md bg-primary/10">
          <Icon icon={Layers} size={14} className="text-primary" />
        </div>
        <p className="truncate leading-[20px] font-medium text-[14px] text-foreground tracking-[-0.154px]">
          {template.name}
        </p>
      </div>

      {/* Description */}
      <div className="flex-[2] min-w-0 px-[12px]">
        <p className="truncate text-[13px] text-muted-foreground">{template.description || "—"}</p>
      </div>

      {/* Created by */}
      <div className="flex-[0.8] min-w-0 px-[12px] flex items-center gap-[6px]">
        {isSystem ? (
          <div className="flex items-center gap-[6px]">
            <div className="size-[22px] rounded-full bg-primary/10 flex items-center justify-center">
              <Icon icon={Layers} size={11} className="text-primary" />
            </div>
            <span className="text-[12px] text-muted-foreground">System</span>
          </div>
        ) : (
          <div className="flex items-center gap-[6px]">
            <Avatar className="size-[22px]">
              <AvatarFallback className="text-[9px] bg-accent text-accent-foreground">Me</AvatarFallback>
            </Avatar>
            <span className="text-[12px] text-muted-foreground">Me</span>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="w-[130px] shrink-0 px-[8px]">
        <p className="leading-[20px] whitespace-nowrap text-[13px] text-muted-foreground tracking-[-0.154px]">
          {formatDate(template.created_at)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function TemplatesSkeleton() {
  return (
    <div className="flex-1 overflow-auto min-w-0">
      <div className="px-[32px] pt-[28px] pb-[24px]">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-[200px] rounded-full" />
            <Skeleton className="h-9 w-[140px] rounded-full" />
          </div>
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
// Detail Page — Editor + Preview
// ---------------------------------------------------------------------------

interface EditorState {
  name: string;
  description: string;
  instructions: string;
  sections: TemplateSection[];
  sectionToggles: Record<string, boolean>;
}

function initEditorState(template?: Template): EditorState {
  const sections = template?.sections?.length
    ? template.sections.map((s) => ({ ...s }))
    : [{ ...makeEmptySection(), title: "Summary" }];

  const toggles: Record<string, boolean> = {};
  for (const s of sections) {
    toggles[s.id] = true;
  }

  return {
    name: template?.name ?? "",
    description: template?.description ?? "",
    instructions: template?.instructions ?? "",
    sections,
    sectionToggles: toggles,
  };
}

function TemplateDetail({
  template,
  isCreateMode,
  onBack,
  onSave,
  onDuplicate,
  onDelete,
}: {
  template: Template | null;
  isCreateMode: boolean;
  onBack: () => void;
  onSave: (data: CreateTemplateData) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isBuiltIn = template?.type === "built_in";
  const isReadOnly = isBuiltIn && !isCreateMode;

  const [form, setForm] = useState<EditorState>(() => initEditorState(template ?? undefined));
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const newSection = makeEmptySection();
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
      sectionToggles: { ...prev.sectionToggles, [newSection.id]: true },
    }));
    setExpandedSection(newSection.id);
  }

  function removeSection(id: string) {
    if (form.sections.length <= 1) return;
    setForm((prev) => {
      const { [id]: _, ...restToggles } = prev.sectionToggles;
      return {
        ...prev,
        sections: prev.sections.filter((s) => s.id !== id),
        sectionToggles: restToggles,
      };
    });
    if (expandedSection === id) setExpandedSection(null);
  }

  function moveSection(id: string, direction: "up" | "down") {
    setForm((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.sections.length) return prev;
      const next = [...prev.sections];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...prev, sections: next };
    });
  }

  function toggleSection(id: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      sectionToggles: { ...prev.sectionToggles, [id]: checked },
    }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    const activeSections = form.sections.filter((s) => form.sectionToggles[s.id] !== false);
    if (activeSections.length === 0) {
      toast.error("At least one section must be enabled");
      return;
    }
    onSave({
      name: form.name.trim(),
      description: form.description.trim() || null,
      instructions: form.instructions.trim() || null,
      sections: activeSections,
      auto_assign_keywords: template?.auto_assign_keywords ?? [],
      is_default: template?.is_default ?? false,
    });
  }

  const enabledSections = form.sections.filter((s) => form.sectionToggles[s.id] !== false);

  return (
    <>
      <div className="flex-1 overflow-auto min-w-0">
        <div className="px-[32px] pt-[28px] pb-[24px]">

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
                <BreadcrumbPage>
                  {isCreateMode ? "New template" : (template?.name ?? "Template")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Two-column layout */}
          <div className="flex gap-8 mt-6">

            {/* Left — Editor */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="Template name"
                  disabled={isReadOnly}
                  className="text-lg font-medium h-11"
                  autoFocus={isCreateMode}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="Short description..."
                  disabled={isReadOnly}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">AI Instructions</Label>
                <Textarea
                  value={form.instructions}
                  onChange={(e) => updateForm({ instructions: e.target.value })}
                  placeholder="Describe the purpose and how the summary should be structured..."
                  rows={4}
                  disabled={isReadOnly}
                />
              </div>

              {/* Sections */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Sections ({enabledSections.length} active)
                </Label>

                {form.sections.map((section, idx) => {
                  const isExpanded = expandedSection === section.id;
                  const isOn = form.sectionToggles[section.id] !== false;

                  return (
                    <div key={section.id} className="rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-2 px-3 h-[44px]">
                        {!isReadOnly && (
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveSection(section.id, "up")}
                              disabled={idx === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors p-0.5"
                            >
                              <Icon icon={ArrowUp01Icon} size={11} />
                            </button>
                            <button
                              onClick={() => moveSection(section.id, "down")}
                              disabled={idx === form.sections.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors p-0.5"
                            >
                              <Icon icon={ArrowDown01Icon} size={11} />
                            </button>
                          </div>
                        )}
                        <button
                          className="flex-1 text-left text-sm font-medium text-foreground truncate"
                          onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        >
                          {section.title || `Section ${idx + 1}`}
                        </button>
                        <Switch
                          checked={isOn}
                          onCheckedChange={(checked) => toggleSection(section.id, checked)}
                          disabled={isReadOnly}
                        />
                      </div>

                      {isExpanded && !isReadOnly && (
                        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-border pt-3">
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Section title"
                            className="text-sm"
                          />
                          <Textarea
                            value={section.instruction}
                            onChange={(e) => updateSection(section.id, { instruction: e.target.value })}
                            placeholder="Instructions for this section..."
                            rows={3}
                            className="text-xs"
                          />
                          {form.sections.length > 1 && (
                            <button
                              onClick={() => removeSection(section.id)}
                              className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors self-start"
                            >
                              <Icon icon={Delete02Icon} size={12} />
                              Remove section
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isReadOnly && (
                  <button
                    onClick={addSection}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1"
                  >
                    <Icon icon={Add01Icon} size={14} />
                    Add section
                  </button>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
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
                      <Button
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive hover:text-destructive/80 text-sm"
                      >
                        <Icon icon={Delete02Icon} size={14} className="mr-1" />
                        Delete
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="ghost" onClick={onBack} className="text-sm">Cancel</Button>
                    <Button
                      onClick={handleSave}
                      disabled={!form.name.trim()}
                      className="rounded-full h-9 px-[20px] text-[13px]"
                    >
                      {isCreateMode ? "Create template" : "Save changes"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right — Preview */}
            <div className="w-[400px] shrink-0">
              <div className="sticky top-6 rounded-xl border border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground mb-4">Preview</p>
                {enabledSections.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Enable at least one section to see the preview</p>
                ) : (
                  <div className="flex flex-col">
                    {enabledSections.map((s, i) => (
                      <div key={s.id}>
                        <h3
                          className="text-foreground"
                          style={{ fontWeight: 500, fontSize: "15px", marginTop: i > 0 ? "20px" : "0", marginBottom: "8px" }}
                        >
                          {s.title || `Section ${i + 1}`}
                        </h3>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          AI-generated content for &ldquo;{s.title || `Section ${i + 1}`}&rdquo;
                          will appear here based on the transcription content.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            <AlertDialogAction
              onClick={() => { setShowDeleteConfirm(false); onDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
  const { user } = useAuth();

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

  const handleRowClick = useCallback((t: Template) => {
    setDetailTarget(t);
  }, []);

  const handleBack = useCallback(() => {
    setDetailTarget(null);
  }, []);

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
        onBack={handleBack}
        onSave={handleSave}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="flex-1 overflow-auto min-w-0">
      <div className="px-[32px] pt-[28px] pb-[24px]">

        {/* Header — matches MyRecordsPage */}
        <div className="flex items-center justify-between gap-[12px] mb-[24px]">
          <p
            className="whitespace-nowrap text-foreground"
            style={{ fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", letterSpacing: "-0.56px" }}
          >
            Templates
          </p>

          <div className="flex items-center gap-[8px]">
            <Button
              onClick={() => setDetailTarget("new")}
              className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Icon icon={Add01Icon} size={14} />
              <span className="font-medium text-[13px]">New template</span>
            </Button>
          </div>
        </div>

        {/* Tabs — same pattern as RecordsTable */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "all" | "built_in" | "custom")} className="flex-1 min-w-0 gap-0">
          <TabsList variant="line" className="gap-6">
            <TabsTrigger value="all" variant="line">
              All <span className="opacity-50 font-[inherit]">{templates.length}</span>
            </TabsTrigger>
            <TabsTrigger value="built_in" variant="line">
              Built-in <span className="opacity-50 font-[inherit]">{builtIn.length}</span>
            </TabsTrigger>
            <TabsTrigger value="custom" variant="line">
              My templates <span className="opacity-50 font-[inherit]">{custom.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table header */}
        <TemplateTableHeader />

        {/* Table rows */}
        {displayTemplates.length > 0 ? (
          displayTemplates.map((t) => (
            <TemplateTableRow key={t.id} template={t} onClick={() => handleRowClick(t)} />
          ))
        ) : (
          <div className="flex items-center justify-center h-[120px] text-sm text-muted-foreground">
            No templates yet
          </div>
        )}
      </div>
    </div>
  );
}
