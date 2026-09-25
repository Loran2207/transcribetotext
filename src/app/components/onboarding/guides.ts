/* The six lessons of "Get started". A lesson is a short walk through real
   screens: a step names an anchor (`data-tour` attribute, "a|b" = the first
   visible one wins), the place it lives on, and one or two plain lines.

   Rules learned from Kirill's reviews (25-26.09):
   - a lesson never teleports: when it needs another screen, its first step
     is on the screen the person is on and says where we go next;
   - the lessons lean on the welcome recording, the one file a fresh account
     has, so nothing has to be clicked blind;
   - the only real action asked for is the end of lesson 1, "Upload a file",
     and that lesson counts as done only when an upload really starts;
   - as little text as possible. */

export type TourTarget = { page: "dashboard" | "records" | "calendar" | "templates" | "shared" } | { path: string };

export type TourStep = {
  anchor: string;
  title: string;
  body: string;
  go: TourTarget;
  side?: "top" | "bottom" | "left" | "right";
  /* the last step may end on a real action instead of "Done" */
  action?: { label: string; kind: "upload" };
};

export type Guide = {
  id: string;
  title: string;
  /* "action": the tour does not tick the lesson, a real action does */
  completeBy?: "action";
  steps: TourStep[];
};

export const GUIDE_RECORD_PATH = "/transcriptions/welcome";

const HOME: TourTarget = { page: "dashboard" };
const RECORDS: TourTarget = { page: "records" };
const RECORD: TourTarget = { path: GUIDE_RECORD_PATH };

/* the way from Home into the welcome recording, shared by three lessons */
const TO_RECORD: TourStep = { anchor: "home-records|records-table", go: HOME, side: "top", title: "Your recordings", body: "They all land here. The first one is a welcome recording we made for you. Let's open it." };

export const GUIDES: Guide[] = [
  {
    id: "first-record",
    title: "Make your first transcript",
    completeBy: "action",
    steps: [
      { anchor: "home-cards|add-fab", go: HOME, side: "bottom", title: "Four ways in", body: "A file, your voice, a meeting or a link. Each becomes a transcript in minutes." },
      { anchor: "home-card-record|add-fab", go: HOME, side: "bottom", title: "Instant speech", body: "Press and talk. The words appear as you speak." },
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Start with a file", body: "Any audio or video. Pick one and watch it turn into text.", action: { label: "Upload a file", kind: "upload" } },
    ],
  },
  {
    id: "read-transcript",
    title: "Read a transcript",
    steps: [
      TO_RECORD,
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "Transcript and Summary", body: "Transcript is every word. Summary turns them into notes." },
      { anchor: "record-apply-template|record-tabs", go: RECORD, side: "bottom", title: "Apply template", body: "Meeting notes, interview, action items: pick how the summary is written." },
      { anchor: "record-translate|record-tabs", go: RECORD, side: "bottom", title: "Translate", body: "Read the whole transcript in another language." },
      { anchor: "record-export|record-tabs", go: RECORD, side: "bottom", title: "Export", body: "PDF, Word, plain text or subtitles." },
    ],
  },
  {
    id: "speakers",
    title: "Name the speakers",
    steps: [
      TO_RECORD,
      { anchor: "record-speakers-chip", go: RECORD, side: "bottom", title: "Everyone who spoke", body: "Every voice, in one place. Rename or remove them here." },
      { anchor: "record-speaker-name", go: RECORD, side: "right", title: "Click a name to fix it", body: "Pick who really said it, for this block or for all of them." },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Two people in one block?", body: "Select the words that belong to the other person and pick their name. Only those words move." },
    ],
  },
  {
    id: "folders",
    title: "Keep records in folders",
    steps: [
      { anchor: "sidebar-folders|menu", go: HOME, side: "right", title: "Folders", body: "One per client or project. Click a folder to see only its records." },
      { anchor: "records-add-folder", go: RECORDS, side: "bottom", title: "Create one", body: "A name and a colour. You can also pick a folder while uploading." },
      { anchor: "records-table|home-records", go: RECORDS, side: "bottom", title: "Move records", body: "Tick one or more and choose Move to folder." },
      { anchor: "sidebar-folders|menu", go: RECORDS, side: "right", title: "Share a whole folder", body: "Once you have one, hover it and press the people icon. Everyone invited sees every recording in it." },
    ],
  },
  {
    id: "share",
    title: "Share a recording",
    steps: [
      TO_RECORD,
      { anchor: "record-share|record-speakers-chip", go: RECORD, side: "bottom", title: "Share", body: "A link or an invite by email. They see this recording, its transcript and summary." },
      { anchor: "nav-shared|menu", go: RECORD, side: "right", title: "Shared with me", body: "What other people share with you lands here." },
    ],
  },
  {
    id: "find",
    title: "Find anything fast",
    steps: [
      { anchor: "quick-find", go: HOME, side: "bottom", title: "Quick Find", body: "Search every transcript by the words that were said. Ctrl K from anywhere." },
      { anchor: "nav-calendar|menu", go: HOME, side: "right", title: "Meetings", body: "Connect your calendar and the recorder joins meetings on its own." },
      { anchor: "nav-templates|menu", go: HOME, side: "right", title: "Templates", body: "All summary templates, each with an example." },
    ],
  },
];

/* The reward for finishing all six. */
export const REWARD = {
  code: "WELCOME1M",
  title: "1 month of Pro on us",
  body: "You know your way around now. The first month of Pro is free with this code.",
};
