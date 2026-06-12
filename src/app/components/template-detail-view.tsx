import { toast } from "sonner";
import { ArrowDown01Icon, Lock, Microphone, PencilEdit01Icon, StarsIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { usePlan } from "./use-plan";
import { sectionIcon } from "./templates-page";
import type { Template } from "@/lib/templates";
import { templateEmoji, categorize, hueForCategory, CATEGORY_META_BY_ID } from "@/lib/template-meta";
import { getTemplateSample } from "@/lib/template-samples";

/* View-only template detail page (first iteration: no editing).
   Left: a worked example - source recording and the summary this template
   produces from it. Right: template info and the Apply action. */

interface TemplateDetailViewProps {
  template: Template;
  onBack: () => void;
}

export function TemplateDetailView({ template, onBack }: TemplateDetailViewProps) {
  const plan = usePlan();
  const isFree = plan === "free";

  const category = categorize(template);
  const categoryMeta = CATEGORY_META_BY_ID[category];
  const hue = hueForCategory(category);
  const emoji = templateEmoji(template.name);
  const sample = getTemplateSample(template);

  const handleTitleClick = () => {
    toast("Template editing is coming soon");
  };

  const handleApply = () => {
    if (isFree) {
      toast("Upgrade to Pro to apply templates");
      return;
    }
    toast.success(`"${template.name}" will be applied to your next recordings`);
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
              onClick={handleTitleClick}
              title="Template editing is coming soon"
            >
              {template.name}
            </h1>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
              style={{ background: hue.bg, color: hue.chip }}
            >
              {categoryMeta.label}
            </span>
          </div>
          {template.description && (
            <p className="text-[13px] text-muted-foreground mt-2.5 max-w-[620px]">{template.description}</p>
          )}
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground/70 mt-2">
            <Icon icon={PencilEdit01Icon} size={13} className="shrink-0" />
            Template editing is coming soon - for now templates are read-only.
          </p>
        </div>

        {/* Two-column: example (left) + apply panel (right) */}
        <div className="flex gap-10 items-start">

          {/* Left - worked example */}
          <div className="flex-1 min-w-0 max-w-[760px]">

            {/* Source recording */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border/60">
                <div className="flex items-center justify-center size-9 rounded-lg bg-muted shrink-0">
                  <Icon icon={Microphone} size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Example recording</p>
                  <p className="text-[14px] font-semibold text-foreground truncate">{sample.source.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{sample.source.meta}</p>
                </div>
              </div>
              <div className="px-6 py-4 flex flex-col gap-3">
                {sample.source.segments.map((seg, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[11px] text-muted-foreground/60 tabular-nums shrink-0 pt-[2px] w-[34px]">{seg.time}</span>
                    <div className="min-w-0">
                      <span className="text-[12px] font-semibold text-foreground/80">{seg.speaker}</span>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{seg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider: what the template produces */}
            <div className="flex items-center justify-center gap-2 py-5 text-muted-foreground">
              <Icon icon={ArrowDown01Icon} size={15} />
              <span className="text-[12px] font-medium">With this template, the recording becomes</span>
            </div>

            {/* Generated summary */}
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
          </div>

          {/* Right - apply panel */}
          <div className="w-[340px] shrink-0 sticky top-6">
            <div className="rounded-2xl border border-border bg-card px-6 py-5">
              <h3 className="text-[14px] font-semibold text-foreground">In this template</h3>
              <p className="text-[12px] text-muted-foreground mt-1 mb-4">
                {template.sections.length} {template.sections.length === 1 ? "section" : "sections"}, generated from your recording
              </p>
              <div className="flex flex-col gap-2.5">
                {template.sections.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <Icon icon={sectionIcon(s.title, s.iconId)} size={14} className="text-muted-foreground/70 shrink-0" />
                    <span className="text-[13px] text-foreground/85 truncate">{s.title}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-border/60">
                <Button
                  className="w-full rounded-full h-10 text-[13px] font-medium gap-2"
                  onClick={handleApply}
                >
                  {isFree && <Icon icon={Lock} size={14} />}
                  Apply template
                </Button>
                {isFree ? (
                  <p className="text-[12px] text-muted-foreground text-center mt-2.5">
                    Applying templates is available on the Pro plan.{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:text-primary/80 transition-colors"
                      onClick={() => toast("Open Settings, then Plan management, to upgrade")}
                    >
                      Upgrade
                    </button>
                  </p>
                ) : (
                  <p className="text-[12px] text-muted-foreground/70 text-center mt-2.5">
                    New recordings will use this structure for their summary.
                  </p>
                )}
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