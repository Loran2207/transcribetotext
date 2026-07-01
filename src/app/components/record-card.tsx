import { useState } from "react";
import { useNavigate } from "react-router";
import { Clock, MoreHorizontal, Copy, FolderOpen, Upload, Share, Edit, StarIcon, Trash, X } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useIsMobile } from "./ui/use-mobile";
import { Drawer, DrawerContent, DrawerTitle } from "./ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
import { SourceIcon } from "./source-icons";
import { useStarred } from "./starred-context";
import { useFolders } from "./folder-context";
import { useLanguage } from "./language-context";
import { ShareDialog } from "./share-dialog";
import { ExportDialog } from "./export-dialog";
import { LanguageBadge, MoveToFolderDialog, recordRowToExportable, type RecordRow } from "./records-table";

/* A single recording rendered as a card (mobile + tablet replacement for the
   desktop records table). The whole card opens the transcript; the kebab
   exposes the same per-record actions the desktop table offers. Below md
   (<768) the kebab opens a bottom-sheet Drawer (action grid + list, Notta
   style); on tablet (768-1023) it opens a shadcn DropdownMenu. Both surfaces
   share one action set and one set of lazily mounted dialogs, so a long list
   never renders N dialog copies. Meta row mirrors the desktop table columns
   (duration, template, language). */

/* Small controlled rename form. Re-mounted on each open, so it always starts
   from the current record name. */
function RenameForm({ initial, onSave, onCancel }: { initial: string; onSave: (name: string) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [text, setText] = useState(initial);
  const trimmed = text.trim();
  return (
    <>
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && trimmed) onSave(trimmed); }}
        className="h-[42px] rounded-[12px]"
      />
      <DialogFooter>
        <Button variant="pill-outline" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button onClick={() => { if (trimmed) onSave(trimmed); }} disabled={!trimmed}>{t("common.rename")}</Button>
      </DialogFooter>
    </>
  );
}

export function RecordCard({ record }: { record: RecordRow }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { starred, toggleStar, renameRecord, getName } = useStarred();
  const { folders, assignToFolder } = useFolders();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isStarred = starred.has(record.id);
  const displayName = getName(record.id, record.name);
  const open = () => navigate(`/transcriptions/${record.id}`);

  const doStar = () =>
    toggleStar(record.id, {
      id: record.id,
      name: displayName,
      iconColor: record.iconColor,
      iconType: record.iconType,
      source: record.source,
    });

  const doCopy = () => {
    navigator.clipboard.writeText(record.summary).then(
      () => toast.success(t("common.copied")),
      () => toast.error("Copy failed"),
    );
  };

  const starLabel = isStarred ? t("common.unstar") : t("common.star");
  const starIconClass = isStarred ? "text-amber-500" : "text-muted-foreground";

  return (
    <div
      onClick={open}
      className="group flex items-start gap-[12px] px-[14px] py-[12px] rounded-[16px] bg-card border border-border/60 active:bg-muted/60 transition-colors cursor-pointer"
    >
      <div className="shrink-0 mt-[1px] flex items-center justify-center size-[40px] rounded-[12px] bg-muted">
        <SourceIcon source={record.source} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <p className="truncate text-foreground" style={{ fontWeight: 600, fontSize: 14, lineHeight: "19px" }}>{displayName}</p>
        <div className="flex items-center gap-[8px] mt-[3px] text-muted-foreground" style={{ fontSize: 11.5 }}>
          <span className="inline-flex items-center gap-[4px] shrink-0 whitespace-nowrap">
            <Icon icon={Clock} className="size-[12px]" strokeWidth={1.7} />
            {record.duration}
          </span>
          <span className="min-w-0 inline-flex items-center h-[18px] px-[7px] rounded-[5px] bg-muted">
            <span className="truncate text-[11px]">{record.template}</span>
          </span>
          <span className="shrink-0 leading-none">
            <LanguageBadge lang={record.language} />
          </span>
        </div>
      </div>

      {/* Wrapper stops the click bubbling to the card */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0 -mr-[4px]">
        {isMobile ? (
          <Button variant="ghost" size="icon" onClick={() => setSheetOpen(true)} className="size-[32px] text-muted-foreground" aria-label="Record actions">
            <Icon icon={MoreHorizontal} className="size-[18px]" strokeWidth={1.8} />
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-[32px] text-muted-foreground" aria-label="Record actions">
                <Icon icon={MoreHorizontal} className="size-[18px]" strokeWidth={1.8} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[210px]">
              <DropdownMenuItem className="gap-2" onSelect={doCopy}>
                <Icon icon={Copy} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                {t("table.copySummary")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onSelect={() => setMoveOpen(true)}>
                <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                {t("table.moveToFolder")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onSelect={() => setExportOpen(true)}>
                <Icon icon={Upload} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                {t("common.export")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onSelect={() => setShareOpen(true)}>
                <Icon icon={Share} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                {t("common.share")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onSelect={() => setRenameOpen(true)}>
                <Icon icon={Edit} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                {t("common.rename")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onSelect={doStar}>
                <Icon icon={StarIcon} className={`size-4 ${starIconClass}`} fill={isStarred ? "currentColor" : "none"} strokeWidth={1.6} />
                {starLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="gap-2" onSelect={() => setConfirmDelete(true)}>
                <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
                {t("table.moveToTrash")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Mobile bottom sheet - same action set as the tablet dropdown */}
        <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
          <DrawerContent className="[&>div:first-child]:hidden">
            <div className="flex items-center gap-[10px] px-[18px] pt-[18px] pb-[10px]">
              <div className="shrink-0 flex items-center justify-center size-[36px] rounded-[10px] bg-muted">
                <SourceIcon source={record.source} />
              </div>
              <DrawerTitle className="flex-1 min-w-0 truncate" style={{ fontSize: 15, fontWeight: 600 }}>{displayName}</DrawerTitle>
              <button onClick={() => setSheetOpen(false)} aria-label="Close" className="-mr-[4px] size-[32px] rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Icon icon={X} className="size-[18px]" strokeWidth={2} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-[8px] px-[16px] pt-[6px] pb-[14px]">
              {[
                { key: "copy", icon: Copy, label: t("table.copySummary"), run: doCopy },
                { key: "move", icon: FolderOpen, label: t("table.moveToFolder"), run: () => setMoveOpen(true) },
                { key: "export", icon: Upload, label: t("common.export"), run: () => setExportOpen(true) },
                { key: "share", icon: Share, label: t("common.share"), run: () => setShareOpen(true) },
              ].map(({ key, icon, label, run }) => (
                <button
                  key={key}
                  onClick={() => { setSheetOpen(false); run(); }}
                  className="flex flex-col items-center gap-[7px] py-[12px] rounded-[14px] bg-muted active:bg-muted/70 transition-colors"
                >
                  <span className="flex items-center justify-center size-[40px] rounded-full bg-background">
                    <Icon icon={icon} className="size-[19px] text-foreground" strokeWidth={1.7} />
                  </span>
                  <span className="text-[11px] leading-[13px] text-muted-foreground text-center px-[2px]">{label}</span>
                </button>
              ))}
            </div>

            <div className="h-px mx-[16px] bg-border" />

            <div className="px-[10px] py-[8px] flex flex-col" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
              <button onClick={() => { setSheetOpen(false); setRenameOpen(true); }} className="flex items-center gap-[13px] h-[50px] px-[12px] rounded-[12px] active:bg-muted transition-colors text-left">
                <Icon icon={Edit} className="size-[19px] text-muted-foreground" strokeWidth={1.7} />
                <span className="flex-1 text-foreground" style={{ fontSize: 14, fontWeight: 500 }}>{t("common.rename")}</span>
              </button>
              <button onClick={() => { setSheetOpen(false); doStar(); }} className="flex items-center gap-[13px] h-[50px] px-[12px] rounded-[12px] active:bg-muted transition-colors text-left">
                <Icon icon={StarIcon} className={`size-[19px] ${starIconClass}`} fill={isStarred ? "currentColor" : "none"} strokeWidth={1.7} />
                <span className="flex-1 text-foreground" style={{ fontSize: 14, fontWeight: 500 }}>{starLabel}</span>
              </button>
              <button onClick={() => { setSheetOpen(false); setConfirmDelete(true); }} className="flex items-center gap-[13px] h-[50px] px-[12px] rounded-[12px] active:bg-destructive/10 transition-colors text-left">
                <Icon icon={Trash} className="size-[19px] text-destructive" strokeWidth={1.7} />
                <span className="flex-1 text-destructive" style={{ fontSize: 14, fontWeight: 500 }}>{t("table.moveToTrash")}</span>
              </button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Lazily mounted dialogs - only the currently open one exists in the tree */}
        {moveOpen && (
          <MoveToFolderDialog
            open
            count={1}
            folders={folders}
            onClose={() => setMoveOpen(false)}
            onMove={(folderId) => assignToFolder([record.id], folderId)}
            onCreateFolder={() => setMoveOpen(false)}
          />
        )}

        {exportOpen && (
          <ExportDialog
            open
            onClose={() => setExportOpen(false)}
            records={[recordRowToExportable(record)]}
            availableRecords={[recordRowToExportable(record)]}
          />
        )}

        {shareOpen && (
          <ShareDialog
            open
            onOpenChange={(o) => { if (!o) setShareOpen(false); }}
            resourceType="transcription"
            resourceId={record.id}
            resourceName={displayName}
          />
        )}

        {renameOpen && (
          <Dialog open onOpenChange={(o) => { if (!o) setRenameOpen(false); }}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>{t("common.rename")}</DialogTitle>
              </DialogHeader>
              <RenameForm
                initial={displayName}
                onSave={(name) => { renameRecord(record.id, name); setRenameOpen(false); }}
                onCancel={() => setRenameOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {confirmDelete && (
          <AlertDialog open onOpenChange={(o) => { if (!o) setConfirmDelete(false); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("table.moveToTrash")}?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{displayName}" will be moved to Trash.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => { toast("Moved to trash"); setConfirmDelete(false); }} className="bg-destructive text-white hover:bg-destructive/90">
                  {t("table.moveToTrash")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
