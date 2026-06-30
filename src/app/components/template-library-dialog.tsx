import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SearchIcon, Lock } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { useTemplates } from "@/hooks/use-templates";
import { usePlan } from "./use-plan";
import { sectionIcon } from "./templates-page";
import type { Template } from "@/lib/templates";
import {
  templateEmoji,
  templateAudience,
  categorize,
  hueForCategory,
  TEMPLATE_CATEGORIES,
  CATEGORY_META_BY_ID,
  type CategoryId,
} from "@/lib/template-meta";
import { getTemplateSample } from "@/lib/template-samples";

/* Full template library opened from the template picker. Left category rail
   (the sidebar nav look) + search + the Templates-page cards, each revealing
   Preview / Use on hover. Preview opens an in-dialog detail with the example
   the template produces. Reuses the shared template-meta + sample helpers. */

const STARRED_KEY = "ttt_starred_templates";
const TRASHED_KEY = "ttt_trashed_templates";

function loadIds(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return new Set(); }
}
function saveIds(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...s])); } catch { /* ignore */ }
}

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width={15} height={15} fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z"
        stroke={filled ? "#F59E0B" : "currentColor"}
        fill={filled ? "#F59E0B" : "none"}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={filled ? "" : "text-muted-foreground/60"}
      />
    </svg>
  );
}

/* Library card: the Templates-page card plus a hover layer with Preview / Use. */
function LibraryCard({
  template, isStarred, onToggleStar, onPreview, onUse, isFree, forceActions = false,
}: {
  template: Template; isStarred: boolean; onToggleStar: () => void;
  onPreview: () => void; onUse: () => void; isFree: boolean; forceActions?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const show = hovered || forceActions;
  const emoji = templateEmoji(template.name);
  const hue = hueForCategory(categorize(template));
  const sample = getTemplateSample(template);
  const previewSections = template.sections.slice(0, 3);
  const hasMore = template.sections.length > 3;

  const cardBg = show ? hue.bgHover : hue.bg;
  const cardShadow = show
    ? "0 12px 32px -8px rgba(16, 24, 40, 0.12), 0 4px 12px -4px rgba(16, 24, 40, 0.06)"
    : "0 1px 2px 0 rgba(16, 24, 40, 0.05)";
  const stackBg1 = `color-mix(in srgb, ${hue.bg} 65%, #ffffff 35%)`;
  const stackBg2 = `color-mix(in srgb, ${hue.bg} 45%, #ffffff 55%)`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Preview template: ${template.name}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={onPreview}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPreview(); } }}
      className="relative rounded-[18px] transition-all overflow-hidden outline-none flex flex-col h-full cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
      style={{
        background: cardBg, boxShadow: cardShadow, padding: "18px", minHeight: 236,
        transform: show ? "translateY(-2px)" : "translateY(0)",
        transitionDuration: "180ms", transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div className="flex items-center gap-[12px]">
        <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.85)", boxShadow: "0 1px 2px rgba(16,24,40,0.05)", fontSize: 18, lineHeight: 1 }}>
          <span>{emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-[15px] text-foreground leading-snug">{template.name}</p>
          <p className="truncate text-muted-foreground" style={{ fontSize: 11, marginTop: 1 }}>{templateAudience(template)}</p>
        </div>
        <div className="flex items-center shrink-0 -mr-[4px]" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 999, background: show ? "rgba(255,255,255,0.6)" : "transparent", opacity: isStarred || show ? 1 : 0, pointerEvents: isStarred || show ? "auto" : "none", transition: "opacity 160ms, background 160ms" }}
            title={isStarred ? "Remove from favorites" : "Add to favorites"}
            aria-label={isStarred ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isStarred}
          >
            <StarGlyph filled={isStarred} />
          </button>
        </div>
      </div>

      <div className="relative mt-[18px] flex-1 flex flex-col min-h-0">
        <div aria-hidden className="absolute pointer-events-none" style={{ top: -6, left: 12, right: 12, height: 6, borderRadius: "8px 8px 0 0", background: stackBg1 }} />
        <div aria-hidden className="absolute pointer-events-none" style={{ top: -12, left: 24, right: 24, height: 6, borderRadius: "8px 8px 0 0", background: stackBg2 }} />
        <div className="relative flex-1 overflow-hidden" style={{ borderRadius: 10, background: "#ffffff", padding: "14px 14px 16px", boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(16,24,40,0.04)" }}>
          {previewSections.length === 0 ? (
            <p className="text-[11.5px] text-muted-foreground italic">No sections</p>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {previewSections.map((s, i) => (
                <div key={s.id ?? i} className="flex items-start gap-[8px]">
                  <Icon icon={sectionIcon(s.title, s.iconId)} size={12} className="shrink-0 mt-[2px]" style={{ color: hue.chip }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{s.title || `Section ${i + 1}`}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 10.5, lineHeight: 1.45, marginTop: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{sample.contentFor(s.title)[0]}</p>
                  </div>
                </div>
              ))}
              {hasMore && (
                <p className="mt-[4px] pl-[20px] text-muted-foreground/60" style={{ fontSize: 10.5 }}>+{template.sections.length - 3} more sections</p>
              )}
            </div>
          )}

          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5"
            style={{ background: "rgba(255,255,255,0.82)", opacity: show ? 1 : 0, pointerEvents: show ? "auto" : "none", transition: "opacity 160ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="pill-outline" className="w-full max-w-[190px] h-9 text-[13px] font-medium" onClick={onPreview}>Preview</Button>
            <Button className="w-full max-w-[190px] h-9 rounded-full text-[13px] font-medium gap-1.5" onClick={onUse}>
              {isFree && <Icon icon={Lock} size={13} />}
              Use this template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return ""; }
}

/* In-dialog preview, modeled on the template detail page: left = what the
   template is made of (its sections), right = the example summary it produces.
   Reuses sectionIcon + getTemplateSample so the content matches the real
   template detail view. */
function PreviewPanel({ template, onBack, onUse, isFree }: {
  template: Template; onBack: () => void; onUse: () => void; isFree: boolean;
}) {
  const emoji = templateEmoji(template.name);
  const hue = hueForCategory(categorize(template));
  const sample = getTemplateSample(template);
  const creator = template.type === "built_in" ? "TranscribeToText" : "You";
  const created = fmtDate(template.created_at);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-6 h-[56px] border-b border-border shrink-0">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          Back to template library
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7">
        <div className="flex items-start gap-3.5">
          <div className="flex items-center justify-center shrink-0 rounded-xl" style={{ width: 44, height: 44, background: hue.bg, fontSize: 22 }}>
            <span>{emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] font-bold text-foreground leading-tight truncate">{template.name}</h2>
            <p className="text-[12px] text-muted-foreground mt-1">
              <span>Created by {creator}</span>
              {created && <span className="mx-1.5">&middot;</span>}
              {created && <span>{created}</span>}
            </p>
            {template.description && (
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2.5 max-w-[680px]">{template.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-9 mt-8 items-start">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground mb-3">What this template captures</p>
            <div className="flex flex-col gap-2.5">
              {template.sections.map((s, i) => (
                <div key={s.id} className="rounded-xl border border-border bg-card px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center shrink-0 size-8 rounded-lg" style={{ background: hue.bg }}>
                      <Icon icon={sectionIcon(s.title, s.iconId)} size={15} style={{ color: hue.chip }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-foreground">{s.title || `Section ${i + 1}`}</p>
                      <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-0.5">{s.instruction || "Auto-generated from the recording."}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[420px] shrink-0">
            <p className="text-[11px] font-medium text-muted-foreground mb-3">Example summary</p>
            <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--elevation-md)" }}>
              <div className="px-6 pt-5 pb-3.5 border-b border-border">
                <p className="text-[14px] font-semibold text-foreground">{sample.source.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{sample.source.meta}</p>
              </div>
              <div className="px-6 py-5">
                {template.sections.map((s, i) => {
                  const lines = sample.contentFor(s.title);
                  const isBullets = lines.length > 1;
                  return (
                    <div key={s.id} className={i > 0 ? "mt-5" : ""}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon icon={sectionIcon(s.title, s.iconId)} size={14} className="text-foreground/60" />
                        <h4 className="text-[13.5px] font-semibold text-foreground">{s.title}</h4>
                      </div>
                      {isBullets ? (
                        <ul className="flex flex-col gap-1.5">
                          {lines.map((line, j) => (
                            <li key={j} className="flex gap-2 text-[12.5px] text-muted-foreground leading-relaxed">
                              <span className="text-muted-foreground/50 shrink-0 pt-px">&bull;</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[12.5px] text-muted-foreground leading-[1.7]">{lines[0]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-8 h-[72px] border-t border-border shrink-0">
        <Button variant="pill-outline" className="h-10 px-5 text-[13px] font-medium" onClick={onBack}>Back</Button>
        <Button className="h-10 px-6 rounded-full text-[13px] font-medium gap-1.5" onClick={onUse}>
          {isFree && <Icon icon={Lock} size={14} />}
          Use this template
        </Button>
      </div>
    </div>
  );
}

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onSelect: (templateId: string | null) => void;
}

export function TemplateLibraryDialog({ open, onOpenChange, value: _value, onSelect }: TemplateLibraryDialogProps) {
  const { templates } = useTemplates();
  const plan = usePlan();
  const isFree = plan === "free";

  const [starred, setStarred] = useState<Set<string>>(() => loadIds(STARRED_KEY));
  const [trashed, setTrashed] = useState<Set<string>>(() => loadIds(TRASHED_KEY));
  const [query, setQuery] = useState("");
  const [previewing, setPreviewing] = useState<Template | null>(null);
  const [activeNav, setActiveNav] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const forceHover = useMemo(() => { try { return localStorage.getItem("ttt_lib_hover") === "1"; } catch { return false; } }, [open]);

  useEffect(() => {
    if (!open) return;
    setStarred(loadIds(STARRED_KEY));
    setTrashed(loadIds(TRASHED_KEY));
    setPreviewing(null);
    setQuery("");
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (t: Template) => !q || t.name.toLowerCase().includes(q) || templateAudience(t).toLowerCase().includes(q);
    const all = templates.filter((t) => !trashed.has(t.id) && match(t));
    const out: { id: string; label: string; subtitle: string; items: Template[] }[] = [];
    const favs = all.filter((t) => starred.has(t.id));
    out.push({ id: "favorites", label: "My favorites", subtitle: "Templates you save show up here", items: favs });
    const custom = all.filter((t) => t.type === "custom" && !starred.has(t.id));
    if (custom.length) out.push({ id: "custom", label: "My templates", subtitle: "Templates you created", items: custom });
    for (const cat of TEMPLATE_CATEGORIES) {
      if (cat.id === "custom") continue;
      const items = all.filter((t) => t.type === "built_in" && !starred.has(t.id) && categorize(t) === (cat.id as CategoryId));
      if (items.length) out.push({ id: cat.id, label: cat.label, subtitle: cat.subtitle.replace(/^[-\s]+/, ""), items });
    }
    return out;
  }, [templates, trashed, starred, query]);

  useEffect(() => { if (groups.length && !groups.some((g) => g.id === activeNav)) { const first = groups.find((g) => g.items.length > 0) ?? groups[0]; setActiveNav(first.id); } }, [groups, activeNav]);

  const toggleStar = (t: Template) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
      saveIds(STARRED_KEY, next);
      return next;
    });
  };
  const handleUse = (t: Template) => {
    if (isFree) { toast("Applying templates needs a Pro subscription. Upgrade to unlock."); return; }
    onSelect(t.id);
    onOpenChange(false);
  };
  const firstCardId = groups.find((g) => g.items.length > 0)?.items[0]?.id;
  const goTo = (id: string) => {
    setActiveNav(id);
    const el = sectionRefs.current[id]; const c = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
  };
  const onScroll = () => {
    const c = scrollRef.current; if (!c) return;
    let current = groups[0]?.id;
    for (const g of groups) { const el = sectionRefs.current[g.id]; if (el && el.offsetTop - 72 <= c.scrollTop) current = g.id; }
    if (current && current !== activeNav) setActiveNav(current);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1080px] w-[calc(100%-2rem)] h-[86vh] p-0 gap-0 overflow-hidden rounded-2xl flex flex-col">
        <DialogTitle className="sr-only">Template library</DialogTitle>
        {previewing ? (
          <PreviewPanel template={previewing} onBack={() => setPreviewing(null)} onUse={() => handleUse(previewing)} isFree={isFree} />
        ) : (
          <div className="flex h-full min-h-0">
            <aside className="w-[230px] shrink-0 border-r border-border flex flex-col bg-sidebar">
              <div className="px-5 h-[60px] flex items-center shrink-0">
                <p className="text-[15px] font-semibold text-foreground">Template library</p>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-0.5">
                {groups.map((g) => {
                  const active = g.id === activeNav;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => goTo(g.id)}
                      className={`flex items-center gap-2 h-9 px-3 rounded-full text-[13px] transition-colors ${active ? "bg-primary/[0.06] text-primary font-medium" : "text-foreground/80 hover:bg-sidebar-accent"}`}
                    >
                      {g.id === "favorites" && <span className="shrink-0 -ml-0.5"><StarGlyph filled={false} /></span>}
                      <span className="flex-1 text-left truncate">{g.label}</span>
                      <span className="shrink-0 opacity-50 text-[12px]">{g.items.length}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="px-7 h-[64px] flex items-center shrink-0 border-b border-border">
                <div className="relative w-full max-w-[440px]">
                  <Icon icon={SearchIcon} size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search templates"
                    className="w-full h-10 pl-10 pr-3 rounded-full bg-foreground/[0.04] text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:bg-foreground/[0.06]"
                  />
                </div>
              </div>

              <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-7 py-6">
                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-[14px] font-medium text-muted-foreground">No templates match your search</p>
                    <p className="text-[12px] text-muted-foreground/70 mt-1">Try a different keyword.</p>
                  </div>
                ) : (
                  groups.map((g, gi) => (
                    <section key={g.id} ref={(el) => { sectionRefs.current[g.id] = el; }} className={gi > 0 ? "mt-9" : ""}>
                      <div className="mb-4">
                        <h3 className="font-semibold text-foreground" style={{ fontSize: 18, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{g.label}</h3>
                        {g.subtitle && <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>{g.subtitle}</p>}
                      </div>
                      {g.id === "favorites" && g.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/80 py-12 px-6 flex flex-col items-center text-center">
                          <span className="opacity-50"><StarGlyph filled={false} /></span>
                          <p className="text-[13px] font-medium text-foreground mt-2.5">No saved templates yet</p>
                          <p className="text-[12px] text-muted-foreground mt-1 max-w-[300px]">Tap the star on any template and it will show up here for quick access.</p>
                        </div>
                      ) : (
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
                        {g.items.map((t, idx) => (
                          <LibraryCard
                            key={t.id}
                            template={t}
                            isStarred={starred.has(t.id)}
                            onToggleStar={() => toggleStar(t)}
                            onPreview={() => setPreviewing(t)}
                            onUse={() => handleUse(t)}
                            isFree={isFree}
                            forceActions={forceHover && t.id === firstCardId}
                          />
                        ))}
                      </div>
                      )}
                    </section>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
