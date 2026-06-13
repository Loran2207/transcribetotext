import { useState, useCallback, useRef, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  FlashIcon,
  InformationCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { cn } from "@/app/components/ui/utils";
import { useLanguage, type LangCode } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";
import { CalendarWeekStrip } from "./calendar-week-strip";
import { CalendarMeetingCard } from "./calendar-meeting-card";
import {
  CalendarConnectScreen,
  CalendarEmptyState,
  GoogleCalendarLogo,
  OutlookLogo,
} from "./calendar-connect";
import {
  useCalendarAccounts,
  PROVIDER_NAMES,
  type CalendarAccount,
  type CalendarProvider,
} from "./calendar-accounts";
import {
  MeetingsSettingsTab,
  AUTO_RECORD_OPTIONS,
  loadAutoRecordMode,
  saveAutoRecordMode,
  type AutoRecordMode,
} from "./calendar-settings";
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

/** Content column cap so cards stay readable on wide monitors */
const CONTENT_MAX_W = "max-w-[880px]";

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

function isConnectDemoState(): boolean {
  try {
    return localStorage.getItem(CAL_STATE_KEY) === "connect";
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

type MeetingsTab = "upcoming" | "past" | "settings";

export function CalendarPage() {
  const { t } = useLanguage();
  const { setOpenModal } = useTranscriptionModals();

  const {
    accounts,
    connecting,
    connectAccount,
    disconnectAccount,
  } = useCalendarAccounts();

  const isDisconnected = accounts.length === 0 || isConnectDemoState();
  const showEmptyDemo = isEmptyDemoState();

  const meetings = useMemo(
    () => (isDisconnected || showEmptyDemo ? [] : ALL_MOCK_MEETINGS),
    [isDisconnected, showEmptyDemo],
  );

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(TODAY));
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [activeTab, setActiveTab] = useState<MeetingsTab>("upcoming");
  const [autoRecordMode, setAutoRecordMode] = useState<AutoRecordMode>(loadAutoRecordMode);

  // Calendar sync indicator (demo)
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

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

  const handleAutoRecordModeChange = useCallback((mode: AutoRecordMode) => {
    setAutoRecordMode(mode);
    saveAutoRecordMode(mode);
  }, []);

  const handleSync = useCallback(() => {
    if (isSyncing) return;
    setIsSyncing(true);
    window.setTimeout(() => {
      setIsSyncing(false);
      setJustSynced(true);
    }, 900);
  }, [isSyncing]);

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

  const syncStatus = (
    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
      <span>{justSynced ? "Calendar synced just now" : "Calendar last synced 12 min ago"}</span>
      <button
        onClick={handleSync}
        className="flex items-center justify-center size-5 rounded-full hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Sync calendars"
      >
        <Icon icon={RefreshIcon} size={12} className={cn(isSyncing && "animate-spin")} />
      </button>
    </div>
  );

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
        {/* Row 1: Title + Today + Record button (full width) */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-foreground font-bold text-[28px] leading-[33.6px] tracking-[-0.56px]">
            Meetings
          </h1>
          <div className="flex items-center gap-3 shrink-0">
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

        {/* Tabs + connected calendars indicator — full width so the line reaches the edge */}
        <div className="flex items-end justify-between border-b border-border mt-4">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as MeetingsTab)} className="gap-0">
              <TabsList variant="line" className="gap-6 justify-start border-0">
                <TabsTrigger value="upcoming" variant="line">
                  Upcoming meetings
                  <span className="opacity-50 font-[inherit]">{upcomingCount}</span>
                </TabsTrigger>
                <TabsTrigger value="past" variant="line">
                  Past meetings
                  <span className="opacity-50 font-[inherit]">{pastCount}</span>
                </TabsTrigger>
                <TabsTrigger value="settings" variant="line">
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <ConnectedCalendarsIndicator
              accounts={accounts}
              onClick={() => setActiveTab("settings")}
            />
        </div>

        {/* Week strip — full width */}
        {activeTab !== "settings" && (
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
        )}


        {/* Content column — capped and centered for wide monitors */}
        <div className={cn("flex-1 min-w-0 flex flex-col w-full mx-auto overflow-hidden", CONTENT_MAX_W)}>
          {activeTab === "settings" ? (
            <MeetingsSettingsTab
              accounts={accounts}
              connecting={connecting}
              onConnect={connectAccount}
              onDisconnect={disconnectAccount}
              autoRecordMode={autoRecordMode}
              onAutoRecordModeChange={handleAutoRecordModeChange}
            />
          ) : (
            <>
              {/* Auto-record bar — full content width, upcoming only */}
              {activeTab === "upcoming" && (
                <div className="mt-4 flex items-center rounded-xl border border-border bg-card px-4 py-2.5">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground shrink-0 pr-3">
                    <Icon icon={FlashIcon} size={14} className="text-primary" />
                    Auto-record:
                  </div>
                  <RadioGroup
                    value={autoRecordMode}
                    onValueChange={(v) => handleAutoRecordModeChange(v as AutoRecordMode)}
                    className="flex items-center gap-0 flex-1 min-w-0"
                  >
                    {AUTO_RECORD_OPTIONS.map((o, idx) => (
                      <div
                        key={o.value}
                        className={cn(
                          "flex items-center gap-2 px-3.5",
                          idx > 0 && "border-l border-border/60",
                        )}
                      >
                        <RadioGroupItem value={o.value} id={`bar_${o.value}`} />
                        <label
                          htmlFor={`bar_${o.value}`}
                          className="text-[13px] text-foreground cursor-pointer whitespace-nowrap"
                        >
                          {o.barLabel}
                        </label>
                        {o.hint && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                                <Icon icon={InformationCircleIcon} size={13} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs max-w-[300px]">
                              {o.hint}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Meeting list — scrollable */}
              {meetings.length === 0 ? (
                <CalendarEmptyState
                  onOpenSettings={() => setActiveTab("settings")}
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
                      firstGroupExtra={activeTab === "upcoming" ? syncStatus : null}
                    />
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ═══════════════════════════════════════════
   Connected calendars indicator (tabs row)
   ═══════════════════════════════════════════ */

const INDICATOR_PROVIDERS: CalendarProvider[] = ["google", "outlook"];

interface ConnectedCalendarsIndicatorProps {
  accounts: CalendarAccount[];
  onClick: () => void;
}

function ConnectedCalendarsIndicator({ accounts, onClick }: ConnectedCalendarsIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="hidden sm:flex items-center gap-2 pb-2.5 pr-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <span className="flex items-center gap-1">
            {INDICATOR_PROVIDERS.map((provider) => {
              const isConnected = accounts.some((a) => a.provider === provider);
              return (
                <span
                  key={provider}
                  className={cn("flex items-center", !isConnected && "grayscale opacity-35")}
                >
                  {provider === "google"
                    ? <GoogleCalendarLogo size={14} />
                    : <OutlookLogo size={14} />}
                </span>
              );
            })}
          </span>
          <span>
            {accounts.length} {accounts.length === 1 ? "calendar" : "calendars"} connected
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="text-xs">
        <div className="flex flex-col gap-1">
          {INDICATOR_PROVIDERS.map((provider) => {
            const providerAccounts = accounts.filter((a) => a.provider === provider);
            return (
              <div key={provider}>
                <span className="font-medium">{PROVIDER_NAMES[provider]}:</span>{" "}
                {providerAccounts.length > 0
                  ? providerAccounts.map((a) => a.email).join(", ")
                  : "not connected"}
              </div>
            );
          })}
          <div className="text-muted-foreground/40 dark:text-muted-foreground mt-0.5">
            Manage in Settings
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
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
  /** Rendered right-aligned in the first day group header (e.g., sync status) */
  firstGroupExtra?: React.ReactNode;
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
  firstGroupExtra,
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className={cn(
                "text-[14px] font-semibold tracking-tight",
                isToday ? "text-primary" : "text-foreground",
              )}>
                {headerLabel}
              </h3>
              {groupIdx === 0 && firstGroupExtra}
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