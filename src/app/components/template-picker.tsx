import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Lock, SearchIcon, Layers } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/app/components/ui/utils";
import { useTemplates } from "@/hooks/use-templates";
import { usePlan } from "./use-plan";
import { TemplateLibraryDialog } from "./template-library-dialog";
import type { Template } from "@/lib/templates";
import {
  templateEmoji,
  templateAudience,
  categorize,
  hueForCategory,
  TEMPLATE_CATEGORIES,
  type CategoryId,
} from "@/lib/template-meta";

/* Rich template picker - shared by the transcript detail page and the
   upload/record flow. Category filter chips with scroll arrows, a Starred
   chip, locked rows on the free plan. Optionally controlled via open props. */

const STARRED_KEY = "ttt_starred_templates";
const TRASHED_KEY = "ttt_trashed_templates";

function loadIds(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return new Set(); }
}

type ChipId = "all" | "starred" | CategoryId;

interface TemplatePickerProps {
  value: string | null;
  onSelect: (templateId: string | null) => void;
  trigger: React.ReactNode;
  align?: "start" | "end" | "center";
  onManageTemplates?: () => void;
  /** Controlled open state (optional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TemplatePicker({
  value, onSelect, trigger, align = "end", onManageTemplates, open, onOpenChange,
}: TemplatePickerProps) {
  const { templates } = useTemplates();
  const plan = usePlan();
  const isFree = plan === "free";

  const [internalOpen, setInternalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<ChipId>("all");

  const chipsRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const starredIds = useMemo(() => loadIds(STARRED_KEY), [isOpen]);
  const trashedIds = useMemo(() => loadIds(TRASHED_KEY), [isOpen]);

  const available = useMemo(
    () => templates.filter((t) => !trashedIds.has(t.id)),
    [templates, trashedIds],
  );

  const hasStarred = useMemo(() => available.some((t) => starredIds.has(t.id)), [available, starredIds]);

  // Category chips: only categories that actually have templates (no custom chip yet)
  const categoryChips = useMemo(() => {
    const counts = new Map<CategoryId, number>();
    for (const t of available) {
      const c = categorize(t);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return TEMPLATE_CATEGORIES.filter((c) => c.id !== "custom" && (counts.get(c.id) ?? 0) > 0);
  }, [available]);

  const updateArrows = () => {
    const el = chipsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(updateArrows, 50);
    return () => window.clearTimeout(id);
  }, [isOpen, categoryChips.length]);

  const scrollChips = (dir: 1 | -1) => {
    chipsRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter((t) => {
      if (activeChip === "starred" && !starredIds.has(t.id)) return false;
      if (activeChip !== "all" && activeChip !== "starred" && categorize(t) !== activeChip) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || templateAudience(t).toLowerCase().includes(q);
    });
  }, [available, query, activeChip, starredIds]);

  const starred = filtered.filter((t) => starredIds.has(t.id));
  const rest = filtered.filter((t) => !starredIds.has(t.id));

  const setOpenState = (o: boolean) => {
    if (onOpenChange) onOpenChange(o);
    else setInternalOpen(o);
    if (!o) { setQuery(""); setActiveChip("all"); }
  };

  const handlePick = (t: Template) => {
    if (isFree) {
      toast("Sorry - applying templates needs a Pro subscription. Upgrade to unlock.");
      return;
    }
    onSelect(t.id === value ? null : t.id);
    setOpenState(false);
  };

  const chipClass = (active: boolean) => cn(
    "shrink-0 rounded-full px-3 py-[5px] text-[11.5px] font-medium whitespace-nowrap transition-colors",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
  );

  const renderRow = (t: Template) => {
    const hue = hueForCategory(categorize(t));
    const isActive = t.id === value;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => handlePick(t)}
        className={cn(
          "w-full flex items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
          isActive ? "bg-primary/[0.06]" : "hover:bg-muted/60",
        )}
      >
        <div
          className="flex items-center justify-center shrink-0 rounded-lg mt-px"
          style={{ width: 32, height: 32, background: hue.bg, fontSize: 16 }}
        >
          <span>{templateEmoji(t.name)}</span>
        </div>
        <div className="flex-1 min-w-0 pt-px">
          <span className="block text-[13px] font-medium text-foreground leading-snug">{t.name}</span>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{templateAudience(t)}</p>
        </div>
        {isFree ? (
          <Icon icon={Lock} size={13} className="text-muted-foreground/50 shrink-0 mt-2" />
        ) : isActive ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 mt-2"><polyline points="20 6 9 17 4 12" /></svg>
        ) : null}
      </button>
    );
  };

  return (
    <>
    <Popover open={isOpen} onOpenChange={setOpenState}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-[460px] p-0 z-[400]">
        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 pt-3 pb-2.5">
          <Icon icon={SearchIcon} size={14} className="text-muted-foreground/60 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
        </div>

        {/* Category chips - single select, with scroll arrows */}
        <div className="relative border-b border-border/60">
          <div
            ref={chipsRef}
            onScroll={updateArrows}
            className="flex items-center gap-1.5 px-3 pb-2.5 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            <button type="button" onClick={() => setActiveChip("all")} className={chipClass(activeChip === "all")}>
              All
            </button>
            {hasStarred && (
              <button
                type="button"
                onClick={() => setActiveChip(activeChip === "starred" ? "all" : "starred")}
                className={chipClass(activeChip === "starred")}
              >
                <span className="mr-1" aria-hidden="true">&#9733;</span>Starred
              </button>
            )}
            {categoryChips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveChip(activeChip === c.id ? "all" : c.id)}
                className={chipClass(activeChip === c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {canScrollLeft && (
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollChips(-1)}
              className="absolute left-0 top-0 bottom-2 w-12 flex items-center justify-start pl-1.5 bg-gradient-to-r from-popover via-popover/85 to-transparent"
            >
              <span className="flex items-center justify-center size-6 rounded-full bg-card border border-border shadow-sm text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </span>
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollChips(1)}
              className="absolute right-0 top-0 bottom-2 w-12 flex items-center justify-end pr-1.5 bg-gradient-to-l from-popover via-popover/85 to-transparent"
            >
              <span className="flex items-center justify-center size-6 rounded-full bg-card border border-border shadow-sm text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </span>
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {/* No template */}
          <button
            type="button"
            onClick={() => { onSelect(null); setOpenState(false); }}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
              value === null ? "bg-primary/[0.06]" : "hover:bg-muted/60",
            )}
          >
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-foreground">No template</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Plain transcript without a summary</p>
            </div>
            {value === null && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
            )}
          </button>

          {starred.length > 0 && activeChip !== "starred" && (
            <p className="px-2.5 pt-2.5 pb-1 text-[10px] font-semibold text-muted-foreground tracking-wide">Starred</p>
          )}
          {starred.length > 0 && starred.map(renderRow)}

          {rest.length > 0 && activeChip !== "starred" && (
            <p className="px-2.5 pt-2.5 pb-1 text-[10px] font-semibold text-muted-foreground tracking-wide">
              {starred.length > 0 ? "All templates" : "Templates"}
            </p>
          )}
          {activeChip !== "starred" && rest.map(renderRow)}

          {filtered.length === 0 && (
            <p className="px-2.5 py-6 text-center text-[12px] text-muted-foreground">No templates match your search</p>
          )}
        </div>

        <div className="border-t border-border/60 p-1.5">
          <button
            type="button"
            onClick={() => { setOpenState(false); setLibraryOpen(true); }}
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-primary hover:bg-muted/60 transition-colors"
          >
            <Icon icon={Layers} size={14} />
            Template library
          </button>
        </div>
      </PopoverContent>
    </Popover>
    <TemplateLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} value={value} onSelect={onSelect} />
    </>
  );
}
