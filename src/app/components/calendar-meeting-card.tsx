import { useState } from "react";
import { useNavigate } from "react-router";
import { File01Icon, Alert02Icon } from "@hugeicons/core-free-icons";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import { SourceIcon } from "./source-icons";
import { LANGUAGES, useLanguage, type LangCode } from "./language-context";
import {
  type CalendarMeeting,
  type CalendarPlatform,
  TRANSCRIPT_MAP,
  RECORDING_ERROR_MAP,
  getInitials,
} from "./calendar-mock-data";
import type { FolderItem } from "./folder-context";

export interface FolderOption {
  id: string;
  name: string;
  color: string;
}

export interface TemplateOption {
  id: string;
  name: string;
  emoji: string;
}

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

const FOLDER_PATH = "M13.3333 13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V5.33333C14.6667 4.97971 14.5262 4.64057 14.2761 4.39052C14.0261 4.14048 13.687 4 13.3333 4H8.06667C7.84368 4.00219 7.6237 3.94841 7.42687 3.84359C7.23004 3.73877 7.06264 3.58625 6.94 3.4L6.4 2.6C6.27859 2.41565 6.11332 2.26432 5.919 2.1596C5.72468 2.05488 5.50741 2.00004 5.28667 2H2.66667C2.31304 2 1.97391 2.14048 1.72386 2.39052C1.47381 2.64057 1.33333 2.97971 1.33333 3.33333V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333Z";

function FolderGlyph({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <svg style={{ width: size, height: size }} className="shrink-0" fill="none" viewBox="0 0 16 16">
      <path d={FOLDER_PATH} fill={color} />
    </svg>
  );
}

/** Flatten nested folder tree into a flat list */
function flattenFolders(folders: FolderItem[], depth = 0): FolderOption[] {
  const result: FolderOption[] = [];
  for (const f of folders) {
    result.push({ id: f.id, name: "\u00A0".repeat(depth * 2) + f.name, color: f.color });
    if (f.children) {
      result.push(...flattenFolders(f.children, depth + 1));
    }
  }
  return result;
}

interface CalendarMeetingCardProps {
  meeting: CalendarMeeting;
  autoJoin: boolean;
  language: LangCode;
  isNextMeeting: boolean;
  isPast: boolean;
  folderId: string;
  templateId: string;
  folders: FolderItem[];
  templates: TemplateOption[];
  onAutoJoinChange: (checked: boolean) => void;
  onLanguageChange: (lang: LangCode) => void;
  onFolderChange: (folderId: string) => void;
  onTemplateChange: (templateId: string) => void;
  index: number;
}

export function CalendarMeetingCard({
  meeting,
  autoJoin,
  language,
  isNextMeeting,
  isPast,
  folderId,
  templateId,
  folders,
  templates,
  onAutoJoinChange,
  onLanguageChange,
  onFolderChange,
  onTemplateChange,
  index,
}: CalendarMeetingCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const transcriptUrl = TRANSCRIPT_MAP[meeting.id];
  const hasTranscript = isPast && !!transcriptUrl;
  const recordingError = isPast ? RECORDING_ERROR_MAP[meeting.id] : undefined;
  const showNotRecorded = isPast && !transcriptUrl && !recordingError;

  const flatFolders = flattenFolders(folders);
  const selectedFolder = folderId !== "__none__" ? flatFolders.find((f) => f.id === folderId) : null;
  const selectedTemplate = templateId !== "__none__" ? templates.find((tmpl) => tmpl.id === templateId) : null;

  const maxAvatars = 4;
  const visibleAttendees = meeting.attendees.slice(0, maxAvatars);
  const overflowCount = Math.max(0, meeting.attendees.length - maxAvatars);

  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card px-5 py-4 mb-2.5 transition-all duration-150",
        // no special highlight for next meeting
        autoJoin && !isPast && "bg-primary/[0.02] border-primary/15",
      )}
      style={{
        animation: `calendarCardEntrance 250ms ease forwards`,
        animationDelay: `${index * 40}ms`,
        opacity: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: time | title + right actions */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Time + title on the same line */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[14px] font-semibold tabular-nums shrink-0",
              isPast ? "text-muted-foreground" : "text-foreground",
            )}>
              {meeting.startTime} – {meeting.endTime}
            </span>
            <span className="text-border w-px h-3.5 shrink-0" />
            <h4 className={cn(
              "text-[14px] font-semibold truncate leading-snug",
              isPast ? "text-muted-foreground" : "text-foreground",
            )}>
              {meeting.title}
            </h4>
          </div>

          {/* Subtitle: platform + organizer */}
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
        </div>

        {/* Right side: status + toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Past: View recording button */}
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

          {/* Past: Recording error */}
          {recordingError && (
            <div className="flex items-center gap-1.5 max-w-[240px]">
              <Icon icon={Alert02Icon} size={14} className="text-orange-500 shrink-0" />
              <span className="text-[12px] text-muted-foreground text-right">
                {recordingError}
              </span>
            </div>
          )}

          {/* Past: Not recorded (no error, just wasn't enabled) */}
          {showNotRecorded && (
            <span className="text-[12px] text-muted-foreground">
              Not recorded
            </span>
          )}

          {/* Upcoming: Action buttons */}
          {!isPast && (
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

          {/* Auto-join toggle */}
          {!isPast && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Switch
                    checked={autoJoin}
                    onCheckedChange={onAutoJoinChange}
                    aria-label={autoJoin ? t("calendar.autoRecordOn") : t("calendar.autoRecordOff")}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {autoJoin ? t("calendar.autoRecordOn") : t("calendar.autoRecordOff")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Bottom row: metadata selectors + avatars */}
      <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-[12px]">
            {/* Language selector */}
            <Select value={language} onValueChange={(v) => { if (LANG_CODES.has(v)) onLanguageChange(v as LangCode); }}>
              <SelectTrigger className="h-5 w-auto min-w-[70px] border-none shadow-none bg-transparent px-0 text-[12px] text-muted-foreground gap-1 hover:text-foreground transition-colors">
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

            <span className="text-muted-foreground/60">·</span>

            {/* Folder selector */}
            <Select value={folderId} onValueChange={onFolderChange}>
              <SelectTrigger className="h-5 w-auto min-w-[75px] border-none shadow-none bg-transparent px-0 text-[12px] text-muted-foreground gap-1 hover:text-foreground transition-colors">
                {selectedFolder ? (
                  <FolderGlyph color={selectedFolder.color} size={12} />
                ) : (
                  <FolderGlyph color="oklch(0.552 0.016 285.938 / 0.6)" size={12} />
                )}
                <SelectValue placeholder={t("calendar.noFolder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("calendar.noFolder")}</SelectItem>
                {flattenFolders(folders).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground/60">·</span>

            {/* Template selector */}
            <Select value={templateId} onValueChange={onTemplateChange}>
              <SelectTrigger className="h-5 w-auto min-w-[75px] border-none shadow-none bg-transparent px-0 text-[12px] text-muted-foreground gap-1 hover:text-foreground transition-colors">
                {selectedTemplate ? (
                  <span className="text-[11px] leading-none shrink-0">{selectedTemplate.emoji}</span>
                ) : (
                  <Icon icon={File01Icon} size={11} className="text-muted-foreground/60 shrink-0" />
                )}
                <SelectValue placeholder={t("calendar.noTemplate")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("calendar.noTemplate")}</SelectItem>
                {templates.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Avatars */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {visibleAttendees.map((a) => (
                <div
                  key={a.email}
                  title={a.name}
                  className="size-7 rounded-full border-2 border-card bg-muted flex items-center justify-center"
                >
                  <span className="text-[10px] font-semibold text-muted-foreground leading-none">
                    {getInitials(a.name)}
                  </span>
                </div>
              ))}
            </div>
            {overflowCount > 0 && (
              <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">
                +{overflowCount}
              </span>
            )}
          </div>
        </div>
    </div>
  );
}
