import { useState, useMemo } from "react";
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
import { SourceIcon, getSourceLabel } from "./source-icons";
import { ActionSheet, ActionSheetItem } from "./action-sheet";
import { getInitials } from "@/lib/format";
import { useStarred } from "./starred-context";
import { useFolders } from "./folder-context";
import { useLanguage } from "./language-context";
import { ShareDialog } from "./share-dialog";
import { ExportDialog } from "./export-dialog";
import { LanguageBadge, MoveToFolderDialog, recordRowToExportable, type RecordRow, FigmaCheckbox, INLINE_FOLDER_PATH, SharedBadge } from "./records-table";

/* A single recording rendered as a card (mobile + tablet replacement for the
   desktop records table). The whole card opens the transcript; the kebab
   exposes the same per-record actions the desktop table offers. Below lg the
   kebab opens the product's one ActionSheet; at lg and above (the desktop card
   view) it opens a shadcn DropdownMenu. Both surfaces
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

export interface CardOwner { name: string; tint: string; ink: string; avatar?: string }

/* `owner` marks the card as somebody else's. It shows who it came from and takes
   away every action that would change their record: sharing it on, renaming it,
   throwing it away. What is left is what a reader is allowed to do. */
export function RecordCard({ record, isTrash = false, selected = false, selectionMode = false, isShared = false, showOwner = true, onToggleSelect, owner, onRemoveShared }: { record: RecordRow; isTrash?: boolean; selected?: boolean; selectionMode?: boolean; isShared?: boolean; showOwner?: boolean; onToggleSelect?: () => void; owner?: CardOwner; onRemoveShared?: () => void }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { starred, toggleStar, renameRecord, getName } = useStarred();
  const { folders, assignToFolder, folderAssignments } = useFolders();

  /* Which folder this record sits in. The tree is shallow, so one walk is cheap. */
  const cardFolder = useMemo(() => {
    const target = folderAssignments[record.id];
    if (!target) return null;
    let found: { name: string; color: string } | null = null;
    const walk = (list: typeof folders) => list.forEach((f) => { if (f.id === target) found = f; walk(f.children ?? []); });
    walk(folders);
    return found as { name: string; color: string } | null;
  }, [folders, folderAssignments, record.id]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmForever, setConfirmForever] = useState(false);

  const isStarred = starred.has(record.id);
  const displayName = getName(record.id, record.name);
  const open = () => navigate(`/transcriptions/${record.id}`);
  const selectEnabled = !!onToggleSelect && !isTrash;
  const toggle = onToggleSelect ?? (() => {});

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

  const doRestore = () => toast.success("Restored to My Records");

  const starLabel = isStarred ? t("common.unstar") : t("common.star");
  const starIconClass = isStarred ? "text-amber-500" : "text-muted-foreground";

  return (
    <div
      onClick={() => { if (selectEnabled && selectionMode) toggle(); else open(); }}
      className={"group flex items-start gap-[10px] px-[14px] py-[12px] rounded-[16px] border transition-colors cursor-pointer " + (selected ? "bg-primary/[0.05] border-primary/40" : "bg-card border-border/60 active:bg-muted/60")}
    >
      {selectEnabled && (
        <div className="shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
          <FigmaCheckbox checked={selected} onChange={toggle} />
        </div>
      )}
      <div className="shrink-0 mt-[1px] flex items-center justify-center size-[40px] rounded-[12px] bg-muted">
        <SourceIcon source={record.source} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        {/* The same mark the desktop row carries. A card that drops it makes
            the phone say less about the object than the table does. It never
            shows on Shared with me, where the owner line already says who can
            see this and the mark would be a second answer to one question. */}
        <div className="flex min-w-0 items-center gap-[6px]">
          <p className="truncate text-foreground" style={{ fontWeight: 500, fontSize: 14, lineHeight: "19px" }}>{displayName}</p>
          {isShared && !owner && !isTrash && <SharedBadge />}
        </div>
        <div className="flex items-center gap-[8px] mt-[3px] text-muted-foreground" style={{ fontSize: 12, lineHeight: "16px" }}>
          <span className="inline-flex items-center gap-[4px] shrink-0 whitespace-nowrap">
            <Icon icon={Clock} className="size-[12px]" strokeWidth={1.7} />
            {record.duration}
          </span>
          <span className="min-w-0 inline-flex items-center h-[18px] px-[7px] rounded-[5px] bg-muted">
            <span className="truncate text-[12px]">{record.template}</span>
          </span>
          <span className="shrink-0 leading-none">
            <LanguageBadge lang={record.language} />
          </span>
          {cardFolder && !owner && (
            <span className="flex min-w-0 shrink-0 items-center gap-[5px]" title={cardFolder.name}>
              <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={INLINE_FOLDER_PATH} fill={cardFolder.color} /></svg>
              <span className="hidden truncate text-[12px] md:inline">{cardFolder.name}</span>
            </span>
          )}
        </div>
        {/* Whose record this is gets its own line. Squeezed onto the meta row it
            took the space the template needed, and the template collapsed to an
            ellipsis - so the card could not say what kind of note it was. The
            name stands alone: the page is called Shared with me, so a card that
            also said "shared this with you" said it for the eighth time and
            clipped the one word that mattered. */}
        {owner && showOwner && (
          <div className="mt-[4px] flex min-w-0 items-center gap-[5px] text-muted-foreground" style={{ fontSize: 12, lineHeight: "16px" }}>
            <span className="flex size-[16px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[8px] font-medium" style={{ background: owner.tint, color: owner.ink }}>
              {owner.avatar ? <img src={owner.avatar} alt="" className="size-full object-cover" /> : getInitials(owner.name)}
            </span>
            <span className="truncate">{owner.name}</span>
          </div>
        )}
      </div>

      {/* Wrapper stops the click bubbling to the card */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0 -mr-[4px] self-center">
        {isTrash ? (
          <div className="flex items-center gap-[6px]">
            <Button variant="pill-outline" onClick={doRestore} className="h-[30px] px-[11px] gap-[5px] text-[12.5px] font-medium">
              <svg className="size-[13px] text-foreground" fill="none" viewBox="0 0 16 16"><path d="M2 7.333A6 6 0 018 2a6 6 0 016 6 6 6 0 01-6 6 5.98 5.98 0 01-4.243-1.757" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 3.333v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {t("common.restore")}
            </Button>
            <Button variant="pill-outline" size="icon" onClick={() => setConfirmForever(true)} aria-label="Delete forever" className="size-[30px] border-destructive/30 text-destructive hover:bg-destructive/5">
              <Icon icon={Trash} className="size-[15px]" strokeWidth={1.7} />
            </Button>
            {confirmForever && (
              <AlertDialog open onOpenChange={(o) => { if (!o) setConfirmForever(false); }}>
                <AlertDialogContent>
                  <AlertDialogHeader className="text-left">
                    <AlertDialogTitle>Delete record forever?</AlertDialogTitle>
                    <AlertDialogDescription>"{displayName}" and its transcript will be permanently deleted. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row justify-end gap-[8px]">
                    <AlertDialogCancel className="px-[18px] text-[13px]">{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { toast.success("Record deleted forever"); setConfirmForever(false); }} className="px-[18px] text-[13px] font-semibold bg-destructive text-white hover:bg-destructive/90">Delete forever</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ) : (<>
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
              {!owner && (
                <DropdownMenuItem className="gap-2" onSelect={() => setShareOpen(true)}>
                  <Icon icon={Share} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                  {t("common.share")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {!owner && (
                <DropdownMenuItem className="gap-2" onSelect={() => setRenameOpen(true)}>
                  <Icon icon={Edit} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                  {t("common.rename")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2" onSelect={doStar}>
                <Icon icon={StarIcon} className={`size-4 ${starIconClass}`} fill={isStarred ? "currentColor" : "none"} strokeWidth={1.6} />
                {starLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {owner ? (
                <DropdownMenuItem className="gap-2" onSelect={() => onRemoveShared?.()}>
                  <Icon icon={X} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                  {t("shared.removeFromShared")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" className="gap-2" onSelect={() => setConfirmDelete(true)}>
                  <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
                  {t("table.moveToTrash")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* The record's actions, in the product's one sheet: the record at the
            top with its name and where it came from, then a plain list. The
            grid of four tiles that used to sit above the list is gone - the
            same four things are rows now, like everywhere else. */}
        <ActionSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          mark={<SourceIcon source={record.source} />}
          title={displayName}
          kind={getSourceLabel(record.source)}
        >
          <ActionSheetItem icon={Copy} label={t("sheet.copy")} onClick={() => { setSheetOpen(false); doCopy(); }} />
          <ActionSheetItem icon={FolderOpen} label={t("sheet.moveTo")} onClick={() => { setSheetOpen(false); setMoveOpen(true); }} />
          <ActionSheetItem icon={Upload} label={t("common.export")} onClick={() => { setSheetOpen(false); setExportOpen(true); }} />
          {!owner && (
            <ActionSheetItem icon={Share} label={t("common.share")} onClick={() => { setSheetOpen(false); setShareOpen(true); }} />
          )}
          {!owner && (
            <ActionSheetItem icon={Edit} label={t("common.rename")} onClick={() => { setSheetOpen(false); setRenameOpen(true); }} />
          )}
          <ActionSheetItem
            icon={StarIcon}
            label={starLabel}
            iconClassName={`size-[19px] ${starIconClass}`}
            iconFill={isStarred ? "currentColor" : "none"}
            onClick={() => { setSheetOpen(false); doStar(); }}
          />
          {owner ? (
            <ActionSheetItem icon={X} label={t("shared.removeFromShared")} onClick={() => { setSheetOpen(false); onRemoveShared?.(); }} />
          ) : (
            <ActionSheetItem icon={Trash} label={t("table.moveToTrash")} destructive onClick={() => { setSheetOpen(false); setConfirmDelete(true); }} />
          )}
        </ActionSheet>

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
        </>)}
      </div>
    </div>
  );
}
