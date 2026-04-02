import { useState, useCallback, useRef, useMemo, useEffect } from "react";
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
import { useFolders } from "./folder-context";
import { CalendarWeekStrip } from "./calendar-week-strip";
import { CalendarMeetingCard, type TemplateOption } from "./calendar-meeting-card";
import { CalendarSidebar } from "./calendar-sidebar";
import {
  generateMockMeetings,
  groupMeetingsByDay,
  getWeekStart,
  toISODate,
  parseISODate,
  formatDayHeader,
  formatWeekendHeader,
  getDayNameFull,
  findNextMeeting,
  formatMonthYearFull,
  TRANSCRIPT_MAP,
  type CalendarMeeting,
  type DayGroup,
} from "./calendar-mock-data";

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const TODAY = new Date(2026, 3, 2); // April 2, 2026
const TODAY_ISO = toISODate(TODAY);
const MOCK_MEETINGS = generateMockMeetings();

const MEETING_FOLDERS_KEY = "ttt_meeting_folders";
const MEETING_TEMPLATES_KEY = "ttt_meeting_templates";

/** Mock templates used as fallback when Supabase templates aren't available */
const MOCK_TEMPLATES: TemplateOption[] = [
  { id: "tmpl_meeting_notes", name: "Meeting Notes", emoji: "\u{1F4CB}" },
  { id: "tmpl_action_items", name: "Action Items", emoji: "\u{2705}" },
  { id: "tmpl_standup", name: "Daily Standup", emoji: "\u{23F1}" },
  { id: "tmpl_retrospective", name: "Retrospective", emoji: "\u{1F504}" },
  { id: "tmpl_one_on_one", name: "1:1 Meeting", emoji: "\u{1F465}" },
];

/* ═══════════════════════════════════════════
   Calendar Page
   ═══════════════════════════════════════════ */

export function CalendarPage() {
  const { t } = useLanguage();
  const { folders } = useFolders();

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

  // Per-meeting folder & template assignments (persisted to localStorage)
  const [meetingFolders, setMeetingFolders] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(MEETING_FOLDERS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const [meetingTemplates, setMeetingTemplates] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(MEETING_TEMPLATES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  // Persist folder/template changes
  useEffect(() => {
    localStorage.setItem(MEETING_FOLDERS_KEY, JSON.stringify(meetingFolders));
  }, [meetingFolders]);

  useEffect(() => {
    localStorage.setItem(MEETING_TEMPLATES_KEY, JSON.stringify(meetingTemplates));
  }, [meetingTemplates]);

  // Use mock templates (real templates come from Supabase which may not be configured)
  const templateOptions: TemplateOption[] = MOCK_TEMPLATES;

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Next meeting computation
  const nextMeeting = useMemo(
    () => findNextMeeting(MOCK_MEETINGS, TODAY_ISO),
    [],
  );

  // Computed data
  const extendedGroups = useMemo(() => {
    const week1 = groupMeetingsByDay(MOCK_MEETINGS, weekStart);
    const extStart = new Date(weekStart);
    extStart.setDate(extStart.getDate() + 7);
    const week2 = groupMeetingsByDay(MOCK_MEETINGS, extStart);
    return [...week1, ...week2];
  }, [weekStart]);

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

  // Sidebar metrics
  const weekTranscribedCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7 && i < extendedGroups.length; i++) {
      for (const m of extendedGroups[i].meetings) {
        if (TRANSCRIPT_MAP[m.id]) count++;
      }
    }
    return count;
  }, [extendedGroups]);

  const weekUpcomingCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7 && i < extendedGroups.length; i++) {
      for (const m of extendedGroups[i].meetings) {
        if (m.date >= TODAY_ISO) count++;
      }
    }
    return count;
  }, [extendedGroups]);

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

  const handleFolderChange = useCallback((meetingId: string, folderId: string) => {
    setMeetingFolders((prev) => ({ ...prev, [meetingId]: folderId }));
  }, []);

  const handleTemplateChange = useCallback((meetingId: string, templateId: string) => {
    setMeetingTemplates((prev) => ({ ...prev, [meetingId]: templateId }));
  }, []);

  const selectedDateObj = useMemo(() => parseISODate(selectedDate), [selectedDate]);

  // Compute selected week days for mini calendar row highlight
  const weekModifiers = useMemo(() => {
    // Get the Sunday-based week that contains weekStart
    // Our weekStart is Thursday-based, so find the Sunday of the row containing the selected date
    const sel = parseISODate(selectedDate);
    const selDow = sel.getDay(); // 0=Sun
    const sun = new Date(sel);
    sun.setDate(sun.getDate() - selDow);

    const weekStart_day = new Date(sun); // Sunday
    const weekEnd_day = new Date(sun);
    weekEnd_day.setDate(weekEnd_day.getDate() + 6); // Saturday

    const middle: Date[] = [];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(sun);
      d.setDate(d.getDate() + i);
      middle.push(d);
    }

    return {
      weekRowStart: [weekStart_day],
      weekRowEnd: [weekEnd_day],
      weekRowMiddle: middle,
    };
  }, [selectedDate]);

  return (
    <TooltipProvider>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex gap-6 px-8 pt-7 pb-0 flex-1 min-w-0">
          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <p className="whitespace-nowrap text-foreground font-bold text-[28px] leading-[33.6px] tracking-[-0.56px]">
                {formatMonthYearFull(weekStart).replace(" ", ", ")}
              </p>
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
            <div className="flex-1 overflow-y-auto mt-4 pb-6 scrollbar-hide">
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
                  meetingFolders={meetingFolders}
                  meetingTemplates={meetingTemplates}
                  folders={folders}
                  templates={templateOptions}
                  onAutoJoinToggle={handleAutoJoinToggle}
                  onLanguageChange={handleLanguageChange}
                  onFolderChange={handleFolderChange}
                  onTemplateChange={handleTemplateChange}
                  prefersReducedMotion={prefersReducedMotion}
                  todayISO={TODAY_ISO}
                  nextMeetingId={nextMeeting?.id ?? null}
                />
              </motion.div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <aside className="w-[280px] shrink-0 hidden lg:flex lg:flex-col space-y-5 overflow-y-auto pb-6">
            {/* Mini calendar */}
            <div className="rounded-2xl border border-border/50 bg-card p-2">
              <MiniCalendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleMiniCalendarSelect}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                today={TODAY}
                className="p-1 w-full mini-cal"
                classNames={{
                  months: "flex flex-col w-full",
                  month: "flex flex-col gap-3 w-full",
                  table: "w-full border-collapse",
                  head_row: "grid grid-cols-7",
                  head_cell: "text-muted-foreground text-center font-normal text-[0.75rem]",
                  row: "grid grid-cols-7 mt-1",
                  cell: "relative p-0.5 text-center text-sm focus-within:relative focus-within:z-20",
                  day: "inline-flex items-center justify-center w-full aspect-square rounded-md text-[13px] font-normal hover:bg-accent transition-colors cursor-pointer aria-selected:opacity-100 relative z-10",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold rounded-lg",
                  day_today: "ring-[1.5px] ring-inset ring-primary text-primary bg-transparent font-semibold rounded-lg",
                  day_outside: "text-muted-foreground/30",
                  caption: "flex justify-center pt-1 relative items-center w-full",
                  caption_label: "text-sm font-medium",
                  nav_button_previous: "absolute left-0",
                  nav_button_next: "absolute right-0",
                }}
                modifiers={{
                  weekRowStart: weekModifiers.weekRowStart,
                  weekRowEnd: weekModifiers.weekRowEnd,
                  weekRowMiddle: weekModifiers.weekRowMiddle,
                }}
                modifiersClassNames={{
                  weekRowStart: "mini-cal-week mini-cal-week-start",
                  weekRowEnd: "mini-cal-week mini-cal-week-end",
                  weekRowMiddle: "mini-cal-week mini-cal-week-mid",
                }}
              />
            </div>

            {/* Calendar sidebar with dots, next meeting, metrics */}
            <CalendarSidebar
              meetings={MOCK_MEETINGS}
              weekStart={weekStart}
              todayISO={TODAY_ISO}
              now={TODAY}
              meetingCounts={meetingCounts}
              weekMeetingCount={weekMeetingCount}
              totalHoursLabel={totalHoursLabel}
              transcribedCount={weekTranscribedCount}
              upcomingCount={weekUpcomingCount}
              nextMeeting={nextMeeting}
            />

            {/* Connected calendars */}
            <ConnectedCalendars />

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
   Meeting List
   ═══════════════════════════════════════════ */

interface MeetingListProps {
  dayGroups: DayGroup[];
  dayRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  autoJoinStates: Record<string, boolean>;
  meetingLanguages: Record<string, LangCode>;
  meetingFolders: Record<string, string>;
  meetingTemplates: Record<string, string>;
  folders: import("./folder-context").FolderItem[];
  templates: TemplateOption[];
  onAutoJoinToggle: (id: string, checked: boolean) => void;
  onLanguageChange: (id: string, lang: LangCode) => void;
  onFolderChange: (id: string, folderId: string) => void;
  onTemplateChange: (id: string, templateId: string) => void;
  prefersReducedMotion: boolean | null;
  todayISO: string;
  nextMeetingId: string | null;
}

function MeetingList({
  dayGroups,
  dayRefs,
  autoJoinStates,
  meetingLanguages,
  meetingFolders,
  meetingTemplates,
  folders,
  templates,
  onAutoJoinToggle,
  onLanguageChange,
  onFolderChange,
  onTemplateChange,
  prefersReducedMotion,
  todayISO,
  nextMeetingId,
}: MeetingListProps) {
  const { t } = useLanguage();
  const rendered: React.ReactNode[] = [];
  let i = 0;
  let cardIndex = 0;

  // Yesterday ISO for empty state filtering
  const yesterdayDate = new Date(parseISODate(todayISO));
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayISO = toISODate(yesterdayDate);

  while (i < dayGroups.length) {
    const group = dayGroups[i];
    const date = parseISODate(group.date);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday = group.date === todayISO;
    const isPastDay = group.date < todayISO;

    // Skip past empty days unless today or yesterday
    if (isPastDay && group.meetings.length === 0 && group.date !== yesterdayISO) {
      // For weekends, check if both days are empty and past
      if (dow === 6 && i + 1 < dayGroups.length) {
        const sundayGroup = dayGroups[i + 1];
        const allMeetings = [...group.meetings, ...sundayGroup.meetings];
        if (allMeetings.length === 0 && sundayGroup.date < todayISO && sundayGroup.date !== yesterdayISO) {
          i += 2;
          continue;
        }
      } else {
        i++;
        continue;
      }
    }

    // Weekend pair
    if (dow === 6 && i + 1 < dayGroups.length) {
      const sundayGroup = dayGroups[i + 1];
      const sundayDate = parseISODate(sundayGroup.date);
      if (sundayDate.getDay() === 0) {
        const allMeetings = [...group.meetings, ...sundayGroup.meetings];
        rendered.push(
          <div
            key={group.date}
            className="mt-6 first:mt-0"
            ref={(el) => {
              dayRefs.current[group.date] = el;
              dayRefs.current[sundayGroup.date] = el;
            }}
          >
            <DayHeader label={formatWeekendHeader(date, sundayDate)} isToday={false} isMuted />
            {allMeetings.length === 0 ? (
              <EmptyDayBanner type="weekend" t={t} />
            ) : (
              allMeetings.map((m) => {
                const idx = cardIndex++;
                return (
                  <CalendarMeetingCard
                    key={m.id}
                    meeting={m}
                    autoJoin={autoJoinStates[m.id] ?? false}
                    language={meetingLanguages[m.id] ?? "en"}
                    isNextMeeting={m.id === nextMeetingId}
                    isPast={m.date < todayISO}
                    folderId={meetingFolders[m.id] ?? "__none__"}
                    templateId={meetingTemplates[m.id] ?? "__none__"}
                    folders={folders}
                    templates={templates}
                    onAutoJoinChange={(c) => onAutoJoinToggle(m.id, c)}
                    onLanguageChange={(l) => onLanguageChange(m.id, l)}
                    onFolderChange={(f) => onFolderChange(m.id, f)}
                    onTemplateChange={(tmpl) => onTemplateChange(m.id, tmpl)}
                    index={idx}
                  />
                );
              })
            )}
          </div>,
        );
        i += 2;
        continue;
      }
    }

    // Regular day
    const staggerDelay = rendered.length * 0.06;

    // Build day header label
    const headerLabel = isToday
      ? `${t("calendar.today")} \u00b7 ${getDayNameFull(date)}, ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
      : formatDayHeader(date);

    // Empty state type
    const emptyType: EmptyStateType = isWeekend
      ? "weekend"
      : isPastDay
        ? "past"
        : "future";

    rendered.push(
      <motion.div
        key={group.date}
        className="mt-6 first:mt-0"
        ref={(el: HTMLDivElement | null) => { dayRefs.current[group.date] = el; }}
        {...(prefersReducedMotion
          ? {}
          : {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3, delay: staggerDelay, ease: [0.22, 1, 0.36, 1] },
            })}
      >
        <DayHeader label={headerLabel} isToday={isToday} isMuted={isPastDay && !isToday} />
        {group.meetings.length === 0 ? (
          <EmptyDayBanner type={emptyType} t={t} />
        ) : (
          group.meetings.map((m) => {
            const idx = cardIndex++;
            return (
              <CalendarMeetingCard
                key={m.id}
                meeting={m}
                autoJoin={autoJoinStates[m.id] ?? false}
                language={meetingLanguages[m.id] ?? "en"}
                isNextMeeting={m.id === nextMeetingId}
                isPast={m.date < todayISO}
                folderId={meetingFolders[m.id] ?? "__none__"}
                templateId={meetingTemplates[m.id] ?? "__none__"}
                folders={folders}
                templates={templates}
                onAutoJoinChange={(c) => onAutoJoinToggle(m.id, c)}
                onLanguageChange={(l) => onLanguageChange(m.id, l)}
                onFolderChange={(f) => onFolderChange(m.id, f)}
                onTemplateChange={(tmpl) => onTemplateChange(m.id, tmpl)}
                index={idx}
              />
            );
          })
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

/* ═══════════════════════════════════════════
   Connected Calendars
   ═══════════════════════════════════════════ */

const MOCK_CALENDARS = [
  { id: "cal_1", name: "kutskirill22@gmail.com", color: "#4285F4", isDefault: true },
  { id: "cal_2", name: "Holidays in Belarus", color: "#0D9488", isDefault: false },
];

function ConnectedCalendars() {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of MOCK_CALENDARS) init[c.id] = true;
    return init;
  });

  return (
    <div className="rounded-2xl border border-border/50 bg-card px-4 py-3.5">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
        {t("calendar.myCalendars")}
      </h4>
      <div className="flex flex-col gap-2.5">
        {MOCK_CALENDARS.map((cal) => (
          <div key={cal.id} className="flex items-center gap-2.5">
            <button
              onClick={() => setEnabled((prev) => ({ ...prev, [cal.id]: !prev[cal.id] }))}
              className="flex items-center justify-center shrink-0"
              aria-label={`Toggle ${cal.name}`}
            >
              <div
                className={cn(
                  "size-4 rounded flex items-center justify-center transition-all duration-150",
                  enabled[cal.id]
                    ? "border-[1.5px]"
                    : "border-[1.5px] border-muted-foreground/25 bg-transparent",
                )}
                style={enabled[cal.id] ? { backgroundColor: cal.color, borderColor: cal.color } : undefined}
              >
                {enabled[cal.id] && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                    <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
            <span className={cn(
              "text-[12px] truncate flex-1 transition-colors",
              enabled[cal.id] ? "text-foreground/80" : "text-muted-foreground/40 line-through",
            )}>
              {cal.name}
            </span>
            {cal.isDefault && (
              <span className="text-[10px] text-muted-foreground/40 shrink-0">
                {t("calendar.default")}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Add calendar button */}
      <button
        className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30 w-full text-[12px] text-primary hover:text-primary/80 transition-colors"
        onClick={() => toast(t("common.comingSoon"))}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {t("calendar.addCalendar")}
      </button>
    </div>
  );
}

function DayHeader({ label, isToday }: { label: string; isToday: boolean; isMuted?: boolean }) {
  return (
    <div className="mb-3">
      <h3 className={cn(
        "text-[14px] font-semibold tracking-tight text-foreground",
        isToday && "text-foreground",
      )}>
        {label}
      </h3>
    </div>
  );
}

type EmptyStateType = "weekend" | "future" | "past";

const EMPTY_MESSAGES: Record<EmptyStateType, { emoji: string; key: string }> = {
  future: { emoji: "\u{1F331}", key: "calendar.clearDay" },
  weekend: { emoji: "\u{2615}", key: "calendar.emptyWeekend" },
  past: { emoji: "\u{2014}", key: "calendar.noMeetingsPast" },
};

function EmptyDayBanner({ type, t }: { type: EmptyStateType; t: (key: string) => string }) {
  if (type === "past") {
    return (
      <div className="py-3 pl-4">
        <span className="text-[12px] text-muted-foreground/30 italic">
          {t("calendar.noMeetingsPast")}
        </span>
      </div>
    );
  }

  const msg = EMPTY_MESSAGES[type];
  const gradientClass = type === "weekend"
    ? "from-blue-50/60 to-indigo-50/30"
    : "from-emerald-50/50 to-teal-50/20";

  return (
    <div className={cn(
      "rounded-xl bg-gradient-to-r py-6 px-6 flex items-center justify-center gap-2.5",
      gradientClass,
    )}>
      <span className="text-[16px]">{msg.emoji}</span>
      <span className="text-[13px] text-muted-foreground/70 font-medium">
        {t(msg.key)}
      </span>
    </div>
  );
}
