import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/app/components/ui/dialog";
import { SourceIcon } from "./source-icons";
import { records } from "./records-table";
import type { Template } from "@/lib/templates";

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template;
}

/* PRO "Apply template" flow: pick a recording, then jump to it with the
   template auto-applied (the detail page reads location.state.applyTemplateId
   and runs the same staged summary generation). */
export function ApplyTemplateDialog({ open, onOpenChange, template }: ApplyTemplateDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    // Demo: ttt_demo_apply=open pre-selects the first recording so the picker
    // captures in a chosen state. DEV only; never affects real users.
    try {
      return import.meta.env.DEV && localStorage.getItem("ttt_demo_apply") === "open"
        ? records[0]?.id ?? null
        : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (!open) { setQuery(""); setSelectedId(null); }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => r.name.toLowerCase().includes(q));
  }, [query]);

  const handleApply = () => {
    if (!selectedId) return;
    onOpenChange(false);
    navigate(`/transcriptions/${selectedId}`, { state: { applyTemplateId: template.id } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle className="text-[17px]">Apply template</DialogTitle>
          <DialogDescription className="text-[13px]">
            Choose a recording to summarize with {template.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Icon icon={Search} size={16} />
            </span>
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your recordings"
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="px-3 py-3 max-h-[316px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              No recordings match your search.
            </p>
          ) : (
            filtered.map((r) => {
              const active = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${active ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/60"}`}
                >
                  <SourceIcon source={r.source} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-foreground truncate">{r.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{r.dateCreated} &middot; {r.duration}</span>
                  </span>
                  <span className={`size-[18px] rounded-full border flex items-center justify-center shrink-0 transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {active && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="pill-outline" className="h-9 px-4 text-[13px] font-medium" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="h-9 px-5 text-[13px] font-medium" disabled={!selectedId} onClick={handleApply}>
            Apply template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
