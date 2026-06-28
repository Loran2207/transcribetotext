import { ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { RecordCard } from "./record-card";
import { records, type RecordRow } from "./records-table";

/* The dashboard "Recents" list for mobile + tablet: records grouped by day,
   rendered as cards (1 column on phone, 2 on tablet). Replaces the 122KB
   desktop table below lg. */
export function RecordsListMobile({ onNavigateToRecords }: { onNavigateToRecords?: () => void }) {
  const groups: { label: string; items: RecordRow[] }[] = [];
  for (const r of records) {
    const g = groups.find((x) => x.label === r.dateGroup);
    if (g) g.items.push(r);
    else groups.push({ label: r.dateGroup, items: [r] });
  }

  return (
    <section className="mt-[24px] lg:hidden">
      <div className="flex items-center justify-between mb-[12px]">
        <h2 className="text-foreground" style={{ fontWeight: 600, fontSize: 15 }}>Recents</h2>
        <button
          onClick={onNavigateToRecords}
          className="flex items-center gap-[2px] text-primary"
          style={{ fontWeight: 500, fontSize: 12.5 }}
        >
          See all
          <Icon icon={ChevronRight} className="size-[14px]" strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col gap-[18px]">
        {groups.map((group) => (
          <div key={group.label}>
            <p
              className="mb-[8px] text-muted-foreground uppercase"
              style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.5px" }}
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
