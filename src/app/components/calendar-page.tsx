import { useState, useCallback, useRef, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Calendar,
  Settings,
  ArrowUpRight,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
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

  // Group meetings for the current week view
  const dayGroups = useMemo(
    () => groupMeetingsByDay(MOCK_MEETINGS, weekStart),
    [weekStart],
  );

  // Also show meetings beyond the current week (continuous scroll)
  const extendedGroups = useMemo(() => {
    const extStart = new Date(weekStart);
    extStart.setDate(extStart.getDate() + 7);
    const extraWeek = groupMeetingsByDay(MOCK_MEETINGS, extStart);
    return [...dayGroups, ...extraWeek];
  }, [dayGroups, weekStart]);

  const handleWeekChange = useCallback((direction: "prev" | "next") => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
      return next;
    });
    // Brief loading effect
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const handleDaySelect = useCallback((dateISO: string) => {
    setSelectedDate(dateISO);
    const ref = dayRefs.current[dateISO];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAutoJoinToggle = useCallback((meetingId: string, checked: boolean) => {
    setAutoJoinStates((prev) => ({ ...prev, [meetingId]: checked }));
  }, []);

  const handleLanguageChange = useCallback((meetingId: string, lang: LangCode) => {
    setMeetingLanguages((prev) => ({ ...prev, [meetingId]: lang }));
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex gap-6 px-[32px] pt-[28px] pb-[24px]">
        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <p
              className="whitespace-nowrap text-foreground"
              style={{ fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", letterSpacing: "-0.56px" }}
            >
              {t("calendar.title")}
            </p>
            <div className="flex items-center gap-[8px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="pill-outline"
                    className="flex items-center gap-[7px] h-9 px-[16px] shrink-0 transition-colors cursor-pointer"
                  >
                    <Icon icon={Calendar} className="size-[15px] text-foreground" strokeWidth={1.5} />
                    <span className="font-medium text-[13px] text-foreground">{t("calendar.allCalendars")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Google Calendar</DropdownMenuItem>
                  <DropdownMenuItem>Outlook Calendar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="pill-outline"
                className="flex items-center gap-[7px] size-9 p-0 shrink-0 transition-colors cursor-pointer"
              >
                <Icon icon={Settings} className="size-[15px] text-foreground" strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          {/* Week strip */}
          <CalendarWeekStrip
            weekStart={weekStart}
            selectedDate={selectedDate}
            todayISO={TODAY_ISO}
            onWeekChange={handleWeekChange}
            onDaySelect={handleDaySelect}
          />

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

        {/* ── Sidebar ── */}
        <aside className="w-[280px] shrink-0 hidden lg:block">
          <SchedulerSidebar />
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

  // Merge weekend days into combined groups
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
        // Combined weekend
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
              <EmptyDayBanner message={t("calendar.noMeetings")} index={rendered.length} />
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
          <EmptyDayBanner message={t("calendar.noMeetings")} index={rendered.length} />
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
    <h3 className="text-[15px] font-semibold text-foreground mt-5 mb-2 first:mt-0">
      {label}
    </h3>
  );
}

function EmptyDayBanner({ message, index }: { message: string; index: number }) {
  const emojis = ["\u2728", "\u{1F60A}"];
  const emoji = emojis[index % emojis.length];

  return (
    <div className="flex items-center justify-center rounded-xl bg-primary/[0.03] py-4 px-4 mb-2">
      <span className="text-sm text-muted-foreground">
        {emoji} {message}
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

function SchedulerSidebar() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Scheduler card */}
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={Calendar} size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {t("calendar.scheduler")}
        </span>
      </div>

      {/* Illustration placeholder */}
      <div className="flex items-center justify-center h-[120px] rounded-xl bg-muted/50 overflow-hidden">
        <div className="flex items-center gap-2 opacity-40">
          <div className="w-8 h-10 rounded bg-primary/20" />
          <div className="flex flex-col gap-1">
            <div className="w-14 h-1.5 rounded-full bg-primary/30" />
            <div className="w-10 h-1.5 rounded-full bg-primary/20" />
            <div className="w-12 h-1.5 rounded-full bg-primary/20" />
            <div className="w-8 h-1.5 rounded-full bg-primary/10" />
          </div>
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="flex flex-col gap-1">
            <div className="w-10 h-1 rounded-full bg-border" />
            <div className="w-12 h-1 rounded-full border border-dashed border-border" />
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center leading-relaxed px-2">
        {t("calendar.schedulerDesc")}
      </p>

      <Button variant="outline" className="w-full rounded-full gap-1.5">
        <Icon icon={ArrowUpRight} size={14} />
        {t("calendar.startScheduling")}
      </Button>
    </div>
  );
}
