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

const PLATFORM_ACCENT: Record<string, string> = {
  "google-meet": "bg-[#00832D]",
  "zoom": "bg-[#2D8CFF]",
  "teams": "bg-[#6264A7]",
};

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
    <div className="flex items-stretch gap-0 group">
      {/* Color accent bar */}
      <div className={cn(
        "w-[3px] rounded-full shrink-0 my-1",
        PLATFORM_ACCENT[meeting.platform] ?? "bg-primary",
      )} />

      {/* Card content */}
      <div className="flex items-start gap-4 flex-1 py-3 px-4 ml-3 rounded-lg hover:bg-accent/40 transition-colors duration-100">
        {/* Time */}
        <div className="flex items-center gap-2 min-w-[120px] shrink-0">
          <SourceIcon source={meeting.platform} />
          <span className="text-[13px] font-medium text-foreground tabular-nums whitespace-nowrap">
            {meeting.startTime} – {meeting.endTime}
          </span>
        </div>

        {/* Auto-join */}
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

        {/* Details */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[14px] font-medium text-foreground truncate leading-snug">
            {meeting.title}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[12px] text-muted-foreground truncate">
              {meeting.organizerEmail}
            </span>
            <span className="text-border">·</span>
            <Select value={language} onValueChange={(v) => { if (LANG_CODES.has(v)) onLanguageChange(v as LangCode); }}>
              <SelectTrigger className="h-5 w-auto min-w-[75px] border-none shadow-none bg-transparent px-0 text-[12px] text-muted-foreground gap-1 hover:text-foreground transition-colors">
                <Icon icon={Globe} size={11} className="text-muted-foreground/70 shrink-0" />
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
    </div>
  );
}
