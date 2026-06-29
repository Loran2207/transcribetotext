import { useNavigate } from "react-router";
import { Clock, MoreHorizontal } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SourceIcon } from "./source-icons";
import { useStarred } from "./starred-context";
import { LanguageBadge, type RecordRow } from "./records-table";

/* A single recording rendered as a card (mobile + tablet replacement for the
   desktop records table). Whole card opens the transcript; the kebab is a
   shadcn DropdownMenu and stops the click from reaching the card.
   Meta row mirrors the desktop table columns (duration, template, language)
   instead of repeating the day already shown in the group header. */
export function RecordCard({ record }: { record: RecordRow }) {
  const navigate = useNavigate();
  const { starred, toggleStar } = useStarred();
  const isStarred = starred.has(record.id);
  const open = () => navigate(`/transcriptions/${record.id}`);

  return (
    <div
      onClick={open}
      className="group flex items-start gap-[12px] px-[14px] py-[12px] rounded-[16px] bg-card border border-border/60 active:bg-muted/60 transition-colors cursor-pointer"
    >
      <div className="shrink-0 mt-[1px] flex items-center justify-center size-[40px] rounded-[12px] bg-muted">
        <SourceIcon source={record.source} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <p className="truncate text-foreground" style={{ fontWeight: 600, fontSize: 14, lineHeight: "19px" }}>{record.name}</p>
        <p className="line-clamp-2 text-muted-foreground" style={{ fontSize: 12.5, lineHeight: "17px" }}>{record.summary}</p>
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

      {/* Wrapper stops the click bubbling to the card; menu still opens on pointerdown */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0 -mr-[4px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-[32px] text-muted-foreground" aria-label="Record actions">
              <Icon icon={MoreHorizontal} className="size-[18px]" strokeWidth={1.8} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={open}>Open</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleStar(record.id, {
                  id: record.id,
                  name: record.name,
                  iconColor: record.iconColor,
                  iconType: record.iconType,
                  source: record.source,
                })
              }
            >
              {isStarred ? "Unstar" : "Star"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast("Share link copied")}>Share</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => toast("Moved to trash")}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
