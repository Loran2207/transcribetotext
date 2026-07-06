import { useState, useRef, useEffect } from "react";

/* Compact sort control for the mobile / tablet records card list (the desktop
   table sorts via its column headers; below lg there are no headers, so this
   pill exposes the same date sort). Sentence-case labels, no uppercase. */
export function RecordsMobileSort({ dateSort, setDateSort }: { dateSort: string; setDateSort: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const opts = [{ id: "newest", label: "Newest first" }, { id: "oldest", label: "Oldest first" }];
  const current = dateSort === "oldest" ? "Oldest first" : "Newest first";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={"flex items-center gap-[6px] h-[34px] pl-[12px] pr-[10px] rounded-full border border-border bg-card text-[13px] text-foreground active:bg-muted/60 transition-colors"}>
        <svg className="size-[14px] text-muted-foreground" fill="none" viewBox="0 0 16 16"><path d="M4 5h8M5.5 8h5M7 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        {current}
        <svg className={"size-[10px] text-muted-foreground transition-transform " + (open ? "rotate-180" : "")} fill="none" viewBox="0 0 10 10"><path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] w-[170px] rounded-[10px] py-[6px] z-50 bg-popover border border-border shadow-md">
          {opts.map((opt) => (
            <button key={opt.id} onClick={() => { setDateSort(opt.id); setOpen(false); }} className="flex items-center gap-[8px] w-full px-[14px] h-[34px] hover:bg-accent transition-colors">
              <span className={"flex-1 text-left text-[13px] " + (dateSort === opt.id ? "font-medium text-primary" : "text-foreground")}>{opt.label}</span>
              {dateSort === opt.id && <svg className="size-[14px] shrink-0 text-primary" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
