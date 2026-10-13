import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useReducedMotion } from "motion/react";
import { Alert02Icon, AiMagicIcon, ArrowUpRight01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { SourceIcon, getSourceLabel, type SourceType } from "./source-icons";
import { Textarea } from "./ui/textarea";
import { TemplatePicker } from "./template-picker";
import { useTemplates } from "@/hooks/use-templates";
import { templateEmoji } from "@/lib/template-meta";
import { useTranscriptionModals, type TranscriptionJob } from "./transcription-modals";
import { TranscriptSegment, type Segment } from "./transcription-detail-page";
import { liveSpeaker, fmtLiveClock, BOT_LOBBY_LIMIT_SECONDS, type LiveSegment } from "@/lib/live-meeting-demo";

/* The page a bot-recorded meeting opens on the moment the bot is sent, and
   keeps until the meeting ends; then the record page takes over with its own
   transcribing screen. The same shell as a finished
   record (top row, title, chips, tabs), so nothing moves when the meeting
   ends; only the middle changes with the bot's state:

     connecting  the door: joining the link, then waiting to be let in
     recording   the words, one line at a time, typed out as they come
     error       the bot was not let in: say which way, and hand over
                 the way out

   No Pause and no microphone here: a bot cannot be paused, and it hears the
   call, not this computer (Andrei, 12.10). */

type LiveTab = "notes" | "transcript" | "summary";

export function MeetingLivePage({ job }: { job: TranscriptionJob }) {
  const navigate = useNavigate();
  const { stopMeetingBot, cancelMeetingBot, reconnectBot } = useTranscriptionModals();
  const [tab, setTab] = useState<LiveTab>("transcript");
  const [stopOpen, setStopOpen] = useState(false);
  /* notes are a plain field: typed during the call, kept per meeting, used by the summary. No slash menu, no formatting (Kirill, 12.10) */
  const notesKey = "ttt_live_notes:" + job.id;
  const [notes, setNotes] = useState<string>(() => { try { return window.localStorage.getItem(notesKey) ?? ""; } catch { return ""; } });
  useEffect(() => { try { window.localStorage.setItem(notesKey, notes); } catch { /* ignore */ } }, [notes, notesKey]);

  const isConnecting = job.status === "connecting";
  const isRecording = job.status === "recording";
  const isError = job.status === "error";
  const segments = job.liveSegments ?? [];
  const now = useClock(isConnecting || isRecording);
  const elapsed = job.startedAt ? Math.max(0, Math.round((now - new Date(job.startedAt).getTime()) / 1000)) : 0;
  const platform = getSourceLabel(job.source ?? "google-meet");
  const botName = job.botName ?? "TranscribeToText Bot";

  const statusLine = isConnecting
    ? (job.botPhase === "waiting" ? "Waiting at the door" : "The bot is joining")
    : isRecording ? "Recording in real time"
    : "Not recorded";

  const joinMeeting = () => {
    if (job.meetingUrl) window.open(job.meetingUrl, "_blank", "noopener,noreferrer");
    else toast(`Opening ${platform}`);
  };
  const cancel = () => {
    cancelMeetingBot(job.id);
    toast(`${botName} was called back`);
    navigate("/", { replace: true });
  };

  return (
    <>
      <AlertDialog open={stopOpen} onOpenChange={setStopOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop recording this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              {botName} leaves the call. What was said so far becomes the transcript.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep recording</AlertDialogCancel>
            <AlertDialogAction onClick={() => stopMeetingBot(job.id)}>Stop recording</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-1 overflow-hidden" data-live-meeting={job.status}>
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <div className="px-4 pt-6 lg:px-8">
            <div className="flex h-7 items-center justify-between text-xs text-muted-foreground">
              <span>My records</span>
            </div>
            <h1 className="mt-1 text-[20px] leading-[26px] tracking-[-0.3px] font-semibold text-foreground lg:text-[30px] lg:leading-tight lg:tracking-[-0.02em]">
              {job.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="scale-[0.9]"><SourceIcon source={job.source ?? "google-meet"} /></span>
                <span>{platform}</span>
              </span>
              {/* the dot travels with its item; on a phone the status takes its own line, with no dot in front */}
              <span className="before:mr-2 before:text-border before:content-['•']">{botName}</span>
              <span className={"max-sm:basis-full max-sm:before:content-none before:mr-2 before:text-border before:content-['•']" + (isError ? " text-destructive" : "")}>{statusLine}</span>
              <span className="max-sm:hidden before:mr-2 before:text-border before:content-['•']">{new Date(job.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as LiveTab)} className="mt-4 lg:mt-8">
            <div className="flex items-end border-b border-border px-4 lg:px-8">
              <TabsList variant="line" className="border-b-0">
                <TabsTrigger value="notes" variant="line" className="max-lg:text-[13px]">Notes</TabsTrigger>
                <TabsTrigger value="transcript" variant="line" className="max-lg:text-[13px]">
                  {isRecording && (
                    /* the transcript is alive: three green bars breathe on the tab while sound comes in */
                    <span className="mr-1.5 inline-flex h-[12px] items-center gap-[2px]" aria-hidden>{[0.55, 1, 0.7].map((h, i) => <span key={i} className="ttt-bar w-[2.5px] rounded-full bg-[#34C759]" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.18}s` }} />)}</span>
                  )}
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="summary" variant="line" className="max-lg:text-[13px]">Summary</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <div className="flex-1 overflow-auto">
            {tab === "notes" ? (
              <div className="mx-auto flex min-h-full w-full max-w-[980px] flex-col px-4 py-6 lg:px-8">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  autoFocus
                  placeholder={isError ? "Your notes stay here if you send the bot again." : "Your notes during the meeting. They go into the summary together with the transcript."}
                  className="min-h-[320px] flex-1 resize-none border-0 bg-transparent px-0 text-[15px] leading-[26px] shadow-none focus-visible:ring-0"
                />
              </div>
            ) : tab === "summary" ? (
              <LiveSummaryTab error={isError} />
            ) : (
              <div key={job.status + ":" + (job.botPhase ?? "")} className="ttt-state-in mx-auto w-full max-w-[980px] px-4 py-6 lg:px-8">
                {isConnecting && (
                  <DoorCard phase={job.botPhase ?? "joining"} botName={botName} platform={platform} source={job.source ?? "google-meet"} waited={elapsed} onJoin={joinMeeting} onCancel={cancel} />
                )}
                {isError && (
                  <NotAdmittedCard errorType={job.errorType} botName={botName} platform={platform} source={job.source ?? "google-meet"} onResend={() => reconnectBot(job.id)} onJoin={joinMeeting} />
                )}
                {isRecording && segments.length === 0 && (
                  <ListeningRow caption="Listening. The first words appear a few seconds after someone speaks." />
                )}
                {isRecording && segments.length > 0 && (
                  <LiveLines segments={segments} live={isRecording} />
                )}
              </div>
            )}
          </div>

          {/* the bar belongs to the recording; at the door the card already carries the timer and the way in */}
          {isRecording && (
            <BotBar
              job={job}
              elapsed={elapsed}
              platform={platform}
              onStop={() => setStopOpen(true)}
              onCancel={cancel}
              onJoin={joinMeeting}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* A clock that ticks once a second while something is running, so the timer
   and the lobby countdown move without the provider re-rendering. */
function useClock(running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}

/* ── the door ─────────────────────────────────────────────────────────── */

function DoorCard({ phase, botName, platform, source, waited, onJoin, onCancel }: {
  phase: "joining" | "waiting"; botName: string; platform: string; source: SourceType; waited: number; onJoin: () => void; onCancel: () => void;
}) {
  const waiting = phase === "waiting";
  const left = Math.max(0, BOT_LOBBY_LIMIT_SECONDS - waited);
  return (
    <div className="flex justify-center px-2 py-10 lg:py-16" data-door={phase}>
      <div className="w-full max-w-[520px] px-6 py-4 text-center">
        <span className="relative mx-auto flex size-[64px] items-center justify-center">
          {/* two rings leave the mark, the way a call rings: something is happening, without claiming a number */}
          <span aria-hidden className="ttt-ring absolute inset-0 rounded-full border-2 border-primary/40" />
          <span aria-hidden className="ttt-ring absolute inset-0 rounded-full border-2 border-primary/40" style={{ animationDelay: "0.9s" }} />
          <span className={"relative flex size-[52px] items-center justify-center rounded-full bg-primary/[0.07]" + (waiting ? " ttt-knock" : "")}>
            <span className="scale-[1.3]"><SourceIcon source={source} /></span>
          </span>
        </span>
        <h3 className="mt-4 text-[17px] font-semibold text-foreground">{waiting ? "Waiting at the door" : "Joining the meeting"}</h3>
        <p className="mx-auto mt-1.5 max-w-[400px] text-balance text-[13.5px] leading-relaxed text-muted-foreground">
          {waiting
            ? `The host needs to let ${botName} in.`
            : `${botName} is opening the ${platform} link.`}
        </p>
        {waiting && (
          <div className="mx-auto mt-5 w-full max-w-[320px]">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(100, (waited / BOT_LOBBY_LIMIT_SECONDS) * 100)}%` }} />
            </div>
            <p className="mt-2 text-[12px] font-medium tabular-nums text-primary">{fmtLiveClock(waited)} <span className="font-normal text-muted-foreground">of 5:00, {fmtLiveClock(left)} left</span></p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {waiting && (
            <Button onClick={onJoin} className="h-9 gap-2 rounded-full px-4 text-[13px] font-medium">
              <span className="scale-[0.9]"><SourceIcon source={source} /></span>
              Join {platform}
              <Icon icon={ArrowUpRight01Icon} className="size-[14px]" strokeWidth={2} />
            </Button>
          )}
          <Button variant={waiting ? "ghost" : "pill-outline"} onClick={onCancel} className="h-9 rounded-full px-4 text-[13px] font-medium">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── not let in ───────────────────────────────────────────────────────── */

function NotAdmittedCard({ errorType, botName, platform, source, onResend, onJoin }: {
  errorType: TranscriptionJob["errorType"]; botName: string; platform: string; source: SourceType; onResend: () => void; onJoin: () => void;
}) {
  const timeout = errorType === "bot_timeout";
  const title = timeout ? "Nobody let the bot in" : "The host didn't let the bot in";
  const body = timeout
    ? `${botName} knocked for 5 minutes and left.`
    : "Nothing was recorded.";
  return (
    <div className="flex justify-center px-2 py-10 lg:py-16" data-door="error">
      <div className="w-full max-w-[520px] px-6 py-4 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <Icon icon={Alert02Icon} className="size-[22px] text-destructive" strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-[17px] font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-[400px] text-balance text-[13.5px] leading-relaxed text-muted-foreground">
        {body} Send it again, or join {platform} and let it in.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onResend} className="h-9 gap-1.5 rounded-full px-4 text-[13px] font-medium">
          <Icon icon={RefreshIcon} className="size-[14px]" strokeWidth={1.9} />
          Send the bot again
        </Button>
        <Button variant="pill-outline" onClick={onJoin} className="h-9 gap-1.5 rounded-full px-4 text-[13px] font-medium">
          <span className="scale-[0.9]"><SourceIcon source={source} /></span>
          Join {platform}
          <Icon icon={ArrowUpRight01Icon} className="size-[14px]" strokeWidth={2} />
        </Button>
      </div>
      </div>
    </div>
  );
}

/* ── the words ────────────────────────────────────────────────────────── */

function toSegment(line: LiveSegment, text: string): Segment {
  const sp = liveSpeaker(line.speakerId);
  return { id: line.id, timestamp: line.timestamp, text, speaker: { id: sp.id, name: sp.name, color: sp.tint, initial: sp.initials[0] } };
}

function LiveLines({ segments, live }: { segments: LiveSegment[]; live: boolean }) {
  const endRef = useRef<HTMLDivElement | null>(null);
  /* lines that were already there when the page opened are not typed out
     again: only what arrives while you watch */
  const seenRef = useRef<Set<number>>(new Set(segments.map((s) => s.id)));
  /* the lines on screen when the page opened stand still; a line that arrives
     while you watch rises into place */
  const atMountRef = useRef<Set<number>>(new Set(segments.map((s) => s.id)));
  const last = segments[segments.length - 1];
  const typeLast = live && last !== undefined && !seenRef.current.has(last.id);
  const typed = useTypedText(last?.text ?? "", typeLast);
  useEffect(() => { if (last && typed.done) seenRef.current.add(last.id); }, [last, typed.done]);
  /* the newest words stay in view while the meeting runs; once it is over the
     page starts at the top, where the banner says what happens next */
  useEffect(() => { if (live) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [live, segments.length, typed.text]);
  return (
    <div data-live-lines="">
      {segments.map((line, index) => {
        const isLast = index === segments.length - 1;
        const text = isLast && typeLast ? typed.text : line.text;
        const prev = segments[index - 1];
        return (
          <div key={line.id} className={live && !atMountRef.current.has(line.id) ? "ttt-line-in" : undefined}>
          <TranscriptSegment
            segment={toSegment(line, text)}
            nextTimestamp={segments[index + 1]?.timestamp}
            continuation={!!prev && prev.speakerId === line.speakerId}
            isEditing={false}
            highlighted={false}
            isPlaybackActive={live && isLast}
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
          </div>
        );
      })}
      {/* between two lines the page shows it is still listening, so a pause in the
          call does not read as the transcript having stopped */}
      {live && (!typeLast || typed.done) && <ListeningRow />}
      <div ref={endRef} />
    </div>
  );
}

/* Three dots breathe where the next line will land. The text is shown once,
   before the first words, so the empty page says what it is waiting for. */
function ListeningRow({ caption }: { caption?: string }) {
  return (
    <div className="ttt-line-in flex items-center gap-3 py-3 lg:pl-[254px]" data-listening="">
      <span className="inline-flex items-center gap-[3px]" aria-hidden>
        {[0, 1, 2].map((i) => <span key={i} className="ttt-dot size-[6px] rounded-full bg-primary/70" style={{ animationDelay: `${i * 0.18}s` }} />)}
      </span>
      <span className="text-[13px] text-muted-foreground">{caption ?? "Listening"}</span>
    </div>
  );
}

/* A line arrives whole from the bot, but lands word by word, the way a reply
   is typed: the eye catches that something new is being said, instead of a
   block appearing at once (Andrei, 12.10). Reduced motion shows the whole
   line at once. */
function useTypedText(text: string, enabled: boolean) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(enabled && !reduced ? 0 : Number.MAX_SAFE_INTEGER);
  useEffect(() => {
    if (!enabled || reduced) { setShown(Number.MAX_SAFE_INTEGER); return; }
    const words = text.split(" ");
    let i = 0; let id = 0;
    setShown(0);
    /* words land unevenly, with a breath after a comma or a full stop, the way
       speech comes in, not on a metronome */
    const tick = () => {
      i += 1;
      setShown(i);
      if (i >= words.length) return;
      const prev = words[i - 1];
      const pause = /[.!?]$/.test(prev) ? 220 : /[,;:]$/.test(prev) ? 140 : 0;
      id = window.setTimeout(tick, 45 + Math.random() * 50 + pause);
    };
    id = window.setTimeout(tick, 120);
    return () => window.clearTimeout(id);
  }, [text, enabled, reduced]);
  const words = text.split(" ");
  const done = shown >= words.length;
  return { text: done ? text : words.slice(0, shown).join(" "), done };
}

/* ── the summary before there is one ──────────────────────────────────── */

function LiveSummaryTab({ error }: { error: boolean }) {
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const [templateId, setTemplateId] = useState<string | null>(() => window.sessionStorage.getItem("ttt_live_template"));
  const pick = (id: string | null) => { setTemplateId(id); if (id) window.sessionStorage.setItem("ttt_live_template", id); else window.sessionStorage.removeItem("ttt_live_template"); };
  const chosen = templates.find((t) => t.id === templateId);
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/5"><Icon icon={AiMagicIcon} className="size-6 text-primary" strokeWidth={1.6} /></div>
      <h3 className="text-[16px] font-semibold text-foreground">
        {error ? "No summary without a recording" : "The summary is written when the meeting ends"}
      </h3>
      <p className="mt-1.5 max-w-[380px] text-balance text-[13px] leading-relaxed text-muted-foreground">
        {error ? "Send the bot again from the Transcript tab." : "Pick a template now or keep the first one."}
      </p>
      {!error && (
        <div className="mt-5">
          <TemplatePicker value={templateId} onSelect={pick} onManageTemplates={() => navigate("/")} align="center"
            trigger={<Button variant={templateId ? "pill-outline" : "default"} className="h-9 gap-1.5 rounded-full px-5 text-[13px] font-medium">{chosen ? <><span>{templateEmoji(chosen.name)}</span>{chosen.name}</> : "Choose a template"}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></Button>} />
        </div>
      )}
    </div>
  );
}

/* ── the bar ──────────────────────────────────────────────────────────── */

const WAVE_BARS = 18;

function LiveWave({ active }: { active: boolean }) {
  const [heights, setHeights] = useState<number[]>(() => Array(WAVE_BARS).fill(4));
  useEffect(() => {
    if (!active) { setHeights(Array(WAVE_BARS).fill(4)); return; }
    const id = window.setInterval(() => setHeights(Array.from({ length: WAVE_BARS }, () => Math.random() * 14 + 4)), 120);
    return () => window.clearInterval(id);
  }, [active]);
  return (
    <div className="hidden items-center gap-[2px] md:flex" style={{ height: "18px" }}>
      {heights.map((h, i) => (
        <div key={i} className="w-[2px] rounded-full transition-[height] duration-150" style={{ height: `${h}px`, backgroundColor: active ? "var(--primary)" : "var(--muted-foreground)", opacity: active ? 0.45 + (i % 5) * 0.1 : 0.28 }} />
      ))}
    </div>
  );
}

function BotBar({ job, elapsed, platform, onStop, onCancel, onJoin }: {
  job: TranscriptionJob; elapsed: number; platform: string; onStop: () => void; onCancel: () => void; onJoin: () => void;
}) {
  const recording = job.status === "recording";
  const waiting = job.botPhase === "waiting";
  return (
    <div className="relative shrink-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-[2px] lg:px-6" data-bot-bar={recording ? "recording" : job.botPhase ?? "joining"}>
      <div className="@container grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {/* on a phone the status sits centred over the buttons; wider, it takes the left cell */}
        <div className="flex min-w-0 items-center justify-center gap-2 overflow-hidden md:justify-start">
          <span className="relative flex size-[8px] shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: recording ? "#f87171" : "var(--primary)" }} />
            <span className="relative inline-flex size-[8px] rounded-full" style={{ backgroundColor: recording ? "#ef4444" : "var(--primary)" }} />
          </span>
          <span className={`whitespace-nowrap text-[13px] font-semibold ${recording ? "text-destructive" : "text-primary"}`}>
            {recording ? "Recording" : waiting ? "Waiting" : "Connecting"}
          </span>
          {(recording || waiting) && <span className="text-[14px] font-semibold tabular-nums text-foreground">{fmtLiveClock(elapsed)}</span>}
          <LiveWave active={recording} />
          <span className="hidden whitespace-nowrap text-xs text-muted-foreground @[980px]:inline">
            {recording ? "Live transcript is running" : waiting ? "The host has to let the bot in" : "The bot is opening the link"}
          </span>
        </div>

        {/* on a phone the two buttons share one row under the status, each half
            of it; on wider screens they take the grid's middle and right cells */}
        <div className="grid grid-cols-2 items-center gap-2 md:contents">
        <div className="flex items-center justify-center gap-2 md:order-2">
          {recording ? (
            <Button variant="destructive" className="h-9 w-full gap-1.5 rounded-full px-3 md:w-auto" onClick={onStop} title="Stop recording">
              <svg className="size-[12px] text-white" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="10" height="10" rx="2" /></svg>
              <span className="text-[13px] font-semibold text-white">Stop recording</span>
            </Button>
          ) : (
            <Button variant="pill-outline" className="h-9 w-full rounded-full px-4 md:w-auto" onClick={onCancel}>
              <span className="text-[13px] font-medium text-foreground">Cancel</span>
            </Button>
          )}
        </div>

        <div className="flex items-center justify-center md:order-3 md:justify-self-end">
          <Button variant="pill-outline" className="h-9 w-full gap-2 rounded-full px-3.5 md:w-auto" onClick={onJoin} title={`Open ${platform} in a new tab`}>
            <span className="scale-[0.9]"><SourceIcon source={job.source ?? "google-meet"} /></span>
            <span className="text-[13px] font-medium text-foreground">Join {platform}</span>
            <Icon icon={ArrowUpRight01Icon} className="size-[13px] text-muted-foreground" strokeWidth={2} />
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
