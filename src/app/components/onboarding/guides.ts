/* The six lessons of "Get started". Every lesson is a short walk through
   real screens: a step names an anchor (`data-tour` attribute, "a|b" = the
   first visible one wins), the place it lives on, and two plain lines.

   The lessons lean on the sample recording (record 2, the three-speaker
   weekly sync): a new account has nothing of its own yet, so the guide
   shows every feature on that recording, the way Granola and Notta seed a
   "quick guide" note. Nothing has to be clicked blind; the one real action
   the guide asks for is the last step of lesson 1, which opens the upload.

   Copy rules (CLAUDE.md, Kirill's UX law): short, concrete, no long dashes,
   no grey helper text, one idea per step. */

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
  /* what the person gets out of it, one line under the title */
  outcome: string;
  steps: TourStep[];
};

export const GUIDE_RECORD_PATH = "/transcriptions/2";

const HOME: TourTarget = { page: "dashboard" };
const RECORDS: TourTarget = { page: "records" };
const RECORD: TourTarget = { path: GUIDE_RECORD_PATH };

export const GUIDES: Guide[] = [
  {
    id: "first-record",
    title: "Make your first transcript",
    outcome: "Upload, record or paste a link",
    steps: [
      { anchor: "home-cards|add-fab", go: HOME, side: "bottom", title: "Four ways in", body: "A file, your voice, a meeting or a link. Each one becomes a transcript in My Records within minutes." },
      { anchor: "home-card-record|add-fab", go: HOME, side: "bottom", title: "Instant speech", body: "Press it and talk. The words appear as you speak. Good for voice notes and quick thoughts." },
      { anchor: "home-card-meeting|add-fab", go: HOME, side: "bottom", title: "Meeting Recorder", body: "Paste a meeting link and the recorder joins the call, records it and writes the transcript." },
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Start with a file", body: "Any audio or video works. Pick one now and watch it turn into text.", action: { label: "Upload a file", kind: "upload" } },
    ],
  },
  {
    id: "read-transcript",
    title: "Read a transcript",
    outcome: "Transcript, summary, translation, export",
    steps: [
      { anchor: "record-title", go: RECORD, side: "bottom", title: "A sample recording", body: "We put this meeting in your account so you can look around. Everything here works the same on your own recordings." },
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "Transcript and Summary", body: "Transcript is every word. Summary turns them into notes: decisions, action items, questions." },
      { anchor: "record-apply-template|record-tabs", go: RECORD, side: "bottom", title: "Apply template", body: "Pick how the summary is written: meeting notes, interview, action items, and 29 more." },
      { anchor: "record-translate|record-tabs", go: RECORD, side: "bottom", title: "Translate", body: "Choose a language and read the whole transcript in it." },
      { anchor: "record-export|record-tabs", go: RECORD, side: "bottom", title: "Export", body: "Save it as PDF, Word, plain text or subtitles." },
    ],
  },
  {
    id: "speakers",
    title: "Name the speakers",
    outcome: "Rename, merge and fix who said what",
    steps: [
      { anchor: "record-speakers-chip", go: RECORD, side: "bottom", title: "Everyone who spoke", body: "Every voice on the recording is listed here. Rename or remove any of them in one place." },
      { anchor: "record-speaker-name", go: RECORD, side: "right", title: "Click a name to change it", body: "Click the name on a block and pick who really said it, for this block or for all of them." },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Split a block", body: "Two people in one block? Select the words that belong to the other person and pick their name. Only those words move." },
    ],
  },
  {
    id: "folders",
    title: "Keep records in folders",
    outcome: "One folder per client or project",
    steps: [
      { anchor: "sidebar-folders|menu", go: RECORDS, side: "right", title: "Folders", body: "A folder holds the recordings of one client, project or team. Click one to see only its records." },
      { anchor: "records-add-folder", go: RECORDS, side: "bottom", title: "Create a folder", body: "Name it and give it a colour. You can also pick a folder while uploading, so the record lands in the right place from the start." },
      { anchor: "records-table", go: RECORDS, side: "top", title: "Move records", body: "Tick one or several records and choose Move to folder. A record lives in one folder at a time." },
      { anchor: "sidebar-folder-row|menu", go: RECORDS, side: "right", title: "Share a whole folder", body: "Hover a folder and press the people icon. Everyone you invite sees every recording in it, including the ones you add later." },
    ],
  },
  {
    id: "share",
    title: "Share a recording",
    outcome: "A link or an invite, with the summary",
    steps: [
      { anchor: "record-share|record-speakers-chip", go: RECORD, side: "bottom", title: "Share", body: "Send a link or invite people by email. They see this recording, its transcript and summary, nothing else." },
      { anchor: "nav-shared|menu", go: RECORD, side: "right", title: "Shared with me", body: "Recordings and folders other people share with you land here." },
    ],
  },
  {
    id: "find",
    title: "Find anything fast",
    outcome: "Search by the words that were said",
    steps: [
      { anchor: "quick-find", go: HOME, side: "bottom", title: "Quick Find", body: "Search every transcript by the words that were said. Ctrl K opens it from anywhere." },
      { anchor: "nav-calendar|menu", go: HOME, side: "right", title: "Meetings", body: "Connect Google or Outlook and the recorder joins your meetings on its own." },
      { anchor: "nav-templates|menu", go: HOME, side: "right", title: "Templates", body: "Every summary template in one place, with a worked example of each." },
    ],
  },
];

/* The reward for finishing all six. */
export const REWARD = {
  code: "WELCOME1M",
  title: "1 month of Pro on us",
  body: "You know your way around now. The first month of Pro is free with this code.",
};
