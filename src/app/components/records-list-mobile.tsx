import { useState } from "react";
import { ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { RecordCard } from "./record-card";
import { useLanguage } from "./language-context";
import { records } from "./records-table";

const PAGE_SIZE = 12;

/* The dashboard recent-records list for mobile + tablet: a flat list of
   records rendered as cards (1 column on phone, 2 on tablet), revealed in
   batches of PAGE_SIZE via a "Load more" button. Replaces the 122KB desktop
   table below lg. */
export function RecordsListMobile({ onNavigateToRecords, embedded }: { onNavigateToRecords?: () => void; embedded?: boolean }) {
  const { t } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = records.slice(0, visibleCount);
  const hasMore = visibleCount < records.length;

  return (
    <section className={`lg:hidden ${embedded ? "" : "mt-[24px]"}`}>
      {/* Header mirrors the desktop table: title + inline chevron, the whole
          thing navigates to My Records (no separate "See all" button). */}
      <button
        onClick={onNavigateToRecords}
        className="group flex items-center gap-[4px] mb-[12px]"
      >
        <span className="text-foreground" style={{ fontWeight: 600, fontSize: 17 }}>{t("table.myRecords")}</span>
        <Icon icon={ChevronRight} className="size-[16px] text-foreground opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
        {visible.map((r) => (
          <RecordCard key={r.id} record={r} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-[16px]">
          <Button
            variant="pill-outline"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="h-[36px] px-[18px] text-[13px] font-medium"
          >
            {t("table.loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
}
