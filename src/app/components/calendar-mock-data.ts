import type { LangCode } from "./language-context";

export type CalendarPlatform = "google-meet" | "zoom" | "teams";

export interface CalendarAttendee {
  name: string;
  email: string;
  avatarUrl?: string;
}

/** Deterministic avatar URL from email */
export function getAvatarUrl(email: string): string {
  return `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`;
}

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
  attendees: CalendarAttendee[];
  videoLink?: string;
}

export interface DayGroup {
  date: string; // ISO date string
  meetings: CalendarMeeting[];
}

/** Map of meeting IDs to transcript URLs (past meetings that were transcribed) */
export const TRANSCRIPT_MAP: Record<string, string> = {
  m1: "/transcriptions/sprint-planning-mar30",
  m2: "/transcriptions/vektor-daily-mar30",
  m3: "/transcriptions/design-review-mar31",
  m5: "/transcriptions/client-demo-apr01",
};

/**
 * Generate mock meetings for a given date range.
 * Creates realistic recurring and one-off meetings.
 */
export function generateMockMeetings(): CalendarMeeting[] {
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
      attendees: [
        { name: "Sarah Chen", email: "sarah@company.com" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Alex Tech", email: "alex.tech@company.com" },
        { name: "Maria Lopez", email: "maria@company.com" },
      ],
      videoLink: "https://meet.google.com/abc-defg-hij",
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
      attendees: [
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "Anna Design", email: "anna.design@company.com" },
        { name: "David Park", email: "david@ql.io" },
        { name: "Lisa Wang", email: "lisa@ql.io" },
        { name: "Tom Brown", email: "tom@ql.io" },
      ],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
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
      attendees: [
        { name: "Anna Design", email: "anna.design@company.com" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Sarah Chen", email: "sarah@company.com" },
      ],
      videoLink: "https://zoom.us/j/12345678",
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
      attendees: [
        { name: "Alex Tech", email: "alex.tech@company.com" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
      ],
      videoLink: "https://teams.microsoft.com/l/meetup/19:abc",
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
      attendees: [
        { name: "Sales Rep", email: "sales@client.co" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Sarah Chen", email: "sarah@company.com" },
        { name: "Alex Tech", email: "alex.tech@company.com" },
        { name: "Client PM", email: "pm@client.co" },
        { name: "Client CTO", email: "cto@client.co" },
        { name: "Maria Lopez", email: "maria@company.com" },
      ],
      videoLink: "https://zoom.us/j/87654321",
    },
    // Apr 2 (Thursday — "today") — no meetings
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
      attendees: [
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "David Park", email: "david@ql.io" },
      ],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
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
      attendees: [
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "David Park", email: "david@ql.io" },
      ],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
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
      attendees: [
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Anna Design", email: "anna.design@company.com" },
        { name: "Sarah Chen", email: "sarah@company.com" },
        { name: "Tom Brown", email: "tom@ql.io" },
      ],
      videoLink: "https://meet.google.com/pqr-stuv-wxy",
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
      attendees: [
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "David Park", email: "david@ql.io" },
      ],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
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
      attendees: [
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "David Park", email: "david@ql.io" },
      ],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
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
      attendees: [
        { name: "Sarah Chen", email: "sarah@company.com" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Alex Tech", email: "alex.tech@company.com" },
        { name: "Maria Lopez", email: "maria@company.com" },
      ],
      videoLink: "https://meet.google.com/abc-defg-hij",
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
      attendees: [
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "David Park", email: "david@ql.io" },
        { name: "Lisa Wang", email: "lisa@ql.io" },
        { name: "Tom Brown", email: "tom@ql.io" },
        { name: "Sarah Chen", email: "sarah@company.com" },
      ],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
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
      attendees: [
        { name: "CTO", email: "cto@company.com" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Sarah Chen", email: "sarah@company.com" },
        { name: "Alex Tech", email: "alex.tech@company.com" },
        { name: "Anna Design", email: "anna.design@company.com" },
        { name: "Maria Lopez", email: "maria@company.com" },
        { name: "Tom Brown", email: "tom@ql.io" },
        { name: "David Park", email: "david@ql.io" },
      ],
      videoLink: "https://zoom.us/j/11223344",
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
      attendees: [
        { name: "Partnerships", email: "partnerships@partner.io" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Alex Tech", email: "alex.tech@company.com" },
      ],
      videoLink: "https://teams.microsoft.com/l/meetup/19:xyz",
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
      attendees: [
        { name: "Anna Design", email: "anna.design@company.com" },
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Sarah Chen", email: "sarah@company.com" },
        { name: "Maria Lopez", email: "maria@company.com" },
      ],
      videoLink: "https://zoom.us/j/55667788",
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
      attendees: [
        { name: "Kirill Kuts", email: "kirill@vektortms.com" },
        { name: "Maxim V.", email: "maxim@veido.com" },
        { name: "David Park", email: "david@ql.io" },
      ],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
    },
  ];

  return meetings;
}

/** Compute a human-readable duration string from start/end times */
export function formatDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

/** Get initials from a name (first letter of first and last name) */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Find the next upcoming meeting from a list, given a reference date */
export function findNextMeeting(
  meetings: ReadonlyArray<CalendarMeeting>,
  todayISO: string,
): CalendarMeeting | null {
  const upcoming = meetings
    .filter((m) => m.date >= todayISO)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.startTime < b.startTime ? -1 : 1;
    });
  return upcoming[0] ?? null;
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

/** Get the start of the week containing the given date (Sunday-based) */
export function getWeekStart(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay(); // 0=Sun
  result.setDate(result.getDate() - day);
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

/** Compute "In Xh Ym" countdown from now to a meeting's start time */
export function formatCountdown(meetingDate: string, startTime: string, now: Date): string {
  const [y, mo, d] = meetingDate.split("-").map(Number);
  const [h, m] = startTime.split(":").map(Number);
  const meetingStart = new Date(y, mo - 1, d, h, m, 0, 0);
  const diffMs = meetingStart.getTime() - now.getTime();
  if (diffMs <= 0) return "Starting now";
  const diffMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  if (hours === 0) return `In ${minutes}m`;
  if (minutes === 0) return `In ${hours}h`;
  return `In ${hours}h ${minutes}m`;
}
