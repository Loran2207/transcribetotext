import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Copy as CopyLucide, MessageSquarePlus, PenLine, Share2 } from "lucide-react";
import { FolderOpen, MoreHorizontal, Share, Trash, User, Zap, Mic, Link, Edit, Copy, RefreshIcon, Upload, SquareLock01Icon, Cancel01Icon, AiMagicIcon , VolumeHighIcon , Alert02Icon , LanguageSquareIcon , ArrowDown01Icon , Mic01Icon , PlayIcon, PauseIcon , ArrowLeft01Icon, ArrowRight01Icon, LayoutRightIcon , Search01Icon } from "@hugeicons/core-free-icons";
import { useShell, useDemo } from "./desktop/shell";
import { NotesPad, loadPad, savePad, type PadLine } from "./desktop/notes-pad";
import { readSharedRecordOwner } from "@/lib/share-demo";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { LanguageSelector, SpeakerSection, LANGUAGES } from "./transcription-modals";
import { useNotetakerSettings } from "./desktop/notetaker-settings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { MoveToFolderDialog } from "./records-table";
import { ScrollArea } from "./ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";
import { useUserProfile } from "./user-profile-context";
import { useFolders } from "./folder-context";
import { useStarred } from "./starred-context";
import { SourceIcon, getSourceLabel, type SourceType } from "./source-icons";
import { ActionSheet, ActionSheetItem } from "./action-sheet";
import { records, type RecordRow } from "./records-table";
import { TemplatePicker } from "./template-picker";
import { TemplateSheet, LanguageSheet } from "./result-picker-sheets";
import { templateEmoji } from "@/lib/template-meta";
import { Icon } from "./ui/icon";
import { LottieStage } from "./checkout-loader/lottie-stage";
import { Skeleton } from "./ui/skeleton";
import { useTranscriptionModals, type TranscriptionJob } from "./transcription-modals";
import { useTemplates } from "@/hooks/use-templates";
import type { Template } from "@/lib/templates";
import { ShareDialog } from "./share-dialog";
import { setInnerScreen } from "./inner-screen";
import { SharedUsersAvatars } from "./shared-users-avatars";
import { useShares } from "@/hooks/use-shares";
import type { Share as ShareRecord } from "@/lib/shares";
import { ExportDialog } from "./export-dialog";
import { UpgradeGateModal } from "./upgrade-gate-modal";
import { records as demoRecords, recordRowToExportable } from "./records-table";
import {
  exportRecords,
  type ExportableRecord,
  type ExportFormat,
} from "@/lib/export-formats";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

/* A replica used to guess its row count from character length, which assumes a
   desktop line. On a phone that hid roughly half of every line behind an inner
   scroll, so the field now measures itself and grows to whatever it holds. */
function EditableLine({ value, onChange }: { value: string; onChange?: (next: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);
  useEffect(() => { fit(); }, [fit, value]);
  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(box);
    return () => ro.disconnect();
  }, [fit]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="mt-1 w-full resize-none overflow-hidden rounded-md border border-border bg-muted/30 px-2 py-1.5 text-sm leading-relaxed text-foreground/90 outline-none focus:border-primary/50 focus:bg-background"
    />
  );
}

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

interface Speaker {
  id: string;
  name: string;
  color: string;
  initial: string;
}

interface Segment {
  id: number;
  speaker: Speaker;
  timestamp: string;
  text: string;
}

interface Comment {
  id: string;
  segmentId: number;
  quote: string;
  timestamp: string;
  author: string;
  avatarColor: string;
  avatarInitial: string;
  text: string;
  createdAt: string;
  replies: {
    id: string;
    author: string;
    avatarColor: string;
    avatarInitial: string;
    text: string;
    createdAt: string;
  }[];
}

interface OutlineSection {
  id: string;
  title: string;
  timestamp: string;
  segmentId: number;
  bullets: { text: string; segmentId: number }[];
}

interface VideoPreviewData {
  url: string;
  poster?: string;
}

// ttt_demo_playback=1 parks the playhead a minute in, so the active line and
// the lines already spoken can be captured without the position drifting.
function demoPlayheadProgress(): number[] {
  try {
    const flag = window.localStorage.getItem("ttt_demo_playback");
    if (flag === "1") return [6.6];
    /* The cases set parks the playhead inside a replica of a given length: a
       question, a single word, then the long paragraph. */
    if (flag === "cases_short") return [0.28];
    if (flag === "cases_word") return [0.7];
    if (flag === "cases") return [1.87];
  } catch { /* ignore */ }
  return [0];
}

/* Subtitles highlight the words being spoken, not the paragraph around them.
   A replica can be one word or a full paragraph, so the unit that lights up is
   the sentence: short replicas light up whole, long ones move through. */
function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    buf += ch;
    if (ch === "." || ch === "!" || ch === "?") {
      const next = text[i + 1];
      if (next === undefined || next === " ") {
        if (next === " ") { buf += " "; i++; }
        out.push(buf);
        buf = "";
      }
    }
  }
  if (buf.length) out.push(buf);
  return out.length ? out : [text];
}

/* Words, keeping the spaces, so a rebuilt sentence still reads as one line. */
function splitWords(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " ") {
      if (buf.length) { out.push(buf); buf = ""; }
      out.push(" ");
    } else {
      buf += ch;
    }
  }
  if (buf.length) out.push(buf);
  return out;
}

/* One way to mark the line being spoken: the sentence turns blue, and the word
   being said right now carries a wash of the same blue.

   The wash is painted with a spread shadow rather than padding. Padding makes
   the word six pixels wider than it is when silent, so the paragraph re-wraps
   at every step of the playhead; cancelling that with a negative margin leaves
   the box wider than the text advances, and the Figma converter turns the
   difference into a gap in front of the word. A shadow paints outside the box
   and changes no measurement at all.

   Solid token, not an opacity modifier - those compile to color-mix() and the
   capture drops them. Nothing changes the font weight, for the same reason
   padding is avoided. */
const ACTIVE_SENTENCE = "bg-transparent text-primary";
const ACTIVE_WORD = "rounded-[3px] bg-primary-wash py-[2px] text-primary";

function timestampToSeconds(timestamp: string) {
  const parts = timestamp.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 1) return parts[0];
  // Everything left of the seconds is minutes (and hours), so it has to be
  // carried up by 60. Without that "4:30" came back as 34 seconds, which threw
  // off both the timecode jump and the active line.
  const head = parts.slice(0, -1).reduce((acc, value) => acc * 60 + value, 0);
  return head * 60 + parts[parts.length - 1];
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatJobDateForRecord(date: Date) {
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const yyyy = date.getFullYear();
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return {
    dateCreated: `${mm}/${dd}/${yyyy}, ${hh}:${min}`,
    dateGroup: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

function normalizeJobSource(source: TranscriptionJob["source"], fileType: TranscriptionJob["fileType"]): SourceType {
  if (source) return source;
  return fileType === "audio" ? "mp3" : "mp4";
}

function normalizeJobLanguage(lang?: string, langBilingual?: string[]): RecordRow["language"] {
  const allowed = new Set<RecordRow["language"]>(["en", "ru", "es", "de", "fr"]);
  if (lang && allowed.has(lang as RecordRow["language"])) return lang as RecordRow["language"];
  const bilingualLang = (langBilingual ?? []).find((value) => value && allowed.has(value as RecordRow["language"]));
  if (bilingualLang) return bilingualLang as RecordRow["language"];
  return "en";
}

function mapJobToDetailRecord(job: TranscriptionJob): RecordRow {
  const createdDate = job.createdAt ? new Date(job.createdAt) : new Date();
  const isDone = job.status === "done";
  const isError = job.status === "error";
  const dateParts = formatJobDateForRecord(createdDate);
  return {
    id: job.id,
    name: job.name,
    iconColor: "#3B82F6",
    iconType: "square",
    duration: isDone ? (job.duration ?? "-") : isError ? "Failed" : "In progress",
    dateCreated: dateParts.dateCreated,
    dateGroup: dateParts.dateGroup,
    template: job.templateName ?? (job.langBilingual && job.langBilingual.length > 1 ? "1 by 1" : "Summary"),
    templateId: job.templateId,
    language: normalizeJobLanguage(job.lang, job.langBilingual),
    source: normalizeJobSource(job.source, job.fileType),
    summary: isDone
      ? "Transcript is ready. Open the record to view summary and action items."
      : isError
        ? "This transcription failed. You can retry from upload status widget."
        : "Transcription is in progress.",
    tasks: 0,
    screenshots: 0,
    time: dateParts.time,
    videoUrl: job.fileType === "video" ? job.mediaUrl : undefined,
  };
}

// ════════════════════════════════════════════════════════════
// Templates
// ════════════════════════════════════════════════════════════

// Templates are now loaded from Supabase via useTemplates hook

// ════════════════════════════════════════════════════════════
// Mock data
// ════════════════════════════════════════════════════════════

const SPEAKERS: Speaker[] = [
  { id: "s1", name: "Alex Johnson", color: "#3b82f6", initial: "A" },
  { id: "s2", name: "Maria Garcia", color: "#8b5cf6", initial: "M" },
  { id: "s3", name: "James Chen", color: "#10b981", initial: "J" },
];

const LIVE_RECORDING_SPEAKER: Speaker = {
  id: "live-you",
  name: "You",
  color: "#2563eb",
  initial: "Y",
};

const MOCK_SEGMENTS: Segment[] = [
  { id: 1, speaker: SPEAKERS[0], timestamp: "0:01", text: "Good morning everyone. Let's get started with the weekly sync. I wanted to cover three main topics today - the product roadmap update, the Q2 planning timeline, and a quick review of the design handoff process." },
  { id: 2, speaker: SPEAKERS[1], timestamp: "0:32", text: "Sounds good. Before we dive in, I just want to flag that the design team finished the new onboarding flow mockups yesterday. I'll share the Figma link in Slack after this call." },
  { id: 3, speaker: SPEAKERS[2], timestamp: "0:58", text: "Great, that's actually related to what I wanted to bring up. The engineering team has been waiting on those mockups to start the sprint planning for next week. We'll need to review them by Thursday at the latest." },
  { id: 4, speaker: SPEAKERS[0], timestamp: "1:24", text: "Perfect. Let's make sure we schedule a quick design review session tomorrow or Wednesday. Maria, can you coordinate that with the design leads?" },
  { id: 5, speaker: SPEAKERS[1], timestamp: "1:45", text: "Absolutely. I'll set something up for Wednesday morning. That gives us a day to incorporate any feedback before James's team picks it up on Thursday." },
  { id: 6, speaker: SPEAKERS[2], timestamp: "2:10", text: "Works for me. On the roadmap side, we're about 80% through the current milestone. The remaining items are mostly backend API work and some performance optimizations. I don't see any blockers at this point." },
  { id: 7, speaker: SPEAKERS[0], timestamp: "2:42", text: "That's encouraging. Let's keep the momentum going. Any questions or concerns before we move on to Q2 planning?" },
  { id: 8, speaker: SPEAKERS[1], timestamp: "3:05", text: "One thing - we should probably discuss the user research findings from last week. Some of the feedback might influence the Q2 priorities, especially around the notification system." },
  { id: 9, speaker: SPEAKERS[2], timestamp: "3:28", text: "Agreed. The data shows that about 40% of users are finding the current notification settings confusing. That's a significant usability issue we should address sooner rather than later." },
  { id: 10, speaker: SPEAKERS[0], timestamp: "3:55", text: "Good point. Let's add that to the Q2 discussion. I'll create a separate agenda item for the next planning meeting. Anything else?" },
  { id: 11, speaker: SPEAKERS[1], timestamp: "4:18", text: "Nothing from my side. I think we're in good shape overall." },
  { id: 12, speaker: SPEAKERS[2], timestamp: "4:30", text: "Same here. Let's wrap up and get back to work. Thanks everyone." },
];

// Single-speaker (podcast / monologue / dictation) demo content - one voice, no speaker column.
const MONO_SPEAKER: Speaker = { id: "mono", name: "Host", color: "#2563eb", initial: "H" };
const MONO_SEGMENTS: Segment[] = [
  { id: 101, speaker: MONO_SPEAKER, timestamp: "0:00", text: "Welcome back to the Northwind Labs product update. I'm recording this as a quick solo walkthrough of what shipped this week and what's coming next." },
  { id: 102, speaker: MONO_SPEAKER, timestamp: "0:21", text: "First, the new dispatch dashboard is live for the Rotterdam hub. Early numbers look strong - average load assignment time dropped from about nine minutes to just under four." },
  { id: 103, speaker: MONO_SPEAKER, timestamp: "0:48", text: "Second, we rewrote the notification engine. Alerts now batch intelligently, so drivers get one clear summary instead of a dozen pings during a route." },
  { id: 104, speaker: MONO_SPEAKER, timestamp: "1:15", text: "A quick note on reliability: we moved the sync layer to the new queue, and over the last ten days we have not seen a single dropped event in staging." },
  { id: 105, speaker: MONO_SPEAKER, timestamp: "1:42", text: "Looking ahead, next sprint is all about the mobile experience. The goal is a one-tap check-in flow that works even on a weak connection out in the yard." },
  { id: 106, speaker: MONO_SPEAKER, timestamp: "2:09", text: "That's it for this week. If you have feedback, drop it in the product channel and I'll fold it into the planning notes. Thanks for listening." },
];

// Limited-access demo: how many speaker turns stay readable before the paywall.
const LIMITED_FREE_TURNS = 3;

/* Replicas run from a single word to a full paragraph, and the highlight has
   to survive both. */
const CASE_SEGMENTS: Segment[] = [
  { id: 201, speaker: SPEAKERS[0], timestamp: "0:00", text: "So where did we land on the export flow?" },
  { id: 202, speaker: SPEAKERS[1], timestamp: "0:06", text: "Done." },
  { id: 203, speaker: SPEAKERS[2], timestamp: "0:09", text: "Not quite. The dialog is in staging and QA looks good, but we still owe the archive switch. Right now every batch export packs a zip, and that makes the server pull each file out of storage before anything reaches the user. If we ship the switch off by default, most people never pay for the archive at all. I would rather land that this week than carry it into the next milestone." },
  { id: 204, speaker: SPEAKERS[0], timestamp: "0:42", text: "Agreed. Let us get it in." },
  { id: 205, speaker: SPEAKERS[1], timestamp: "0:48", text: "One more thing: the toast on completion should say the record name, not just that something finished." },
];

const MOCK_OUTLINE: OutlineSection[] = [
  { id: "o1", title: "Opening & Agenda", timestamp: "0:01", segmentId: 1, bullets: [{ text: "Three topics: roadmap update, Q2 planning, design handoff", segmentId: 1 }, { text: "Design team completed onboarding flow mockups", segmentId: 2 }] },
  { id: "o2", title: "Design Handoff & Sprint Planning", timestamp: "0:58", segmentId: 3, bullets: [{ text: "Engineering waiting on mockups for sprint planning", segmentId: 3 }, { text: "Design review session planned for Wednesday", segmentId: 4 }, { text: "Feedback integration before Thursday sprint start", segmentId: 5 }] },
  { id: "o3", title: "Product Roadmap Status", timestamp: "2:10", segmentId: 6, bullets: [{ text: "80% through current milestone, no blockers", segmentId: 6 }, { text: "Remaining: backend API work + performance optimizations", segmentId: 6 }] },
  { id: "o4", title: "Q2 Planning & User Research", timestamp: "3:05", segmentId: 8, bullets: [{ text: "User research: 40% find notification settings confusing", segmentId: 9 }, { text: "Notification UX to be added to Q2 priorities", segmentId: 10 }] },
  { id: "o5", title: "Wrap-up", timestamp: "4:18", segmentId: 11, bullets: [{ text: "No further concerns raised", segmentId: 11 }] },
];

const MOCK_COMMENTS: Comment[] = [
  { id: "c1", segmentId: 3, quote: "The engineering team has been waiting on those mockups...", timestamp: "0:58", author: "Alex Johnson", avatarColor: "#3b82f6", avatarInitial: "A", text: "We should track this dependency more formally going forward.", createdAt: "2h ago", replies: [{ id: "r1", author: "James Chen", avatarColor: "#10b981", avatarInitial: "J", text: "Agreed - I'll add it to our sprint retro.", createdAt: "1h ago" }] },
  { id: "c2", segmentId: 9, quote: "40% of users are finding the current notification settings confusing", timestamp: "3:28", author: "Maria Garcia", avatarColor: "#8b5cf6", avatarInitial: "M", text: "This aligns with what we saw in the support tickets last month. Definitely needs attention.", createdAt: "45m ago", replies: [] },
];

const MOCK_SUMMARY = `## Key Discussion Points

- **Product Roadmap Update**: The team is approximately 80% through the current milestone, with remaining work focused on backend API development and performance optimizations. No current blockers identified.

- **Design Handoff**: New onboarding flow mockups have been completed by the design team. A design review session is planned for Wednesday morning to allow feedback integration before engineering sprint planning on Thursday.

- **Q2 Planning**: Discussion on priorities for Q2, with a specific emphasis on addressing notification system usability issues based on recent user research.

## Action Items

- Maria to share Figma link for onboarding mockups in Slack
- Maria to schedule design review session for Wednesday morning
- Alex to create agenda item for notification system discussion in next planning meeting
- James's engineering team to begin sprint planning on Thursday after design review

## User Research Insights

- Approximately 40% of users find current notification settings confusing
- This represents a significant usability issue that should be prioritized in Q2
- Recommendation to address notification UX before other Q2 items

## Next Steps

- Design review: Wednesday AM
- Sprint planning: Thursday
- Q2 planning meeting: TBD (with notification system as agenda item)
`;

// Clean Russian demo translations for the "translation applied" design captures
// (ttt_demo_translate=done). Speaker names + timestamps stay untranslated by design.
const RU_DEMO_SEGMENTS: Record<number, string> = {
  1: "Доброе утро всем. Давайте начнём еженедельную синхронизацию. Сегодня я хочу разобрать три основные темы: обновление дорожной карты продукта, сроки планирования на второй квартал и краткий обзор процесса передачи макетов в разработку.",
  2: "Звучит хорошо. Прежде чем мы начнём, хочу отметить, что вчера команда дизайна закончила макеты нового онбординга. Я скину ссылку на Figma в Slack после звонка.",
  3: "Отлично, это как раз связано с тем, о чём я хотел сказать. Команда разработки ждала эти макеты, чтобы начать планирование спринта на следующую неделю. Нам нужно рассмотреть их не позднее четверга.",
  4: "Отлично. Давайте назначим короткую встречу по ревью дизайна на завтра или среду. Мария, ты сможешь согласовать это с ведущими дизайнерами?",
  5: "Конечно. Организую что-нибудь на утро среды. Это даст нам день, чтобы учесть замечания, прежде чем команда Джеймса возьмёт задачу в четверг.",
  6: "Меня устраивает. По дорожной карте: текущий этап пройден примерно на 80%. Оставшиеся задачи, в основном работа над backend API и оптимизация производительности. На данный момент блокеров не вижу.",
  7: "Это обнадёживает. Давайте сохраним темп. Есть вопросы или сомнения, прежде чем перейти к планированию на второй квартал?",
  8: "Один момент: наверное, стоит обсудить результаты исследования пользователей за прошлую неделю. Часть отзывов может повлиять на приоритеты второго квартала, особенно по системе уведомлений.",
  9: "Согласен. Данные показывают, что около 40% пользователей считают текущие настройки уведомлений запутанными. Это серьёзная проблема удобства, которую лучше решить раньше, чем позже.",
  10: "Справедливо. Давайте добавим это в обсуждение второго квартала. Я вынесу отдельный пункт в повестку следующей встречи по планированию. Что-то ещё?",
  11: "С моей стороны всё. Думаю, в целом мы в хорошей форме.",
  12: "У меня тоже. Давайте закругляться и вернёмся к работе. Спасибо всем.",
};

const RU_DEMO_SUMMARY = `## Ключевые моменты обсуждения

- **Обновление дорожной карты**: команда прошла примерно 80% текущего этапа, оставшаяся работа сосредоточена на разработке backend API и оптимизации производительности. Блокеров пока нет.

- **Передача дизайна**: команда дизайна закончила макеты нового онбординга. На утро среды запланировано ревью дизайна, чтобы учесть замечания до планирования спринта в четверг.

- **Планирование на 2 квартал**: обсуждение приоритетов на второй квартал с упором на удобство системы уведомлений по итогам недавнего исследования пользователей.

## Задачи

- Мария поделится ссылкой на макеты онбординга в Figma через Slack
- Мария назначит ревью дизайна на утро среды
- Алекс вынесет вопрос о системе уведомлений в повестку следующей встречи
- Команда разработки Джеймса начнёт планирование спринта в четверг после ревью дизайна

## Выводы исследования пользователей

- Около 40% пользователей считают текущие настройки уведомлений запутанными
- Это серьёзная проблема удобства, которую стоит приоритизировать во втором квартале
- Рекомендуется решить вопрос с UX уведомлений до остальных задач второго квартала

## Дальнейшие шаги

- Ревью дизайна: среда, утро
- Планирование спринта: четверг
- Встреча по планированию 2 квартала: дата уточняется (с пунктом о системе уведомлений)
`;

/* The language a record was spoken in. TRANSLATION_LANGUAGES is what you can
   translate INTO, which is a different list: it has no English in it. */
const SOURCE_LANGUAGES: Record<string, { flag: string; label: string }> = {
  en: { flag: "\u{1F1FA}\u{1F1F8}", label: "English" },
  ru: { flag: "\u{1F1F7}\u{1F1FA}", label: "Russian" },
  es: { flag: "\u{1F1EA}\u{1F1F8}", label: "Spanish" },
  de: { flag: "\u{1F1E9}\u{1F1EA}", label: "German" },
  fr: { flag: "\u{1F1EB}\u{1F1F7}", label: "French" },
  ja: { flag: "\u{1F1EF}\u{1F1F5}", label: "Japanese" },
  it: { flag: "\u{1F1EE}\u{1F1F9}", label: "Italian" },
  pt: { flag: "\u{1F1F5}\u{1F1F9}", label: "Portuguese" },
  zh: { flag: "\u{1F1E8}\u{1F1F3}", label: "Chinese" },
};

type CopyMenuModel = {
  original: { flag: string; label: string };
  translation: { code: string; flag: string; label: string } | null;
  summaryTranslated: boolean;
  hasSummary: boolean;
};

const TRANSLATION_LANGUAGES = [
  { code: "ru", label: "Russian", flag: "🇷🇺", short: "RU" },
  { code: "es", label: "Spanish", flag: "🇪🇸", short: "ES" },
  { code: "de", label: "German", flag: "🇩🇪", short: "DE" },
  { code: "fr", label: "French", flag: "🇫🇷", short: "FR" },
  { code: "it", label: "Italian", flag: "🇮🇹", short: "IT" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹", short: "PT" },
  { code: "zh", label: "Chinese", flag: "🇨🇳", short: "ZH" },
  { code: "ja", label: "Japanese", flag: "🇯🇵", short: "JA" },
];

function makeFallbackTranslation(text: string, languageCode: string) {
  const prefix = `[${languageCode.toUpperCase()}]`;
  return text
    .split("\n")
    .map((line) => (line.trim() ? `${prefix} ${line}` : line))
    .join("\n");
}

// ════════════════════════════════════════════════════════════
// Edit History (undo/redo)
// ════════════════════════════════════════════════════════════

function useEditHistory(initial: Record<number, string>) {
  const [past, setPast] = useState<Record<number, string>[]>([]);
  const [present, setPresent] = useState(initial);
  const [future, setFuture] = useState<Record<number, string>[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const update = useCallback((segmentId: number, text: string) => {
    setPresent((prev) => {
      const next = { ...prev, [segmentId]: text };
      setPast((p) => [...p, prev]);
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [present, ...f]);
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  const reset = useCallback((state: Record<number, string>) => {
    setPast([]);
    setPresent(state);
    setFuture([]);
  }, []);

  return { texts: present, update, undo, redo, canUndo, canRedo, reset };
}

// ════════════════════════════════════════════════════════════
// Segment Actions (shown on hover/focus)
// ════════════════════════════════════════════════════════════

function SegmentInlineActions({
  segmentId,
  isHighlighted,
  onToggleHighlight,
  onOpenComment,
  onShare,
  onCopyText,
}: {
  segmentId: number;
  isHighlighted: boolean;
  onToggleHighlight: (id: number) => void;
  onOpenComment: (id: number) => void;
  onShare: (id: number) => void;
  onCopyText: (id: number) => void;
}) {
  return (
    <div
      className="absolute right-2 top-3 z-20 flex items-center gap-1 rounded-full border border-border/70 bg-background/95 p-1.5 shadow-sm backdrop-blur-[2px] transition-all duration-150 opacity-0 pointer-events-none translate-y-1 group-hover/seg:opacity-100 group-hover/seg:pointer-events-auto group-hover/seg:translate-y-0 group-focus-within/seg:opacity-100 group-focus-within/seg:pointer-events-auto group-focus-within/seg:translate-y-0"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 rounded-full ${isHighlighted ? "text-amber-600 hover:text-amber-700" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => onToggleHighlight(segmentId)}
            aria-label={isHighlighted ? "Remove highlight" : "Highlight segment"}
          >
            <PenLine className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{isHighlighted ? "Remove highlight" : "Highlight"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => onOpenComment(segmentId)}
            aria-label="Add comment"
          >
            <MessageSquarePlus className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Comment</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => onShare(segmentId)}
            aria-label="Share segment"
          >
            <Share2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Share</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => onCopyText(segmentId)}
            aria-label="Copy text"
          >
            <CopyLucide className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Copy text</TooltipContent>
      </Tooltip>
    </div>
  );
}
function SelectionHighlightPill({
  position,
  onHighlight,
}: {
  position: { x: number; y: number };
  onHighlight: () => void;
}) {
  return (
    <Button
      size="sm"
      className="fixed z-50 h-7 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md animate-in fade-in zoom-in-95 duration-150 hover:bg-primary/90"
      style={{ left: position.x, top: position.y - 32 }}
      onMouseDown={(e) => { e.preventDefault(); onHighlight(); }}
    >
      Highlight
    </Button>
  );
}

// ════════════════════════════════════════════════════════════
// Transcript Segment (read-only + edit mode)
// ════════════════════════════════════════════════════════════

function TranscriptSegment({
  segment,
  nextTimestamp,
  isEditing,
  editText,
  onEditChange,
  highlighted,
  isPlaybackActive,
  isPlayed,
  activeSentence,
  activeWord,
  segmentRef,
  isSegHighlighted,
  onToggleHighlight,
  onOpenComment,
  onShare,
  onCopyText,
  inlineComment,
  onCommentSubmit,
  onCommentCancel,
  onCommentChange,
  commentValue,
  textHighlights,
  showActions = true,
  hideSpeaker = false,
  hideTimecodes = false,
  onSeekTimecode,
}: {
  segment: Segment;
  nextTimestamp?: string;
  isEditing: boolean;
  editText?: string;
  onEditChange?: (text: string) => void;
  highlighted: boolean;
  isPlaybackActive: boolean;
  isPlayed?: boolean;
  activeSentence?: number | null;
  activeWord?: number | null;
  segmentRef: (el: HTMLDivElement | null) => void;
  isSegHighlighted: boolean;
  onToggleHighlight: (id: number) => void;
  onOpenComment: (id: number) => void;
  onShare: (id: number) => void;
  onCopyText: (id: number) => void;
  inlineComment: boolean;
  onCommentSubmit: () => void;
  onCommentCancel: () => void;
  onCommentChange: (v: string) => void;
  commentValue: string;
  textHighlights: { start: number; end: number }[];
  showActions?: boolean;
  hideSpeaker?: boolean;
  hideTimecodes?: boolean;
  onSeekTimecode?: (timestamp: string) => void;
}) {
  const segmentText = editText ?? segment.text;
  const segmentEndTimestamp = nextTimestamp ?? segment.timestamp;
  const lineTone = highlighted
    ? "bg-primary/35"
    : isSegHighlighted
      ? "bg-amber-300/80"
      : isPlaybackActive
        ? "bg-primary"
        : isPlayed
          ? "bg-border/50"
          : "bg-border/80";

  // Render text with inline highlights
  function renderText(text: string) {
    if (textHighlights.length === 0) return text;
    const sorted = [...textHighlights].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (let i = 0; i < sorted.length; i++) {
      const h = sorted[i];
      if (h.start > cursor) parts.push(text.slice(cursor, h.start));
      parts.push(<mark key={i} className="bg-yellow-200/60 rounded-sm px-0.5">{text.slice(h.start, h.end)}</mark>);
      cursor = h.end;
    }
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
  }

  return (
    <div
      ref={segmentRef}
      data-segment-id={segment.id}
      className={`group/seg relative -mx-2 grid ${hideSpeaker ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[minmax(160px,220px)_1fr]"} gap-4 rounded-xl px-2 py-4 transition-colors duration-200 max-lg:gap-2 ${
        highlighted
          ? "bg-primary/8"
          : isSegHighlighted
            ? "bg-amber-50"
            : "hover:bg-muted/45"
      }`}
    >
      {showActions && !isEditing && (
        <SegmentInlineActions
          segmentId={segment.id}
          isHighlighted={isSegHighlighted}
          onToggleHighlight={onToggleHighlight}
          onOpenComment={onOpenComment}
          onShare={onShare}
          onCopyText={onCopyText}
        />
      )}

      {!hideSpeaker && (
        <div className="min-w-0 pt-1">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: segment.speaker.color }}
            >
              {segment.speaker.initial}
            </div>
            <span className="truncate text-sm font-medium text-foreground">{segment.speaker.name}</span>
          </div>
        </div>
      )}

      <div className="relative min-w-0 pl-5 pr-28 max-lg:pr-16">
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full transition-colors ${lineTone}`} />
        {!hideTimecodes && (onSeekTimecode ? (
          <button
            type="button"
            onClick={() => onSeekTimecode(segment.timestamp)}
            className={`inline-flex items-center gap-1 text-xs tabular-nums transition-colors hover:text-primary ${
              isPlaybackActive
                ? "font-semibold text-primary"
                : isPlayed
                  ? "text-muted-foreground/70"
                  : "text-muted-foreground"
            }`}
            title="Play from here"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="opacity-0 transition-opacity group-hover/seg:opacity-100"><path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" /></svg>
            {segment.timestamp}
          </button>
        ) : (
          <span
            className={`text-xs tabular-nums ${
              isPlaybackActive
                ? "font-semibold text-primary"
                : isPlayed
                  ? "text-muted-foreground/70"
                  : "text-muted-foreground"
            }`}
          >
            {segment.timestamp}
          </span>
        ))}

        {isEditing ? (
          <EditableLine value={segmentText} onChange={onEditChange} />
        ) : (
          <p
            data-transcript-line=""
            className={`mt-1 cursor-text text-sm leading-relaxed transition-colors ${
              isPlaybackActive
                ? "text-foreground"
                : isPlayed
                  ? "text-foreground/55"
                  : "text-foreground/85"
            }`}
          >
            {isPlaybackActive && activeSentence !== null && activeSentence !== undefined ? (
              splitSentences(segmentText).map((part, i) => {
                // Already said: dimmed, so the eye lands on the live line.
                if (i < activeSentence) {
                  return <span key={i} className="text-foreground/45">{part}</span>;
                }
                // Still to come: plain.
                if (i > activeSentence) return <span key={i}>{part}</span>;
                // Word by word, the sentence stays plain and one word carries it.
                if (activeWord !== null && activeWord !== undefined) {
                  /* Three nodes, not one per word. A span around every word and
                     every space is invisible in the browser and a minefield in
                     the frame: the converter lays every inline box out on its
                     own, and the rounding between them adds up to a visible gap
                     in front of the word being spoken. */
                  const parts = splitWords(part);
                  let seen = -1;
                  let cut = -1;
                  for (let k = 0; k < parts.length; k++) {
                    if (parts[k] === " ") continue;
                    seen += 1;
                    if (seen === activeWord) { cut = k; break; }
                  }
                  if (cut >= 0) {
                    return (
                      <span key={i} className="text-primary">
                        {parts.slice(0, cut).join("")}
                        <mark className={ACTIVE_WORD}>{parts[cut]}</mark>
                        {parts.slice(cut + 1).join("")}
                      </span>
                    );
                  }
                }
                return (
                  <mark key={i} className={ACTIVE_SENTENCE}>
                    {part}
                  </mark>
                );
              })
            ) : (
              renderText(segmentText)
            )}
          </p>
        )}
        {!hideTimecodes && <span className="mt-2 block text-xs text-muted-foreground tabular-nums max-lg:hidden">{segmentEndTimestamp}</span>}

        {/* Inline comment input */}
        {inlineComment && (
          <div className="mt-2 flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              autoFocus
              className="flex-1 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              placeholder="Add a comment..."
              value={commentValue}
              onChange={(e) => onCommentChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && commentValue.trim()) onCommentSubmit(); if (e.key === "Escape") onCommentCancel(); }}
            />
            <Button size="sm" className="h-8 rounded-full px-3 text-xs" disabled={!commentValue.trim()} onClick={onCommentSubmit}>
              Post
            </Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-full px-2 text-xs text-muted-foreground" onClick={onCommentCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Summary Tab
// ════════════════════════════════════════════════════════════

// Single, calm "processing" state shown while a job is still transcribing.
// No gray skeleton sheets, no fake finished segments - one hourglass + one progress.
function TranscribingState({ phase, progress }: { phase: "uploading" | "processing"; progress: number }) {
  const heading = phase === "uploading" ? "Uploading your recording" : "Transcribing your recording";
  return (
    <div className="flex h-full min-h-[460px] flex-col items-center justify-center px-8 text-center">
      <LottieStage src="/lottie/hourglass-blue.json" w={140} h={140} />
      <h3 className="mt-3 text-[17px] font-semibold text-foreground">{heading}</h3>
      <p className="mt-1.5 max-w-[380px] text-[13px] leading-relaxed text-muted-foreground">
        Hang tight - your transcript and summary appear here automatically once it's ready.
      </p>
      <div className="mt-7 w-full max-w-[320px]">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[12px] font-medium tabular-nums text-primary">{progress}%</p>
      </div>
    </div>
  );
}

// Translation loader - reuses the brand hourglass for the big translate operations.
function TranslatingState({ what }: { what: string }) {
  return (
    <div className="flex h-full min-h-[460px] flex-col items-center justify-center px-8 text-center">
      <LottieStage src="/lottie/hourglass-blue.json" w={140} h={140} />
      <h3 className="mt-3 text-[17px] font-semibold text-foreground">Translating the {what}</h3>
      <p className="mt-1.5 max-w-[380px] text-[13px] leading-relaxed text-muted-foreground">
        Hang tight - your translated {what} appears here in a moment.
      </p>
    </div>
  );
}

// Summary-generation loader - same brand hourglass as the other big loaders.
function SummaryGeneratingState({ stage }: { stage: string }) {
  return (
    <div className="flex h-full min-h-[460px] flex-col items-center justify-center px-8 text-center">
      <LottieStage src="/lottie/hourglass-blue.json" w={140} h={140} />
      <h3 className="mt-3 text-[17px] font-semibold text-foreground">Generating your summary</h3>
      <p className="mt-1.5 max-w-[380px] text-[13px] leading-relaxed text-muted-foreground">
        {stage ? stage + "…" : "Hang tight - your summary appears here in a moment."}
      </p>
    </div>
  );
}

// Clean error state for a failed summary translation (gray-free).
function TranslationErrorState({ onRetry, title, body }: { onRetry: () => void; title?: string; body?: string }) {
  return (
    <div className="flex h-full min-h-[460px] flex-col items-center justify-center px-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EE1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></svg>
      </span>
      <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title ?? "Couldn't translate the summary"}</h3>
      <p className="mt-1.5 max-w-[340px] text-[13px] leading-relaxed text-muted-foreground">
        {body ?? "The transcript was translated, but the summary translation failed. Your original summary is still available on the Summary tab."}
      </p>
      <Button onClick={onRetry} className="mt-5 h-9 rounded-full px-5 text-[13px] font-medium">
        <Icon icon={RefreshIcon} className="mr-1.5 size-4" strokeWidth={1.9} />
        Try again
      </Button>
    </div>
  );
}

function SummaryErrorState({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <div className="flex h-full min-h-[460px] flex-col items-center justify-center px-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EE1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></svg>
      </span>
      <h3 className="mt-4 text-[15px] font-semibold text-foreground">Couldn't generate the summary</h3>
      <p className="mt-1.5 max-w-[340px] text-[13px] leading-relaxed text-muted-foreground">
        Something went wrong while summarizing this transcript. Your transcript is safe - try generating the summary again.
      </p>
      <Button onClick={onRegenerate} className="mt-5 h-9 rounded-full px-5 text-[13px] font-medium">
        <Icon icon={RefreshIcon} className="mr-1.5 size-4" strokeWidth={1.9} />
        Regenerate summary
      </Button>
    </div>
  );
}

function SummaryTab({ summaryText, template, highlight = "" }: { summaryText: string; template?: Template | null; highlight?: string }) {
  /* a search term lights up in place; the text itself never moves */
  const q = highlight.trim();
  const hl = (t: string): React.ReactNode => {
    if (!q) return t;
    const parts = t.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    return parts.map((part, i) => (part.toLowerCase() === q.toLowerCase() ? <mark key={i} className="rounded-[3px] bg-primary/15 px-[2px] text-foreground">{part}</mark> : part));
  };
  // If a template is selected, use its sections for headings with icons
  const sectionIcons: Record<string, string | undefined> = {};
  if (template?.sections) {
    for (const sec of template.sections) {
      sectionIcons[sec.title] = sec.iconId;
    }
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="prose-custom max-w-none">
        {summaryText.split("\n").map((line, i) => {
          if (line.startsWith("## ")) {
            const title = line.replace("## ", "");
            const iconId = sectionIcons[title];
            return (
              <h2 key={i} className="mt-6 mb-3 flex items-center gap-2 text-base font-semibold text-foreground first:mt-0">
                {iconId && <SectionIconDisplay iconId={iconId} />}
                {title}
              </h2>
            );
          }
          if (line.startsWith("- **")) {
            const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/);
            if (match) {
              return (
                <div key={i} className="flex gap-2 py-1 pl-4 text-sm text-foreground/90">
                  <span className="shrink-0 text-muted-foreground">{"\u2022"}</span>
                  <span><strong className="font-medium text-foreground">{hl(match[1])}</strong>{match[2] ? <>: {hl(match[2])}</> : ""}</span>
                </div>
              );
            }
          }
          if (line.startsWith("- ")) {
            return <div key={i} className="flex gap-2 py-1 pl-4 text-sm text-foreground/90"><span className="shrink-0 text-muted-foreground">{"\u2022"}</span><span>{hl(line.replace("- ", ""))}</span></div>;
          }
          if (line.trim() === "") return <div key={i} className="h-2" />;
          return <p key={i} className="text-sm text-foreground/90">{hl(line)}</p>;
        })}
      </div>
    </div>
  );
}

/** Small icon display for summary section titles */
function SectionIconDisplay({ iconId }: { iconId: string }) {
  // Map iconId to a simple colored dot/indicator since we can't dynamically import HugeIcons here
  // We use a small colored square as a section indicator
  const colors: Record<string, string> = {
    summary: "bg-blue-400", checklist: "bg-green-400", target: "bg-amber-400",
    stars: "bg-purple-400", note: "bg-cyan-400", bookmark: "bg-rose-400",
    chart: "bg-indigo-400", flag: "bg-red-400", idea: "bg-yellow-400",
    users: "bg-teal-400", taskdone: "bg-emerald-400", analytics: "bg-violet-400",
  };
  return <span className={`size-[6px] rounded-full shrink-0 ${colors[iconId] ?? "bg-primary/50"}`} />;
}

// ════════════════════════════════════════════════════════════
// Template Selector Dropdown
// ════════════════════════════════════════════════════════════

function TemplateSelectorButton({
  activeTemplateId,
  templates,
  onSelect,
  onNavigateToTemplates,
  open,
  onOpenChange,
}: {
  activeTemplateId: string | null;
  templates: Template[];
  onSelect: (id: string | null) => void;
  onNavigateToTemplates: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const active = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) : null;
  return (
    <TemplatePicker
      value={activeTemplateId}
      onSelect={onSelect}
      onManageTemplates={onNavigateToTemplates}
      align="end"
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        <Button variant="ghost" size="sm" className="h-7 rounded-full gap-1.5 px-2.5 text-xs text-muted-foreground">
          Template:
          {active ? (
            <>
              <span className="text-[12px] leading-none">{templateEmoji(active.name)}</span>
              <span className="text-foreground font-medium">{active.name}</span>
            </>
          ) : (
            <span className="text-foreground font-medium">None</span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </Button>
      }
    />
  );
}

// ════════════════════════════════════════════════════════════
// Right Panel - Outline Tab
// ════════════════════════════════════════════════════════════

function OutlineTab({ onSeek, onScrollToSegment }: { onSeek: (timestamp: string) => void; onScrollToSegment: (segmentId: number) => void }) {
  const [allExpanded, setAllExpanded] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(MOCK_OUTLINE.map((s) => s.id)));

  function toggleSection(id: string) {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleAll() {
    if (allExpanded) { setExpanded(new Set()); } else { setExpanded(new Set(MOCK_OUTLINE.map((s) => s.id))); }
    setAllExpanded(!allExpanded);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <Button variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground" onClick={toggleAll}>
          {allExpanded ? "Collapse all" : "Expand all"}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-full"
            onClick={() => {
              navigator.clipboard.writeText(MOCK_OUTLINE.map((s) => `${s.title}\n${s.bullets.map((b) => `  - ${b.text}`).join("\n")}`).join("\n\n"));
              toast.success("Outline copied");
            }}
          >
            <Icon icon={Copy} className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-full"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }}
          >
            <Icon icon={Link} className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-2">
          {MOCK_OUTLINE.map((section) => (
            <Collapsible key={section.id} open={expanded.has(section.id)} onOpenChange={() => toggleSection(section.id)}>
              <CollapsibleTrigger className="flex w-full items-center gap-1.5 py-2 text-left">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={`shrink-0 text-muted-foreground transition-transform ${expanded.has(section.id) ? "rotate-90" : ""}`}><path d="M8 5l8 7-8 7z" /></svg>
                <span className="text-sm font-medium text-foreground flex-1 truncate">{section.title}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="text-[11px] text-muted-foreground hover:text-primary tabular-nums shrink-0"
                  onClick={(e) => { e.stopPropagation(); onSeek(section.timestamp); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onSeek(section.timestamp);
                    }
                  }}
                >
                  ({section.timestamp})
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-5 pb-2 space-y-1">
                  {section.bullets.map((bullet, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="h-auto w-full justify-start rounded-full px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground whitespace-normal"
                      onClick={() => onScrollToSegment(bullet.segmentId)}
                    >
                      <span className="shrink-0 mt-0.5">{"\u2022"}</span><span>{bullet.text}</span>
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Right Panel - Comments Tab
// ════════════════════════════════════════════════════════════

function CommentsTab({ comments, onSeek, onScrollToSegment }: { comments: Comment[]; onSeek: (timestamp: string) => void; onScrollToSegment: (segmentId: number) => void }) {
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  if (comments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <p className="text-center text-sm text-muted-foreground">No comments yet &mdash; select text in the transcript to add one</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="px-4 py-3 space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border border-border p-3 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start rounded-lg border-l-2 border-primary/40 px-2 py-1 text-left text-xs text-muted-foreground line-clamp-2 transition-colors hover:text-foreground whitespace-normal"
              onClick={() => onScrollToSegment(comment.segmentId)}
            >
              {comment.quote}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 rounded-full px-1.5 text-[11px] text-muted-foreground hover:text-primary" onClick={() => onSeek(comment.timestamp)}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /></svg>
              {comment.timestamp}
            </Button>
            <div className="flex gap-2">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: comment.avatarColor }}>{comment.avatarInitial}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5"><span className="text-xs font-medium text-foreground">{comment.author}</span><span className="text-[10px] text-muted-foreground">{comment.createdAt}</span></div>
                <p className="text-xs text-foreground/90 mt-0.5">{comment.text}</p>
              </div>
            </div>
            {comment.replies.length > 0 && <div className="text-[10px] text-muted-foreground pl-7">{comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}</div>}
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2 pl-7">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: reply.avatarColor }}>{reply.avatarInitial}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><span className="text-xs font-medium text-foreground">{reply.author}</span><span className="text-[10px] text-muted-foreground">{reply.createdAt}</span></div>
                  <p className="text-xs text-foreground/90 mt-0.5">{reply.text}</p>
                </div>
              </div>
            ))}
            <div className="pl-7">
              <input
                className="w-full rounded-md border border-border bg-transparent px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                placeholder="Reply..."
                value={replyInputs[comment.id] ?? ""}
                onChange={(e) => setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter" && replyInputs[comment.id]?.trim()) { toast("Reply sent"); setReplyInputs((prev) => ({ ...prev, [comment.id]: "" })); } }}
              />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function VideoPreview({
  video,
  playbackRate,
  onVideoElementReady,
  onPlayStateChange,
  onTimeChange,
  onDurationChange,
  onPlaybackRateChange,
}: {
  video: VideoPreviewData;
  playbackRate: number;
  onVideoElementReady: (node: HTMLVideoElement | null) => void;
  onPlayStateChange: (playing: boolean) => void;
  onTimeChange: (seconds: number) => void;
  onDurationChange: (seconds: number) => void;
  onPlaybackRateChange: (rate: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    onVideoElementReady(videoRef.current);
    return () => onVideoElementReady(null);
  }, [onVideoElementReady]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.playbackRate = playbackRate;
  }, [playbackRate]);

  return (
    <div className="border-b border-border px-4 pt-3 pb-3">
      <div className="aspect-video overflow-hidden rounded-xl border border-border/70 bg-muted/20">
        <video
          ref={videoRef}
          src={video.url}
          poster={video.poster}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover bg-black"
          onPlay={() => onPlayStateChange(true)}
          onPause={() => onPlayStateChange(false)}
          onTimeUpdate={(event) => onTimeChange(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => onDurationChange(event.currentTarget.duration)}
          onDurationChange={(event) => onDurationChange(event.currentTarget.duration)}
          onRateChange={(event) => onPlaybackRateChange(event.currentTarget.playbackRate)}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Right Panel Container
// ════════════════════════════════════════════════════════════

function RightPanel({
  onSeek,
  onScrollToSegment,
  comments,
  videoPreview,
  videoPlaybackRate,
  onVideoElementReady,
  onVideoPlayStateChange,
  onVideoTimeChange,
  onVideoDurationChange,
  onVideoPlaybackRateChange,
  width,
  onResizeStart,
}: {
  onSeek: (timestamp: string) => void;
  onScrollToSegment: (segmentId: number) => void;
  comments: Comment[];
  videoPreview?: VideoPreviewData;
  videoPlaybackRate: number;
  onVideoElementReady: (node: HTMLVideoElement | null) => void;
  onVideoPlayStateChange: (playing: boolean) => void;
  onVideoTimeChange: (seconds: number) => void;
  onVideoDurationChange: (seconds: number) => void;
  onVideoPlaybackRateChange: (rate: number) => void;
  width: number;
  onResizeStart: () => void;
}) {
  const [panelTab, setPanelTab] = useState<"outline" | "comments">(() => {
    try { return window.localStorage.getItem("ttt_demo_panel_tab") === "comments" ? "comments" : "outline"; } catch { return "outline"; }
  });
  return (
    <div className="relative hidden shrink-0 flex-col border-l border-border bg-background lg:flex" style={{ width }}>
      <button
        type="button"
        aria-label="Resize right panel"
        className="absolute -left-1 top-0 z-30 h-full w-2 cursor-col-resize bg-transparent hover:bg-primary/10"
        onMouseDown={(e) => {
          e.preventDefault();
          onResizeStart();
        }}
      />
      <Tabs value={panelTab} onValueChange={(v) => setPanelTab(v === "comments" ? "comments" : "outline")} className="flex flex-1 flex-col gap-0 min-h-0">
        <TabsList variant="line" className="gap-5 border-b border-border px-4 pt-3 shrink-0">
          <TabsTrigger value="outline" variant="line" className="text-[13px] font-semibold">Outline</TabsTrigger>
          <TabsTrigger value="comments" variant="line" className="text-[13px] font-semibold">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="outline" className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/5 animate-[pulse_3s_ease-in-out_infinite]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-primary"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">Outline</h3>
          <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
          <p className="mt-2 max-w-[220px] text-[12px] leading-relaxed text-muted-foreground">
            Auto-generated chapters and a jump-to-section outline are on the way.
          </p>
        </TabsContent>
        <TabsContent value="comments" className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/5 animate-[pulse_3s_ease-in-out_infinite]">
            <MessageSquarePlus className="size-6 text-primary" strokeWidth={1.6} />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">Comments</h3>
          <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
          <p className="mt-2 max-w-[220px] text-[12px] leading-relaxed text-muted-foreground">
            Time-stamped comments and team discussion will live here soon.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Media Player (sticky bottom)
// ════════════════════════════════════════════════════════════

function MediaPlayer({
  duration,
  progress,
  onProgressChange,
  isPlaying,
  onPlayPause,
  speed,
  onSpeedChange,
  currentTimeSeconds,
  durationSeconds,
  trailing,
}: {
  duration: string;
  progress: number[];
  onProgressChange: (v: number[]) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (rate: number) => void;
  currentTimeSeconds: number;
  durationSeconds: number;
  /* the desktop puts Continue recording here, beside Play: the bar is where the recording lives */
  trailing?: React.ReactNode;
}) {
  const totalSeconds = Math.max(1, durationSeconds);
  const currentSeconds = Math.round(Math.max(0, currentTimeSeconds));

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-3 lg:px-6">
      <Slider value={progress} onValueChange={onProgressChange} max={100} step={0.1} className="mb-3 [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-2" />
      {/* Three columns, and Play is the middle one. The speed control used to be
          a fourth element inside the transport group, which had no mirror on the
          left and pushed Play about twenty pixels off the centre of the bar; it
          now sits with the total time on the right. The side columns are equal
          fractions, so Play stays centred whatever the label does. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span className="min-w-[50px] text-xs tabular-nums text-muted-foreground">{formatTime(currentSeconds)}</span>
        <div className="flex items-center justify-center gap-1.5">
          <Button variant="outline" size="icon" className="size-8 rounded-full border-border" onClick={() => onProgressChange([(Math.max(0, progress[0] - (5 / totalSeconds) * 100))])} title="Back 5s">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 19l-7-7 7-7" /><text x="14" y="16" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">5</text></svg>
          </Button>
          <Button
            onClick={onPlayPause}
            className={`rounded-full gap-1.5 transition-all ${isPlaying ? "h-9 w-9 px-0" : "h-9 px-4"} bg-primary text-primary-foreground hover:bg-primary/90`}
          >
            {isPlaying
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" /></svg><span className="text-[13px] font-semibold">Play</span></>
            }
          </Button>
          <Button variant="outline" size="icon" className="size-8 rounded-full border-border" onClick={() => onProgressChange([(Math.min(100, progress[0] + (5 / totalSeconds) * 100))])} title="Forward 5s">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l7 7-7 7" /><text x="2" y="16" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">5</text></svg>
          </Button>
        </div>
        <div className="flex items-center justify-end gap-2">
          {trailing}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 rounded-full px-2.5 text-xs font-medium border-border">{speed}x</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[80px]">{[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => <DropdownMenuItem key={rate} onClick={() => onSpeedChange(rate)}>{rate}x</DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>
          <span className="text-xs tabular-nums text-muted-foreground">{duration}</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Page Header
// ════════════════════════════════════════════════════════════

function formatElapsedTime(seconds: number) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const LIVE_WAVE_BARS = 18;

function LiveRecordingWaveform({ active }: { active: boolean }) {
  const [heights, setHeights] = useState<number[]>(() => Array(LIVE_WAVE_BARS).fill(4));

  useEffect(() => {
    if (!active) {
      setHeights(Array(LIVE_WAVE_BARS).fill(4));
      return;
    }
    const id = window.setInterval(() => {
      setHeights(Array.from({ length: LIVE_WAVE_BARS }, () => Math.random() * 14 + 4));
    }, 120);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <div className="hidden items-center gap-[2px] min-[980px]:flex" style={{ height: "18px" }}>
      {heights.map((height, idx) => (
        <div
          key={idx}
          className="w-[2px] rounded-full transition-[height] duration-150"
          style={{
            height: `${height}px`,
            backgroundColor: active ? "var(--primary)" : "var(--muted-foreground)",
            opacity: active ? 0.45 + (idx % 5) * 0.1 : 0.28,
          }}
        />
      ))}
    </div>
  );
}


/* What used to be the Instant speech dialog, folded into the bar: the language
   the call is in and whether speakers are told apart. Opens on demand, never
   before the recording, and defaults come from Notetaker settings. */
function RecordingOptions({ compact }: { compact: boolean }) {
  const { settings, update } = useNotetakerSettings();
  const optsFlag = useDemo("opts");
  const [open, setOpen] = useState(optsFlag === "1");
  useEffect(() => { if (optsFlag === "1") setOpen(true); }, [optsFlag]);
  const lang = LANGUAGES.find((l) => l.id === settings.language);
  const label = lang?.id === "auto" || !lang ? "Auto-detect" : lang.label;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title="Language and speakers" className={`flex h-[36px] shrink-0 items-center gap-[8px] rounded-[12px] border border-input bg-transparent text-[13px] text-foreground transition-colors hover:bg-muted data-[state=open]:bg-muted ${compact ? "w-[44px] justify-center" : "px-[12px]"}`}>
          <Icon icon={LanguageSquareIcon} className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.8} />
          {!compact && <span className="truncate">{label}</span>}
          {!compact && <Icon icon={ArrowDown01Icon} className="size-[13px] shrink-0 text-muted-foreground" strokeWidth={2} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="z-[120] w-[340px] rounded-[16px] p-[16px]">
        <p className="text-[14px] font-semibold text-foreground">This recording</p>
        <p className="mt-[2px] text-[12.5px] text-muted-foreground">Changes apply from here on. Defaults live in Notetaker settings.</p>
        <div className="mt-[14px] flex flex-col gap-[14px]">
          <LanguageSelector value={settings.language} onChange={(v) => update({ language: v })} label="Transcription language" />
          <SpeakerSection enabled={settings.speakers} onToggle={() => update({ speakers: !settings.speakers })} count={settings.speakerCount} onCountChange={(v) => update({ speakerCount: v })} />
        </div>
      </PopoverContent>
    </Popover>
  );
}


/* The warning sits on the device it is about: an orange ring around the picker
   and a triangle on its corner. The words and the Allow button live one click
   away, so the bar stays as quiet as before. */
function BlockedBadge({ warning }: { warning: { title: string; body: string; action: string; onAllow: () => void } }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title={warning.title} className="absolute -right-[7px] -top-[7px] z-[1] flex size-[20px] items-center justify-center rounded-full border-2 border-background bg-warning text-white shadow-sm transition-transform hover:scale-105">
          <Icon icon={Alert02Icon} className="size-[11px]" strokeWidth={2.4} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="z-[120] w-[320px] rounded-[16px] p-[16px]">
        <p className="flex items-start gap-2 text-[14px] font-semibold text-foreground"><Icon icon={Alert02Icon} className="mt-[2px] size-[16px] shrink-0 text-warning" strokeWidth={2} />{warning.title}</p>
        <p className="mt-[6px] text-[12.5px] text-muted-foreground">{warning.body}</p>
        <Button variant="warning" onClick={warning.onAllow} className="mt-[12px] h-8 rounded-full px-[14px] text-[13px] font-semibold">{warning.action}</Button>
      </PopoverContent>
    </Popover>
  );
}

export function LiveRecordingBar({
  isPaused,
  elapsedSeconds,
  onPauseResume,
  onStop,
  microphoneDevices,
  selectedMicrophoneId,
  onSwitchMicrophone,
  isSwitchingMicrophone,
  generate = false,
  showGenerate = true,
  showDevices = true,
  caption = true,
  warning,
}: {
  isPaused: boolean;
  /* after the note is written the bar only offers Resume; nothing new to generate yet */
  showGenerate?: boolean;
  showDevices?: boolean;
  /* the half-width panel has no room for the caption; the dot and the timer say enough */
  caption?: boolean;
  /* a permission is missing: a triangle in the bar, the words on demand */
  warning?: { title: string; body: string; action: string; onAllow: () => void; mic: boolean; sys: boolean };
  elapsedSeconds: number;
  onPauseResume: () => void;
  onStop: () => void;
  /* the desktop shell ends a call with the note itself: one blue verb, no Stop */
  generate?: boolean;
  microphoneDevices: { id: string; label: string }[];
  selectedMicrophoneId: string;
  onSwitchMicrophone: (deviceId: string) => void;
  isSwitchingMicrophone: boolean;
}) {
  const selectedMic = microphoneDevices.find((device) => device.id === selectedMicrophoneId);
  /* without the caption the bar is in the half-width panel: the device pickers shrink to their icons */
  const compact = !caption;
  /* with the warning triangle in the row the pickers give up a little width so Pause stays centred */
  const pickerW = "md:w-[168px]";
  /* the desktop hears the other side through an output device; which one is a
     choice of its own, kept for the session */
  const [outputs, setOutputs] = useState<{ id: string; label: string }[]>([]);
  const [outputId, setOutputId] = useState(() => window.sessionStorage.getItem("ttt_output_device") || "");
  useEffect(() => {
    if (!generate || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((list) => {
      const outs = list.filter((d) => d.kind === "audiooutput").map((d, i) => ({ id: d.deviceId || `out-${i}`, label: d.label || `Speakers ${i + 1}` }));
      setOutputs(outs.length ? outs : [{ id: "default", label: "Built-in speakers" }]);
    }).catch(() => setOutputs([{ id: "default", label: "Built-in speakers" }]));
  }, [generate]);
  const outputLabel = outputs.find((o) => o.id === outputId)?.label || outputs[0]?.label || "Speakers";
  const triggerLabel = isSwitchingMicrophone
    ? "Switching microphone..."
    : (selectedMic?.label || (microphoneDevices.length ? "Select microphone" : "No microphone detected"));

  return (
    <div className="relative shrink-0 border-t border-border bg-background/95 px-6 py-3 backdrop-blur-[2px]">
      {generate && isPaused && showGenerate && (
        /* Granola's grammar: the call is on hold, and only now the note can be
           written. One glowing verb above the bar, nothing else changes. */
        <button type="button" onClick={onStop} className="ttt-glow absolute left-1/2 top-0 z-10 flex h-9 -translate-x-1/2 -translate-y-[calc(100%+10px)] items-center gap-1.5 rounded-full bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground transition-transform hover:scale-[1.03]" title="End the call here and write the note">
          <Icon icon={AiMagicIcon} className="size-[14px]" strokeWidth={1.8} />
          Generate notes
        </button>
      )}
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-[8px] shrink-0">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${!isPaused ? "animate-ping" : ""}`}
              style={{ backgroundColor: isPaused ? undefined : "#f87171" }} />
            <span className={`relative inline-flex size-[8px] rounded-full ${isPaused ? "bg-muted-foreground" : ""}`}
              style={{ backgroundColor: isPaused ? undefined : "#ef4444" }} />
          </span>
          <span className={`font-semibold text-[13px] ${isPaused ? "text-muted-foreground" : "text-destructive"} whitespace-nowrap`}>
            {isPaused ? "Paused" : "Recording"}
          </span>
          <span className="font-semibold text-[14px] text-foreground tabular-nums">{formatElapsedTime(elapsedSeconds)}</span>
          <LiveRecordingWaveform active={!isPaused} />
          {caption && <span className="hidden whitespace-nowrap text-xs text-muted-foreground md:inline">
            {isPaused ? (generate ? (showGenerate ? "On hold. Resume, or generate the notes" : "Resume to add more") : "Recording on hold") : "Live transcript is running"}
          </span>}
        </div>

        <div className="order-3 md:order-2 flex items-center justify-center gap-2">
          <Button
            variant="pill-outline"
            className={`h-9 rounded-full gap-1.5 ${generate ? "px-4" : "px-3"}`}
            onClick={onPauseResume}
            title={isPaused ? "Resume recording" : "Pause recording"}
          >
            <Icon icon={isPaused ? PlayIcon : PauseIcon} className="size-[14px] text-foreground" strokeWidth={2} />
            <span className="text-[13px] font-medium text-foreground">{isPaused ? "Resume" : "Pause"}</span>
          </Button>
          {generate ? null : (
          <Button
            variant="destructive"
            className="h-9 rounded-full px-3 gap-1.5"
            onClick={onStop}
            title="Stop recording"
          >
            <svg className="size-[12px] text-white" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="10" height="10" rx="2" /></svg>
            <span className="text-[13px] font-semibold text-white">Stop</span>
          </Button>
          )}
        </div>

        {!showDevices ? <div className="order-2 md:order-3" /> : <div className={`order-2 md:order-3 md:justify-self-end w-full md:w-auto ${generate ? (compact ? "flex gap-2" : "flex gap-2 md:max-w-[640px]") : "md:min-w-[260px] md:max-w-[320px]"}`}>
          {generate && <RecordingOptions compact={compact} />}
          {generate && (
            <div className="relative">
            {warning?.sys && <BlockedBadge warning={warning} />}
            <Select value={outputId || outputs[0]?.id} onValueChange={(v) => { setOutputId(v); window.sessionStorage.setItem("ttt_output_device", v); }} disabled={!outputs.length}>
              <SelectTrigger className={`h-[36px] w-full rounded-[12px] bg-transparent px-[12px] gap-[8px] ${warning?.sys ? "border-warning bg-warning/[0.06]" : "border-input"} ${compact ? "md:w-[44px] justify-center [&>svg:last-child]:hidden" : pickerW}`} title={compact ? outputLabel : "Where the call's sound plays"}>
                <span className="flex min-w-0 items-center gap-[8px]">
                  <Icon icon={VolumeHighIcon} className={`size-[16px] shrink-0 ${warning?.sys ? "text-warning" : "text-muted-foreground"}`} strokeWidth={1.8} />
                  {!compact && <span className={`truncate text-[13px] ${warning?.sys ? "text-warning" : "text-foreground"}`}>{warning?.sys ? "Not allowed" : outputLabel}</span>}
                </span>
              </SelectTrigger>
              <SelectContent align="start" className="z-[120] max-w-[calc(100vw-32px)] rounded-[12px]">
                {outputs.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-[13px]"><span className="truncate">{o.label}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          )}
          <div className="relative">
          {warning?.mic && <BlockedBadge warning={warning} />}
          <Select
            value={selectedMicrophoneId || undefined}
            onValueChange={onSwitchMicrophone}
            disabled={!microphoneDevices.length || isSwitchingMicrophone}
          >
            <SelectTrigger className={`h-[36px] w-full rounded-[12px] bg-transparent px-[12px] gap-[8px] ${warning?.mic ? "border-warning bg-warning/[0.06]" : "border-input"} ${compact ? "md:w-[44px] justify-center [&>svg:last-child]:hidden" : generate ? pickerW : ""}`} title={compact ? triggerLabel : undefined}>
              <span className="flex min-w-0 items-center gap-[8px]">
                <SourceIcon source="microphone" />
                {!compact && <span className={`truncate text-[13px] ${warning?.mic ? "text-warning" : "text-foreground"}`}>{warning?.mic ? "Not allowed" : triggerLabel}</span>}
              </span>
            </SelectTrigger>
            <SelectContent align="start" className="z-[120] max-w-[calc(100vw-32px)] rounded-[12px]">
              {microphoneDevices.map((device) => (
                <SelectItem key={device.id} value={device.id} className="text-[13px]">
                  <span className="flex min-w-0 items-center gap-[8px]">
                    <SourceIcon source="microphone" />
                    <span className="truncate">{device.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>}
      </div>
    </div>
  );
}

interface PageHeaderFolderOption {
  id: string;
  name: string;
  color: string;
}

interface PageHeaderMeta {
  dateLabel: string;
  durationLabel: string;
  screenshotsCount: number;
}

interface PageHeaderProps {
  title: string;
  onTitleChange: (t: string) => void;
  meta: PageHeaderMeta;
  source?: SourceType;
  folders: PageHeaderFolderOption[];
  shares: ShareRecord[];
  onShare: () => void;
  onCopyLink: () => void;
  onCopySummary: (lang?: string) => void;
  hasSummary: boolean;
  onSetTemplate: () => void;
  onMoveToFolder: (folderId: string) => void;
  onCreateFolderAndMove: () => void;
  onExport: () => void;
  onRematchSpeakers: () => void;
  onRegenerateSummary: () => void;
  onSyncTextToAudio: () => void;
  onDelete: () => void;
  onCopyTranscript: (lang?: string) => void;
  copyMenu: CopyMenuModel;
  isTranscriptTab: boolean;
  onOpenMore: () => void;
  onTranslateTo: (code: string) => void;
  activeTranslationLang: string | null;
  translationDisabled: boolean;
}

function PageHeader({
  title,
  onTitleChange,
  meta,
  source,
  folders,
  shares,
  onShare,
  onCopyLink,
  onCopySummary,
  hasSummary,
  onSetTemplate,
  onMoveToFolder,
  onCreateFolderAndMove,
  onExport,
  onRematchSpeakers,
  onRegenerateSummary,
  onSyncTextToAudio,
  onDelete,
  onCopyTranscript,
  copyMenu,
  isTranscriptTab,
  onOpenMore,
  onTranslateTo,
  activeTranslationLang,
  translationDisabled,
}: PageHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { displayName, avatarSrc } = useUserProfile();
  /* The second state of this page: the record belongs to somebody else. */
  const sharedOwner = useMemo(() => readSharedRecordOwner(), []);

  useEffect(() => {
    if (editingTitle && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editingTitle]);

  return (
    <div className="px-4 pt-4 pb-0 lg:px-8 lg:pt-6">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div
          className={`min-w-0 flex-1 rounded-xl py-2 pr-2 pl-0 transition-colors ${
            sharedOwner ? "" : editingTitle ? "bg-muted/55" : "cursor-text hover:bg-muted/45"
          }`}
          onClick={() => { if (!sharedOwner && !editingTitle) setEditingTitle(true); }}
        >
          {editingTitle && !sharedOwner ? (
            <Input ref={inputRef} value={title} onChange={(e) => onTitleChange(e.target.value)} onBlur={() => setEditingTitle(false)} onKeyDown={(e) => { if (e.key === "Enter") setEditingTitle(false); }} className="h-auto border-none bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0" style={{ fontSize: "24px", lineHeight: "1.3" }} />
          ) : (
            <h1 className="text-[20px] leading-[26px] tracking-[-0.3px] font-bold text-foreground lg:text-2xl lg:leading-tight lg:tracking-normal">{title}</h1>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {!sharedOwner && <span className="max-md:hidden"><SharedUsersAvatars shares={shares} /></span>}
          {!hasSummary && !sharedOwner && (
            <Button className="order-first flex items-center gap-[6px] h-9 px-[14px] transition-colors cursor-pointer max-md:hidden" onClick={onSetTemplate}>
              <span className="font-medium text-[13px]">Apply template</span>
            </Button>
          )}
          {/* 1. The first entry point in the spec, and it was the one missing:
              the result page carried a Share handler with nothing to press. It
              sits beside Copy rather than in the overflow, because a record is
              shared far more often than it is exported. */}
          {!sharedOwner && (
            <Button
              variant="pill-outline"
              data-qa-label="Share"
              className="flex items-center gap-[6px] h-9 px-[14px] max-md:hidden"
              onClick={onShare}
            >
              <Icon icon={Share} className="size-[14px]" strokeWidth={1.7} />
              <span className="font-medium text-[13px]">Share</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="pill-outline" className="flex items-center gap-[6px] h-9 px-[14px] max-md:hidden">
                <Icon icon={Copy} className="size-[14px]" strokeWidth={1.7} />
                <span className="font-medium text-[13px]">Copy</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M6 9l6 6 6-6" /></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className={"z-[120] " + (copyMenu.translation ? "w-[236px]" : "w-[190px]")}>
              {copyMenu.translation ? (
                <>
                  {/* With a translation on the record, "Copy transcript" no longer
                      names one thing, so the language is the choice and the flag
                      carries it. */}
                  <DropdownMenuLabel className="text-[11.5px] font-medium text-muted-foreground">Transcript</DropdownMenuLabel>
                  <DropdownMenuItem className="gap-2" onClick={() => onCopyTranscript()}>
                    <span className="w-4 text-center text-[14px] leading-none">{copyMenu.original.flag}</span>
                    {copyMenu.original.label}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => onCopyTranscript(copyMenu.translation.code)}>
                    <span className="w-4 text-center text-[14px] leading-none">{copyMenu.translation.flag}</span>
                    {copyMenu.translation.label}
                  </DropdownMenuItem>
                  {copyMenu.hasSummary && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[11.5px] font-medium text-muted-foreground">Summary</DropdownMenuLabel>
                      <DropdownMenuItem className="gap-2" onClick={() => onCopySummary()}>
                        <span className="w-4 text-center text-[14px] leading-none">{copyMenu.original.flag}</span>
                        {copyMenu.original.label}
                      </DropdownMenuItem>
                      {/* Only offered once the summary itself came back translated:
                          the transcript can be done while this one is still running. */}
                      {copyMenu.summaryTranslated && (
                        <DropdownMenuItem className="gap-2" onClick={() => onCopySummary(copyMenu.translation.code)}>
                          <span className="w-4 text-center text-[14px] leading-none">{copyMenu.translation.flag}</span>
                          {copyMenu.translation.label}
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <DropdownMenuItem className="gap-2" onClick={() => onCopyTranscript()}>
                    <Icon icon={Copy} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                    Copy transcript
                  </DropdownMenuItem>
                  {copyMenu.hasSummary && (
                    <DropdownMenuItem className="gap-2" onClick={() => onCopySummary()}>
                      <Icon icon={Copy} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                      Copy summary
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="size-8 rounded-full max-md:hidden" onClick={onExport} aria-label="Export">
            <Icon icon={Upload} className="size-4 text-muted-foreground" strokeWidth={1.7} />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full max-lg:hidden" onClick={onCopyLink} aria-label="Copy link">
                <Icon icon={Link} className="size-4 text-muted-foreground" strokeWidth={1.8} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>
          <button
            type="button"
            aria-label="More actions"
            className="max-md:hidden lg:hidden inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={onOpenMore}
          >
            <Icon icon={MoreHorizontal} className="size-4 text-muted-foreground" strokeWidth={2} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className="max-lg:hidden inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Icon icon={MoreHorizontal} className="size-4 text-muted-foreground" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[120] w-[230px]">
              {/* Mobile only: actions relocated from the header row + translate picker */}
              {copyMenu.translation && (
                <>
                  <DropdownMenuLabel className="max-md:hidden lg:hidden text-[11.5px] font-medium text-muted-foreground">Copy transcript</DropdownMenuLabel>
                  <DropdownMenuItem className="gap-2 max-md:hidden lg:hidden" onClick={() => onCopyTranscript()}>
                    <span className="w-4 text-center text-[14px] leading-none">{copyMenu.original.flag}</span>
                    {copyMenu.original.label}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 max-md:hidden lg:hidden" onClick={() => onCopyTranscript(copyMenu.translation.code)}>
                    <span className="w-4 text-center text-[14px] leading-none">{copyMenu.translation.flag}</span>
                    {copyMenu.translation.label}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="max-md:hidden lg:hidden" />
                </>
              )}
              {hasSummary ? (
                <DropdownMenuItem className="gap-2 max-md:hidden lg:hidden" onClick={() => onCopySummary()}>
                  <Icon icon={Copy} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                  Copy summary
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="gap-2 max-md:hidden lg:hidden" onClick={onSetTemplate}>
                  Apply template
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2 max-md:hidden lg:hidden" onClick={onCopyLink}>
                <Icon icon={Link} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                Copy link
              </DropdownMenuItem>
              {!sharedOwner && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 max-md:hidden lg:hidden">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></svg>
                  Translate to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-[200px]">
                  {TRANSLATION_LANGUAGES.map((language) => (
                    <DropdownMenuItem
                      key={language.code}
                      className="gap-2"
                      disabled={translationDisabled}
                      onClick={() => onTranslateTo(language.code)}
                    >
                      <span>{language.flag}</span>
                      <span className="flex-1">{language.label}</span>
                      {activeTranslationLang === language.code ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto size-3.5 text-primary"><path d="M20 6L9 17l-5-5" /></svg>
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              )}
              <DropdownMenuSeparator className="max-md:hidden lg:hidden" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                  Move
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-[220px]">
                  {folders.length > 0 ? (
                    folders.map((folder) => (
                      <DropdownMenuItem key={folder.id} className="gap-2" onClick={() => onMoveToFolder(folder.id)}>
                        <svg className="size-4 shrink-0" fill="none" viewBox="0 0 16 16">
                          <path d="M13.3333 13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V5.33333C14.6667 4.97971 14.5262 4.64057 14.2761 4.39052C14.0261 4.14048 13.687 4 13.3333 4H8.06667C7.84368 4.00219 7.6237 3.94841 7.42687 3.84359C7.23004 3.73877 7.06264 3.58625 6.94 3.4L6.4 2.6C6.27859 2.41565 6.11332 2.26432 5.919 2.1596C5.72468 2.05488 5.50741 2.00004 5.28667 2H2.66667C2.31304 2 1.97391 2.14048 1.72386 2.39052C1.47381 2.64057 1.33333 2.97971 1.33333 3.33333V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333Z" fill={folder.color} />
                        </svg>
                        <span className="truncate">{folder.name}</span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No folders yet</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={onCreateFolderAndMove}>
                    <Icon icon={FolderOpen} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                    Create folder and move
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {sharedOwner ? (
                /* The only thing a reader may do to somebody else's record: stop
                   keeping it on their own list. It does not touch the original. */
                <DropdownMenuItem className="gap-2" data-qa-label="remove-shared">
                  <Icon icon={Cancel01Icon} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                  Remove from Shared
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem className="gap-2" onClick={onRegenerateSummary}>
                    <Icon icon={Zap} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                    Regenerate summary
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" className="gap-2" onClick={onDelete}>
                    <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground max-lg:flex-wrap">
        {/* Whose record this is survives on a phone: it is the first thing a
            reader needs and it used to be the first thing hidden. On a narrow
            screen it takes the whole line rather than wrapping mid-sentence. */}
        {sharedOwner ? (
          <div className="flex items-center gap-1.5 max-md:w-full">
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]" style={{ background: sharedOwner.tint, color: sharedOwner.ink }}>
                {sharedOwner.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground">{sharedOwner.name}</span>
            <span>shared this with you</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 max-md:hidden">
            <Avatar className="size-5"><AvatarImage src={avatarSrc} alt={displayName} /><AvatarFallback className="text-[10px]">{displayName.charAt(0)}</AvatarFallback></Avatar>
            <span>{displayName}</span>
          </div>
        )}
        {source && (
          <>
            <span className="text-border max-md:hidden">{"\u2022"}</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="scale-[0.9]"><SourceIcon source={source} /></span>
              <span>{getSourceLabel(source)}</span>
            </span>
          </>
        )}
        <span className="text-border">{"\u2022"}</span>
        <span>{meta.dateLabel}</span>
        <span className="text-border">{"\u2022"}</span>
        <span>{meta.durationLabel}</span>
        <span className="text-border max-lg:hidden">{"\u2022"}</span>
        <span className="max-lg:hidden">{meta.screenshotsCount} {meta.screenshotsCount === 1 ? "screenshot" : "screenshots"}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Main Page Component
// ════════════════════════════════════════════════════════════

export function TranscriptionDetailPage() {
  const navigate = useNavigate();
  /* Somebody else's record: the page still reads and exports, but every control
     that would change the owner's copy is not on it. */
  const sharedOwner = useMemo(() => readSharedRecordOwner(), []);
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { folders, folderAssignments, addFolder, assignToFolder } = useFolders();
  const { getName } = useStarred();
  const {
    jobs,
    recordingPhase,
    recordingElapsed,
    pauseInstantRecording,
    resumeInstantRecording,
    stopInstantRecording,
    microphoneDevices,
    selectedMicrophoneId,
    switchRecordingMicrophone,
    isSwitchingMicrophone,
    liveTranscriptSegments,
    liveTranscriptInterim,
    isLiveTranscriptionSupported,
    setRecordingDetailOpen,
  } = useTranscriptionModals();

  const routeState = location.state as { record?: RecordRow; liveRecording?: boolean; fromRecordingStop?: boolean } | null;
  const routeStateRecord = routeState?.record;
  const isLiveRecordingRoute = id === "live" || Boolean(routeState?.liveRecording);
  /* the desktop shell: your notes beside the live transcript, kept with the record */
  const { desktop: desktopShell, machine } = useShell();
  const padKey = isLiveRecordingRoute ? "live" : (id ?? "live");
  const [liveTab, setLiveTab] = useState<"notes" | "transcript">("notes");
  const [pad, setPad] = useState<PadLine[]>(() => {
    if (!isLiveRecordingRoute && routeState?.fromRecordingStop) {
      const moved = loadPad("live");
      if (moved.some((l) => l.text)) { savePad(id ?? "live", moved); window.localStorage.removeItem("ttt_notes:live"); return moved; }
    }
    return loadPad(padKey);
  });
  useEffect(() => { savePad(padKey, pad); }, [pad, padKey]);
  const liveTitle = window.sessionStorage.getItem("ttt_live_title") || "Untitled call";
  const generatedRef = useRef(false);
  const persistedRecord = useMemo<RecordRow | null>(() => {
    if (!id || typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(`uploaded-record:${id}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RecordRow;
      if (!parsed || typeof parsed !== "object" || parsed.id !== id) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [id]);

  const selectedJob = useMemo<TranscriptionJob | null>(() => {
    if (!id || isLiveRecordingRoute) return null;
    return jobs.find((job) => job.id === id) ?? null;
  }, [id, isLiveRecordingRoute, jobs]);

  const selectedRecord = useMemo<RecordRow | null>(() => {
    if (isLiveRecordingRoute) return null;
    if (selectedJob) return mapJobToDetailRecord(selectedJob);
    if (routeStateRecord && (!id || routeStateRecord.id === id)) return routeStateRecord;
    if (persistedRecord && (!id || persistedRecord.id === id)) return persistedRecord;
    if (id) return records.find((record) => record.id === id) ?? null;
    return records[0] ?? null;
  }, [id, isLiveRecordingRoute, persistedRecord, routeStateRecord, selectedJob]);

  const isJobTranscribing = Boolean(selectedJob && (selectedJob.status === "uploading" || selectedJob.status === "processing"));
  const previewSegments = selectedJob?.livePreviewSegments ?? [];


  const fallbackTitle = isLiveRecordingRoute ? (desktopShell ? liveTitle : "Live note") : "Weekly Team Sync - Product & Engineering";
  const recordTitle = selectedRecord ? getName(selectedRecord.id, selectedRecord.name) : fallbackTitle;
  const selectedFolder = useMemo(() => {
    if (!selectedRecord) return null;
    const folderId = folderAssignments[selectedRecord.id];
    if (!folderId) return null;
    return folders.find((folder) => folder.id === folderId) ?? null;
  }, [selectedRecord, folderAssignments, folders]);
  /* Phone chrome: the top bar becomes back + the nesting path (no hamburger/search). */
  const fromMeetings = (location.state as { from?: string } | null)?.from === "meetings";
  useEffect(() => {
    setInnerScreen({
      back: () => (fromMeetings ? navigate("/", { state: { page: "calendar" } }) : navigate("/")),
      parent: sharedOwner ? undefined : fromMeetings || !selectedFolder ? undefined : "My records",
      title: sharedOwner ? "Shared with me" : fromMeetings ? "Meetings" : (selectedFolder ? selectedFolder.name : "My records"),
    });
    return () => setInnerScreen(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromMeetings, selectedFolder]);
  const [title, setTitle] = useState(recordTitle);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("transcript");
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);
  const [playerProgress, setPlayerProgress] = useState(demoPlayheadProgress);
  const [isFallbackPlaying, setIsFallbackPlaying] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(1);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    selectedJob?.templateId ?? routeStateRecord?.templateId ?? persistedRecord?.templateId ?? null,
  );
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryQuery, setSummaryQuery] = useState("");
  /* the desktop shell: which permission the demo pretends is missing (`?perm=1|mic`) */
  const [liveFolderId, setLiveFolderId] = useState<string | null>(() => window.sessionStorage.getItem("ttt_live_folder"));
  const permFlag = useDemo("perm");
  const [permDemo, setPermDemo] = useState<string | null>(() => (permFlag === "1" || permFlag === "mic" ? permFlag : null));
  useEffect(() => { setPermDemo(permFlag === "1" || permFlag === "mic" ? permFlag : null); }, [permFlag]);
  const [summaryStage, setSummaryStage] = useState("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [belowLg, setBelowLg] = useState(false);
  const [belowMd, setBelowMd] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setBelowLg(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setBelowMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const { templates } = useTemplates();

  useEffect(() => {
    /* a note just written on the desktop keeps the template it was written with */
    if (!(desktopShell && routeState?.fromRecordingStop && generatedRef.current)) setActiveTemplateId(selectedJob?.templateId ?? routeStateRecord?.templateId ?? persistedRecord?.templateId ?? null);
  }, [id, selectedJob?.templateId, routeStateRecord?.templateId, persistedRecord?.templateId]);

  // PRO "Apply template" deep-link: a record opened with a template to apply.
  const appliedFromRouteRef = useRef(false);
  const applyTimersRef = useRef<number[]>([]);
  useEffect(() => () => { applyTimersRef.current.forEach((t) => clearTimeout(t)); }, []);
  useEffect(() => {
    if (appliedFromRouteRef.current) return;
    const tid = (location.state as { applyTemplateId?: string } | null)?.applyTemplateId;
    if (!tid) return;
    const selected = templates.find((t) => t.id === tid);
    if (!selected) return;
    appliedFromRouteRef.current = true;
    setActiveTemplateId(tid);
    setActiveTab("summary");
    setIsSummaryLoading(true);
    setSummaryStage("Analyzing the transcript");
    applyTimersRef.current.push(window.setTimeout(() => setSummaryStage("Generating sections"), 1300));
    applyTimersRef.current.push(window.setTimeout(() => setSummaryStage("Polishing the summary"), 2600));
    applyTimersRef.current.push(window.setTimeout(() => { setIsSummaryLoading(false); toast.success(`Template "${selected.name}" applied`); }, 3600));
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates]);
  const [selectedTranslationLang, setSelectedTranslationLang] = useState("");
  const [activeTranslationLang, setActiveTranslationLang] = useState<string | null>(null);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [translatedSegments, setTranslatedSegments] = useState<Record<number, string>>({});
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [translationSummaryStatus, setTranslationSummaryStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [translationTranscriptStatus, setTranslationTranscriptStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [summaryError, setSummaryError] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isRightPanelResizing, setIsRightPanelResizing] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { shares: transcriptionShares } = useShares("transcription", selectedRecord?.id ?? id ?? "");
  const activeTranslationMeta = useMemo(
    () => TRANSLATION_LANGUAGES.find((language) => language.code === activeTranslationLang) ?? null,
    [activeTranslationLang],
  );
  const showTranslateAction = selectedTranslationLang.length > 0;
  const isTranslationApplied = showTranslateAction && selectedTranslationLang === activeTranslationLang;
  const canApplyTranslation = showTranslateAction && !isTranslationApplied && !isTranslationLoading && !isJobTranscribing;

  // Segment-level state
  const [segHighlights, setSegHighlights] = useState<Set<number>>(new Set());
  const [commentSegmentId, setCommentSegmentId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [textHighlights, setTextHighlights] = useState<Record<number, { start: number; end: number }[]>>({});

  // Text selection highlight pill
  const [selectionPill, setSelectionPill] = useState<{ x: number; y: number; segmentId: number; start: number; end: number } | null>(null);

  const pageRef = useRef<HTMLDivElement | null>(null);
  // Segment refs for scroll-to
  const segmentRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const lastAutoScrolledSegmentRef = useRef<number | null>(null);
  const liveTranscriptEndRef = useRef<HTMLDivElement | null>(null);
  const isLiveRecordingDetail = isLiveRecordingRoute && (recordingPhase === "recording" || recordingPhase === "paused");
  const liveDetailSegments = useMemo<Segment[]>(
    () => liveTranscriptSegments.map((segment) => ({
      id: segment.id,
      speaker: LIVE_RECORDING_SPEAKER,
      timestamp: segment.timestamp,
      text: segment.text,
    })),
    [liveTranscriptSegments],
  );
  const previewDetailSegments = useMemo<Segment[]>(
    () => previewSegments.map((segment) => ({
      id: segment.id,
      speaker: LIVE_RECORDING_SPEAKER,
      timestamp: segment.timestamp,
      text: segment.text,
    })),
    [previewSegments],
  );
  /* ttt_demo_playback=cases* swaps in replicas of very different lengths, so
     the highlight can be judged on a one-word answer as well as on a paragraph.
     The three parking spots sit in a question, in that one word, and in the
     paragraph - all of which need this set, not only the first. */
  const showCases = (() => {
    try { return (window.localStorage.getItem("ttt_demo_playback") || "").startsWith("cases"); } catch { return false; }
  })();
  const contentSegments = useMemo<Segment[]>(
    () => (showCases
      ? CASE_SEGMENTS
      : selectedJob?.source === "microphone" && previewDetailSegments.length > 0
        ? previewDetailSegments
        : MOCK_SEGMENTS),
    [previewDetailSegments, selectedJob?.source, showCases],
  );
  // Single-speaker / monologue mode: hide the speaker column when there's only one voice.
  // Demo flag forces it with dedicated monologue content for design captures.
  const forceSingleSpeaker = useMemo(() => {
    try { return typeof window !== "undefined" && window.localStorage.getItem("ttt_demo_single_speaker") === "1"; } catch { return false; }
  }, []);
  // Continuous monologue (podcast / dictation): one voice, no speaker column, no per-line timecodes.
  const forcePlainMono = useMemo(() => {
    try { return typeof window !== "undefined" && window.localStorage.getItem("ttt_demo_mono_plain") === "1"; } catch { return false; }
  }, []);
  const displaySegments = (forceSingleSpeaker || forcePlainMono) ? MONO_SEGMENTS : contentSegments;
  const isSingleSpeaker = forceSingleSpeaker || forcePlainMono || new Set(displaySegments.map((seg) => seg.speaker.id)).size <= 1;

  // Demo: ttt_demo_limited=1|modal renders the limited-access transcript state.
  const [limitedFlag] = useState<"1" | "modal" | null>(() => {
    try {
      const value = window.localStorage.getItem("ttt_demo_limited");
      return value === "1" || value === "modal" ? value : null;
    } catch {
      return null;
    }
  });
  const [limitedModalOpen, setLimitedModalOpen] = useState(false);
  const limitedModalShownRef = useRef(false);
  const limitedActive = limitedFlag !== null && displaySegments.length > 1;
  // The free portion stops after the first few turns, so the cut, the fade and the
  // unlock card all land inside the first screen instead of far below the fold.
  const limitedFreeSegments = limitedActive ? displaySegments.slice(0, LIMITED_FREE_TURNS) : displaySegments;

  useEffect(() => {
    if (limitedFlag !== "modal" || limitedModalShownRef.current) return;
    const timer = window.setTimeout(() => {
      limitedModalShownRef.current = true;
      setLimitedModalOpen(true);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [limitedFlag]);

  const activeTemplate = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) ?? null : null;

  const contentSummary = useMemo(() => {
    if (selectedJob?.source === "microphone" && previewDetailSegments.length > 0) {
      const firstSegmentText = previewDetailSegments[0]?.text ?? "";
      const shortFirstSegment = firstSegmentText.length > 220 ? `${firstSegmentText.slice(0, 217)}...` : firstSegmentText;
      return [
        "## Recording Summary",
        "",
        `- **Status**: ${selectedJob?.status === "done" ? "Transcript is ready" : "Transcript is being processed"}`,
        `- **Captured segments**: ${previewDetailSegments.length}`,
        `- **Duration**: ${selectedRecord?.duration ?? "In progress"}`,
        "",
        "## First Captured Phrase",
        "",
        shortFirstSegment ? `- ${shortFirstSegment}` : "- No speech was detected.",
      ].join("\n");
    }

    // When a template is applied, restructure summary using template sections
    if (activeTemplate?.sections?.length) {
      // Parse the MOCK_SUMMARY into sections (## heading → content blocks)
      const mockSections: { heading: string; lines: string[] }[] = [];
      let current: { heading: string; lines: string[] } | null = null;
      for (const line of MOCK_SUMMARY.split("\n")) {
        if (line.startsWith("## ")) {
          if (current) mockSections.push(current);
          current = { heading: line.replace("## ", ""), lines: [] };
        } else if (current) {
          current.lines.push(line);
        }
      }
      if (current) mockSections.push(current);

      // Map template sections to mock content (round-robin if more template sections)
      const result: string[] = [];
      activeTemplate.sections.forEach((sec, idx) => {
        if (idx > 0) result.push("");
        result.push(`## ${sec.title}`);
        const source = mockSections[idx % mockSections.length];
        if (source) {
          result.push(...source.lines);
        } else {
          result.push("", `- AI-generated content for "${sec.title}" based on transcription.`);
        }
      });
      return result.join("\n");
    }

    return MOCK_SUMMARY;
  }, [previewDetailSegments, selectedJob?.source, selectedJob?.status, selectedRecord?.duration, activeTemplate]);

  // Build initial text map for edit history
  const initialTexts = useMemo(() => {
    const map: Record<number, string> = {};
    for (const seg of contentSegments) { map[seg.id] = seg.text; }
    return map;
  }, [contentSegments]);
  const segmentTimings = useMemo(() => {
    const base = contentSegments.map((segment, index) => {
      const start = timestampToSeconds(segment.timestamp);
      const next = contentSegments[index + 1];
      const nextStart = next ? timestampToSeconds(next.timestamp) : null;
      return {
        id: segment.id,
        start,
        end: nextStart ?? (videoDuration > 0 ? Math.max(videoDuration, start + 2) : start + 2),
      };
    });
    return base;
  }, [contentSegments, videoDuration]);

  const { texts, update, undo, redo, canUndo, canRedo, reset } = useEditHistory(initialTexts);
  const savedTextsRef = useRef(initialTexts);

  const originalTextsRef = useRef(initialTexts);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  function sameTexts(a: Record<number, string>, b: Record<number, string>) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if ((a[Number(key)] ?? "") !== (b[Number(key)] ?? "")) return false;
    }
    return true;
  }
  // Leaving without saving is only worth a question when there is something to lose,
  // and the way back is only offered while the transcript still differs from the text
  // that came out of the transcription.
  const hasUnsavedEdits = !sameTexts(texts, savedTextsRef.current);
  const differsFromOriginal = !sameTexts(texts, originalTextsRef.current);

  function handleToggleEdit() { savedTextsRef.current = { ...texts }; setEditMode(true); }
  function handleSave() { savedTextsRef.current = { ...texts }; setEditMode(false); toast.success("Transcript saved"); }
  function leaveEdit() { reset(savedTextsRef.current); setDiscardOpen(false); setEditMode(false); }
  function handleCancel() { if (hasUnsavedEdits) { setDiscardOpen(true); return; } leaveEdit(); }
  function handleResetToOriginal() {
    const original = { ...originalTextsRef.current };
    reset(original);
    savedTextsRef.current = original;
    setResetOpen(false);
    setEditMode(false);
    toast.success("Transcript restored to the original");
  }

  useEffect(() => {
    setTitle(recordTitle);
  }, [recordTitle]);

  useEffect(() => {
    if (!isJobTranscribing) return;
    if (activeTab === "transcript-translated" || activeTab === "summary-translated") {
      setActiveTab("transcript");
    }
  }, [activeTab, isJobTranscribing]);

  useEffect(() => {
    setRecordingDetailOpen(isLiveRecordingDetail);
    return () => {
      setRecordingDetailOpen(false);
    };
  }, [isLiveRecordingDetail, setRecordingDetailOpen]);

  useEffect(() => {
    if (!isLiveRecordingRoute) return;
    if (recordingPhase === "idle") {
      const latestMicJob = jobs.find((job) => job.source === "microphone");
      if (latestMicJob) {
        navigate(`/transcriptions/${latestMicJob.id}`, {
          replace: true,
          state: { record: mapJobToDetailRecord(latestMicJob), fromRecordingStop: true },
        });
        return;
      }
      navigate("/", { replace: true });
    }
  }, [isLiveRecordingRoute, jobs, navigate, recordingPhase]);

  useEffect(() => {
    if (!isLiveRecordingDetail) return;
    liveTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLiveRecordingDetail, liveTranscriptSegments, liveTranscriptInterim]);

  useEffect(() => {
    if (!isRightPanelResizing) return;

    function handleMouseMove(event: MouseEvent) {
      const rect = pageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextWidth = rect.right - event.clientX;
      const clamped = Math.min(520, Math.max(260, nextWidth));
      setRightPanelWidth(clamped);
    }

    function handleMouseUp() {
      setIsRightPanelResizing(false);
    }

    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isRightPanelResizing]);

  // Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    if (!editMode) return;
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editMode, undo, redo]);

  // Scroll to a segment and briefly highlight it
  function scrollToSegment(segmentId: number) {
    const el = segmentRefs.current[segmentId];
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); setHighlightedSegment(segmentId); setTimeout(() => setHighlightedSegment(null), 1500); }
  }

  // Seek player
  function seekTo(timestamp: string) {
    seekToSeconds(timestampToSeconds(timestamp));
  }

  const pageMeta = useMemo<PageHeaderMeta>(() => ({
    dateLabel: selectedRecord?.dateCreated ?? "Mar 24, 2026 · 10:30 AM",
    durationLabel: selectedRecord?.duration ?? "17 min",
    screenshotsCount: selectedRecord?.screenshots ?? 3,
  }), [selectedRecord]);
  const videoPreview = selectedRecord?.videoUrl
    ? { url: selectedRecord.videoUrl, poster: selectedRecord.thumbnail }
    : undefined;
  const hasVideo = Boolean(videoPreview);
  const fallbackDurationSeconds = 17 * 60 + 50;
  const effectiveDurationSeconds = hasVideo ? Math.max(1, videoDuration || 0) : fallbackDurationSeconds;
  const effectiveCurrentSeconds = hasVideo
    ? videoCurrentTime
    : (Math.max(0, Math.min(100, playerProgress[0] ?? 0)) / 100) * fallbackDurationSeconds;
  const isPlayerPlaying = hasVideo ? isVideoPlaying : isFallbackPlaying;

  const activePlaybackSegmentId = useMemo<number | null>(() => {
    const current = effectiveCurrentSeconds;
    if (current <= 0) return null;
    const currentSegment = segmentTimings.find((segment) => current >= segment.start && current < segment.end);
    if (currentSegment) return currentSegment.id;
    if (segmentTimings.length > 0 && current >= segmentTimings[segmentTimings.length - 1].start) {
      return segmentTimings[segmentTimings.length - 1].id;
    }
    return null;
  }, [effectiveCurrentSeconds, segmentTimings]);

  // Everything above the active line has already been spoken. Marking it lets
  // the eye find the live line on a transcript that runs for pages.
  const playedSegmentIds = useMemo<Set<number>>(() => {
    const ids = new Set<number>();
    if (activePlaybackSegmentId === null) return ids;
    for (const timing of segmentTimings) {
      if (timing.id === activePlaybackSegmentId) break;
      ids.add(timing.id);
    }
    return ids;
  }, [activePlaybackSegmentId, segmentTimings]);

  /* Which sentence of the active replica is being spoken. There are no word
     timings, so the replica time is shared out by sentence length: close
     enough to read along with, and it moves the way subtitles move. */
  const activeSentenceIndex = useMemo<number | null>(() => {
    if (activePlaybackSegmentId === null) return null;
    const timing = segmentTimings.find((t) => t.id === activePlaybackSegmentId);
    const segment = contentSegments.find((seg) => seg.id === activePlaybackSegmentId);
    if (!timing || !segment) return null;
    const parts = splitSentences(segment.text);
    if (parts.length <= 1) return 0;
    const span = Math.max(1, timing.end - timing.start);
    const ratio = Math.max(0, Math.min(0.999, (effectiveCurrentSeconds - timing.start) / span));
    const total = segment.text.length || 1;
    let seen = 0;
    for (let i = 0; i < parts.length; i++) {
      seen += parts[i].length;
      if (ratio < seen / total) return i;
    }
    return parts.length - 1;
  }, [activePlaybackSegmentId, segmentTimings, contentSegments, effectiveCurrentSeconds]);

  /* And one step finer for the word-by-word treatment: the same share-by-length
     trick, applied inside the sentence that is currently lit. */
  const activeWordIndex = useMemo<number | null>(() => {
    if (activePlaybackSegmentId === null || activeSentenceIndex === null) return null;
    const timing = segmentTimings.find((t) => t.id === activePlaybackSegmentId);
    const segment = contentSegments.find((seg) => seg.id === activePlaybackSegmentId);
    if (!timing || !segment) return null;
    const parts = splitSentences(segment.text);
    const sentence = parts[activeSentenceIndex] ?? "";
    if (!sentence) return null;
    const before = parts.slice(0, activeSentenceIndex).reduce((n, part) => n + part.length, 0);
    const total = segment.text.length || 1;
    const span = Math.max(1, timing.end - timing.start);
    const elapsed = Math.max(0, Math.min(1, (effectiveCurrentSeconds - timing.start) / span));
    const inside = (elapsed * total - before) / Math.max(1, sentence.length);
    const words = splitWords(sentence).filter((w) => w !== " ");
    if (words.length === 0) return null;
    const ratio = Math.max(0, Math.min(0.999, inside));
    return Math.min(words.length - 1, Math.floor(ratio * words.length));
  }, [
    activePlaybackSegmentId,
    activeSentenceIndex,
    segmentTimings,
    contentSegments,
    effectiveCurrentSeconds,
  ]);

  const handleVideoElementReady = useCallback((node: HTMLVideoElement | null) => {
    videoElementRef.current = node;
    if (!node) return;
    setVideoCurrentTime(node.currentTime || 0);
    setVideoDuration(Number.isFinite(node.duration) ? node.duration : 0);
    setVideoPlaybackRate(node.playbackRate || 1);
    setIsVideoPlaying(!node.paused && !node.ended);
  }, []);

  const seekToSeconds = useCallback((seconds: number) => {
    if (hasVideo && videoElementRef.current) {
      const node = videoElementRef.current;
      const knownDuration = Number.isFinite(node.duration) ? node.duration : videoDuration;
      const upperBound = knownDuration > 0 ? knownDuration : seconds;
      const clamped = Math.max(0, Math.min(upperBound, seconds));
      node.currentTime = clamped;
      setVideoCurrentTime(clamped);
      return;
    }

    const nextProgress = Math.max(0, Math.min(100, (seconds / fallbackDurationSeconds) * 100));
    setPlayerProgress([nextProgress]);
  }, [fallbackDurationSeconds, hasVideo, videoDuration]);

  const handlePlayerProgressChange = useCallback((value: number[]) => {
    const nextProgress = Math.max(0, Math.min(100, value[0] ?? 0));
    if (hasVideo) {
      const duration = videoDuration || (videoElementRef.current?.duration ?? 0);
      if (duration > 0) {
        seekToSeconds((nextProgress / 100) * duration);
        return;
      }
    }
    setPlayerProgress([nextProgress]);
  }, [hasVideo, seekToSeconds, videoDuration]);

  const handlePlayerPlayPause = useCallback(() => {
    if (hasVideo) {
      const node = videoElementRef.current;
      if (!node) return;
      if (node.paused || node.ended) {
        void node.play().catch(() => {
          toast.error("Unable to play video");
        });
      } else {
        node.pause();
      }
      return;
    }
    setIsFallbackPlaying((prev) => !prev);
  }, [hasVideo]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setVideoPlaybackRate(rate);
    const node = videoElementRef.current;
    if (node) node.playbackRate = rate;
  }, []);

  useEffect(() => {
    if (!hasVideo) return;
    const progress = videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0;
    setPlayerProgress([Math.max(0, Math.min(100, progress))]);
  }, [hasVideo, videoCurrentTime, videoDuration]);

  useEffect(() => {
    if (hasVideo || !isFallbackPlaying) return;
    const intervalId = window.setInterval(() => {
      setPlayerProgress((prev) => {
        const current = prev[0] ?? 0;
        const next = Math.min(100, current + (0.25 / fallbackDurationSeconds) * 100);
        if (next >= 100) setIsFallbackPlaying(false);
        return [next];
      });
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [fallbackDurationSeconds, hasVideo, isFallbackPlaying]);

  useEffect(() => {
    /* a note that was just written opens on what was written */
    setActiveTab(desktopShell && routeState?.fromRecordingStop ? "summary" : "transcript");
    setIsFallbackPlaying(false);
    setIsVideoPlaying(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setVideoPlaybackRate(1);
    setPlayerProgress(demoPlayheadProgress());
    lastAutoScrolledSegmentRef.current = null;
    setActiveTranslationLang(null);
    setSelectedTranslationLang("");
    setIsTranslationLoading(false);
    setTranslatedSegments({});
    setTranslatedSummary("");
    setTranslationSummaryStatus("idle");
    setTranslationTranscriptStatus("idle");
    setSummaryError(false);

    // Demo: force result-page states for design captures.
    const readFlag = (k: string) => { try { return window.localStorage.getItem(k); } catch { return null; } };

    // Summary generation: loading / error
    const sumFlag = readFlag("ttt_demo_summary");
    if (sumFlag === "loading") {
      setActiveTab("summary");
      setIsSummaryLoading(true);
      setSummaryStage("Generating sections");
    } else if (sumFlag === "error") {
      setActiveTab("summary");
      setSummaryError(true);
    }

    // Summary translation partial: summary loading / failed (transcript already translated)
    const flag = readFlag("ttt_demo_translate");
    if (flag === "loading" || flag === "error") {
      const lang = "es";
      setSelectedTranslationLang(lang);
      setActiveTranslationLang(lang);
      setTranslatedSegments(Object.fromEntries(MOCK_SEGMENTS.map((seg) => [seg.id, makeFallbackTranslation(seg.text, lang)])));
      setTranslationSummaryStatus(flag === "loading" ? "loading" : "error");
      setActiveTab("summary-translated");
    }

    if (flag === "done") {
      const lang = "ru";
      setSelectedTranslationLang(lang);
      setActiveTranslationLang(lang);
      setTranslatedSegments(RU_DEMO_SEGMENTS);
      setTranslatedSummary(RU_DEMO_SUMMARY);
      setTranslationTranscriptStatus("done");
      setTranslationSummaryStatus("done");
      setActiveTab("transcript-translated");
    }

    // Transcript translation: loading / error (in the translated transcript tab)
    const txFlag = readFlag("ttt_demo_translate_transcript");
    if (txFlag === "loading" || txFlag === "error") {
      const lang = "es";
      setSelectedTranslationLang(lang);
      setActiveTranslationLang(lang);
      setTranslationTranscriptStatus(txFlag === "loading" ? "loading" : "error");
      setActiveTab("transcript-translated");
    }
  }, [selectedRecord?.id]);

  useEffect(() => {
    if (!hasVideo || !activePlaybackSegmentId) return;
    if (activeTab !== "transcript" && activeTab !== "transcript-translated") return;
    if (lastAutoScrolledSegmentRef.current === activePlaybackSegmentId) return;
    const el = segmentRefs.current[activePlaybackSegmentId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    lastAutoScrolledSegmentRef.current = activePlaybackSegmentId;
  }, [activePlaybackSegmentId, activeTab, hasVideo]);

  const transcriptTranslationPayload = useMemo(() => (
    contentSegments.map((segment) => ({
      id: segment.id,
      speaker: segment.speaker.name,
      timestamp: segment.timestamp,
      text: texts[segment.id] ?? segment.text,
    }))
  ), [contentSegments, texts]);

  async function translateTranscriptBatch(targetLanguage: string) {
    const payload = {
      targetLanguage,
      contentType: "transcript",
      transcript: transcriptTranslationPayload,
      instructions: "Translate only transcript text fields. Do not translate speaker names, timestamps, ids, or UI labels.",
    };

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        const rows = Array.isArray(data?.transcript)
          ? data.transcript
          : Array.isArray(data?.segments)
            ? data.segments
            : Array.isArray(data?.items)
              ? data.items
              : null;

        if (rows) {
          const mapped = rows.reduce<Record<number, string>>((acc, row: unknown, idx: number) => {
            const typed = row as { id?: number; text?: string; translation?: string; translatedText?: string };
            const id = typeof typed?.id === "number" ? typed.id : transcriptTranslationPayload[idx]?.id;
            const translated = typed?.translatedText ?? typed?.translation ?? typed?.text;
            if (id !== undefined && typeof translated === "string" && translated.trim().length > 0) {
              acc[id] = translated;
            }
            return acc;
          }, {});
          if (Object.keys(mapped).length > 0) return mapped;
        }
      }
    } catch {
      // fallback below
    }

    return transcriptTranslationPayload.reduce<Record<number, string>>((acc, segment) => {
      acc[segment.id] = makeFallbackTranslation(segment.text, targetLanguage);
      return acc;
    }, {});
  }

  async function translateSummaryBatch(targetLanguage: string) {
    const payload = {
      targetLanguage,
      contentType: "summary",
      summary: contentSummary,
      instructions: "Translate summary text only and preserve markdown structure.",
    };

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        const translated = data?.translatedText ?? data?.summary ?? data?.text;
        if (typeof translated === "string" && translated.trim().length > 0) return translated;
      }
    } catch {
      // fallback below
    }

    return makeFallbackTranslation(contentSummary, targetLanguage);
  }

  async function handleTranslate(langOverride?: string) {
    const targetLang = langOverride ?? selectedTranslationLang;
    if (!targetLang || isTranslationLoading || isJobTranscribing) return;
    if (!langOverride && !canApplyTranslation) return;
    if (targetLang === activeTranslationLang) { setActiveTab("transcript-translated"); return; }
    if (langOverride && langOverride !== selectedTranslationLang) setSelectedTranslationLang(langOverride);
    setIsTranslationLoading(true);

    try {
      const [nextTranscript, nextSummary] = await Promise.all([
        translateTranscriptBatch(targetLang),
        translateSummaryBatch(targetLang),
      ]);

      setTranslatedSegments(nextTranscript);
      setTranslatedSummary(nextSummary);
      setTranslationSummaryStatus("done");
      setActiveTranslationLang(targetLang);
      setActiveTab("transcript-translated");
      toast.success(`Translated to ${targetLang.toUpperCase()}`);
    } finally {
      setIsTranslationLoading(false);
    }
  }

  function getTranscriptUrl() {
    const sharePath = id ? `/transcriptions/${id}` : window.location.pathname;
    return `${window.location.origin}${sharePath}`;
  }

  function buildTranscriptExportText() {
    const rows = contentSegments.map((segment) => {
      const segmentText = texts[segment.id] ?? segment.text;
      return `${segment.speaker.name} (${segment.timestamp}): ${segmentText}`;
    });
    return `${title}\n\n${rows.join("\n\n")}`;
  }

  function buildExportableRecord(): ExportableRecord {
    const speakerNames = Array.from(
      new Set(contentSegments.map((s) => s.speaker.name))
    );
    return {
      id: selectedRecord?.id ?? id ?? "current",
      title: title || selectedRecord?.name || "Transcript",
      summary: contentSummary || undefined,
      segments: contentSegments.map((segment) => ({
        speaker: segment.speaker.name,
        timestamp: segment.timestamp,
        text: texts[segment.id] ?? segment.text,
      })),
      metadata: {
        date: selectedRecord?.dateCreated,
        duration: selectedRecord?.duration,
        source: selectedRecord?.source,
        speakers: speakerNames,
        language: selectedRecord?.language,
      },
    };
  }

  async function shareTranscript() {
    const shareData = {
      title: title || "Transcript",
      text: title || "Transcript",
      url: getTranscriptUrl(),
    };

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        toast.success("Shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    navigator.clipboard.writeText(shareData.url);
    toast.success("Link copied");
  }

  function copyTranscriptLink() {
    navigator.clipboard.writeText(getTranscriptUrl());
    toast.success("Link copied");
  }

  function copySummary(lang?: string) {
    const translated = lang && lang === activeTranslationLang && translatedSummary;
    navigator.clipboard.writeText(translated ? translatedSummary : contentSummary);
    toast.success(translated ? "Translated summary copied" : "Summary copied");
  }

  function copyTranscript(lang?: string) {
    const translated = lang && lang === activeTranslationLang && Object.keys(translatedSegments).length > 0;
    const text = contentSegments
      .map((seg) => (translated ? translatedSegments[seg.id] ?? texts[seg.id] ?? seg.text : texts[seg.id] ?? seg.text))
      .join(String.fromCharCode(10, 10));
    navigator.clipboard.writeText(text);
    toast.success(translated ? "Translated transcript copied" : "Transcript copied");
  }

  /* What the Copy menu is allowed to offer. Built from the record itself, so a
     record with no translation still shows the two plain lines. */
  const copyMenu: CopyMenuModel = useMemo(() => {
    const activeLang = TRANSLATION_LANGUAGES.find((l) => l.code === activeTranslationLang) ?? null;
    const transcriptReady = !!activeLang && Object.keys(translatedSegments).length > 0;
    return {
      original: SOURCE_LANGUAGES[selectedRecord?.language ?? "en"] ?? { flag: "\u{1F310}", label: "Original" },
      translation: transcriptReady && activeLang ? { code: activeLang.code, flag: activeLang.flag, label: activeLang.label } : null,
      summaryTranslated: !!translatedSummary && translationSummaryStatus === "done",
      hasSummary: !!contentSummary,
    };
  }, [activeTranslationLang, translatedSegments, translatedSummary, translationSummaryStatus, contentSummary, selectedRecord?.language]);

  const [exportDialogOpen, setExportDialogOpen] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("export") === "1");
  const [copySheetOpen, setCopySheetOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  function exportTranscript() {
    setExportDialogOpen(true);
  }

  function moveToFolder(folderId: string) {
    if (!selectedRecord) {
      toast.error("No transcript selected");
      return;
    }
    assignToFolder([selectedRecord.id], folderId);
    const targetFolder = folders.find((folder) => folder.id === folderId);
    toast.success(`Moved to "${targetFolder?.name ?? "folder"}"`);
  }

  function createFolderAndMove() {
    if (!selectedRecord) {
      toast.error("No transcript selected");
      return;
    }

    const folderName = window.prompt("Folder name", "New Folder");
    if (!folderName?.trim()) return;
    const newFolder = addFolder(folderName.trim(), "#3B82F6");
    assignToFolder([selectedRecord.id], newFolder.id);
    toast.success(`Moved to "${newFolder.name}"`);
  }

  function rematchSpeakers() {
    toast.success("Speakers rematched");
  }

  function regenerateSummary() {
    setSummaryError(false);
    setActiveTab("summary");
    setIsSummaryLoading(true);
    setSummaryStage("Analyzing the transcript");
    setTimeout(() => setSummaryStage("Generating sections"), 1300);
    setTimeout(() => setSummaryStage("Polishing the summary"), 2600);
    setTimeout(() => {
      setIsSummaryLoading(false);
      toast.success("Summary regenerated");
    }, 3600);
  }

  function syncTextToAudio() {
    toast.success("Text synced to audio");
  }

  function deleteTranscript() {
    toast.success("Transcript moved to trash");
    navigate("/");
  }

  // Segment actions
  function toggleHighlight(segId: number) {
    setSegHighlights((prev) => { const next = new Set(prev); if (next.has(segId)) next.delete(segId); else next.add(segId); return next; });
  }
  function copySegmentText(segId: number) {
    const text = texts[segId] ?? contentSegments.find((s) => s.id === segId)?.text;
    if (text) {
      navigator.clipboard.writeText(text);
      toast("Text copied");
    }
  }
  function openComment(segId: number) {
    setCommentSegmentId(segId);
    setCommentText("");
  }
  function submitComment() {
    if (!commentText.trim() || commentSegmentId === null) return;
    const segment = contentSegments.find((s) => s.id === commentSegmentId);
    if (!segment) return;
    const nextComment: Comment = {
      id: `c-${Date.now()}`,
      segmentId: commentSegmentId,
      quote: (texts[commentSegmentId] ?? segment.text).slice(0, 140),
      timestamp: segment.timestamp,
      author: "You",
      avatarColor: "#64748b",
      avatarInitial: "Y",
      text: commentText.trim(),
      createdAt: "now",
      replies: [],
    };
    setComments((prev) => [nextComment, ...prev]);
    toast.success("Comment added");
    setCommentSegmentId(null);
    setCommentText("");
  }
  async function shareSegment(segId: number) {
    const segment = contentSegments.find((s) => s.id === segId);
    const text = texts[segId] ?? segment?.text;
    if (!segment || !text) return;

    const url = `${getTranscriptUrl()}#segment-${segId}`;
    const shareData = {
      title: title || "Transcript segment",
      text: `${segment.speaker.name} (${segment.timestamp}): ${text}`,
      url,
    };

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        toast.success("Shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    toast("Share text copied");
  }

  // Text selection for inline highlight
  useEffect(() => {
    function handler() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) { setSelectionPill(null); return; }
      const range = sel.getRangeAt(0);
      const container = range.startContainer.parentElement?.closest("[data-segment-id]");
      if (!container) { setSelectionPill(null); return; }
      const segId = Number(container.getAttribute("data-segment-id"));
      // Find text offset within the segment
      const pEl = container.querySelector("p");
      if (!pEl) { setSelectionPill(null); return; }
      const fullText = texts[segId] ?? contentSegments.find((s) => s.id === segId)?.text ?? "";
      const selectedText = sel.toString();
      const startIdx = fullText.indexOf(selectedText);
      if (startIdx === -1) { setSelectionPill(null); return; }
      const rect = range.getBoundingClientRect();
      setSelectionPill({ x: rect.left + rect.width / 2 - 30, y: rect.top, segmentId: segId, start: startIdx, end: startIdx + selectedText.length });
    }
    document.addEventListener("mouseup", handler);
    document.addEventListener("keyup", handler);
    return () => { document.removeEventListener("mouseup", handler); document.removeEventListener("keyup", handler); };
  }, [texts]);

  function handleSelectionHighlight() {
    if (!selectionPill) return;
    const { segmentId, start, end } = selectionPill;
    setTextHighlights((prev) => ({ ...prev, [segmentId]: [...(prev[segmentId] ?? []), { start, end }] }));
    setSelectionPill(null);
    window.getSelection()?.removeAllRanges();
  }

  const runGeneration = (selected: Template) => {
    setActiveTab("summary");
    setIsSummaryLoading(true);
    setSummaryStage("Analyzing the transcript");
    setTimeout(() => setSummaryStage("Generating sections"), 1300);
    setTimeout(() => setSummaryStage("Polishing the summary"), 2600);
    setTimeout(() => {
      setIsSummaryLoading(false);
      toast.success(`Template "${selected.name}" applied`);
    }, 3600);
  };
  /* Generate notes on the desktop shell: the recording ends and the note is
     written straight away, in the template chosen for the call or the first one */
  useEffect(() => {
    if (!desktopShell || !routeState?.fromRecordingStop || generatedRef.current || !templates.length || isJobTranscribing) return;
    generatedRef.current = true;
    const chosen = (activeTemplateId && templates.find((t) => t.id === activeTemplateId)) || templates[0];
    setActiveTemplateId(chosen.id);
    runGeneration(chosen);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopShell, routeState?.fromRecordingStop, templates.length, isJobTranscribing]);

  if (isLiveRecordingDetail) {
    const isPaused = recordingPhase === "paused";
    const hasTranscript = liveTranscriptSegments.length > 0 || liveTranscriptInterim.trim().length > 0;
    return (
      <div ref={pageRef} className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <div className={(desktopShell ? "" : "border-b border-border ") + "px-4 pt-6 pb-5 lg:px-8"}>
            <div className="flex h-7 items-center justify-between text-xs text-muted-foreground">
              <span>{desktopShell ? "Recording a call" : "My record"}</span>
              {desktopShell && (
                /* the window docks beside the call: notes on one half, the meeting on the other */
                <button type="button" onClick={() => { window.sessionStorage.setItem("ttt_demo_desk", "split"); navigate("/desk"); }} className="flex h-7 items-center gap-[6px] rounded-full border border-border px-[10px] text-[12px] font-medium text-foreground transition-colors hover:bg-muted" title="Put the notes beside the call">
                  <Icon icon={LayoutRightIcon} className="size-[13px]" strokeWidth={1.9} />
                  Side by side
                </button>
              )}
            </div>
            <h1 className="mt-1 text-[20px] leading-[26px] tracking-[-0.3px] font-semibold text-foreground lg:text-[30px] lg:leading-tight lg:tracking-[-0.02em]">
              {title || (desktopShell ? liveTitle : "Live note")}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="scale-[0.9]"><SourceIcon source="microphone" /></span>
                <span>{desktopShell ? (permDemo === "1" ? "Notetaker, nothing allowed yet" : permDemo === "mic" ? "Notetaker, microphone only" : "Notetaker") : "Microphone"}</span>
              </span>
              <span className="text-border">{"\u2022"}</span>
              <span>{isPaused ? "Paused - live transcript is on hold" : "Recording in real time"}</span>
              <span className="text-border">{"\u2022"}</span>
              <span>{new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              {desktopShell && (
                /* the folder is chosen while the call runs, in the same line as the rest of the record's facts */
                <>
                  <span className="text-border">{"\u2022"}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-full text-xs text-foreground transition-colors hover:text-primary">
                        <Icon icon={FolderOpen} className="size-[13px] text-muted-foreground" strokeWidth={1.7} />
                        {folders.find((f) => f.id === liveFolderId)?.name ?? "Choose a folder"}
                        <Icon icon={ArrowDown01Icon} className="size-[11px] text-muted-foreground" strokeWidth={2} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="z-[120] w-[220px]">
                      {folders.map((folder) => (
                        <DropdownMenuItem key={folder.id} className="gap-2" onClick={() => { setLiveFolderId(folder.id); window.sessionStorage.setItem("ttt_live_folder", folder.id); }}>
                          <span className="size-[10px] shrink-0 rounded-[3px]" style={{ background: folder.color }} />
                          <span className="truncate">{folder.name}</span>
                        </DropdownMenuItem>
                      ))}
                      {liveFolderId && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => { setLiveFolderId(null); window.sessionStorage.removeItem("ttt_live_folder"); }}>No folder</DropdownMenuItem></>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {desktopShell && (
            <Tabs value={liveTab} onValueChange={(v) => setLiveTab(v as "notes" | "transcript")} className="mt-2 lg:mt-4">
              <div className="flex items-end border-b border-border px-4 lg:px-8">
                <TabsList variant="line" className="border-b-0">
                  <TabsTrigger value="notes" variant="line" className="max-lg:text-[13px]">My thoughts</TabsTrigger>
                  <TabsTrigger value="transcript" variant="line" className="max-lg:text-[13px]">Transcript</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          )}

          <div className="flex-1 overflow-auto">
            {desktopShell && liveTab === "notes" ? (
              <div className="mx-auto flex min-h-full w-full max-w-[980px] flex-col px-4 py-6 lg:px-8">
                <NotesPad
                  lines={pad}
                  onChange={setPad}
                  templates={templates.map((t) => ({ id: t.id, name: t.name }))}
                  onTemplate={(tid) => { if (tid === "all") setTemplatePickerOpen(true); else { setActiveTemplateId(tid); const t = templates.find((x) => x.id === tid); if (t) toast(`"${t.name}" will shape the note`); } }}
                  autoFocus
                  hint={isPaused ? "Recording is paused. Your notes stay here." : "Everything said is being kept in the transcript beside this. Your own words stay exactly as you wrote them."}
                />
              <p className="sticky bottom-0 mt-auto w-full bg-background/95 py-[10px] text-center text-[12.5px] text-muted-foreground backdrop-blur-[2px]">My thoughts won't be included when you share this note.</p>
              </div>
            ) : (
            <div className="mx-auto w-full max-w-[980px] px-8 py-6">
              {desktopShell && permDemo && (
                /* the transcript is where the missing sound would have shown up, so the warning stands here too */
                <div className="mb-4 flex items-center gap-3 rounded-[14px] border border-warning/30 bg-warning/[0.07] px-4 py-3">
                  <Icon icon={Alert02Icon} className="size-[18px] shrink-0 text-warning" strokeWidth={2} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-foreground">{permDemo === "1" ? `Microphone and the call's sound aren't allowed on ${machine}` : `The call's sound isn't allowed on ${machine}`}</span>
                    <span className="block text-[12.5px] text-muted-foreground">{permDemo === "1" ? "Nothing is being transcribed until you allow them." : "Only your side is transcribed. The other side won't appear here."}</span>
                  </span>
                  <Button variant="warning" onClick={() => setPermDemo(null)} className="h-8 shrink-0 rounded-full px-[14px] text-[13px] font-semibold">{permDemo === "1" ? "Allow both" : "Allow system audio"}</Button>
                </div>
              )}
              {!hasTranscript && (
                <div className="mt-4 rounded-[16px] border border-dashed border-border bg-muted/20 px-6 py-8">
                  <p className="text-sm font-medium text-foreground">
                    {isPaused ? "Recording is paused." : "Listening... start speaking and the text will appear here live."}
                  </p>
                  {!isLiveTranscriptionSupported && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Real-time speech-to-text is not supported in this browser.
                    </p>
                  )}
                </div>
              )}

              {liveDetailSegments.map((segment, index) => (
                <TranscriptSegment
                  key={segment.id}
                  segment={segment}
                  nextTimestamp={liveDetailSegments[index + 1]?.timestamp}
                  isEditing={false}
                  highlighted={false}
                  isPlaybackActive={!isPaused && index === liveDetailSegments.length - 1}
                  segmentRef={(el) => { segmentRefs.current[segment.id] = el; }}
                  isSegHighlighted={false}
                  onToggleHighlight={() => {}}
                  onOpenComment={() => {}}
                  onShare={() => {}}
                  onCopyText={() => {}}
                  inlineComment={false}
                  onCommentSubmit={() => {}}
                  onCommentCancel={() => {}}
                  onCommentChange={() => {}}
                  commentValue=""
                  textHighlights={[]}
                  showActions={false}
                />
              ))}

              {liveTranscriptInterim.trim().length > 0 && (
                <div className="mx-[-8px] rounded-xl bg-primary/5 px-2 py-3 ring-1 ring-primary/20">
                  <div className="grid grid-cols-[minmax(160px,220px)_1fr] gap-4 max-md:grid-cols-1">
                    <div className="min-w-0 pt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">Y</div>
                        <span className="truncate text-sm font-medium text-foreground">You (speaking...)</span>
                      </div>
                    </div>
                    <div className="relative min-w-0 pl-5">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-primary/65" />
                      <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                        {liveTranscriptInterim}
                        <span className="ml-1 inline-block h-4 w-[2px] translate-y-[2px] animate-pulse bg-primary" />
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={liveTranscriptEndRef} />
            </div>
            )}
          </div>

          <LiveRecordingBar
            isPaused={isPaused}
            elapsedSeconds={recordingElapsed}
            onPauseResume={isPaused ? resumeInstantRecording : pauseInstantRecording}
            onStop={stopInstantRecording}
            generate={desktopShell}
            warning={desktopShell && permDemo ? {
              title: permDemo === "1" ? `Microphone and the call's sound aren't allowed on ${machine}` : `The call's sound isn't allowed on ${machine}`,
              body: permDemo === "1" ? "Nothing is being recorded until you allow them." : "Only your microphone is recorded, so the other side won't be in the transcript.",
              action: permDemo === "1" ? "Allow both" : "Allow system audio",
              onAllow: () => setPermDemo(null),
              mic: permDemo === "1",
              sys: true,
            } : undefined}
            microphoneDevices={microphoneDevices}
            selectedMicrophoneId={selectedMicrophoneId}
            onSwitchMicrophone={(deviceId) => { void switchRecordingMicrophone(deviceId); }}
            isSwitchingMicrophone={isSwitchingMicrophone}
          />
        </div>
      </div>
    );
  }

  /* a finished note is not a closed door: the next part of the same call goes
     into the same note, with the notes already written kept */
  const recIdx = records.findIndex((r) => r.id === id);

  const continueRecording = async () => {
    const ok = await startInstantRecording();
    if (!ok) { toast.error("Microphone access is required to start recording."); return; }
    window.sessionStorage.setItem("ttt_live_title", recordTitle);
    savePad("live", pad);
    navigate("/transcriptions/live", { state: { liveRecording: true } });
  };

  const handleTemplateSelect = (id: string | null) => {
    if (id === null) {
      if (activeTemplateId !== null) toast("Template removed");
      setActiveTemplateId(null);
      return;
    }
    setActiveTemplateId(id);
    const selected = templates.find((t) => t.id === id);
    if (selected) runGeneration(selected);
  };
  const barActiveTemplate = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) ?? null : null;
  const isTranscriptTab = activeTab === "transcript" || activeTab === "transcript-translated";
  const templateCta = barActiveTemplate ? (
    <Button variant="pill-outline" onClick={() => setTemplatePickerOpen(true)} className="flex-1 min-w-0 h-[46px] gap-1.5 px-3 justify-between text-[14px] font-medium">
      <span className="flex items-center gap-1.5 min-w-0">
        <Icon icon={Zap} className="size-[16px] text-muted-foreground shrink-0" strokeWidth={1.6} />
        <span className="truncate">{barActiveTemplate.name}</span>
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground"><path d="M6 9l6 6 6-6" /></svg>
    </Button>
  ) : (
    <Button onClick={() => setTemplatePickerOpen(true)} className="flex-1 min-w-0 h-[46px] text-[14px] font-semibold">
      Apply template
    </Button>
  );

  return (
    <div ref={pageRef} className="flex flex-1 overflow-hidden">
      {/* Left column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="max-md:hidden flex items-center justify-between gap-3 px-4 pt-4 lg:px-8">
          <div className="min-w-0">
            {(location.state as { from?: string } | null)?.from === "meetings" ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <button
                  type="button"
                  className="rounded-full px-1.5 py-0.5 transition-colors hover:bg-muted/45 hover:text-foreground max-lg:inline-flex max-lg:items-center max-lg:gap-1"
                  onClick={() => navigate("/", { state: { page: "calendar" } })}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 lg:hidden"><path d="M15 18l-6-6 6-6" /></svg>
                  Meetings
                </button>
                <span className="text-muted-foreground/50 max-lg:hidden">/</span>
                <span className="truncate text-xs text-muted-foreground max-lg:hidden">{title}</span>
              </div>
            ) : selectedFolder && !sharedOwner ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <button
                  type="button"
                  className="rounded-full px-1.5 py-0.5 transition-colors hover:bg-muted/45 hover:text-foreground max-lg:inline-flex max-lg:items-center max-lg:gap-1"
                  onClick={() => navigate("/")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 lg:hidden"><path d="M15 18l-6-6 6-6" /></svg>
                  My records
                </button>
                <span className="text-muted-foreground/50">/</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/45 px-2 py-0.5 text-xs text-foreground/80">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: selectedFolder.color }} />
                  <span>{selectedFolder.name}</span>
                </span>
                <span className="text-muted-foreground/50 max-lg:hidden">/</span>
                <span className="truncate text-xs text-muted-foreground max-lg:hidden">{title}</span>
              </div>
            ) : sharedOwner ? (
              /* The trail says where the record came from. A record somebody
                 shared did not come from your records, and pretending it did
                 sends the reader back to a list it is not in. */
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="rounded-full px-1.5 py-0.5">Shared with me</span>
                <span className="text-muted-foreground/50 max-lg:hidden">/</span>
                <span className="truncate text-xs text-muted-foreground max-lg:hidden">{title}</span>
              </div>
            ) : (
              <div className="flex h-7 items-center text-xs text-muted-foreground">My record</div>
            )}
          </div>
          {desktopShell && (
            /* leaf through the notes without going back to the list */
            <div className="ml-auto mr-1 max-lg:hidden flex items-center">
              <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground" aria-label="Previous note" disabled={recIdx === 0} onClick={() => navigate(`/transcriptions/${records[recIdx > 0 ? recIdx - 1 : 0].id}`)}><Icon icon={ArrowLeft01Icon} className="size-[16px]" strokeWidth={2} /></Button>
              <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground" aria-label="Next note" disabled={recIdx < 0 || recIdx >= records.length - 1} onClick={() => navigate(`/transcriptions/${records[recIdx + 1].id}`)}><Icon icon={ArrowRight01Icon} className="size-[16px]" strokeWidth={2} /></Button>
            </div>
          )}
          <div className={"max-lg:hidden h-8 items-center gap-1 rounded-[12px] border border-border/70 bg-muted/20 px-1 " + (sharedOwner ? "hidden" : "inline-flex")}>
            <Select
              value={selectedTranslationLang || undefined}
              onValueChange={setSelectedTranslationLang}
              disabled={isTranslationLoading || isJobTranscribing}
            >
              <SelectTrigger size="sm" className="h-8 w-[190px] rounded-[12px] border-none bg-transparent px-2.5 text-sm shadow-none focus-visible:ring-0">
                <SelectValue placeholder="Translate to..." />
              </SelectTrigger>
              <SelectContent align="end">
                {TRANSLATION_LANGUAGES.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <span className="inline-flex items-center gap-2">
                      <span>{language.flag}</span>
                      <span>{language.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div
              className={`overflow-hidden transition-all duration-200 ease-out ${
                showTranslateAction
                  ? "ml-1 max-w-[120px] opacity-100 translate-x-0"
                  : "ml-0 max-w-0 opacity-0 translate-x-1 pointer-events-none"
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 rounded-full px-3 text-sm transition-colors ${
                  canApplyTranslation
                    ? "font-medium text-primary hover:text-primary/90"
                    : "text-muted-foreground"
                }`}
                disabled={!canApplyTranslation}
                onClick={() => { void handleTranslate(); }}
              >
                {isTranslationLoading ? "Translating..." : isTranslationApplied ? "Translated" : "Translate"}
              </Button>
            </div>
          </div>
        </div>

        <PageHeader
          title={title}
          onTitleChange={setTitle}
          meta={pageMeta}
          source={selectedRecord?.source}
          folders={folders}
          shares={transcriptionShares}
          onShare={() => setShareDialogOpen(true)}
          onCopyLink={copyTranscriptLink}
          onCopySummary={copySummary}
          onCopyTranscript={copyTranscript}
          copyMenu={copyMenu}
          isTranscriptTab={activeTab === "transcript" || activeTab === "transcript-translated"}
          onOpenMore={() => setMoreSheetOpen(true)}
          hasSummary={activeTemplateId !== null}
          onSetTemplate={() => { setActiveTab("summary"); setTemplatePickerOpen(true); }}
          onMoveToFolder={moveToFolder}
          onCreateFolderAndMove={createFolderAndMove}
          onExport={exportTranscript}
          onRematchSpeakers={rematchSpeakers}
          onRegenerateSummary={regenerateSummary}
          onSyncTextToAudio={syncTextToAudio}
          onDelete={deleteTranscript}
          onTranslateTo={(code) => { void handleTranslate(code); }}
          activeTranslationLang={activeTranslationLang}
          translationDisabled={isTranslationLoading || isJobTranscribing}
        />
        {/* Translating somebody else's record is not one of the things a reader
            may do - the spec hides it, and the desktop row already did. */}
        {!isJobTranscribing && !sharedOwner && (
          <div className="md:hidden flex items-center gap-2 px-4 pt-3">
            <Button variant="pill-outline" onClick={() => setLangSheetOpen(true)} disabled={isTranslationLoading || isJobTranscribing} className="flex-1 h-9 gap-1.5 px-3 justify-between text-[13px] font-medium min-w-0">
              <span className="flex items-center gap-1.5 min-w-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[14px] text-muted-foreground shrink-0"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></svg>
                <span className="truncate">{activeTranslationMeta ? activeTranslationMeta.flag + " " + activeTranslationMeta.short : "Translate"}</span>
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground"><path d="M6 9l6 6 6-6" /></svg>
            </Button>
          </div>
        )}
        <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} records={[buildExportableRecord()]} availableRecords={demoRecords.map(recordRowToExportable)} />

        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          resourceType="transcription"
          resourceId={selectedRecord?.id ?? id ?? ""}
          resourceName={title}
        />

        <UpgradeGateModal open={limitedModalOpen} onOpenChange={setLimitedModalOpen} variant="done" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 lg:mt-8 flex flex-1 flex-col overflow-hidden">
          <div className="flex items-end justify-between border-b border-border px-4 lg:px-8 max-lg:overflow-x-auto">
            <TabsList variant="line" className="border-b-0 max-lg:shrink-0">
              {desktopShell && <TabsTrigger value="notes" variant="line" className="max-lg:text-[13px] md:max-lg:pb-4">My thoughts</TabsTrigger>}
              <TabsTrigger value="transcript" variant="line" className="max-lg:text-[13px] md:max-lg:pb-4">Transcript</TabsTrigger>
              <TabsTrigger value="summary" variant="line" className="max-lg:text-[13px] md:max-lg:pb-4">Summary</TabsTrigger>
              <TabsTrigger value="outline" variant="line" className="lg:hidden max-lg:text-[13px] md:max-lg:pb-4">Outline</TabsTrigger>
              <TabsTrigger value="comments" variant="line" className="lg:hidden max-lg:text-[13px] md:max-lg:pb-4">Comments</TabsTrigger>
              {activeTranslationMeta && !isJobTranscribing ? (
                <>
                  <TabsTrigger value="transcript-translated" variant="line" className="max-lg:text-[13px] md:max-lg:pb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{activeTranslationMeta.flag}</span>
                      <span>Transcript {activeTranslationMeta.short}</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="summary-translated" variant="line" className="max-lg:text-[13px] md:max-lg:pb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{activeTranslationMeta.flag}</span>
                      <span>Summary {activeTranslationMeta.short}</span>
                    </span>
                  </TabsTrigger>
                </>
              ) : null}
            </TabsList>

            {/* Right side of tab row: context-dependent */}
            <div className="mb-1 flex items-center gap-2 max-md:hidden md:max-lg:mb-2">
              <div className={"lg:hidden h-8 items-center gap-1 rounded-[12px] border border-border/70 bg-muted/20 px-1 " + (sharedOwner ? "hidden" : "inline-flex")}>
                <Select value={selectedTranslationLang || undefined} onValueChange={setSelectedTranslationLang} disabled={isTranslationLoading || isJobTranscribing}>
                  <SelectTrigger size="sm" className="h-8 w-[168px] rounded-[12px] border-none bg-transparent px-2.5 text-sm shadow-none focus-visible:ring-0">
                    <SelectValue placeholder="Translate to..." />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {TRANSLATION_LANGUAGES.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <span className="inline-flex items-center gap-2"><span>{language.flag}</span><span>{language.label}</span></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className={"overflow-hidden transition-all duration-200 ease-out " + (showTranslateAction ? "ml-1 max-w-[120px] opacity-100" : "ml-0 max-w-0 opacity-0 pointer-events-none")}>
                  <Button variant="ghost" size="sm" disabled={!canApplyTranslation} onClick={() => { void handleTranslate(); }} className={"h-8 rounded-full px-3 text-sm " + (canApplyTranslation ? "font-medium text-primary" : "text-muted-foreground")}>
                    {isTranslationLoading ? "Translating..." : isTranslationApplied ? "Translated" : "Translate"}
                  </Button>
                </div>
              </div>
              {isJobTranscribing ? null : activeTab === "transcript" ? (
                editMode ? (
                  <>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-9 rounded-full lg:size-7" disabled={!canUndo} onClick={undo}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg></Button></TooltipTrigger><TooltipContent>Undo</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-9 rounded-full lg:size-7" disabled={!canRedo} onClick={redo}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" /></svg></Button></TooltipTrigger><TooltipContent>Redo</TooltipContent></Tooltip>
                    {differsFromOriginal && (
                      <Button variant="ghost" size="sm" className="h-9 shrink-0 rounded-full px-3 text-[13px] text-muted-foreground lg:h-7 lg:px-2.5 lg:text-xs" onClick={() => setResetOpen(true)}>
                        <span className="lg:hidden">Reset</span>
                        <span className="max-lg:hidden">Reset to original</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 text-[13px] text-muted-foreground lg:h-7 lg:px-2.5 lg:text-xs" onClick={handleCancel}>Cancel</Button>
                    <Button size="sm" className="h-9 rounded-full px-4 text-[13px] lg:h-7 lg:px-3 lg:text-xs" onClick={handleSave}>Save</Button>
                  </>
                ) : (
                  sharedOwner ? null : (
                  <Button variant="ghost" size="sm" className="h-7 rounded-full gap-1.5 px-2.5 text-xs text-muted-foreground" onClick={handleToggleEdit}>
                    <Icon icon={Edit} className="size-3.5" strokeWidth={1.7} />
                    Edit transcript
                  </Button>
                  )
                )
              ) : (
                <div className="flex items-center gap-2">
                  {activeTab === "summary" && activeTemplateId && !isSummaryLoading && (
                    <>
                      <label className="hidden h-7 items-center gap-1.5 px-2 text-xs text-muted-foreground lg:flex">
                        <Icon icon={Search01Icon} className="size-[13px]" strokeWidth={2} />
                        <input value={summaryQuery} onChange={(e) => setSummaryQuery(e.target.value)} placeholder="Search the summary" className="w-[130px] bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
                      </label>
                    </>
                  )}
                <TemplateSelectorButton
                  activeTemplateId={activeTemplateId}
                  templates={templates}
                  open={templatePickerOpen}
                  onOpenChange={setTemplatePickerOpen}
                  onSelect={handleTemplateSelect}
                  onNavigateToTemplates={() => navigate("/")}
                />
                </div>
              )}
            </div>
          </div>
          {isTranslationLoading ? (
            <div className="h-[2px] w-full bg-primary/15">
              <div className="h-full w-full animate-pulse bg-primary" />
            </div>
          ) : null}

                    <TabsContent value="outline" className="lg:hidden flex-1 overflow-auto flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/5 animate-[pulse_3s_ease-in-out_infinite]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-primary"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">Outline</h3>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
            <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-muted-foreground">Auto-generated chapters and a jump-to-section outline are on the way.</p>
          </TabsContent>
          <TabsContent value="comments" className="lg:hidden flex-1 overflow-auto flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/5 animate-[pulse_3s_ease-in-out_infinite]">
              <MessageSquarePlus className="size-6 text-primary" strokeWidth={1.6} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">Comments</h3>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
            <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-muted-foreground">Time-stamped comments and team discussion will live here soon.</p>
          </TabsContent>
          {desktopShell && (
            <TabsContent value="notes" className="flex-1 overflow-auto">
              <div className="mx-auto flex min-h-full w-full max-w-[980px] flex-col px-4 py-6 lg:px-8">
                <NotesPad
                  lines={pad}
                  onChange={setPad}
                  templates={templates.map((t) => ({ id: t.id, name: t.name }))}
                  onTemplate={(tid) => { if (tid === "all") setTemplatePickerOpen(true); else handleTemplateSelect(tid); }}
                  hint="Your own notes from the call. Nothing here is rewritten."
                />
              <p className="sticky bottom-0 mt-auto w-full bg-background/95 py-[10px] text-center text-[12.5px] text-muted-foreground backdrop-blur-[2px]">My thoughts won't be included when you share this note.</p>
              </div>
            </TabsContent>
          )}
          <TabsContent value="transcript" className="flex-1 overflow-auto relative">
            {isJobTranscribing ? (
              <TranscribingState phase={selectedJob?.status === "uploading" ? "uploading" : "processing"} progress={selectedJob?.progress ?? 0} />
            ) : (
              <div className="animate-in fade-in duration-300 px-4 pb-4 lg:px-8">
                <div className="relative">
                {limitedFreeSegments.map((seg, index) => {
                  // The last free turn is the one dissolving under the fade. At that
                  // point it is decoration, so it takes no hover, clicks or selection.
                  const isFadingOut = limitedActive && index === limitedFreeSegments.length - 1;
                  const segmentNode = (
                  <TranscriptSegment
                    key={seg.id}
                    segment={seg}
                    nextTimestamp={displaySegments[index + 1]?.timestamp}
                    hideSpeaker={isSingleSpeaker}
                    hideTimecodes={forcePlainMono && !editMode}
                    onSeekTimecode={editMode ? undefined : seekTo}
                    isEditing={editMode}
                    editText={texts[seg.id]}
                    onEditChange={(t) => update(seg.id, t)}
                    highlighted={highlightedSegment === seg.id}
                    isPlaybackActive={activePlaybackSegmentId === seg.id}
                    isPlayed={playedSegmentIds.has(seg.id)}
                    activeSentence={activePlaybackSegmentId === seg.id ? activeSentenceIndex : null}
                    activeWord={activePlaybackSegmentId === seg.id ? activeWordIndex : null}
                    segmentRef={(el) => { segmentRefs.current[seg.id] = el; }}
                    isSegHighlighted={segHighlights.has(seg.id)}
                    onToggleHighlight={toggleHighlight}
                    onOpenComment={openComment}
                    onShare={(id) => { void shareSegment(id); }}
                    onCopyText={copySegmentText}
                    inlineComment={commentSegmentId === seg.id}
                    onCommentSubmit={submitComment}
                    onCommentCancel={() => setCommentSegmentId(null)}
                    onCommentChange={setCommentText}
                    commentValue={commentText}
                    textHighlights={textHighlights[seg.id] ?? []}
                  />
                  );
                  return isFadingOut ? (
                    <div key={`fading-${seg.id}`} className="pointer-events-none select-none">
                      {segmentNode}
                    </div>
                  ) : (
                    segmentNode
                  );
                })}
                {limitedActive ? (
                  <div className="pointer-events-none absolute -inset-x-2 bottom-0 h-[248px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgb(255,255,255)_47%,rgb(255,255,255))]" />
                ) : null}
                </div>
                {limitedActive ? (
                  <div className="relative z-10 -mt-[62px] md:-mt-[117px]">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card px-[14px] py-[11px] text-left shadow-md md:px-8 md:py-5 md:text-center">
                        {/* A phone screen is mostly transcript, and the card was
                            taking a third of it. Here the lock, the line and the
                            button share one row; from md up the original card
                            comes back unchanged. */}
                        <div className="flex items-center gap-[10px] md:block">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 md:mx-auto md:size-10">
                            <Icon icon={SquareLock01Icon} size={15} strokeWidth={1.8} className="text-primary md:hidden" />
                            <Icon icon={SquareLock01Icon} size={18} strokeWidth={1.8} className="hidden text-primary md:block" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[13px] font-semibold leading-[17px] text-foreground md:mt-3.5 md:text-[16px] md:leading-normal">
                              <span className="md:hidden">The rest is locked</span>
                              <span className="hidden md:inline">The rest of this transcript is locked</span>
                            </h3>
                            <p className="mt-[3px] text-[11.5px] leading-[15px] text-muted-foreground md:hidden">First 10 minutes are free.</p>
                            <p className="mx-auto mt-1.5 hidden max-w-[400px] text-[13px] leading-relaxed text-muted-foreground md:block">
                              You are hearing the first 10 minutes. Unlock the full 43 minute transcript, the AI summary and every export format.
                            </p>
                          </div>
                          <Button className="h-[30px] shrink-0 px-[13px] text-[12.5px] md:mt-4 md:h-10 md:px-6 md:text-[14px]" onClick={() => navigate("/checkout")}>
                            <span className="md:hidden">Unlock</span>
                            <span className="hidden md:inline">Unlock full access</span>
                          </Button>
                        </div>
                        <p className="mt-2.5 hidden text-[12px] text-muted-foreground md:block">Free plan includes the first 10 minutes of every file.</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="flex-1 overflow-auto">
            {isJobTranscribing ? (
              <TranscribingState phase={selectedJob?.status === "uploading" ? "uploading" : "processing"} progress={selectedJob?.progress ?? 0} />
            ) : isSummaryLoading ? (
              <SummaryGeneratingState stage={summaryStage} />
            ) : summaryError ? (
              <SummaryErrorState onRegenerate={regenerateSummary} />
            ) : activeTemplateId === null ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                  <Icon icon={Zap} className="size-6 text-primary" strokeWidth={1.6} />
                </div>
                <h3 className="text-[16px] font-semibold text-foreground">No summary yet</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-1.5 max-w-[360px]">
                  Pick a template and we will turn this transcript into a structured summary.
                </p>
                <Button className="rounded-full h-9 px-5 text-[13px] font-medium mt-5" onClick={() => setTemplatePickerOpen(true)}>
                  Apply template
                </Button>
              </div>
            ) : (
              <SummaryTab summaryText={contentSummary} template={activeTemplate} highlight={summaryQuery} />
            )}
          </TabsContent>
          {(activeTranslationMeta || translationTranscriptStatus === "loading" || translationTranscriptStatus === "error") && !isJobTranscribing ? (
            <TabsContent value="transcript-translated" className="flex flex-1 flex-col overflow-auto relative">
              {translationTranscriptStatus === "loading" ? (
                <TranslatingState what="transcript" />
              ) : translationTranscriptStatus === "error" ? (
                <TranslationErrorState
                  onRetry={() => { void handleTranslate(); }}
                  title="Couldn't translate the transcript"
                  body="Something went wrong while translating. Your original transcript is still available on the Transcript tab."
                />
              ) : (
              <div className="px-4 pb-4 lg:px-8">
                {displaySegments.map((seg, index) => (
                  <TranscriptSegment
                    key={`${seg.id}-translated`}
                    segment={seg}
                    nextTimestamp={displaySegments[index + 1]?.timestamp}
                    hideSpeaker={isSingleSpeaker}
                    onSeekTimecode={seekTo}
                    isEditing={false}
                    editText={translatedSegments[seg.id] ?? (texts[seg.id] ?? seg.text)}
                    highlighted={highlightedSegment === seg.id}
                    isPlaybackActive={activePlaybackSegmentId === seg.id}
                    isPlayed={playedSegmentIds.has(seg.id)}
                    activeSentence={activePlaybackSegmentId === seg.id ? activeSentenceIndex : null}
                    activeWord={activePlaybackSegmentId === seg.id ? activeWordIndex : null}
                    segmentRef={(el) => { segmentRefs.current[seg.id] = el; }}
                    isSegHighlighted={false}
                    onToggleHighlight={() => {}}
                    onOpenComment={() => {}}
                    onShare={() => {}}
                    onCopyText={() => {}}
                    inlineComment={false}
                    onCommentSubmit={() => {}}
                    onCommentCancel={() => {}}
                    onCommentChange={() => {}}
                    commentValue=""
                    textHighlights={[]}
                  />
                ))}
                <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  Translated with AI · Accuracy may vary for proper nouns and technical terms
                </p>
              </div>
              )}
            </TabsContent>
          ) : null}
          {activeTranslationMeta && !isJobTranscribing ? (
            <TabsContent value="summary-translated" className="flex flex-1 flex-col overflow-auto">
              {translationSummaryStatus === "loading" ? (
                <TranslatingState what="summary" />
              ) : translationSummaryStatus === "error" ? (
                <TranslationErrorState onRetry={() => { void handleTranslate(); }} />
              ) : (
                <SummaryTab summaryText={translatedSummary || contentSummary} template={activeTemplate} highlight={summaryQuery} />
              )}
            </TabsContent>
          ) : null}
        </Tabs>

        <Drawer open={copySheetOpen} onOpenChange={setCopySheetOpen}>
          <DrawerContent className="md:hidden [&>div:first-child]:hidden">
            <DrawerHeader className="pb-1 flex-row items-center justify-between text-left"><DrawerTitle>Copy</DrawerTitle><button type="button" onClick={() => setCopySheetOpen(false)} aria-label="Close" className="size-8 shrink-0 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-muted/60"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button></DrawerHeader>
            <div className="px-1 pb-[calc(16px+env(safe-area-inset-bottom))] flex flex-col gap-0.5">
              {copyMenu.translation ? (
                <>
                  <p className="px-3 pt-1.5 pb-1 text-[12.5px] font-medium text-muted-foreground">Transcript</p>
                  <button type="button" className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] active:bg-muted/60" onClick={() => { copyTranscript(); setCopySheetOpen(false); }}>
                    <span className="w-[18px] text-center text-[16px] leading-none">{copyMenu.original.flag}</span> {copyMenu.original.label}
                  </button>
                  <button type="button" className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] active:bg-muted/60" onClick={() => { copyTranscript(copyMenu.translation.code); setCopySheetOpen(false); }}>
                    <span className="w-[18px] text-center text-[16px] leading-none">{copyMenu.translation.flag}</span> {copyMenu.translation.label}
                  </button>
                  {copyMenu.hasSummary && (
                    <>
                      <p className="px-3 pt-3 pb-1 text-[12.5px] font-medium text-muted-foreground">Summary</p>
                      <button type="button" className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] active:bg-muted/60" onClick={() => { copySummary(); setCopySheetOpen(false); }}>
                        <span className="w-[18px] text-center text-[16px] leading-none">{copyMenu.original.flag}</span> {copyMenu.original.label}
                      </button>
                      {copyMenu.summaryTranslated && (
                        <button type="button" className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] active:bg-muted/60" onClick={() => { copySummary(copyMenu.translation.code); setCopySheetOpen(false); }}>
                          <span className="w-[18px] text-center text-[16px] leading-none">{copyMenu.translation.flag}</span> {copyMenu.translation.label}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {copyMenu.hasSummary && (
                    <button type="button" className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] active:bg-muted/60" onClick={() => { copySummary(); setCopySheetOpen(false); }}>
                      <Icon icon={Copy} className="size-[18px] text-muted-foreground" strokeWidth={1.6} /> Copy summary
                    </button>
                  )}
                  <button type="button" className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] active:bg-muted/60" onClick={() => { copyTranscript(); setCopySheetOpen(false); }}>
                    <Icon icon={Copy} className="size-[18px] text-muted-foreground" strokeWidth={1.6} /> Copy transcript
                  </button>
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>
        {/* The record's own actions, in the sheet every object in the product
            opens: the record at the top with its name and where it came from,
            then one plain list. */}
        <ActionSheet
          open={moreSheetOpen && belowLg}
          onOpenChange={setMoreSheetOpen}
          mark={selectedRecord?.source ? <SourceIcon source={selectedRecord.source} /> : null}
          title={title}
          kind={getSourceLabel(selectedRecord?.source)}
        >
          {!sharedOwner && (
            <ActionSheetItem icon={Share} label="Share" onClick={() => { setMoreSheetOpen(false); setShareDialogOpen(true); }} />
          )}
          {!sharedOwner && (
            <ActionSheetItem icon={Edit} label="Edit transcript" onClick={() => { setMoreSheetOpen(false); if (activeTab !== "transcript") setActiveTab("transcript"); handleToggleEdit(); }} />
          )}
          <ActionSheetItem icon={Link} label="Copy link" onClick={() => { copyTranscriptLink(); setMoreSheetOpen(false); }} />
          {/* Regenerating and deleting change the owner's copy, so a reader of
              somebody else's record does not get them - the same line the
              desktop menu already draws. */}
          {!sharedOwner && (
            <ActionSheetItem icon={Zap} label="Regenerate summary" onClick={() => { setMoreSheetOpen(false); regenerateSummary(); }} />
          )}
          <ActionSheetItem icon={FolderOpen} label="Move to folder" onClick={() => { setMoreSheetOpen(false); setMoveDialogOpen(true); }} />
          {/* Leaving the object comes last, wherever the sheet is opened. */}
          {sharedOwner ? (
            <ActionSheetItem icon={Cancel01Icon} label="Remove from Shared" onClick={() => setMoreSheetOpen(false)} />
          ) : (
            <ActionSheetItem icon={Trash} label="Delete" destructive onClick={() => { setMoreSheetOpen(false); deleteTranscript(); }} />
          )}
        </ActionSheet>
        <TemplateSheet open={templatePickerOpen && belowMd} onOpenChange={setTemplatePickerOpen} value={activeTemplateId} onSelect={handleTemplateSelect} />
        <LanguageSheet open={langSheetOpen && belowLg} onOpenChange={setLangSheetOpen} languages={TRANSLATION_LANGUAGES} activeLang={activeTranslationLang} disabled={isTranslationLoading || isJobTranscribing} onPick={(code) => { void handleTranslate(code); }} />
        <MoveToFolderDialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} count={1} onMove={(id) => moveToFolder(id)} onCreateFolder={() => { setMoveDialogOpen(false); createFolderAndMove(); }} folders={folders} />

        <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
          <AlertDialogContent className="max-w-[420px] rounded-[18px] max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:w-full max-md:max-w-none! max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-[22px] max-md:p-[20px]">
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle className="text-[17px] font-bold tracking-tight">Leave without saving?</AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-[13px] leading-[1.55]">The edits you made to this transcript will be lost.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-2">
              <AlertDialogCancel className="h-9 px-4 text-[13px] font-medium">Keep editing</AlertDialogCancel>
              <AlertDialogAction onClick={leaveEdit} className="h-9 bg-destructive px-5 text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90">Discard</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogContent className="max-w-[420px] rounded-[18px] max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:w-full max-md:max-w-none! max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-[22px] max-md:p-[20px]">
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle className="text-[17px] font-bold tracking-tight">Restore the original transcript?</AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-[13px] leading-[1.55]">Every edit goes away, including the ones you already saved. You get back the text exactly as the transcription produced it.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-2">
              <AlertDialogCancel className="h-9 px-4 text-[13px] font-medium">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetToOriginal} className="h-9 bg-destructive px-5 text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90">Restore original</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isJobTranscribing ? null : (<>
          <MediaPlayer
            duration={`${Math.floor(Math.max(0, effectiveDurationSeconds) / 60)}:${String(Math.floor(Math.max(0, effectiveDurationSeconds)) % 60).padStart(2, "0")}`}
            progress={playerProgress}
            onProgressChange={handlePlayerProgressChange}
            isPlaying={isPlayerPlaying}
            onPlayPause={handlePlayerPlayPause}
            speed={hasVideo ? videoPlaybackRate : 1}
            onSpeedChange={handlePlaybackRateChange}
            currentTimeSeconds={effectiveCurrentSeconds}
            durationSeconds={effectiveDurationSeconds}
            trailing={desktopShell ? (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full border-border px-3 text-[13px] font-medium" onClick={() => { void continueRecording(); }} title="Record more into this note">
                <Icon icon={Mic01Icon} className="size-[14px]" strokeWidth={2} />
                Resume recording
              </Button>
            ) : undefined}
          />
        </>)}
        {/* Mobile bottom action bar: Copy + Export + More (md:hidden) */}
        {!isJobTranscribing && (
          <div className="md:hidden shrink-0 border-t border-border bg-background px-4 pt-[10px] pb-[calc(12px+env(safe-area-inset-bottom))]">
            {editMode ? (
              <div className="flex flex-col gap-3.5">
                {differsFromOriginal && (
                  <div className="flex items-center justify-between gap-3">
                    {/* The reset sits on the left, over undo and redo. Right-aligned it
                        stood directly above Save, and a thumb reaching for it landed on
                        the one button that must not be pressed by accident. The padding
                        gives it a tap area without making the strip any taller. */}
                    <button type="button" className="-my-2 shrink-0 py-2 text-[13px] font-medium text-primary" onClick={() => setResetOpen(true)}>Reset to original</button>
                    <span className="text-[13px] text-muted-foreground">{hasUnsavedEdits ? "Unsaved changes" : "Edited"}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="size-[46px] rounded-full shrink-0" disabled={!canUndo} onClick={undo} aria-label="Undo"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg></Button>
                <Button variant="ghost" size="icon" className="size-[46px] rounded-full shrink-0" disabled={!canRedo} onClick={redo} aria-label="Redo"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" /></svg></Button>
                <Button variant="pill-outline" className="flex-1 h-[46px]" onClick={handleCancel}>Cancel</Button>
                <Button className="flex-1 h-[46px] font-semibold" onClick={handleSave}>Save</Button>
                </div>
              </div>
            ) : (
              /* One rule for every phone action bar in the product: the
                 secondary actions read first, the one blue action sits at the
                 right edge under the thumb. The template screen already read
                 this way, the record screen did not. */
              <div className="flex items-center gap-2">
                <Button variant="pill-outline" size="icon" className="size-[46px] shrink-0" onClick={() => setCopySheetOpen(true)} aria-label="Copy">
                  <Icon icon={Copy} className="size-[18px]" strokeWidth={1.7} />
                </Button>
                <Button variant="pill-outline" size="icon" className="size-[46px] shrink-0" onClick={exportTranscript} aria-label="Export">
                  <Icon icon={Upload} className="size-[18px]" strokeWidth={1.7} />
                </Button>
                <Button variant="pill-outline" size="icon" className="size-[46px] shrink-0" onClick={() => setMoreSheetOpen(true)} aria-label="More actions">
                  <Icon icon={MoreHorizontal} className="size-[18px]" strokeWidth={2} />
                </Button>
                {templateCta}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel */}
      {isJobTranscribing ? (
        <div className="relative hidden shrink-0 flex-col items-center justify-center border-l border-border bg-background px-6 text-center lg:flex" style={{ width: rightPanelWidth }}>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/5">
            <MessageSquarePlus className="size-5 text-primary/70" strokeWidth={1.7} />
          </span>
          <p className="mt-3 text-[13px] font-medium text-foreground">Outline & comments</p>
          <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">Coming soon</span>
          <p className="mt-2 max-w-[210px] text-[12px] leading-relaxed text-muted-foreground">We're still building these - they'll show up here in a future update.</p>
        </div>
      ) : (
        <RightPanel
          onSeek={seekTo}
          onScrollToSegment={scrollToSegment}
          comments={comments}
          videoPreview={videoPreview}
          videoPlaybackRate={videoPlaybackRate}
          onVideoElementReady={handleVideoElementReady}
          onVideoPlayStateChange={setIsVideoPlaying}
          onVideoTimeChange={setVideoCurrentTime}
          onVideoDurationChange={(seconds) => setVideoDuration(Number.isFinite(seconds) ? seconds : 0)}
          onVideoPlaybackRateChange={setVideoPlaybackRate}
          width={rightPanelWidth}
          onResizeStart={() => setIsRightPanelResizing(true)}
        />
      )}

      {/* Text selection highlight pill */}
      {selectionPill && !editMode && (
        <SelectionHighlightPill position={{ x: selectionPill.x, y: selectionPill.y }} onHighlight={handleSelectionHighlight} />
      )}
    </div>
  );
}


