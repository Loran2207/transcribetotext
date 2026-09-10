import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, StarIcon, Upload, X } from "@hugeicons/core-free-icons";

import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { SourceIcon } from "@/app/components/source-icons";
import { RecordCard } from "@/app/components/record-card";
import {
  ColumnHeaderDropdown,
  SortHeaderDropdown,
  FigmaCheckbox,
  LanguageBadge,
  PaginationBar,
  EmptyFilterState,
  MobileBulkBar,
  MSActionBtn,
  INLINE_FOLDER_PATH,
  typeFilterOptions,
  records as allRecords,
  type RecordRow,
} from "@/app/components/records-table";
import { setFabHidden } from "@/app/components/fab-visibility";
import { MobileSortFilter } from "@/app/components/records-mobile-sort";
import { useLanguage } from "@/app/components/language-context";
import { useStarred } from "@/app/components/starred-context";
import { getInitials } from "@/lib/format";
import {
  SHARED_FOLDERS,
  SHARED_FOLDER_RECORDS,
  SHARED_RECORDS,
  readSharedScene,
  type SharedOwner,
  type SharedFolderItem,
} from "@/lib/share-demo";

/* Shared with me.
 *
 * Everything a person already learned on My Records holds here: the same
 * columns, the same header dropdowns, the same filters, the same pagination.
 * What changes is what the page is FOR - these are other people's records - so
 * the folder column becomes the owner, and every action that would change
 * somebody else's work is gone.
 */

interface SharedItem {
  record: RecordRow;
  owner: SharedOwner;
  sharedOn: string;
}

const PAGE_SIZE_DEFAULT = 25;

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function SharedWithMePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const scene = useMemo(() => readSharedScene(), []);

  const items: SharedItem[] = useMemo(() => {
    if (scene === "empty") return [];
    return SHARED_RECORDS.map((s) => {
      const record = allRecords.find((r) => r.id === s.recordId);
      return record ? { record, owner: s.owner, sharedOn: s.sharedOn } : null;
    }).filter((x): x is SharedItem => x !== null);
  }, [scene]);

  const folders = scene === "empty" ? [] : SHARED_FOLDERS;

  /* The page has no search field of its own any more - the header already
     searches the whole account - so a result set can only be emptied by the
     filters. The "nothing found" scene picks a real owner and a type that owner
     has nothing in, rather than pretending somebody typed a query. */
  const emptyFilterSeed = useMemo(() => {
    if (scene !== "search_empty") return null;
    for (const email of new Set(items.map((i) => i.owner.email))) {
      const theirs = new Set(items.filter((i) => i.owner.email === email).map((i) => i.record.source));
      const other = items.map((i) => i.record.source).find((s) => !theirs.has(s));
      if (other) return { owner: email, type: other };
    }
    return null;
  }, [scene, items]);

  const [ownerFilter, setOwnerFilter] = useState<Set<string>>(() => new Set(emptyFilterSeed ? [emptyFilterSeed.owner] : []));
  const [typeFilter, setTypeFilter] = useState<Set<string>>(() => new Set(emptyFilterSeed ? [emptyFilterSeed.type] : []));
  const [dateSort, setDateSort] = useState("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [openFolder, setOpenFolder] = useState<SharedFolderItem | null>(null);

  const ownerOptions = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach((i) => seen.set(i.owner.email, i.owner.name));
    folders.forEach((f) => seen.set(f.owner.email, f.owner.name));
    return Array.from(seen, ([id, label]) => ({ id, label }));
  }, [items, folders]);

  /* The same list My Records writes its types with, cut to the ones actually
     present here: a filter that offers a choice with nothing behind it is a
     dead end. */
  const typeOptions = useMemo(() => {
    const present = new Set<string>(items.map((i) => i.record.source));
    return typeFilterOptions.filter((o) => present.has(o.id));
  }, [items]);

  const hasFilters = ownerFilter.size > 0 || typeFilter.size > 0;

  const filtered = useMemo(() => {
    let out = items;
    if (ownerFilter.size) out = out.filter((i) => ownerFilter.has(i.owner.email));
    if (typeFilter.size) out = out.filter((i) => typeFilter.has(i.record.source));
    const sorted = [...out].sort((a, b) => {
      const da = Date.parse(a.sharedOn.replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2"));
      const db = Date.parse(b.sharedOn.replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2"));
      return dateSort === "oldest" ? da - db : db - da;
    });
    return sorted;
  }, [items, ownerFilter, typeFilter, dateSort]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paged.length > 0 && paged.every((i) => selected.has(i.record.id));
  const loading = scene === "loading";

  /* The bar takes the bottom edge, so the "+" steps aside while it is there -
     the same trade My Records already makes. */
  const hasSelection = selected.size > 0;
  useEffect(() => { setFabHidden(hasSelection, "select"); return () => setFabHidden(false, "select"); }, [hasSelection]);

  function clearFilters() {
    setOwnerFilter(new Set());
    setTypeFilter(new Set());
  }

  if (openFolder) {
    return <SharedFolderView folder={openFolder} onBack={() => setOpenFolder(null)} />;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-4 pb-[40px] lg:px-8">
        {/* Header: the page's name, and the controls that narrow it down */}
        <div className="flex items-center gap-[12px] pt-[28px] pb-[16px]">
          <span className="shrink-0 font-semibold text-[18px] text-foreground">{t("shared.title")}</span>
          {/* No search field here: the header already searches the whole
              account, and a second one that only looks at this page taught the
              reader there were two kinds of search. */}
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-[12px]">
          {/* Below lg there is no table header, so the owner and type filters
              would simply vanish. They collapse into the same bottom sheet My
              Records uses, with this page's own two columns in it. Nothing
              shared with you yet means nothing to filter, so the control is
              not there either - but a filter that returns nothing keeps it,
              because that is the only way back. */}
          {!loading && (items.length > 0 || folders.length > 0) && (
          <div className="shrink-0 lg:hidden">
            <MobileSortFilter
              sortValue={dateSort}
              onSort={setDateSort}
              onClearAll={clearFilters}
              sortOptions={[
                { id: "newest", label: t("table.newestFirst") },
                { id: "oldest", label: t("table.oldestFirst") },
              ]}
              groups={[
                { label: t("table.type"), options: typeOptions, selected: typeFilter, onToggle: (id) => { setTypeFilter((s) => toggle(s, id)); setPage(1); } },
                { label: t("shared.owner"), options: ownerOptions, selected: ownerFilter, onToggle: (id) => { setOwnerFilter((s) => toggle(s, id)); setPage(1); } },
              ]}
            />
          </div>
          )}
          </div>
        </div>

        {loading ? (
          <SharedSkeleton />
        ) : items.length === 0 && folders.length === 0 ? (
          <EmptyShared />
        ) : (
          <>
            {/* Folders first, as their own group. A folder is a place, and a
                person looks for the place before the paper inside it. */}
            {folders.length > 0 && !hasFilters && (
              <div className="mb-[22px]">
                <p className="mb-[10px] text-[12px] font-medium text-muted-foreground">
                  {t("shared.folders")}
                </p>
                <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2 xl:grid-cols-3">
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      data-qa-label="shared-folder-card"
                      onClick={() => setOpenFolder(f)}
                      className="group flex w-full items-center gap-[12px] rounded-[14px] border border-border/60 bg-card px-[14px] py-[12px] text-left transition-colors hover:bg-accent/60"
                    >
                      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-muted">
                        <svg className="size-[20px]" fill="none" viewBox="0 0 16 16"><path d={INLINE_FOLDER_PATH} fill={f.color} /></svg>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <span className="truncate text-[14px] font-medium leading-[19px] text-foreground">{f.name}</span>
                        <span className="flex items-center gap-[6px] text-[11px] leading-[14px] text-muted-foreground">
                          <OwnerChip owner={f.owner} size={14} />
                          <span className="truncate">{f.owner.name}</span>
                          <span className="shrink-0">{t(f.count === 1 ? "folder.fileOne" : "folder.fileOther", f.count)}</span>
                        </span>
                      </span>
                      <Icon icon={ChevronRight} className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {folders.length > 0 && !hasFilters && (
              <p className="mb-[10px] text-[12px] font-medium text-muted-foreground">
                {t("shared.records")}
              </p>
            )}

            {/* ── Phone and tablet: the same cards My Records uses ── */}
            <div className="lg:hidden">
              {filtered.length === 0 ? (
                hasFilters ? <EmptyFilterState onClear={clearFilters} /> : <EmptyShared />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-[10px]">
                    {paged.map((i) => (
                      <RecordCard
                        key={i.record.id}
                        record={i.record}
                        owner={i.owner}
                        selected={selected.has(i.record.id)}
                        selectionMode={selected.size > 0}
                        onToggleSelect={() => setSelected((s) => toggle(s, i.record.id))}
                        onRemoveShared={() => setSelected((s) => toggle(s, i.record.id))}
                      />
                    ))}
                  </div>
                  <PaginationBar compact total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
                </>
              )}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden lg:block">
              {/* The table draws both of its own outer edges. On My Records the
                  tab strip's underline is the line above the column headings;
                  this page has no tabs, so without a top border the headings
                  float with nothing over them. */}
              <div className="w-full border-y border-border bg-card">
                {selected.size > 0 ? (
                  <SharedBulkBar
                    count={selected.size}
                    onCancel={() => setSelected(new Set())}
                    onExport={() => setSelected(new Set())}
                    onRemove={() => setSelected(new Set())}
                  />
                ) : (
                  <div className="flex h-[36px] items-center border-b border-border">
                    <div className="flex w-[40px] shrink-0 items-center justify-center">
                      <FigmaCheckbox
                        checked={allSelected}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(paged.map((i) => i.record.id)))}
                      />
                    </div>
                    <div className="flex min-w-0 flex-[2.2] items-center px-[12px]">
                      <ColumnHeaderDropdown label={t("table.type")} options={typeOptions} selected={typeFilter} onToggle={(id) => { setTypeFilter((s) => toggle(s, id)); setPage(1); }} />
                    </div>
                    <div className="w-[32px] shrink-0" />
                    <div className="flex min-w-0 flex-[1] items-center px-[12px]">
                      <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.template")}</span>
                    </div>
                    <div className="flex w-[156px] shrink-0 items-center px-[8px]">
                      <ColumnHeaderDropdown label={t("shared.owner")} options={ownerOptions} selected={ownerFilter} onToggle={(id) => { setOwnerFilter((s) => toggle(s, id)); setPage(1); }} />
                    </div>
                    <div className="flex w-[50px] shrink-0 items-center justify-center px-[6px]">
                      <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.lang")}</span>
                    </div>
                    <div className="flex w-[80px] shrink-0 items-center px-[8px]">
                      <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.duration")}</span>
                    </div>
                    <div className="flex w-[130px] shrink-0 items-center px-[8px]">
                      <SortHeaderDropdown
                        label={t("table.date")}
                        options={[{ id: "newest", label: t("table.newestFirst") }, { id: "oldest", label: t("table.oldestFirst") }]}
                        selected={dateSort}
                        onSelect={setDateSort}
                        align="right"
                      />
                    </div>
                  </div>
                )}

                {filtered.length === 0 ? (
                  hasFilters ? <EmptyFilterState onClear={clearFilters} /> : <EmptyShared />
                ) : (
                  paged.map((i) => (
                    <SharedTableRow
                      key={i.record.id}
                      item={i}
                      isSelected={selected.has(i.record.id)}
                      onToggle={() => setSelected((s) => toggle(s, i.record.id))}
                      onOpen={() => navigate(`/transcriptions/${i.record.id}`)}
                    />
                  ))
                )}
              </div>
              {filtered.length > 0 && (
                <PaginationBar total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Below 1024 the selection is answered by the floating bar the product
          already uses on My Records - same shell, same close cross, same count,
          only the actions differ, because a reader may take the text away or
          take the row off their own list and nothing more. */}
      {hasSelection && (
        <MobileBulkBar count={selected.size} onCancel={() => setSelected(new Set())}>
          <MSActionBtn icon={Upload} label={t("shared.exportText")} onClick={() => setSelected(new Set())} />
          {/* The row's own words, not a second phrase for the same action: the
              short label fits the compact bar, so the shorter paraphrase that
              used to live here is gone. */}
          <MSActionBtn icon={X} label={t("shared.removeFromShared")} onClick={() => setSelected(new Set())} />
        </MobileBulkBar>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function OwnerChip({ owner, size = 20 }: { owner: SharedOwner; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium"
      style={{ width: size, height: size, background: owner.tint, color: owner.ink, fontSize: Math.round(size * 0.42) }}
    >
      {owner.avatar ? <img src={owner.avatar} alt="" className="size-full object-cover" /> : getInitials(owner.name)}
    </span>
  );
}

function SharedTableRow({ item, isSelected, onToggle, onOpen }: {
  item: SharedItem; isSelected: boolean; onToggle: () => void; onOpen: () => void;
}) {
  const { t } = useLanguage();
  const { starred, toggleStar } = useStarred();
  const [hovered, setHovered] = useState(false);
  const { record, owner } = item;
  const isStarred = starred.has(record.id);

  return (
    <div
      className={`relative flex h-[40px] cursor-pointer items-center border-b border-border transition-colors last:border-b-0 hover:bg-accent ${isSelected ? "bg-primary/5" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={onOpen}
    >
      <div className="flex w-[40px] shrink-0 items-center justify-center">
        <FigmaCheckbox checked={isSelected} onChange={onToggle} />
      </div>
      <div className="relative flex min-w-0 flex-[2.2] items-center gap-[8px] px-[12px]">
        <SourceIcon source={record.source} />
        <p className="min-w-0 truncate text-[14px] font-medium leading-[20px] tracking-[-0.154px] text-foreground">{record.name}</p>
        {/* The row's own actions, and none of them touch the owner's copy. */}
        <div
          className={`absolute top-0 bottom-0 z-20 flex items-center justify-end pr-[4px] transition-opacity duration-150 ${hovered ? "opacity-100" : "pointer-events-none opacity-0"}`}
          style={{ right: "-26px", width: 180, background: "linear-gradient(to right, transparent 0px, var(--accent) 48px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.star")}
            title={t("common.star")}
            onClick={() => toggleStar(record.id, { id: record.id, name: record.name, iconColor: record.iconColor, iconType: record.iconType, source: record.source })}
            className="mr-[4px] size-[26px] rounded-full text-muted-foreground hover:text-foreground"
          >
            <Icon icon={StarIcon} className="size-[13px]" fill={isStarred ? "currentColor" : "none"} strokeWidth={1.7} />
          </Button>
          <Button variant="pill-outline" className="h-[26px] gap-[5px] bg-card px-[10px] text-[11.5px] font-medium">
            <Icon icon={Upload} className="size-[12px]" strokeWidth={1.6} />
            {t("shared.exportText")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("shared.removeFromShared")}
            title={t("shared.removeFromShared")}
            className="ml-[4px] size-[26px] rounded-full text-muted-foreground hover:text-foreground"
          >
            <Icon icon={X} className="size-[13px]" strokeWidth={1.7} />
          </Button>
        </div>
      </div>
      <div className="flex w-[32px] shrink-0 items-center justify-center">
        {isStarred && (
          <svg className="pointer-events-none size-[15px] shrink-0" fill="#F59E0B" viewBox="0 0 16 16">
            <path d="M8 1.333l1.787 3.62 3.996.584-2.891 2.818.682 3.978L8 10.517l-3.574 1.816.682-3.978L2.217 5.537l3.996-.584L8 1.333z" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-[1] px-[12px]">
        <div className="inline-flex h-[22px] items-center rounded-[4px] bg-muted px-[8px]">
          <span className="truncate text-[12px] text-muted-foreground">{record.template}</span>
        </div>
      </div>
      <div className="flex w-[156px] min-w-0 shrink-0 items-center gap-[6px] px-[8px]">
        <OwnerChip owner={owner} />
        <span className="min-w-0 truncate text-[13px] text-foreground">{owner.name}</span>
      </div>
      <div className="flex w-[50px] shrink-0 justify-center px-[6px]">
        <LanguageBadge lang={record.language} />
      </div>
      <div className="w-[80px] shrink-0 px-[8px]">
        <p className="whitespace-nowrap text-[14px] leading-[20px] tracking-[-0.154px] text-muted-foreground">{record.duration}</p>
      </div>
      <div className="w-[130px] shrink-0 px-[8px]">
        <p className="whitespace-nowrap text-[13px] leading-[20px] tracking-[-0.154px] text-muted-foreground">{item.sharedOn}</p>
      </div>
    </div>
  );
}

/* Only what a reader is allowed to do in bulk: take the text away with them, or
   take the row off their own list. Nothing that would change the owner's copy. */
function SharedBulkBar({ count, onCancel, onExport, onRemove }: {
  count: number; onCancel: () => void; onExport: () => void; onRemove: () => void;
}) {
  const { t } = useLanguage();
  /* Desktop only: below 1024 the same selection is answered by MobileBulkBar. */
  return (
    <div className="flex h-[36px] items-center gap-[4px] bg-primary/5" style={{ borderBottom: "1px solid hsl(var(--primary) / 0.2)" }}>
      <div className="flex w-[40px] shrink-0 items-center justify-center">
        <FigmaCheckbox checked onChange={onCancel} />
      </div>
      <span className="text-[13px] font-semibold text-foreground">{count} {t("table.selected")}</span>
      <div className="ml-[2px] h-[20px] w-px bg-primary/20" />
      <button onClick={onExport} className="flex h-[30px] items-center gap-[5px] rounded-full px-[8px] text-primary transition-opacity hover:opacity-70">
        <Icon icon={Upload} className="size-[14px]" strokeWidth={1.5} />
        <span className="text-[13px] font-medium">{t("shared.exportText")}</span>
      </button>
      <button onClick={onRemove} className="flex h-[30px] items-center gap-[5px] rounded-full px-[8px] text-primary transition-opacity hover:opacity-70">
        <Icon icon={X} className="size-[14px]" strokeWidth={1.5} />
        <span className="text-[13px] font-medium">{t("shared.removeFromShared")}</span>
      </button>
      <div className="flex-1" />
      <Button variant="ghost" onClick={onCancel} className="h-[30px] rounded-full px-[12px] text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
        {t("common.cancel")}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function EmptyShared() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center px-[24px] py-[64px]">
      <div className="mb-[16px] flex size-[56px] items-center justify-center rounded-full bg-muted">
        <svg className="size-[24px] text-muted-foreground" fill="none" viewBox="0 0 24 24">
          <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="10" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M17 11l2.2 2.2L23 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mb-[6px] text-[15px] font-semibold text-foreground">{t("shared.noRecordsFound")}</p>
      <p className="max-w-[300px] text-center text-[13px] leading-[20px] text-muted-foreground">
        {t("shared.willAppearHere")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/* What waiting looks like. The shape has to be the shape that arrives: below lg
   the page fills with cards, so a row of table-column bars there was both the
   wrong picture and wider than the phone it was drawn on. */
function SharedSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="mb-[22px] grid grid-cols-1 gap-[10px] md:grid-cols-2 xl:grid-cols-3">
        {[0, 1].map((i) => <div key={i} className="h-[64px] animate-pulse rounded-[14px] border border-border/60 bg-card" />)}
      </div>
      <div className="grid grid-cols-1 gap-[10px] lg:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[80px] animate-pulse rounded-[16px] border border-border/60 bg-card" />
        ))}
      </div>
      <div className="hidden lg:block">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-[40px] items-center gap-[12px] border-b border-border px-[12px]">
            <div className="size-[18px] shrink-0 animate-pulse rounded-[5px] bg-muted" />
            <div className="h-[12px] min-w-0 animate-pulse rounded-full bg-muted" style={{ width: 170 + (i % 4) * 46 }} />
            <div className="ml-auto h-[11px] w-[88px] shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-[11px] w-[44px] shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-[11px] w-[64px] shrink-0 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/* A folder somebody shared. You are inside their place, so the breadcrumb says
   whose place it is, and the only thing the menu offers is to stop keeping it. */
function SharedFolderView({ folder, onBack }: { folder: SharedFolderItem; onBack: () => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const empty = (() => { try { return localStorage.getItem("ttt_demo_shared") === "folder_empty"; } catch { return false; } })();

  const items: SharedItem[] = empty
    ? []
    : (SHARED_FOLDER_RECORDS[folder.id] ?? [])
        .map((id) => allRecords.find((r) => r.id === id))
        .filter((r): r is RecordRow => !!r)
        .map((record) => ({ record, owner: folder.owner, sharedOn: folder.sharedOn }));

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-4 pb-[40px] lg:px-8">
        <div className="flex items-center gap-[8px] pt-[28px] pb-[6px] text-[13px]">
          <button type="button" onClick={onBack} className="text-muted-foreground transition-colors hover:text-foreground">
            {t("shared.title")}
          </button>
          <Icon icon={ChevronRight} className="size-[14px] text-muted-foreground" strokeWidth={2} />
          <span className="font-medium text-foreground">{folder.name}</span>
        </div>

        {/* Whose folder this is reads as the title's own second line rather than
            a third thing on the title row: at 390 the three of them fought over
            350px, the name broke across three lines and the button walked off
            the edge of the screen. */}
        <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[10px] pb-[18px]">
          <div className="flex min-w-0 flex-1 items-center gap-[10px] max-sm:w-full max-sm:flex-none">
            <svg className="size-[22px] shrink-0" fill="none" viewBox="0 0 16 16"><path d={INLINE_FOLDER_PATH} fill={folder.color} /></svg>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[18px] leading-[24px] text-foreground">{folder.name}</p>
              <span className="mt-[2px] flex items-center gap-[6px] text-[13px] text-muted-foreground">
                <OwnerChip owner={folder.owner} size={16} />
                <span className="truncate">{t("shared.sharedByOwner").replace("{owner}", folder.owner.name)}</span>
              </span>
            </div>
          </div>
          <Button variant="pill-outline" className="h-9 shrink-0 gap-[6px] px-[14px] text-[13px] font-medium">
            <Icon icon={X} className="size-[14px]" strokeWidth={1.7} />
            {t("shared.removeFolderFromShared")}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-[24px] py-[64px]">
            <div className="mb-[16px] flex size-[56px] items-center justify-center rounded-full bg-muted">
              <svg className="size-[24px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d={INLINE_FOLDER_PATH} fill="currentColor" opacity="0.5" /></svg>
            </div>
            <p className="mb-[6px] text-[15px] font-semibold text-foreground">{t("shared.emptyFolder")}</p>
            <p className="max-w-[300px] text-center text-[13px] leading-[20px] text-muted-foreground">
              {t("shared.emptyFolderDesc").replace("{owner}", folder.owner.name)}
            </p>
          </div>
        ) : (
          <>
            <div className="lg:hidden">
              <div className="grid grid-cols-1 gap-[10px]">
                {/* The card still knows it belongs to somebody else - that is
                    what keeps your own folder colours off it - but it does not
                    print the name: the header two rows up already says whose
                    folder this is, and six cards repeating it is one fact said
                    seven times. */}
                {items.map((i) => (
                  <RecordCard key={i.record.id} record={i.record} owner={i.owner} showOwner={false} />
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-full border-y border-border bg-card">
                <div className="flex h-[36px] items-center border-b border-border">
                  <div className="w-[40px] shrink-0" />
                  <div className="flex min-w-0 flex-[2.2] items-center px-[12px]">
                    <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.type")}</span>
                  </div>
                  <div className="w-[32px] shrink-0" />
                  <div className="flex min-w-0 flex-[1] items-center px-[12px]">
                    <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.template")}</span>
                  </div>
                  <div className="flex w-[156px] shrink-0 items-center px-[8px]">
                    <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("shared.owner")}</span>
                  </div>
                  <div className="flex w-[50px] shrink-0 items-center justify-center px-[6px]">
                    <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.lang")}</span>
                  </div>
                  <div className="flex w-[80px] shrink-0 items-center px-[8px]">
                    <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.duration")}</span>
                  </div>
                  <div className="flex w-[130px] shrink-0 items-center px-[8px]">
                    <span className="text-[11px] font-medium uppercase tracking-[0.3404px] text-foreground">{t("table.date")}</span>
                  </div>
                </div>
                {items.map((i) => (
                  <SharedTableRow
                    key={i.record.id}
                    item={i}
                    isSelected={selected.has(i.record.id)}
                    onToggle={() => setSelected((s) => toggle(s, i.record.id))}
                    onOpen={() => navigate(`/transcriptions/${i.record.id}`)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
