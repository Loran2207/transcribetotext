import { useState } from "react";
import { useNavigate } from "react-router";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import { SourceIcon } from "./source-icons";
import { LANGUAGES, useLanguage, type LangCode } from "./language-context";
import {
  type CalendarMeeting,
  type CalendarPlatform,
  TRANSCRIPT_MAP,
  RECORDING_ERROR_MAP,
} from "./calendar-mock-data";

const LANG_CODES = new Set<string>(LANGUAGES.map((l) => l.code));

const LANG_FLAGS: Record<string, string> = {
  en: "\u{1F1EC}\u{1F1E7}",
  ru: "\u{1F1F7}\u{1F1FA}",
  es: "\u{1F1EA}\u{1F1F8}",
  de: "\u{1F1E9}\u{1F1EA}",
  fr: "\u{1F1EB}\u{1F1F7}",
  ja: "\u{1F1EF}\u{1F1F5}",
};

const PLATFORM_LABELS: Record<CalendarPlatform, string> = {
  "google-meet": "Google Meet",
  "zoom": "Zoom",
  "teams": "Microsoft Teams",
};

interface CalendarMeetingCardProps {
  meeting: CalendarMeeting;
  autoJoin: boolean;
  language: LangCode;
  isNextMeeting: boolean;
  isPast: boolean;
  onAutoJoinChange: (checked: boolean) => void;
  onLanguageChange: (lang: LangCode) => void;
  index: number;
}

export function CalendarMeetingCard({
  meeting,
  autoJoin,
  language,
  isNextMeeting,
  isPast,
  onAutoJoinChange,
  onLanguageChange,
  index,
}: CalendarMeetingCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const isLive = !isPast && !!meeting.isLive;
  const transcriptUrl = TRANSCRIPT_MAP[meeting.id];
  const hasTranscript = isPast && !!transcriptUrl;
  const recordingError = isPast ? RECORDING_ERROR_MAP[meeting.id] : undefined;
  const showNotRecorded = isPast && !transcriptUrl && !recordingError;

  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card px-5 py-4 mb-2.5 transition-all duration-150",
        isLive && "border-primary/40 bg-primary/[0.02]",
      )}
      style={{
        animation: `calendarCardEntrance 250ms ease forwards`,
        animationDelay: `${index * 40}ms`,
        opacity: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Time + title + live badge */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[14px] font-semibold tabular-nums shrink-0",
              isPast ? "text-muted-foreground" : "text-foreground",
            )}>
              {meeting.startTime} – {meeting.endTime}
            </span>
            <span className="text-border w-px h-3.5 shrink-0 bg-border" />
            <h4 className={cn(
              "text-[14px] font-semibold truncate leading-snug",
              isPast ? "text-muted-foreground" : "text-foreground",
            )}>
              {meeting.title}
            </h4>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-2.5 py-[3px] text-[11px] font-semibold shrink-0">
                <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
                Recording
              </span>
            )}
          </div>

          {/* Platform + organizer */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <SourceIcon source={meeting.platform} />
            <span className="text-[12px] text-muted-foreground">
              {PLATFORM_LABELS[meeting.platform]}
            </span>
            {meeting.organizerEmail && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-[12px] text-muted-foreground truncate">
                  {meeting.organizerEmail}
                </span>
              </>
            )}
          </div>

          {/* Transcription language */}
          {!isPast && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[12px] text-muted-foreground">
                Transcription language:
              </span>
              <Select value={language} onValueChange={(v) => { if (LANG_CODES.has(v)) onLanguageChange(v as LangCode); }}>
                <SelectTrigger className="h-5 w-auto min-w-[70px] border-none shadow-none bg-transparent px-0 text-[12px] font-medium text-foreground/80 gap-1 hover:text-foreground transition-colors">
                  <span className="text-[11px] leading-none shrink-0">{LANG_FLAGS[language] ?? LANG_FLAGS.en}</span>
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
          )}
        </div>

        {/* Right side: status + actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live: join the ongoing meeting */}
          {isLive && meeting.videoLink && (
            <Button
              variant="default"
              size="sm"
              className="h-7 px-3.5 text-[12px] rounded-full"
              onClick={() => window.open(meeting.videoLink, "_blank", "noopener,noreferrer")}
            >
              {t("calendar.joinMeeting")}
            </Button>
          )}

          {/* Past: completed with a recording */}
          {hasTranscript && (
            <Button
              variant="pill-outline"
              size="sm"
              className="h-7 px-3.5 text-[12px] rounded-full"
              onClick={() => navigate(transcriptUrl)}
            >
              View recording
            </Button>
          )}

          {/* Past: recording failed */}
          {recordingError && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-600 px-2.5 py-[3px] text-[11px] font-medium max-w-[260px]">
              <Icon icon={Alert02Icon} size={12} className="shrink-0" />
              <span className="truncate">{recordingError}</span>
            </span>
          )}

          {/* Past: completed without a recording */}
          {showNotRecorded && (
            <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-[3px] text-[11px] font-medium">
              Not recorded
            </span>
          )}

          {/* Upcoming: hover actions */}
          {!isPast && !isLive && (
            <div className={cn(
              "flex items-center gap-1.5 transition-opacity duration-150",
              isNextMeeting ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}>
              <Button
                variant="pill-outline"
                size="sm"
                className="h-7 px-3.5 text-[12px] rounded-full"
                tabIndex={isNextMeeting || hovered ? 0 : -1}
              >
                {t("calendar.startRecord")}
              </Button>
              {meeting.videoLink && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 px-3.5 text-[12px] rounded-full"
                  tabIndex={isNextMeeting || hovered ? 0 : -1}
                  onClick={() => window.open(meeting.videoLink, "_blank", "noopener,noreferrer")}
                >
                  {t("calendar.joinMeeting")}
                </Button>
              )}
            </div>
          )}

          {/* Upcoming: auto-record toggle */}
          {!isPast && !isLive && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">Auto-record</span>
              <Switch
                checked={autoJoin}
                onCheckedChange={onAutoJoinChange}
                aria-label={autoJoin ? t("calendar.autoRecordOn") : t("calendar.autoRecordOff")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}