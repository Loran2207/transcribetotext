import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  FlashIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { cn } from "@/app/components/ui/utils";
import { useCalendars } from "@/hooks/use-calendars";
import { useLanguage, type LangCode } from "./language-context";
import { useFolders } from "./folder-context";
import { useTranscriptionModals } from "./transcription-modals";
import { CalendarWeekStrip } from "./calendar-week-strip";
import { CalendarMeetingCard, type TemplateOption } from "./calendar-meeting-card";
import {
  generateMockMeetings,
  getWeekStart,
  toISODate,
  parseISODate,
  findNextMeeting,
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

const MOCK_TEMPLATES: TemplateOption[] = [
  { id: "tmpl_meeting_notes", name: "Meeting Notes", emoji: "\u{1F4CB}" },
  { id: "tmpl_action_items", name: "Action Items", emoji: "\u{2705}" },
  { id: "tmpl_standup", name: "Daily Standup", emoji: "\u{23F1}" },
  { id: "tmpl_retrospective", name: "Retrospective", emoji: "\u{1F504}" },
  { id: "tmpl_one_on_one", name: "1:1 Meeting", emoji: "\u{1F465}" },
];

const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format date as "Today", "Tomorrow", or "Friday, 3 Apr" */
function formatGroupHeader(dateISO: string, todayISO: string): string {
  const d = parseISODate(dateISO);
  const tomorrowDate = new Date(parseISODate(todayISO));
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowISO = toISODate(tomorrowDate);

  if (dateISO === todayISO) return "Today";
  if (dateISO === tomorrowISO) return "Tomorrow";

  const dayName = WEEKDAY_FULL[d.getDay()];
  const dayNum = d.getDate();
  const month = MONTH_SHORT[d.getMonth()];
  return `${dayName}, ${dayNum} ${month}`;
}

/* ═══════════════════════════════════════════
   Calendar Page
   ═══════════════════════════════════════════ */

type MeetingsTab = "upcoming" | "past";
type AutoRecordMode = "all" | "manual";

export function CalendarPage() {
  const { t } = useLanguage();
  const { folders } = useFolders();
  const { setOpenModal } = useTranscriptionModals();

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(TODAY));
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [activeTab, setActiveTab] = useState<MeetingsTab>("upcoming");
  const [autoRecordMode, setAutoRecordMode] = useState<AutoRecordMode>("all");

  // Show "Today" button only when navigated away from the current week
  const isOnCurrentWeek = useMemo(() => {
    const currentWeekStart = getWeekStart(TODAY);
    return weekStart.getTime() === currentWeekStart.getTime();
  }, [weekStart]);
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

  useEffect(() => {
    localStorage.setItem(MEETING_FOLDERS_KEY, JSON.stringify(meetingFolders));
  }, [meetingFolders]);

  useEffect(() => {
    localStorage.setItem(MEETING_TEMPLATES_KEY, JSON.stringify(meetingTemplates));
  }, [meetingTemplates]);

  const templateOptions: TemplateOption[] = MOCK_TEMPLATES;
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Group all meetings by date
  const allGroups = useMemo(() => {
    const dateSet = new Set<string>();
    for (const m of MOCK_MEETINGS) dateSet.add(m.date);
    const sortedDates = [...dateSet].sort();
    return sortedDates.map((date) => ({
      date,
      meetings: MOCK_MEETINGS.filter((m) => m.date === date),
    }));
  }, []);

  // Meeting counts per day (for week strip dots)
  const meetingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MOCK_MEETINGS) { counts[m.date] = (counts[m.date] ?? 0) + 1; }
    return counts;
  }, []);

  const nextMeeting = useMemo(
    () => findNextMeeting(MOCK_MEETINGS, TODAY_ISO),
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
  }, []);

  const handleDaySelect = useCallback((dateISO: string) => {
    setSelectedDate(dateISO);
    const selectedD = parseISODate(dateISO);
    setWeekStart(getWeekStart(selectedD));
    setTimeout(() => {
      const ref = dayRefs.current[dateISO];
      if (ref) ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

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

  // Counts
  const upcomingCount = useMemo(
    () => MOCK_MEETINGS.filter((m) => m.date >= TODAY_ISO).length,
    [],
  );
  const pastCount = useMemo(
    () => MOCK_MEETINGS.filter((m) => m.date < TODAY_ISO).length,
    [],
  );

  // Filter groups based on active tab
  const filteredGroups = useMemo(() => {
    if (activeTab === "upcoming") {
      const upcoming = allGroups.filter((g) => g.date >= TODAY_ISO);
      // Ensure "Today" group exists even if no meetings
      if (!upcoming.some((g) => g.date === TODAY_ISO)) {
        return [{ date: TODAY_ISO, meetings: [] }, ...upcoming];
      }
      return upcoming;
    }
    return allGroups.filter((g) => g.date < TODAY_ISO).reverse();
  }, [allGroups, activeTab]);

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col overflow-hidden px-8 pt-7 pb-0">
        {/* Row 1: Title + Auto-record + Today + Record button (full width) */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-foreground font-bold text-[28px] leading-[33.6px] tracking-[-0.56px]">
            Meetings
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            {/* Auto-record */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                <Icon icon={FlashIcon} size={14} className="text-primary" />
                Auto-record:
              </div>
              <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  onClick={() => setAutoRecordMode("all")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[12px] font-medium transition-all",
                    autoRecordMode === "all"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All meetings
                </button>
                <button
                  onClick={() => setAutoRecordMode("manual")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[12px] font-medium transition-all",
                    autoRecordMode === "manual"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Manual select
                </button>
              </div>
            </div>

            {/* Today button — only visible when navigated away */}
            <motion.div
              initial={false}
              animate={{
                opacity: isOnCurrentWeek ? 0 : 1,
                width: isOnCurrentWeek ? 0 : "auto",
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <Button
                variant="pill-outline"
                className="h-9 px-4 text-[13px] font-medium whitespace-nowrap"
                onClick={handleGoToday}
              >
                {t("calendar.today")}
              </Button>
            </motion.div>

            <Button
              className="rounded-full h-9 px-4 text-[13px] font-medium"
              onClick={() => setOpenModal("meeting")}
            >
              Record a meeting
            </Button>
          </div>
        </div>

        {/* Two-column layout: content + sidebar */}
        <div className="flex-1 flex gap-6 overflow-hidden mt-4">
          {/* ── Left column: tabs, week strip, cards ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as MeetingsTab)} className="gap-0">
              <TabsList variant="line" className="gap-6 w-full justify-start">
                <TabsTrigger value="upcoming" variant="line">
                  Upcoming meetings
                  <span className="opacity-50 font-[inherit]">{upcomingCount}</span>
                </TabsTrigger>
                <TabsTrigger value="past" variant="line">
                  Past meetings
                  <span className="opacity-50 font-[inherit]">{pastCount}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Week strip with arrows */}
            <div className="mt-4 flex items-end border-b border-border/30">
              <button
                onClick={() => handleWeekChange("prev")}
                className="shrink-0 size-8 mb-3 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label={t("calendar.prevWeek")}
              >
                <Icon icon={ChevronLeft} size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <CalendarWeekStrip
                  weekStart={weekStart}
                  selectedDate={selectedDate}
                  todayISO={TODAY_ISO}
                  meetingCounts={meetingCounts}
                  onDaySelect={handleDaySelect}
                />
              </div>
              <button
                onClick={() => handleWeekChange("next")}
                className="shrink-0 size-8 mb-3 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label={t("calendar.nextWeek")}
              >
                <Icon icon={ChevronRight} size={16} />
              </button>
            </div>

            {/* Meeting list — scrollable */}
            <div className="flex-1 overflow-y-auto mt-5 pb-6 scrollbar-hide">
              <motion.div
                key={activeTab}
                initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <MeetingList
                  dayGroups={filteredGroups}
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

          {/* ── Right column: My Calendars ── */}
          <aside className="w-[240px] shrink-0 hidden lg:block pt-1">
            <ConnectedCalendars />
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
  if (dayGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-[14px]">No meetings</p>
      </div>
    );
  }

  return (
    <>
      {dayGroups.map((group, groupIdx) => {
        const headerLabel = formatGroupHeader(group.date, todayISO);
        const isToday = group.date === todayISO;
        const staggerDelay = groupIdx * 0.06;

        return (
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
            <div className="mb-3">
              <h3 className={cn(
                "text-[14px] font-semibold tracking-tight",
                isToday ? "text-primary" : "text-foreground",
              )}>
                {headerLabel}
              </h3>
            </div>
            {group.meetings.length === 0 && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-50/50 to-teal-50/20 py-6 px-6 flex items-center justify-center gap-2.5">
                <span className="text-[16px]">{"\u{1F331}"}</span>
                <span className="text-[13px] text-muted-foreground/70 font-medium">
                  No meetings scheduled — enjoy the free time!
                </span>
              </div>
            )}
            {group.meetings.map((m, idx) => (
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
            ))}
          </motion.div>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════
   Connected Calendars
   ═══════════════════════════════════════════ */

const MOCK_CALENDARS = [
  { id: "cal_1", name: "kutskirill22@gmail.com", color: "#4285F4", is_enabled: true, is_primary: true },
  { id: "cal_2", name: "Holidays in Belarus", color: "#0D9488", is_enabled: true, is_primary: false },
];

function ConnectedCalendars() {
  const { t } = useLanguage();
  const { calendars: realCalendars, isLoading, isSyncing, toggleCalendar, syncCalendars } = useCalendars();

  const hasRealCalendars = realCalendars.length > 0;
  const displayCalendars = hasRealCalendars
    ? realCalendars.map((c) => ({
        id: c.id,
        name: c.calendar_name,
        color: c.color,
        is_enabled: c.is_enabled,
        is_primary: c.is_primary,
      }))
    : MOCK_CALENDARS;

  const [mockEnabled, setMockEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of MOCK_CALENDARS) init[c.id] = true;
    return init;
  });

  const handleToggle = (cal: typeof displayCalendars[number]) => {
    if (hasRealCalendars) {
      toggleCalendar(cal.id, !cal.is_enabled);
    } else {
      setMockEnabled((prev) => ({ ...prev, [cal.id]: !prev[cal.id] }));
    }
  };

  const isEnabled = (cal: typeof displayCalendars[number]) =>
    hasRealCalendars ? cal.is_enabled : (mockEnabled[cal.id] ?? true);

  const handleAddCalendar = () => {
    syncCalendars();
  };

  return (
    <div className="px-0 py-0">
      <h4 className="text-[14px] font-semibold text-foreground mb-3">
        {t("calendar.myCalendars")}
      </h4>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {displayCalendars.map((cal) => {
            const enabled = isEnabled(cal);
            return (
              <div key={cal.id} className="flex items-center gap-2.5">
                <button
                  onClick={() => handleToggle(cal)}
                  className="flex items-center justify-center shrink-0"
                  aria-label={`Toggle ${cal.name}`}
                >
                  <div
                    className={cn(
                      "size-4 rounded flex items-center justify-center transition-all duration-150",
                      enabled
                        ? "border-[1.5px]"
                        : "border-[1.5px] border-muted-foreground/25 bg-transparent",
                    )}
                    style={enabled ? { backgroundColor: cal.color, borderColor: cal.color } : undefined}
                  >
                    {enabled && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                        <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
                <span className={cn(
                  "text-[12px] truncate flex-1 transition-colors",
                  enabled ? "text-foreground/80" : "text-muted-foreground/40 line-through",
                )}>
                  {cal.name}
                </span>
                {cal.is_primary && (
                  <span className="text-[10px] text-muted-foreground/40 shrink-0">
                    {t("calendar.default")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        className="flex items-center gap-1.5 mt-2.5 w-full text-[12px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        onClick={handleAddCalendar}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 animate-spin">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
        {isSyncing ? t("calendar.syncing") : t("calendar.addCalendar")}
      </button>
    </div>
  );
}
