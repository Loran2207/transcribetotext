import { useState } from "react";
import { toast } from "sonner";
import { PencilEdit01Icon, StarsIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useNavigate } from "react-router";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";
import { SourceIcon } from "./source-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { usePlan } from "./use-plan";
import { records } from "./records-table";
import { sectionIcon } from "./templates-page";
import type { Template } from "@/lib/templates";
import { templateEmoji, categorize, hueForCategory, type CategoryId } from "@/lib/template-meta";
import { getTemplateSample } from "@/lib/template-samples";

/* View-only template detail page (first iteration: no editing).
   Header: title + compact actions top-right (Edit with a Soon badge, star,
   Apply). Left: a large source-recording example and usage history.
   Right: the summary card this template produces. */

const STARRED_KEY = "ttt_starred_templates";

function loadStarred(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STARRED_KEY) ?? "[]")); } catch { return new Set(); }
}

function saveStarred(s: Set<string>) {
  localStorage.setItem(STARRED_KEY, JSON.stringify([...s]));
}

const AVATAR_COLORS = ["#2E68EE", "#0E918A", "#D96823", "#6D44E0", "#D14E8D"];

function speakerInitials(name) {
  const parts = name.replace(/(.*)/, "").trim().split(/s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  const [appliedFiles, setAppliedFiles] = useState<typeof records>([]);
  const usageIds = USAGE_BY_CATEGORY[categorize(template)] ?? [];
  const usedIn = [
    ...appliedFiles,
    ...usageIds
      .map((id) => records.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .filter((r) => !appliedFiles.some((a) => a.id === r.id)),
  ];

  const handleApply = () => {
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
    <TooltipProvider>
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

        {/* Title + compact actions (aligned with the file detail page) */}
        <div className="mt-5 mb-7 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center shrink-0 rounded-xl"
                style={{ width: 40, height: 40, background: hue.bg, fontSize: 21 }}
              >
                <span>{emoji}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground leading-tight truncate">
                {template.name}
              </h1>
            </div>
            {template.description && (
              <p className="text-[13px] text-muted-foreground mt-2.5 max-w-[680px]">{template.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="pill-outline"
                  className="h-9 px-4 text-[13px] font-medium gap-1.5"
                  onClick={() => toast("Template editing is coming soon")}
                >
                  <Icon icon={PencilEdit01Icon} size={13} />
                  Edit
                  <span className="rounded-full bg-primary/10 text-primary px-1.5 py-px text-[9px] font-semibold leading-[14px]">Soon</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Editing templates is coming soon</TooltipContent>
            </Tooltip>
            <Button
              variant="pill-outline"
              className="size-9 p-0 shrink-0"
              onClick={handleStar}
              aria-label={isStarred ? "Remove from starred" : "Add to starred"}
              title={isStarred ? "Remove from starred" : "Add to starred"}
            >
              <svg width={15} height={15} fill="none" viewBox="0 0 16 16" aria-hidden="true">
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
            {isFree ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="rounded-full h-9 px-5 text-[13px] font-medium">Apply template</Button>
                </PopoverTrigger>
                <PopoverContent align="end" side="bottom" className="w-[300px] p-5">
                  <div className="flex flex-col items-center text-center">
                    <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon icon={StarsIcon} size={20} className="text-primary" />
                    </div>
                    <h4 className="text-[14px] font-semibold text-foreground">A Pro feature</h4>
                    <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
                      Applying templates to your recordings is available on the Pro plan.
                    </p>
                    <Button
                      className="w-full rounded-full h-9 mt-4 text-[13px] font-medium"
                      onClick={() => {
                        try { localStorage.setItem("ttt_plan", "pro"); } catch { /* ignore */ }
                        toast.success("Pro trial activated");
                        window.setTimeout(() => window.location.reload(), 700);
                      }}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button className="rounded-full h-9 px-5 text-[13px] font-medium" onClick={handleApply}>
                Apply template
              </Button>
            )}
          </div>
        </div>

        {/* Two-column: large example (left) + summary card (right) */}
        <div className="flex gap-10 items-start">

          {/* Left - the source recording example, full width */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-7 pt-6 pb-5 border-b border-border/60">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Example recording</p>
                  <p className="text-[16px] font-semibold text-foreground truncate">{sample.source.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{sample.source.meta}</p>
                </div>
              </div>
              <div className="px-7 py-6 flex flex-col gap-5">
                {(() => {
                  const speakerColor = new Map();
                  for (const sg of sample.source.segments) {
                    if (!speakerColor.has(sg.speaker)) speakerColor.set(sg.speaker, AVATAR_COLORS[speakerColor.size % AVATAR_COLORS.length]);
                  }
                  return sample.source.segments.map((seg, i) => {
                    const color = speakerColor.get(seg.speaker);
                    return (
                      <div key={i} className="flex gap-3.5">
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white mt-0.5"
                          style={{ backgroundColor: color }}
                        >
                          {seg.speaker.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[13px] font-semibold text-foreground/85">{seg.speaker}</span>
                            <span className="text-[11px] text-muted-foreground/60 tabular-nums">{seg.time}</span>
                          </div>
                          <p className="text-[14px] text-muted-foreground leading-[1.75] mt-0.5">{seg.text}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
                <p className="text-[12px] text-muted-foreground/50 pl-[46px]">
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
                <div className="rounded-2xl border border-border bg-card py-10 px-6 flex flex-col items-center text-center">
                  <div className="size-12 rounded-xl bg-primary/5 flex items-center justify-center mb-3.5">
                    <Icon icon={StarsIcon} size={22} className="text-primary" />
                  </div>
                  <h4 className="text-[14px] font-semibold text-foreground">No files yet</h4>
                  <p className="text-[12px] text-muted-foreground mt-1 max-w-[300px]">
                    Apply this template to one of your recordings and it will show up here.
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="pill-outline" className="h-9 px-4 text-[13px] font-medium mt-4">
                        Use on a file
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-[320px] p-1.5">
                      {records.slice(0, 5).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setAppliedFiles((prev) => [r, ...prev]);
                            toast.success(`"${template.name}" applied to "${r.name}"`);
                          }}
                          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted/60 transition-colors"
                        >
                          <SourceIcon source={r.source} />
                          <span className="flex-1 min-w-0 text-[13px] text-foreground truncate">{r.name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{r.duration}</span>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-5 text-[11px]">Name</TableHead>
                        <TableHead className="text-[11px]">Template</TableHead>
                        <TableHead className="text-[11px]">Duration</TableHead>
                        <TableHead className="pr-5 text-[11px]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usedIn.map((r) => (
                        <TableRow
                          key={r.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/transcriptions/${r.id}`)}
                        >
                          <TableCell className="pl-5 max-w-[340px]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <SourceIcon source={r.source} />
                              <span className="text-[13px] font-medium text-foreground truncate">{r.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-[3px] text-[11px] text-muted-foreground whitespace-nowrap">
                              {template.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-[12px] text-muted-foreground whitespace-nowrap">{r.duration}</TableCell>
                          <TableCell className="pr-5 text-[12px] text-muted-foreground whitespace-nowrap">{r.dateCreated}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Right - the summary this template produces */}
          <div className="w-[480px] shrink-0">
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
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
