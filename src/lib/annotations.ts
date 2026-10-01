/* Highlights and comments on a transcript.
 *
 * Two kinds of note, one way of pointing at the text. Both are anchored to a
 * range of characters inside one block; a whole block is simply the range that
 * covers all of it. A highlight marks words; a comment thread is a discussion
 * about words. They live side by side and can cover the same words.
 *
 * Production note: offsets into the block text are enough for a demo. A real
 * backend should anchor by word index plus the quoted text, so an edited
 * transcript can re-find the words or flag the note as detached. */

export type Person = { name: string; color: string; initial: string; you?: boolean };

export type Anchor = { segmentId: number; start: number; end: number };

export type Highlight = Anchor & { id: string; by: Person; at: number };

export type Reply = { id: string; by: Person; text: string; at: number; edited?: boolean };

export type Thread = Anchor & {
  id: string;
  quote: string;
  timestamp: string;
  by: Person;
  text: string;
  at: number;
  edited?: boolean;
  replies: Reply[];
  resolved?: { by: Person; at: number };
};

export type Annotations = { highlights: Highlight[]; threads: Thread[] };

export const YOU: Person = { name: "You", color: "#2563eb", initial: "Y", you: true };
const ALEX: Person = { name: "Alex Johnson", color: "#3b82f6", initial: "A" };
const MARIA: Person = { name: "Maria Garcia", color: "#8b5cf6", initial: "M" };
const JAMES: Person = { name: "James Chen", color: "#10b981", initial: "J" };

type SeedText = { id: number; text: string; timestamp: string };

const MIN = 60_000;
const HOUR = 60 * MIN;

/* The demo record arrives with a conversation already under way: two open
   threads, one that was settled, and a few marked lines from different people.
   Each seed names its words; a record without those words starts empty. */
export function seedAnnotations(segments: SeedText[], now = Date.now()): Annotations {
  const find = (segmentId: number, words: string) => {
    const seg = segments.find((s) => s.id === segmentId);
    if (!seg) return null;
    const start = seg.text.indexOf(words);
    if (start < 0) return null;
    return { segmentId, start, end: start + words.length, quote: words, timestamp: seg.timestamp };
  };
  const highlights: Highlight[] = [];
  const threads: Thread[] = [];
  const h = (id: string, segmentId: number, words: string, by: Person, ago: number) => {
    const a = find(segmentId, words);
    if (a) highlights.push({ id, segmentId: a.segmentId, start: a.start, end: a.end, by, at: now - ago });
  };
  const t = (thread: Omit<Thread, keyof Anchor | "quote" | "timestamp">, segmentId: number, words: string) => {
    const a = find(segmentId, words);
    if (a) threads.push({ ...thread, segmentId: a.segmentId, start: a.start, end: a.end, quote: a.quote, timestamp: a.timestamp });
  };

  h("h1", 2, "the design team finished the new onboarding flow mockups yesterday", MARIA, 3 * HOUR);
  h("h2", 6, "we're about 80% through the current milestone", YOU, 50 * MIN);
  h("h3", 9, "about 40% of users are finding the current notification settings confusing", MARIA, 45 * MIN);

  t({
    id: "t1", by: ALEX, at: now - 2 * HOUR,
    text: "We should track this dependency more formally going forward.",
    replies: [{ id: "t1r1", by: JAMES, text: "Agreed. I'll add it to our sprint retro.", at: now - HOUR }],
  }, 3, "The engineering team has been waiting on those mockups");
  t({
    id: "t2", by: MARIA, at: now - 45 * MIN,
    text: "This matches what we saw in the support tickets last month. It needs attention before Q2.",
    replies: [],
  }, 9, "about 40% of users are finding the current notification settings confusing");
  t({
    id: "t3", by: JAMES, at: now - 26 * HOUR,
    text: "Wednesday morning works for the whole team?",
    replies: [{ id: "t3r1", by: MARIA, text: "Yes, 10:00 is booked.", at: now - 25 * HOUR }],
    resolved: { by: MARIA, at: now - 25 * HOUR },
  }, 5, "I'll set something up for Wednesday morning");

  return { highlights, threads };
}

/* Words, never half words: a range grows to the word edges and drops the
   spaces around it. */
export function snapRange(text: string, start: number, end: number) {
  let a = Math.max(0, start);
  let b = Math.min(text.length, end);
  while (a > 0 && /\S/.test(text[a - 1] ?? "") && /\S/.test(text[a] ?? "")) a--;
  while (b < text.length && /\S/.test(text[b] ?? "") && /\S/.test(text[b - 1] ?? "")) b++;
  while (a < b && /\s/.test(text[a])) a++;
  while (b > a && /\s/.test(text[b - 1])) b--;
  return { start: a, end: b };
}

export const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start < b.end && b.start < a.end;

export const coversBlock = (r: { start: number; end: number }, length: number) => r.start <= 0 && r.end >= length;

/* The text cut into runs that share the same notes, so each run can carry the
   marks of everything that covers it. */
export type Run = { text: string; start: number; end: number; highlights: string[]; threads: string[] };

type Ranged = { id: string; start: number; end: number };

export function cutRuns(text: string, highlights: Ranged[], threads: Ranged[]): Run[] {
  const edges = new Set<number>([0, text.length]);
  for (const r of [...highlights, ...threads]) {
    edges.add(Math.max(0, Math.min(text.length, r.start)));
    edges.add(Math.max(0, Math.min(text.length, r.end)));
  }
  const cuts = [...edges].sort((x, y) => x - y);
  const runs: Run[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const start = cuts[i];
    const end = cuts[i + 1];
    if (end <= start) continue;
    const span = { start, end };
    runs.push({
      text: text.slice(start, end),
      start,
      end,
      highlights: highlights.filter((h) => overlaps(h, span)).map((h) => h.id),
      threads: threads.filter((t) => overlaps(t, span)).map((t) => t.id),
    });
  }
  return runs;
}

export function timeAgo(at: number, now = Date.now()) {
  const d = Math.max(0, now - at);
  if (d < MIN) return "now";
  if (d < HOUR) return `${Math.floor(d / MIN)}m ago`;
  if (d < 24 * HOUR) return `${Math.floor(d / HOUR)}h ago`;
  if (d < 48 * HOUR) return "Yesterday";
  return `${Math.floor(d / (24 * HOUR))}d ago`;
}

const KEY = "ttt_annotations_v1:";

export function loadAnnotations(record: string): Annotations | null {
  try {
    const raw = window.localStorage.getItem(KEY + record);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Annotations;
    if (!Array.isArray(parsed.highlights) || !Array.isArray(parsed.threads)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAnnotations(record: string, value: Annotations) {
  try {
    window.localStorage.setItem(KEY + record, JSON.stringify(value));
  } catch {
    /* private window or full storage: the notes stay for this visit */
  }
}

/* ttt_demo_annotations=empty opens the record with nothing marked yet, for the
   first-use state. */
export function demoStartsEmpty() {
  try {
    return window.localStorage.getItem("ttt_demo_annotations") === "empty";
  } catch {
    return false;
  }
}
