import { Globe } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Switch } from "@/app/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import { SourceIcon } from "./source-icons";
import { LANGUAGES, useLanguage, type LangCode } from "./language-context";
import type { CalendarMeeting } from "./calendar-mock-data";

const LANG_CODES = new Set<string>(LANGUAGES.map((l) => l.code));

interface CalendarMeetingCardProps {
  meeting: CalendarMeeting;
  autoJoin: boolean;
  language: LangCode;
  onAutoJoinChange: (checked: boolean) => void;
  onLanguageChange: (lang: LangCode) => void;
}

export function CalendarMeetingCard({
  meeting,
  autoJoin,
  language,
  onAutoJoinChange,
  onLanguageChange,
}: CalendarMeetingCardProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-start gap-4 py-3 px-4 rounded-xl border border-transparent hover:border-border hover:shadow-sm transition-all duration-150 group">
      {/* Time column */}
      <div className="flex items-center gap-2 min-w-[120px] shrink-0">
        <SourceIcon source={meeting.platform} />
        <span className="text-sm text-foreground whitespace-nowrap">
          {meeting.startTime} ~ {meeting.endTime}
        </span>
      </div>

      {/* Auto-join toggle with tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="shrink-0 pt-0.5">
            <Switch
              checked={autoJoin}
              onCheckedChange={onAutoJoinChange}
              aria-label={t("calendar.autoJoin")}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {t("calendar.autoJoin")}
        </TooltipContent>
      </Tooltip>

      {/* Meeting details */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {meeting.title}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground truncate">
            {meeting.organizerEmail}
          </span>
          <span className="text-muted-foreground/30">|</span>
          <Select value={language} onValueChange={(v) => { if (LANG_CODES.has(v)) onLanguageChange(v as LangCode); }}>
            <SelectTrigger className="h-5 w-auto min-w-[80px] border-none shadow-none bg-transparent px-0.5 text-xs text-muted-foreground gap-1 hover:bg-accent transition-colors">
              <Icon icon={Globe} size={12} className="text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
