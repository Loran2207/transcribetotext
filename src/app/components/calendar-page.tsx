import { useState, useCallback, useRef, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Calendar as MiniCalendar } from "@/app/components/ui/calendar";
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
  type DayGroup,
} from "./calendar-mock-data";

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const TODAY = new Date(2026, 3, 2); // April 2, 2026 — matches reference
const TODAY_ISO = toISODate(TODAY);
const MOCK_MEETINGS = generateMockMeetings();
const FREE_LIMIT = 20;
const FREE_USED = 0;

/* ═══════════════════════════════════════════
   Calendar Page
   ═══════════════════════════════════════════ */

export function CalendarPage() {
  const { t } = useLanguage();

  // Week navigation
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(TODAY));
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);

  // Mini calendar month
  const [calendarMonth, setCalendarMonth] = useState<Date>(TODAY);

  // Accessibility
  const prefersReducedMotion = useReducedMotion();

  // Per-meeting state (immutable updates)
  const [autoJoinStates, setAutoJoinStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const m of MOCK_MEETINGS) {
      initial[m.id] = m.autoJoin;
    }
    return initial;
  });

  const [meetingLanguages, setMeetingLanguages] = useState<Record<string, LangCode>>(() => {
    const initial: Record<string, LangCode> = {};
    for (const m of MOCK_MEETINGS) {
      initial[m.id] = m.language;
    }
    return initial;
  });

  // Loading simulation (brief skeleton on week change)
  const [isLoading, setIsLoading] = useState(false);

  // Day group refs for scroll-to
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Group meetings for the current week view + next week
  const extendedGroups = useMemo(() => {
    const week1 = groupMeetingsByDay(MOCK_MEETINGS, weekStart);
    const extStart = new Date(weekStart);
    extStart.setDate(extStart.getDate() + 7);
    const week2 = groupMeetingsByDay(MOCK_MEETINGS, extStart);
    return [...week1, ...week2];
  }, [weekStart]);

  // Month/year label derived from weekStart
  const monthYearLabel = useMemo(() => formatMonthYearFull(weekStart), [weekStart]);

  const handleWeekChange = useCallback((direction: "prev" | "next") => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
      return next;
    });
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
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
    // Update week strip if the selected day is outside the current week
    const selectedD = parseISODate(dateISO);
    const newWeekStart = getWeekStart(selectedD);
    setWeekStart(newWeekStart);
    setCalendarMonth(selectedD);
    // Scroll to that day
    setTimeout(() => {
      const ref = dayRefs.current[dateISO];
      if (ref) ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const handleMiniCalendarSelect = useCallback((day: Date | undefined) => {
    if (!day) return;
    const iso = toISODate(day);
    handleDaySelect(iso);
  }, [handleDaySelect]);

  const handleAutoJoinToggle = useCallback((meetingId: string, checked: boolean) => {
    setAutoJoinStates((prev) => ({ ...prev, [meetingId]: checked }));
  }, []);

  const handleLanguageChange = useCallback((meetingId: string, lang: LangCode) => {
    setMeetingLanguages((prev) => ({ ...prev, [meetingId]: lang }));
  }, []);

  const selectedDateObj = useMemo(() => parseISODate(selectedDate), [selectedDate]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex gap-8 px-[32px] pt-[28px] pb-[24px]">
        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="whitespace-nowrap text-foreground font-bold text-[28px] leading-[33.6px] tracking-[-0.56px]">
                {t("nav.calendar")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {monthYearLabel}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
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
            </div>
          </div>

          {/* Week strip */}
          <div className="mt-4">
            <CalendarWeekStrip
              weekStart={weekStart}
              selectedDate={selectedDate}
              todayISO={TODAY_ISO}
              onDaySelect={handleDaySelect}
            />
          </div>

          {/* Usage banner */}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/5 px-4 py-2.5">
            <span className="text-sm text-foreground">
              {FREE_USED}/{FREE_LIMIT} {t("calendar.freeLeft")}
            </span>
            <Button variant="link" className="text-sm font-medium p-0 h-auto">
              {t("calendar.upgrade")}
            </Button>
          </div>

          {/* Meeting list */}
          <div className="mt-5 space-y-1">
            {isLoading ? (
              <LoadingSkeletons />
            ) : (
              <MeetingList
                dayGroups={extendedGroups}
                dayRefs={dayRefs}
                autoJoinStates={autoJoinStates}
                meetingLanguages={meetingLanguages}
                onAutoJoinToggle={handleAutoJoinToggle}
                onLanguageChange={handleLanguageChange}
                prefersReducedMotion={prefersReducedMotion}
              />
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="w-[280px] shrink-0 hidden lg:block pt-1">
          {/* Mini month calendar */}
          <MiniCalendar
            mode="single"
            selected={selectedDateObj}
            onSelect={handleMiniCalendarSelect}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            today={TODAY}
            className="rounded-xl border border-border p-3"
          />

          {/* Scheduler CTA */}
          <div className="mt-5 px-2">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t("calendar.schedulerDesc")}
            </p>
            <Button variant="pill-outline" className="w-full mt-3 gap-1.5">
              <Icon icon={ArrowUpRight} size={14} />
              {t("calendar.startScheduling")}
            </Button>
          </div>
        </aside>
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

    // Check for Saturday + Sunday pair
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
    <h3 className="text-[14px] font-semibold text-foreground mt-6 mb-2 pb-2 border-b border-border/50 first:mt-0">
      {label}
    </h3>
  );
}

function EmptyDayBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-muted/30 py-3.5 px-4 mb-1">
      <span className="text-sm text-muted-foreground">
        {message}
      </span>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="space-y-4 mt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
