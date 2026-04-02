import { ArrowUpRight } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { SourceIcon } from "./source-icons";
import { useLanguage } from "./language-context";
import {
  type CalendarMeeting,
  toISODate,
  formatCountdown,
} from "./calendar-mock-data";

/* ═══════════════════════════════════════════
   Platform dot colors (reused from page)
   ═══════════════════════════════════════════ */

const PLATFORM_DOT_COLORS: Record<string, string> = {
  "google-meet": "bg-[#00832D]",
  "zoom": "bg-[#2D8CFF]",
  "teams": "bg-[#6264A7]",
};

/* ═══════════════════════════════════════════
   Day names for the week load section
   ═══════════════════════════════════════════ */

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

interface CalendarSidebarProps {
  meetings: ReadonlyArray<CalendarMeeting>;
  weekStart: Date;
  todayISO: string;
  now: Date;
  meetingCounts: Record<string, number>;
  weekMeetingCount: number;
  totalHoursLabel: string;
  transcribedCount: number;
  upcomingCount: number;
  nextMeeting: CalendarMeeting | null;
}

export function CalendarSidebar({
  meetings,
  weekStart,
  todayISO,
  now,
  meetingCounts,
  weekMeetingCount,
  totalHoursLabel,
  transcribedCount,
  upcomingCount,
  nextMeeting,
}: CalendarSidebarProps) {
  const { t } = useLanguage();

  // Build weekday dates (Mon-Fri) for the current week
  const weekdays = getWeekdayDates(weekStart);

  const pastCount = weekMeetingCount - upcomingCount;

  return (
    <div className="space-y-4">
      {/* ── Week Load (day dots) ── */}
      <div className="rounded-xl border border-border/50 bg-card p-3.5">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("calendar.weekLoad")}
        </h4>
        <div className="space-y-2">
          {weekdays.map(({ label, dateISO }) => {
            const count = meetingCounts[dateISO] ?? 0;
            const filled = Math.min(count, 5);
            return (
              <div key={dateISO} className="flex items-center gap-2.5">
                <span className={cn(
                  "text-[11px] font-medium w-7",
                  dateISO === todayISO ? "text-primary font-semibold" : "text-muted-foreground",
                )}>
                  {label}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "size-2 rounded-full",
                        i < filled ? "bg-primary" : "bg-muted-foreground/20",
                      )}
                    />
                  ))}
                </div>
                {count > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-auto">{count}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Next Meeting ── */}
      <div className="rounded-xl border border-border/50 bg-card p-3.5">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          {t("calendar.nextMeeting")}
        </h4>
        {nextMeeting ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SourceIcon source={nextMeeting.platform} />
              <span className="text-[13px] font-medium text-foreground truncate">
                {nextMeeting.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">
                {nextMeeting.startTime} – {nextMeeting.endTime}
              </span>
              <span className="text-[11px] text-primary font-medium">
                {formatCountdown(nextMeeting.date, nextMeeting.startTime, now)}
              </span>
            </div>
            {nextMeeting.videoLink && (
              <Button
                variant="default"
                size="sm"
                className="w-full h-7 text-[12px] gap-1 rounded-full mt-1"
                onClick={() => window.open(nextMeeting.videoLink, "_blank", "noopener,noreferrer")}
              >
                {t("calendar.joinMeeting")}
                <Icon icon={ArrowUpRight} size={12} />
              </Button>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground/60">
            {t("calendar.noUpcomingMeetings")}
          </p>
        )}
      </div>

      {/* ── Metrics ── */}
      <div className="rounded-xl border border-border/50 bg-card p-3.5">
        <div className="grid grid-cols-2 gap-3">
          <MetricCell value={weekMeetingCount} label={t("calendar.meetings")} />
          <MetricCell value={totalHoursLabel} label={t("calendar.meetingTime")} />
          <MetricCell value={transcribedCount} label={t("calendar.transcribedCount")} />
          <MetricCell
            value={`${upcomingCount} / ${pastCount}`}
            label={`${t("calendar.upcoming")} / Past`}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

function MetricCell({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-[18px] font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/** Get Mon-Fri dates for the week that contains weekStart */
function getWeekdayDates(weekStart: Date): { label: string; dateISO: string }[] {
  const result: { label: string; dateISO: string }[] = [];

  // Find the Monday of this week
  const start = new Date(weekStart);
  const startDow = start.getDay();
  // Adjust to Monday: if weekStart is Thu(4), Monday is 3 days before
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
  const monday = new Date(start);
  monday.setDate(start.getDate() + mondayOffset);

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    result.push({
      label: WEEKDAY_LABELS[i],
      dateISO: toISODate(d),
    });
  }

  return result;
}
