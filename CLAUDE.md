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

### 2d. Icons — STRICT RULE

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

### 2e. Colors

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

### 2f. Typography

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

### 2g. Spacing & Layout

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

### 2h. Theming & Dark Mode

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
