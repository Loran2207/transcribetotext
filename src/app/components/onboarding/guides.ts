/* The Academy lessons. A lesson is a short walk through real
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

export type TourTarget = { page: "dashboard" | "records" | "calendar" | "templates" | "shared" | "academy" | "settings" } | { path: string };

export type TourStep = {
  anchor: string;
  title: string;
  body: string;
  /* the words on a phone, where the control lives somewhere else (a sheet, the More menu) */
  phoneBody?: string;
  /* the words below 1024px, where the right panel is gone and a top bar button stands in */
  compactBody?: string;
  go: TourTarget;
  side?: "top" | "bottom" | "left" | "right";
  /* the last step may end on a real action instead of "Done" */
  action?: { label: string; kind: "upload" };
  /* the last step of a First steps tour: the page stays live under Mia's card, the person does the thing right there */
  handoff?: boolean;
  /* the step opens (or closes) Quick Find, typing for the person */
  quickFind?: { open: boolean; query?: string };
  /* the step opens a real dialog of the page (`ttt-tour` window event) */
  trigger?: string;
};

export type Guide = {
  /* a First steps tour: it explains one step and ends by itself when that step is credited */
  forStep?: string;
  id: string;
  title: string;
  /* how long the lesson takes, in seconds, shown beside the title */
  seconds: number;
  /* Academy: the cover photograph, the section it sits in, one line of what you can do after */
  cover: string;
  category: string;
  summary: string;
  /* "action": the tour does not tick the lesson, a real action does */
  completeBy?: "action";
  steps: TourStep[];
};

export const GUIDE_RECORD_PATH = "/transcriptions/welcome";

/* a step with this anchor lights nothing: Mia speaks from her corner */
export const NO_ANCHOR = "none";

/* Mia's hello. It opens whichever lesson the person starts FIRST, once; after
   that she stays on the cards as a small portrait with her name and title. */
export const INTRO_STEP: TourStep = { anchor: NO_ANCHOR, go: { page: "dashboard" }, title: "Hi, I'm Mia", body: "I look after new customers here. Every lesson in the Academy takes half a minute: I show you the real screens, you can stop any time." };

const HOME: TourTarget = { page: "dashboard" };
const RECORDS: TourTarget = { page: "records" };
const RECORD: TourTarget = { path: GUIDE_RECORD_PATH };

/* The way from Home into the welcome recording. Three lessons need it, so
   each gets its own line: the first explains, the next two only point. */
const OPEN_RECORD_FIRST: TourStep = { anchor: "record-row-welcome|home-records", go: HOME, side: "bottom", title: "Open the welcome recording", body: "Every transcript is a row here. I made this one for you. Next opens it." };
const OPEN_RECORD_AGAIN: TourStep = { anchor: "record-row-welcome|home-records", go: HOME, side: "bottom", title: "Back to the welcome recording", body: "Same file as before. Next opens it." };

const TEMPLATES: TourTarget = { page: "templates" };
const CALENDAR: TourTarget = { page: "calendar" };

/* Every lesson opens on the whole page it lives on, so the person sees where
   they are before one control lights up (Kirill, review 55). */
const PAGE_HOME: TourStep = { anchor: "page-home", go: HOME, side: "bottom", title: "This is Home", body: "Four ways to make a transcript at the top, your recordings below, your plan and the guide on the right." };
const PAGE_RECORD: TourStep = { anchor: "page-record", go: RECORD, side: "bottom", title: "A recording", body: "The transcript on the left, the tools above it, notes and outline on the right." };
const PAGE_RECORDS: TourStep = { anchor: "page-records", go: RECORDS, side: "bottom", title: "My Records", body: "Every recording you own, in one table. Tabs above, folders in the sidebar." };
const PAGE_TEMPLATES: TourStep = { anchor: "page-templates", go: TEMPLATES, side: "bottom", title: "Templates", body: "Every way a summary can be written, built in and yours." };
const PAGE_MEETINGS: TourStep = { anchor: "page-meetings", go: CALENDAR, side: "bottom", title: "Meetings", body: "Your calendar with a recorder attached. Upcoming, past, and the calendars you connected.", trigger: "meetings-upcoming" };

const RAW_GUIDES: Array<Omit<Guide, "cover" | "category" | "summary">>= [
  {
    id: "first-record",
    title: "Make your first transcript",
    seconds: 45,
    completeBy: "action",
    steps: [
      PAGE_HOME,
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Start with a file", body: "MP3, MP4, WAV, any recording. Drop it here and the transcript is ready in minutes." },
      { anchor: "home-card-record|add-fab", go: HOME, side: "bottom", title: "Instant speech", body: "Press and talk. The words appear as you speak. Good for voice notes and dictation." },
      { anchor: "home-card-meeting|add-fab", go: HOME, side: "bottom", title: "Meeting Recorder", body: "Paste a Meet, Zoom or Teams invite. A bot joins the call, records it and writes the notes while you talk." },
      { anchor: "home-card-link|add-fab", go: HOME, side: "bottom", title: "Transcribe from URL", body: "A YouTube, Google Drive or Dropbox link. Nothing to download: paste it and go." },
      { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Your turn", body: "Pick any audio or video file. I count this lesson done the moment the upload starts.", action: { label: "Upload a file", kind: "upload" } },
    ],
  },
  {
    id: "read-transcript",
    title: "Read and listen",
    seconds: 40,
    steps: [
      OPEN_RECORD_FIRST,
      PAGE_RECORD,
      { anchor: "record-title", go: RECORD, side: "bottom", title: "The title is yours", body: "Click it to rename. Underneath: who made it, the folder, the speakers, the source and the length." },
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "Transcript and Summary", body: "Transcript is every word, as it was said. Summary is the notes. We start on the transcript.", trigger: "tab-transcript" },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Click a timecode", body: "The player jumps to that moment. While it plays, the words follow the voice." },
      { anchor: "record-transport|record-play", go: RECORD, side: "top", title: "Play, back, forward", body: "Play starts where you are. The arrows step back or forward five seconds when you missed a word." },
      { anchor: "record-speed|record-transport", go: RECORD, side: "top", title: "Set the pace", body: "Half speed for a fast talker, double speed for a long call." },
      { anchor: "record-view-toggles|record-tabs", go: RECORD, side: "bottom", title: "Hide the names", body: "I switched Speakers off: the text reads as one clean block. Switch it back any time.", trigger: "view-speakers-off" },
      { anchor: "record-view-toggles|record-tabs", go: RECORD, side: "bottom", title: "And the timecodes", body: "Timestamps goes the same way. I put both back for you.", trigger: "view-timestamps-off" },
    ],
  },
  {
    id: "translate",
    title: "Translate a recording",
    seconds: 30,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-translate|record-translate-tablet|record-translate-phone|record-tabs", go: RECORD, side: "bottom", title: "Translate to", body: "The transcript and the summary, in another language. Next opens the list.", trigger: "view-reset" },
      { anchor: "record-translate-menu|record-translate", go: RECORD, side: "left", title: "Pick a language", body: "Dozens of them. I'll take Spanish for this one.", trigger: "translate-open" },
      { anchor: "record-translate|record-translate-tablet|record-translate-phone", go: RECORD, side: "bottom", title: "Then press Translate", body: "Spanish is picked. The Translate button next to it starts the work.", phoneBody: "Spanish is picked. On a phone the work starts the moment you pick a language.", trigger: "translate-pick" },
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "A tab for each language", body: "The Spanish transcript opens next to the original. Nothing is replaced: switch between them any time.", trigger: "translate-run" },
      { anchor: "record-copy|record-tabs", go: RECORD, side: "bottom", title: "Copy or export it", body: "Copy and Export now ask which language you want." },
    ],
  },
  {
    id: "edit-transcript",
    title: "Correct the transcript",
    seconds: 30,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-edit|record-tabs", go: RECORD, side: "bottom", title: "Edit transcript", body: "A name, a term, a word the model misheard. Next turns the text into editing.", trigger: "edit-close" },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Click straight into the text", body: "Every block is a field now. I put the cursor in the first one: type to fix it, like in any document.", trigger: "edit-focus" },
      { anchor: "record-edit-bar|record-tabs", go: RECORD, side: "bottom", title: "Undo, reset, save", body: "Undo steps back one change. Reset to original brings back what the model wrote. Save keeps it for everyone you share with.", trigger: "edit-open" },
      { anchor: "record-edit|record-tabs", go: RECORD, side: "bottom", title: "Nothing is lost", body: "Timecodes and speakers stay where they are. I leave editing now without saving.", trigger: "edit-close" },
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
    id: "summary",
    title: "Shape the summary",
    seconds: 35,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-tabs", go: RECORD, side: "bottom", title: "The Summary tab", body: "Notes written from the transcript: the decisions, the action items, what to remember.", trigger: "tab-summary" },
      { anchor: "record-apply-template|record-tabs", go: RECORD, side: "bottom", title: "Apply template", body: "A template decides the shape: meeting notes, interview, lecture, action items. Pick one and the summary is rewritten in it." },
      { anchor: "nav-templates|menu", go: HOME, side: "right", title: "All templates live here", body: "Next takes you to the Templates page.", trigger: "tab-transcript" },
      PAGE_TEMPLATES,
      { anchor: "templates-tabs", go: TEMPLATES, side: "bottom", title: "Ready to use", body: "Meeting notes, interviews, lectures and more. Star the ones you use and they stay close." },
      { anchor: "templates-grid|templates-tabs", go: TEMPLATES, side: "top", title: "See it before you apply", body: "Open a template to read its example summary. Then apply it from any recording." },
    ],
  },
  {
    id: "export",
    title: "Export a recording",
    seconds: 30,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-export|record-tabs", go: RECORD, side: "bottom", title: "Export", body: "Everything about this recording, as files. Next opens the options.", trigger: "export-close" },
      { anchor: "export-row-transcript|export-dialog", go: RECORD, side: "right", title: "Transcript", body: "PDF, Word, plain text or subtitles. Choose whether speaker names and timestamps go in.", trigger: "export-open" },
      { anchor: "export-row-summary|export-dialog", go: RECORD, side: "right", title: "Summary, translation, audio", body: "Each one is a switch. Turn on what you need, the rest stays out.", trigger: "export-open" },
      { anchor: "export-go|export-dialog", go: RECORD, side: "top", title: "One click", body: "Several files come as one zip. I close this for you now.", trigger: "export-open" },
    ],
  },
  {
    id: "share",
    title: "Share and copy",
    seconds: 30,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-share|record-speakers-chip", go: RECORD, side: "bottom", title: "Share", body: "Invite people by email or turn on a link. Next opens it.", trigger: "share-close" },
      { anchor: "share-dialog", go: RECORD, side: "right", title: "Who can see it", body: "Only the people you invite, or anyone with the link. They see the recording, its transcript and its summary.", trigger: "share-open" },
      { anchor: "record-copy|record-share|record-more", go: RECORD, side: "bottom", title: "Or just copy", body: "No invite needed when you only want the words. Next opens Copy.", phoneBody: "No invite needed when you only want the words. Copy is under More; Next opens it.", trigger: "share-close" },
      { anchor: "record-copy-menu|record-copy", go: RECORD, side: "left", title: "Transcript or summary", body: "Either one goes straight to your clipboard, ready to paste into an email or a doc.", trigger: "copy-open" },
      { anchor: "nav-shared|menu", go: HOME, side: "right", title: "Shared with me", body: "Recordings other people share with you land here.", trigger: "copy-close" },
    ],
  },
  {
    id: "folders",
    title: "Organize your records",
    seconds: 35,
    steps: [
      { anchor: "nav-records|menu", go: HOME, side: "right", title: "Where recordings live", body: "My Records, in the sidebar. Next takes you there." },
      PAGE_RECORDS,
      { anchor: "records-tabs|home-records", go: RECORDS, side: "bottom", title: "Recent, Starred, Shared, Trash", body: "Star what you come back to. Trash keeps deleted recordings until you empty it." },
      { anchor: "records-add-folder", go: RECORDS, side: "bottom", title: "Create a folder", body: "One per client or project. Next opens the form.", trigger: "add-folder-close" },
      { anchor: "add-folder-dialog", go: RECORDS, side: "right", title: "A name and a colour", body: "That is all a folder needs. It appears in the sidebar the moment you press Create.", trigger: "add-folder-open" },
      { anchor: "records-table|records-first-card|home-records", go: RECORDS, side: "bottom", title: "Move recordings", body: "Tick one or more and choose Move to folder. You can also pick a folder while uploading.", trigger: "add-folder-close" },
      { anchor: "sidebar-folders|menu", go: RECORDS, side: "right", title: "Share a whole folder", body: "Hover a folder and press the people icon. Everyone invited sees every recording in it." },
    ],
  },
  {
    id: "meetings",
    title: "Record your meetings",
    seconds: 35,
    steps: [
      { anchor: "nav-calendar|menu", go: HOME, side: "right", title: "Where your calls live", body: "Meetings, in the sidebar. Next takes you there." },
      PAGE_MEETINGS,
      { anchor: "meetings-tabs|meetings-connect", go: CALENDAR, side: "bottom", title: "Upcoming, past, settings", body: "What is coming, what was recorded, and the calendars behind it, once a calendar is connected.", trigger: "meetings-upcoming" },
      { anchor: "meetings-accounts|meetings-connect|meetings-tabs", go: CALENDAR, side: "top", title: "Connect a calendar once", body: "Google or Outlook. Every meeting shows up here by itself. With nothing connected, this page asks you to connect first.", trigger: "meetings-upcoming" },
      { anchor: "calendar-week|meetings-tabs|meetings-connect", go: CALENDAR, side: "bottom", title: "Auto-record", body: "Each meeting has a switch. On, and the recorder joins by itself; the transcript is ready when the call ends.", trigger: "meetings-upcoming" },
      { anchor: "home-card-meeting|add-fab|nav-calendar", go: HOME, side: "bottom", title: "Or record one now", body: "Paste any invite link from the Home page. Same recorder, no calendar needed." },
    ],
  },
  {
    id: "find",
    title: "Find anything fast",
    seconds: 25,
    steps: [
      { anchor: "quick-find", go: HOME, side: "bottom", title: "Quick Find", body: "Searches what was said, not only the titles. Ctrl K opens it from anywhere.", quickFind: { open: false, query: "" } },
      { anchor: "quick-find-input", go: HOME, side: "bottom", title: "Type what you remember", body: "A name, a topic, a phrase. I typed one for you.", quickFind: { open: true, query: "record" } },
      { anchor: "quick-find-results", go: HOME, side: "bottom", title: "Every match, with its moment", body: "Each result is a recording where those words were said. Click one to open it right there.", quickFind: { open: true } },
      { anchor: "quick-find-filters", go: HOME, side: "bottom", title: "Narrow it down", body: "By folder, source, who recorded it or when.", quickFind: { open: true } },
    ],
  },
  {
    id: "meeting-settings",
    title: "Tune the meeting recorder",
    seconds: 30,
    steps: [
      { anchor: "nav-calendar|menu", go: HOME, side: "right", title: "Where your calls live", body: "Meetings, in the sidebar. Next takes you there." },
      PAGE_MEETINGS,
      { anchor: "meetings-tabs|meetings-connect", go: CALENDAR, side: "bottom", title: "Settings", body: "Everything the recorder does by itself is set here, once a calendar is connected.", trigger: "meetings-settings" },
      { anchor: "meetings-autorecord|meetings-connect", go: CALENDAR, side: "bottom", title: "Auto-record", body: "Choose which meetings the recorder joins on its own.", trigger: "meetings-settings" },
      { anchor: "meetings-recap|meetings-connect", go: CALENDAR, side: "top", title: "After the call", body: "Who gets the recap email and access to the recording.", trigger: "meetings-settings" },
    ],
  },
  {
    id: "highlights",
    title: "Highlight, comment, share a part",
    seconds: 25,
    steps: [
      OPEN_RECORD_AGAIN,
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Point at a block", body: "When the mouse is over a block, a small bar appears on it. I show it for you.", trigger: "tab-transcript" },
      { anchor: "record-hover-bar|record-transcript-body", go: RECORD, side: "left", title: "Four things for one block", body: "Highlight it, comment on it, share just that part, or copy its text.", trigger: "hoverbar-show" },
      { anchor: "record-transcript-body", go: RECORD, side: "top", title: "Or select a few words", body: "Select the words you need: only they get the highlight, the comment or the new speaker.", trigger: "hoverbar-hide" },
    ],
  },
  {
    id: "trash",
    title: "Bring back a deleted file",
    seconds: 20,
    steps: [
      { anchor: "nav-records|menu", go: HOME, side: "right", title: "Where recordings live", body: "My Records, in the sidebar. Next takes you there." },
      PAGE_RECORDS,
      { anchor: "records-tab-trash|records-tabs", go: RECORDS, side: "bottom", title: "Trash", body: "A deleted recording waits here. Nothing is gone at once.", trigger: "records-trash" },
      { anchor: "records-table|records-tabs", go: RECORDS, side: "bottom", title: "Restore or delete for good", body: "Open a row's menu: put it back where it was, or remove it forever.", trigger: "records-trash" },
    ],
  },
  {
    id: "plan",
    title: "Your plan and limits",
    seconds: 20,
    steps: [
      PAGE_HOME,
      { anchor: "plan-card|mobile-plan", go: HOME, side: "left", title: "What Free includes", body: "The files you have used this month and the day the count resets.", compactBody: "This button opens your plan: what Free includes and what an upgrade adds." },
      { anchor: "plan-cta|plan-card|mobile-plan", go: HOME, side: "left", title: "When you need more", body: "Start the trial or upgrade, right from this card.", compactBody: "Start the trial or upgrade from the same button." },
    ],
  },
];

/* The Academy: every lesson gets a cover, a section and one plain line of
   what you can do once it is done. Sections are the order the page shows. */
export const ACADEMY_SECTIONS: { id: string; tab: string; title: string; subtitle: string }[] = [
  { id: "create", tab: "Create", title: "Create", subtitle: "Get a transcript out of anything" },
  { id: "work", tab: "Transcripts", title: "Work with a transcript", subtitle: "Read it, fix it, shape the notes" },
  { id: "share", tab: "Share", title: "Share and export", subtitle: "Get it to the people who need it" },
  { id: "organize", tab: "Organize", title: "Organize and find", subtitle: "Keep a hundred recordings in order" },
  { id: "account", tab: "Account", title: "Your account", subtitle: "Plan, limits and what is included" },
];

const GUIDE_META: Record<string, { cover: string; category: string; summary: string }> = {
  "first-record": { cover: "/images/academy3/first-record.jpg", category: "create", summary: "Turn a file, your voice, a meeting or a link into a transcript." },
  "meetings": { cover: "/images/academy3/meetings.jpg", category: "create", summary: "Connect a calendar and let the recorder join your calls by itself." },
  "read-transcript": { cover: "/images/academy3/read-transcript.jpg", category: "work", summary: "Read it, play it from any word, set the pace, hide what you do not need." },
  "translate": { cover: "/images/academy3/translate.jpg", category: "work", summary: "The transcript and summary in another language, next to the original." },
  "edit-transcript": { cover: "/images/academy3/edit-transcript.jpg", category: "work", summary: "Fix names and misheard words straight in the text." },
  "speakers": { cover: "/images/academy3/speakers.jpg", category: "work", summary: "Name the voices and move words to the right person." },
  "summary": { cover: "/images/academy3/summary.jpg", category: "work", summary: "Pick a template and get the notes in the shape you need." },
  "export": { cover: "/images/academy3/export.jpg", category: "share", summary: "PDF, Word, text or subtitles, with the options you choose." },
  "share": { cover: "/images/academy3/share.jpg", category: "share", summary: "Invite people, turn on a link, or copy the transcript, summary or link." },
  "folders": { cover: "/images/academy3/folders.jpg", category: "organize", summary: "Folders, tabs and starred recordings." },
  "find": { cover: "/images/academy3/find.jpg", category: "organize", summary: "Search what was said, across every recording." },
  "meeting-settings": { cover: "/images/academy3/meeting-settings.jpg", category: "create", summary: "Which calls the recorder joins, and who gets the recap." },
  "highlights": { cover: "/images/academy3/highlights.jpg", category: "work", summary: "Mark the part that matters, comment on it, share or copy just that." },
  "trash": { cover: "/images/academy3/trash.jpg", category: "organize", summary: "Restore a deleted recording, or remove it for good." },
  "plan": { cover: "/images/academy3/plan.jpg", category: "account", summary: "What Free includes, and how to get more." },
};
export const GUIDES: Guide[] = RAW_GUIDES.map((g) => ({ ...g, ...GUIDE_META[g.id] }));

/* First steps (review 58-59, Kirill 29.09): the real actions a new account
   tries once, each done by doing it in the product (the component fires
   `creditOnboarding(id)`); `how` is the Academy lesson behind it. Review 59:
   every way in is its own step, so the list reads "try this, try that". Every
   step works on the Free plan, so the bonus can always be earned (sharing is
   paid, so it is not here). Client call 05.10: the photo step is gone, "Edit
   the transcript" takes its place, and speakers go last. Each step opens its
   own short tour (`STEP_TOURS`), so Mia always says what to do. */
export type SetupItem = { id: string; title: string; why: string; how: string; group: "try" | "yours"; cta: string; parts?: { id: string }[] };
export const SETUP: SetupItem[] = [
  { id: "way-file", title: "Upload a file", why: "Audio or video from your computer.", how: "first-record", group: "try", cta: "Upload" },
  { id: "way-voice", title: "Try Instant speech", why: "Talk, and watch it become text.", how: "first-record", group: "try", cta: "Try" },
  { id: "way-meeting", title: "Send the recorder to a call", why: "Paste a Zoom, Meet or Teams link.", how: "first-record", group: "try", cta: "Try" },
  { id: "way-link", title: "Transcribe a link", why: "YouTube, Drive, Dropbox and more.", how: "first-record", group: "try", cta: "Paste" },
  { id: "calendar", title: "Connect your calendar", why: "The recorder joins your meetings by itself.", how: "meetings", group: "yours", cta: "Connect" },
  { id: "template", title: "Apply a template", why: "Notes in the shape you need, every time.", how: "summary", group: "yours", cta: "Show me" },
  { id: "edit", title: "Edit the transcript", why: "Fix a word the model misheard.", how: "edit-transcript", group: "yours", cta: "Show me" },
  { id: "folders", title: "Create a folder", why: "One per client or project.", how: "folders", group: "yours", cta: "Show me" },
  { id: "speakers", title: "Name a speaker", why: "So the notes say who said what.", how: "speakers", group: "yours", cta: "Show me" },
];
export const SETUP_GROUPS: { id: SetupItem["group"]; title: string }[] = [
  { id: "try", title: "Try every way in" },
  { id: "yours", title: "Make it yours" },
];
export const setupIds = (x: SetupItem) => (x.parts ? x.parts.map((p) => p.id) : [x.id]);
export const isSetupDone = (x: SetupItem, has: (id: string) => boolean) => setupIds(x).every(has);
export const SETUP_ACTION_IDS = SETUP.flatMap(setupIds);
export const setupComplete = (has: (id: string) => boolean) => SETUP.every((x) => isSetupDone(x, has));

/* The guide who walks you through: her portrait sits on every tour card and
   on the reward, the words are hers, the arrows only point. */
export const GUIDE_PERSON = { name: "Mia", title: "Customer Success Lead", avatar: "/images/onboarding-guide.png", figure: "/images/onboarding-mia.png" };


/* The bonus for finishing the first steps (client call 05.10): better
   processing, not a subscription. No code, no checkout. */
export const REWARD = {
  title: "Priority processing is on",
  body: "You know your way around now. From here your recordings skip the queue and get our highest-quality transcript.",
};

/* One short tour per First step (client call 05.10, mechanism from the
   variant b branch): it walks to the exact control, opens what needs opening
   and hands over. The last card stays while the person does the thing, the
   page under it stays live, and the tour ends by itself when the step is
   credited. Not listed in the Academy. */
const STEP_META = { cover: "", category: "", summary: "" };
const OPEN_RECORD_FOR_STEP: TourStep = { anchor: "record-row-welcome|home-records", go: HOME, side: "bottom", title: "Open the welcome recording", body: "I made this one for you, so you can try it on real text. Next opens it." };
export const STEP_TOURS: Guide[] = [
  { ...STEP_META, id: "step-way-file", forStep: "way-file", title: "Upload a file", seconds: 15, steps: [
    { anchor: "home-card-upload|add-fab", go: HOME, side: "bottom", title: "Audio and video files", body: "This card takes any recording from your computer. Next opens it.", trigger: "upload-close" },
    { anchor: "upload-drop", go: HOME, side: "right", title: "Drop a file here", body: "Or click to choose one, then press Start transcription. The step is done the moment the upload starts.", trigger: "upload-open", handoff: true },
  ] },
  { ...STEP_META, id: "step-way-voice", forStep: "way-voice", title: "Try Instant speech", seconds: 15, steps: [
    { anchor: "home-card-record|add-fab", go: HOME, side: "bottom", title: "Instant speech", body: "Talk, and the words appear as you speak. Next opens it.", trigger: "record-close" },
    { anchor: "recording-stop|record-start", go: HOME, side: "right", title: "Say a few words", body: "Press Start recording and talk for a few seconds. Press the red Stop and the step is done.", trigger: "record-open", handoff: true },
  ] },
  { ...STEP_META, id: "step-way-meeting", forStep: "way-meeting", title: "Send the recorder to a call", seconds: 15, steps: [
    { anchor: "home-card-meeting|add-fab", go: HOME, side: "bottom", title: "Meeting Recorder", body: "A bot joins a Zoom, Meet or Teams call and writes the notes. Next opens it.", trigger: "meeting-close" },
    { anchor: "meeting-url", go: HOME, side: "right", title: "Paste the invite link", body: "Copy it from the calendar invite, paste it here and press Transcribe now. The step is done when the recorder is on its way.", trigger: "meeting-open", handoff: true },
  ] },
  { ...STEP_META, id: "step-way-link", forStep: "way-link", title: "Transcribe a link", seconds: 15, steps: [
    { anchor: "home-card-link|add-fab", go: HOME, side: "bottom", title: "Transcribe from URL", body: "YouTube, Google Drive, Dropbox and more. Next opens it.", trigger: "link-close" },
    { anchor: "link-url", go: HOME, side: "right", title: "Paste a link", body: "Any public video or audio link, then press Start transcription. The step is done the moment it starts.", trigger: "link-open", handoff: true },
  ] },
  { ...STEP_META, id: "step-calendar", forStep: "calendar", title: "Connect your calendar", seconds: 15, steps: [
    { anchor: "nav-calendar|menu", go: HOME, side: "right", title: "Meetings", body: "Your calendar lives here. Next takes you there." },
    { anchor: "meetings-connect|meetings-accounts|meetings-tabs", go: CALENDAR, side: "top", title: "Connect Google or Outlook", body: "Pick one and sign in. Your meetings then show up here by themselves.", trigger: "meetings-upcoming", handoff: true },
  ] },
  { ...STEP_META, id: "step-template", forStep: "template", title: "Apply a template", seconds: 15, steps: [
    OPEN_RECORD_FOR_STEP,
    { anchor: "template-picker|record-apply-template|record-tabs", go: RECORD, side: "bottom", title: "Press Apply template", body: "Pick a shape: meeting notes, interview, action items. The summary is rewritten in it.", handoff: true },
  ] },
  { ...STEP_META, id: "step-edit", forStep: "edit", title: "Edit the transcript", seconds: 15, steps: [
    OPEN_RECORD_FOR_STEP,
    { anchor: "record-edit-bar|record-edit|record-more", go: RECORD, side: "top", title: "Fix a word", body: "Press Edit transcript, click into the text, change a word and press Save. That is the step.", phoneBody: "Open More and press Edit transcript. Change a word, then press Save. That is the step.", trigger: "tab-transcript", handoff: true },
  ] },
  { ...STEP_META, id: "step-folders", forStep: "folders", title: "Create a folder", seconds: 15, steps: [
    { anchor: "nav-records|menu", go: HOME, side: "right", title: "My Records", body: "Folders live here. Next opens a new one." },
    { anchor: "add-folder-dialog", go: RECORDS, side: "right", title: "Name it, press Create Folder", body: "One folder per client or project. It shows up in your folders at once.", trigger: "add-folder-open", handoff: true },
  ] },
  { ...STEP_META, id: "step-speakers", forStep: "speakers", title: "Name a speaker", seconds: 15, steps: [
    OPEN_RECORD_FOR_STEP,
    { anchor: "record-speakers-chip", go: RECORD, side: "bottom", title: "Two voices, one unnamed", body: "Speaker 2 still needs a name. Next opens the list.", trigger: "speakers-close" },
    { anchor: "speakers-panel", go: RECORD, side: "right", title: "Give Speaker 2 a name", body: "Click the name, type the real one, press Enter.", trigger: "speakers-open", handoff: true },
  ] },
];
export const stepTourId = (stepId: string) => `step-${stepId}`;
