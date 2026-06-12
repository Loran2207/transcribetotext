import type { Template } from "@/lib/templates";

/* Shared template metadata: emoji, categories, hue palette.
   Used by the Templates page, the template picker, and sample previews. */

// Exact-name emoji overrides — every built-in from the seeded library has
// a specific emoji so the card face reads like the design reference.
const TEMPLATE_EMOJI_EXACT: Record<string, string> = {
  // Basic
  "Auto": "\u{2728}",
  "General": "\u{1F4CB}",
  "Interview": "\u{1F3A4}",
  "Team Meeting": "\u{1F91D}",
  "Brainstorming": "\u{1F4A1}",
  // Sales
  "Sales Pitch": "\u{1F4E3}",
  "CHAMP": "\u{1F3C6}",
  "ANUM": "\u{1F3AF}",
  "SPICED": "\u{1F336}\u{FE0F}",
  "BANT": "\u{1F4B0}",
  "GPCT": "\u{1F4CA}",
  "MEDDIC": "\u{1F50D}",
  "FAINT": "\u{1F4B5}",
  "SPIN": "\u{1F504}",
  // HR & Management
  "Job Interview": "\u{1F454}",
  "1-on-1 Meeting": "\u{1F465}",
  "Exit Interview": "\u{1F44B}",
  // IT & Engineering
  "User Research Session": "\u{1F52C}",
  "Daily Stand-up Meeting": "\u{23F1}\u{FE0F}",
  "Weekly Meeting": "\u{1F4C5}",
  "Sprint Planning": "\u{1F3C3}",
  "Kick-off Meeting": "\u{1F680}",
  // Consulting
  "Consulting Meeting": "\u{1F914}",
  // Marketing
  "GTM (Go-to-Market)": "\u{1F5FA}\u{FE0F}",
  // Medical
  "SOAP Note": "\u{1F4DD}",
  "Medical Referral Letter": "\u{1F4E8}",
  // Education
  "Lecture": "\u{1F393}",
  "Panel Discussion": "\u{1F5E3}\u{FE0F}",
  // Writer
  "Reader Meet-and-Greet": "\u{1F4D6}",
  "Interview Article": "\u{270D}\u{FE0F}",
  // Media & Podcasts
  "YouTube Video": "\u{1F4FA}",
  // Others
  "Board Meeting": "\u{1F3DB}\u{FE0F}",
};

// Fallback keyword map — used for custom templates whose names don't appear above.
const TEMPLATE_EMOJI_MAP: { kw: string[]; emoji: string }[] = [
  { kw: ["general"], emoji: "\u{1F4CB}" },
  { kw: ["sales", "bant", "discovery"], emoji: "\u{1F4B0}" },
  { kw: ["1-on-1", "one-on-one", "1:1"], emoji: "\u{1F465}" },
  { kw: ["team meeting", "team sync"], emoji: "\u{1F91D}" },
  { kw: ["candidate", "interview"], emoji: "\u{1F3AF}" },
  { kw: ["research"], emoji: "\u{1F52C}" },
  { kw: ["standup", "stand-up"], emoji: "\u{23F1}\u{FE0F}" },
  { kw: ["retrospective", "retro"], emoji: "\u{1F504}" },
  { kw: ["brainstorm"], emoji: "\u{1F4A1}" },
  { kw: ["onboarding"], emoji: "\u{1F44B}" },
  { kw: ["training"], emoji: "\u{1F393}" },
  { kw: ["project"], emoji: "\u{1F4C1}" },
];

export function templateEmoji(name: string): string {
  if (TEMPLATE_EMOJI_EXACT[name]) return TEMPLATE_EMOJI_EXACT[name];
  const l = name.toLowerCase();
  return TEMPLATE_EMOJI_MAP.find((e) => e.kw.some((k) => l.includes(k)))?.emoji ?? "\u{1F4C4}";
}

// ---------------------------------------------------------------------------
// Categories & hue palette
// ---------------------------------------------------------------------------

export type HueId =
  | "blue" | "green" | "amber" | "purple" | "pink" | "teal"
  | "peach" | "slate" | "indigo" | "rose" | "violet" | "gray";

export interface HueTokens {
  bg: string;
  bgHover: string;
  chip: string;
  dot: string;
}

export const HUE_PALETTE: Record<HueId, HueTokens> = {
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

export type CategoryId =
  | "custom" | "basic" | "sales" | "hr" | "engineering"
  | "consulting" | "marketing" | "medical" | "education"
  | "writer" | "media" | "others";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  subtitle: string;
  hue: HueId;
}

export const TEMPLATE_CATEGORIES: CategoryMeta[] = [
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

export const CATEGORY_META_BY_ID: Record<CategoryId, CategoryMeta> = TEMPLATE_CATEGORIES.reduce((acc, c) => {
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

export function categorize(t: Template): CategoryId {
  const name = t.name.toLowerCase();
  for (const { cat, kws } of CATEGORY_KEYWORDS) {
    if (kws.some((k) => name.includes(k))) return cat;
  }
  return "basic";
}

export function hueForCategory(cat: CategoryId): HueTokens {
  return HUE_PALETTE[CATEGORY_META_BY_ID[cat].hue];
}

/** Short audience line for a template — shown in pickers under the name. */
export function templateAudience(t: Template): string {
  if (t.description) return t.description;
  const cat = categorize(t);
  const fallback: Record<CategoryId, string> = {
    custom: "Your custom template",
    basic: "Works for any meeting",
    sales: "For sales and client calls",
    hr: "For recruitment and people management",
    engineering: "For product and engineering teams",
    consulting: "For client consultations",
    marketing: "For marketing and launches",
    medical: "For clinical documentation",
    education: "For lectures and classes",
    writer: "For writing and publication",
    media: "For video and podcast summaries",
    others: "For general meetings",
  };
  return fallback[cat];
}