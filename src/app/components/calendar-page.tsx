import { useState, useCallback, useRef, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Settings,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Calendar as MiniCalendar } from "@/app/components/ui/calendar";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import { toast } from "sonner";
import { useLanguage, type LangCode } from "./language-context";
import { CalendarWeekStrip } from "./calendar-week-strip";
import { CalendarMeetingCard } from "./calendar-meeting-card";
import {
  generateMockMeetings,
  groupMeetingsByDay,
  getWeekStart,
  toISODate,
  parseISODate,
  formatDayHeader,
  formatWeekendHeader,
  formatMonthYearFull,
  type CalendarMeeting,
  type DayGroup,
} from "./calendar-mock-data";

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const TODAY = new Date(2026, 3, 2); // April 2, 2026
const TODAY_ISO = toISODate(TODAY);
const MOCK_MEETINGS = generateMockMeetings();

const PLATFORM_DOT_COLORS: Record<string, string> = {
  "google-meet": "bg-[#00832D]",
  "zoom": "bg-[#2D8CFF]",
  "teams": "bg-[#6264A7]",
};

/* ═══════════════════════════════════════════
   Calendar Page
   ═══════════════════════════════════════════ */

export function CalendarPage() {
  const { t } = useLanguage();

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(TODAY));
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [calendarMonth, setCalendarMonth] = useState<Date>(TODAY);
  const prefersReducedMotion = useReducedMotion();

  // Per-meeting state (immutable updates)
  const [autoJoinStates, setAutoJoinStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const m of MOCK_MEETINGS) { initial[m.id] = m.autoJoin; }
    return initial;
  });

  const [meetingLanguages, setMeetingLanguages] = useState<Record<string, LangCode>>(() => {
    const initial: Record<string, LangCode> = {};
    for (const m of MOCK_MEETINGS) { initial[m.id] = m.language; }
    return initial;
  });

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Computed data
  const extendedGroups = useMemo(() => {
    const week1 = groupMeetingsByDay(MOCK_MEETINGS, weekStart);
    const extStart = new Date(weekStart);
    extStart.setDate(extStart.getDate() + 7);
    const week2 = groupMeetingsByDay(MOCK_MEETINGS, extStart);
    return [...week1, ...week2];
  }, [weekStart]);

  const monthYearLabel = useMemo(() => formatMonthYearFull(weekStart), [weekStart]);

  const meetingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MOCK_MEETINGS) { counts[m.date] = (counts[m.date] ?? 0) + 1; }
    return counts;
  }, []);

  const weekMeetingCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7 && i < extendedGroups.length; i++) {
      count += extendedGroups[i].meetings.length;
    }
    return count;
  }, [extendedGroups]);

  const totalHoursLabel = useMemo(() => {
    let totalMinutes = 0;
    for (let i = 0; i < 7 && i < extendedGroups.length; i++) {
      for (const m of extendedGroups[i].meetings) {
        const [sh, sm] = m.startTime.split(":").map(Number);
        const [eh, em] = m.endTime.split(":").map(Number);
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
      }
    }
    const h = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    return min > 0 ? `${h}h ${min}m` : `${h}h`;
  }, [extendedGroups]);

  const todayMeetings = useMemo(
    () => MOCK_MEETINGS.filter((m) => m.date === TODAY_ISO),
    [],
  );

  // Handlers
  const handleWeekChange = useCallback((direction: "prev" | "next") => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
      return next;
    });
  }, []);

  const handleGoToday = useCallback(() => {
    setWeekStart(getWeekStart(TODAY));
    setSelectedDate(TODAY_ISO);
    setCalendarMonth(TODAY);
    const ref = dayRefs.current[TODAY_ISO];
    if (ref) ref.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleDaySelect = useCallback((dateISO: string) => {
    setSelectedDate(dateISO);
    const selectedD = parseISODate(dateISO);
    setWeekStart(getWeekStart(selectedD));
    setCalendarMonth(selectedD);
    setTimeout(() => {
      const ref = dayRefs.current[dateISO];
      if (ref) ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const handleMiniCalendarSelect = useCallback((day: Date | undefined) => {
    if (!day) return;
    handleDaySelect(toISODate(day));
  }, [handleDaySelect]);

  const handleAutoJoinToggle = useCallback((meetingId: string, checked: boolean) => {
    setAutoJoinStates((prev) => ({ ...prev, [meetingId]: checked }));
  }, []);

  const handleLanguageChange = useCallback((meetingId: string, lang: LangCode) => {
    setMeetingLanguages((prev) => ({ ...prev, [meetingId]: lang }));
  }, []);

  const selectedDateObj = useMemo(() => parseISODate(selectedDate), [selectedDate]);

  return (
    <TooltipProvider>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex gap-6 px-8 pt-7 pb-0 flex-1 min-w-0">
          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header — sticky */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="whitespace-nowrap text-foreground font-bold text-[28px] leading-[33.6px] tracking-[-0.56px]">
                  {t("nav.calendar")}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {monthYearLabel} &middot; {weekMeetingCount} {t("calendar.meetingsWeek")}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="pill-outline"
                  size="icon"
                  className="size-8"
                  onClick={() => handleWeekChange("prev")}
                  aria-label={t("calendar.prevWeek")}
                >
                  <Icon icon={ChevronLeft} size={14} />
                </Button>
                <Button
                  variant="pill-outline"
                  className="h-8 px-3 text-[13px] font-medium"
                  onClick={handleGoToday}
                >
                  {t("calendar.today")}
                </Button>
                <Button
                  variant="pill-outline"
                  size="icon"
                  className="size-8"
                  onClick={() => handleWeekChange("next")}
                  aria-label={t("calendar.nextWeek")}
                >
                  <Icon icon={ChevronRight} size={14} />
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
                <Button
                  variant="pill-outline"
                  size="icon"
                  className="size-8"
                  onClick={() => toast(t("common.comingSoon"))}
                  aria-label={t("profile.settings")}
                >
                  <Icon icon={Settings} size={14} />
                </Button>
              </div>
            </div>

            {/* Week strip */}
            <div className="mt-4">
              <CalendarWeekStrip
                weekStart={weekStart}
                selectedDate={selectedDate}
                todayISO={TODAY_ISO}
                meetingCounts={meetingCounts}
                onDaySelect={handleDaySelect}
              />
            </div>

            {/* Meeting list — scrollable area */}
            <div className="flex-1 overflow-y-auto mt-4 pb-6">
              <motion.div
                key={weekStart.toISOString()}
                initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <MeetingList
                  dayGroups={extendedGroups}
                  dayRefs={dayRefs}
                  autoJoinStates={autoJoinStates}
                  meetingLanguages={meetingLanguages}
                  onAutoJoinToggle={handleAutoJoinToggle}
                  onLanguageChange={handleLanguageChange}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </motion.div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <aside className="w-[260px] shrink-0 hidden lg:flex lg:flex-col space-y-5 overflow-y-auto pb-6">
            {/* Mini calendar */}
            <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-sm">
              <MiniCalendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleMiniCalendarSelect}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                today={TODAY}
                className="p-1"
              />
            </div>

            {/* Today's agenda */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {t("calendar.todayAgenda")}
              </h4>
              {todayMeetings.length === 0 ? (
                <p className="text-[13px] text-muted-foreground/60 px-1">
                  {t("calendar.noMeetingsToday")}
                </p>
              ) : (
                todayMeetings.map((m) => (
                  <SidebarMeetingItem key={m.id} meeting={m} />
                ))
              )}
            </div>

            {/* Quick stats */}
            <div className="rounded-xl border border-border/60 bg-card p-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[20px] font-semibold text-foreground">{weekMeetingCount}</p>
                  <p className="text-[11px] text-muted-foreground">{t("calendar.thisWeek")}</p>
                </div>
                <div>
                  <p className="text-[20px] font-semibold text-foreground">{totalHoursLabel}</p>
                  <p className="text-[11px] text-muted-foreground">{t("calendar.hoursTotal")}</p>
                </div>
              </div>
            </div>

            {/* Schedule CTA */}
            <div className="px-1">
              <Button variant="pill-outline" className="w-full gap-1.5 text-[13px]">
                <Icon icon={ArrowUpRight} size={14} />
                {t("calendar.startScheduling")}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ═══════════════════════════════════════════
   Sidebar Meeting Item
   ═══════════════════════════════════════════ */

function SidebarMeetingItem({ meeting }: { meeting: CalendarMeeting }) {
  return (
    <div className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer">
      <div className={cn("size-1.5 rounded-full shrink-0", PLATFORM_DOT_COLORS[meeting.platform] ?? "bg-primary")} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">{meeting.title}</p>
        <p className="text-[11px] text-muted-foreground">{meeting.startTime} - {meeting.endTime}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Meeting List
   ═══════════════════════════════════════════ */

interface MeetingListProps {
  dayGroups: DayGroup[];
  dayRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  autoJoinStates: Record<string, boolean>;
  meetingLanguages: Record<string, LangCode>;
  onAutoJoinToggle: (id: string, checked: boolean) => void;
  onLanguageChange: (id: string, lang: LangCode) => void;
  prefersReducedMotion: boolean | null;
}

function MeetingList({
  dayGroups,
  dayRefs,
  autoJoinStates,
  meetingLanguages,
  onAutoJoinToggle,
  onLanguageChange,
  prefersReducedMotion,
}: MeetingListProps) {
  const { t } = useLanguage();
  const rendered: React.ReactNode[] = [];
  let i = 0;

  while (i < dayGroups.length) {
    const group = dayGroups[i];
    const date = parseISODate(group.date);

    // Weekend pair
    if (date.getDay() === 6 && i + 1 < dayGroups.length) {
      const sundayGroup = dayGroups[i + 1];
      const sundayDate = parseISODate(sundayGroup.date);
      if (sundayDate.getDay() === 0) {
        const allMeetings = [...group.meetings, ...sundayGroup.meetings];
        rendered.push(
          <div
            key={group.date}
            ref={(el) => {
              dayRefs.current[group.date] = el;
              dayRefs.current[sundayGroup.date] = el;
            }}
          >
            <DayHeader label={formatWeekendHeader(date, sundayDate)} />
            {allMeetings.length === 0 ? (
              <EmptyDayBanner message={t("calendar.noMeetings")} />
            ) : (
              allMeetings.map((m) => (
                <CalendarMeetingCard
                  key={m.id}
                  meeting={m}
                  autoJoin={autoJoinStates[m.id] ?? false}
                  language={meetingLanguages[m.id] ?? "en"}
                  onAutoJoinChange={(c) => onAutoJoinToggle(m.id, c)}
                  onLanguageChange={(l) => onLanguageChange(m.id, l)}
                />
              ))
            )}
          </div>,
        );
        i += 2;
        continue;
      }
    }

    // Regular day
    const staggerDelay = rendered.length * 0.06;
    rendered.push(
      <motion.div
        key={group.date}
        ref={(el: HTMLDivElement | null) => { dayRefs.current[group.date] = el; }}
        {...(prefersReducedMotion
          ? {}
          : {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3, delay: staggerDelay, ease: [0.22, 1, 0.36, 1] },
            })}
      >
        <DayHeader label={formatDayHeader(date)} />
        {group.meetings.length === 0 ? (
          <EmptyDayBanner message={t("calendar.noMeetings")} />
        ) : (
          group.meetings.map((m) => (
            <CalendarMeetingCard
              key={m.id}
              meeting={m}
              autoJoin={autoJoinStates[m.id] ?? false}
              language={meetingLanguages[m.id] ?? "en"}
              onAutoJoinChange={(c) => onAutoJoinToggle(m.id, c)}
              onLanguageChange={(l) => onLanguageChange(m.id, l)}
            />
          ))
        )}
      </motion.div>,
    );
    i++;
  }

  return <>{rendered}</>;
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function DayHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-3 first:mt-0">
      <h3 className="text-[13px] font-semibold text-foreground whitespace-nowrap">
        {label}
      </h3>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

function EmptyDayBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 py-3 px-4">
      <div className="size-1.5 rounded-full bg-muted-foreground/30" />
      <span className="text-[13px] text-muted-foreground/70">{message}</span>
    </div>
  );
}
