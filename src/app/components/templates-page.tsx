import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  Add01Icon,
  Cancel01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Search01Icon,
  LockIcon,
  ChevronRight,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
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
import type {
  Template,
  TemplateSection,
  CreateTemplateData,
} from "@/lib/templates";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterKey = "all" | "built_in" | "custom" | "sales" | "hr" | "meetings" | "one_on_one";

interface FilterItem {
  key: FilterKey;
  label: string;
  isCategory?: boolean;
}

const TYPE_FILTERS: FilterItem[] = [
  { key: "all", label: "All templates" },
  { key: "built_in", label: "Built-in" },
  { key: "custom", label: "My templates" },
];

const CATEGORY_FILTERS: FilterItem[] = [
  { key: "sales", label: "Sales calls", isCategory: true },
  { key: "hr", label: "HR & interviews", isCategory: true },
  { key: "meetings", label: "Internal meetings", isCategory: true },
  { key: "one_on_one", label: "1-on-1s", isCategory: true },
];

function matchesCategory(template: Template, category: FilterKey): boolean {
  const n = template.name.toLowerCase();
  switch (category) {
    case "sales":
      return n.includes("sales") || n.includes("bant") || n.includes("discovery");
    case "hr":
      return n.includes("candidate") || n.includes("interview") || n.includes("hr");
    case "meetings":
      return (n.includes("team") || n.includes("standup") || n.includes("meeting")) &&
        !n.includes("1-on-1") && !n.includes("one-on-one") && !n.includes("1:1");
    case "one_on_one":
      return n.includes("1-on-1") || n.includes("one-on-one") || n.includes("1:1");
    default:
      return false;
  }
}

function getCategoryEmoji(template: Template): string {
  const n = template.name.toLowerCase();
  if (n.includes("sales") || n.includes("bant") || n.includes("discovery")) return "\u{1F4B0}";
  if (n.includes("1-on-1") || n.includes("one-on-one") || n.includes("1:1")) return "\u{1F465}";
  if (n.includes("standup")) return "\u{26A1}";
  if (n.includes("team") || n.includes("meeting")) return "\u{1F3E2}";
  if (n.includes("candidate") || n.includes("interview")) return "\u{1F3AF}";
  if (n.includes("research")) return "\u{1F52C}";
  return "\u{1F4CB}";
}

function makeEmptySection(): TemplateSection {
  return { id: crypto.randomUUID(), title: "", instruction: "" };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterSidebar({
  activeFilter,
  onFilterChange,
  templates,
}: {
  activeFilter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  templates: Template[];
}) {
  function countFor(key: FilterKey): number {
    switch (key) {
      case "all": return templates.length;
      case "built_in": return templates.filter((t) => t.type === "built_in").length;
      case "custom": return templates.filter((t) => t.type === "custom").length;
      default: return templates.filter((t) => matchesCategory(t, key)).length;
    }
  }

  function renderItem(item: FilterItem) {
    const isActive = activeFilter === item.key;
    return (
      <button
        key={item.key}
        onClick={() => onFilterChange(item.key)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <span>{item.label}</span>
        <Badge variant="secondary" className="text-[11px] px-1.5 py-0 min-w-[22px] justify-center">
          {countFor(item.key)}
        </Badge>
      </button>
    );
  }

  return (
    <div className="w-[200px] shrink-0 border-r border-border p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Filter</h3>
      <div className="flex flex-col gap-0.5">
        {TYPE_FILTERS.map(renderItem)}
      </div>
      <Separator className="my-3" />
      <div className="flex flex-col gap-0.5">
        {CATEGORY_FILTERS.map(renderItem)}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const sections = template.sections ?? [];
  const visibleSections = sections.slice(0, 3);
  const remaining = sections.length - 3;

  function handleClick() {
    if (template.is_locked) {
      toast("Upgrade to Pro to use this template");
      return;
    }
    onSelect();
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow cursor-pointer",
        isSelected && "ring-2 ring-primary",
        !template.is_locked && "hover:shadow-md",
        template.is_locked && "opacity-75"
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-base">{getCategoryEmoji(template)}</span>
        <div className="flex items-center gap-1.5">
          {template.is_locked && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
              <Icon icon={LockIcon} size={10} /> Pro
            </Badge>
          )}
          <Badge variant={template.type === "built_in" ? "default" : "secondary"} className="text-[10px]">
            {template.type === "built_in" ? "Built-in" : "Custom"}
          </Badge>
        </div>
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-foreground leading-snug">{template.name}</p>

      {/* Description */}
      {template.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
      )}

      {/* Section pills */}
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleSections.map((s) => (
            <Badge key={s.id} variant="secondary" className="text-[10px] px-1.5 py-0">
              {s.title || "Untitled"}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              +{remaining}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {template.is_locked ? (
            <span className="text-[10px] text-amber-600 font-medium">Upgrade to Pro</span>
          ) : (
            <span className="text-xs text-muted-foreground">Used {template.usage_count}x</span>
          )}
          {template.is_default && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
              Default
            </Badge>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          {template.type === "built_in" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Duplicate"
            >
              <Icon icon={Copy01Icon} size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Edit"
              >
                <Icon icon={Edit02Icon} size={14} />
              </button>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Icon icon={Delete02Icon} size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateTemplateCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 p-4 min-h-[160px] cursor-pointer transition-colors hover:border-primary/40 hover:bg-accent/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
        <Icon icon={Add01Icon} size={20} className="text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">Create template</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Editor Panel
// ---------------------------------------------------------------------------

interface EditorState {
  name: string;
  description: string;
  instructions: string;
  sections: TemplateSection[];
  autoAssignKeywords: string[];
  isDefault: boolean;
}

function initEditorState(template?: Template): EditorState {
  return {
    name: template?.name ?? "",
    description: template?.description ?? "",
    instructions: template?.instructions ?? "",
    sections: template?.sections?.length
      ? template.sections.map((s) => ({ ...s }))
      : [makeEmptySection()],
    autoAssignKeywords: template?.auto_assign_keywords ? [...template.auto_assign_keywords] : [],
    isDefault: template?.is_default ?? false,
  };
}

function EditorPanel({
  template,
  isCreateMode,
  onClose,
  onSave,
  onDuplicate,
  onDelete,
}: {
  template: Template | null;
  isCreateMode: boolean;
  onClose: () => void;
  onSave: (data: CreateTemplateData) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const isBuiltIn = template?.type === "built_in";
  const isReadOnly = isBuiltIn && !isCreateMode;

  const [form, setForm] = useState<EditorState>(() => initEditorState(template ?? undefined));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [keywordInput, setKeywordInput] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setForm(initEditorState(template ?? undefined));
    setExpandedSections(new Set());
    setKeywordInput("");
  }, [template?.id, isCreateMode]);

  const panelLabel = isCreateMode
    ? "New template"
    : isBuiltIn
      ? "View template"
      : "Edit template";

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
    setForm((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
    setExpandedSections((prev) => new Set([...prev, newSection.id]));
  }

  function removeSection(id: string) {
    if (form.sections.length <= 1) return;
    setForm((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  function toggleSectionExpand(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function addKeyword() {
    const kw = keywordInput.trim();
    if (!kw || form.autoAssignKeywords.includes(kw)) {
      setKeywordInput("");
      return;
    }
    updateForm({ autoAssignKeywords: [...form.autoAssignKeywords, kw] });
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    updateForm({ autoAssignKeywords: form.autoAssignKeywords.filter((k) => k !== kw) });
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      description: form.description.trim() || null,
      instructions: form.instructions.trim() || null,
      sections: form.sections,
      auto_assign_keywords: form.autoAssignKeywords,
      is_default: form.isDefault,
    });
  }

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={reduceMotion ? undefined : { x: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="w-[320px] shrink-0 border-l border-border bg-card flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{panelLabel}</p>
            {template && !isCreateMode && (
              <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Form body */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                placeholder="Template name"
                disabled={isReadOnly}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                placeholder="Short description..."
                rows={2}
                disabled={isReadOnly}
              />
            </div>

            {/* Instructions */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">AI instructions</Label>
              <Textarea
                value={form.instructions}
                onChange={(e) => updateForm({ instructions: e.target.value })}
                placeholder="Describe the purpose of this meeting and how you'd like the summary structured..."
                rows={5}
                disabled={isReadOnly}
              />
              <p className="text-[11px] text-muted-foreground">
                Guide the AI on how to structure and prioritize the output.
              </p>
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium">Sections</Label>
              {form.sections.map((section, idx) => {
                const isExpanded = expandedSections.has(section.id);
                return (
                  <div key={section.id} className="rounded-lg border border-border bg-background p-2">
                    <div className="flex items-center gap-1">
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder={`Section ${idx + 1}`}
                        className="flex-1 h-8 text-xs"
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && (
                        <div className="flex items-center">
                          <button
                            onClick={() => moveSection(section.id, "up")}
                            disabled={idx === 0}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                          >
                            <Icon icon={ArrowUp01Icon} size={12} />
                          </button>
                          <button
                            onClick={() => moveSection(section.id, "down")}
                            disabled={idx === form.sections.length - 1}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                          >
                            <Icon icon={ArrowDown01Icon} size={12} />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => toggleSectionExpand(section.id)}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon
                          icon={ChevronRight}
                          size={12}
                          className={cn("transition-transform", isExpanded && "rotate-90")}
                        />
                      </button>
                      {!isReadOnly && form.sections.length > 1 && (
                        <button
                          onClick={() => removeSection(section.id)}
                          className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Icon icon={Cancel01Icon} size={12} />
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <Textarea
                        value={section.instruction}
                        onChange={(e) => updateSection(section.id, { instruction: e.target.value })}
                        placeholder="Section instructions..."
                        rows={3}
                        className="mt-2 text-xs"
                        disabled={isReadOnly}
                      />
                    )}
                  </div>
                );
              })}
              {!isReadOnly && (
                <button
                  onClick={addSection}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors py-1"
                >
                  <Icon icon={Add01Icon} size={14} />
                  <span>Add section</span>
                </button>
              )}
            </div>

            {/* Preview button */}
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              Preview template
            </Button>

            {/* Auto-assign keywords */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Auto-assign keywords</Label>
              <p className="text-[11px] text-muted-foreground">
                If a title contains any of these, this template auto-applies.
              </p>
              {!isReadOnly && (
                <div className="flex gap-1.5">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                    placeholder="Add keyword..."
                    className="flex-1 h-8 text-xs"
                  />
                  <Button size="sm" variant="secondary" onClick={addKeyword} className="h-8 px-2">
                    <Icon icon={Add01Icon} size={14} />
                  </Button>
                </div>
              )}
              {form.autoAssignKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.autoAssignKeywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-[11px] gap-1 pr-1">
                      {kw}
                      {!isReadOnly && (
                        <button onClick={() => removeKeyword(kw)} className="hover:text-destructive transition-colors">
                          <Icon icon={Cancel01Icon} size={10} />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Set as default */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex flex-col gap-0.5">
                <Label className="text-xs font-medium">Set as default</Label>
                <p className="text-[11px] text-muted-foreground">Applied when no other template matches</p>
              </div>
              <Switch
                checked={form.isDefault}
                onCheckedChange={(checked) => updateForm({ isDefault: checked })}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-4">
          {isReadOnly ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Built-in templates are read-only</p>
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <Icon icon={Copy01Icon} size={14} className="mr-1.5" />
                Duplicate to edit
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1"
              >
                {isCreateMode ? "Create template" : "Save changes"}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        form={form}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Preview Dialog
// ---------------------------------------------------------------------------

function PreviewDialog({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: EditorState;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Template Preview</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 overflow-auto max-h-[60vh] pr-2">
          {/* Left — config */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-medium text-foreground">{form.name || "Untitled"}</h4>
              {form.description && (
                <p className="text-xs text-muted-foreground mt-1">{form.description}</p>
              )}
            </div>
            {form.instructions && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1">AI Instructions</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{form.instructions}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Sections</p>
              <div className="flex flex-col gap-2">
                {form.sections.map((s, i) => (
                  <div key={s.id} className="rounded-md border border-border p-2">
                    <p className="text-xs font-medium">{s.title || `Section ${i + 1}`}</p>
                    {s.instruction && (
                      <p className="text-[11px] text-muted-foreground mt-1">{s.instruction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — mock output */}
          <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-4">
            <p className="text-xs font-semibold text-foreground">Generated Summary Preview</p>
            {form.sections.map((s, i) => (
              <div key={s.id}>
                <h4 className="text-sm font-medium text-foreground mb-1">{s.title || `Section ${i + 1}`}</h4>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  AI-generated content for &ldquo;{s.title || `Section ${i + 1}`}&rdquo; will appear here
                  based on the transcription content. The output follows the instructions
                  provided for this section.
                </p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TemplatesSkeleton() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[200px] shrink-0 border-r border-border p-4">
        <Skeleton className="h-4 w-12 mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full mb-1 rounded-lg" />
        ))}
      </div>
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-[240px] rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TemplatesPage() {
  const { templates, isLoading, create, update, remove } = useTemplates();
  const reduceMotion = useReducedMotion();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  const isPanelOpen = selectedId !== null || isCreateMode;

  // Filter templates
  const filtered = useMemo(() => {
    let result = templates;

    // Type / category filter
    switch (activeFilter) {
      case "built_in":
        result = result.filter((t) => t.type === "built_in");
        break;
      case "custom":
        result = result.filter((t) => t.type === "custom");
        break;
      case "sales":
      case "hr":
      case "meetings":
      case "one_on_one":
        result = result.filter((t) => matchesCategory(t, activeFilter));
        break;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(q);
        const descMatch = t.description?.toLowerCase().includes(q);
        const sectionMatch = t.sections?.some((s) => s.title.toLowerCase().includes(q));
        return nameMatch || descMatch || sectionMatch;
      });
    }

    return result;
  }, [templates, activeFilter, searchQuery]);

  const builtInTemplates = filtered.filter((t) => t.type === "built_in");
  const customTemplates = filtered.filter((t) => t.type === "custom");
  const selectedTemplate = selectedId ? templates.find((t) => t.id === selectedId) ?? null : null;

  function closePanel() {
    setSelectedId(null);
    setIsCreateMode(false);
  }

  function openCreate() {
    setSelectedId(null);
    setIsCreateMode(true);
  }

  function selectTemplate(id: string) {
    setIsCreateMode(false);
    setSelectedId(id);
  }

  const handleDuplicate = useCallback(
    async (template: Template) => {
      const result = await create({
        name: `Copy of ${template.name}`,
        description: template.description,
        instructions: template.instructions,
        sections: template.sections.map((s) => ({ ...s, id: crypto.randomUUID() })),
        auto_assign_keywords: [...template.auto_assign_keywords],
        is_default: false,
      });
      if (result) {
        setIsCreateMode(false);
        setSelectedId(result.id);
      }
    },
    [create]
  );

  const handleSave = useCallback(
    async (data: CreateTemplateData) => {
      if (isCreateMode) {
        const result = await create(data);
        if (result) {
          setIsCreateMode(false);
          setSelectedId(result.id);
        }
      } else if (selectedId) {
        await update(selectedId, data);
      }
    },
    [isCreateMode, selectedId, create, update]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const success = await remove(deleteTarget.id);
    if (success && selectedId === deleteTarget.id) {
      closePanel();
    }
    setDeleteTarget(null);
  }, [deleteTarget, remove, selectedId]);

  if (isLoading) {
    return <TemplatesSkeleton />;
  }

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Zone A — Filter sidebar */}
        <FilterSidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          templates={templates}
        />

        {/* Zone B — Main content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Icon
                    icon={Search01Icon}
                    size={16}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="w-[240px] pl-8 h-9"
                  />
                </div>
                <Button onClick={openCreate}>
                  <Icon icon={Add01Icon} size={16} className="mr-1.5" />
                  New template
                </Button>
              </div>
            </div>

            {/* Built-in section */}
            {builtInTemplates.length > 0 && (
              <section className="mb-8">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Built-in &middot; {builtInTemplates.length}
                </p>
                <div
                  className={cn(
                    "grid gap-4",
                    isPanelOpen ? "grid-cols-2" : "grid-cols-3"
                  )}
                >
                  {builtInTemplates.map((t, idx) => (
                    <motion.div
                      key={t.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                        delay: idx * 0.08,
                      }}
                    >
                      <TemplateCard
                        template={t}
                        isSelected={selectedId === t.id}
                        onSelect={() => selectTemplate(t.id)}
                        onDuplicate={() => handleDuplicate(t)}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Custom section */}
            <section>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                My templates &middot; {customTemplates.length}
              </p>
              <div
                className={cn(
                  "grid gap-4",
                  isPanelOpen ? "grid-cols-2" : "grid-cols-3"
                )}
              >
                {customTemplates.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                      delay: idx * 0.08,
                    }}
                  >
                    <TemplateCard
                      template={t}
                      isSelected={selectedId === t.id}
                      onSelect={() => selectTemplate(t.id)}
                      onDuplicate={() => handleDuplicate(t)}
                      onDelete={() => setDeleteTarget(t)}
                    />
                  </motion.div>
                ))}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    delay: customTemplates.length * 0.08,
                  }}
                >
                  <CreateTemplateCard onClick={openCreate} />
                </motion.div>
              </div>
            </section>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground mb-1">No templates found</p>
                {searchQuery && (
                  <p className="text-xs text-muted-foreground">
                    Try a different search term
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Zone C — Editor panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <EditorPanel
              key={selectedId ?? "create"}
              template={selectedTemplate}
              isCreateMode={isCreateMode}
              onClose={closePanel}
              onSave={handleSave}
              onDuplicate={() => selectedTemplate && handleDuplicate(selectedTemplate)}
              onDelete={() => selectedTemplate && setDeleteTarget(selectedTemplate)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
