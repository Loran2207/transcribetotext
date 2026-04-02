import type { LangCode } from "./language-context";

export type CalendarPlatform = "google-meet" | "zoom" | "teams";

export interface CalendarMeeting {
  id: string;
  date: string; // ISO date string "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  title: string;
  platform: CalendarPlatform;
  organizerEmail: string;
  autoJoin: boolean;
  language: LangCode;
}

export interface DayGroup {
  date: string; // ISO date string
  meetings: CalendarMeeting[];
}

/**
 * Generate mock meetings for a given date range.
 * Creates realistic recurring and one-off meetings.
 */
export function generateMockMeetings(): CalendarMeeting[] {
  // Base date: 2026-03-30 (Monday) to 2026-04-17 (Friday) — ~3 weeks
  const meetings: CalendarMeeting[] = [
    // Week 1: Mar 30 - Apr 3
    {
      id: "m1",
      date: "2026-03-30",
      startTime: "09:00",
      endTime: "09:30",
      title: "Sprint Planning",
      platform: "google-meet",
      organizerEmail: "sarah@company.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m2",
      date: "2026-03-30",
      startTime: "14:00",
      endTime: "15:00",
      title: "Vektor <> QL | Instance Daily Sync",
      platform: "google-meet",
      organizerEmail: "kirill@vektortms.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m3",
      date: "2026-03-31",
      startTime: "10:00",
      endTime: "11:00",
      title: "Design Review — Mobile App",
      platform: "zoom",
      organizerEmail: "anna.design@company.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m4",
      date: "2026-04-01",
      startTime: "11:00",
      endTime: "11:30",
      title: "1:1 with Tech Lead",
      platform: "teams",
      organizerEmail: "alex.tech@company.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m5",
      date: "2026-04-01",
      startTime: "15:00",
      endTime: "16:00",
      title: "Client Demo — Q2 Features",
      platform: "zoom",
      organizerEmail: "sales@client.co",
      autoJoin: false,
      language: "en",
    },
    // Apr 2 (Thursday — "today")
    // no meetings — shows empty state
    {
      id: "m6",
      date: "2026-04-03",
      startTime: "14:00",
      endTime: "15:00",
      title: "Vektor <> QL | Instance Daily Sync",
      platform: "google-meet",
      organizerEmail: "kirill@vektortms.com",
      autoJoin: false,
      language: "en",
    },
    // Week 2: Apr 6-10
    {
      id: "m7",
      date: "2026-04-06",
      startTime: "14:00",
      endTime: "15:00",
      title: "Vektor <> QL | Instance Daily Sync",
      platform: "google-meet",
      organizerEmail: "kirill@vektortms.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m8",
      date: "2026-04-07",
      startTime: "16:00",
      endTime: "17:00",
      title: "Vektor Product Team Sync",
      platform: "google-meet",
      organizerEmail: "maxim@veido.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m9",
      date: "2026-04-08",
      startTime: "14:00",
      endTime: "15:00",
      title: "Vektor <> QL | Instance Daily Sync",
      platform: "google-meet",
      organizerEmail: "kirill@vektortms.com",
      autoJoin: false,
      language: "en",
    },
    // Apr 9 — no meetings
    {
      id: "m10",
      date: "2026-04-10",
      startTime: "14:00",
      endTime: "15:00",
      title: "Vektor <> QL | Instance Daily Sync",
      platform: "google-meet",
      organizerEmail: "kirill@vektortms.com",
      autoJoin: false,
      language: "en",
    },
    // Week 3: Apr 13-17
    {
      id: "m11",
      date: "2026-04-13",
      startTime: "09:00",
      endTime: "09:30",
      title: "Sprint Planning",
      platform: "google-meet",
      organizerEmail: "sarah@company.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m12",
      date: "2026-04-13",
      startTime: "14:00",
      endTime: "15:00",
      title: "Vektor <> QL | Instance Daily Sync",
      platform: "google-meet",
      organizerEmail: "kirill@vektortms.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m13",
      date: "2026-04-14",
      startTime: "10:00",
      endTime: "11:00",
      title: "Engineering All-Hands",
      platform: "zoom",
      organizerEmail: "cto@company.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m14",
      date: "2026-04-15",
      startTime: "13:00",
      endTime: "14:00",
      title: "Partner Integration Call",
      platform: "teams",
      organizerEmail: "partnerships@partner.io",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m15",
      date: "2026-04-16",
      startTime: "11:00",
      endTime: "12:00",
      title: "UX Research Debrief",
      platform: "zoom",
      organizerEmail: "anna.design@company.com",
      autoJoin: false,
      language: "en",
    },
    {
      id: "m16",
      date: "2026-04-17",
      startTime: "14:00",
      endTime: "15:00",
      title: "Vektor <> QL | Instance Daily Sync",
      platform: "google-meet",
      organizerEmail: "kirill@vektortms.com",
      autoJoin: false,
      language: "en",
    },
  ];

  return meetings;
}

/**
 * Group meetings by date, including days without meetings
 * within the visible range (one week from weekStart).
 */
export function groupMeetingsByDay(
  meetings: ReadonlyArray<CalendarMeeting>,
  weekStart: Date,
): DayGroup[] {
  const groups: DayGroup[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = toISODate(d);
    const dayMeetings = meetings.filter((m) => m.date === dateStr);
    groups.push({ date: dateStr, meetings: dayMeetings });
  }

  return groups;
}

/** Format Date to "YYYY-MM-DD" */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" to Date */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Get the start of the week containing the given date (Thursday-based to match UI) */
export function getWeekStart(d: Date): Date {
  // Use Thursday-based weeks to match the reference UI
  const result = new Date(d);
  const day = result.getDay();
  // Thursday = 4. If day < 4, go back to previous Thursday
  const diff = day >= 4 ? day - 4 : day + 3;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Format month and year, e.g., "Apr\n2026" */
export function formatMonthYear(d: Date): { month: string; year: string } {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return { month: months[d.getMonth()], year: String(d.getFullYear()) };
}

/** Short day names starting from the given date */
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getDayNameShort(d: Date): string {
  return DAY_NAMES_SHORT[d.getDay()];
}

/** Full day names */
const DAY_NAMES_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export function getDayNameFull(d: Date): string {
  return DAY_NAMES_FULL[d.getDay()];
}

/** Format date as "MM/DD · DayName", e.g., "04/02 · Thursday" */
export function formatDayHeader(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd} \u00b7 ${getDayNameFull(d)}`;
}

/** Full month name + year, e.g., "April 2026" */
const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonthYearFull(d: Date): string {
  return `${MONTH_NAMES_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format weekend header, e.g., "04/04 Saturday - 04/05 Sunday" */
export function formatWeekendHeader(sat: Date, sun: Date): string {
  const fmtDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  };
  return `${fmtDate(sat)} Saturday - ${fmtDate(sun)} Sunday`;
}
