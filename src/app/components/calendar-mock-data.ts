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
  /** Meeting is happening right now and being recorded */
  isLive?: boolean;
}

export interface DayGroup {
  date: string; // ISO date string
  meetings: CalendarMeeting[];
}

/** Map of meeting IDs to transcript URLs (past meetings that were transcribed) */
export const TRANSCRIPT_MAP: Record<string, string> = {
  m1: "/transcriptions/5",
  m2: "/transcriptions/2",
  m3: "/transcriptions/11",
  m5: "/transcriptions/6",
};

/** Map of meeting IDs to recording error reasons (past meetings that failed) */
export const RECORDING_ERROR_MAP: Record<string, string> = {
  m4: "Bot failed to join the meeting",
};

/* Fictional demo world: the user works at Northwind Labs;
   clients are Acme Logistics, Brightline Media, Atlas Freight. */

const KIRILL: CalendarAttendee = { name: "Kirill Kuts", email: "kutskirill22@gmail.com" };
const SARAH: CalendarAttendee = { name: "Sarah Collins", email: "sarah.collins@northwindlabs.com" };
const JAMES: CalendarAttendee = { name: "James Lee", email: "james.lee@northwindlabs.com" };
const ANNA: CalendarAttendee = { name: "Anna Reyes", email: "anna.reyes@northwindlabs.com" };
const ALEX: CalendarAttendee = { name: "Alex Morgan", email: "alex.morgan@northwindlabs.com" };
const ROBERT: CalendarAttendee = { name: "Robert Hale", email: "robert.hale@northwindlabs.com" };
const PRIYA: CalendarAttendee = { name: "Priya Nair", email: "priya.nair@northwindlabs.com" };
const DANA: CalendarAttendee = { name: "Dana Whitfield", email: "dana@acmelogistics.com" };
const MIA: CalendarAttendee = { name: "Mia Torres", email: "mia@brightline.media" };
const ATLAS: CalendarAttendee = { name: "Atlas Partnerships", email: "partners@atlasfreight.io" };

/**
 * Generate mock meetings for the demo date range.
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
      title: "Sprint planning - mobile app",
      platform: "google-meet",
      organizerEmail: "sarah.collins@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [SARAH, KIRILL, ALEX, JAMES],
      videoLink: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: "m2",
      date: "2026-03-30",
      startTime: "14:00",
      endTime: "15:00",
      title: "Acme Logistics - onboarding call",
      platform: "zoom",
      organizerEmail: "dana@acmelogistics.com",
      autoJoin: false,
      language: "en",
      attendees: [DANA, KIRILL, SARAH],
      videoLink: "https://zoom.us/j/12345678",
    },
    {
      id: "m3",
      date: "2026-03-31",
      startTime: "10:00",
      endTime: "11:00",
      title: "Design review - booking flow",
      platform: "google-meet",
      organizerEmail: "anna.reyes@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [ANNA, KIRILL, SARAH, JAMES],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
    },
    {
      id: "m4",
      date: "2026-04-01",
      startTime: "11:00",
      endTime: "11:30",
      title: "1:1 with tech lead",
      platform: "teams",
      organizerEmail: "alex.morgan@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [ALEX, KIRILL],
      videoLink: "https://teams.microsoft.com/l/meetup/19:abc",
    },
    {
      id: "m5",
      date: "2026-04-01",
      startTime: "15:00",
      endTime: "16:00",
      title: "Client demo - Q2 features",
      platform: "zoom",
      organizerEmail: "mia@brightline.media",
      autoJoin: false,
      language: "en",
      attendees: [MIA, KIRILL, SARAH, ALEX, PRIYA],
      videoLink: "https://zoom.us/j/87654321",
    },
    // Apr 2 (Thursday - "today")
    {
      id: "m_live",
      date: "2026-04-02",
      startTime: "13:30",
      endTime: "14:30",
      title: "Weekly product sync - Q2 roadmap",
      platform: "google-meet",
      organizerEmail: "sarah.collins@northwindlabs.com",
      autoJoin: true,
      language: "en",
      isLive: true,
      attendees: [SARAH, KIRILL, ALEX, JAMES],
      videoLink: "https://meet.google.com/qwe-rtyu-iop",
    },
    {
      id: "m_today2",
      date: "2026-04-02",
      startTime: "16:00",
      endTime: "16:30",
      title: "Customer feedback session - Acme Logistics",
      platform: "zoom",
      organizerEmail: "dana@acmelogistics.com",
      autoJoin: false,
      language: "en",
      attendees: [DANA, KIRILL, SARAH],
      videoLink: "https://zoom.us/j/99887766",
    },
    {
      id: "m6",
      date: "2026-04-03",
      startTime: "14:00",
      endTime: "14:15",
      title: "Daily standup - platform team",
      platform: "google-meet",
      organizerEmail: "james.lee@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [JAMES, KIRILL, ALEX],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
    },
    // Week 2: Apr 6-10
    {
      id: "m7",
      date: "2026-04-06",
      startTime: "14:00",
      endTime: "14:15",
      title: "Daily standup - platform team",
      platform: "google-meet",
      organizerEmail: "james.lee@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [JAMES, KIRILL, ALEX],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
    },
    {
      id: "m8",
      date: "2026-04-07",
      startTime: "16:00",
      endTime: "17:00",
      title: "Marketing sync - spring campaign",
      platform: "google-meet",
      organizerEmail: "priya.nair@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [PRIYA, KIRILL, ANNA, SARAH],
      videoLink: "https://meet.google.com/pqr-stuv-wxy",
    },
    {
      id: "m9",
      date: "2026-04-08",
      startTime: "14:00",
      endTime: "14:15",
      title: "Daily standup - platform team",
      platform: "google-meet",
      organizerEmail: "james.lee@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [JAMES, KIRILL, ALEX],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
    },
    // Apr 9 - no meetings
    {
      id: "m10",
      date: "2026-04-10",
      startTime: "13:00",
      endTime: "14:00",
      title: "Sales discovery - Brightline Media",
      platform: "zoom",
      organizerEmail: "mia@brightline.media",
      autoJoin: false,
      language: "en",
      attendees: [MIA, KIRILL, SARAH],
      videoLink: "https://zoom.us/j/55443322",
    },
    // Week 3: Apr 13-17
    {
      id: "m11",
      date: "2026-04-13",
      startTime: "09:00",
      endTime: "09:30",
      title: "Sprint planning - mobile app",
      platform: "google-meet",
      organizerEmail: "sarah.collins@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [SARAH, KIRILL, ALEX, JAMES],
      videoLink: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: "m12",
      date: "2026-04-13",
      startTime: "14:00",
      endTime: "14:15",
      title: "Daily standup - platform team",
      platform: "google-meet",
      organizerEmail: "james.lee@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [JAMES, KIRILL, ALEX, ANNA],
      videoLink: "https://meet.google.com/xyz-uvwx-rst",
    },
    {
      id: "m13",
      date: "2026-04-14",
      startTime: "10:00",
      endTime: "11:00",
      title: "Engineering all-hands",
      platform: "zoom",
      organizerEmail: "robert.hale@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [ROBERT, KIRILL, SARAH, ALEX, ANNA, JAMES, PRIYA],
      videoLink: "https://zoom.us/j/11223344",
    },
    {
      id: "m14",
      date: "2026-04-15",
      startTime: "13:00",
      endTime: "14:00",
      title: "Partner integration call - Atlas Freight",
      platform: "teams",
      organizerEmail: "partners@atlasfreight.io",
      autoJoin: false,
      language: "en",
      attendees: [ATLAS, KIRILL, ALEX],
      videoLink: "https://teams.microsoft.com/l/meetup/19:xyz",
    },
    {
      id: "m15",
      date: "2026-04-16",
      startTime: "11:00",
      endTime: "12:00",
      title: "UX research debrief",
      platform: "zoom",
      organizerEmail: "anna.reyes@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [ANNA, KIRILL, SARAH, PRIYA],
      videoLink: "https://zoom.us/j/55667788",
    },
    {
      id: "m16",
      date: "2026-04-17",
      startTime: "14:00",
      endTime: "14:15",
      title: "Daily standup - platform team",
      platform: "google-meet",
      organizerEmail: "james.lee@northwindlabs.com",
      autoJoin: false,
      language: "en",
      attendees: [JAMES, KIRILL, ALEX],
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
  return `${mm}/${dd} · ${getDayNameFull(d)}`;
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

/** Compute "In Xh Ym" countdown from now to a meeting start time */
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