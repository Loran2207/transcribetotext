import { House, Calendar, Layers, Puzzle, Settings, Globe, LogOut, Plus, ChevronRight, ChevronsLeft, FileText, UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import svgPaths from "../../imports/svg-i3wf63n6gj";
const imgEllipse52 = "/images/avatar.png";
import { useStarred } from "./starred-context";
import { SourceIcon } from "./source-icons";
import { useFolders } from "./folder-context";
import { useLanguage, LANGUAGES } from "./language-context";
import { useAuth } from "./auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";

interface AppSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenFolder?: (folderId: string) => void;
}

/* ── Folder icon SVG path (filled, no stroke) — from Figma p1f315b00 ── */
const FOLDER_PATH = "M13.3333 13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V5.33333C14.6667 4.97971 14.5262 4.64057 14.2761 4.39052C14.0261 4.14048 13.687 4 13.3333 4H8.06667C7.84368 4.00219 7.6237 3.94841 7.42687 3.84359C7.23004 3.73877 7.06264 3.58625 6.94 3.4L6.4 2.6C6.27859 2.41565 6.11332 2.26432 5.919 2.1596C5.72468 2.05488 5.50741 2.00004 5.28667 2H2.66667C2.31304 2 1.97391 2.14048 1.72386 2.39052C1.47381 2.64057 1.33333 2.97971 1.33333 3.33333V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333Z";

/* ── Logo SVG ── */
function Logo() {
  return (
    <div className="h-[30px] overflow-clip relative shrink-0 w-[180px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 180 30">
        <path d={svgPaths.p2badec00} fill="var(--sidebar-primary)" />
        <path d={svgPaths.p1a0b7800} fill="var(--sidebar-primary)" />
        <path clipRule="evenodd" d={svgPaths.p27195800} fill="var(--sidebar-primary)" fillRule="evenodd" />
        <path d={svgPaths.p13614280} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p11015500} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p1f84c200} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p3c365b00} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p10e82600} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.pc3be80} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p1b650100} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p2868a650} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p284dfb60} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p1bf24200} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p3f098bc0} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p27b8300} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p2a7a24b0} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p13ca3e70} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.padf6a00} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p4d43600} fill="var(--sidebar-foreground)" />
        <path d={svgPaths.p81b6100} fill="var(--sidebar-foreground)" />
      </svg>
    </div>
  );
}

/* ── Create Folder Dialog ── */
const folderColors = [
  { id: "blue", color: "#3B82F6" }, { id: "green", color: "#22C55E" }, { id: "amber", color: "#F59E0B" }, { id: "red", color: "#EF4444" },
  { id: "purple", color: "#8B5CF6" }, { id: "pink", color: "#EC4899" }, { id: "cyan", color: "#06B6D4" }, { id: "gray", color: "#6B7280" },
];

function CreateFolderDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setName(""); setSelectedColor("#3B82F6"); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[16px] w-[400px] overflow-hidden bg-popover shadow-md">
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 className="text-[17px] font-semibold text-foreground">Create New Folder</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-[28px] rounded-full"><svg className="size-[16px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></Button>
        </div>
        <div className="px-[24px] pt-[18px] pb-[8px]">
          <Label className="block mb-[6px] text-[13px] font-medium text-foreground">Folder name</Label>
          <Input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } if (e.key === "Escape") onClose(); }} placeholder="e.g. Client Meetings" className="w-full h-[40px] px-[14px] rounded-[12px] text-[14px]" />
          <Label className="block mt-[18px] mb-[8px] text-[13px] font-medium text-foreground">Color</Label>
          <div className="flex items-center gap-[8px]">
            {folderColors.map((fc) => (
              <Button variant="ghost" key={fc.id} onClick={() => setSelectedColor(fc.color)} className="size-[28px] rounded-full p-0 hover:bg-transparent" style={{ backgroundColor: fc.color, boxShadow: selectedColor === fc.color ? `0 0 0 2px var(--popover), 0 0 0 4px ${fc.color}` : "none", transform: selectedColor === fc.color ? "scale(1.1)" : "scale(1)" }}>
                {selectedColor === fc.color && <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-[10px] mt-[20px] p-[12px] rounded-[12px] bg-secondary border border-border">
            <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={selectedColor} /></svg>
            <span className={`text-[14px] font-medium ${name.trim() ? "text-foreground" : "text-muted-foreground"}`}>{name.trim() || "Folder name"}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[18px] text-[13px]">Cancel</Button>
          <Button onClick={() => { if (name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } }} disabled={!name.trim()} className="h-[36px] px-[18px] rounded-full text-[13px]">Create Folder</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Profile menu dropdown ── */
function ProfileMenu({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLanguage();
  const { signOut, user } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const languages = LANGUAGES;

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => { setOpen(!open); setLangOpen(false); }}
        className="h-[51.188px] rounded-[12px] w-full cursor-pointer transition-colors hover:bg-sidebar-accent"
      >
        <div className="flex flex-row items-center size-full">
          <div className="flex gap-[8px] items-center p-[8px] size-full">
            <div className="relative rounded-full shrink-0 size-[34px]">
              <img alt="" className="absolute inset-0 size-full object-cover rounded-full" src={imgEllipse52} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-start">
              <p className="truncate w-full text-left text-[14px] font-medium leading-[19.6px] text-sidebar-foreground">{userName}</p>
              <p className="truncate w-full text-left text-[12px] font-normal leading-[15.6px] text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute left-[4px] bottom-[calc(100%+6px)] w-[236px] rounded-[12px] py-[6px] z-50 bg-popover border border-sidebar-border shadow-md">
          <div className="flex items-center gap-[10px] px-[14px] py-[8px] mb-[2px]">
            <img alt="" className="shrink-0 size-[32px] rounded-full object-cover" src={imgEllipse52} />
            <div className="flex flex-col min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{userName}</p>
              <p className="truncate text-[11px] font-normal text-muted-foreground">{t("profile.proPlan")}</p>
            </div>
          </div>
          <div className="h-px mx-[10px] my-[2px] bg-sidebar-border" />
          <Button variant="ghost" onClick={() => { setOpen(false); onNavigate("settings"); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] rounded-none justify-start hover:bg-sidebar-accent">
            <Icon icon={Settings} className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[13px] font-normal text-sidebar-foreground">{t("profile.settings")}</span>
          </Button>
          <div className="relative">
            <Button variant="ghost" onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] rounded-none justify-start hover:bg-sidebar-accent">
              <Icon icon={Globe} className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <span className="flex-1 text-left text-[13px] font-normal text-sidebar-foreground">{t("profile.language")}</span>
              <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{languages.find((l) => l.code === lang)?.short}</span>
              <svg className={`size-[12px] shrink-0 text-muted-foreground transition-transform ${langOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 12 12"><path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Button>
            {langOpen && (
              <div className="absolute left-[calc(100%+4px)] bottom-0 w-[170px] rounded-[10px] py-[4px] z-50 bg-popover border border-sidebar-border shadow-md">
                {languages.map((l) => (
                  <Button variant="ghost" key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); setOpen(false); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] rounded-none justify-start hover:bg-sidebar-accent">
                    <span className="text-[11px] font-medium text-muted-foreground tracking-[0.3px]">{l.short}</span>
                    <span className={`flex-1 text-left text-[13px] ${lang === l.code ? "font-medium text-sidebar-primary" : "font-normal text-sidebar-foreground"}`}>{l.label}</span>
                    {lang === l.code && (<svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="var(--sidebar-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="h-px mx-[10px] my-[2px] bg-sidebar-border" />
          <Button variant="ghost" onClick={() => { setOpen(false); signOut(); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] rounded-none justify-start hover:bg-destructive/5">
            <Icon icon={LogOut} className="size-[16px] shrink-0 text-destructive" strokeWidth={1.5} />
            <span className="text-[13px] font-normal text-destructive">{t("profile.logOut")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Navigation items ── */
const NAV_ITEMS = [
  { id: "dashboard", labelKey: "nav.home", icon: House },
  { id: "records", labelKey: "nav.myRecords", icon: FileText },
  { id: "shared", labelKey: "nav.sharedWithMe", icon: UserMultiple02Icon },
  { id: "calendar", labelKey: "nav.calendar", icon: Calendar },
  { id: "templates", labelKey: "nav.templates", icon: Layers },
] as const;

export function AppSidebar({ activePage, onNavigate, onOpenFolder }: AppSidebarProps) {
  const [starredOpen, setStarredOpen] = useState(true);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const { starredRecords } = useStarred();
  const { folders: userFolders, addFolder } = useFolders();
  const { t } = useLanguage();
  const { toggleSidebar } = useSidebar();

  const defaultFolders: { id: string; name: string; color: string }[] = [
    { id: "f1", name: "Client Meetings", color: "#3B82F6" },
    { id: "f2", name: "Internal Syncs", color: "#22C55E" },
    { id: "f3", name: "Product Demos", color: "#F59E0B" },
  ];
  const folders = userFolders.length > 0 ? userFolders : defaultFolders;

  return (
    <Sidebar collapsible="icon">
      {/* ═══════════ Header: Logo ═══════════ */}
      <SidebarHeader className="h-[56px] justify-center px-[16px]">
        <Logo />
      </SidebarHeader>

      {/* ═══════════ Content ═══════════ */}
      <SidebarContent>
        {/* ── Primary Navigation ── */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map(({ id, labelKey, icon: NavIcon }) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  isActive={activePage === id}
                  onClick={() => onNavigate(id)}
                  tooltip={t(labelKey)}
                >
                  <Icon icon={NavIcon} strokeWidth={1.3} />
                  <span>{t(labelKey)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Starred ── */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer"
            onClick={() => setStarredOpen(!starredOpen)}
          >
            <span className="flex-1">{t("nav.starred")}</span>
            <div className={`transition-transform duration-200 ${starredOpen ? "rotate-90" : ""}`}>
              <Icon icon={ChevronRight} className="size-4" strokeWidth={1.5} />
            </div>
          </SidebarGroupLabel>
          {starredOpen && (
            <SidebarMenuSub>
              {starredRecords.length === 0 ? (
                <p className="px-2 py-1 text-[13px] text-muted-foreground italic">{t("nav.noStarred")}</p>
              ) : (
                starredRecords.map((record) => (
                  <SidebarMenuSubItem key={record.id}>
                    <SidebarMenuSubButton>
                      <SourceIcon source={record.source} />
                      <span>{record.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))
              )}
            </SidebarMenuSub>
          )}
        </SidebarGroup>

        {/* ── Folders ── */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer"
            onClick={() => setFoldersOpen(!foldersOpen)}
          >
            <span className="flex-1">{t("nav.folders")}</span>
            <div className="flex items-center gap-2">
            <button
              title="New folder"
              onClick={(e) => { e.stopPropagation(); setFolderDialogOpen(true); }}
              className="flex items-center justify-center rounded-md p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            >
              <Icon icon={Plus} className="size-4" strokeWidth={1.33} />
            </button>
            <div className={`transition-transform duration-200 ${foldersOpen ? "rotate-90" : ""}`}>
              <Icon icon={ChevronRight} className="size-4" strokeWidth={1.5} />
            </div>
            </div>
          </SidebarGroupLabel>
          {foldersOpen && (
            <SidebarMenuSub>
              {folders.map((folder) => (
                <SidebarMenuSubItem key={folder.id}>
                  <SidebarMenuSubButton
                    onClick={userFolders.length > 0 ? () => { onNavigate("records"); onOpenFolder?.(folder.id); } : undefined}
                    className={userFolders.length > 0 ? "cursor-pointer" : ""}
                  >
                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 16 16">
                      <path d={FOLDER_PATH} fill={folder.color} />
                    </svg>
                    <span>{folder.name}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* ═══════════ Footer ═══════════ */}
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activePage === "integrations"}
              onClick={() => onNavigate("integrations")}
              tooltip={t("nav.integrations")}
            >
              <Icon icon={Puzzle} strokeWidth={1.3} />
              <span>{t("nav.integrations")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} tooltip="Collapse">
              <Icon icon={ChevronsLeft} strokeWidth={1.3} />
              <span>Collapse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Create Folder Dialog */}
      <CreateFolderDialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} onCreate={(name, color) => addFolder(name, color)} />
    </Sidebar>
  );
}
