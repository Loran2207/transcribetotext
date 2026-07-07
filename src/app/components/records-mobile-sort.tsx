import { useState } from "react";
import { SourceIcon, type SourceType } from "./source-icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";

/* Mobile / tablet "Sort & filter" control for the records list. There is no
   table header below lg, so the per-column controls from the desktop table
   (Type / Template / Language filters + Date/Name sort) collapse into one
   bottom sheet. Reuses the exact same filter state as the desktop table. */

type FilterOpt = { id: string; label: string; sourceIcon?: SourceType; icon?: string };

const SORT_OPTS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "name-asc", label: "Name A-Z" },
  { id: "name-desc", label: "Name Z-A" },
];

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

function FilterGroup({ label, options, selected, onToggle }: { label: string; options: FilterOpt[]; selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <section className="flex flex-col gap-[10px]">
      <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-[8px]">
        {options.map((o) => {
          const on = selected.has(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={"flex items-center gap-[6px] h-[34px] pl-[10px] pr-[13px] rounded-full border text-[13px] font-medium transition-colors " + (on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground active:bg-muted/50")}
            >
              {o.sourceIcon ? <span className="inline-flex size-[16px] items-center justify-center [&>*]:size-[16px]"><SourceIcon source={o.sourceIcon} /></span> : o.icon ? <span className="text-[14px] leading-none">{o.icon}</span> : null}
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function RecordsMobileSort({
  dateSort, setDateSort,
  typeFilter, setTypeFilter, typeOptions,
  templateFilter, setTemplateFilter, templateOptions,
  langFilter, setLangFilter, langOptions,
  onClearAll,
}: {
  dateSort: string; setDateSort: (v: string) => void;
  typeFilter: Set<string>; setTypeFilter: (fn: (s: Set<string>) => Set<string>) => void; typeOptions: FilterOpt[];
  templateFilter: Set<string>; setTemplateFilter: (fn: (s: Set<string>) => Set<string>) => void; templateOptions: FilterOpt[];
  langFilter: Set<string>; setLangFilter: (fn: (s: Set<string>) => Set<string>) => void; langOptions: FilterOpt[];
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const filterCount = typeFilter.size + templateFilter.size + langFilter.size;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center gap-[7px] size-9 md:w-auto md:px-[14px] rounded-full border border-border bg-card text-[13px] font-medium text-foreground active:bg-muted/50 transition-colors"
      >
        <svg className="size-[15px] text-foreground" fill="none" viewBox="0 0 16 16"><path d="M2 4.5h12M4.5 8h7M6.5 11.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <span className="hidden md:inline">Sort &amp; filter</span>
        {filterCount > 0 && (<><span className="md:hidden absolute -top-[2px] -right-[2px] size-[9px] rounded-full bg-primary border-2 border-background" /><span className="hidden md:flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tabular-nums">{filterCount}</span></>)}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-[22px] p-0 gap-0 max-h-[86vh] flex flex-col">
          <SheetHeader className="px-[20px] pt-[18px] pb-[12px] border-b border-border">
            <SheetTitle className="text-[16px] font-semibold text-left">Sort &amp; filter</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-[20px] py-[18px] flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[8px]">
              <p className="text-[12px] font-semibold text-muted-foreground">Sort by</p>
              <div className="flex flex-col">
                {SORT_OPTS.map((o) => {
                  const on = dateSort === o.id;
                  return (
                    <button key={o.id} type="button" onClick={() => setDateSort(o.id)} className="flex items-center justify-between h-[44px] text-[14px] text-foreground active:bg-muted/40 transition-colors">
                      <span className={on ? "font-medium text-primary" : ""}>{o.label}</span>
                      {on && <svg className="size-[17px] text-primary" fill="none" viewBox="0 0 16 16"><path d="M13 4.5L6.5 11.5 3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                  );
                })}
              </div>
            </section>

            <FilterGroup label="Type" options={typeOptions} selected={typeFilter} onToggle={(id) => setTypeFilter((s) => toggle(s, id))} />
            <FilterGroup label="Template" options={templateOptions} selected={templateFilter} onToggle={(id) => setTemplateFilter((s) => toggle(s, id))} />
            <FilterGroup label="Language" options={langOptions} selected={langFilter} onToggle={(id) => setLangFilter((s) => toggle(s, id))} />
          </div>

          <div className="flex items-center gap-[10px] px-[20px] py-[14px] border-t border-border">
            <Button variant="pill-outline" onClick={onClearAll} className="flex-1 h-[42px]">Reset</Button>
            <Button onClick={() => setOpen(false)} className="flex-1 h-[42px] bg-primary text-white">Show results</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
