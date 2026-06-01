/**
 * Design-system tokens — mirrored verbatim from `src/styles/theme.css`.
 *
 * The board reads these so the documented values can never silently drift from
 * the real product tokens. `css` is what actually paints the swatch (a live
 * `var(--token)` wherever the project defines one); `value` is the human label.
 *
 * Tints + brand gradient are documented here as raw hex because they live as
 * inline illustration values in the app, not as `--tokens` in theme.css.
 */

import type { CSSProperties } from "react";

export type ColorToken = {
  name: string;
  /** Display label — the underlying OKLCH / hex / note. */
  value: string;
  /** Paint value applied to the swatch. */
  css: string;
  /** One-line usage note. */
  usage?: string;
  /** Draw a hairline so near-white swatches stay visible. */
  outline?: boolean;
};

export type ColorGroup = {
  id: string;
  title: string;
  note: string;
  tokens: ColorToken[];
};

export const colorGroups: ColorGroup[] = [
  {
    id: "primary",
    title: "Brand blue",
    note: "One accent carries every interactive moment — buttons, links, active nav, focus rings. Rationed against a near-white canvas.",
    tokens: [
      { name: "--primary", value: "oklch(.488 .243 264)", css: "var(--primary)", usage: "CTAs · links · active" },
      { name: "primary / 90", value: "hover", css: "color-mix(in srgb, var(--primary) 90%, white)", usage: "filled hover" },
      { name: "primary / 6", value: "soft wash", css: "color-mix(in srgb, var(--primary) 6%, white)", usage: "active nav · trial CTA", outline: true },
      { name: "--sidebar-primary", value: "oklch(.546 .245 263)", css: "var(--sidebar-primary)", usage: "active nav item" },
    ],
  },
  {
    id: "neutrals",
    title: "Neutrals",
    note: "A cool-tinted ramp — every gray carries a faint 286° hue so it harmonises with the blue.",
    tokens: [
      { name: "--foreground", value: "oklch(.141 .005 286)", css: "var(--foreground)", usage: "default text" },
      { name: "--muted-foreground", value: "oklch(.552 .016 286)", css: "var(--muted-foreground)", usage: "secondary · placeholder" },
      { name: "--secondary / --muted", value: "oklch(.967 .001 286)", css: "var(--secondary)", usage: "subtle fill · hover wash", outline: true },
      { name: "--border", value: "oklch(.92 .004 286)", css: "var(--border)", usage: "hairlines · inputs", outline: true },
      { name: "--background", value: "oklch(1 0 0)", css: "var(--background)", usage: "app canvas", outline: true },
    ],
  },
  {
    id: "feedback",
    title: "Feedback",
    note: "Red is the only saturated non-blue hue. Amber + green appear strictly on the password-strength meter.",
    tokens: [
      { name: "--destructive", value: "#EE1A1A", css: "var(--destructive)", usage: "delete · error" },
      { name: "destructive / 10", value: "soft", css: "color-mix(in srgb, var(--destructive) 10%, white)", usage: "remove button bg", outline: true },
      { name: "--strength-medium", value: "oklch(.795 .184 86)", css: "var(--strength-medium)", usage: "password — amber" },
      { name: "--strength-strong", value: "oklch(.723 .219 150)", css: "var(--strength-strong)", usage: "password — green" },
    ],
  },
  {
    id: "charts",
    title: "Chart ramp",
    note: "A graduated cool-gray ramp — never rainbow. Data leans on value, not hue.",
    tokens: [
      { name: "--chart-1", value: "oklch(.871 .006 286)", css: "var(--chart-1)" },
      { name: "--chart-2", value: "oklch(.552 .016 286)", css: "var(--chart-2)" },
      { name: "--chart-3", value: "oklch(.442 .017 286)", css: "var(--chart-3)" },
      { name: "--chart-4", value: "oklch(.37 .013 286)", css: "var(--chart-4)" },
      { name: "--chart-5", value: "oklch(.274 .006 286)", css: "var(--chart-5)" },
    ],
  },
  {
    id: "tints",
    title: "Illustration tints",
    note: "Pastel fills behind the small dashboard mini-illustrations. Never used as UI surfaces.",
    tokens: [
      { name: "tint-blue", value: "#E3F0FE", css: "#E3F0FE", outline: true },
      { name: "tint-amber", value: "#FFF3D5", css: "#FFF3D5", outline: true },
      { name: "tint-red", value: "#FEECEB", css: "#FEECEB", outline: true },
      { name: "tint-purple", value: "#E6E1FE", css: "#E6E1FE", outline: true },
      { name: "tint-promo", value: "#FEF2EB", css: "#FEF2EB", outline: true },
    ],
  },
];

/** Teal → blue, reserved for the logo mark and rare hero moments. */
export const brandGradient = {
  css: "linear-gradient(135deg, #2AAFA7 0%, #0088EB 100%)",
  angle: "135°",
  teal: "#2AAFA7",
  blue: "#0088EB",
};

export type TypeSpec = {
  label: string;
  sample: string;
  /** e.g. "28 / 700 · -0.02em". */
  spec: string;
  style: CSSProperties;
};

export const headingScale: TypeSpec[] = [
  { label: "display", sample: "Good afternoon, Kirill", spec: "28 / 700 · 1.2 · -0.02em", style: { fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" } },
  { label: "h1", sample: "Page heading", spec: "24 / 600 · 1.2 · -0.01em", style: { fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em" } },
  { label: "h2", sample: "Section heading", spec: "20 / 600 · 1.2", style: { fontSize: 20, fontWeight: 600, lineHeight: 1.2 } },
  { label: "h3", sample: "Dialog title", spec: "17 / 600 · 1.2", style: { fontSize: 17, fontWeight: 600, lineHeight: 1.2 } },
  { label: "h4", sample: "Card label", spec: "16 / 500 · 1.3", style: { fontSize: 16, fontWeight: 500, lineHeight: 1.3 } },
];

export const bodyScale: TypeSpec[] = [
  { label: "body", sample: "The workhorse size — table rows, panels, most copy.", spec: "14 / 400 · 1.5", style: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 } },
  { label: "caption", sample: "Secondary descriptions, breadcrumbs, menu items.", spec: "13 / 400 · muted", style: { fontSize: 13, fontWeight: 400, lineHeight: 1.45, color: "var(--muted-foreground)" } },
  { label: "label", sample: "Form labels and inline emphasis.", spec: "13 / 500", style: { fontSize: 13, fontWeight: 500 } },
  { label: "micro", sample: "Meta, plan tags, ⌘K hints, timestamps.", spec: "11 / 400 · muted", style: { fontSize: 11, fontWeight: 400, color: "var(--muted-foreground)" } },
  { label: "eyebrow", sample: "Eyebrow · section header", spec: "10.5 / 600 · 0.06em · upper", style: { fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-foreground)" } },
];

export const weights = [
  { w: 400, name: "normal" },
  { w: 500, name: "medium" },
  { w: 600, name: "semibold" },
  { w: 700, name: "bold" },
];

export type RadiusToken = { name: string; px: string; css: string };

export const radii: RadiusToken[] = [
  { name: "sm", px: "6px", css: "var(--radius-sm)" },
  { name: "md", px: "8px", css: "var(--radius-md)" },
  { name: "lg", px: "10px", css: "var(--radius-lg)" },
  { name: "xl", px: "14px", css: "var(--radius-xl)" },
  { name: "2xl", px: "18px", css: "var(--radius-2xl)" },
  { name: "3xl", px: "22px", css: "var(--radius-3xl)" },
  { name: "4xl", px: "26px", css: "var(--radius-4xl)" },
  { name: "full", px: "9999px", css: "var(--radius-full)" },
];

export type ElevationToken = { name: string; use: string; css: string; value: string };

export const elevations: ElevationToken[] = [
  { name: "elevation-sm", use: "cards", css: "var(--elevation-sm)", value: "0 1 2 / .05" },
  { name: "elevation-md", use: "modals · popovers · sheets", css: "var(--elevation-md)", value: "0 8 24 / .08" },
];
