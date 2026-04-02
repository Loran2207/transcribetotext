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
import { SourceIcon } from "./source-icons";
import { LANGUAGES, useLanguage, type LangCode } from "./language-context";
import type { CalendarMeeting } from "./calendar-mock-data";

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
    <div className="flex items-start gap-4 py-3.5 px-4 border-l-2 border-primary/60 ml-1 rounded-r-lg hover:bg-accent/30 transition-colors">
      {/* Time column */}
      <div className="flex items-center gap-2 min-w-[130px] shrink-0">
        <SourceIcon source={meeting.platform} />
        <span className="text-sm text-foreground whitespace-nowrap">
          {meeting.startTime} ~ {meeting.endTime}
        </span>
      </div>

      {/* Auto-join toggle */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
        <Switch
          checked={autoJoin}
          onCheckedChange={onAutoJoinChange}
          aria-label={t("calendar.autoJoin")}
        />
        <span className="text-[10px] text-muted-foreground">{t("calendar.autoJoin")}</span>
      </div>

      {/* Meeting details */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate">
          {meeting.title}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {meeting.organizerEmail}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Icon icon={Globe} size={13} className="text-muted-foreground shrink-0" />
          <Select value={language} onValueChange={(v) => onLanguageChange(v as LangCode)}>
            <SelectTrigger className="h-5 w-auto min-w-[90px] border-none shadow-none bg-transparent px-1 text-xs text-muted-foreground gap-1 hover:bg-accent transition-colors">
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
