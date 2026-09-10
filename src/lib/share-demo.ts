/* The demo world for sharing.
 *
 * The app has no backend, so every state the spec asks for - a person who was
 * invited and never signed up, a person who came in through the link, a letter
 * that bounced, twenty two people at once, a list that failed to load - has to
 * come from somewhere. It comes from here, chosen by one localStorage flag, so
 * a capture names a state instead of driving the UI through it.
 */

export type ShareRowState =
  | "owner"
  | "accepted"
  | "pending"
  | "link"
  | "failed";

export interface SharePerson {
  id: string;
  /** Absent until the person actually signs up: the spec shows the email instead. */
  name?: string;
  email: string;
  state: ShareRowState;
  tint: string;
  ink: string;
  avatar?: string;
}

export type ShareMode = "invited" | "link";

export interface ShareScene {
  mode: ShareMode;
  people: SharePerson[];
  /** Emails already sitting in the field as chips. */
  chips: string[];
  /** The row whose remove control is showing, as it does on hover. */
  hoverId?: string;
  /** The row being revoked right now. */
  busyId?: string;
  sending?: boolean;
  loading?: boolean;
  /** The access list could not be read. */
  listError?: boolean;
  /** The link could not be turned on. */
  linkError?: boolean;
  /** The invite could not be sent. */
  sendError?: string;
}

const TINTS: Array<[string, string]> = [
  ["#DBEAFE", "#1D4ED8"],
  ["#DCFCE7", "#15803D"],
  ["#FEF3C7", "#B45309"],
  ["#FCE7F3", "#BE185D"],
  ["#EDE9FE", "#6D28D9"],
  ["#CCFBF1", "#0F766E"],
];

function tint(i: number) {
  return TINTS[i % TINTS.length];
}

function person(
  i: number,
  email: string,
  state: ShareRowState,
  name?: string,
): SharePerson {
  const [bg, ink] = tint(i);
  return { id: `p${i}`, email, state, name, tint: bg, ink };
}

export const OWNER: SharePerson = {
  id: "owner",
  name: "Daniel Ruiz",
  email: "daniel@northpeak.io",
  state: "owner",
  tint: "#E4E4E7",
  ink: "#3F3F46",
  avatar: "/images/avatar.png",
};

/* Four people, one in each state the spec names, so a single frame answers what
 * every state looks like instead of asking for four frames of the same list. */
const MIXED: SharePerson[] = [
  person(0, "emma.larsen@northpeak.io", "accepted", "Emma Larsen"),
  person(1, "priya.nair@acmelogistics.com", "pending"),
  person(2, "david.okoye@northpeak.io", "link", "David Okoye"),
  person(3, "t.becker@brightlinemedia.com", "failed"),
];

const MANY_NAMES = [
  "Emma Larsen", "David Okoye", "Sofia Marchetti", "Jonas Weber",
  "Amara Diallo", "Ruben Ortega", "Hannah Kowalski", "Mateo Silva",
  "Freya Nilsen", "Idris Rahman", "Clara Bennett", "Nikolai Petrov",
  "Yuki Tanaka", "Leila Haddad", "Tomas Novak", "Grace Mbeki",
  "Oliver Sandberg", "Nadia Farouk",
];

function manyPeople(): SharePerson[] {
  const out = MANY_NAMES.map((name, i) =>
    person(i, `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@northpeak.io`, "accepted", name),
  );
  out.splice(3, 0, person(30, "priya.nair@acmelogistics.com", "pending"));
  out.splice(7, 0, person(31, "sam.whitfield@zenifa.co", "pending"));
  out[11] = { ...out[11], state: "link" };
  out.push(person(32, "t.becker@brightlinemedia.com", "failed"));
  return out;
}

const SOME_CHIPS = [
  "emma.larsen@northpeak.io",
  "priya.nair@acmelogistics.com",
  "david.okoye@northpeak.io",
  "t.becker@brightlinemedia.com",
  "sofia.marchetti@nexora.io",
  "jonas.weber@northpeak.io",
];

const BASE: ShareScene = { mode: "invited", people: [], chips: [] };

const SCENES: Record<string, ShareScene> = {
  /* 2.1 Only invited, nothing given away yet. */
  empty: { ...BASE },
  chip_one: { ...BASE, chips: SOME_CHIPS.slice(0, 1) },
  chip_many: { ...BASE, chips: SOME_CHIPS },
  sending: { ...BASE, chips: SOME_CHIPS.slice(0, 2), sending: true },
  send_error: { ...BASE, chips: SOME_CHIPS.slice(0, 1), sendError: "already" },
  send_self: { ...BASE, chips: [], sendError: "self" },

  /* 2.4 The access list, every row state at once. */
  list: { ...BASE, people: MIXED },
  list_hover: { ...BASE, people: MIXED, hoverId: "p0" },
  list_busy: { ...BASE, people: MIXED, busyId: "p0" },
  list_many: { ...BASE, people: manyPeople() },

  /* 2.2 Anyone with the link. */
  link: { ...BASE, mode: "link", people: MIXED },
  link_empty: { ...BASE, mode: "link" },

  /* 2.5 The modal's own states. */
  loading: { ...BASE, loading: true },
  error: { ...BASE, listError: true },
  link_error: { ...BASE, mode: "invited", people: MIXED, linkError: true },
};

export function readShareScene(): ShareScene | null {
  let key = "";
  try {
    key = localStorage.getItem("ttt_demo_share") ?? "";
  } catch {
    return null;
  }
  if (!key) return null;
  return SCENES[key] ?? SCENES.list;
}

/* ------------------------------------------------------------------ */
/* Shared with me                                                      */
/* ------------------------------------------------------------------ */

export interface SharedOwner {
  name: string;
  email: string;
  tint: string;
  ink: string;
  avatar?: string;
}

export interface SharedFolderItem {
  id: string;
  name: string;
  color: string;
  count: number;
  owner: SharedOwner;
  sharedOn: string;
}

export interface SharedRecordItem {
  /** The id of a record in the demo table, so the row reads real facts. */
  recordId: string;
  owner: SharedOwner;
  sharedOn: string;
  /** Reached through a folder someone shared, rather than on its own. */
  viaFolderId?: string;
}

function owner(name: string, email: string, i: number, avatar?: string): SharedOwner {
  const [bg, ink] = tint(i);
  return { name, email, tint: bg, ink, avatar };
}

export const SHARED_OWNERS = {
  emma: owner("Emma Larsen", "emma.larsen@northpeak.io", 0),
  priya: owner("Priya Nair", "priya.nair@acmelogistics.com", 1),
  david: owner("David Okoye", "david.okoye@northpeak.io", 2),
  sofia: owner("Sofia Marchetti", "sofia.marchetti@nexora.io", 3),
};

export const SHARED_FOLDERS: SharedFolderItem[] = [
  {
    id: "sf1",
    name: "Acme Logistics - pilot",
    color: "#3B82F6",
    count: 6,
    owner: SHARED_OWNERS.priya,
    sharedOn: "03/12/2026",
  },
  {
    id: "sf2",
    name: "Q2 research calls",
    color: "#8B5CF6",
    count: 11,
    owner: SHARED_OWNERS.emma,
    sharedOn: "03/09/2026",
  },
];

export const SHARED_RECORDS: SharedRecordItem[] = [
  { recordId: "2", owner: SHARED_OWNERS.emma, sharedOn: "03/13/2026" },
  { recordId: "7", owner: SHARED_OWNERS.sofia, sharedOn: "03/12/2026" },
  { recordId: "13", owner: SHARED_OWNERS.priya, sharedOn: "03/12/2026" },
  { recordId: "11", owner: SHARED_OWNERS.emma, sharedOn: "03/10/2026" },
  { recordId: "9", owner: SHARED_OWNERS.david, sharedOn: "03/09/2026" },
  { recordId: "12", owner: SHARED_OWNERS.sofia, sharedOn: "03/07/2026" },
  { recordId: "10", owner: SHARED_OWNERS.david, sharedOn: "03/06/2026" },
];

/* The records inside a shared folder. The spec is explicit that a folder shows
 * only what its owner put there, and nothing belonging to other people. */
export const SHARED_FOLDER_RECORDS: Record<string, string[]> = {
  sf1: ["1", "13", "10", "5", "8", "12"],
  sf2: ["11", "7", "4", "3", "9", "6", "2"],
};

export type SharedScene = "full" | "empty" | "search_empty" | "loading";

export function readSharedScene(): SharedScene {
  try {
    const v = localStorage.getItem("ttt_demo_shared") ?? "";
    if (v === "empty" || v === "search_empty" || v === "loading") return v;
  } catch {
    return "full";
  }
  return "full";
}

/* The record page has two states: your own record, and one that arrived from
 * somebody else. This says which, and who it came from. */
export function readSharedRecordOwner(): SharedOwner | null {
  let key = "";
  try {
    key = localStorage.getItem("ttt_demo_shared_record") ?? "";
  } catch {
    return null;
  }
  if (!key) return null;
  const found = (SHARED_OWNERS as Record<string, SharedOwner>)[key];
  return found ?? SHARED_OWNERS.emma;
}
