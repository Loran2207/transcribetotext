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
  /* the step opens (or closes) Quick Find, typing for the person */
  quickFind?: { open: boolean; query?: string };
  /* the step opens a real dialog of the page (`ttt-tour` window event) */
  trigger?: "share-open" | "share-close" | "speakers-open" | "speakers-close" | "add-folder-open" | "add-folder-close";
};

export type Guide = {
  id: string;
  title: string;
  /* how long the lesson takes, in seconds, shown beside the title */
  seconds: number;
  /* "action": the tour does not tick the lesson, a real action does */
  completeBy?: "action";
  steps: TourStep[];
};

export const GUIDE_RECORD_PATH = "/transcriptions/welcome";

const HOME: TourTarget = { page: "dashboard" };
const RECORDS: TourTarget = { page: "records" };
const RECORD: TourTarget = { path: GUIDE_RECORD_PATH };

/* the way from Home into the welcome recording, shared by three lessons */
const TO_RECORD: TourStep = { anchor: "record-row-welcome|home-records", go: HOME, side: "bottom", title: "Open the welcome recording", body: "Every transcript is a row here. Click one to open it. Next opens this one for you." };

export const GUIDES: Guide[] = [
  {
    id: "first-record",
    title: "Make your first transcript",
    seconds: 40,
    completeBy: "action",
    steps: [
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Start with a file", body: "MP3, MP4, WAV, any recording. Drop it here and the transcript is ready in minutes." },
      { anchor: "home-card-record|add-fab", go: HOME, side: "bottom", title: "Instant speech", body: "Press and talk. The words appear as you speak. Good for voice notes and dictation." },
      { anchor: "home-card-meeting|add-fab", go: HOME, side: "bottom", title: "Meeting Recorder", body: "Paste a Meet, Zoom or Teams invite. A bot joins the call, records it and writes the transcript and notes while you talk." },
      { anchor: "home-card-link|add-fab", go: HOME, side: "bottom", title: "Transcribe from URL", body: "A YouTube, Google Drive or Dropbox link. Nothing to download: paste it and go." },
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Your turn", body: "Pick any audio or video file. The lesson is done the moment it starts uploading.", action: { label: "Upload a file", kind: "upload" } },
    ],
  },
  {
    id: "read-transcript",
    title: "Read a transcript",
    seconds: 30,
    steps: [
      TO_RECORD,
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "Transcript and Summary", body: "Transcript is every word that was said. Summary turns it into notes." },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Timecodes", body: "Click one to hear that exact moment." },
      { anchor: "record-apply-template|record-tabs", go: RECORD, side: "bottom", title: "Apply template", body: "Meeting notes, interview, action items: pick how the summary is written." },
      { anchor: "record-export|record-tabs", go: RECORD, side: "bottom", title: "Export", body: "PDF, Word, plain text or subtitles. Translate to... above turns the whole transcript into another language first." },
    ],
  },
  {
    id: "speakers",
    title: "Name the speakers",
    seconds: 30,
    steps: [
      TO_RECORD,
      { anchor: "record-speakers-chip", go: RECORD, side: "bottom", title: "Everyone who spoke", body: "Every voice in one list. Next opens it.", trigger: "speakers-close" },
      { anchor: "speakers-panel", go: RECORD, side: "right", title: "Rename, add, remove", body: "Click a name to rename it. Remove a voice and its blocks go to someone else.", trigger: "speakers-open" },
      { anchor: "record-speaker-name", go: RECORD, side: "right", title: "Wrong name on a block?", body: "Click it and pick who really said it, for this block or for all of them.", trigger: "speakers-close" },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Two people in one block?", body: "Select the other person's words and pick their name. Only those words move." },
    ],
  },
  {
    id: "share",
    title: "Share a recording",
    seconds: 20,
    steps: [
      TO_RECORD,
      { anchor: "record-share|record-speakers-chip", go: RECORD, side: "bottom", title: "Share", body: "A link or an invite by email. Next opens it.", trigger: "share-close" },
      { anchor: "share-dialog", go: RECORD, side: "right", title: "Who can see it", body: "Anyone with the link, or only the people you invite. They see the recording, its transcript and summary.", trigger: "share-open" },
      { anchor: "nav-shared|menu", go: RECORD, side: "right", title: "Shared with me", body: "Recordings other people share with you land here.", trigger: "share-close" },
    ],
  },
  {
    id: "folders",
    title: "Keep records in folders",
    seconds: 30,
    steps: [
      { anchor: "nav-records|menu", go: HOME, side: "right", title: "My Records", body: "Every recording lives here. Next takes you there." },
      { anchor: "sidebar-folders|menu", go: RECORDS, side: "right", title: "Folders", body: "One per client or project. Click a folder to see only its recordings." },
      { anchor: "records-add-folder", go: RECORDS, side: "bottom", title: "Create one", body: "Next opens the form.", trigger: "add-folder-close" },
      { anchor: "add-folder-dialog", go: RECORDS, side: "right", title: "A name and a colour", body: "That is all a folder needs. It appears in the sidebar the moment you press Create.", trigger: "add-folder-open" },
      { anchor: "records-table|home-records", go: RECORDS, side: "bottom", title: "Move recordings", body: "Tick one or more and choose Move to folder. You can also pick a folder while uploading.", trigger: "add-folder-close" },
      { anchor: "sidebar-folders|menu", go: RECORDS, side: "right", title: "Share a whole folder", body: "Hover a folder and press the people icon. Everyone invited sees every recording in it." },
    ],
  },
  {
    id: "find",
    title: "Search your recordings",
    seconds: 20,
    steps: [
      { anchor: "quick-find", go: HOME, side: "bottom", title: "Quick Find", body: "Searches what was said, not only the titles. Ctrl K opens it from anywhere.", quickFind: { open: false, query: "" } },
      { anchor: "quick-find-input", go: HOME, side: "bottom", title: "Type what you remember", body: "A name, a topic, a phrase. We typed one for you.", quickFind: { open: true, query: "speaker" } },
      { anchor: "quick-find-results", go: HOME, side: "bottom", title: "Every match, with its moment", body: "Each result is a recording where those words were said. Click one to open it right there.", quickFind: { open: true } },
      { anchor: "quick-find-filters", go: HOME, side: "bottom", title: "Narrow it down", body: "By folder, source, who recorded it or when.", quickFind: { open: true } },
    ],
  },
];

/* The guide who walks you through: her portrait sits on every tour card and
   on the reward, the words are hers, the arrows only point. */
export const GUIDE_PERSON = { name: "Mia", avatar: "/images/onboarding-guide.jpg" };

/* The reward for finishing all six. */
export const REWARD = {
  code: "WELCOME1M",
  title: "Your first month is on us",
  body: "You know your way around now. This code makes the first month free.",
};
