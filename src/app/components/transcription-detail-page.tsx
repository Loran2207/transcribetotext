import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Copy as CopyLucide, MessageSquarePlus, PenLine, Share2 } from "lucide-react";
import { FolderOpen, MoreHorizontal, Share, Trash, Upload, User, Zap, Mic, Link, Edit, Copy } from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";
import { useUserProfile } from "./user-profile-context";
import { useFolders } from "./folder-context";
import { useStarred } from "./starred-context";
import { SourceIcon, type SourceType } from "./source-icons";
import { records, type RecordRow } from "./records-table";
import { Icon } from "./ui/icon";
import { Skeleton } from "./ui/skeleton";
import { useTranscriptionModals, type TranscriptionJob } from "./transcription-modals";
import { useTemplates } from "@/hooks/use-templates";
import type { Template } from "@/lib/templates";
import { ShareDialog } from "./share-dialog";

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

function timestampToSeconds(timestamp: string) {
  const parts = timestamp.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).reduce((acc, value) => acc * 60 + value, 0) + parts[parts.length - 1];
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
    duration: isDone ? (job.duration ?? "\u2014") : isError ? "Failed" : "In progress",
    dateCreated: dateParts.dateCreated,
    dateGroup: dateParts.dateGroup,
    template: job.langBilingual && job.langBilingual.length > 1 ? "1 by 1" : "Summary",
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
  { id: 1, speaker: SPEAKERS[0], timestamp: "0:01", text: "Good morning everyone. Let's get started with the weekly sync. I wanted to cover three main topics today \u2014 the product roadmap update, the Q2 planning timeline, and a quick review of the design handoff process." },
  { id: 2, speaker: SPEAKERS[1], timestamp: "0:32", text: "Sounds good. Before we dive in, I just want to flag that the design team finished the new onboarding flow mockups yesterday. I'll share the Figma link in Slack after this call." },
  { id: 3, speaker: SPEAKERS[2], timestamp: "0:58", text: "Great, that's actually related to what I wanted to bring up. The engineering team has been waiting on those mockups to start the sprint planning for next week. We'll need to review them by Thursday at the latest." },
  { id: 4, speaker: SPEAKERS[0], timestamp: "1:24", text: "Perfect. Let's make sure we schedule a quick design review session tomorrow or Wednesday. Maria, can you coordinate that with the design leads?" },
  { id: 5, speaker: SPEAKERS[1], timestamp: "1:45", text: "Absolutely. I'll set something up for Wednesday morning. That gives us a day to incorporate any feedback before James's team picks it up on Thursday." },
  { id: 6, speaker: SPEAKERS[2], timestamp: "2:10", text: "Works for me. On the roadmap side, we're about 80% through the current milestone. The remaining items are mostly backend API work and some performance optimizations. I don't see any blockers at this point." },
  { id: 7, speaker: SPEAKERS[0], timestamp: "2:42", text: "That's encouraging. Let's keep the momentum going. Any questions or concerns before we move on to Q2 planning?" },
  { id: 8, speaker: SPEAKERS[1], timestamp: "3:05", text: "One thing \u2014 we should probably discuss the user research findings from last week. Some of the feedback might influence the Q2 priorities, especially around the notification system." },
  { id: 9, speaker: SPEAKERS[2], timestamp: "3:28", text: "Agreed. The data shows that about 40% of users are finding the current notification settings confusing. That's a significant usability issue we should address sooner rather than later." },
  { id: 10, speaker: SPEAKERS[0], timestamp: "3:55", text: "Good point. Let's add that to the Q2 discussion. I'll create a separate agenda item for the next planning meeting. Anything else?" },
  { id: 11, speaker: SPEAKERS[1], timestamp: "4:18", text: "Nothing from my side. I think we're in good shape overall." },
  { id: 12, speaker: SPEAKERS[2], timestamp: "4:30", text: "Same here. Let's wrap up and get back to work. Thanks everyone." },
];

const MOCK_OUTLINE: OutlineSection[] = [
  { id: "o1", title: "Opening & Agenda", timestamp: "0:01", segmentId: 1, bullets: [{ text: "Three topics: roadmap update, Q2 planning, design handoff", segmentId: 1 }, { text: "Design team completed onboarding flow mockups", segmentId: 2 }] },
  { id: "o2", title: "Design Handoff & Sprint Planning", timestamp: "0:58", segmentId: 3, bullets: [{ text: "Engineering waiting on mockups for sprint planning", segmentId: 3 }, { text: "Design review session planned for Wednesday", segmentId: 4 }, { text: "Feedback integration before Thursday sprint start", segmentId: 5 }] },
  { id: "o3", title: "Product Roadmap Status", timestamp: "2:10", segmentId: 6, bullets: [{ text: "80% through current milestone, no blockers", segmentId: 6 }, { text: "Remaining: backend API work + performance optimizations", segmentId: 6 }] },
  { id: "o4", title: "Q2 Planning & User Research", timestamp: "3:05", segmentId: 8, bullets: [{ text: "User research: 40% find notification settings confusing", segmentId: 9 }, { text: "Notification UX to be added to Q2 priorities", segmentId: 10 }] },
  { id: "o5", title: "Wrap-up", timestamp: "4:18", segmentId: 11, bullets: [{ text: "No further concerns raised", segmentId: 11 }] },
];

const MOCK_COMMENTS: Comment[] = [
  { id: "c1", segmentId: 3, quote: "The engineering team has been waiting on those mockups...", timestamp: "0:58", author: "Alex Johnson", avatarColor: "#3b82f6", avatarInitial: "A", text: "We should track this dependency more formally going forward.", createdAt: "2h ago", replies: [{ id: "r1", author: "James Chen", avatarColor: "#10b981", avatarInitial: "J", text: "Agreed \u2014 I'll add it to our sprint retro.", createdAt: "1h ago" }] },
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
}: {
  segment: Segment;
  nextTimestamp?: string;
  isEditing: boolean;
  editText?: string;
  onEditChange?: (text: string) => void;
  highlighted: boolean;
  isPlaybackActive: boolean;
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
}) {
  const segmentText = editText ?? segment.text;
  const segmentEndTimestamp = nextTimestamp ?? segment.timestamp;
  const lineTone = highlighted
    ? "bg-primary/35"
    : isSegHighlighted
      ? "bg-amber-300/80"
      : isPlaybackActive
        ? "bg-primary/65"
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
      className={`group/seg relative -mx-2 grid grid-cols-[minmax(160px,220px)_1fr] gap-4 rounded-xl px-2 py-4 transition-colors duration-200 max-md:grid-cols-1 max-md:gap-2 ${
        highlighted
          ? "bg-primary/8"
          : isSegHighlighted
            ? "bg-amber-50"
            : isPlaybackActive
              ? "bg-primary/6 ring-1 ring-primary/20"
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

      <div className="relative min-w-0 pl-5 pr-28 max-md:pr-16">
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full transition-colors ${lineTone}`} />
        <span className="text-xs text-muted-foreground tabular-nums">{segment.timestamp}</span>

        {isEditing ? (
          <textarea
            value={segmentText}
            onChange={(e) => onEditChange?.(e.target.value)}
            className="mt-1 w-full resize-none rounded-md border border-border bg-muted/30 px-2 py-1.5 text-sm leading-relaxed text-foreground/90 outline-none focus:border-primary/50 focus:bg-background"
            rows={Math.max(2, Math.ceil(segmentText.length / 90))}
          />
        ) : (
          <p className={`mt-1 text-sm leading-relaxed cursor-text ${isPlaybackActive ? "text-foreground" : "text-foreground/85"}`}>
            {renderText(segmentText)}
          </p>
        )}
        <span className="mt-2 block text-xs text-muted-foreground tabular-nums">{segmentEndTimestamp}</span>

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

function SummaryTab({ summaryText, template }: { summaryText: string; template?: Template | null }) {
  // If a template is selected, use its sections for headings with icons
  const sectionIcons: Record<string, string | undefined> = {};
  if (template?.sections) {
    for (const sec of template.sections) {
      sectionIcons[sec.title] = sec.iconId;
    }
  }

  return (
    <div className="px-8 py-6">
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
                  <span><strong className="font-medium text-foreground">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}</span>
                </div>
              );
            }
          }
          if (line.startsWith("- ")) {
            return <div key={i} className="flex gap-2 py-1 pl-4 text-sm text-foreground/90"><span className="shrink-0 text-muted-foreground">{"\u2022"}</span><span>{line.replace("- ", "")}</span></div>;
          }
          if (line.trim() === "") return <div key={i} className="h-2" />;
          return <p key={i} className="text-sm text-foreground/90">{line}</p>;
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
}: {
  activeTemplateId: string | null;
  templates: Template[];
  onSelect: (id: string) => void;
  onNavigateToTemplates: () => void;
}) {
  const active = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) : null;
  const builtIn = templates.filter((t) => t.type === "built_in");
  const custom = templates.filter((t) => t.type === "custom");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 rounded-full gap-1.5 px-2.5 text-xs text-muted-foreground">
          Template: <span className="text-foreground font-medium">{active?.name ?? "None"}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">Workspace templates</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-5 rounded-full text-muted-foreground" onClick={onNavigateToTemplates}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage templates</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <DropdownMenuSeparator />
        {builtIn.length > 0 && (
          <div className="px-2 py-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Built-in</span>
          </div>
        )}
        {builtIn.map((t) => (
          <DropdownMenuItem
            key={t.id}
            disabled={t.is_locked}
            onClick={() => {
              if (t.is_locked) {
                toast("Upgrade to Pro to use this template");
              } else {
                onSelect(t.id);
              }
            }}
            className="flex items-center justify-between"
          >
            <span className={t.is_locked ? "text-muted-foreground" : ""}>
              {t.name}
              {t.is_locked && <span className="ml-1.5">{"\u{1F512}"}</span>}
            </span>
            {t.id === activeTemplateId && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12" /></svg>
            )}
          </DropdownMenuItem>
        ))}
        {custom.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">My templates</span>
            </div>
            {custom.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="flex items-center justify-between"
              >
                <span>{t.name}</span>
                {t.id === activeTemplateId && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ════════════════════════════════════════════════════════════
// Right Panel — Outline Tab
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
// Right Panel — Comments Tab
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
  return (
    <div className="relative flex shrink-0 flex-col border-l border-border bg-background" style={{ width }}>
      <button
        type="button"
        aria-label="Resize right panel"
        className="absolute -left-1 top-0 z-30 h-full w-2 cursor-col-resize bg-transparent hover:bg-primary/10"
        onMouseDown={(e) => {
          e.preventDefault();
          onResizeStart();
        }}
      />
      {videoPreview ? (
        <VideoPreview
          video={videoPreview}
          playbackRate={videoPlaybackRate}
          onVideoElementReady={onVideoElementReady}
          onPlayStateChange={onVideoPlayStateChange}
          onTimeChange={onVideoTimeChange}
          onDurationChange={onVideoDurationChange}
          onPlaybackRateChange={onVideoPlaybackRateChange}
        />
      ) : null}
      <Tabs defaultValue="outline" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 pt-3 pb-0">
          <TabsList variant="line" className="border-b-0">
            <TabsTrigger value="outline" variant="line">Outline</TabsTrigger>
            <TabsTrigger value="comments" variant="line">
              Comments
              <span className="opacity-50 font-[inherit]">{comments.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="outline" className="flex-1 overflow-hidden">
          <OutlineTab onSeek={onSeek} onScrollToSegment={onScrollToSegment} />
        </TabsContent>
        <TabsContent value="comments" className="flex-1 overflow-hidden">
          <CommentsTab comments={comments} onSeek={onSeek} onScrollToSegment={onScrollToSegment} />
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
}) {
  const totalSeconds = Math.max(1, durationSeconds);
  const currentSeconds = Math.round(Math.max(0, currentTimeSeconds));

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="shrink-0 border-t border-border bg-background px-6 py-3">
      <Slider value={progress} onValueChange={onProgressChange} max={100} step={0.1} className="mb-3 [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-2" />
      <div className="flex items-center justify-between">
        <span className="min-w-[50px] text-xs tabular-nums text-muted-foreground">{formatTime(currentSeconds)}</span>
        <div className="flex items-center gap-1.5">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="ml-0.5 h-7 rounded-full px-2.5 text-xs font-medium border-border">{speed}x</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[80px]">{[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => <DropdownMenuItem key={rate} onClick={() => onSpeedChange(rate)}>{rate}x</DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="min-w-[50px] text-right text-xs tabular-nums text-muted-foreground">{duration}</span>
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

function LiveRecordingBar({
  isPaused,
  elapsedSeconds,
  onPauseResume,
  onStop,
  microphoneDevices,
  selectedMicrophoneId,
  onSwitchMicrophone,
  isSwitchingMicrophone,
}: {
  isPaused: boolean;
  elapsedSeconds: number;
  onPauseResume: () => void;
  onStop: () => void;
  microphoneDevices: { id: string; label: string }[];
  selectedMicrophoneId: string;
  onSwitchMicrophone: (deviceId: string) => void;
  isSwitchingMicrophone: boolean;
}) {
  const selectedMic = microphoneDevices.find((device) => device.id === selectedMicrophoneId);
  const triggerLabel = isSwitchingMicrophone
    ? "Switching microphone..."
    : (selectedMic?.label || (microphoneDevices.length ? "Select microphone" : "No microphone detected"));

  return (
    <div className="shrink-0 border-t border-border bg-background/95 px-6 py-3 backdrop-blur-[2px]">
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
          <span className="hidden text-xs text-muted-foreground md:inline">
            {isPaused ? "Recording on hold" : "Live transcript is running"}
          </span>
        </div>

        <div className="order-3 md:order-2 flex items-center justify-center gap-2">
          <Button
            variant="pill-outline"
            className="h-9 rounded-full px-3 gap-1.5"
            onClick={onPauseResume}
            title={isPaused ? "Resume recording" : "Pause recording"}
          >
            {isPaused
              ? <svg className="size-[14px] text-foreground" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
              : <svg className="size-[14px] text-foreground" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            }
            <span className="text-[13px] font-medium text-foreground">{isPaused ? "Resume" : "Pause"}</span>
          </Button>
          <Button
            variant="destructive"
            className="h-9 rounded-full px-3 gap-1.5"
            onClick={onStop}
            title="Stop recording"
          >
            <svg className="size-[12px] text-white" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="10" height="10" rx="2" /></svg>
            <span className="text-[13px] font-semibold text-white">Stop</span>
          </Button>
        </div>

        <div className="order-2 md:order-3 md:justify-self-end w-full md:w-auto md:min-w-[260px] md:max-w-[320px]">
          <Select
            value={selectedMicrophoneId || undefined}
            onValueChange={onSwitchMicrophone}
            disabled={!microphoneDevices.length || isSwitchingMicrophone}
          >
            <SelectTrigger className="h-[36px] w-full rounded-[12px] border-input bg-transparent px-[12px] gap-[8px]">
              <span className="flex min-w-0 items-center gap-[8px]">
                <SourceIcon source="microphone" />
                <span className="truncate text-[13px] text-foreground">{triggerLabel}</span>
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

function getSourceLabel(source: SourceType | undefined) {
  if (!source) return "Source";
  if (source === "google-meet") return "Google Meet";
  if (source === "google-sheets") return "Google Sheets";
  if (source === "microphone") return "Microphone";
  return source.toUpperCase().replace("-", " ");
}

interface PageHeaderProps {
  title: string;
  onTitleChange: (t: string) => void;
  meta: PageHeaderMeta;
  source?: SourceType;
  folders: PageHeaderFolderOption[];
  onShare: () => void;
  onCopyLink: () => void;
  onCopySummary: () => void;
  onMoveToFolder: (folderId: string) => void;
  onCreateFolderAndMove: () => void;
  onExport: () => void;
  onRematchSpeakers: () => void;
  onRegenerateSummary: () => void;
  onSyncTextToAudio: () => void;
  onDelete: () => void;
}

function PageHeader({
  title,
  onTitleChange,
  meta,
  source,
  folders,
  onShare,
  onCopyLink,
  onCopySummary,
  onMoveToFolder,
  onCreateFolderAndMove,
  onExport,
  onRematchSpeakers,
  onRegenerateSummary,
  onSyncTextToAudio,
  onDelete,
}: PageHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { displayName, avatarSrc } = useUserProfile();

  useEffect(() => {
    if (editingTitle && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editingTitle]);

  return (
    <div className="px-8 pt-6 pb-0">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div
          className={`min-w-0 flex-1 rounded-xl py-2 pr-2 pl-0 transition-colors ${
            editingTitle ? "bg-muted/55" : "cursor-text hover:bg-muted/45"
          }`}
          onClick={() => { if (!editingTitle) setEditingTitle(true); }}
        >
          {editingTitle ? (
            <Input ref={inputRef} value={title} onChange={(e) => onTitleChange(e.target.value)} onBlur={() => setEditingTitle(false)} onKeyDown={(e) => { if (e.key === "Enter") setEditingTitle(false); }} className="h-auto border-none bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0" style={{ fontSize: "24px", lineHeight: "1.3" }} />
          ) : (
            <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button size="sm" className="h-8 rounded-full gap-2 px-4 text-sm" onClick={onShare}>
            <Icon icon={Share} className="size-4" strokeWidth={1.7} />
            Share
          </Button>
          <Button variant="pill-outline" className="flex items-center gap-[6px] h-9 px-[14px] transition-colors cursor-pointer" onClick={onCopySummary}>
            <Icon icon={Copy} className="size-[14px] text-foreground" strokeWidth={1.5} />
            <span className="font-medium text-[13px] text-foreground">Copy summary</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onCopyLink} aria-label="Copy link">
                <Icon icon={Link} className="size-4 text-muted-foreground" strokeWidth={1.8} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Icon icon={MoreHorizontal} className="size-4 text-muted-foreground" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[120] w-[230px]">
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
              <DropdownMenuItem className="gap-2" onClick={onExport}>
                <Icon icon={Upload} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onClick={onRematchSpeakers}>
                <Icon icon={User} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                Rematch speakers
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={onRegenerateSummary}>
                <Icon icon={Zap} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                Regenerate summary
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={onSyncTextToAudio}>
                <Icon icon={Mic} className="size-4 text-muted-foreground" strokeWidth={1.6} />
                Sync text to audio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="gap-2" onClick={onDelete}>
                <Icon icon={Trash} className="size-4" strokeWidth={1.6} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Avatar className="size-5"><AvatarImage src={avatarSrc} alt={displayName} /><AvatarFallback className="text-[10px]">{displayName.charAt(0)}</AvatarFallback></Avatar>
          <span>{displayName}</span>
        </div>
        {source && (
          <>
            <span className="text-border">{"\u2022"}</span>
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
        <span className="text-border">{"\u2022"}</span>
        <span>{meta.screenshotsCount} {meta.screenshotsCount === 1 ? "screenshot" : "screenshots"}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Main Page Component
// ════════════════════════════════════════════════════════════

export function TranscriptionDetailPage() {
  const navigate = useNavigate();
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

  const fallbackTitle = isLiveRecordingRoute ? "Live note" : "Weekly Team Sync \u2014 Product & Engineering";
  const recordTitle = selectedRecord ? getName(selectedRecord.id, selectedRecord.name) : fallbackTitle;
  const selectedFolder = useMemo(() => {
    if (!selectedRecord) return null;
    const folderId = folderAssignments[selectedRecord.id];
    if (!folderId) return null;
    return folders.find((folder) => folder.id === folderId) ?? null;
  }, [selectedRecord, folderAssignments, folders]);
  const [title, setTitle] = useState(recordTitle);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("transcript");
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);
  const [playerProgress, setPlayerProgress] = useState([0]);
  const [isFallbackPlaying, setIsFallbackPlaying] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(1);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const { templates } = useTemplates();
  const [selectedTranslationLang, setSelectedTranslationLang] = useState("");
  const [activeTranslationLang, setActiveTranslationLang] = useState<string | null>(null);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [translatedSegments, setTranslatedSegments] = useState<Record<number, string>>({});
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isRightPanelResizing, setIsRightPanelResizing] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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
  const contentSegments = useMemo<Segment[]>(
    () => (selectedJob?.source === "microphone" && previewDetailSegments.length > 0 ? previewDetailSegments : MOCK_SEGMENTS),
    [previewDetailSegments, selectedJob?.source],
  );
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

  function handleToggleEdit() { savedTextsRef.current = { ...texts }; setEditMode(true); }
  function handleSave() { savedTextsRef.current = { ...texts }; setEditMode(false); console.log("Saved transcript texts:", texts); toast.success("Transcript saved"); }
  function handleCancel() { reset(savedTextsRef.current); setEditMode(false); }

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
    if (!hasVideo) return null;
    const current = videoCurrentTime;
    const currentSegment = segmentTimings.find((segment) => current >= segment.start && current < segment.end);
    if (currentSegment) return currentSegment.id;
    if (segmentTimings.length > 0 && current >= segmentTimings[segmentTimings.length - 1].start) {
      return segmentTimings[segmentTimings.length - 1].id;
    }
    return null;
  }, [hasVideo, videoCurrentTime, segmentTimings]);

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
    setActiveTab("transcript");
    setIsFallbackPlaying(false);
    setIsVideoPlaying(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setVideoPlaybackRate(1);
    setPlayerProgress([0]);
    lastAutoScrolledSegmentRef.current = null;
    setActiveTranslationLang(null);
    setSelectedTranslationLang("");
    setIsTranslationLoading(false);
    setTranslatedSegments({});
    setTranslatedSummary("");
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

  async function handleTranslate() {
    if (!canApplyTranslation) return;
    setIsTranslationLoading(true);

    try {
      const [nextTranscript, nextSummary] = await Promise.all([
        translateTranscriptBatch(selectedTranslationLang),
        translateSummaryBatch(selectedTranslationLang),
      ]);

      setTranslatedSegments(nextTranscript);
      setTranslatedSummary(nextSummary);
      setActiveTranslationLang(selectedTranslationLang);
      setActiveTab("transcript-translated");
      toast.success(`Translated to ${selectedTranslationLang.toUpperCase()}`);
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

  function copySummary() {
    navigator.clipboard.writeText(contentSummary);
    toast.success("Summary copied");
  }

  function exportTranscript() {
    const blob = new Blob([buildTranscriptExportText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileBaseName = (title || selectedRecord?.name || "transcript")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "transcript";
    link.href = url;
    link.download = `${fileBaseName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported");
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
    toast.success("Summary regenerated");
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

  if (isLiveRecordingDetail) {
    const isPaused = recordingPhase === "paused";
    const hasTranscript = liveTranscriptSegments.length > 0 || liveTranscriptInterim.trim().length > 0;
    return (
      <div ref={pageRef} className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <div className="border-b border-border px-8 pt-6 pb-5">
            <div className="flex h-7 items-center text-xs text-muted-foreground">My record</div>
            <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
              {title || "Live note"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="scale-[0.9]"><SourceIcon source="microphone" /></span>
                <span>Microphone</span>
              </span>
              <span className="text-border">{"\u2022"}</span>
              <span>{isPaused ? "Paused — live transcript is on hold" : "Recording in real time"}</span>
              <span className="text-border">{"\u2022"}</span>
              <span>{new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[980px] px-8 py-6">
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
          </div>

          <LiveRecordingBar
            isPaused={isPaused}
            elapsedSeconds={recordingElapsed}
            onPauseResume={isPaused ? resumeInstantRecording : pauseInstantRecording}
            onStop={stopInstantRecording}
            microphoneDevices={microphoneDevices}
            selectedMicrophoneId={selectedMicrophoneId}
            onSwitchMicrophone={(deviceId) => { void switchRecordingMicrophone(deviceId); }}
            isSwitchingMicrophone={isSwitchingMicrophone}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-1 overflow-hidden">
      {/* Left column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="flex items-center justify-between gap-3 px-8 pt-4">
          <div className="min-w-0">
            {selectedFolder ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <button
                  type="button"
                  className="rounded-full px-1.5 py-0.5 transition-colors hover:bg-muted/45 hover:text-foreground"
                  onClick={() => navigate("/")}
                >
                  My records
                </button>
                <span className="text-muted-foreground/50">/</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/45 px-2 py-0.5 text-xs text-foreground/80">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: selectedFolder.color }} />
                  <span>{selectedFolder.name}</span>
                </span>
                <span className="text-muted-foreground/50">/</span>
                <span className="truncate text-xs text-muted-foreground">{title}</span>
              </div>
            ) : (
              <div className="flex h-7 items-center text-xs text-muted-foreground">My record</div>
            )}
          </div>
          <div className="inline-flex h-8 items-center gap-1 rounded-[12px] border border-border/70 bg-muted/20 px-1">
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
          onShare={() => setShareDialogOpen(true)}
          onCopyLink={copyTranscriptLink}
          onCopySummary={copySummary}
          onMoveToFolder={moveToFolder}
          onCreateFolderAndMove={createFolderAndMove}
          onExport={exportTranscript}
          onRematchSpeakers={rematchSpeakers}
          onRegenerateSummary={regenerateSummary}
          onSyncTextToAudio={syncTextToAudio}
          onDelete={deleteTranscript}
        />

        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          resourceType="transcription"
          resourceId={selectedRecord?.id ?? id ?? ""}
          resourceName={title}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-8">
            <TabsList variant="line" className="border-b-0">
              <TabsTrigger value="transcript" variant="line">Transcript</TabsTrigger>
              <TabsTrigger value="summary" variant="line">Summary</TabsTrigger>
              {activeTranslationMeta && !isJobTranscribing ? (
                <>
                  <TabsTrigger value="transcript-translated" variant="line">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{activeTranslationMeta.flag}</span>
                      <span>Transcript {activeTranslationMeta.short}</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="summary-translated" variant="line">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{activeTranslationMeta.flag}</span>
                      <span>Summary {activeTranslationMeta.short}</span>
                    </span>
                  </TabsTrigger>
                </>
              ) : null}
            </TabsList>

            {/* Right side of tab row: context-dependent */}
            <div className="flex items-center gap-2">
              {isJobTranscribing ? (
                <div className="inline-flex h-7 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 text-xs text-primary">
                  <span className="relative flex size-[6px]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/45" />
                    <span className="relative inline-flex size-[6px] rounded-full bg-primary" />
                  </span>
                  <span className="font-medium">
                    {selectedJob?.status === "uploading" ? "Uploading audio..." : "Transcribing..."} {selectedJob?.progress ?? 0}%
                  </span>
                </div>
              ) : activeTab === "transcript" ? (
                editMode ? (
                  <>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7 rounded-full" disabled={!canUndo} onClick={undo}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg></Button></TooltipTrigger><TooltipContent>Undo</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7 rounded-full" disabled={!canRedo} onClick={redo}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" /></svg></Button></TooltipTrigger><TooltipContent>Redo</TooltipContent></Tooltip>
                    <Button variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-xs text-muted-foreground" onClick={handleCancel}>Cancel</Button>
                    <Button size="sm" className="h-7 rounded-full px-3 text-xs" onClick={handleSave}>Save</Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 rounded-full gap-1.5 px-2.5 text-xs text-muted-foreground" onClick={handleToggleEdit}>
                    <Icon icon={Edit} className="size-3.5" strokeWidth={1.7} />
                    Edit transcript
                  </Button>
                )
              ) : (
                <TemplateSelectorButton
                  activeTemplateId={activeTemplateId}
                  templates={templates}
                  onSelect={(id) => {
                    const wasSame = activeTemplateId === id;
                    if (wasSame) {
                      setActiveTemplateId(null);
                      toast("Template removed");
                      return;
                    }
                    setActiveTemplateId(id);
                    const selected = templates.find((t) => t.id === id);
                    if (selected) {
                      setIsSummaryLoading(true);
                      setTimeout(() => {
                        setIsSummaryLoading(false);
                        toast.success(`Template "${selected.name}" applied`);
                      }, 800);
                    }
                  }}
                  onNavigateToTemplates={() => navigate("/")}
                />
              )}
            </div>
          </div>
          {isTranslationLoading ? (
            <div className="h-[2px] w-full bg-primary/15">
              <div className="h-full w-full animate-pulse bg-primary" />
            </div>
          ) : null}

          <TabsContent value="transcript" className="flex-1 overflow-auto relative">
            {isJobTranscribing ? (
              <div className="animate-in fade-in duration-300 px-8 pb-6 pt-2">
                {previewDetailSegments.map((seg, index) => (
                  <TranscriptSegment
                    key={`preview-${seg.id}`}
                    segment={seg}
                    nextTimestamp={previewDetailSegments[index + 1]?.timestamp}
                    isEditing={false}
                    highlighted={false}
                    isPlaybackActive={false}
                    segmentRef={() => {}}
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

                <div className="mt-3 rounded-[14px] border border-border/70 bg-muted/25 px-4 py-4">
                  <div className="mb-2 h-3 w-[180px] animate-pulse rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3 w-[92%] animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-[84%] animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-[76%] animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300 px-8 pb-4">
                {contentSegments.map((seg, index) => (
                  <TranscriptSegment
                    key={seg.id}
                    segment={seg}
                    nextTimestamp={contentSegments[index + 1]?.timestamp}
                    isEditing={editMode}
                    editText={texts[seg.id]}
                    onEditChange={(t) => update(seg.id, t)}
                    highlighted={highlightedSegment === seg.id}
                    isPlaybackActive={activePlaybackSegmentId === seg.id}
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
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="flex-1 overflow-auto">
            {isJobTranscribing || isSummaryLoading ? (
              <div className="animate-in fade-in duration-300 px-8 py-6">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-5 w-36 mt-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                {isJobTranscribing && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Summary is being generated and will appear automatically.
                  </p>
                )}
              </div>
            ) : (
              <SummaryTab summaryText={contentSummary} template={activeTemplate} />
            )}
          </TabsContent>
          {activeTranslationMeta && !isJobTranscribing ? (
            <TabsContent value="transcript-translated" className="flex-1 overflow-auto relative">
              <div className="px-8 pb-4">
                {contentSegments.map((seg, index) => (
                  <TranscriptSegment
                    key={`${seg.id}-translated`}
                    segment={seg}
                    nextTimestamp={contentSegments[index + 1]?.timestamp}
                    isEditing={false}
                    editText={translatedSegments[seg.id] ?? (texts[seg.id] ?? seg.text)}
                    highlighted={highlightedSegment === seg.id}
                    isPlaybackActive={activePlaybackSegmentId === seg.id}
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
            </TabsContent>
          ) : null}
          {activeTranslationMeta && !isJobTranscribing ? (
            <TabsContent value="summary-translated" className="flex-1 overflow-auto">
              <SummaryTab summaryText={translatedSummary || contentSummary} template={activeTemplate} />
            </TabsContent>
          ) : null}
        </Tabs>

        {isJobTranscribing ? (
          <div className="shrink-0 border-t border-border bg-background px-6 py-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedJob?.status === "uploading" ? "Uploading audio" : "Transcribing audio"}</span>
              <span className="tabular-nums">{selectedJob?.progress ?? 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${selectedJob?.progress ?? 0}%` }}
              />
            </div>
          </div>
        ) : (
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
          />
        )}
      </div>

      {/* Right panel */}
      {isJobTranscribing ? (
        <div className="relative flex shrink-0 flex-col border-l border-border bg-background" style={{ width: rightPanelWidth }}>
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">AI processing</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Outline and comments will appear after transcription is completed.
            </p>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="h-3 w-[78%] animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-[92%] animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-[68%] animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-[88%] animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-[62%] animate-pulse rounded-full bg-muted" />
          </div>
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


