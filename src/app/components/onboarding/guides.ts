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

/* a step with this anchor lights nothing: Mia speaks from her corner */
export const NO_ANCHOR = "none";

/* Mia's hello. It opens whichever lesson the person starts FIRST, once; after
   that she stays on the cards as a small portrait with her name and title. */
export const INTRO_STEP: TourStep = { anchor: NO_ANCHOR, go: { page: "dashboard" }, title: "Hi, I'm Mia", body: "I look after new customers here. I'll show you around Transcribe To Text AI: six short lessons, about a minute each. I explain, the arrows point." };

const HOME: TourTarget = { page: "dashboard" };
const RECORDS: TourTarget = { page: "records" };
const RECORD: TourTarget = { path: GUIDE_RECORD_PATH };

/* The way from Home into the welcome recording. Three lessons need it, so
   each gets its own line: the first explains, the next two only point. */
const OPEN_RECORD_FIRST: TourStep = { anchor: "record-row-welcome|home-records", go: HOME, side: "bottom", title: "Open the welcome recording", body: "Every transcript is a row here. I made this one for you. Next opens it." };
const OPEN_RECORD_AGAIN: TourStep = { anchor: "record-row-welcome|home-records", go: HOME, side: "bottom", title: "Back to the welcome recording", body: "Same file as before. Next opens it." };

export const GUIDES: Guide[] = [
  {
    id: "first-record",
    title: "Make your first transcript",
    seconds: 40,
    completeBy: "action",
    steps: [
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Start with a file", body: "MP3, MP4, WAV, any recording. Drop it here and the transcript is ready in minutes." },
      { anchor: "home-card-record|add-fab", go: HOME, side: "bottom", title: "Instant speech", body: "Press and talk. The words appear as you speak. Good for voice notes and dictation." },
      { anchor: "home-card-meeting|add-fab", go: HOME, side: "bottom", title: "Meeting Recorder", body: "Paste a Meet, Zoom or Teams invite. A bot joins the call, records it and writes the notes while you talk." },
      { anchor: "home-card-link|add-fab", go: HOME, side: "bottom", title: "Transcribe from URL", body: "A YouTube, Google Drive or Dropbox link. Nothing to download: paste it and go." },
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Your turn", body: "Pick any audio or video file. I count this lesson done the moment the upload starts.", action: { label: "Upload a file", kind: "upload" } },
    ],
  },
  {
    id: "read-transcript",
    title: "Read the result",
    seconds: 35,
    steps: [
      OPEN_RECORD_FIRST,
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "Transcript and Summary", body: "Transcript is every word that was said. Summary turns it into notes." },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Play from a timecode", body: "Click one to hear that exact moment." },
      { anchor: "record-apply-template|record-tabs", go: RECORD, side: "bottom", title: "Shape the summary", body: "Meeting notes, interview, action items: pick how the summary is written." },
      { anchor: "record-translate|record-tabs", go: RECORD, side: "bottom", title: "Translate it", body: "Pick a language and the whole transcript and summary come back in it." },
      { anchor: "record-export|record-tabs", go: RECORD, side: "bottom", title: "Export", body: "PDF, Word, plain text or subtitles." },
    ],
  },
  {
    id: "speakers",
    title: "Fix the speakers",
    seconds: 30,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-speakers-chip", go: RECORD, side: "bottom", title: "Two voices, one unnamed", body: "The app heard two people. Speaker 2 still needs a name. Next opens the list.", trigger: "speakers-close" },
      { anchor: "speakers-panel", go: RECORD, side: "right", title: "Rename, add, remove", body: "Click a name to rename it. Remove a voice and its blocks go to someone else.", trigger: "speakers-open" },
      { anchor: "record-speaker-name", go: RECORD, side: "right", title: "Wrong name on one block?", body: "Click the name on that block and pick who really said it.", trigger: "speakers-close" },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Two people in one block?", body: "Select the other person's words and pick their name. Only those words move." },
    ],
  },
  {
    id: "share",
    title: "Share and copy",
    seconds: 25,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-share|record-speakers-chip", go: RECORD, side: "bottom", title: "Share", body: "Invite people by email or turn on a link. Next opens it.", trigger: "share-close" },
      { anchor: "share-dialog", go: RECORD, side: "right", title: "Who can see it", body: "Only the people you invite, or anyone with the link. They see the recording, its transcript and summary.", trigger: "share-open" },
      { anchor: "record-copy|record-share", go: RECORD, side: "bottom", title: "Copy the text", body: "The transcript, the summary or a link, straight to your clipboard. No export needed.", trigger: "share-close" },
      { anchor: "nav-shared|menu", go: RECORD, side: "right", title: "Shared with me", body: "Recordings other people share with you land here." },
    ],
  },
  {
    id: "folders",
    title: "Organize your records",
    seconds: 35,
    steps: [
      { anchor: "nav-records|menu", go: HOME, side: "right", title: "My Records", body: "Every recording lives here. Next takes you there." },
      { anchor: "records-tabs|home-records", go: RECORDS, side: "bottom", title: "Recent, Starred, Shared, Trash", body: "Star what you come back to. Trash keeps deleted recordings until you empty it." },
      { anchor: "records-add-folder", go: RECORDS, side: "bottom", title: "Create a folder", body: "One per client or project. Next opens the form.", trigger: "add-folder-close" },
      { anchor: "add-folder-dialog", go: RECORDS, side: "right", title: "A name and a colour", body: "That is all a folder needs. It appears in the sidebar the moment you press Create.", trigger: "add-folder-open" },
      { anchor: "records-table|home-records", go: RECORDS, side: "bottom", title: "Move recordings", body: "Tick one or more and choose Move to folder. You can also pick a folder while uploading.", trigger: "add-folder-close" },
      { anchor: "sidebar-folders|menu", go: RECORDS, side: "right", title: "Share a whole folder", body: "Hover a folder and press the people icon. Everyone invited sees every recording in it." },
    ],
  },
  {
    id: "find",
    title: "Find anything, record meetings",
    seconds: 30,
    steps: [
      { anchor: "quick-find", go: HOME, side: "bottom", title: "Quick Find", body: "Searches what was said, not only the titles. Ctrl K opens it from anywhere.", quickFind: { open: false, query: "" } },
      { anchor: "quick-find-input", go: HOME, side: "bottom", title: "Type what you remember", body: "A name, a topic, a phrase. I typed one for you.", quickFind: { open: true, query: "speaker" } },
      { anchor: "quick-find-results", go: HOME, side: "bottom", title: "Every match, with its moment", body: "Each result is a recording where those words were said. Click one to open it right there.", quickFind: { open: true } },
      { anchor: "quick-find-filters", go: HOME, side: "bottom", title: "Narrow it down", body: "By folder, source, who recorded it or when.", quickFind: { open: true } },
      { anchor: "nav-calendar|menu", go: HOME, side: "right", title: "Meetings", body: "Connect your calendar and the recorder joins your calls on its own." },
    ],
  },
];

/* The guide who walks you through: her portrait sits on every tour card and
   on the reward, the words are hers, the arrows only point. */
export const GUIDE_PERSON = { name: "Mia", title: "Customer Success Lead", avatar: "/images/onboarding-guide.png", figure: "/images/onboarding-mia.png" };


/* The reward for finishing all six. */
export const REWARD = {
  code: "WELCOME1M",
  title: "Your first month is on us",
  body: "You know your way around now. This code makes the first month free.",
};
