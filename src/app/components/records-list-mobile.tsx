import { ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { RecordCard } from "./record-card";
import { useLanguage } from "./language-context";
import { records, type RecordRow } from "./records-table";

/* The dashboard recent-records list for mobile + tablet: records grouped by
   day, rendered as cards (1 column on phone, 2 on tablet). Replaces the 122KB
   desktop table below lg. */
export function RecordsListMobile({ onNavigateToRecords }: { onNavigateToRecords?: () => void }) {
  const { t } = useLanguage();
  const groups: { label: string; items: RecordRow[] }[] = [];
  for (const r of records) {
    const g = groups.find((x) => x.label === r.dateGroup);
    if (g) g.items.push(r);
    else groups.push({ label: r.dateGroup, items: [r] });
  }

  return (
    <section className="mt-[24px] lg:hidden">
      {/* Header mirrors the desktop table: title + inline chevron, the whole
          thing navigates to My Records (no separate "See all" button). */}
      <button
        onClick={onNavigateToRecords}
        className="group flex items-center gap-[4px] mb-[12px]"
      >
        <span className="text-foreground" style={{ fontWeight: 600, fontSize: 17 }}>{t("table.myRecords")}</span>
        <Icon icon={ChevronRight} className="size-[16px] text-foreground opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
      </button>

      <div className="flex flex-col gap-[18px]">
        {groups.map((group) => (
          <div key={group.label}>
            <p
              className="mb-[8px] text-muted-foreground"
              style={{ fontWeight: 600, fontSize: 11.5 }}
            >
              {group.label}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
              {group.items.map((r) => (
                <RecordCard key={r.id} record={r} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
