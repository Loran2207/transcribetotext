import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, SearchIcon, Layers } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { cn } from "@/app/components/ui/utils";
import { useTemplates } from "@/hooks/use-templates";
import { usePlan } from "./use-plan";
import { TemplateLibraryDialog } from "./template-library-dialog";
import type { Template } from "@/lib/templates";
import { templateEmoji, templateAudience, categorize, hueForCategory } from "@/lib/template-meta";

/* Adaptive (mobile + tablet) bottom-sheet pickers for the transcription result
   header. These are additive - the desktop keeps its existing Popover
   TemplatePicker and inline language Select untouched. Both sheets share the
   same Drawer look as the result page's Copy / More sheets so the adaptive
   header reads as one consistent set of "mini-dialogs". */

const STARRED_KEY = "ttt_starred_templates";
const TRASHED_KEY = "ttt_trashed_templates";

function loadIds(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return new Set(); }
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close" className="size-8 shrink-0 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-muted/60">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </button>
  );
}

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  short: string;
}

/* Language picker - bottom sheet. Desktop uses the inline Select instead. */
export function LanguageSheet({
  open, onOpenChange, languages, activeLang, disabled, onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languages: LanguageOption[];
  activeLang: string | null;
  disabled?: boolean;
  onPick: (code: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="lg:hidden [&>div:first-child]:hidden">
        <DrawerHeader className="pb-1 flex-row items-center justify-between text-left">
          <DrawerTitle>Translate to</DrawerTitle>
          <CloseButton onClick={() => onOpenChange(false)} />
        </DrawerHeader>
        <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] flex flex-col gap-0.5 max-h-[60vh] overflow-y-auto">
          {languages.map((l) => {
            const isActive = activeLang === l.code;
            return (
              <button
                key={l.code}
                type="button"
                disabled={disabled}
                onClick={() => { onOpenChange(false); onPick(l.code); }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition-colors active:bg-muted/60 disabled:opacity-50",
                  isActive ? "bg-primary/[0.06]" : "",
                )}
              >
                <span className="text-[18px] leading-none">{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {isActive ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                ) : null}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* Template picker - bottom sheet. Desktop uses the Popover TemplatePicker. */
export function TemplateSheet({
  open, onOpenChange, value, onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onSelect: (templateId: string | null) => void;
}) {
  const { templates } = useTemplates();
  const plan = usePlan();
  const isFree = plan === "free";
  const [query, setQuery] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);

  const starredIds = useMemo(() => loadIds(STARRED_KEY), [open]);
  const trashedIds = useMemo(() => loadIds(TRASHED_KEY), [open]);
  const available = useMemo(() => templates.filter((t) => !trashedIds.has(t.id)), [templates, trashedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((t) => t.name.toLowerCase().includes(q) || templateAudience(t).toLowerCase().includes(q));
  }, [available, query]);

  const starred = filtered.filter((t) => starredIds.has(t.id));
  const rest = filtered.filter((t) => !starredIds.has(t.id));

  const setOpen = (o: boolean) => { onOpenChange(o); if (!o) setQuery(""); };

  const handlePick = (t: Template) => {
    if (isFree) { toast("Sorry - applying templates needs a Pro subscription. Upgrade to unlock."); return; }
    onSelect(t.id === value ? null : t.id);
    setOpen(false);
  };

  const renderRow = (t: Template) => {
    const hue = hueForCategory(categorize(t));
    const isActive = t.id === value;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => handlePick(t)}
        className={cn(
          "w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-muted/60",
          isActive ? "bg-primary/[0.06]" : "",
        )}
      >
        <div className="flex items-center justify-center shrink-0 rounded-lg mt-px" style={{ width: 34, height: 34, background: hue.bg, fontSize: 17 }}>
          <span>{templateEmoji(t.name)}</span>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <span className="block text-[14px] font-medium text-foreground leading-snug">{t.name}</span>
          <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{templateAudience(t)}</p>
        </div>
        {isFree ? (
          <Icon icon={Lock} size={14} className="text-muted-foreground/50 shrink-0 mt-2" />
        ) : isActive ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 mt-2"><polyline points="20 6 9 17 4 12" /></svg>
        ) : null}
      </button>
    );
  };

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="lg:hidden [&>div:first-child]:hidden max-h-[88vh]">
          <DrawerHeader className="pb-2 flex-row items-center justify-between text-left">
            <DrawerTitle>Choose a template</DrawerTitle>
            <CloseButton onClick={() => setOpen(false)} />
          </DrawerHeader>
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 h-10 rounded-xl bg-muted/50 px-3">
              <Icon icon={SearchIcon} size={15} className="text-muted-foreground/60 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates"
                className="flex-1 min-w-0 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
            </div>
          </div>
          <div className="px-2 flex-1 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-muted/60",
                value === null ? "bg-primary/[0.06]" : "",
              )}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium text-foreground">No template</span>
                <p className="text-[12px] text-muted-foreground mt-0.5">Plain transcript without a summary</p>
              </div>
              {value === null && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </button>
            {starred.length > 0 && <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-muted-foreground tracking-wide">Starred</p>}
            {starred.map(renderRow)}
            {rest.length > 0 && <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-muted-foreground tracking-wide">{starred.length > 0 ? "All templates" : "Templates"}</p>}
            {rest.map(renderRow)}
            {filtered.length === 0 && <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No templates match your search</p>}
          </div>
          <div className="border-t border-border/60 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => { setOpen(false); setLibraryOpen(true); }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-primary active:bg-muted/60 transition-colors"
            >
              <Icon icon={Layers} size={15} />
              Template library
            </button>
          </div>
        </DrawerContent>
      </Drawer>
      <TemplateLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} value={value} onSelect={onSelect} />
    </>
  );
}
