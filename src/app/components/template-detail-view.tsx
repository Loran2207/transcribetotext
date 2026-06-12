import { useState } from "react";
import { toast } from "sonner";
import { Microphone, PencilEdit01Icon, StarsIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { useNavigate } from "react-router";
import { usePlan } from "./use-plan";
import { records } from "./records-table";
import { sectionIcon } from "./templates-page";
import type { Template } from "@/lib/templates";
import { templateEmoji, categorize, hueForCategory, type CategoryId } from "@/lib/template-meta";
import { getTemplateSample } from "@/lib/template-samples";

/* View-only template detail page (first iteration: no editing).
   Left: a large source-recording example, full width. Right: the summary
   card this template produces, with Apply and Star actions above it. */

const STARRED_KEY = "ttt_starred_templates";

function loadStarred(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STARRED_KEY) ?? "[]")); } catch { return new Set(); }
}

function saveStarred(s: Set<string>) {
  localStorage.setItem(STARRED_KEY, JSON.stringify([...s]));
}

/* Demo usage history: records from the demo world that plausibly used
   a template of this category. */
const USAGE_BY_CATEGORY: Partial<Record<CategoryId, string[]>> = {
  sales: ["13", "2", "10"],
  hr: ["4", "11"],
  engineering: ["5", "1"],
  consulting: ["2", "10"],
  marketing: ["12"],
  media: ["6", "9"],
  writer: ["9"],
  basic: ["1", "8", "7"],
  others: ["8"],
  education: ["8"],
};

interface TemplateDetailViewProps {
  template: Template;
  onBack: () => void;
}

export function TemplateDetailView({ template, onBack }: TemplateDetailViewProps) {
  const plan = usePlan();
  const navigate = useNavigate();
  const isFree = plan === "free";

  const hue = hueForCategory(categorize(template));
  const emoji = templateEmoji(template.name);
  const sample = getTemplateSample(template);

  const [isStarred, setIsStarred] = useState(() => loadStarred().has(template.id));

  const usageIds = USAGE_BY_CATEGORY[categorize(template)] ?? [];
  const usedIn = usageIds
    .map((id) => records.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const handleApply = () => {
    if (isFree) {
      toast("Sorry - applying templates needs a Pro subscription. Upgrade to unlock.");
      return;
    }
    toast.success(`"${template.name}" will be applied to your next recordings`);
  };

  const handleStar = () => {
    const next = new Set(loadStarred());
    if (next.has(template.id)) {
      next.delete(template.id);
      setIsStarred(false);
      toast("Removed from starred");
    } else {
      next.add(template.id);
      setIsStarred(true);
      toast.success("Added to starred");
    }
    saveStarred(next);
  };

  return (
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
            <BreadcrumbItem><BreadcrumbPage>{template.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Title + meta */}
        <div className="mt-5 mb-7">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0 rounded-xl"
              style={{ width: 40, height: 40, background: hue.bg, fontSize: 21 }}
            >
              <span>{emoji}</span>
            </div>
            <h1
              className="text-2xl font-bold text-foreground leading-tight cursor-default"
              onClick={() => toast("Template editing is coming soon")}
              title="Template editing is coming soon"
            >
              {template.name}
            </h1>
          </div>
          {template.description && (
            <p className="text-[13px] text-muted-foreground mt-2.5 max-w-[680px]">{template.description}</p>
          )}
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground/70 mt-2">
            <Icon icon={PencilEdit01Icon} size={13} className="shrink-0" />
            Template editing is coming soon - for now templates are read-only.
          </p>
        </div>

        {/* Two-column: large example (left) + summary card with actions (right) */}
        <div className="flex gap-10 items-start">

          {/* Left - the source recording example, full width */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3.5 px-7 pt-6 pb-5 border-b border-border/60">
                <div className="flex items-center justify-center size-10 rounded-xl bg-muted shrink-0">
                  <Icon icon={Microphone} size={18} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Example recording</p>
                  <p className="text-[16px] font-semibold text-foreground truncate">{sample.source.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{sample.source.meta}</p>
                </div>
              </div>
              <div className="px-7 py-6 flex flex-col gap-5">
                {sample.source.segments.map((seg, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-[12px] text-muted-foreground/60 tabular-nums shrink-0 pt-[3px] w-[40px]">{seg.time}</span>
                    <div className="min-w-0">
                      <span className="text-[13px] font-semibold text-foreground/85">{seg.speaker}</span>
                      <p className="text-[14px] text-muted-foreground leading-[1.75] mt-0.5">{seg.text}</p>
                    </div>
                  </div>
                ))}
                <p className="text-[12px] text-muted-foreground/50 pl-[56px]">
                  Recording continues - this is a short excerpt.
                </p>
              </div>
            </div>

            {/* Usage history */}
            <div className="mt-6">
              <h3 className="text-[14px] font-semibold text-foreground mb-1">Recently used in</h3>
              <p className="text-[12px] text-muted-foreground mb-3">
                Files where this template generated the summary.
              </p>
              {usedIn.length === 0 ? (
                <div className="rounded-xl bg-muted/50 py-5 px-6 flex items-center justify-center">
                  <span className="text-[13px] text-muted-foreground/70">This template has not been used yet</span>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {usedIn.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => navigate(`/transcriptions/${r.id}`)}
                      className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-muted/40 ${i > 0 ? "border-t border-border/60" : ""}`}
                    >
                      <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0">
                        <Icon icon={Microphone} size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.duration} &middot; {r.dateCreated}</p>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50 shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right - actions + the summary this template produces */}
          <div className="w-[480px] shrink-0">
            <div className="flex items-center gap-2.5 mb-4">
              <Button
                className="flex-1 rounded-full h-10 text-[13px] font-medium"
                onClick={handleApply}
              >
                Apply template
              </Button>
              <Button
                variant="pill-outline"
                className="size-10 p-0 shrink-0"
                onClick={handleStar}
                aria-label={isStarred ? "Remove from starred" : "Add to starred"}
                title={isStarred ? "Remove from starred" : "Add to starred"}
              >
                <svg width={16} height={16} fill="none" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z"
                    stroke={isStarred ? "#F59E0B" : "currentColor"}
                    fill={isStarred ? "#F59E0B" : "none"}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>
            {isFree && (
              <p className="text-[12px] text-muted-foreground text-center -mt-1 mb-4">
                Applying templates is available on the Pro plan.
              </p>
            )}

            {/* Summary preview card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--elevation-md)" }}>
              <div className="px-7 pt-6 pb-4 border-b border-border">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-2">
                  <Icon icon={StarsIcon} size={12} className="text-primary" />
                  Summary
                </p>
                <p className="text-[15px] font-semibold text-foreground">{sample.source.title}</p>
              </div>
              <div className="px-7 py-6">
                {template.sections.map((s, i) => {
                  const lines = sample.contentFor(s.title);
                  const isBullets = lines.length > 1;
                  return (
                    <div key={s.id} className={i > 0 ? "mt-6" : ""}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon={sectionIcon(s.title, s.iconId)} size={15} className="text-foreground/60" />
                        <h4 className="text-[14px] font-semibold text-foreground">{s.title}</h4>
                      </div>
                      {isBullets ? (
                        <ul className="flex flex-col gap-1.5">
                          {lines.map((line, j) => (
                            <li key={j} className="flex gap-2 text-[13px] text-muted-foreground leading-relaxed">
                              <span className="text-muted-foreground/50 shrink-0 pt-[1px]">&bull;</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-muted-foreground leading-[1.7]">{lines[0]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="flex items-start gap-2 text-[12px] text-muted-foreground/70 leading-relaxed mt-4 px-1">
              <Icon icon={PencilEdit01Icon} size={13} className="shrink-0 mt-[2px]" />
              Editing templates is coming soon - you will be able to customize sections, rules, and automations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}