import { useState, useCallback, useRef, useMemo } from "react";
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
import { useLanguage, type LangCode } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";
import { CalendarWeekStrip } from "./calendar-week-strip";
import { CalendarMeetingCard } from "./calendar-meeting-card";
import {
  CalendarConnectScreen,
  CalendarEmptyState,
  AddCalendarDialog,
  ProviderLogo,
  ConnectingSpinner,
} from "./calendar-connect";
import {
  useCalendarAccounts,
  PROVIDER_NAMES,
  type CalendarProvider,
  type CalendarAccount,
} from "./calendar-accounts";
import {
  generateMockMeetings,
  getWeekStart,
  toISODate,
  parseISODate,
  findNextMeeting,
  type DayGroup,
} from "./calendar-mock-data";

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const TODAY = new Date(2026, 3, 2); // April 2, 2026
const TODAY_ISO = toISODate(TODAY);
const ALL_MOCK_MEETINGS = generateMockMeetings();

/**
 * Demo flag: ttt_cal_state
 *  - "connect" → no calendar connected, show the connect screen
 *  - "empty"   → calendar connected but no meetings
 *  - otherwise → connected with meetings (default)
 */
const CAL_STATE_KEY = "ttt_cal_state";

function isEmptyDemoState(): boolean {
  try {
    return localStorage.getItem(CAL_STATE_KEY) === "empty";
  } catch { return false; }
}

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
  const { setOpenModal } = useTranscriptionModals();

  const {
    accounts,
    connecting,
    connectAccount,
    disconnectAccount,
    toggleCalendar,
  } = useCalendarAccounts();
  const [addCalendarOpen, setAddCalendarOpen] = useState(false);

  const isDisconnected = accounts.length === 0;
  const showEmptyDemo = isEmptyDemoState();

  const meetings = useMemo(
    () => (isDisconnected || showEmptyDemo ? [] : ALL_MOCK_MEETINGS),
    [isDisconnected, showEmptyDemo],
  );

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
    for (const m of ALL_MOCK_MEETINGS) { initial[m.id] = m.autoJoin; }
    return initial;
  });

  const [meetingLanguages, setMeetingLanguages] = useState<Record<string, LangCode>>(() => {
    const initial: Record<string, LangCode> = {};
    for (const m of ALL_MOCK_MEETINGS) { initial[m.id] = m.language; }
    return initial;
  });

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Group all meetings by date
  const allGroups = useMemo(() => {
    const dateSet = new Set<string>();
    for (const m of meetings) dateSet.add(m.date);
    const sortedDates = [...dateSet].sort();
    return sortedDates.map((date) => ({
      date,
      meetings: meetings.filter((m) => m.date === date),
    }));
  }, [meetings]);

  // Meeting counts per day (for week strip dots)
  const meetingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of meetings) { counts[m.date] = (counts[m.date] ?? 0) + 1; }
    return counts;
  }, [meetings]);

  const nextMeeting = useMemo(
    () => findNextMeeting(meetings, TODAY_ISO),
    [meetings],
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

  // Counts
  const upcomingCount = useMemo(
    () => meetings.filter((m) => m.date >= TODAY_ISO).length,
    [meetings],
  );
  const pastCount = useMemo(
    () => meetings.filter((m) => m.date < TODAY_ISO).length,
    [meetings],
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

  /* ── Disconnected: full-page connect screen ── */
  if (isDisconnected) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden px-8 pt-7 pb-0">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-foreground font-bold text-[28px] leading-[33.6px] tracking-[-0.56px]">
            Meetings
          </h1>
          <Button
            className="rounded-full h-9 px-4 text-[13px] font-medium"
            onClick={() => setOpenModal("meeting")}
          >
            Record a meeting
          </Button>
        </div>
        <CalendarConnectScreen connecting={connecting} onConnect={connectAccount} />
      </div>
    );
  }

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
            {meetings.length === 0 ? (
              <CalendarEmptyState
                onAddCalendar={() => setAddCalendarOpen(true)}
                onRecordMeeting={() => setOpenModal("meeting")}
              />
            ) : (
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
                    onAutoJoinToggle={handleAutoJoinToggle}
                    onLanguageChange={handleLanguageChange}
                    prefersReducedMotion={prefersReducedMotion}
                    todayISO={TODAY_ISO}
                    nextMeetingId={nextMeeting?.id ?? null}
                  />
                </motion.div>
              </div>
            )}
          </div>

          {/* ── Right column: My Calendars ── */}
          <aside className="w-[248px] shrink-0 hidden lg:block pt-1">
            <MyCalendarsPanel
              accounts={accounts}
              connecting={connecting}
              onConnect={connectAccount}
              onDisconnect={disconnectAccount}
              onToggleCalendar={toggleCalendar}
            />
          </aside>
        </div>
      </div>

      <AddCalendarDialog
        open={addCalendarOpen}
        onOpenChange={setAddCalendarOpen}
        connecting={connecting}
        onConnect={connectAccount}
      />
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
  onAutoJoinToggle: (id: string, checked: boolean) => void;
  onLanguageChange: (id: string, lang: LangCode) => void;
  prefersReducedMotion: boolean | null;
  todayISO: string;
  nextMeetingId: string | null;
}

function MeetingList({
  dayGroups,
  dayRefs,
  autoJoinStates,
  meetingLanguages,
  onAutoJoinToggle,
  onLanguageChange,
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
              <div className="rounded-xl bg-muted/50 py-5 px-6 flex items-center justify-center">
                <span className="text-[13px] text-muted-foreground/70 font-medium">
                  No meetings scheduled
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
                onAutoJoinChange={(c) => onAutoJoinToggle(m.id, c)}
                onLanguageChange={(l) => onLanguageChange(m.id, l)}
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
   My Calendars panel — accounts grouped by provider
   ═══════════════════════════════════════════ */

const PROVIDER_ORDER: CalendarProvider[] = ["google", "outlook"];

interface MyCalendarsPanelProps {
  accounts: CalendarAccount[];
  connecting: CalendarProvider | null;
  onConnect: (provider: CalendarProvider) => Promise<boolean>;
  onDisconnect: (accountId: string) => void;
  onToggleCalendar: (accountId: string, calendarId: string) => void;
}

function MyCalendarsPanel({
  accounts,
  connecting,
  onConnect,
  onDisconnect,
  onToggleCalendar,
}: MyCalendarsPanelProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h4 className="text-[14px] font-semibold text-foreground mb-3.5">
        {t("calendar.myCalendars")}
      </h4>

      <div className="flex flex-col">
        {PROVIDER_ORDER.map((provider, idx) => {
          const providerAccounts = accounts.filter((a) => a.provider === provider);
          const isConnecting = connecting === provider;

          return (
            <div
              key={provider}
              className={cn(
                "pb-4",
                idx > 0 && "pt-4 border-t border-border/50",
              )}
            >
              {/* Provider header */}
              <div className="flex items-center gap-2">
                <ProviderLogo provider={provider} size={16} />
                <span className="text-[13px] font-semibold text-foreground flex-1 min-w-0 truncate">
                  {PROVIDER_NAMES[provider]}
                </span>
                <Button
                  variant="pill-outline"
                  className="h-6.5 px-3 text-[11px] font-medium shrink-0 gap-1"
                  disabled={connecting !== null}
                  onClick={() => onConnect(provider)}
                >
                  {isConnecting && <ConnectingSpinner size={11} />}
                  {isConnecting
                    ? "Connecting..."
                    : providerAccounts.length > 0
                      ? "Add"
                      : "Connect"}
                </Button>
              </div>

              {/* Accounts */}
              {providerAccounts.length === 0 ? (
                <p className="text-[12px] text-muted-foreground/50 mt-2 pl-6">
                  Not connected
                </p>
              ) : (
                providerAccounts.map((account) => (
                  <div key={account.id} className="mt-2.5 pl-6">
                    <div className="group/account flex items-center gap-2">
                      <span className="text-[12px] font-medium text-foreground/70 truncate flex-1 min-w-0">
                        {account.email}
                      </span>
                      <button
                        className="text-[11px] text-muted-foreground/60 hover:text-destructive opacity-0 group-hover/account:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0"
                        onClick={() => onDisconnect(account.id)}
                      >
                        Disconnect
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      {account.calendars.map((cal) => (
                        <div key={cal.id} className="flex items-center gap-2.5">
                          <button
                            onClick={() => onToggleCalendar(account.id, cal.id)}
                            className="flex items-center justify-center shrink-0"
                            aria-label={`Toggle ${cal.name}`}
                          >
                            <div
                              className={cn(
                                "size-4 rounded flex items-center justify-center transition-all duration-150",
                                cal.enabled
                                  ? "border-[1.5px]"
                                  : "border-[1.5px] border-muted-foreground/25 bg-transparent",
                              )}
                              style={cal.enabled ? { backgroundColor: cal.color, borderColor: cal.color } : undefined}
                            >
                              {cal.enabled && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                                  <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </button>
                          <span className={cn(
                            "text-[12px] truncate flex-1 transition-colors",
                            cal.enabled ? "text-foreground/80" : "text-muted-foreground/40 line-through",
                          )}>
                            {cal.name}
                          </span>
                          {cal.isPrimary && (
                            <span className="text-[10px] text-muted-foreground/40 shrink-0">
                              {t("calendar.default")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}