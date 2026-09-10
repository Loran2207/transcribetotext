import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFolders, type FolderItem } from "./folder-context";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";
import { RecordsTable, records as mockRecords, type RecordRow, SharedBadge, SHARED_FOLDER_IDS } from "./records-table";
import { ExportFormatSubMenu } from "./export-format-menu";
import { ScrollFade } from "./scroll-fade";
import { Drawer, DrawerContent, DrawerTitle } from "./ui/drawer";
import { setInnerScreen } from "./inner-screen";
import { setFabHidden } from "./fab-visibility";
import {
  exportRecords,
  type ExportableRecord,
  type ExportFormat,
} from "@/lib/export-formats";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Icon } from "./ui/icon";
import { FolderOpen, Edit, Trash, MoreHorizontal, Upload, ChevronDown, ChevronUp, Microphone, Link, Video, CloudUpload, FolderPlus, Share } from "@hugeicons/core-free-icons";
import { ShareDialog } from "./share-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/* ── Constants ── */

const FOLDER_PATH = "M13.3333 13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V5.33333C14.6667 4.97971 14.5262 4.64057 14.2761 4.39052C14.0261 4.14048 13.687 4 13.3333 4H8.06667C7.84368 4.00219 7.6237 3.94841 7.42687 3.84359C7.23004 3.73877 7.06264 3.58625 6.94 3.4L6.4 2.6C6.27859 2.41565 6.11332 2.26432 5.919 2.1596C5.72468 2.05488 5.50741 2.00004 5.28667 2H2.66667C2.31304 2 1.97391 2.14048 1.72386 2.39052C1.47381 2.64057 1.33333 2.97971 1.33333 3.33333V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333Z";

const FOLDER_COLORS = [
  { id: "blue", color: "#3B82F6" }, { id: "green", color: "#22C55E" }, { id: "amber", color: "#F59E0B" }, { id: "red", color: "#EF4444" },
  { id: "purple", color: "#8B5CF6" }, { id: "pink", color: "#EC4899" }, { id: "cyan", color: "#06B6D4" }, { id: "gray", color: "#6B7280" },
];

/* ── Helpers ── */

function FolderGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg style={{ width: size, height: size }} className="shrink-0" fill="none" viewBox="0 0 16 16">
      <path d={FOLDER_PATH} fill={color} />
    </svg>
  );
}

function findFolderPath(folders: FolderItem[], targetId: string): FolderItem[] {
  for (const folder of folders) {
    if (folder.id === targetId) return [folder];
    const childPath = findFolderPath(folder.children ?? [], targetId);
    if (childPath.length > 0) return [folder, ...childPath];
  }
  return [];
}

function buildFolderRecordCounts(folders: FolderItem[], assignments: Record<string, string>): Map<string, number> {
  const directCounts = new Map<string, number>();
  Object.values(assignments).forEach((folderId) => {
    directCounts.set(folderId, (directCounts.get(folderId) ?? 0) + 1);
  });
  const totalCounts = new Map<string, number>();
  function collect(folder: FolderItem): number {
    const ownCount = directCounts.get(folder.id) ?? 0;
    const childrenCount = (folder.children ?? []).reduce((sum, child) => sum + collect(child), 0);
    const total = ownCount + childrenCount;
    totalCounts.set(folder.id, total);
    return total;
  }
  folders.forEach((folder) => collect(folder));
  return totalCounts;
}

/** Flatten all folders into a list (excluding a given id and its descendants) */
function flattenFolders(folders: FolderItem[], excludeId?: string): FolderItem[] {
  const result: FolderItem[] = [];
  function walk(items: FolderItem[]) {
    for (const f of items) {
      if (f.id === excludeId) continue;
      result.push(f);
      if (f.children) walk(f.children);
    }
  }
  walk(folders);
  return result;
}

/* ── FolderFormDialog (create + edit) ── */

interface FolderFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** If provided, dialog is in "edit" mode */
  folder?: FolderItem;
  onSave: (name: string, color: string) => void;
  title: string;
  submitLabel: string;
}

function FolderFormDialog({ open, onClose, folder, onSave, title, submitLabel }: FolderFormDialogProps) {
  const [name, setName] = useState(folder?.name ?? "");
  const [color, setColor] = useState(folder?.color ?? "#3B82F6");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(folder?.name ?? "");
      setColor(folder?.color ?? "#3B82F6");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, folder?.id]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[400px] max-w-[calc(100vw-32px)] overflow-hidden bg-popover" style={{ boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 className="font-semibold text-[17px] text-foreground">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-[28px] rounded-full flex items-center justify-center">
            <svg className="size-[16px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </Button>
        </div>
        <div className="px-[24px] pt-[18px] pb-[8px]">
          <Label className="block font-medium text-[13px] text-foreground mb-[6px]">Name</Label>
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) { onSave(name.trim(), color); onClose(); }
              if (e.key === "Escape") onClose();
            }}
            placeholder="e.g. Client Meetings"
            className="w-full h-[40px] px-[14px] rounded-[12px] text-[14px]"
          />
          <Label className="block font-medium text-[13px] text-foreground mt-[18px] mb-[8px]">Color</Label>
          <div className="flex items-center gap-[8px]">
            {FOLDER_COLORS.map((fc) => (
              <Button
                variant="ghost" size="icon" key={fc.id}
                onClick={() => setColor(fc.color)}
                className="size-[28px] rounded-full flex items-center justify-center transition-all"
                style={{ backgroundColor: fc.color, boxShadow: color === fc.color ? `0 0 0 2px var(--popover), 0 0 0 4px ${fc.color}` : "none", transform: color === fc.color ? "scale(1.1)" : "scale(1)" }}
              >
                {color === fc.color && <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-[10px] mt-[20px] p-[12px] rounded-[12px] bg-secondary border border-border">
            <FolderGlyph color={color} size={22} />
            <span className={`font-medium text-[14px] ${name.trim() ? "text-foreground" : "text-muted-foreground"}`}>{name.trim() || "Folder name"}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[18px]">
            <span className="font-medium text-[13px] text-foreground">Cancel</span>
          </Button>
          <Button onClick={() => { if (name.trim()) { onSave(name.trim(), color); onClose(); } }} disabled={!name.trim()} className="h-[36px] px-[18px] rounded-full bg-primary text-white disabled:opacity-40">
            <span className="font-medium text-[13px]">{submitLabel}</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── MoveFolderDialog ── */

function MoveFolderDialog({ open, onClose, movingFolder, allFolders, onMove }: {
  open: boolean;
  onClose: () => void;
  movingFolder: FolderItem | null;
  allFolders: FolderItem[];
  onMove: (targetId: string | null) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { if (open) setSelectedId(null); }, [open]);

  if (!open || !movingFolder) return null;

  const available = flattenFolders(allFolders, movingFolder.id);

  function handleMove() {
    onMove(selectedId);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[360px] max-w-[calc(100vw-32px)] overflow-hidden bg-popover" style={{ boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 className="font-semibold text-[17px] text-foreground">Move to folder</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-[28px] rounded-full">
            <svg className="size-[16px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </Button>
        </div>
        <div className="px-[8px] py-[8px] max-h-[300px] overflow-y-auto">
          {/* Root option */}
          <Button
            variant="ghost"
            onClick={() => setSelectedId(null)}
            className={`flex items-center gap-[10px] w-full h-[38px] rounded-[8px] px-[12px] justify-start transition-colors ${selectedId === null ? "bg-primary/5" : "hover:bg-accent"}`}
          >
            <svg className="size-[18px] text-muted-foreground shrink-0" fill="none" viewBox="0 0 16 16">
              <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
              <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            <span className={`flex-1 text-left text-[13.5px] ${selectedId === null ? "font-medium text-primary" : "text-foreground"}`}>My Records (root)</span>
            {selectedId === null && <svg className="size-[15px] text-primary shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </Button>
          {available.map((f) => (
            <Button
              key={f.id}
              variant="ghost"
              onClick={() => setSelectedId(f.id)}
              className={`flex items-center gap-[10px] w-full h-[38px] rounded-[8px] px-[12px] justify-start transition-colors ${selectedId === f.id ? "bg-primary/5" : "hover:bg-accent"}`}
            >
              <FolderGlyph color={f.color} size={18} />
              <span className={`flex-1 text-left truncate text-[13.5px] ${selectedId === f.id ? "font-medium text-primary" : "text-foreground"}`}>{f.name}</span>
              {selectedId === f.id && <svg className="size-[15px] text-primary shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </Button>
          ))}
          {available.length === 0 && (
            <p className="px-[12px] py-[8px] text-[13px] text-muted-foreground">No other folders available.</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[16px] border-t border-border">
          <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[18px]">
            <span className="font-medium text-[13px] text-foreground">Cancel</span>
          </Button>
          <Button onClick={handleMove} className="h-[36px] px-[18px] rounded-full bg-primary text-white">
            <span className="font-medium text-[13px]">Move here</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}



/* ── MyRecordsPage ── */

export function MyRecordsPage({ initialFolderId, onFolderConsumed }: { initialFolderId?: string | null; onFolderConsumed?: () => void } = {}) {
  const { t } = useLanguage();
  const { folders, folderAssignments, addFolder, deleteFolder, renameFolder, changeFolderColor, moveFolder } = useFolders();
  // Demo: ttt_demo_records=loading -> skeleton the folder cards too (matches the table skeleton)
  const demoRecordsLoading = typeof window !== "undefined" && window.localStorage.getItem("ttt_demo_records") === "loading";
  const { setOpenModal, openUploadWithFiles, setDefaultFolderId } = useTranscriptionModals();

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  // Create folder dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [folderAddOpen, setFolderAddOpen] = useState(false);
  const [folderActionsOpen, setFolderActionsOpen] = useState(false);
  // If set, after creating a new folder we move this folder ID into it
  const [moveAfterCreate, setMoveAfterCreate] = useState<string | null>(null);

  // Edit folder dialog (name + color)
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);

  // Move folder dialog
  const [movingFolder, setMovingFolder] = useState<FolderItem | null>(null);

  /* A folder can be shared, so every place that lists a folder's actions has to
     offer it - the card, the folder you have open, and the phone sheet. */
  const [sharingFolder, setSharingFolder] = useState<FolderItem | null>(null);

  // Drag & drop state
  const [dragOver, setDragOver] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(false);
  const FOLDER_ROW_LIMIT = 6; // one row of cards; more folders collapse behind Show all
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) {
      if (activeFolderId) setDefaultFolderId(activeFolderId);
      openUploadWithFiles(dropped);
    }
  }, [activeFolderId, openUploadWithFiles, setDefaultFolderId]);

  /** Open a modal with the current folder pre-selected */
  const openModalInFolder = useCallback((modal: "upload" | "record" | "link" | "meeting") => {
    if (activeFolderId) setDefaultFolderId(activeFolderId);
    setOpenModal(modal);
  }, [activeFolderId, setDefaultFolderId, setOpenModal]);

  // Consume initialFolderId from dashboard navigation
  useEffect(() => {
    if (initialFolderId) {
      setActiveFolderId(initialFolderId);
      onFolderConsumed?.();
    }
  }, [initialFolderId]);

  const activeFolderPath = useMemo(
    () => (activeFolderId ? findFolderPath(folders, activeFolderId) : []),
    [activeFolderId, folders],
  );

  useEffect(() => {
    if (activeFolderId && activeFolderPath.length === 0) setActiveFolderId(null);
  }, [activeFolderId, activeFolderPath]);

  const activeFolder = activeFolderPath.length > 0 ? activeFolderPath[activeFolderPath.length - 1] : null;
  const visibleFolders = activeFolder ? activeFolder.children ?? [] : folders;
  const isInsideFolder = activeFolderPath.length > 0;

  const folderRecordCounts = useMemo(
    () => buildFolderRecordCounts(folders, folderAssignments),
    [folders, folderAssignments],
  );

  function recordToExportable(record: RecordRow): ExportableRecord {
    return {
      id: record.id,
      title: record.name,
      summary: record.summary,
      segments: [],
      metadata: {
        date: record.dateCreated,
        duration: record.duration,
        source: record.source,
        language: record.language,
      },
    };
  }

  function exportFolder(folderId: string, format: ExportFormat) {
    const recordsInFolder = mockRecords.filter(
      (r) => folderAssignments[r.id] === folderId,
    );
    if (!recordsInFolder.length) {
      toast.error("This folder has no records to export");
      return;
    }
    try {
      exportRecords(recordsInFolder.map(recordToExportable), format);
      toast.success(
        `Exported ${recordsInFolder.length} record${recordsInFolder.length === 1 ? "" : "s"} as ${format.toUpperCase()}`,
      );
    } catch {
      toast.error("Export failed");
    }
  }

  const pageScrollRef = useRef<HTMLDivElement>(null);

  /* Hide the floating "+" while the pagination bar (list bottom) is in view so it never overlaps. */
  useEffect(() => {
    const el = pageScrollRef.current;
    if (!el) return;
    const check = () => setFabHidden(el.scrollHeight - el.scrollTop - el.clientHeight < 96 && el.scrollHeight > el.clientHeight + 40);
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => { el.removeEventListener("scroll", check); setFabHidden(false); };
  }, [activeFolderId]);

  /* Phone chrome: inside a folder the top bar becomes back + "My Records / <name>"
     with the folder kebab on the right; the wrapping desktop header hides below md. */
  useEffect(() => {
    if (!activeFolder) { setInnerScreen(null); return; }
    // Max nesting is two levels (folder in folder). The top bar shows the immediate
    // parent + current folder ("Client Calls / Q2 notes" when nested, "My Records /
    // Client Calls" at the top level); back climbs ONE level. The folder "..." moved
    // to the bottom bar (next to Add file) since it acts on the whole folder.
    const parentFolder = activeFolderPath.length > 1 ? activeFolderPath[activeFolderPath.length - 2] : null;
    setInnerScreen({
      back: () => setActiveFolderId(parentFolder ? parentFolder.id : null),
      parent: parentFolder ? parentFolder.name : t("nav.myRecords"),
      title: activeFolder.name,
      hideNav: true,
      bottomBar: (
        <div className="flex items-center gap-[10px]">
          <Button variant="pill-outline" onClick={() => setFolderAddOpen(true)} className="flex-1 h-[46px] rounded-full text-[14px] font-semibold gap-[8px] text-foreground">
            <Icon icon={CloudUpload} className="size-[17px] text-foreground" strokeWidth={1.7} />
            Add file
          </Button>
          <Button variant="pill-outline" size="icon" onClick={() => setFolderActionsOpen(true)} className="size-[46px] shrink-0 text-foreground" aria-label="Folder actions">
            <Icon icon={MoreHorizontal} className="size-5" strokeWidth={2} />
          </Button>
        </div>
      ),
    });
    return () => setInnerScreen(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder]);

  return (
    <div
      ref={pageScrollRef}
      className={`flex-1 overflow-auto min-w-0 relative ${dragOver ? "bg-primary/[0.04]" : ""}`}
      style={{ transition: "background-color 0.15s ease" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ScrollFade scrollRef={pageScrollRef} />
      {/* Drag-over border highlight */}
      {dragOver && (
        <div
          className="absolute inset-0 pointer-events-none z-40 border-2 border-dashed border-primary"
          style={{ inset: "6px", borderRadius: "12px" }}
        />
      )}

      <div className="px-[16px] pt-[16px] pb-[24px] md:px-[24px] md:pt-[20px] lg:px-[32px] lg:pt-[28px]">

        {/* Header row (phones hide it inside a folder - the inner top bar takes over) */}
        <div className={`flex items-center justify-between gap-[12px] ${isInsideFolder ? "max-md:hidden" : ""}`}>
          {isInsideFolder ? (
            <Breadcrumb>
              <BreadcrumbList className="text-[13px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={() => setActiveFolderId(null)}>
                      {t("nav.myRecords")}
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {activeFolderPath.map((folder, index) => {
                  const isLast = index === activeFolderPath.length - 1;
                  return (
                    <Fragment key={folder.id}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <button type="button" onClick={() => setActiveFolderId(folder.id)}>
                              {folder.name}
                            </button>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <p
              className="text-foreground font-bold text-[20px] leading-[26px] tracking-[-0.3px] lg:text-[28px] lg:leading-[33.6px] lg:tracking-[-0.56px] lg:whitespace-nowrap"
            >
              {t("nav.myRecords")}
            </p>
          )}

          {/* Header right actions */}
          <div className="flex items-center gap-[8px]">
            {isInsideFolder && activeFolder && (
              <Button
                onClick={() => setEditingFolder(activeFolder)}
                className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <svg className="size-[14px]" fill="none" viewBox="0 0 16 16"><path d="M11.333 2a1.886 1.886 0 012.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="font-medium text-[13px]">Edit folder</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="pill-outline"
                  className="max-lg:hidden flex items-center gap-[7px] h-9 px-[16px] shrink-0 transition-colors cursor-pointer"
                >
                  <Icon icon={CloudUpload} className="size-[15px] text-foreground" strokeWidth={1.5} />
                  <span className="font-medium text-[13px] text-foreground">Upload</span>
                  <Icon icon={ChevronDown} className="size-[14px] text-muted-foreground -ml-[2px]" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="w-[200px]">
                <DropdownMenuItem className="gap-2" onClick={() => openModalInFolder("upload")}>
                  <Icon icon={Upload} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Audio & video files
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => openModalInFolder("record")}>
                  <Icon icon={Microphone} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Instant speech
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => openModalInFolder("link")}>
                  <Icon icon={Link} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Transcribe from link
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => openModalInFolder("meeting")}>
                  <Icon icon={Video} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  Record meeting
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="pill-outline"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 transition-colors cursor-pointer"
            >
              <Icon icon={FolderPlus} className="size-[14px] text-foreground" strokeWidth={1.5} />
              <span className="font-medium text-[13px] text-foreground">{t("folder.addFolder")}</span>
            </Button>
            {isInsideFolder && activeFolder && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Folder actions"
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <Icon icon={MoreHorizontal} className="size-4" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-[180px]">
                  <DropdownMenuItem className="gap-2" onClick={() => setEditingFolder(activeFolder)}>
                    <Icon icon={Edit} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                      <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                      Move to folder
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[210px]">
                      <DropdownMenuItem className="gap-2" onClick={() => moveFolder(activeFolder.id, null)}>
                        <svg className="size-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.1" /></svg>
                        <span className="truncate">My Records (root)</span>
                      </DropdownMenuItem>
                      {flattenFolders(folders, activeFolder.id).map((f) => (
                        <DropdownMenuItem key={f.id} className="gap-2" onClick={() => moveFolder(activeFolder.id, f.id)}>
                          <svg className="size-4 shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={f.color} /></svg>
                          <span className="truncate">{f.name}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2" onClick={() => { setMoveAfterCreate(activeFolder.id); setCreateOpen(true); }}>
                        <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                        Create folder and move
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <ExportFormatSubMenu
                    triggerLabel={`Export files (${folderRecordCounts.get(activeFolder.id) ?? 0})`}
                    onSelect={(format) => exportFolder(activeFolder.id, format)}
                  />
                  <DropdownMenuItem className="gap-2" onClick={() => setSharingFolder(activeFolder)}>
                    <Icon icon={Share} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                    Share folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => setDeletingFolderId(activeFolder.id)}>
                    <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
                    Delete folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Folder cards grid */}
        <div className={isInsideFolder ? "max-md:mt-0 mt-[16px]" : "mt-[24px] max-lg:mt-[16px]"}>
          <div className="hidden lg:block">
          {demoRecordsLoading && (
            <div className="mb-[20px]">
              <div className="mb-[8px] h-[14px] w-[56px] rounded-full bg-muted animate-pulse" />
              <div className="grid gap-[12px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))" }}>
                {Array.from({ length: 6 }).map((_, i) => (<div key={"folderskel" + i} className="h-[64px] rounded-[16px] bg-muted animate-pulse" />))}
              </div>
            </div>
          )}
          {!demoRecordsLoading && visibleFolders.length > 0 && (
            <div className="mb-[20px]">
            {visibleFolders.length > FOLDER_ROW_LIMIT && (
              <div className="mb-[8px] flex items-center justify-between">
                <p className="text-[12px] font-medium text-muted-foreground">Folders</p>
                <button
                  type="button"
                  onClick={() => setFoldersExpanded(!foldersExpanded)}
                  className="flex items-center gap-[4px] rounded-full px-[10px] h-[26px] text-[12.5px] font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  {foldersExpanded ? "Show less" : `Show all (${visibleFolders.length})`}
                  <Icon icon={foldersExpanded ? ChevronUp : ChevronDown} className="size-[13px]" strokeWidth={1.8} />
                </button>
              </div>
            )}
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))" }}>
              {(foldersExpanded ? visibleFolders : visibleFolders.slice(0, FOLDER_ROW_LIMIT)).map((folder) => {
                const recordsCount = folderRecordCounts.get(folder.id) ?? 0;
                const recordsLabel = recordsCount === 1 ? "file" : "files";
                return (
                  <div
                    key={folder.id}
                    className="group relative rounded-[16px] bg-muted px-[12px] py-[12px] cursor-pointer transition-colors hover:bg-accent/70"
                    onDoubleClick={() => setActiveFolderId(folder.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setActiveFolderId(folder.id);
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open folder ${folder.name}`}
                  >
                    <div className="flex items-center justify-between gap-[8px]">
                      <div className="min-w-0 flex items-center gap-[10px] flex-1">
                        <FolderGlyph color={folder.color} size={22} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-foreground leading-tight">{folder.name}</p>
                          {SHARED_FOLDER_IDS.has(folder.id) && (
                            /* The same mark a record row carries: this one is
                               open to more than you. */
                            <span className="mt-[3px] inline-flex"><SharedBadge /></span>
                          )}
                          <p className="text-[12px] text-muted-foreground leading-tight mt-[2px]">
                            {recordsCount} {recordsLabel}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                          onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                          className="flex size-[28px] shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-accent hover:text-foreground transition-colors"
                          aria-label="Folder actions"
                        >
                          <svg className="size-[14px]" fill="none" viewBox="0 0 16 16">
                            <circle cx="8" cy="3" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                          </svg>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6} className="w-[170px]">
                          <DropdownMenuItem className="gap-2" onClick={() => setActiveFolderId(folder.id)}>
                            <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                            Open folder
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => setEditingFolder(folder)}>
                            <Icon icon={Edit} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                              <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                              Move to folder
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-[210px]">
                              <DropdownMenuItem className="gap-2" onClick={() => moveFolder(folder.id, null)}>
                                <svg className="size-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1" /><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.1" /></svg>
                                <span className="truncate">My Records (root)</span>
                              </DropdownMenuItem>
                              {flattenFolders(folders, folder.id).map((f) => (
                                <DropdownMenuItem key={f.id} className="gap-2" onClick={() => moveFolder(folder.id, f.id)}>
                                  <svg className="size-4 shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={f.color} /></svg>
                                  <span className="truncate">{f.name}</span>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2" onClick={() => { setMoveAfterCreate(folder.id); setCreateOpen(true); }}>
                                <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                                Create folder and move
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem className="gap-2" onClick={() => setSharingFolder(folder)}>
                            <Icon icon={Share} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                            Share folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => setDeletingFolderId(folder.id)}>
                            <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}

          </div>

          <RecordsTable hideTopHeader showAddFolderButton={false} surface="records" scopedFolderId={activeFolderId} onOpenFolder={(folderId) => setActiveFolderId(folderId)} />
        </div>
      </div>

      {/* Create folder dialog */}
      <FolderFormDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setMoveAfterCreate(null); }}
        title={t("folder.createNew")}
        submitLabel={t("folder.create")}
        onSave={(name, color) => {
          const parentId = moveAfterCreate ? null : (activeFolderId ?? null);
          const newFolder = addFolder(name, color, parentId);
          if (moveAfterCreate) {
            moveFolder(moveAfterCreate, newFolder.id);
            setMoveAfterCreate(null);
          }
        }}
      />

      <ShareDialog
        open={!!sharingFolder}
        onOpenChange={(open) => { if (!open) setSharingFolder(null); }}
        resourceType="folder"
        resourceId={sharingFolder?.id ?? ""}
        resourceName={sharingFolder?.name ?? ""}
      />

      {/* Folder actions sheet (opened from the "..." in the bottom bar) - acts on the whole folder */}
      <Drawer open={folderActionsOpen} onOpenChange={setFolderActionsOpen}>
        <DrawerContent className="[&>div:first-child]:hidden">
          <div className="flex items-center gap-[10px] px-[18px] pt-[18px] pb-[10px]">
            {activeFolder && <svg className="size-[22px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={FOLDER_PATH} fill={activeFolder.color} /></svg>}
            <DrawerTitle className="flex-1 min-w-0 truncate" style={{ fontSize: 15, fontWeight: 600 }}>{activeFolder?.name}</DrawerTitle>
          </div>
          <div className="px-[14px] pb-[calc(16px+env(safe-area-inset-bottom))] pt-[4px] flex flex-col">
            <button onClick={() => { setFolderActionsOpen(false); if (activeFolder) setEditingFolder(activeFolder); }} className="flex items-center gap-[13px] h-[52px] px-[12px] rounded-[12px] active:bg-muted transition-colors text-left">
              <Icon icon={Edit} className="size-[19px] text-muted-foreground" strokeWidth={1.7} />
              <span className="flex-1 text-foreground" style={{ fontSize: 14, fontWeight: 500 }}>Edit folder</span>
            </button>
            <button onClick={() => { setFolderActionsOpen(false); if (activeFolder) setSharingFolder(activeFolder); }} className="flex items-center gap-[13px] h-[52px] px-[12px] rounded-[12px] active:bg-muted transition-colors text-left">
              <Icon icon={Share} className="size-[19px] text-muted-foreground" strokeWidth={1.7} />
              <span className="flex-1 text-foreground" style={{ fontSize: 14, fontWeight: 500 }}>Share folder</span>
            </button>
            <button onClick={() => { setFolderActionsOpen(false); if (activeFolder) setDeletingFolderId(activeFolder.id); }} className="flex items-center gap-[13px] h-[52px] px-[12px] rounded-[12px] active:bg-destructive/10 transition-colors text-left">
              <Icon icon={Trash} className="size-[19px] text-destructive" strokeWidth={1.7} />
              <span className="flex-1 text-destructive" style={{ fontSize: 14, fontWeight: 500 }}>Delete folder</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Folder inner-screen: the pinned "Add file" bar opens these create options, scoped to the folder */}
      <Drawer open={folderAddOpen} onOpenChange={setFolderAddOpen}>
        <DrawerContent className="[&>div:first-child]:hidden">
          <div className="px-[18px] pt-[18px] pb-[10px]">
            <DrawerTitle style={{ fontSize: 18, fontWeight: 600 }}>Add file to folder</DrawerTitle>
          </div>
          <div className="px-[18px] pb-[24px] flex flex-col gap-[8px]">
            <button key="upload" onClick={() => { setFolderAddOpen(false); openModalInFolder("upload"); }} className="flex items-center gap-[14px] h-[56px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left">
              <span className="flex items-center justify-center size-[40px] rounded-full shrink-0" style={{ backgroundColor: "#ECEAFE", color: "#7C3AED" }}>
                <Icon icon={Upload} className="size-[20px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 truncate text-foreground" style={{ fontWeight: 500, fontSize: 14 }}>Audio & video files</span>
            </button>
            <button key="record" onClick={() => { setFolderAddOpen(false); openModalInFolder("record"); }} className="flex items-center gap-[14px] h-[56px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left">
              <span className="flex items-center justify-center size-[40px] rounded-full shrink-0" style={{ backgroundColor: "#E3F0FE", color: "#2563EB" }}>
                <Icon icon={Microphone} className="size-[20px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 truncate text-foreground" style={{ fontWeight: 500, fontSize: 14 }}>Instant speech</span>
            </button>
            <button key="meeting" onClick={() => { setFolderAddOpen(false); openModalInFolder("meeting"); }} className="flex items-center gap-[14px] h-[56px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left">
              <span className="flex items-center justify-center size-[40px] rounded-full shrink-0" style={{ backgroundColor: "#FFF1DC", color: "#D97706" }}>
                <Icon icon={Video} className="size-[20px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 truncate text-foreground" style={{ fontWeight: 500, fontSize: 14 }}>Meeting recorder</span>
            </button>
            <button key="link" onClick={() => { setFolderAddOpen(false); openModalInFolder("link"); }} className="flex items-center gap-[14px] h-[56px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left">
              <span className="flex items-center justify-center size-[40px] rounded-full shrink-0" style={{ backgroundColor: "#FEECEB", color: "#EF4444" }}>
                <Icon icon={Link} className="size-[20px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 truncate text-foreground" style={{ fontWeight: 500, fontSize: 14 }}>Transcribe from link</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit folder dialog */}
      <FolderFormDialog
        open={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        folder={editingFolder ?? undefined}
        title="Edit folder"
        submitLabel="Save"
        onSave={(name, color) => {
          if (!editingFolder) return;
          renameFolder(editingFolder.id, name);
          changeFolderColor(editingFolder.id, color);
        }}
      />

      {/* Move folder dialog */}
      <MoveFolderDialog
        open={!!movingFolder}
        onClose={() => setMovingFolder(null)}
        movingFolder={movingFolder}
        allFolders={folders}
        onMove={(targetId) => {
          if (!movingFolder) return;
          moveFolder(movingFolder.id, targetId);
          // If we moved the active folder out of view, reset
          if (movingFolder.id === activeFolderId || activeFolderPath.some(f => f.id === movingFolder.id)) {
            setActiveFolderId(null);
          }
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingFolderId} onOpenChange={(open) => { if (!open) setDeletingFolderId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder will be deleted. Files inside will not be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingFolderId) deleteFolder(deletingFolderId);
                setDeletingFolderId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drop zone pill - appears at bottom center while dragging */}
      {dragOver && (
        <div
          className="absolute bottom-[28px] left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: "dropPillIn 0.22s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <div
            className="flex items-center gap-[12px] px-[24px] py-[14px] rounded-full"
            style={{
              background: "#1d4ed8",
              boxShadow: "0 8px 32px rgba(29,78,216,0.45), 0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 0L8 8m4-4l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "white", letterSpacing: "-0.1px" }}>
              Drop files to transcribe
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropPillIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.92); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
        }
      `}</style>

    </div>
  );
}
