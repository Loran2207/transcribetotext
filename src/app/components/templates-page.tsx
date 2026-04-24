import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  TextAlignLeftIcon,
  CheckListIcon,
  StarsIcon,
  NoteEditIcon,
  Target01Icon,
  Menu01Icon,
  Folder01Icon,
  Delete01Icon,
  Layers,
  ArrowTurnBackwardIcon,
  BookmarkIcon,
  BulbIcon,
  ChatIcon,
  Chart01Icon,
  ClockIcon,
  CodeIcon,
  FlagIcon,
  GlobeIcon,
  IdeaIcon,
  LinkIcon,
  ListViewIcon,
  MailIcon,
  Megaphone01Icon,
  MessageIcon,
  Microphone,
  PieChart01Icon,
  Presentation01Icon,
  Rocket01Icon,
  SearchIcon,
  ShieldIcon,
  TagIcon,
  TaskDone01Icon,
  UserGroupIcon,
  Analytics01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/app/components/ui/popover";
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
// LocalStorage keys
// ---------------------------------------------------------------------------

const STARRED_KEY = "ttt_starred_templates";
const TRASHED_KEY = "ttt_trashed_templates";
const ACTIONS_KEY = "ttt_template_actions";

function loadSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) { localStorage.setItem(key, JSON.stringify([...s])); }

interface StoredAction { type: string; folderId: string | null }
function loadActions(): Record<string, StoredAction[]> {
  try { return JSON.parse(localStorage.getItem(ACTIONS_KEY) ?? "{}"); } catch { return {}; }
}
function saveActions(a: Record<string, StoredAction[]>) { localStorage.setItem(ACTIONS_KEY, JSON.stringify(a)); }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSection(): TemplateSection {
  return { id: crypto.randomUUID(), title: "", instruction: "" };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

const SECTION_ICONS_KW = [
  { kw: ["summary", "overview"], icon: TextAlignLeftIcon },
  { kw: ["action", "task", "todo"], icon: CheckListIcon },
  { kw: ["decision", "key", "verdict"], icon: Target01Icon },
  { kw: ["insight", "analysis", "mood"], icon: StarsIcon },
  { kw: ["outline", "topic", "custom", "prompt"], icon: NoteEditIcon },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_ICON_OPTIONS: { id: string; label: string; icon: any }[] = [
  { id: "summary", label: "Summary", icon: TextAlignLeftIcon },
  { id: "checklist", label: "Checklist", icon: CheckListIcon },
  { id: "target", label: "Target", icon: Target01Icon },
  { id: "stars", label: "Insights", icon: StarsIcon },
  { id: "note", label: "Notes", icon: NoteEditIcon },
  { id: "menu", label: "Default", icon: Menu01Icon },
  { id: "bookmark", label: "Bookmark", icon: BookmarkIcon },
  { id: "bulb", label: "Idea", icon: BulbIcon },
  { id: "chat", label: "Chat", icon: ChatIcon },
  { id: "chart", label: "Chart", icon: Chart01Icon },
  { id: "clock", label: "Time", icon: ClockIcon },
  { id: "code", label: "Code", icon: CodeIcon },
  { id: "flag", label: "Flag", icon: FlagIcon },
  { id: "globe", label: "Global", icon: GlobeIcon },
  { id: "idea", label: "Lightbulb", icon: IdeaIcon },
  { id: "link", label: "Link", icon: LinkIcon },
  { id: "list", label: "List", icon: ListViewIcon },
  { id: "mail", label: "Email", icon: MailIcon },
  { id: "megaphone", label: "Announce", icon: Megaphone01Icon },
  { id: "message", label: "Message", icon: MessageIcon },
  { id: "mic", label: "Audio", icon: Microphone },
  { id: "pie", label: "Analytics", icon: PieChart01Icon },
  { id: "presentation", label: "Slides", icon: Presentation01Icon },
  { id: "rocket", label: "Launch", icon: Rocket01Icon },
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "shield", label: "Security", icon: ShieldIcon },
  { id: "tag", label: "Tag", icon: TagIcon },
  { id: "taskdone", label: "Done", icon: TaskDone01Icon },
  { id: "users", label: "People", icon: UserGroupIcon },
  { id: "analytics", label: "Metrics", icon: Analytics01Icon },
];

const ICON_BY_ID: Record<string, any> = {};
for (const opt of SECTION_ICON_OPTIONS) ICON_BY_ID[opt.id] = opt.icon;

function sectionIcon(title: string, iconId?: string) {
  if (iconId && ICON_BY_ID[iconId]) return ICON_BY_ID[iconId];
  const l = title.toLowerCase();
  return SECTION_ICONS_KW.find((e) => e.kw.some((k) => l.includes(k)))?.icon ?? Menu01Icon;
}

// ---------------------------------------------------------------------------
// Emoji mapping for template names
// ---------------------------------------------------------------------------

// Exact-name emoji overrides — every built-in from the Notta-seeded library has
// a specific emoji so the card face reads like the design reference.
const TEMPLATE_EMOJI_EXACT: Record<string, string> = {
  // Basic
  "Auto": "\u{2728}",                      // ✨
  "General": "\u{1F4CB}",                  // 📋
  "Interview": "\u{1F3A4}",                // 🎤
  "Team Meeting": "\u{1F91D}",             // 🤝
  "Brainstorming": "\u{1F4A1}",            // 💡
  // Sales
  "Sales Pitch": "\u{1F4E3}",              // 📣
  "CHAMP": "\u{1F3C6}",                    // 🏆
  "ANUM": "\u{1F3AF}",                     // 🎯
  "SPICED": "\u{1F336}\u{FE0F}",           // 🌶️
  "BANT": "\u{1F4B0}",                     // 💰
  "GPCT": "\u{1F4CA}",                     // 📊
  "MEDDIC": "\u{1F50D}",                   // 🔍
  "FAINT": "\u{1F4B5}",                    // 💵
  "SPIN": "\u{1F504}",                     // 🔄
  // HR & Management
  "Job Interview": "\u{1F454}",            // 👔
  "1-on-1 Meeting": "\u{1F465}",           // 👥
  "Exit Interview": "\u{1F44B}",           // 👋
  // IT & Engineering
  "User Research Session": "\u{1F52C}",    // 🔬
  "Daily Stand-up Meeting": "\u{23F1}\u{FE0F}", // ⏱️
  "Weekly Meeting": "\u{1F4C5}",           // 📅
  "Sprint Planning": "\u{1F3C3}",          // 🏃
  "Kick-off Meeting": "\u{1F680}",         // 🚀
  // Consulting
  "Consulting Meeting": "\u{1F914}",       // 🤔
  // Marketing
  "GTM (Go-to-Market)": "\u{1F5FA}\u{FE0F}", // 🗺️
  // Medical
  "SOAP Note": "\u{1F4DD}",                // 📝
  "Medical Referral Letter": "\u{1F4E8}",  // 📨
  // Education
  "Lecture": "\u{1F393}",                  // 🎓
  "Panel Discussion": "\u{1F5E3}\u{FE0F}", // 🗣️
  // Writer
  "Reader Meet-and-Greet": "\u{1F4D6}",    // 📖
  "Interview Article": "\u{270D}\u{FE0F}", // ✍️
  // Media & Podcasts
  "YouTube Video": "\u{1F4FA}",            // 📺
  // Others
  "Board Meeting": "\u{1F3DB}\u{FE0F}",    // 🏛️
};

// Fallback keyword map — used for custom templates whose names don't appear above.
const TEMPLATE_EMOJI_MAP: { kw: string[]; emoji: string }[] = [
  { kw: ["general"], emoji: "\u{1F4CB}" },                        // 📋
  { kw: ["sales", "bant", "discovery"], emoji: "\u{1F4B0}" },     // 💰
  { kw: ["1-on-1", "one-on-one", "1:1"], emoji: "\u{1F465}" },    // 👥
  { kw: ["team meeting", "team sync"], emoji: "\u{1F91D}" },      // 🤝
  { kw: ["candidate", "interview"], emoji: "\u{1F3AF}" },         // 🎯
  { kw: ["research"], emoji: "\u{1F52C}" },                       // 🔬
  { kw: ["standup", "stand-up"], emoji: "\u{23F1}\u{FE0F}" },     // ⏱️
  { kw: ["retrospective", "retro"], emoji: "\u{1F504}" },         // 🔄
  { kw: ["brainstorm"], emoji: "\u{1F4A1}" },                     // 💡
  { kw: ["onboarding"], emoji: "\u{1F44B}" },                     // 👋
  { kw: ["training"], emoji: "\u{1F393}" },                       // 🎓
  { kw: ["project"], emoji: "\u{1F4C1}" },                        // 📁
];

function templateEmoji(name: string): string {
  if (TEMPLATE_EMOJI_EXACT[name]) return TEMPLATE_EMOJI_EXACT[name];
  const l = name.toLowerCase();
  return TEMPLATE_EMOJI_MAP.find((e) => e.kw.some((k) => l.includes(k)))?.emoji ?? "\u{1F4C4}"; // 📄
}

// ---------------------------------------------------------------------------
// Categories & hue palette
// ---------------------------------------------------------------------------

type HueId =
  | "blue" | "green" | "amber" | "purple" | "pink" | "teal"
  | "peach" | "slate" | "indigo" | "rose" | "violet" | "gray";

interface HueTokens {
  bg: string;
  bgHover: string;
  chip: string;
  dot: string;
}

const HUE_PALETTE: Record<HueId, HueTokens> = {
  blue:   { bg: "#EEF3FF", bgHover: "#E4EBFD", chip: "#2657E0", dot: "#2E68EE" },
  green:  { bg: "#E8F6EE", bgHover: "#DCF0E4", chip: "#137A3D", dot: "#1B9A4E" },
  amber:  { bg: "#FFF3DD", bgHover: "#FCEACA", chip: "#8A5300", dot: "#C27803" },
  purple: { bg: "#F1EDFE", bgHover: "#E6DFFC", chip: "#5B34C9", dot: "#6D44E0" },
  pink:   { bg: "#FCEBF3", bgHover: "#F9DDEA", chip: "#B23A75", dot: "#D14E8D" },
  teal:   { bg: "#DEF4F1", bgHover: "#CEEDE8", chip: "#076E66", dot: "#0E918A" },
  peach:  { bg: "#FEE8DF", bgHover: "#FCDCCC", chip: "#A14819", dot: "#D96823" },
  slate:  { bg: "#EEF0F5", bgHover: "#E3E6EE", chip: "#3D4762", dot: "#5A647D" },
  indigo: { bg: "#E9ECFE", bgHover: "#DEE3FC", chip: "#303FAD", dot: "#4250CC" },
  rose:   { bg: "#FDE7EC", bgHover: "#FAD6DE", chip: "#B91C4F", dot: "#DC2657" },
  violet: { bg: "#EDE4FE", bgHover: "#DFCFFB", chip: "#6D28D9", dot: "#7C3AED" },
  gray:   { bg: "#F3F4F6", bgHover: "#E5E7EB", chip: "#4B5563", dot: "#6B7280" },
};

type CategoryId =
  | "custom" | "basic" | "sales" | "hr" | "engineering"
  | "consulting" | "marketing" | "medical" | "education"
  | "writer" | "media" | "others";

interface CategoryMeta {
  id: CategoryId;
  label: string;
  subtitle: string;
  hue: HueId;
}

const TEMPLATE_CATEGORIES: CategoryMeta[] = [
  { id: "custom",      label: "My templates",     subtitle: "",                                              hue: "purple" },
  { id: "basic",       label: "Basic",            subtitle: "— versatile formats suitable for any meeting",  hue: "blue"   },
  { id: "sales",       label: "Sales",            subtitle: "— daily meetings, client meetings",             hue: "green"  },
  { id: "hr",          label: "HR & Management",  subtitle: "— recruitment, evaluation, management",         hue: "amber"  },
  { id: "engineering", label: "IT & Engineering", subtitle: "— project updates and technical aspects",       hue: "slate"  },
  { id: "consulting",  label: "Consulting",       subtitle: "— client needs, analysis, solutions",           hue: "peach"  },
  { id: "marketing",   label: "Marketing",        subtitle: "— campaigns, promotion, research",              hue: "pink"   },
  { id: "medical",     label: "Medical",          subtitle: "— clinical notes, referrals, care plans",       hue: "rose"   },
  { id: "education",   label: "Education",        subtitle: "— lectures, discussions, classroom notes",      hue: "indigo" },
  { id: "writer",      label: "Writer",           subtitle: "— writing projects, ideas, publication",        hue: "teal"   },
  { id: "media",       label: "Media & Podcasts", subtitle: "— videos, podcasts, media summaries",           hue: "violet" },
  { id: "others",      label: "Others",           subtitle: "— general or uncategorized meetings",           hue: "gray"   },
];

const CATEGORY_META_BY_ID: Record<CategoryId, CategoryMeta> = TEMPLATE_CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<CategoryId, CategoryMeta>);

// Order matters — first match wins. More specific domain keywords (writer, media,
// medical, others) are checked before broader ones (hr, sales, engineering) so
// e.g. "Interview Article" lands under Writer, not HR.
const CATEGORY_KEYWORDS: Array<{ cat: CategoryId; kws: string[] }> = [
  { cat: "writer",      kws: ["reader meet-and-greet", "meet-and-greet", "meet and greet", "interview article", "author"] },
  { cat: "media",       kws: ["youtube", "video summary", "podcast"] },
  { cat: "medical",     kws: ["soap", "medical", "clinical", "patient", "referral"] },
  { cat: "others",      kws: ["board meeting", "board"] },
  { cat: "hr",          kws: ["1-on-1", "one-on-one", "1:1", "job interview", "exit interview", "candidate", "hiring", "onboarding", "performance review", "hr"] },
  { cat: "sales",       kws: ["sales", "bant", "champ", "anum", "spiced", "spin", "meddic", "faint", "gpct", "pitch", "prospect", "discovery", "demo"] },
  { cat: "engineering", kws: ["standup", "stand-up", "sprint", "kick-off", "kickoff", "weekly meeting", "user research", "retro", "incident", "engineering"] },
  { cat: "consulting",  kws: ["consulting", "client meeting", "stakeholder"] },
  { cat: "marketing",   kws: ["gtm", "go-to-market", "marketing", "campaign", "creative", "brand"] },
  { cat: "education",   kws: ["lecture", "panel discussion", "panel", "class", "course", "study", "education"] },
];

function categorize(t: Template): CategoryId {
  if (t.type === "custom") return "custom";
  const name = t.name.toLowerCase();
  for (const { cat, kws } of CATEGORY_KEYWORDS) {
    if (kws.some((k) => name.includes(k))) return cat;
  }
  return "basic";
}

function hueForCategory(cat: CategoryId): HueTokens {
  return HUE_PALETTE[CATEGORY_META_BY_ID[cat].hue];
}

// ---------------------------------------------------------------------------
// Card grid — shared class strings
// ---------------------------------------------------------------------------

const CARD_GRID_CLASS = "grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------

interface TemplateCardProps {
  template: Template;
  hue: HueTokens;
  isStarred: boolean;
  isTrashed: boolean;
  onClick: () => void;
  onStar: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
}

function TemplateCard({
  template, hue, isStarred, isTrashed, onClick, onStar, onTrash, onRestore, onDuplicate,
}: TemplateCardProps) {
  const [hovered, setHovered] = useState(false);
  const emoji = templateEmoji(template.name);
  const sys = template.type === "built_in";
  const chipLabel = sys ? "System" : "Custom";
  const previewSections = template.sections.slice(0, 3);
  const hasMore = template.sections.length > 3;

  const cardBg = hovered ? hue.bgHover : hue.bg;
  const cardShadow = hovered
    ? "0 12px 32px -8px rgba(16, 24, 40, 0.12), 0 4px 12px -4px rgba(16, 24, 40, 0.06)"
    : "0 1px 2px 0 rgba(16, 24, 40, 0.05)";

  // Stacked-paper layers behind the top edge of the preview block
  const stackBg1 = `color-mix(in srgb, ${hue.bg} 65%, #ffffff 35%)`;
  const stackBg2 = `color-mix(in srgb, ${hue.bg} 45%, #ffffff 55%)`;
  const ghostLineBg = `color-mix(in srgb, ${hue.bg} 55%, rgba(0,0,0,0.18) 45%)`;

  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  const clickable = !isTrashed;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Open template: ${template.name}` : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={cn(
        "relative rounded-[18px] transition-all overflow-hidden outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
        clickable ? "cursor-pointer" : "cursor-default",
      )}
      style={{
        background: cardBg,
        boxShadow: cardShadow,
        padding: "18px",
        minHeight: 280,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transitionDuration: "180ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-[12px]">
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "rgba(255, 255, 255, 0.85)",
            boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          <span>{emoji}</span>
        </div>
        <div className="flex-1 min-w-0 pt-[2px]">
          <p className="truncate font-semibold text-[15px] text-foreground leading-snug">
            {template.name}
          </p>
        </div>

        {!isTrashed && (
          <div className="flex items-center gap-[2px] shrink-0 -mt-[2px] -mr-[4px]" onClick={stop}>
            <button
              type="button"
              onClick={(e) => { stop(e); onStar(); }}
              className={cn(
                "flex items-center justify-center transition-all",
                isStarred || hovered ? "opacity-100" : "opacity-0",
              )}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: hovered ? "rgba(255,255,255,0.6)" : "transparent",
              }}
              title={isStarred ? "Unstar" : "Star"}
              aria-label={isStarred ? "Unstar template" : "Star template"}
              aria-pressed={isStarred}
            >
              <svg width={15} height={15} fill="none" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z"
                  stroke={isStarred ? "#F59E0B" : "currentColor"}
                  fill={isStarred ? "#F59E0B" : "none"}
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isStarred ? "" : "text-muted-foreground/60"}
                />
              </svg>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={stop}
                  className={cn(
                    "flex items-center justify-center transition-all",
                    hovered ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: hovered ? "rgba(255,255,255,0.6)" : "transparent",
                  }}
                  title="More"
                  aria-label="More actions"
                >
                  <Icon icon={MoreVerticalIcon} size={15} className="text-muted-foreground/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]" onClick={stop}>
                {!sys && (
                  <DropdownMenuItem onClick={(e) => { stop(e); onDuplicate(); }} className="gap-[10px]">
                    <Icon icon={Copy01Icon} size={14} /> Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => { stop(e); onTrash(); }}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-[10px]"
                >
                  <Icon icon={Delete01Icon} size={14} /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* File preview block */}
      <div className="relative mt-[18px]">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -6, left: 12, right: 12, height: 6,
            borderRadius: "8px 8px 0 0",
            background: stackBg1,
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -12, left: 24, right: 24, height: 6,
            borderRadius: "8px 8px 0 0",
            background: stackBg2,
          }}
        />

        <div
          className="relative"
          style={{
            borderRadius: 10,
            background: "#ffffff",
            padding: "14px 14px 16px",
            boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(16,24,40,0.04)",
          }}
        >
          {previewSections.length === 0 ? (
            <p className="text-[11.5px] text-muted-foreground italic">No sections</p>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {previewSections.map((s, i) => (
                <div key={s.id ?? i} className="flex items-start gap-[8px]">
                  <span
                    aria-hidden
                    className="shrink-0 mt-[5px]"
                    style={{ width: 5, height: 5, borderRadius: 999, background: hue.dot }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-foreground truncate"
                      style={{ fontSize: "11.5px", lineHeight: 1.3 }}
                    >
                      {s.title || `Section ${i + 1}`}
                    </p>
                    {s.instruction && (
                      <p
                        className="text-muted-foreground"
                        style={{
                          fontSize: "10.5px",
                          lineHeight: 1.45,
                          marginTop: 2,
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                        }}
                      >
                        {s.instruction}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex flex-col gap-[4px] mt-[4px] pl-[13px]">
                  <div style={{ height: 5, width: "88%", borderRadius: 3, background: ghostLineBg }} />
                  <div style={{ height: 5, width: "72%", borderRadius: 3, background: ghostLineBg }} />
                  <div style={{ height: 5, width: "54%", borderRadius: 3, background: ghostLineBg }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-[16px] gap-[8px]">
        <div
          className="flex items-center gap-[6px] rounded-full"
          style={{ background: "rgba(255,255,255,0.7)", padding: "2px 8px" }}
        >
          <span
            aria-hidden
            className="shrink-0"
            style={{ width: 5, height: 5, borderRadius: 999, background: hue.dot }}
          />
          <span className="font-medium" style={{ fontSize: "10.5px", color: hue.chip }}>
            {chipLabel}
          </span>
        </div>

        {isTrashed ? (
          <button
            type="button"
            onClick={(e) => { stop(e); onRestore(); }}
            aria-label="Restore template"
            className="inline-flex items-center gap-[6px] rounded-full font-medium transition-colors"
            style={{
              height: 28, padding: "0 12px", fontSize: "11.5px",
              background: "rgba(255,255,255,0.85)", color: hue.chip,
            }}
          >
            <Icon icon={ArrowTurnBackwardIcon} size={13} aria-hidden="true" /> Restore
          </button>
        ) : (
          <div
            className={cn(
              "flex items-center gap-[6px] transition-opacity",
              hovered ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <button
              type="button"
              onClick={(e) => { stop(e); onClick(); }}
              className="inline-flex items-center rounded-full font-medium transition-colors"
              style={{
                height: 28, padding: "0 12px", fontSize: "11.5px",
                background: "rgba(255,255,255,0.85)", color: "var(--foreground)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); onClick(); }}
              className="inline-flex items-center rounded-full font-medium transition-colors"
              style={{
                height: 28, padding: "0 12px", fontSize: "11.5px",
                background: hue.chip, color: "#ffffff",
              }}
            >
              Use
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create-template card (dashed)
// ---------------------------------------------------------------------------

function CreateTemplateCard({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex flex-col items-center justify-center text-center transition-all",
        hovered ? "bg-accent" : "bg-transparent",
      )}
      style={{
        minHeight: 280,
        padding: 18,
        borderRadius: 18,
        border: `1.5px dashed ${hovered ? "var(--primary)" : "rgba(0,0,0,0.18)"}`,
        gap: 12,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 44, height: 44, borderRadius: 12,
          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
          color: "var(--primary)",
        }}
      >
        <Icon icon={Add01Icon} size={22} />
      </div>
      <h4 className="font-semibold text-foreground" style={{ fontSize: 15 }}>
        Create template
      </h4>
      <p className="text-muted-foreground" style={{ fontSize: "12.5px", maxWidth: 220 }}>
        Start from scratch or fork one below
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section header for category groups
// ---------------------------------------------------------------------------

function SectionHeader({ label, subtitle }: { label: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-[8px] mb-[14px]">
      <h3
        className="font-semibold text-muted-foreground"
        style={{ fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}
      >
        {label}
      </h3>
      {subtitle && (
        <span
          className="text-muted-foreground/70"
          style={{ fontSize: 13, letterSpacing: 0, textTransform: "none", fontWeight: 400 }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Section Block (editable)
// ---------------------------------------------------------------------------

const DRAG_TYPE = "SECTION";

function DraggableSectionBlock({
  section, index, isOn, isReadOnly, onToggle, onMove, onUpdate, onRemove,
}: {
  section: TemplateSection; index: number; isOn: boolean; isReadOnly: boolean;
  onToggle: (on: boolean) => void; onMove: (from: number, to: number) => void;
  onUpdate: (updated: TemplateSection) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(!section.title);
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { index },
    canDrag: !isReadOnly && !isEditing,
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

  const ico = sectionIcon(section.title, section.iconId);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card px-5 py-4 transition-all",
        isDragging && "opacity-40",
        !isOn && "opacity-50",
      )}
      style={{ cursor: isReadOnly ? "default" : isEditing ? "default" : "grab" }}
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
        {/* Icon — clickable picker when editable */}
        {!isReadOnly ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="shrink-0 mt-0.5 p-1 -m-1 rounded-md hover:bg-accent transition-colors" title="Change icon">
                <Icon icon={ico} size={20} className="text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3" align="start" side="bottom">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Choose icon</p>
              <div className="grid grid-cols-6 gap-1">
                {SECTION_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onUpdate({ ...section, iconId: opt.id })}
                    className={cn(
                      "flex items-center justify-center size-[38px] rounded-lg transition-colors",
                      section.iconId === opt.id ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground",
                    )}
                    title={opt.label}
                  >
                    <Icon icon={opt.icon} size={18} />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Icon icon={ico} size={20} className="text-muted-foreground shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          {isEditing && !isReadOnly ? (
            <div className="flex flex-col gap-2">
              <Input
                value={section.title}
                onChange={(e) => onUpdate({ ...section, title: e.target.value })}
                placeholder="Section name"
                className="h-8 text-[15px] font-semibold"
                autoFocus
              />
              <Textarea
                value={section.instruction}
                onChange={(e) => onUpdate({ ...section, instruction: e.target.value })}
                placeholder="AI instructions - describe what this section should contain..."
                className="text-[13px] min-h-[60px] resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[12px] text-primary"
                  onClick={() => { if (section.title.trim()) setIsEditing(false); else toast.error("Section name is required"); }}
                >
                  Done
                </Button>
                {!section.title.trim() && (
                  <Button variant="ghost" size="sm" className="h-7 text-[12px] text-destructive" onClick={onRemove}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={cn(!isReadOnly && "cursor-pointer group/section")}
              onClick={() => { if (!isReadOnly) setIsEditing(true); }}
            >
              <p className={cn("text-[15px] font-semibold text-foreground", !isReadOnly && "group-hover/section:text-primary transition-colors")}>
                {section.title || `Section ${index + 1}`}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                {section.instruction || "No instructions set. Click to edit."}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {!isReadOnly && !isEditing && (
            <button onClick={onRemove} className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors">
              <Icon icon={Delete01Icon} size={14} />
            </button>
          )}
          <Switch checked={isOn} onCheckedChange={onToggle} />
        </div>
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

function flattenFolders(items: { id: string; name: string; children?: { id: string; name: string; children?: any[] }[] }[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const f of items) {
    result.push({ id: f.id, name: f.name, depth });
    if (f.children) result.push(...flattenFolders(f.children, depth + 1));
  }
  return result;
}

function ActionsSection({ actions, onChange, readOnly }: { actions: Action[]; onChange: (a: Action[]) => void; readOnly: boolean }) {
  const { folders } = useFolders();
  const allFolders = useMemo(() => flattenFolders(folders), [folders]);
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
              {allFolders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span className="flex items-center gap-2" style={{ paddingLeft: f.depth * 12 }}><Icon icon={Folder01Icon} size={13} className="text-muted-foreground" />{f.name}</span>
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
                  <Icon icon={sectionIcon(s.title, s.iconId)} size={15} className="text-foreground/60" />
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

function initEditor(t?: Template, storedActions?: StoredAction[]): EditorState {
  const secs = t?.sections?.length ? t.sections.map((s) => ({ ...s })) : [{ ...makeSection(), title: "Summary" }];
  const toggles: Record<string, boolean> = {};
  for (const s of secs) toggles[s.id] = true;
  const rules: Rule[] = (t?.auto_assign_keywords ?? []).filter((k) => k.trim()).map((k) => ({
    id: crypto.randomUUID(), field: "meeting_title", operator: "contains", value: k,
  }));
  const actions: Action[] = (storedActions ?? []).map((a) => ({
    id: crypto.randomUUID(), type: a.type, folderId: a.folderId,
  }));
  return { name: t?.name ?? "", sections: secs, sectionToggles: toggles, rules, actions };
}

function TemplateDetail({
  template, isCreateMode, onBack, onSave, onDuplicate, onDelete,
}: {
  template: Template | null; isCreateMode: boolean; onBack: () => void;
  onSave: (data: CreateTemplateData, actions: Action[]) => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const { user } = useAuth();
  const isBuiltIn = template?.type === "built_in";

  const storedActions = template ? loadActions()[template.id] : undefined;
  const [form, setForm] = useState<EditorState>(() => initEditor(template ?? undefined, storedActions));
  const [isEditingName, setIsEditingName] = useState(isCreateMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewRecordId, setPreviewRecordId] = useState(records[0]?.id ?? "");

  function updateForm(p: Partial<EditorState>) { setForm((prev) => ({ ...prev, ...p })); }

  function updateSection(id: string, updated: TemplateSection) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => s.id === id ? updated : s),
    }));
  }

  function removeSection(id: string) {
    setForm((prev) => {
      const next = prev.sections.filter((s) => s.id !== id);
      const toggles = { ...prev.sectionToggles };
      delete toggles[id];
      return { ...prev, sections: next, sectionToggles: toggles };
    });
  }

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
    }, form.actions);
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
            {isBuiltIn && !isCreateMode && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">Editing will create a copy</span>
                <Button variant="pill-outline" onClick={onDuplicate} className="h-8 px-[14px] gap-[6px] text-[12px]">
                  <Icon icon={Copy01Icon} size={13} /> Duplicate
                </Button>
              </div>
            )}
          </div>

          {/* Title + meta badge */}
          <div className="mt-5 mb-6">
            <div
              className={`min-w-0 rounded-xl py-2 pr-2 pl-0 transition-colors ${isEditingName ? "bg-muted/55" : "cursor-text hover:bg-muted/45"}`}
              onClick={() => { if (!isEditingName) setIsEditingName(true); }}
            >
            {isEditingName ? (
              <Input
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                onBlur={() => { if (form.name.trim()) setIsEditingName(false); }}
                onKeyDown={(e) => { if (e.key === "Enter" && form.name.trim()) setIsEditingName(false); if (e.key === "Escape") setIsEditingName(false); }}
                placeholder="Template name"
                className="h-auto border-none bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
                style={{ fontSize: "24px", lineHeight: "1.3" }}
                autoFocus
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {form.name || "Untitled template"}
              </h1>
            )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {isBuiltIn ? (
                <Icon icon={Layers} size={14} className="text-primary" />
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
                    isReadOnly={false}
                    onToggle={(on) => updateForm({ sectionToggles: { ...form.sectionToggles, [s.id]: on } })}
                    onMove={moveSection}
                    onUpdate={(updated) => updateSection(s.id, updated)}
                    onRemove={() => removeSection(s.id)}
                  />
                ))}
                <button onClick={() => {
                  const ns = makeSection();
                  updateForm({ sections: [...form.sections, ns], sectionToggles: { ...form.sectionToggles, [ns.id]: true } });
                }} className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 font-medium py-2">
                  <Icon icon={Add01Icon} size={14} /> Add section
                </button>
              </div>

              {/* Rules */}
              <div className="border-t border-border pt-6">
                <RulesSection rules={form.rules} onChange={(r) => updateForm({ rules: r })} readOnly={false} />
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-6">
                <ActionsSection actions={form.actions} onChange={(a) => updateForm({ actions: a })} readOnly={false} />
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                {!isCreateMode && !isBuiltIn && (
                  <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-destructive hover:text-destructive/80 text-sm">
                    <Icon icon={Delete02Icon} size={14} className="mr-1" /> Delete
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="ghost" onClick={onBack} className="text-sm">Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name.trim()} className="rounded-full h-9 px-[20px] text-[13px]">
                  {isCreateMode ? "Create template" : isBuiltIn ? "Save as copy" : "Save changes"}
                </Button>
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
// Empty states
// ---------------------------------------------------------------------------

function EmptyTabState({ tab }: { tab: string }) {
  const msgs: Record<string, { title: string; desc: string }> = {
    all: { title: "No templates yet", desc: "Create your first template to get started." },
    starred: { title: "No starred templates", desc: "Star templates to find them quickly." },
    system: { title: "No system templates", desc: "System templates will appear here." },
    custom: { title: "No custom templates", desc: "Create a template to customize your workflow." },
    trash: { title: "Trash is empty", desc: "Deleted templates will appear here." },
  };
  const m = msgs[tab] ?? msgs.all;
  return (
    <div className="flex flex-col items-center justify-center h-[120px] text-center">
      <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{m.desc}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type TabValue = "all" | "starred" | "system" | "custom" | "trash";

export function TemplatesPage() {
  const { templates, isLoading, create, update, remove } = useTemplates();
  const [detailTarget, setDetailTarget] = useState<Template | "new" | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  // Starred
  const [starredIds, setStarredIds] = useState<Set<string>>(() => loadSet(STARRED_KEY));
  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveSet(STARRED_KEY, next);
      return next;
    });
  }, []);

  // Trash
  const [trashedIds, setTrashedIds] = useState<Set<string>>(() => loadSet(TRASHED_KEY));
  const trashOne = useCallback((id: string) => {
    setTrashedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveSet(TRASHED_KEY, next);
      return next;
    });
    toast("Template moved to trash");
  }, []);
  const restoreOne = useCallback((id: string) => {
    setTrashedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveSet(TRASHED_KEY, next);
      return next;
    });
    toast.success("Template restored");
  }, []);

  const editTemplate = detailTarget !== null && detailTarget !== "new" ? detailTarget : null;
  const isCreateMode = detailTarget === "new";

  // Categorize (memoized for stable references)
  const builtIn = useMemo(() => templates.filter((t) => t.type === "built_in"), [templates]);
  const custom = useMemo(() => templates.filter((t) => t.type === "custom"), [templates]);
  const activeTemplates = useMemo(() => templates.filter((t) => !trashedIds.has(t.id)), [templates, trashedIds]);
  const trashedTemplates = useMemo(() => templates.filter((t) => trashedIds.has(t.id)), [templates, trashedIds]);

  // Tab counts
  const allCount = activeTemplates.length;
  const starredCount = useMemo(() => activeTemplates.filter((t) => starredIds.has(t.id)).length, [activeTemplates, starredIds]);
  const systemCount = useMemo(() => builtIn.filter((t) => !trashedIds.has(t.id)).length, [builtIn, trashedIds]);
  const customCount = useMemo(() => custom.filter((t) => !trashedIds.has(t.id)).length, [custom, trashedIds]);
  const trashCount = trashedTemplates.length;

  // Display
  const display = useMemo(() => {
    switch (activeTab) {
      case "starred": return activeTemplates.filter((t) => starredIds.has(t.id));
      case "system": return builtIn.filter((t) => !trashedIds.has(t.id));
      case "custom": return custom.filter((t) => !trashedIds.has(t.id));
      case "trash": return trashedTemplates;
      default: return activeTemplates;
    }
  }, [activeTab, activeTemplates, trashedTemplates, builtIn, custom, starredIds, trashedIds]);

  const handleSave = useCallback(async (data: CreateTemplateData, actions: Action[]) => {
    const isEditingBuiltIn = editTemplate?.type === "built_in";

    // Save actions to localStorage
    const saveActionsForTemplate = (templateId: string) => {
      const stored: StoredAction[] = actions
        .filter((a) => a.folderId)
        .map((a) => ({ type: a.type, folderId: a.folderId }));
      const all = { ...loadActions(), [templateId]: stored };
      saveActions(all);
    };

    if (isCreateMode || isEditingBuiltIn) {
      // Create mode or editing built-in → create a new custom template
      const r = await create(data);
      if (r) {
        saveActionsForTemplate(r.id);
        setDetailTarget(null);
        if (isEditingBuiltIn) toast.success("Saved as a new custom template");
      }
    } else if (editTemplate) {
      const r = await update(editTemplate.id, data);
      if (r) {
        saveActionsForTemplate(editTemplate.id);
        setDetailTarget(null);
      }
    }
  }, [isCreateMode, editTemplate, create, update]);

  const duplicateTemplate = useCallback(async (t: Template, openAfter: boolean) => {
    const r = await create({
      name: `Copy of ${t.name}`,
      description: t.description,
      instructions: t.instructions,
      sections: t.sections.map((s) => ({ ...s, id: crypto.randomUUID() })),
      auto_assign_keywords: [...t.auto_assign_keywords],
      is_default: false,
    });
    if (r) {
      if (openAfter) setDetailTarget(r);
      else toast.success("Template duplicated");
    }
  }, [create]);

  const handleDuplicate = useCallback(async () => {
    if (!editTemplate) return;
    await duplicateTemplate(editTemplate, true);
  }, [editTemplate, duplicateTemplate]);

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

  const isTrashTab = activeTab === "trash";

  const cardPropsFor = (t: Template): TemplateCardProps => ({
    template: t,
    hue: hueForCategory(categorize(t)),
    isStarred: starredIds.has(t.id),
    isTrashed: isTrashTab,
    onClick: () => { if (!isTrashTab) setDetailTarget(t); },
    onStar: () => toggleStar(t.id),
    onTrash: () => trashOne(t.id),
    onRestore: () => restoreOne(t.id),
    onDuplicate: () => { void duplicateTemplate(t, false); },
  });

  const renderGroupedByCategory = () => {
    return TEMPLATE_CATEGORIES.map((cat) => {
      const inCat = display.filter((t) => categorize(t) === cat.id);

      // On the "all" tab, always show "My templates" section with a Create card,
      // even if the user has no custom templates yet.
      if (cat.id === "custom" && activeTab === "all") {
        return (
          <section key={cat.id} className="mt-8">
            <SectionHeader label={cat.label} subtitle={cat.subtitle || undefined} />
            <div className={CARD_GRID_CLASS}>
              <CreateTemplateCard onClick={() => setDetailTarget("new")} />
              {inCat.map((t) => <TemplateCard key={t.id} {...cardPropsFor(t)} />)}
            </div>
          </section>
        );
      }

      if (inCat.length === 0) return null;

      return (
        <section key={cat.id} className="mt-8">
          <SectionHeader label={cat.label} subtitle={cat.subtitle || undefined} />
          <div className={CARD_GRID_CLASS}>
            {inCat.map((t) => <TemplateCard key={t.id} {...cardPropsFor(t)} />)}
          </div>
        </section>
      );
    });
  };

  return (
    <div className="flex-1 overflow-auto min-w-0"><div className="px-[32px] pt-[28px] pb-[48px]">
      <div className="flex items-center justify-between gap-[12px] mb-[24px]">
        <p className="whitespace-nowrap text-foreground" style={{ fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", letterSpacing: "-0.56px" }}>Templates</p>
        <Button onClick={() => setDetailTarget("new")} className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
          <Icon icon={Add01Icon} size={14} /><span className="font-medium text-[13px]">New template</span>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 min-w-0 gap-0">
        <TabsList variant="line" className="gap-6">
          <TabsTrigger value="all" variant="line">All <span className="opacity-50 font-[inherit]">{allCount}</span></TabsTrigger>
          <TabsTrigger value="starred" variant="line">Starred <span className="opacity-50 font-[inherit]">{starredCount}</span></TabsTrigger>
          <TabsTrigger value="system" variant="line">System <span className="opacity-50 font-[inherit]">{systemCount}</span></TabsTrigger>
          <TabsTrigger value="custom" variant="line">My templates <span className="opacity-50 font-[inherit]">{customCount}</span></TabsTrigger>
          <TabsTrigger
            value="trash"
            variant="line"
            className={activeTab === "trash" ? "text-destructive data-[state=active]:text-destructive data-[state=active]:after:bg-destructive" : ""}
          >
            Trash <span className="opacity-50 font-[inherit]">{trashCount}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {display.length === 0 && activeTab !== "all" && activeTab !== "custom" ? (
        <div className="py-20"><EmptyTabState tab={activeTab} /></div>
      ) : activeTab === "custom" ? (
        <div className="mt-8">
          <div className={CARD_GRID_CLASS}>
            <CreateTemplateCard onClick={() => setDetailTarget("new")} />
            {display.map((t) => <TemplateCard key={t.id} {...cardPropsFor(t)} />)}
          </div>
        </div>
      ) : activeTab === "starred" || activeTab === "trash" ? (
        <div className="mt-8">
          <div className={CARD_GRID_CLASS}>
            {display.map((t) => <TemplateCard key={t.id} {...cardPropsFor(t)} />)}
          </div>
        </div>
      ) : (
        // "all" and "system" — grouped by category
        renderGroupedByCategory()
      )}
    </div></div>
  );
}
