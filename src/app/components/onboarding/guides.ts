/* The six guides of the "Get started" widget. Each guide is a short walk
   through real screens: a step names an anchor (`data-tour` attribute), the
   place it lives on, and two plain lines. No videos, no separate pages: the
   product explains itself in place.

   Copy rules (CLAUDE.md, Kirill's UX law): short, concrete, no long dashes,
   no grey helper text. One idea per step. */

export type TourTarget = { page: "dashboard" | "records" | "calendar" | "templates" | "shared" } | { path: string };

export type TourStep = {
  anchor: string;
  title: string;
  body: string;
  /* where the anchor lives; the tour navigates there before showing the step */
  go: TourTarget;
  /* preferred side for the card; the tour flips it when there is no room */
  side?: "top" | "bottom" | "left" | "right";
};

export type Guide = {
  id: string;
  title: string;
  minutes: number;
  steps: TourStep[];
};

/* The record the transcript guides open. Record 2 is the three-speaker weekly
   sync in the demo world, so every speaker step has something to point at. */
export const GUIDE_RECORD_PATH = "/transcriptions/2";

const HOME: TourTarget = { page: "dashboard" };
const RECORDS: TourTarget = { page: "records" };
const RECORD: TourTarget = { path: GUIDE_RECORD_PATH };

export const GUIDES: Guide[] = [
  {
    id: "first-record",
    title: "Make your first transcript",
    minutes: 1,
    steps: [
      { anchor: "home-cards|add-fab", go: HOME, side: "bottom", title: "Four ways in", body: "Upload a file, speak into the mic, record a meeting, or paste a link. Every one ends as a transcript in My Records." },
      { anchor: "home-card-record|add-fab", go: HOME, side: "bottom", title: "Instant speech", body: "Press it and talk. The words appear as you speak. Good for voice notes and quick thoughts." },
      { anchor: "home-card-meeting|add-fab", go: HOME, side: "bottom", title: "Meeting Recorder", body: "Give it a meeting link and the recorder joins, records and transcribes the call for you." },
    ],
  },
  {
    id: "read-transcript",
    title: "Read a transcript",
    minutes: 1,
    steps: [
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "Transcript and Summary", body: "Transcript is every word. Summary turns them into notes: decisions, action items, questions." },
      { anchor: "record-apply-template|record-tabs", go: RECORD, side: "bottom", title: "Apply template", body: "Pick how the summary is written: meeting notes, interview, action items, and 29 more." },
      { anchor: "record-translate|record-tabs", go: RECORD, side: "bottom", title: "Translate", body: "Choose a language and read the whole transcript in it." },
      { anchor: "record-export|record-tabs", go: RECORD, side: "bottom", title: "Export", body: "Save it as PDF, Word, plain text or subtitles." },
    ],
  },
  {
    id: "speakers",
    title: "Name the speakers",
    minutes: 1,
    steps: [
      { anchor: "record-speakers-chip", go: RECORD, side: "bottom", title: "Everyone who spoke", body: "Every voice on the recording is listed here. Rename or remove them in one place." },
      { anchor: "record-speaker-name", go: RECORD, side: "right", title: "Click a name to change it", body: "Click the name on any block and pick who really said it, for this block or for all of them." },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Split a block", body: "Select part of a block and pick a voice. Only the selected words move." },
    ],
  },
  {
    id: "folders",
    title: "Keep records in folders",
    minutes: 1,
    steps: [
      { anchor: "sidebar-folders|menu", go: RECORDS, side: "right", title: "Folders", body: "One folder per client or project. Click a folder to see only its records." },
      { anchor: "records-add-folder", go: RECORDS, side: "bottom", title: "Add a folder", body: "Name it and give it a colour. Records can be moved between folders at any time." },
      { anchor: "records-table", go: RECORDS, side: "top", title: "Drag to move", body: "Drag a record onto a folder, or tick several and move them at once." },
    ],
  },
  {
    id: "share",
    title: "Share a recording",
    minutes: 1,
    steps: [
      { anchor: "record-share|record-speakers-chip", go: RECORD, side: "bottom", title: "Share", body: "Send a link or invite people by email. They see this recording, its transcript and summary." },
      { anchor: "nav-shared|menu", go: RECORD, side: "right", title: "Shared with me", body: "Recordings other people share with you land here." },
    ],
  },
  {
    id: "find",
    title: "Find anything fast",
    minutes: 1,
    steps: [
      { anchor: "quick-find", go: HOME, side: "bottom", title: "Quick Find", body: "Search every transcript by the words that were said. Ctrl K opens it from anywhere." },
      { anchor: "nav-calendar|menu", go: HOME, side: "right", title: "Meetings", body: "Connect Google or Outlook and the recorder joins your meetings on its own." },
      { anchor: "nav-templates|menu", go: HOME, side: "right", title: "Templates", body: "Every summary template in one place. Pick one as your default." },
    ],
  },
];

/* The reward for finishing all six. */
export const REWARD = {
  code: "WELCOME1M",
  title: "1 month of Pro on us",
  body: "You know your way around. Use the code at checkout and the first month is free.",
};
