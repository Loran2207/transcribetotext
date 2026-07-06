import { useState, useEffect } from "react";
import { ChevronRight, FolderPlus } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { RecordCard } from "./record-card";
import { useLanguage } from "./language-context";
import { useFolders } from "./folder-context";
import { records, CreateFolderModal, PaginationBar, EmptyTabState } from "./records-table";
import { useTranscriptionModals } from "./transcription-modals";

const PAGE_SIZE = 12;

/* The dashboard recent-records list for mobile + tablet: a flat list of
   records rendered as cards (single column), paginated with
   the shared arrow PaginationBar (compact variant) - the same prev/next paging
   the desktop table uses. Replaces the 122KB desktop table below lg. The header
   carries an "Add folder" control that opens the shared CreateFolderModal
   (name + color) wired to useFolders().addFolder. */
export function RecordsListMobile({ onNavigateToRecords, embedded }: { onNavigateToRecords?: () => void; embedded?: boolean }) {
  const { t } = useLanguage();
  const { addFolder } = useFolders();
  const { setOpenModal } = useTranscriptionModals();
  // Demo: ?empty=1 / ttt_empty forces the no-records empty state for design captures.
  const forceEmpty = typeof window !== "undefined" && (new URLSearchParams(window.location.search).get("empty") === "1" || window.localStorage.getItem("ttt_empty") === "1");
  const list = forceEmpty ? [] : records;
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  // Reset to the first page whenever the list changes shape.
  useEffect(() => { setPage(1); }, [list.length]);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section className={`lg:hidden ${embedded ? "" : "mt-[24px]"}`}>
      {/* Header mirrors the desktop table: title + inline chevron navigates to
          My Records; the trailing button opens the create-folder modal. */}
      <div className="flex items-center justify-between gap-[12px] mb-[12px]">
        <button
          onClick={onNavigateToRecords}
          className="group flex items-center gap-[4px] min-w-0"
        >
          <span className="truncate text-foreground" style={{ fontWeight: 600, fontSize: 15, lineHeight: "20px" }}>{t("table.myRecords")}</span>
          <Icon icon={ChevronRight} className="size-[16px] shrink-0 text-foreground opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
        </button>
        <Button
          variant="pill-outline"
          onClick={() => setCreateOpen(true)}
          className="h-[32px] shrink-0 pl-[10px] pr-[13px] gap-[6px]"
        >
          <Icon icon={FolderPlus} className="size-[15px] text-foreground" strokeWidth={1.7} />
          <span className="text-[13px] font-medium text-foreground">{t("folder.addFolder")}</span>
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyTabState tab="Recent" onNew={() => setOpenModal("upload")} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-[10px]">
            {visible.map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
          <PaginationBar compact total={list.length} page={safePage} pageSize={PAGE_SIZE} onPage={setPage} onPageSize={() => {}} />
        </>
      )}

      <CreateFolderModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(name, color) => addFolder(name, color)} />
    </section>
  );
}
