# CLAUDE.md — Transcribe2Text

> **This file is automatically read by all Claude agents working in this codebase.**
> Treat it as the authoritative reference. Do not contradict it.

---

## 1. PROJECT OVERVIEW

**What it does:** A client-side web application for audio/video transcription management. Users can upload files, record audio, paste links, and manage transcription records organized in folders. Supports 6 languages (en, ru, es, de, fr, ja).

**Target users:** Professionals who need meeting transcriptions, lecture notes, and audio-to-text conversion.

**Origin:** Generated from a Figma design file via Figma Make, then extended with custom React components. All data is mock/demo — there is no backend or database.

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | ES2020 target |
| UI Framework | React | 18.3.1 |
| Build Tool | Vite | 6.3.5 |
| Styling | Tailwind CSS (v4, via @tailwindcss/vite) | 4.1.12 |
| Component Library | shadcn/ui (Radix UI primitives) | latest |
| Routing | React Router | 7.13.0 |
| State Management | React Context API | — |
| Forms | react-hook-form | 7.55.0 |
| Animation | motion (Framer Motion) | 12.23.24 |
| Icons | HugeIcons (app) + Lucide (shadcn internals) | @hugeicons/core-free-icons 4.0.0 |
| Notifications | Sonner | 2.0.3 |
| Charts | Recharts | 2.15.2 |
| Drag & Drop | react-dnd + html5-backend | 16.0.1 |
| Date | date-fns | 3.6.0 |
| Testing | Playwright (E2E only) | 1.58.2 |
| Deployment | Vercel | — |

### Entry Points

| Path | Purpose |
|------|---------|
| `src/main.tsx` | React app bootstrap (`createRoot`) |
| `src/app/App.tsx` | Root component with context providers |
| `src/app/routes.tsx` | React Router config |
| `src/styles/index.css` | CSS entry (imports fonts, tailwind, theme) |
| `vite.config.ts` | Build configuration |
| `components.json` | shadcn/ui configuration |

### Directory Structure

```
src/
├── app/
│   ├── components/          # Application components
│   │   ├── ui/              # shadcn/ui base components
│   │   └── figma/           # Figma-generated helpers
│   └── routes.tsx           # Route definitions
├── assets/                  # Static images
├── imports/                 # Figma-generated import files (DO NOT EDIT)
└── styles/                  # CSS (theme, fonts, tailwind)
public/
└── images/                  # Public static assets
e2e-tests/                   # Playwright E2E tests
guidelines/                  # Project guidelines template
```

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `AppLayout` | Main app shell (sidebar + content area) |
| `/transcriptions/:id` | `TranscriptionDetailPage` | Single transcription view |
| `/design-system` | `DesignSystemPage` | Design system reference page |

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.app.json` and `vite.config.ts`).

---

## 2. DESIGN SYSTEM

### 2a. Component Priority Order — MANDATORY

When implementing any UI, follow this strict priority:

1. **FIRST — Check existing project components** (section 2b below)
   If a component exists that covers the use case — **USE IT. Do not rewrite it.**

2. **SECOND — Use shadcn/ui** (section 2c below)
   If no project component covers the need, use a shadcn/ui component already installed.
   **Do not install new shadcn components without checking if they already exist.**

3. **LAST RESORT ONLY — Create a new component**
   New components must follow existing conventions and use design tokens.

**NEVER create a custom alternative to something that already exists. Check first. Always.**

---

### 2b. Existing Project Components

**This list is the first place to look. If it's here — use it.**

| Path | Component | Description |
|------|-----------|-------------|
| `src/app/components/App.tsx` | `App` | Root component with all context providers |
| `src/app/components/app-layout.tsx` | `AppLayout` | Main layout: sidebar + topbar + content area |
| `src/app/components/app-sidebar.tsx` | `AppSidebar` | Left sidebar with navigation, folder tree, user profile |
| `src/app/components/calendar-page.tsx` | `CalendarPage` | Calendar view for transcription records |
| `src/app/components/dashboard-page.tsx` | `DashboardPage` | Home page with action cards (Instant Speech, Integrations, Recent Records) |
| `src/app/components/design-system-page.tsx` | `DesignSystemPage` | UI design system demo/reference page |
| `src/app/components/folder-context.tsx` | `FolderProvider`, `useFolders` | Context for folder CRUD, tree operations, record assignments |
| `src/app/components/language-context.tsx` | `LanguageProvider`, `useLanguage` | i18n context with 6 languages and `t()` translation function |
| `src/app/components/main-app.tsx` | `MainApp` | Alternative main app wrapper |
| `src/app/components/my-records-page.tsx` | `MyRecordsPage` | Records listing with folder navigation, breadcrumb, table |
| `src/app/components/records-table.tsx` | `RecordsTable` | Full data table with drag-and-drop, sorting, filtering, context menus |
| `src/app/components/right-panel.tsx` | `RightPanel` | Right sidebar: upcoming meetings, premium upsell |
| `src/app/components/search-modal.tsx` | `SearchModal` | Global search modal (Cmd/Ctrl+K) with filters |
| `src/app/components/settings-modal.tsx` | `SettingsPage` | User settings: profile, password, security |
| `src/app/components/source-icons.tsx` | `SourceIcon` | Platform/source icons (Google Meet, Zoom, Teams, YouTube, etc.) |
| `src/app/components/starred-context.tsx` | `StarredProvider`, `useStarred` | Context for favorite/starred records |
| `src/app/components/top-bar.tsx` | `TopBar` | Top navigation: search, language selector, profile dropdown |
| `src/app/components/transcription-detail-page.tsx` | `TranscriptionDetailPage` | Detailed transcription view with tabs (Transcript, Summary, Speakers, Share) |
| `src/app/components/transcription-modals.tsx` | `TranscriptionModalsProvider`, `useTranscriptionModals` | Modal system for upload, record, link, meeting operations |
| `src/app/components/user-profile-context.tsx` | `UserProfileProvider`, `useUserProfile` | User profile state (name, avatar) |
| `src/app/components/figma/ImageWithFallback.tsx` | `ImageWithFallback` | Image with error fallback handling |

---

### 2c. shadcn/ui Components Available in This Project

**Only use shadcn components already listed here. Do not add new ones without explicit instruction.**

| File | Component(s) |
|------|-------------|
| `ui/accordion.tsx` | Accordion, AccordionItem, AccordionTrigger, AccordionContent |
| `ui/alert.tsx` | Alert |
| `ui/alert-dialog.tsx` | AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel |
| `ui/aspect-ratio.tsx` | AspectRatio |
| `ui/avatar.tsx` | Avatar, AvatarImage, AvatarFallback |
| `ui/badge.tsx` | Badge |
| `ui/breadcrumb.tsx` | Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator |
| `ui/button.tsx` | Button (variants: default, destructive, outline, secondary, ghost, link) |
| `ui/calendar.tsx` | Calendar (react-day-picker) |
| `ui/card.tsx` | Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent |
| `ui/carousel.tsx` | Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext |
| `ui/chart.tsx` | ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent |
| `ui/checkbox.tsx` | Checkbox |
| `ui/collapsible.tsx` | Collapsible, CollapsibleTrigger, CollapsibleContent |
| `ui/command.tsx` | Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator |
| `ui/context-menu.tsx` | ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator |
| `ui/dialog.tsx` | Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription |
| `ui/drawer.tsx` | Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription |
| `ui/dropdown-menu.tsx` | DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub |
| `ui/form.tsx` | Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription |
| `ui/hover-card.tsx` | HoverCard, HoverCardTrigger, HoverCardContent |
| `ui/icon.tsx` | Icon (HugeIcons wrapper — see section 2d) |
| `ui/input.tsx` | Input |
| `ui/input-otp.tsx` | InputOTP, InputOTPGroup, InputOTPSlot |
| `ui/label.tsx` | Label |
| `ui/menubar.tsx` | Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarCheckboxItem, MenubarRadioItem |
| `ui/navigation-menu.tsx` | NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink |
| `ui/pagination.tsx` | Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis |
| `ui/popover.tsx` | Popover, PopoverTrigger, PopoverContent |
| `ui/progress.tsx` | Progress |
| `ui/radio-group.tsx` | RadioGroup, RadioGroupItem |
| `ui/resizable.tsx` | ResizablePanelGroup, ResizablePanel, ResizableHandle |
| `ui/scroll-area.tsx` | ScrollArea, ScrollBar |
| `ui/select.tsx` | Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator |
| `ui/separator.tsx` | Separator |
| `ui/sheet.tsx` | Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription |
| `ui/sidebar.tsx` | SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarTrigger, SidebarInset |
| `ui/skeleton.tsx` | Skeleton |
| `ui/slider.tsx` | Slider |
| `ui/sonner.tsx` | Toaster |
| `ui/switch.tsx` | Switch |
| `ui/table.tsx` | Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableFooter |
| `ui/tabs.tsx` | Tabs, TabsList, TabsTrigger, TabsContent |
| `ui/textarea.tsx` | Textarea |
| `ui/toggle.tsx` | Toggle |
| `ui/toggle-group.tsx` | ToggleGroup, ToggleGroupItem |
| `ui/tooltip.tsx` | Tooltip, TooltipTrigger, TooltipContent, TooltipProvider |

**Utilities:**
- `ui/utils.ts` — `cn()` function (clsx + tailwind-merge)
- `ui/use-mobile.ts` — `useIsMobile()` hook (breakpoint: 768px)

---

### 2d. Button Variants — STRICT RULE

**ALL buttons in this project are fully rounded (pill-shaped / `rounded-full`). No exceptions.**

- `rounded-full` is the base default inside `src/app/components/ui/button.tsx` — every variant and every size inherits it.
- **Never** override it with `rounded-md`, `rounded-lg`, `rounded-xl`, or any other radius utility on a `<Button>` — not in className, not in a new variant, not in inline styles, not in a wrapper.
- When adding a new button variant, do not re-specify border radius. Leave the base to handle it.
- Icon buttons (`size="icon"`) are circular by design — this is intentional; do not "fix" them back to rounded-square.
- If you catch yourself about to write `rounded-md` on anything that is a button or looks like a button, stop — it's wrong for this project.

**Never use the `secondary` variant** for secondary/non-primary actions. The gray filled style (`bg-secondary`) is not used in this project.

**Variant picking rules:**
- **Primary action** (CTA): `variant="default"` — filled blue
- **Secondary action**: `variant="pill-outline"` — white background, border. This is the standard secondary button style.
- **Dark / OAuth / on-brand dark action** (e.g. "Continue with Google"): `variant="pill-dark"` — slate-tinted near-black background, white content, subtle inner highlight. Uses `--oauth` / `--oauth-hover` tokens.
- **Subtle/inline action**: `variant="ghost"` — no border, transparent background
- **Destructive action**: `variant="destructive"` — filled red
- **Do NOT use** `variant="secondary"` — it produces a gray filled button which does not match the project design system
- **Do NOT use** `variant="outline"` for standalone buttons — it lacks a visible border at rest. Use `pill-outline` instead.

---

### 2e. Icons — STRICT RULE

This project uses **Huge Icons** as the primary icon library for application components.

**Packages installed:**
- `@hugeicons/core-free-icons` ^4.0.0 — icon definitions
- `@hugeicons/react` ^1.1.6 — React renderer

**Import pattern for application components:**
```tsx
// Import icon definitions from core-free-icons
import { House, Calendar, Settings } from "@hugeicons/core-free-icons";

// Use with the Icon wrapper component
import { Icon } from "@/app/components/ui/icon";

<Icon icon={House} size={20} />

// OR use HugeiconsIcon directly
import { HugeiconsIcon } from "@hugeicons/react";

<HugeiconsIcon icon={House} size={20} />
```

**Exception:** Lucide React (`lucide-react` v0.487.0) is used ONLY inside shadcn/ui base components (`src/app/components/ui/`). This is acceptable for shadcn internals but **do not use Lucide in application components**.

**Rules:**
- **Use `@hugeicons/core-free-icons` for all new application icons**
- **Use the `Icon` wrapper component from `@/app/components/ui/icon`**
- **Do not use lucide-react, heroicons, radix icons, or @mui/icons-material in application components**
- **Do not embed raw inline SVGs unless there is absolutely no HugeIcons equivalent**
- `@mui/icons-material` is installed but should not be used — it's legacy

---

### 2f. Colors

All colors use the **OKLCH color space** and are defined as CSS custom properties in `src/styles/theme.css`.

**Use Tailwind utility classes** that reference these tokens (e.g., `bg-primary`, `text-muted-foreground`). **NEVER hardcode hex, rgb, hsl, or oklch values. NEVER invent new colors.**

| Token | Value | Use |
|-------|-------|-----|
| `--background` | `oklch(1 0 0)` | App background (white) |
| `--foreground` | `oklch(0.141 0.005 285.823)` | Default text color (near-black) |
| `--card` | `oklch(1 0 0)` | Card/modal backgrounds |
| `--card-foreground` | `oklch(0.141 0.005 285.823)` | Text on cards |
| `--popover` | `oklch(1 0 0)` | Dropdown/tooltip backgrounds |
| `--popover-foreground` | `oklch(0.141 0.005 285.823)` | Text on popovers |
| `--primary` | `oklch(0.488 0.243 264.376)` | Primary actions, CTAs, links (blue) |
| `--primary-foreground` | `oklch(0.97 0.014 254.604)` | Text on primary elements |
| `--secondary` | `oklch(0.967 0.001 286.375)` | Secondary buttons (light gray) |
| `--secondary-foreground` | `oklch(0.21 0.006 285.885)` | Text on secondary elements |
| `--muted` | `oklch(0.967 0.001 286.375)` | Disabled/subtle backgrounds |
| `--muted-foreground` | `oklch(0.552 0.016 285.938)` | Disabled/placeholder text |
| `--accent` | `oklch(0.967 0.001 286.375)` | Highlights, hover states |
| `--accent-foreground` | `oklch(0.21 0.006 285.885)` | Text on accent elements |
| `--destructive` | `#EE1A1A` | Delete, error actions (red) |
| `--destructive-foreground` | `oklch(0.97 0.014 254.604)` | Text on destructive elements |
| `--border` | `oklch(0.92 0.004 286.32)` | Default borders |
| `--input` | `oklch(0.92 0.004 286.32)` | Input borders |
| `--input-background` | `oklch(1 0 0)` | Input backgrounds |
| `--ring` | `var(--primary)` | Focus ring color |
| `--chart-1` | `oklch(0.871 0.006 286.286)` | Chart color 1 |
| `--chart-2` | `oklch(0.552 0.016 285.938)` | Chart color 2 |
| `--chart-3` | `oklch(0.442 0.017 285.786)` | Chart color 3 |
| `--chart-4` | `oklch(0.37 0.013 285.805)` | Chart color 4 |
| `--chart-5` | `oklch(0.274 0.006 286.033)` | Chart color 5 |
| `--sidebar` | `oklch(0.985 0 0)` | Sidebar background |
| `--sidebar-foreground` | `oklch(0.141 0.005 285.823)` | Sidebar text |
| `--sidebar-primary` | `oklch(0.546 0.245 262.881)` | Sidebar active items |
| `--sidebar-primary-foreground` | `oklch(0.97 0.014 254.604)` | Text on sidebar active items |
| `--sidebar-accent` | `oklch(0.967 0.001 286.375)` | Sidebar hover state |
| `--sidebar-accent-foreground` | `oklch(0.21 0.006 285.885)` | Text on sidebar hover |
| `--sidebar-border` | `oklch(0.92 0.004 286.32)` | Sidebar borders |
| `--sidebar-ring` | `oklch(0.705 0.015 286.067)` | Sidebar focus ring |

**Elevation tokens:**
| Token | Value | Use |
|-------|-------|-----|
| `--elevation-sm` | `0px 1px 2px 0px rgba(16, 24, 40, 0.05)` | Cards, subtle elevation |
| `--elevation-md` | `0px 8px 24px rgba(0, 0, 0, 0.08), 0px 2px 8px rgba(0, 0, 0, 0.04)` | Modals, popovers, dropdowns |

---

### 2g. Typography

**Font families** (defined in `src/styles/theme.css`):
- `--font-sans`: `'Inter Variable', sans-serif` — body text
- `--font-heading`: `'Inter Variable', sans-serif` — headings

**Font sources:** `@fontsource-variable/inter` (npm) + Google Fonts import in `fonts.css`.

**Font weight tokens:**
| Token | Value | Use |
|-------|-------|-----|
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Labels, emphasis |
| `--font-weight-semibold` | 600 | Headings (h1-h3) |

**Heading rules** (from `@layer base`):
- `h1, h2, h3`: `font-heading`, weight `semibold`, line-height `1.2`
- `h4`: `font-heading`, weight `medium`, line-height `1.3`

**Do not invent new font sizes or weights. Use Tailwind's default type scale.**

---

### 2h. Spacing & Layout

**Border radius scale** (base `--radius: 0.625rem` = 10px):
| Token | Calc | Approx |
|-------|------|--------|
| `--radius-sm` | `radius * 0.6` | 6px |
| `--radius-md` | `radius * 0.8` | 8px |
| `--radius-lg` | `radius` | 10px |
| `--radius-xl` | `radius * 1.4` | 14px |
| `--radius-2xl` | `radius * 1.8` | 18px |
| `--radius-3xl` | `radius * 2.2` | 22px |
| `--radius-4xl` | `radius * 2.6` | 26px |

**Breakpoints:** Default Tailwind breakpoints. Mobile detection via `useIsMobile()` at 768px.

**Layout pattern:** The app uses a sidebar (`AppSidebar`) + content area pattern via `SidebarProvider` and `SidebarInset`.

---

### 2i. Theming & Dark Mode

- **Theme engine:** `next-themes` v0.4.6 is installed but currently **light mode only** — no dark mode CSS variables are defined in `theme.css`.
- **CSS variable strategy:** All theme values are CSS custom properties in `:root`. Tailwind maps them via `@theme inline` block.
- **No class-based dark mode** is currently configured.
- If dark mode is added later, it should use `.dark` class selector with matching CSS variable overrides.

---

## 3. CODE CONVENTIONS

### Naming

- **Files:** kebab-case (`my-records-page.tsx`, `folder-context.tsx`)
- **Components:** PascalCase (`MyRecordsPage`, `FolderProvider`)
- **Hooks:** camelCase with `use` prefix (`useFolders`, `useLanguage`)
- **Context files:** `*-context.tsx` pattern
- **Page components:** `*-page.tsx` pattern

### Imports

```tsx
// Order observed in codebase:
1. External library imports (react, react-router, etc.)
2. Icon imports (@hugeicons/core-free-icons)
3. UI component imports (@/app/components/ui/*)
4. App component imports (@/app/components/*)
5. Context hooks (useFolders, useLanguage, etc.)
6. Types
```

Path alias: `@/` → `src/`

### State Management

- **React Context API** exclusively — no Redux, Zustand, or Jotai
- 4 context providers nested in `App.tsx`:
  1. `LanguageProvider` (outermost)
  2. `StarredProvider`
  3. `FolderProvider`
  4. `TranscriptionModalsProvider` (innermost)
- `UserProfileProvider` is defined but used within specific components

### Data Persistence

| Storage | Key Pattern | Used By |
|---------|------------|---------|
| localStorage | `ttt_folders` | Folder tree data |
| localStorage | `ttt_folder_assignments` | Record-to-folder mapping |
| localStorage | `ttt_defaults_v` | Schema version for migrations |
| localStorage | `app-lang` | Selected language |
| sessionStorage | `uploaded-record:{id}` | Uploaded record state |

### Data Fetching

**No server-side data fetching.** This is a fully client-side demo app. All data is mock data defined inline in components.

### Form Handling

- Library: `react-hook-form` v7.55.0
- shadcn `Form` component wraps `FormProvider`
- No schema validation library (no zod/yup) — validation is manual

### Notifications

```tsx
import { toast } from "sonner";
toast.success("Outline copied");
toast("Reply sent");
toast.error("Something went wrong");
```

### Animation

```tsx
import { motion } from "motion/react";
<motion.div animate={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
```

### Error Handling

- No React Error Boundaries
- Image errors handled via `ImageWithFallback` component
- Transcription errors use typed `errorType`: `"no_audio" | "corrupt" | "too_long" | "network"`

---

## 4. KEY BUSINESS LOGIC

### Core Domain Concepts

1. **TranscriptionJob** — The central entity. Represents an audio/video being transcribed. Has lifecycle states: `uploading → processing → done | error`. Defined in `transcription-modals.tsx`.

2. **RecordRow** — A completed transcription record shown in the records table. Has metadata: name, duration, date, language, source, summary. Defined in `records-table.tsx`.

3. **SourceType** — Origin of a transcription: `"mp3" | "mp4" | "google-meet" | "zoom" | "teams" | "youtube" | "dropbox" | "microphone" | "link"`. Defined in `source-icons.tsx`.

4. **FolderItem** — Hierarchical folder structure for organizing records. Supports nesting, colors, drag-and-drop assignment. Immutable tree operations in `folder-context.tsx`.

5. **ModalType** — The transcription creation flow: `"upload" | "record" | "link" | "meeting" | null`. Controls which modal is shown.

6. **RecordingPhase** — Live recording lifecycle: `"idle" | "recording" | "paused" | "review"`. Managed with Web Speech API for live transcription.

7. **UserPlan** — `"free" | "pro"` — gates premium features in the UI.

8. **LangCode** — `"en" | "ru" | "es" | "de" | "fr" | "ja"` — supported UI languages.

9. **Starred records** — Favorites system using a `Set<string>` of record IDs.

10. **Folder assignments** — `Record<string, string>` mapping record IDs to folder IDs.

### Non-Obvious Decisions

- **Immutable folder tree operations:** All folder mutations (`addToTree`, `removeFromTree`, `updateInTree`) clone the entire tree. This is by design — do not introduce in-place mutations.
- **Version-based localStorage migrations:** `ttt_defaults_v` tracks schema version. When bumped, default data is re-seeded. Current version: `"2"`.
- **Portal-based modals:** Dialogs and dropdowns use `createPortal` to `document.body` to avoid z-index stacking issues.
- **Web Speech API:** Live transcription uses browser-native `SpeechRecognition` API (Chrome only). Feature-detected at runtime.

---

## 5. DO NOT TOUCH / DANGER ZONES

### Do Not Modify

| Path | Reason |
|------|--------|
| `src/imports/` | Auto-generated Figma import files. Will be overwritten on re-export. |
| `src/app/components/ui/*.tsx` | shadcn/ui base components. Only modify if fixing a bug or updating shadcn. |
| `components.json` | shadcn configuration. Changes affect component generation. |
| `dist/` | Build output. Regenerated on `npm run build`. |

### Patterns Intentionally Avoided

- **No server-side rendering** — This is a Vite SPA, not Next.js. No SSR/SSG.
- **No global state library** — Context API is used deliberately. Do not introduce Redux/Zustand.
- **No API layer** — All data is client-side mock data. Do not create API routes or fetch calls unless adding a real backend.
- **No dark mode CSS** — `next-themes` is installed but dark variables are not defined. Do not add dark mode without defining the full variable set.

### Known Technical Debt

- Several large files exceed 800 lines: `transcription-modals.tsx` (130KB), `records-table.tsx` (122KB), `transcription-detail-page.tsx` (113KB). These are Figma-generated and complex — refactor with caution.
- `@mui/icons-material` and `@emotion/react`/`@emotion/styled` are installed but should be considered legacy. Do not add new MUI usage.
- `lucide-react` is a dependency of shadcn internals. Do not use it in application components.
- `@fontsource-variable/nunito-sans` is installed but not used in the theme.

---

## 6. COMMANDS

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (output: `dist/`) |
| `npx playwright test` | Run E2E tests (from `e2e-tests/`) |
| `npx shadcn add <component>` | Add a new shadcn/ui component |

---

## 7. UI PATTERNS & CONVENTIONS

### 7a. Modals & Dialogs

**Two patterns coexist in this codebase:**

**Pattern 1 — Portal-based custom modals** (used by large Figma-generated components):
Files: `transcription-modals.tsx`, `search-modal.tsx`, `records-table.tsx`, `app-sidebar.tsx`, `my-records-page.tsx`
```tsx
import { createPortal } from "react-dom";

const [open, setOpen] = useState(false);

{open && createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
    <div className="relative bg-card rounded-2xl shadow-md p-6">
      {/* content */}
    </div>
  </div>,
  document.body
)}
```

**Pattern 2 — shadcn Dialog** (preferred for new features):
Files: `templates-page.tsx`, `settings-modal.tsx`
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

**Rule:** For new modals, always use shadcn `Dialog`. Only use `createPortal` if integrating into existing Figma-generated components that already use that pattern.

### 7b. Confirmation Dialogs (AlertDialog)

Files: `templates-page.tsx`, `records-table.tsx`, `settings-modal.tsx`, `my-records-page.tsx`
```tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Rule:** Always use `AlertDialog` for destructive confirmations. Never use `window.confirm()`.

### 7c. Dropdown Menus

Files: `templates-page.tsx`, `records-table.tsx`, `transcription-detail-page.tsx`, `my-records-page.tsx`
```tsx
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><Icon icon={MoreVertical} size={16} /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete} className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Rule:** Always use shadcn `DropdownMenu`. Never build custom dropdown logic.

### 7d. Tabs

Files: `templates-page.tsx`, `transcription-detail-page.tsx`, `transcription-modals.tsx`, `records-table.tsx`, `design-system-page.tsx`
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";

<Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### 7e. Forms (Auth Pages Pattern)

Files: `login-page.tsx`, `signup-page.tsx`, `forgot-password-page.tsx`, `reset-password-page.tsx`
```tsx
import { useForm } from "react-hook-form";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface FormValues { email: string; password: string; }

const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ mode: "onBlur" });

const [isSubmitting, setIsSubmitting] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);

const onSubmit = async (data: FormValues) => {
  setIsSubmitting(true);
  setErrorMessage(null);
  const { error } = await signIn(data.email, data.password);
  if (error) { setErrorMessage(error.message); setIsSubmitting(false); return; }
  navigate("/");
};
```

**Rules:**
- Use `react-hook-form` with `mode: "onBlur"` for validation timing
- Track `isSubmitting` state manually (no formState.isSubmitting for async)
- Show error messages via a `errorMessage` state string, displayed in a styled div
- Disable form fields during submission with `isFormDisabled` flag
- No zod/yup — validation is inline via `register()` rules

### 7f. Notifications (Toast)

Files: `transcription-modals.tsx`, `settings-modal.tsx`, `signup-page.tsx`, `email-confirmation-page.tsx`, `templates-page.tsx`, `transcription-detail-page.tsx`
```tsx
import { toast } from "sonner";

toast.success("Template saved");
toast.error("Failed to load templates");
toast("Reply sent");
```

**Rule:** Always use `sonner`. Never use `window.alert()` or custom toast implementations.

### 7g. Loading States

**Skeleton loading** (for data-heavy views):
Files: `templates-page.tsx`, `transcription-detail-page.tsx`
```tsx
import { Skeleton } from "@/app/components/ui/skeleton";

{isLoading ? (
  <div className="space-y-3">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  <ActualContent />
)}
```

**Button loading** (for form submissions):
Files: `login-page.tsx`, `signup-page.tsx`, `forgot-password-page.tsx`
```tsx
import { Loading01Icon } from "@hugeicons/core-free-icons";

<Button disabled={isSubmitting}>
  {isSubmitting && <Icon icon={Loading01Icon} size={16} className="animate-spin mr-2" />}
  Submit
</Button>
```

**Rule:** Use `Skeleton` for content loading. Use spinner icon + disabled button for form submissions. Never leave async operations without visible loading feedback.

### 7h. Empty States

**Coming Soon pages** (for unbuilt features):
Files: `app-layout.tsx`, `calendar-page.tsx`
```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6">
  <div className="size-[72px] rounded-2xl bg-primary/5 flex items-center justify-center">
    <HugeiconsIcon icon={Puzzle} size={32} className="text-primary/60" />
  </div>
  <div className="text-center">
    <h2 className="text-xl font-semibold text-foreground">Coming Soon</h2>
    <p className="text-[14px] text-muted-foreground mt-1.5 max-w-[320px]">
      Feature is under development.
    </p>
  </div>
</div>
```

**Search empty state** (no results):
Files: `search-modal.tsx`, `records-table.tsx`
Pattern: Centered text with muted color, relevant icon above.

### 7i. Animation

Files: `dashboard-page.tsx`, `login-page.tsx`, `signup-page.tsx`, `forgot-password-page.tsx`, `reset-password-page.tsx`, `email-confirmation-page.tsx`
```tsx
import { motion, useReducedMotion } from "motion/react";

const prefersReducedMotion = useReducedMotion();

const animProps = (delay: number) =>
  prefersReducedMotion ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  };

<motion.div {...animProps(0.1)}>Content</motion.div>
```

**Hover animations** (cards, interactive elements):
```tsx
<motion.div
  animate={hovered ? { y: -3, scale: 1.05 } : { y: 0, scale: 1 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>
```

**Rules:**
- Import from `"motion/react"` (NOT `"framer-motion"`)
- Always check `useReducedMotion()` for accessibility
- Use spring physics for hover/interactive animations
- Use duration-based easing for page entrance animations
- Stagger delay: ~0.08s between sequential elements

### 7j. Sheets (Slide-in Panels)

Files: `transcription-detail-page.tsx`, `source-icons.tsx`
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Panel Title</SheetTitle>
    </SheetHeader>
    {/* content */}
  </SheetContent>
</Sheet>
```

### 7k. Select Dropdowns

Files: `transcription-modals.tsx`, `templates-page.tsx`, `records-table.tsx`
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### 7l. Breadcrumb Navigation

Files: `templates-page.tsx`, `my-records-page.tsx`
```tsx
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink onClick={goBack}>Parent</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Current Page</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### 7m. Popover

Files: `templates-page.tsx`, `records-table.tsx`
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80" align="start">
    {/* content */}
  </PopoverContent>
</Popover>
```

### 7n. Tooltip

Files: `transcription-detail-page.tsx`
```tsx
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/app/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button variant="ghost">Hover me</Button></TooltipTrigger>
    <TooltipContent>Tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 7o. Drag & Drop

Files: `templates-page.tsx`, `records-table.tsx`
```tsx
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

<DndProvider backend={HTML5Backend}>
  {/* Draggable items use useDrag/useDrop hooks */}
</DndProvider>
```

**Rule:** Use `react-dnd` with `HTML5Backend`. Do not introduce alternative DnD libraries.

---

## 8. FILE STRUCTURE

```
src/
├── app/
│   ├── components/              # All application components
│   │   ├── ui/                  # shadcn/ui base components (DO NOT EDIT)
│   │   ├── figma/               # Figma-generated helpers
│   │   ├── *-page.tsx           # Page components (dashboard, records, calendar, etc.)
│   │   ├── *-context.tsx        # React Context providers
│   │   ├── *-modal.tsx          # Modal components
│   │   ├── auth-*.tsx           # Auth-related components
│   │   └── *.tsx                # Feature components
│   ├── App.tsx                  # Root with provider nesting
│   └── routes.tsx               # React Router definitions
├── hooks/                       # Custom React hooks (e.g., use-templates.ts)
├── lib/                         # Service/query functions (e.g., supabase.ts, templates.ts)
├── assets/                      # Static images
├── imports/                     # Figma auto-generated (DO NOT EDIT)
└── styles/                      # CSS (theme.css, fonts.css, tailwind.css, index.css)
public/images/                   # Public static assets
e2e-tests/                       # Playwright E2E tests
.claude/agents/                  # Claude subagent definitions
```

**Conventions:**
- `src/lib/` — Supabase query functions, one file per domain (e.g., `templates.ts`)
- `src/hooks/` — React hooks that wrap `src/lib/` functions (e.g., `use-templates.ts`)
- Page components go in `src/app/components/` with `*-page.tsx` naming
- Context providers go in `src/app/components/` with `*-context.tsx` naming
- Never put Supabase calls directly in components — always go through `src/lib/`

---

## 9. AUTHENTICATION & ROUTING

### Auth Architecture

| Component | File | Purpose |
|-----------|------|---------|
| `AuthProvider` | `auth-context.tsx` | Wraps app, provides `useAuth()` hook |
| `ProtectedRoute` | `protected-route.tsx` | Redirects unauthenticated users to `/login` |
| `AuthLayout` | `auth-layout.tsx` | Shared layout for login/signup/forgot-password |

**Auth flow:**
- Supabase Auth with email/password + Google OAuth
- `AuthProvider` listens to `onAuthStateChange` and provides `user`, `session`, `loading`
- Protected routes use `<ProtectedRoute>` wrapper
- Auth pages redirect authenticated users away with `<Navigate to="/" replace />`

**Routes (updated):**

| Path | Component | Auth Required |
|------|-----------|--------------|
| `/` | `AppLayout` (via `ProtectedRoute`) | Yes |
| `/transcriptions/:id` | `TranscriptionDetailPage` | Yes |
| `/login` | `LoginPage` | No |
| `/signup` | `SignupPage` | No |
| `/check-email` | `EmailConfirmationPage` | No |
| `/auth/callback` | `AuthCallbackPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |
| `/design-system` | `DesignSystemPage` | No |

---

## 10. AGENT ORCHESTRATION — HOW TO USE AGENTS

Before starting ANY feature or fix, evaluate which agents to use.

**Available agents in `.claude/agents/`:**

| Agent | Use for |
|-------|---------|
| `@supabase-developer` | All DB work: tables, RLS, migrations, queries |
| `@ui-developer` | All UI: components, pages, layouts, styling |
| `@qa-tester` | Testing: verify every scenario after implementation |
| `@code-reviewer` | Code quality: types, patterns, no console.log, no hardcoded colors |
| `@feature-planner` | Planning: break down complex features before starting |

### When to Spawn Agent Teams (parallel)

Spawn multiple agents simultaneously when work can be done in parallel:
- DB changes (`supabase-developer`) + UI changes (`ui-developer`) → parallel
- Multiple independent UI components → parallel `ui-developer` instances
- `qa-tester` + `code-reviewer` → always run in parallel at the end

### Mandatory Workflow for EVERY Task

1. `@feature-planner` → plan the implementation, list files to change
2. Spawn parallel teams for implementation
3. `@qa-tester` → test every scenario from the QA checklist below
4. `@code-reviewer` → verify code quality
5. If QA passes AND code-reviewer passes → commit (see Deploy Gate below)
6. If any agent reports issues → fix before committing

### QA Checklist (must pass before every push)

- [ ] Feature works as described
- [ ] Loading states exist on all async operations
- [ ] Error states handled (not just happy path)
- [ ] Empty states handled (no data scenario)
- [ ] No hardcoded colors (theme.css variables only)
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No `console.log` in production code
- [ ] Mobile/responsive layout not broken
- [ ] Existing features not broken by changes

### Deploy Gate — Commit Only After QA Green Light

After `@qa-tester` confirms ALL scenarios pass AND `@code-reviewer` gives approval AND `npm run build` has zero errors:

```bash
git add <specific-files>
git commit -m "<type>: <description>"
git push origin main
```

**Commit message types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**ONLY push if:**
- `@qa-tester`: "All X/X scenarios PASS"
- `@code-reviewer`: "No issues found" or all issues fixed
- `npm run build`: zero errors, zero warnings

If ANY of the above fails → do NOT push → fix first → re-test.

### Branch & Merge Policy

All changes that have passed QA approval must first be merged into the `stage` branch — **never directly into `main`**. Merging into `main` is only allowed when Kirill explicitly instructs it.

**Automated flow after QA sign-off:**
1. Implement changes
2. `@qa-tester` confirms all scenarios pass
3. `@code-reviewer` approves
4. Merge to `stage`

**Merging `stage` → `main` is a manual step triggered only by Kirill's direct instruction.**

---

## 11. PATTERN DISCOVERY PROTOCOL

When working on any task, Claude must actively watch for new patterns.
A "new pattern" is anything that:
- Appears for the first time in the codebase
- Solves a problem in a way not yet documented in this file
- Is likely to be reused in future features
- Differs from what is already documented here

### When Claude spots a new pattern, it must STOP and ask:

After completing the task (not during — finish the work first),
Claude adds a message like this:

---

**Pattern Discovery**

I noticed a new pattern while working on this task that isn't
documented in CLAUDE.md yet:

**Pattern:** [name of the pattern]
**Where I saw it:** [file path]
**What it does:** [1-2 sentence description]
**Example:**
```
[short code snippet]
```

Should I add this to CLAUDE.md?
- Yes — I'll add it to the relevant section
- No — I'll skip it
- Modify — Tell me how you want it documented

---

### Examples of what triggers a pattern discovery question:

- A new way of handling a loading state that differs from existing ones
- A new component composition pattern
- A new way of structuring a Supabase query
- A new error handling approach
- A new animation or transition pattern
- A reusable utility function that could apply elsewhere
- A new folder or file organization that differs from conventions

### Rules:

- Claude asks ONCE per task at the end — not multiple times mid-task
- If there are multiple new patterns, list them all in ONE message
- Claude never auto-adds to CLAUDE.md without asking first
- If the user says "yes" → Claude adds it immediately and confirms
- If the user says "no" → Claude moves on without asking again
- Pattern questions come AFTER the QA gate passes, not before

### Format for adding to CLAUDE.md after user confirms:

Claude finds the most relevant existing section in CLAUDE.md
and adds the pattern there with:
- A clear title
- When to use it
- A minimal code example from the actual project
- Any gotchas or things to avoid

This keeps CLAUDE.md as a living document that grows
with the project automatically.
