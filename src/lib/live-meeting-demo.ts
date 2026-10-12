/* The demo meeting a bot records live. The bot names the people it hears
   (that is what the real bot does; the desktop app only knows Me and Them),
   so every line carries a speaker. `at` is seconds into the recording: the
   provider streams a line when the clock reaches it, the seeded capture states
   show the lines up to a point. */

export interface LiveSpeaker {
  id: string;
  name: string;
  initials: string;
  /* one tint per voice, taken from the record page's speaker palette */
  tint: string;
}

export interface LiveSegment {
  id: number;
  timestamp: string;
  speakerId: string;
  text: string;
  at: number;
}

export const LIVE_SPEAKERS: Record<string, LiveSpeaker> = {
  sarah: { id: "sarah", name: "Sarah Collins", initials: "SC", tint: "#2563EB" },
  alex: { id: "alex", name: "Alex Morgan", initials: "AM", tint: "#7C3AED" },
  james: { id: "james", name: "James Lee", initials: "JL", tint: "#059669" },
  kirill: { id: "kirill", name: "Kirill Kuts", initials: "KK", tint: "#D97706" },
};

export function liveSpeaker(id: string): LiveSpeaker {
  return LIVE_SPEAKERS[id] ?? { id, name: id, initials: id.slice(0, 2).toUpperCase(), tint: "#64748B" };
}

export function fmtLiveClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* How long the bot waits in the lobby before it gives up. */
export const BOT_LOBBY_LIMIT_SECONDS = 300;

const LINES: Array<[number, string, string]> = [
  [4, "sarah", "Okay, I think everyone is here. Let's start with the Q2 roadmap and then go round the table on what each team needs."],
  [12, "sarah", "The big change since last week: the onboarding tour moves up to April, the academy page stays in May."],
  [21, "alex", "Fine by me. The tour needs the welcome file to be in every new account, otherwise the steps point at an empty table."],
  [29, "james", "That part is done on staging. The sample record shows up with a star, and it goes away once the person uploads something of their own."],
  [36, "kirill", "One thing from design: the tour should never explain a feature to someone who already has data. If the records table has rows, the first step is skipped."],
  [45, "sarah", "Agreed, let's write that into the ticket. Alex, where are we with the speakers release?"],
  [52, "alex", "It went out on Tuesday. Renaming works, the Remove dialog lists the voices, and the phone sheets confirm themselves. Nothing came back from support so far."],
  [61, "james", "I'd add one small thing: the live transcript. The bot joins, the page opens on its own, and the lines appear as people talk. We're looking at it right after this call."],
  [70, "sarah", "Good. Then two action items: Kirill sends the live transcript states to Artem today, and James writes up the tour rules for the ticket."],
  [78, "kirill", "Sounds good. I'll have the Figma page by the evening."],
  [84, "sarah", "Thanks everyone, that's all from me. See you on Thursday."],
];

export const LIVE_SCRIPT: LiveSegment[] = LINES.map(([at, speakerId, text], i) => ({
  id: i + 1,
  timestamp: fmtLiveClock(at),
  speakerId,
  text,
  at,
}));

/* The meeting ends this long after the last line. */
export const LIVE_SCRIPT_END_SECONDS = LINES[LINES.length - 1][0] + 6;
