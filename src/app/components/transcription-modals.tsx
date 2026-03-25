import {
  useState, useRef, useEffect, useMemo,
  createContext, useContext,
} from "react";
import { createPortal } from "react-dom";
import { FolderPlus } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Icon } from "./ui/icon";
import { SourceIcon, type SourceType } from "./source-icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { useFolders } from "./folder-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { router } from "../routes";

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

export type ModalType = "upload" | "record" | "link" | "meeting" | null;
export type UserPlan = "free" | "pro";

export interface TranscriptionJob {
  id: string;
  name: string;
  createdAt: string;
  duration?: string;
  progress: number;
  uploadProgress?: number;
  transcriptionProgress?: number;
  status: "uploading" | "processing" | "done" | "error";
  fileType: "audio" | "video";
  errorType?: "no_audio" | "corrupt" | "too_long" | "network";
  noAudioDetected?: boolean;
  lang?: string;
  langBilingual?: string[];
  translationLang?: string;
  folderId?: string;
  source?: SourceType;
  mediaUrl?: string;
  livePreviewSegments?: Array<{ id: number; timestamp: string; text: string }>;
}

const ERROR_LABELS: Record<string, string> = {
  no_audio: "No audio track found",
  corrupt: "File appears to be corrupted",
  too_long: "Exceeds 5-hour limit",
  network: "Network error — upload failed",
};

type RecordingPhase = "idle" | "recording" | "paused" | "review";

interface RecordingMicrophoneOption {
  id: string;
  label: string;
}

export interface LiveTranscriptSegment {
  id: number;
  timestamp: string;
  text: string;
}

interface SpeechRecognitionResultAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionCtor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
};

type InstantRecordingSubmitOptions = {
  lang?: string;
  langBilingual?: string[];
  translationLang?: string;
  folderId?: string;
};

interface CtxValue {
  openModal: ModalType;
  setOpenModal: (m: ModalType) => void;
  jobs: TranscriptionJob[];
  addJob: (name: string, fileType: "audio" | "video", opts?: { lang?: string; langBilingual?: string[]; translationLang?: string; folderId?: string; source?: SourceType; mediaUrl?: string; livePreviewSegments?: Array<{ id: number; timestamp: string; text: string }>; noAudioDetected?: boolean }) => string;
  retryJob: (id: string) => void;
  meetingCounterRef: React.MutableRefObject<number>;
  userPlan: UserPlan;
  recordingPhase: RecordingPhase;
  recordingElapsed: number;
  audioUrl: string | null;
  startInstantRecording: (opts?: InstantRecordingSubmitOptions) => Promise<boolean>;
  pauseInstantRecording: () => void;
  resumeInstantRecording: () => void;
  stopInstantRecording: () => void;
  microphoneDevices: RecordingMicrophoneOption[];
  selectedMicrophoneId: string;
  switchRecordingMicrophone: (deviceId: string) => Promise<void>;
  isSwitchingMicrophone: boolean;
  liveTranscriptSegments: LiveTranscriptSegment[];
  liveTranscriptInterim: string;
  isLiveTranscriptionSupported: boolean;
  recordingDetailOpen: boolean;
  setRecordingDetailOpen: (open: boolean) => void;
  cancelInstantRecording: () => void;
  submitInstantRecording: (opts?: InstantRecordingSubmitOptions) => void;
  openUploadWithFiles: (files: File[]) => void;
  consumePreloadedFiles: () => File[];
}

const Ctx = createContext<CtxValue | null>(null);

export function useTranscriptionModals() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Missing TranscriptionModalsProvider");
  return c;
}

// ════════════════════════════════════════════════════════════
// Provider
// ════════════════════════════════════════════════════════════

export function TranscriptionModalsProvider({
  children, userPlan = "free",
}: { children: React.ReactNode; userPlan?: UserPlan }) {
  const { assignToFolder } = useFolders();
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const jobsRef = useRef<TranscriptionJob[]>([]);
  const meetingCounterRef = useRef(1);

  // ── Upload preload state ───────────────────────────────────
  const preloadedFilesRef = useRef<File[]>([]);

  function openUploadWithFiles(files: File[]) {
    preloadedFilesRef.current = files;
    setOpenModal("upload");
  }

  function consumePreloadedFiles() {
    const files = preloadedFilesRef.current;
    preloadedFilesRef.current = [];
    return files;
  }

  // ── Instant recording state ────────────────────────────────
  const [recordingPhase, setRecordingPhase] = useState<RecordingPhase>("idle");
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<RecordingMicrophoneOption[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [isSwitchingMicrophone, setIsSwitchingMicrophone] = useState(false);
  const [liveTranscriptSegments, setLiveTranscriptSegments] = useState<LiveTranscriptSegment[]>([]);
  const [liveTranscriptInterim, setLiveTranscriptInterim] = useState("");
  const [isLiveTranscriptionSupported, setIsLiveTranscriptionSupported] = useState(false);
  const [recordingDetailOpen, setRecordingDetailOpen] = useState(false);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const shouldRestartSpeechRef = useRef(false);
  const recordingPhaseRef = useRef<RecordingPhase>("idle");
  const recordingElapsedRef = useRef(0);
  const instantRecordingOptionsRef = useRef<InstantRecordingSubmitOptions | undefined>(undefined);

  useEffect(() => {
    recordingPhaseRef.current = recordingPhase;
  }, [recordingPhase]);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    recordingElapsedRef.current = recordingElapsed;
  }, [recordingElapsed]);

  useEffect(() => {
    if (recordingPhase !== "recording") return;
    const id = setInterval(() => setRecordingElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [recordingPhase]);

  useEffect(() => {
    if (recordingPhase === "idle" || recordingPhase === "review") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [recordingPhase]);

  function getSpeechRecognitionCtor() {
    if (typeof window === "undefined") return null;
    const maybeWindow = window as WindowWithSpeechRecognition;
    return maybeWindow.SpeechRecognition ?? maybeWindow.webkitSpeechRecognition ?? null;
  }

  useEffect(() => {
    setIsLiveTranscriptionSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  function stopLiveTranscription(opts?: { clearInterim?: boolean; clearSegments?: boolean }) {
    shouldRestartSpeechRef.current = false;
    const recognition = speechRecognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          // no-op
        }
      }
      speechRecognitionRef.current = null;
    }
    if (opts?.clearInterim) setLiveTranscriptInterim("");
    if (opts?.clearSegments) setLiveTranscriptSegments([]);
  }

  function appendLiveTranscriptSegment(rawText: string) {
    const text = rawText.trim();
    if (!text) return;
    setLiveTranscriptSegments((prev) => [
      ...prev,
      { id: prev.length + 1, timestamp: fmtTime(recordingElapsedRef.current), text },
    ]);
  }

  function startLiveTranscriptionSession() {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setIsLiveTranscriptionSupported(false);
      setLiveTranscriptInterim("");
      return;
    }
    setIsLiveTranscriptionSupported(true);
    stopLiveTranscription({ clearInterim: true });
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim() ?? "";
        if (!transcript) continue;
        if (result.isFinal) {
          appendLiveTranscriptSegment(transcript);
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }
      setLiveTranscriptInterim(interim);
    };
    recognition.onerror = () => {
      setLiveTranscriptInterim("");
    };
    recognition.onend = () => {
      speechRecognitionRef.current = null;
      if (shouldRestartSpeechRef.current && recordingPhaseRef.current === "recording") {
        startLiveTranscriptionSession();
      }
    };
    speechRecognitionRef.current = recognition;
    shouldRestartSpeechRef.current = true;
    try {
      recognition.start();
    } catch {
      // no-op
    }
  }

  function formatMicrophoneLabel(device: MediaDeviceInfo, index: number) {
    const raw = device.label?.trim();
    if (device.deviceId === "default") {
      const base = raw?.replace(/^default\s*-\s*/i, "") || "Microphone";
      return `Default - ${base}`;
    }
    if (device.deviceId === "communications") {
      const base = raw?.replace(/^communications\s*-\s*/i, "") || "Microphone";
      return `Communications - ${base}`;
    }
    return raw || `Microphone ${index + 1}`;
  }

  async function refreshMicrophoneDevices(preferredId?: string) {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
      const nextOptions = audioInputs.map((device, index) => ({
        id: device.deviceId,
        label: formatMicrophoneLabel(device, index),
      }));
      setMicrophoneDevices(nextOptions);
      setSelectedMicrophoneId((prevId) => {
        const candidate = preferredId ?? prevId;
        if (candidate && nextOptions.some((d) => d.id === candidate)) return candidate;
        return nextOptions[0]?.id ?? "";
      });
    } catch {
      setMicrophoneDevices([]);
    }
  }

  async function getAudioStreamForDevice(deviceId?: string) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices are unavailable");
    }
    if (deviceId) {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
      } catch {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    }
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  useEffect(() => {
    void refreshMicrophoneDevices();
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return;
    const handleDeviceChange = () => { void refreshMicrophoneDevices(); };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, []);

  function _startMediaRecorder(stream: MediaStream) {
    try {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      // MediaRecorder unavailable (e.g. unsupported stream) — proceed without audio data
      mediaRecorderRef.current = null;
    }
  }

  async function startInstantRecording(opts?: InstantRecordingSubmitOptions) {
    try {
      const stream = await getAudioStreamForDevice(selectedMicrophoneId || undefined);
      instantRecordingOptionsRef.current = opts;
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];
      setAudioUrl(null);
      setRecordingElapsed(0);
      setLiveTranscriptSegments([]);
      setLiveTranscriptInterim("");
      _startMediaRecorder(stream);
      const activeDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId;
      if (activeDeviceId) setSelectedMicrophoneId(activeDeviceId);
      void refreshMicrophoneDevices(activeDeviceId);
      recordingPhaseRef.current = "recording";
      setRecordingPhase("recording");
      startLiveTranscriptionSession();
      return true;
    } catch {
      return false;
    }
  }
  function pauseInstantRecording() {
    mediaRecorderRef.current?.pause();
    stopLiveTranscription({ clearInterim: true });
    recordingPhaseRef.current = "paused";
    setRecordingPhase("paused");
  }
  function resumeInstantRecording() {
    if (recordingPhase === "paused") {
      mediaRecorderRef.current?.resume();
    } else if (recordingPhase === "review" && recordingStreamRef.current) {
      // Continue after review — start new recorder segment, keep existing chunks
      _startMediaRecorder(recordingStreamRef.current);
    }
    recordingPhaseRef.current = "recording";
    setRecordingPhase("recording");
    startLiveTranscriptionSession();
  }
  function stopInstantRecording() {
    if (recordingPhase !== "recording" && recordingPhase !== "paused") return;
    submitInstantRecording(instantRecordingOptionsRef.current);
  }

  async function switchRecordingMicrophone(deviceId: string) {
    if (!deviceId || deviceId === selectedMicrophoneId) return;
    if (recordingPhase !== "recording" && recordingPhase !== "paused") {
      setSelectedMicrophoneId(deviceId);
      return;
    }
    setIsSwitchingMicrophone(true);
    const shouldPause = recordingPhase === "paused";
    try {
      const nextStream = await getAudioStreamForDevice(deviceId);
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = nextStream;
      _startMediaRecorder(nextStream);
      if (shouldPause) {
        mediaRecorderRef.current?.pause();
        recordingPhaseRef.current = "paused";
        setRecordingPhase("paused");
      } else {
        recordingPhaseRef.current = "recording";
        setRecordingPhase("recording");
      }
      const activeDeviceId = nextStream.getAudioTracks()[0]?.getSettings().deviceId || deviceId;
      await refreshMicrophoneDevices(activeDeviceId);
    } catch {
      await refreshMicrophoneDevices();
    } finally {
      setIsSwitchingMicrophone(false);
    }
  }
  function cancelInstantRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    instantRecordingOptionsRef.current = undefined;
    stopLiveTranscription({ clearInterim: true, clearSegments: true });
    audioChunksRef.current = [];
    setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    recordingStreamRef.current = null;
    recordingPhaseRef.current = "idle";
    setRecordingPhase("idle");
    setRecordingElapsed(0);
  }
  function submitInstantRecording(opts?: InstantRecordingSubmitOptions) {
    const name = `Recording ${fmtTime(recordingElapsed)}.wav`;
    const previewSegments = [
      ...liveTranscriptSegments,
      ...(liveTranscriptInterim.trim().length > 0
        ? [{ id: liveTranscriptSegments.length + 1, timestamp: fmtTime(recordingElapsedRef.current), text: liveTranscriptInterim.trim() }]
        : []),
    ];
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    instantRecordingOptionsRef.current = undefined;
    stopLiveTranscription({ clearInterim: true, clearSegments: true });
    audioChunksRef.current = [];
    setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    recordingStreamRef.current = null;
    recordingPhaseRef.current = "idle";
    setRecordingPhase("idle");
    setRecordingElapsed(0);
    const id = addJob(name, "audio", { ...opts, source: "microphone", livePreviewSegments: previewSegments });
    const queuedJob: TranscriptionJob = {
      id,
      name,
      createdAt: new Date().toISOString(),
      progress: 0,
      uploadProgress: 0,
      transcriptionProgress: 0,
      status: "uploading",
      fileType: "audio",
      ...opts,
      source: "microphone",
      livePreviewSegments: previewSegments,
    };
    const recordState = mapJobToRecordState(queuedJob);
    try {
      window.sessionStorage.setItem(`uploaded-record:${id}`, JSON.stringify(recordState));
    } catch {
      // best-effort cache only
    }
    void router.navigate(`/transcriptions/${id}`, { state: { record: recordState, fromRecordingStop: true } });
  }

  useEffect(() => {
    return () => {
      stopLiveTranscription({ clearInterim: true });
    };
  }, []);

  function simulateJob(id: string) {
    let uploadPct = 0;
    let transcriptionPct = 0;

    const tickTranscription = () => {
      transcriptionPct += Math.random() * 10 + 4;
      if (transcriptionPct >= 100) {
        transcriptionPct = 100;
        const rand = Math.random();
        if (rand < 0.15) {
          const errTypes = ["corrupt", "too_long", "network"] as const;
          const errorType = errTypes[Math.floor(Math.random() * errTypes.length)];
          setJobs(prev => prev.map(j => j.id === id ? {
            ...j,
            progress: 100,
            uploadProgress: 100,
            transcriptionProgress: 100,
            status: "error",
            errorType,
          } : j));
        } else {
          setJobs(prev => prev.map(j => j.id === id ? {
            ...j,
            progress: 100,
            uploadProgress: 100,
            transcriptionProgress: 100,
            status: "done",
            duration: randomDuration(),
          } : j));
        }
        return;
      }

      const rounded = Math.round(transcriptionPct);
      setJobs(prev => prev.map(j => j.id === id ? {
        ...j,
        status: "processing",
        transcriptionProgress: rounded,
        uploadProgress: 100,
        progress: Math.round(55 + rounded * 0.45),
      } : j));
      setTimeout(tickTranscription, 320 + Math.random() * 180);
    };

    const tickUpload = () => {
      uploadPct += Math.random() * 14 + 6;
      if (uploadPct >= 100) {
        uploadPct = 100;
        const noAudioDetected = jobsRef.current.find((job) => job.id === id)?.noAudioDetected === true;
        if (noAudioDetected) {
          setJobs(prev => prev.map(j => j.id === id ? {
            ...j,
            progress: 100,
            uploadProgress: 100,
            transcriptionProgress: 0,
            status: "error",
            errorType: "no_audio",
          } : j));
          return;
        }

        setJobs(prev => prev.map(j => j.id === id ? {
          ...j,
          status: "processing",
          uploadProgress: 100,
          transcriptionProgress: 0,
          progress: 55,
          errorType: undefined,
        } : j));
        setTimeout(tickTranscription, 420);
        return;
      }

      const rounded = Math.round(uploadPct);
      setJobs(prev => prev.map(j => j.id === id ? {
        ...j,
        status: "uploading",
        uploadProgress: rounded,
        transcriptionProgress: 0,
        progress: Math.round(rounded * 0.55),
        errorType: undefined,
      } : j));
      setTimeout(tickUpload, 240 + Math.random() * 140);
    };

    setTimeout(tickUpload, 300);
  }

  function addJob(name: string, fileType: "audio" | "video", opts?: { lang?: string; langBilingual?: string[]; translationLang?: string; folderId?: string; source?: SourceType; mediaUrl?: string; livePreviewSegments?: Array<{ id: number; timestamp: string; text: string }>; noAudioDetected?: boolean }) {
    const id = Math.random().toString(36).slice(2, 10);
    const createdAt = new Date().toISOString();
    setJobs(prev => [{ id, name, createdAt, progress: 0, uploadProgress: 0, transcriptionProgress: 0, status: "uploading", fileType, ...opts }, ...prev]);
    if (opts?.folderId) assignToFolder([id], opts.folderId);
    simulateJob(id);
    return id;
  }

  function retryJob(id: string) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: 0, uploadProgress: 0, transcriptionProgress: 0, status: "uploading", duration: undefined, errorType: undefined } : j));
    simulateJob(id);
  }

  return (
    <Ctx.Provider value={{ openModal, setOpenModal, jobs, addJob, retryJob, meetingCounterRef, userPlan, recordingPhase, recordingElapsed, audioUrl, startInstantRecording, pauseInstantRecording, resumeInstantRecording, stopInstantRecording, microphoneDevices, selectedMicrophoneId, switchRecordingMicrophone, isSwitchingMicrophone, liveTranscriptSegments, liveTranscriptInterim, isLiveTranscriptionSupported, recordingDetailOpen, setRecordingDetailOpen, cancelInstantRecording, submitInstantRecording, openUploadWithFiles, consumePreloadedFiles }}>
      {children}
      <AllModals />
      <RecordingPill />
      <FloatingProgressWidget />
    </Ctx.Provider>
  );
}

function randomDuration() {
  return `${Math.floor(Math.random() * 44 + 1)}m ${Math.floor(Math.random() * 59)}s`;
}

function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateForRecord(date: Date) {
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

function normalizeSource(source: TranscriptionJob["source"], fileType: TranscriptionJob["fileType"]): SourceType {
  if (source) return source;
  return fileType === "audio" ? "mp3" : "mp4";
}

function mapJobToRecordState(job: TranscriptionJob) {
  const createdDate = job.createdAt ? new Date(job.createdAt) : new Date();
  const isDone = job.status === "done";
  const isError = job.status === "error";
  const dateParts = formatDateForRecord(createdDate);

  return {
    id: job.id,
    name: job.name,
    iconColor: "#3B82F6",
    iconType: "square" as const,
    duration: isDone ? (job.duration ?? "—") : isError ? "Failed" : "In progress",
    dateCreated: dateParts.dateCreated,
    dateGroup: dateParts.dateGroup,
    template: job.langBilingual && job.langBilingual.length > 1 ? "1 by 1" : "Summary",
    language: "en",
    source: normalizeSource(job.source, job.fileType),
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
// Shared atoms
// ════════════════════════════════════════════════════════════

function ToggleSw({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={() => onChange()}
      onClick={e => e.stopPropagation()}
    />
  );
}

function XBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} aria-label="Close"
      className="size-[28px] rounded-full flex items-center justify-center transition-colors flex-shrink-0 hover:bg-accent"
    >
      <svg className="size-[13px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </Button>
  );
}

/** Clean, non-uppercase section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-medium text-xs text-muted-foreground mb-[7px]">
      {children}
    </p>
  );
}

const FOLDER_COLOR_OPTIONS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#6B7280",
];

function CreateFolderDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLOR_OPTIONS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSelectedColor(FOLDER_COLOR_OPTIONS[0]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[180] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative rounded-[20px] w-[400px] overflow-hidden bg-popover"
        style={{ boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between px-[24px] pt-[22px] pb-[4px]">
          <h2 className="font-semibold text-[17px] text-foreground">Create New Folder</h2>
          <Button variant="ghost" size="icon"
            onClick={onClose}
            className="size-[28px] rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="size-[16px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>
        </div>
        <div className="px-[24px] pt-[18px] pb-[8px]">
          <Label className="font-medium text-[13px] text-foreground block mb-[6px]">
            Folder name
          </Label>
          <Input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && name.trim()) { onCreate(name.trim(), selectedColor); onClose(); }
              if (e.key === "Escape") onClose();
            }}
            placeholder="e.g. Client Meetings"
            className="w-full h-[40px] px-[14px] rounded-[12px] text-sm"
          />

          <Label className="font-medium text-[13px] text-foreground block mt-[18px] mb-[8px]">
            Color
          </Label>
          <div className="flex items-center gap-[8px]">
            {FOLDER_COLOR_OPTIONS.map(color => (
              <Button
                variant="ghost" size="icon"
                key={color}
                onClick={() => setSelectedColor(color)}
                className="size-[28px] rounded-full flex items-center justify-center transition-all p-0"
                style={{
                  backgroundColor: color,
                  boxShadow: selectedColor === color ? `0 0 0 2px var(--popover), 0 0 0 4px ${color}` : "none",
                  transform: selectedColor === color ? "scale(1.1)" : "scale(1)",
                }}
              >
                {selectedColor === color && (
                  <svg className="size-[14px]" fill="none" viewBox="0 0 16 16">
                    <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-[10px] mt-[20px] p-[12px] rounded-[12px] bg-secondary border border-border">
            <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 16 16">
              <path
                d="M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z"
                fill={selectedColor}
                opacity="0.15"
                stroke={selectedColor}
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={`font-medium text-sm ${name.trim() ? "text-foreground" : "text-muted-foreground"}`}>
              {name.trim() || "Folder name"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[18px] mt-[4px]">
          <Button variant="pill-outline"
            onClick={onClose}
            className="h-[36px] px-[18px] transition-colors"
          >
            <span className="font-medium text-[13px] text-foreground">Cancel</span>
          </Button>
          <Button
            onClick={() => { if (name.trim()) { onCreate(name.trim(), selectedColor); onClose(); } }}
            disabled={!name.trim()}
            className="h-[36px] px-[18px] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span className="font-medium text-[13px]">Create Folder</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const FOLDER_SVG_PATH = "M14.667 12.667a1.333 1.333 0 01-1.334 1.333H2.667a1.333 1.333 0 01-1.334-1.333V3.333A1.333 1.333 0 012.667 2h4l1.333 2h5.333a1.333 1.333 0 011.334 1.333v7.334z";

function FolderSelector({
  value,
  onChange,
  label = "Save to folder",
  compact = false,
}: {
  value: string | null;
  onChange: (folderId: string | null) => void;
  label?: string;
  compact?: boolean;
}) {
  const { folders, addFolder } = useFolders();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  function handleValueChange(val: string) {
    if (val === "__create__") {
      setCreateDialogOpen(true);
      return;
    }
    onChange(val === "__none__" ? null : val);
  }

  function handleCreateFolder(name: string, color: string) {
    const created = addFolder(name, color);
    onChange(created.id);
  }

  return (
    <div>
      {!compact && <SectionLabel>{label}</SectionLabel>}
      <Select value={value ?? "__none__"} onValueChange={handleValueChange}>
        <SelectTrigger
          className={`w-full rounded-[12px] border-input bg-transparent px-[12px] gap-[8px] ${compact ? "h-[36px]" : "h-[40px]"}`}
        >
          <SelectValue placeholder="Select folder" className="text-[13px]" />
        </SelectTrigger>
        <SelectContent className="z-[300]">
          <SelectItem value="__none__" className="text-[13px]">
            <span className="flex items-center gap-[7px]">
              <svg className="size-[13px] shrink-0 text-muted-foreground" fill="none" viewBox="0 0 16 16">
                <path d={FOLDER_SVG_PATH} fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              No folder
            </span>
          </SelectItem>
          {folders.map(folder => (
            <SelectItem key={folder.id} value={folder.id} className="text-[13px]">
              <span className="flex items-center gap-[7px]">
                <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: folder.color }}>
                  <path d={FOLDER_SVG_PATH} fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {folder.name}
              </span>
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value="__create__" className="text-[13px] text-primary focus:text-primary">
            <span className="flex items-center gap-[6px]">
              <Icon icon={FolderPlus} className="size-[12px] text-primary" strokeWidth={1.7} />
              Add folder
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <CreateFolderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateFolder}
      />
    </div>
  );
}

// ── Languages ──────────────────────────────────────────────

const LANGUAGES = [
  { id: "auto", label: "Detect automatically", flag: "🌐" },
  { id: "en", label: "English", flag: "🇺🇸" },
  { id: "ru", label: "Russian", flag: "🇷🇺" },
  { id: "es", label: "Spanish", flag: "🇪🇸" },
  { id: "de", label: "German", flag: "🇩🇪" },
  { id: "fr", label: "French", flag: "🇫🇷" },
  { id: "it", label: "Italian", flag: "🇮🇹" },
  { id: "pt", label: "Portuguese", flag: "🇵🇹" },
  { id: "ja", label: "Japanese", flag: "🇯🇵" },
  { id: "zh", label: "Chinese (Mandarin)", flag: "🇨🇳" },
  { id: "ko", label: "Korean", flag: "🇰🇷" },
  { id: "ar", label: "Arabic", flag: "🇸🇦" },
  { id: "hi", label: "Hindi", flag: "🇮🇳" },
  { id: "tr", label: "Turkish", flag: "🇹🇷" },
  { id: "nl", label: "Dutch", flag: "🇳🇱" },
  { id: "pl", label: "Polish", flag: "🇵🇱" },
  { id: "sv", label: "Swedish", flag: "🇸🇪" },
  { id: "da", label: "Danish", flag: "🇩🇰" },
  { id: "fi", label: "Finnish", flag: "🇫🇮" },
  { id: "uk", label: "Ukrainian", flag: "🇺🇦" },
];

function LanguageSelector({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = LANGUAGES.find(l => l.id === value) ?? LANGUAGES[0];
  const filtered = LANGUAGES.filter(l => l.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  return (
    <div className="relative" ref={ref}>
      {label && <SectionLabel>{label}</SectionLabel>}
      <Button variant="ghost"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-[8px] h-[40px] px-[14px] rounded-[12px] transition-all text-sm text-foreground bg-transparent border border-input"
      >
        <span className="text-[15px]">{selected.flag}</span>
        <span className="flex-1 text-left text-sm text-foreground">{selected.label}</span>
        <svg className={`size-[12px] transition-transform shrink-0 text-muted-foreground ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
      {open && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] rounded-[12px] overflow-hidden bg-popover border border-border shadow-md">
          <div className="p-[8px] pb-[4px]">
            <div className="relative">
              <svg className="absolute left-[9px] top-1/2 -translate-y-1/2 size-[13px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
                <path d="M7 12A5 5 0 107 2a5 5 0 000 10zM13 13l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <Input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search language…"
                className="w-full h-[32px] pl-[28px] pr-[8px] rounded-[7px] text-[13px]" />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "180px" }}>
            {filtered.length === 0 && <p className="text-center py-[16px] text-[13px] text-muted-foreground">No results</p>}
            {filtered.map(lang => (
              <Button variant="ghost" key={lang.id}
                onClick={() => { onChange(lang.id); setOpen(false); setQuery(""); }}
                className={`flex items-center gap-[8px] w-full px-[12px] h-[34px] transition-colors rounded-none ${lang.id === value ? "bg-primary/5" : "hover:bg-accent"}`}
              >
                <span className="text-[14px] w-[20px] text-center">{lang.flag}</span>
                <span className={`flex-1 text-left text-[13px] ${lang.id === value ? "font-medium text-primary" : "text-foreground"}`}>{lang.label}</span>
                {lang.id === value && <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Transcription mode toggle ──────────────────────────────

function TranscriptionModeToggle({ mode, onChange, compact = false }: {
  mode: "mono" | "bi"; onChange: (m: "mono" | "bi") => void; compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex h-[40px] items-center rounded-[12px] border border-border bg-muted/70 p-[3px] shrink-0">
        {(["mono", "bi"] as const).map(m => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={`flex h-full min-w-[58px] items-center justify-center rounded-[9px] px-[14px] text-[12px] font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "mono" ? "Mono" : "Bi"}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex rounded-[10px] p-[3px] bg-muted border border-border">
        {(["mono", "bi"] as const).map(m => {
          const isActive = mode === m;
          return (
            <Button variant="ghost" key={m}
              onClick={() => onChange(m)}
              className={`flex-1 flex items-center justify-center gap-[6px] h-[32px] rounded-[8px] transition-all ${isActive ? "bg-background shadow-sm" : ""}`}
            >
              <span className={`text-[13px] ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {m === "bi" ? "Bilingual" : "Monolingual"}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ── Speaker identification ─────────────────────────────────

function SpeakerSection({ enabled, onToggle, count, onCountChange }: {
  enabled: boolean; onToggle: () => void; count: number | "auto"; onCountChange: (v: number | "auto") => void;
}) {
  const [dropOpen, setDropOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setDropOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const options: (number | "auto")[] = ["auto", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const countLabel = count === "auto" ? "Auto-detect" : `${count} speaker${count > 1 ? "s" : ""}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-[13px] text-foreground">Speaker identification</p>
          <p className="text-[11px] text-muted-foreground mt-[1px]">Identify different speakers</p>
        </div>
        <ToggleSw checked={enabled} onChange={onToggle} />
      </div>
      {enabled && (
        <div className="mt-[10px] relative" ref={ref}>
          <Button variant="ghost"
            onClick={() => setDropOpen(v => !v)}
            className="w-full flex items-center justify-between h-[40px] px-[14px] rounded-[12px] transition-all text-[13px] text-foreground bg-transparent border border-input"
          >
            <span className="text-[13px] text-foreground">{countLabel}</span>
            <svg className={`size-[12px] transition-transform text-muted-foreground ${dropOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          {dropOpen && (
            <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] rounded-[12px] py-[4px] bg-popover border border-border shadow-md">
              {options.map(opt => {
                const lbl = opt === "auto" ? "Auto-detect" : `${opt} speaker${opt > 1 ? "s" : ""}`;
                const active = count === opt;
                return (
                  <Button variant="ghost" key={String(opt)}
                    onClick={() => { onCountChange(opt); setDropOpen(false); }}
                    className="flex items-center justify-between w-full px-[12px] h-[32px] transition-colors hover:bg-accent rounded-none"
                  >
                    <span className={`text-[13px] ${active ? "font-medium text-primary" : "text-foreground"}`}>{lbl}</span>
                    {active && <svg className="size-[13px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared settings block ──────────────────────────────────

interface SharedSettingsState {
  mode: "mono" | "bi";
  langPrimary: string;
  langSecondary: string;
  langBilingual: string[];
  speakerEnabled: boolean;
  speakerCount: number | "auto";
  realtimeTranslation: boolean;
  realtimeTranslationLang: string;
}

function RealTimeTranslationControl({
  enabled,
  onToggle,
  lang,
  onLangChange,
  withCard = true,
}: {
  enabled: boolean;
  onToggle: () => void;
  lang: string;
  onLangChange: (v: string) => void;
  withCard?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-[13px] text-foreground">Real-time translation</p>
          <p className="text-[11px] text-muted-foreground mt-[1px]">Translate speech as it's transcribed</p>
        </div>
        <ToggleSw checked={enabled} onChange={onToggle} />
      </div>
      {enabled && (
        <div className="mt-[12px]">
          <LanguageSelector value={lang} onChange={onLangChange} label="Translate to" />
        </div>
      )}
    </>
  );

  if (!withCard) return content;

  return (
    <div className="rounded-[12px] p-[14px] bg-card border border-border">
      {content}
    </div>
  );
}

function MultiLanguageSelector({ values, onChange, label }: {
  values: string[]; onChange: (v: string[]) => void; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = LANGUAGES.filter(l => l.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  function toggle(id: string) {
    if (id === "auto") {
      onChange(["auto"]);
      return;
    }
    if (values.includes("auto")) {
      onChange([id]);
      return;
    }
    if (values.includes(id)) {
      const next = values.filter(v => v !== id);
      onChange(next.length ? next : ["auto"]);
      return;
    }
    onChange([...values, id]);
  }

  const selectedLangs = values.map(id => LANGUAGES.find(l => l.id === id)).filter(Boolean) as typeof LANGUAGES;

  return (
    <div className="relative" ref={ref}>
      {label && <SectionLabel>{label}</SectionLabel>}
      {/* Trigger — looks like a single-select input, chips render inside */}
      <div
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center flex-wrap gap-[5px] min-h-[40px] pl-[12px] pr-[36px] py-[6px] rounded-[12px] cursor-pointer transition-all relative text-sm text-foreground bg-transparent border border-input"
      >
        {selectedLangs.length === 0 ? (
          <span className="text-[13px] text-muted-foreground">
            Select languages…
          </span>
        ) : (
          selectedLangs.map(lang => (
            <span key={lang.id} className="inline-flex items-center gap-[3px] h-[24px] px-[7px] rounded-full bg-muted">
              <span className="text-[11px]">{lang.flag}</span>
              <span className="font-medium text-[11px] text-foreground">{lang.label}</span>
              <Button variant="ghost" size="icon"
                onClick={e => { e.stopPropagation(); toggle(lang.id); }}
                className="ml-[2px] size-[12px] rounded-full flex items-center justify-center transition-colors hover:bg-accent p-0"
              >
                <svg className="size-[7px]" fill="none" viewBox="0 0 10 10">
                  <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </Button>
            </span>
          ))
        )}
        {/* Chevron */}
        <span className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className={`size-[12px] transition-transform text-muted-foreground ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {/* Dropdown with checkboxes */}
      {open && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] rounded-[12px] overflow-hidden bg-popover border border-border shadow-md">
          <div className="p-[8px] pb-[4px]">
            <div className="relative">
              <svg className="absolute left-[9px] top-1/2 -translate-y-1/2 size-[13px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
                <path d="M7 12A5 5 0 107 2a5 5 0 000 10zM13 13l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <Input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search language…"
                className="w-full h-[32px] pl-[28px] pr-[8px] rounded-[7px] text-[13px]" />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "168px" }}>
            {filtered.length === 0 && (
              <p className="text-center py-[14px] text-[13px] text-muted-foreground">No results</p>
            )}
            {filtered.map(lang => {
              const checked = values.includes(lang.id);
              return (
                <Button variant="ghost" key={lang.id} onClick={() => toggle(lang.id)}
                  className={`flex items-center gap-[8px] w-full px-[12px] h-[34px] transition-colors rounded-none ${checked ? "bg-primary/5" : "hover:bg-accent"}`}
                >
                  {/* Checkbox */}
                  <span className={`size-[15px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary" : "border-[1.5px] border-border"}`}>
                    {checked && (
                      <svg className="size-[9px]" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[13px] w-[20px] text-center">{lang.flag}</span>
                  <span className={`text-[13px] ${checked ? "font-medium text-primary" : "text-foreground"}`}>{lang.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SharedSettings({ state, onChange, userPlan, onUpgradeClick }: {
  state: SharedSettingsState; onChange: (patch: Partial<SharedSettingsState>) => void;
  userPlan: UserPlan; onUpgradeClick: () => void;
}) {
  const handleModeChange = (m: "mono" | "bi") => onChange(
    m === "mono" ? { mode: m, langPrimary: "auto" } : { mode: m, langBilingual: ["auto"] }
  );

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Language selector + Mono/Bi toggle in one row */}
      <div className="flex items-end gap-[6px]">
        <div className="flex-1 min-w-0">
          {state.mode === "mono" ? (
            <LanguageSelector value={state.langPrimary} onChange={v => onChange({ langPrimary: v })} label="Transcription language" />
          ) : (
            <MultiLanguageSelector
              values={state.langBilingual}
              onChange={v => onChange({ langBilingual: v })}
              label="Transcription languages"
            />
          )}
        </div>
        <TranscriptionModeToggle mode={state.mode} onChange={handleModeChange} compact />
      </div>
      <AdvancedSection>
        <div className="pt-[2px]">
          <SpeakerSection
            enabled={state.speakerEnabled}
            onToggle={() => onChange({ speakerEnabled: !state.speakerEnabled })}
            count={state.speakerCount}
            onCountChange={v => onChange({ speakerCount: v })}
          />
        </div>
      </AdvancedSection>
    </div>
  );
}

function AdvancedSection({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-[8px] h-[30px] rounded-[8px] pl-0 pr-[8px] outline-none transition-colors hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        <svg className={`size-[14px] transition-transform text-muted-foreground ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 16 16">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium text-[13px] text-foreground">Advanced options</span>
      </button>
      {open && (
        <div className="mt-[10px]">{children}</div>
      )}
    </div>
  );
}

const DEFAULT_SETTINGS: SharedSettingsState = {
  mode: "mono", langPrimary: "auto", langSecondary: "auto", langBilingual: ["auto"],
  speakerEnabled: false, speakerCount: 2, realtimeTranslation: false, realtimeTranslationLang: "en",
};

// ── Upgrade prompt ─────────────────────────────────────────

function UpgradePrompt({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[360px] p-[28px] flex flex-col items-center text-center gap-[16px] bg-popover"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
        <div className="absolute top-[14px] right-[14px]"><XBtn onClick={onClose} /></div>
        <div className="size-[52px] rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
          <svg className="size-[26px]" fill="#d97706" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </div>
        <div>
          <p className="font-bold text-[16px] text-foreground">Upgrade to Pro</p>
          <p className="text-[13px] text-muted-foreground mt-[6px] leading-relaxed">
            This feature is available on the Pro plan. Unlock bilingual transcription, real-time translation, and more.
          </p>
        </div>
        <Button onClick={onClose} className="w-full h-[42px] rounded-full transition-colors bg-primary text-primary-foreground hover:bg-primary/90">
          <span className="font-semibold text-sm">View Pro plans</span>
        </Button>
        <Button variant="ghost" onClick={onClose} className="text-[13px] text-muted-foreground">Maybe later</Button>
      </div>
    </div>,
    document.body
  );
}

// ── Modal shell ────────────────────────────────────────────

function ModalShell({ title, subtitle, onClose, onBackdropClick, children, width = 500 }: {
  title: string; subtitle?: string; onClose: () => void; onBackdropClick: () => void;
  children: React.ReactNode; width?: number;
}) {
  useEffect(() => {
    function h(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" onClick={onBackdropClick} />
      <div className="relative rounded-[20px] flex flex-col overflow-hidden bg-popover"
        style={{ width: `min(${width}px, calc(100vw - 32px))`, maxHeight: "calc(100vh - 40px)", boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-[22px] pt-[18px] pb-[16px] shrink-0">
          <div>
            <h2 className="font-bold text-[17px] text-foreground leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-[2px]">{subtitle}</p>}
          </div>
          <XBtn onClick={onClose} />
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ════════════════════════════════════════════════════════════
// Modal 1 — Upload audio & video
// ════════════════════════════════════════════════════════════

const ACCEPTED = ".mp3,.mp4,.m4a,.mov,.aac,.wav,.ogg,.opus,.mpeg,.wma,.wmv";
const AUDIO_EXTS = ["mp3", "m4a", "aac", "wav", "ogg", "opus", "mpeg", "wma"];

function formatBytes(b: number) {
  return b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
}

async function detectVideoHasAudioTrack(file: File): Promise<boolean | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    const settle = (value: boolean | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const timerId = window.setTimeout(() => settle(null), 4000);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.clearTimeout(timerId);
      const maybeVideo = video as HTMLVideoElement & {
        audioTracks?: { length?: number };
        mozHasAudio?: boolean;
        webkitAudioDecodedByteCount?: number;
        captureStream?: () => MediaStream;
        mozCaptureStream?: () => MediaStream;
      };
      let detection: boolean | null = null;

      if (typeof maybeVideo.audioTracks?.length === "number") {
        detection = maybeVideo.audioTracks.length > 0;
      } else if (typeof maybeVideo.mozHasAudio === "boolean") {
        detection = maybeVideo.mozHasAudio;
      }

      if (detection === null) {
        try {
          const stream = maybeVideo.captureStream?.() ?? maybeVideo.mozCaptureStream?.();
          if (stream) {
            const hasTrack = stream.getAudioTracks().length > 0;
            stream.getTracks().forEach((track) => track.stop());
            if (hasTrack) detection = true;
          }
        } catch {
          // Some browsers block stream capture before playback.
        }
      }

      if (detection === null && (maybeVideo.webkitAudioDecodedByteCount ?? 0) > 0) {
        detection = true;
      }

      settle(detection);
    };
    video.onerror = () => {
      window.clearTimeout(timerId);
      settle(null);
    };
    video.src = objectUrl;
  });
}

function InstantSpeechSetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { startInstantRecording, userPlan } = useTranscriptionModals();
  const [settings, setSettings] = useState<SharedSettingsState>(DEFAULT_SETTINGS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSettings(DEFAULT_SETTINGS);
    setSelectedFolderId(null);
    setIsStarting(false);
  }, [open]);

  async function handleStart() {
    if (isStarting) return;
    setIsStarting(true);
    const started = await startInstantRecording({
      lang: settings.mode === "mono" ? settings.langPrimary : undefined,
      langBilingual: settings.mode === "bi" ? (settings.langBilingual.length ? settings.langBilingual : ["auto"]) : undefined,
      translationLang: settings.realtimeTranslation ? settings.realtimeTranslationLang : undefined,
      folderId: selectedFolderId ?? undefined,
    });
    setIsStarting(false);
    if (!started) {
      toast.error("Microphone access is required to start recording.");
      return;
    }
    onClose();
    void router.navigate("/transcriptions/live", { state: { liveRecording: true } });
  }

  if (!open) return null;

  return (
    <>
      <ModalShell
        title="Instant speech"
        subtitle="Select recognition settings before recording"
        onClose={onClose}
        onBackdropClick={onClose}
        width={520}
      >
        <div className="px-[22px] py-[20px] flex flex-col gap-[18px]">
          <SharedSettings
            state={settings}
            onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
            userPlan={userPlan}
            onUpgradeClick={() => setUpgradeOpen(true)}
          />

          <div className="flex items-center justify-between gap-[8px]">
            <div style={{ minWidth: 0, maxWidth: "220px" }}>
              <FolderSelector value={selectedFolderId} onChange={setSelectedFolderId} compact />
            </div>
            <div className="flex items-center gap-[8px] shrink-0">
              <Button variant="pill-outline" onClick={onClose} className="h-[36px] px-[18px] transition-colors">
                <span className="font-medium text-[13px] text-foreground">Cancel</span>
              </Button>
              <Button
                onClick={() => { void handleStart(); }}
                disabled={isStarting}
                className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span className="font-semibold text-[13px]">
                  {isStarting ? "Starting..." : "Start recording"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </ModalShell>
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

function UploadFileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addJob, userPlan, consumePreloadedFiles } = useTranscriptionModals();

  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [settings, setSettings] = useState<SharedSettingsState>(DEFAULT_SETTINGS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const preloaded = consumePreloadedFiles();
      if (preloaded.length) {
        setFiles(prev => {
          const existing = new Set(prev.map(f => f.name + f.size));
          return [...prev, ...preloaded.filter(f => !existing.has(f.name + f.size))];
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetForm() { setFiles([]); setDragActive(false); setSettings(DEFAULT_SETTINGS); setSelectedFolderId(null); }
  function handleClose() { resetForm(); onClose(); }

  function addFiles(newFiles: File[]) {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...newFiles.filter(f => !existing.has(f.name + f.size))];
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  }

  async function handleSubmit() {
    if (!files.length) return;
    const prepared = await Promise.all(files.map(async (file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const isAudio = AUDIO_EXTS.includes(ext);
      let noAudioDetected = false;
      if (!isAudio) {
        const hasAudioTrack = await detectVideoHasAudioTrack(file);
        noAudioDetected = hasAudioTrack === false;
      }
      return { file, isAudio, noAudioDetected };
    }));

    prepared.forEach(({ file, isAudio, noAudioDetected }) => {
      addJob(file.name, isAudio ? "audio" : "video", {
        lang: settings.mode === "mono" ? settings.langPrimary : undefined,
        langBilingual: settings.mode === "bi" ? (settings.langBilingual.length ? settings.langBilingual : ["auto"]) : undefined,
        translationLang: settings.realtimeTranslation ? settings.realtimeTranslationLang : undefined,
        folderId: selectedFolderId ?? undefined,
        source: isAudio ? "mp3" : "mp4",
        mediaUrl: isAudio ? undefined : URL.createObjectURL(file),
        noAudioDetected: isAudio ? undefined : noAudioDetected,
      });
    });
    handleClose();
  }

  if (!open) return null;

  return (
    <>
      <ModalShell
        title="Audio & video files"
        subtitle="Upload audio or video files for transcription"
        onClose={handleClose}
        onBackdropClick={handleClose}
      >
        <div className="px-[22px] py-[20px] flex flex-col gap-[18px]">
          {/* Drop zone — clickable + drag-and-drop, shrinks after files added */}
          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`rounded-[12px] flex flex-col items-center justify-center cursor-pointer select-none border-2 border-dashed transition-all ${dragActive ? "border-primary bg-primary/5" : "border-border"}`}
            style={{
              height: files.length > 0 ? "88px" : "220px",
              transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <input ref={fileRef} type="file" multiple accept={ACCEPTED} className="hidden"
              onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) addFiles(f); e.target.value = ""; }} />
            <div className={`size-[34px] rounded-full flex items-center justify-center mb-[7px] ${dragActive ? "bg-primary/15" : "bg-primary/5"}`}>
              <svg className="size-[16px] text-primary" fill="none" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-medium text-[13px] text-foreground">
              Drop files here or <span className="text-primary">browse</span>
            </p>
            {files.length === 0 && (
              <p className="text-[11px] text-muted-foreground mt-[3px]">
                MP3, MP4, M4A, MOV, WAV, OGG · Max 1 GB audio / 10 GB video
              </p>
            )}
          </div>

          {/* File list + settings — fade in smoothly after first file */}
          <div style={{
            display: "grid",
            gridTemplateRows: files.length > 0 ? "1fr" : "0fr",
            opacity: files.length > 0 ? 1 : 0,
            transition: "grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
          }}>
            <div style={{ overflow: "hidden" }}>
              <div className="flex flex-col gap-[18px]">
                {/* File list */}
                <div className="flex flex-col gap-[6px]">
                  {files.map((file, i) => {
                    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                    const isAudio = AUDIO_EXTS.includes(ext);
                    return (
                      <div key={i} className="flex items-center gap-[10px] h-[48px] px-[12px] rounded-[12px] border border-border bg-card">
                        <div className={`size-[30px] rounded-[8px] flex items-center justify-center shrink-0 ${isAudio ? "bg-primary/5" : "bg-violet-500/5"}`}>
                          {isAudio ? (
                            <svg className="size-[14px] text-primary" fill="none" viewBox="0 0 24 24">
                              <path d="M9 18V5l12-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zM21 16a3 3 0 11-3-3 3 3 0 013 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg className="size-[14px]" fill="none" viewBox="0 0 24 24" style={{ color: "#7c3aed" }}>
                              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-[13px] text-foreground">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
                        </div>
                        <Button variant="ghost" size="icon"
                          onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                          className="size-[26px] rounded-full flex items-center justify-center transition-colors shrink-0 hover:bg-accent"
                        >
                          <svg className="size-[11px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
                            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {/* Settings */}
                <SharedSettings state={settings} onChange={p => setSettings(s => ({ ...s, ...p }))} userPlan={userPlan} onUpgradeClick={() => setUpgradeOpen(true)} />
              </div>
            </div>
          </div>

          {/* Footer: folder picker (left) + Cancel + Start (right) */}
          <div className="flex items-center justify-between gap-[8px]">
            <div style={{ minWidth: 0, maxWidth: "200px" }}>
              <FolderSelector value={selectedFolderId} onChange={setSelectedFolderId} compact />
            </div>
            <div className="flex items-center gap-[8px] shrink-0">
              <Button variant="pill-outline" onClick={handleClose} className="h-[36px] px-[18px] transition-colors">
                <span className="font-medium text-[13px] text-foreground">Cancel</span>
              </Button>
              <Button onClick={() => { void handleSubmit(); }} disabled={!files.length}
                className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span className="font-semibold text-[13px]">
                  {files.length > 1 ? `Start transcription · ${files.length} files` : "Start transcription"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </ModalShell>
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Waveform (used in recording UI)
// ════════════════════════════════════════════════════════════

const BAR_COUNT = 32;

function Waveform({ active }: { active: boolean }) {
  const [heights, setHeights] = useState<number[]>(() => Array(BAR_COUNT).fill(5));

  useEffect(() => {
    if (!active) { setHeights(Array(BAR_COUNT).fill(5)); return; }
    const id = setInterval(() => {
      setHeights(Array.from({ length: BAR_COUNT }, () => Math.random() * 28 + 4));
    }, 90);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height: "52px" }}>
      {heights.map((h, i) => (
        <div key={i} className="rounded-full"
          style={{ width: "3px", height: `${h}px`, backgroundColor: active ? "var(--primary)" : "#d1d5db", opacity: active ? 0.5 + (i % 5) * 0.1 : 0.4, transition: active ? "height 0.09s ease" : "height 0.3s ease" }} />
      ))}
    </div>
  );
}

function StopConfirmDialog({ open, onCancel, onStop }: { open: boolean; onCancel: () => void; onStop: () => void }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative rounded-[18px] w-[340px] p-[22px] flex flex-col gap-[16px] bg-popover"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
        <div>
          <p className="font-bold text-[15px] text-foreground">Recording in progress</p>
          <p className="text-[13px] text-muted-foreground mt-[6px] leading-relaxed">
            Recording is still in progress. Are you sure you want to close this window?
          </p>
        </div>
        <div className="flex gap-[8px]">
          <Button variant="pill-outline" onClick={onCancel} className="flex-1 h-[38px] transition-colors">
            <span className="font-medium text-[13px] text-foreground">Cancel</span>
          </Button>
          <Button variant="destructive" onClick={onStop} className="flex-1 h-[38px] rounded-full transition-colors">
            <span className="font-semibold text-[13px]">Stop & close</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ════════════════════════════════════════════════════════════
// Modal 3 — Transcribe from link
// ════════════════════════════════════════════════════════════

function isValidUrl(s: string) { try { new URL(s); return true; } catch { return false; } }

function detectLinkSource(url: string): SourceType {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("dropbox.com")) return "dropbox";
    if (host.includes("drive.google.com")) return "google-sheets";
  } catch {
    // ignore invalid URL, fallback below
  }
  return "mp4";
}

function detectMeetingSource(url: string): SourceType {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("zoom")) return "zoom";
    if (host.includes("meet.google")) return "google-meet";
    if (host.includes("teams.") || host.includes("microsoft")) return "teams";
  } catch {
    // ignore invalid URL, fallback below
  }
  return "zoom";
}

function LinkInputIcons() {
  return (
    <div className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 flex items-center gap-[8px]">
      <SourceIcon source="youtube" />
      <SourceIcon source="dropbox" />
      <span className="inline-flex items-center justify-center size-[18px]">
        <svg viewBox="0 0 24 24" fill="none" className="size-[16px]">
          <path d="M12 2l6 10H6L12 2z" fill="#0066DA" />
          <path d="M2 17l4-7h16l-4 7H2z" fill="#00AC47" />
          <path d="M6 10l6 12H6L2 17l4-7z" fill="#EA4335" />
        </svg>
      </span>
    </div>
  );
}

function TranscribeLinkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addJob, userPlan } = useTranscriptionModals();

  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [settings, setSettings] = useState<SharedSettingsState>(DEFAULT_SETTINGS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function resetForm() { setUrl(""); setUrlError(""); setSettings(DEFAULT_SETTINGS); setSelectedFolderId(null); }
  function handleClose() { resetForm(); onClose(); }

  function validateUrl(s: string) {
    if (!s) { setUrlError(""); return; }
    if (!isValidUrl(s)) setUrlError("Please enter a valid URL (e.g. https://youtube.com/watch?v=…)");
    else setUrlError("");
  }

  function handleSubmit() {
    if (!isValidUrl(url)) { validateUrl(url); return; }
    addJob(url.split("/").pop() || "Link transcription", "video", {
      lang: settings.mode === "mono" ? settings.langPrimary : undefined,
      langBilingual: settings.mode === "bi" ? (settings.langBilingual.length ? settings.langBilingual : ["auto"]) : undefined,
      translationLang: settings.realtimeTranslation ? settings.realtimeTranslationLang : undefined,
      folderId: selectedFolderId ?? undefined,
      source: detectLinkSource(url),
    });
    handleClose();
  }

  if (!open) return null;
  const canSubmit = url && isValidUrl(url);

  return (
    <>
      <ModalShell title="Transcribe from link" subtitle="YouTube, Dropbox, Google Drive and more" onClose={handleClose} onBackdropClick={handleClose}>
        <div className="px-[22px] py-[20px] flex flex-col gap-[18px]">
          <div>
            <SectionLabel>Paste a link</SectionLabel>
            <div className="relative">
              <svg className="absolute left-[12px] top-1/2 -translate-y-1/2 size-[15px] pointer-events-none text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Input type="url" placeholder="Paste the link here" value={url}
                onChange={e => { setUrl(e.target.value); if (urlError) validateUrl(e.target.value); }}
                onBlur={() => validateUrl(url)}
                className={`w-full h-[42px] pl-[36px] pr-[108px] rounded-[12px] text-sm ${urlError ? "border-destructive" : ""}`}
              />
              <LinkInputIcons />
            </div>
            {urlError && <p className="text-xs text-destructive mt-[5px]">{urlError}</p>}
          </div>

          {/* Settings — revealed smoothly after URL is typed */}
          <div style={{
            display: "grid",
            gridTemplateRows: url.length > 0 ? "1fr" : "0fr",
            opacity: url.length > 0 ? 1 : 0,
            transition: "grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
          }}>
            <div style={{ overflow: "hidden" }}>
              <div className="flex flex-col gap-[18px]">
                <SharedSettings state={settings} onChange={p => setSettings(s => ({ ...s, ...p }))} userPlan={userPlan} onUpgradeClick={() => setUpgradeOpen(true)} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-[8px]">
            <div style={{ minWidth: 0, maxWidth: "200px" }}>
              <FolderSelector value={selectedFolderId} onChange={setSelectedFolderId} compact />
            </div>
            <div className="flex items-center gap-[8px] shrink-0">
              <Button variant="pill-outline" onClick={handleClose} className="h-[36px] px-[18px] transition-colors">
                <span className="font-medium text-[13px] text-foreground">Cancel</span>
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}
                className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span className="font-semibold text-[13px]">Start transcription</span>
              </Button>
            </div>
          </div>
        </div>
      </ModalShell>
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Modal 4 — Meeting via bot
// ════════════════════════════════════════════════════════════

function MeetingBotModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addJob, meetingCounterRef } = useTranscriptionModals();

  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingUrlError, setMeetingUrlError] = useState("");
  const [meetingName, setMeetingName] = useState(`Meeting ${meetingCounterRef.current}`);
  const [langId, setLangId] = useState("auto");
  const [mode, setMode] = useState<"mono" | "bi">("mono");
  const [langBilingual, setLangBilingual] = useState<string[]>(["auto"]);
  const [botName, setBotName] = useState("TranscribeToText Bot");
  const [realTimeTranslation, setRealTimeTranslation] = useState(false);
  const [realTimeTranslationLang, setRealTimeTranslationLang] = useState("en");
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [speakerCount, setSpeakerCount] = useState<number | "auto">(2);
  const [notifyParticipants, setNotifyParticipants] = useState(true);
  const [notifyMessage, setNotifyMessage] = useState("I'm recording this meeting with TranscribeToText for note-taking purposes.");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  function resetForm() {
    setMeetingUrl(""); setMeetingUrlError(""); meetingCounterRef.current += 1;
    setMeetingName(`Meeting ${meetingCounterRef.current}`); setLangId("auto"); setMode("mono"); setLangBilingual(["auto"]);
    setBotName("TranscribeToText Bot"); setRealTimeTranslation(false); setRealTimeTranslationLang("en");
    setSpeakerEnabled(false); setSpeakerCount(2);
    setSelectedFolderId(null);
    setNotifyParticipants(true);
    setNotifyMessage("I'm recording this meeting with TranscribeToText for note-taking purposes.");
  }

  function handleClose() { resetForm(); onClose(); }
  function validateMeetingUrl(s: string) {
    if (!s) { setMeetingUrlError(""); return; }
    if (!isValidUrl(s)) setMeetingUrlError("Please enter a valid meeting invite link");
    else setMeetingUrlError("");
  }
  function handleSubmit() {
    if (!isValidUrl(meetingUrl)) { validateMeetingUrl(meetingUrl); return; }
    addJob(meetingName || "Meeting", "video", {
      lang: mode === "mono" ? langId : undefined,
      langBilingual: mode === "bi" ? (langBilingual.length ? langBilingual : ["auto"]) : undefined,
      translationLang: realTimeTranslation ? realTimeTranslationLang : undefined,
      folderId: selectedFolderId ?? undefined,
      source: detectMeetingSource(meetingUrl),
    });
    handleClose();
  }

  if (!open) return null;
  const canSubmit = meetingUrl && isValidUrl(meetingUrl);

  return (
    <>
      <ModalShell title="Record meeting" subtitle="A bot will join and transcribe your meeting" onClose={handleClose} onBackdropClick={handleClose} width={520}>
        <div className="px-[22px] py-[20px] flex flex-col gap-[18px]">
          {/* Intro banner */}
          <div className="rounded-[12px] p-[14px] flex gap-[11px] bg-primary/5 border border-primary/15">
            <svg className="size-[16px] shrink-0 mt-[2px] text-primary" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" /><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <p className="text-[13px] text-primary leading-relaxed">
              The bot will wait up to <strong>5 minutes</strong> for host approval.{" "}
              <a href="#" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>Tutorial</a>
              {" · "}
              <a href="#" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>Connect Google Calendar</a>
            </p>
          </div>

          {/* Meeting link */}
          <div>
            <SectionLabel>Meeting invite link</SectionLabel>
            <div className="relative">
              <Input type="url" placeholder="Paste the meeting invite link here" value={meetingUrl}
                onChange={e => { setMeetingUrl(e.target.value); if (meetingUrlError) validateMeetingUrl(e.target.value); }}
                onBlur={() => validateMeetingUrl(meetingUrl)}
                className={`w-full h-[42px] pl-[14px] pr-[98px] rounded-[12px] text-sm ${meetingUrlError ? "border-destructive" : ""}`}
              />
              <div className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 flex items-center gap-[8px]">
                <SourceIcon source="zoom" />
                <SourceIcon source="google-meet" />
                <SourceIcon source="teams" />
              </div>
            </div>
            {meetingUrlError && <p className="text-xs text-destructive mt-[5px]">{meetingUrlError}</p>}
          </div>

          {/* Language + Advanced options — revealed after URL is typed */}
          <div style={{
            display: "grid",
            gridTemplateRows: meetingUrl.length > 0 ? "1fr" : "0fr",
            opacity: meetingUrl.length > 0 ? 1 : 0,
            transition: "grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
          }}>
            <div style={{ overflow: "hidden" }}>
              <div className="flex flex-col gap-[18px] pb-[2px]">
                {/* Language row */}
                <div className="flex items-end gap-[6px]">
                  <div className="flex-1 min-w-0">
                    {mode === "mono"
                      ? <LanguageSelector value={langId} onChange={setLangId} label="Transcription language" />
                      : <MultiLanguageSelector values={langBilingual} onChange={setLangBilingual} label="Transcription languages" />}
                  </div>
                  <TranscriptionModeToggle
                    mode={mode}
                    onChange={m => { setMode(m); if (m === "mono") setLangId("auto"); else setLangBilingual(["auto"]); }}
                    compact
                  />
                </div>
                {/* Advanced options */}
                <AdvancedSection>
                  <div className="flex flex-col gap-[14px] pt-[2px]">
                    <SpeakerSection enabled={speakerEnabled} onToggle={() => setSpeakerEnabled(v => !v)} count={speakerCount} onCountChange={setSpeakerCount} />
                    <div>
                      <SectionLabel>Bot display name</SectionLabel>
                      <Input type="text" value={botName} onChange={e => setBotName(e.target.value)}
                        className="w-full h-[40px] px-[14px] rounded-[12px] text-[13px]"
                      />
                    </div>
                    <RealTimeTranslationControl
                      enabled={realTimeTranslation}
                      onToggle={() => setRealTimeTranslation(v => !v)}
                      lang={realTimeTranslationLang}
                      onLangChange={setRealTimeTranslationLang}
                      withCard={false}
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[13px] text-foreground">Notify participants</span>
                        <ToggleSw checked={notifyParticipants} onChange={() => setNotifyParticipants(v => !v)} />
                      </div>
                      {notifyParticipants && (
                        <Textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={3}
                          className="w-full px-[12px] py-[10px] rounded-[9px] resize-none transition-all mt-[10px] text-[13px] leading-relaxed text-foreground bg-transparent border border-input"
                        />
                      )}
                    </div>
                  </div>
                </AdvancedSection>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-[8px]">
            <div style={{ minWidth: 0, maxWidth: "200px" }}>
              <FolderSelector value={selectedFolderId} onChange={setSelectedFolderId} compact />
            </div>
            <div className="flex items-center gap-[8px] shrink-0">
              <Button variant="pill-outline" onClick={handleClose} className="h-[36px] px-[18px] transition-colors">
                <span className="font-medium text-[13px] text-foreground">Cancel</span>
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}
                className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span className="font-semibold text-[13px]">Transcribe now</span>
              </Button>
            </div>
          </div>
        </div>
      </ModalShell>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Instant recording — floating pill widget
// ════════════════════════════════════════════════════════════

const MINI_BAR_COUNT = 28;

function MiniWaveform({ active, fill = false }: { active: boolean; fill?: boolean }) {
  const [heights, setHeights] = useState<number[]>(() => Array(MINI_BAR_COUNT).fill(4));
  useEffect(() => {
    if (!active) { setHeights(Array(MINI_BAR_COUNT).fill(4)); return; }
    const id = setInterval(() => {
      setHeights(Array.from({ length: MINI_BAR_COUNT }, () => Math.random() * 14 + 3));
    }, 90);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className={`${fill ? "grid grid-flow-col auto-cols-fr" : "flex"} w-full items-center gap-[2px]`} style={{ height: "18px" }}>
      {heights.map((h, i) => (
        <div key={i} className="rounded-full"
          style={{ width: fill ? "100%" : "2px", height: `${h}px`, backgroundColor: active ? "var(--primary)" : "#d1d5db", opacity: active ? 0.5 + (i % 5) * 0.1 : 0.4, transition: active ? "height 0.09s ease" : "height 0.3s ease" }} />
      ))}
    </div>
  );
}

function RecordingMicrophoneSelect({ compact = false }: { compact?: boolean }) {
  const {
    microphoneDevices,
    selectedMicrophoneId,
    switchRecordingMicrophone,
    isSwitchingMicrophone,
  } = useTranscriptionModals();
  const selectedMic = microphoneDevices.find((d) => d.id === selectedMicrophoneId);
  const triggerLabel = isSwitchingMicrophone
    ? "Switching microphone..."
    : (selectedMic?.label || (microphoneDevices.length ? "Select microphone" : "No microphone detected"));

  return (
    <Select
      value={selectedMicrophoneId || undefined}
      onValueChange={(deviceId) => { void switchRecordingMicrophone(deviceId); }}
      disabled={!microphoneDevices.length || isSwitchingMicrophone}
    >
      <SelectTrigger
        className={compact
          ? "h-[32px] w-full rounded-[10px] border-input bg-transparent px-[9px] gap-[6px]"
          : "h-[36px] w-full rounded-[12px] border-input bg-transparent px-[12px] gap-[8px]"}
      >
        <span className={`flex min-w-0 items-center ${compact ? "gap-[6px]" : "gap-[8px]"}`}>
          <span className={compact ? "scale-[0.88]" : ""}>
            <SourceIcon source="microphone" />
          </span>
          <span className={`truncate text-foreground ${compact ? "text-[12px]" : "text-[13px]"}`}>{triggerLabel}</span>
        </span>
      </SelectTrigger>
      <SelectContent className="z-[10000] max-w-[calc(100vw-32px)] rounded-[12px]">
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
  );
}

function RecordingPill() {
  const { recordingPhase, recordingElapsed, pauseInstantRecording, resumeInstantRecording, stopInstantRecording, recordingDetailOpen } = useTranscriptionModals();
  const visible = recordingPhase === "recording" || recordingPhase === "paused";
  const isPaused = recordingPhase === "paused";
  if (!visible || recordingDetailOpen) return null;
  return createPortal(
    <div className="fixed" style={{ bottom: "24px", right: "24px", zIndex: 9999 }}>
      <div className="w-[min(320px,calc(100vw-24px))] rounded-[22px] border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between gap-[10px] px-[12px] pt-[10px] pb-[8px]">
          <div className="flex min-w-0 flex-1 items-center gap-[8px]">
            {/* Status dot */}
            <span className="relative flex size-[8px] shrink-0">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${!isPaused ? "animate-ping" : ""}`}
                style={{ backgroundColor: isPaused ? undefined : "#f87171" }} />
              <span className={`relative inline-flex size-[8px] rounded-full ${isPaused ? "bg-muted-foreground" : ""}`}
                style={{ backgroundColor: isPaused ? undefined : "#ef4444" }} />
            </span>
            {/* Label */}
            <span className={`font-semibold text-[12px] ${isPaused ? "text-muted-foreground" : "text-destructive"}`}>
              {isPaused ? "Paused" : "Recording"}
            </span>
            {/* Timer */}
            <span className="font-bold text-[14px] text-foreground tracking-wide tabular-nums min-w-[40px]">
              {fmtTime(recordingElapsed)}
            </span>
          </div>
          {/* Mini waveform */}
          <div className="flex min-w-[56px] flex-1">
            <MiniWaveform active={!isPaused} fill />
          </div>

          <div className="flex items-center gap-[6px] shrink-0">
            {/* Expand */}
            <Button variant="ghost" size="icon"
              onClick={() => { void router.navigate("/transcriptions/live", { state: { liveRecording: true } }); }}
              className="flex items-center justify-center size-[28px] rounded-full transition-colors shrink-0 bg-muted hover:bg-accent"
              title="Open live details"
            >
              <svg className="size-[10px] text-foreground" fill="none" viewBox="0 0 24 24">
                <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
            {/* Pause / Resume */}
            <Button variant="ghost" size="icon"
              onClick={isPaused ? resumeInstantRecording : pauseInstantRecording}
              className="flex items-center justify-center size-[28px] rounded-full transition-colors shrink-0 bg-muted hover:bg-accent"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused
                ? <svg className="size-[11px] text-foreground" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
                : <svg className="size-[11px] text-foreground" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              }
            </Button>
            {/* Stop */}
            <Button variant="ghost" size="icon"
              onClick={stopInstantRecording}
              className="flex items-center justify-center size-[28px] rounded-full transition-colors shrink-0 bg-destructive/10 hover:bg-destructive/20"
              title="Stop recording"
            >
              <svg className="size-[9px] text-destructive" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="10" height="10" rx="2" /></svg>
            </Button>
          </div>
        </div>

        <div className="border-t border-border/70 px-[10px] pt-[8px] pb-[10px]">
          <div className="w-full">
            <RecordingMicrophoneSelect compact />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ════════════════════════════════════════════════════════════
// Instant recording — review modal (post-stop)
// ════════════════════════════════════════════════════════════

// ── Recording review card with playback ──────────────────────
const REVIEW_BARS = 60;

function RecordingCard({ elapsed, audioUrl, onContinue }: {
  elapsed: number;
  audioUrl: string | null;
  onContinue: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1

  const bars = useMemo(() => Array.from({ length: REVIEW_BARS }, (_, i) => {
    const pseudo = ((elapsed * 31 + i * 17 + 7) * 1664525 + 1013904223) & 0x7fffffff;
    const envelope = 1 - Math.abs((i / (REVIEW_BARS - 1)) * 2 - 1) * 0.38;
    return Math.round(((pseudo % 100) / 100) * 26 * envelope + 5);
  }), [elapsed]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  }

  function handleScrubClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * (audioRef.current.duration || elapsed);
    setProgress(pct);
  }

  const currentSec = Math.round(progress * elapsed);

  return (
    <div className="rounded-[16px] overflow-hidden bg-card border border-border shadow-sm">

      {/* Top row: label · duration · play · continue */}
      <div className="flex items-center justify-between px-[18px] pt-[14px] pb-[8px]">
        <div className="flex items-center gap-[7px]">
          <span className="size-[7px] rounded-full shrink-0 bg-destructive" />
          <span className="font-semibold text-[11px] text-muted-foreground tracking-wide uppercase">Recording complete</span>
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="font-bold text-[18px] text-foreground tabular-nums">{fmtDuration(elapsed)}</span>
          {audioUrl && (
            <Button variant="ghost" size="icon" onClick={togglePlay}
              className="flex items-center justify-center size-[28px] rounded-full transition-colors shrink-0 bg-muted hover:bg-accent"
              title={isPlaying ? "Pause" : "Play back recording"}
            >
              {isPlaying
                ? <svg className="size-[10px] text-foreground" fill="currentColor" viewBox="0 0 12 12"><rect x="2" y="2" width="3" height="8" rx="1"/><rect x="7" y="2" width="3" height="8" rx="1"/></svg>
                : <svg className="size-[11px] text-foreground" fill="currentColor" viewBox="0 0 12 12"><polygon points="2,1 11,6 2,11"/></svg>
              }
            </Button>
          )}
          <Button variant="ghost" onClick={onContinue}
            className="h-[28px] px-[11px] rounded-full flex items-center gap-[5px] transition-colors shrink-0 bg-destructive/10 hover:bg-destructive/15"
            title="Continue recording"
          >
            <span className="size-[6px] rounded-full shrink-0 animate-pulse bg-destructive" />
            <span className="font-semibold text-[11px] text-destructive">Continue</span>
          </Button>
        </div>
      </div>

      {/* Waveform scrubber */}
      <div className="px-[18px] pb-[4px] relative cursor-pointer select-none" onClick={handleScrubClick} style={{ height: "52px" }}>
        <div className="flex items-center absolute inset-x-[18px] inset-y-0 gap-[1.5px]">
          {bars.map((h, i) => {
            const barPct = i / (REVIEW_BARS - 1);
            const played = barPct <= progress;
            return (
              <div key={i} className="rounded-full flex-1"
                style={{ height: `${h}px`, backgroundColor: played ? "#ef4444" : "#dde1e9", opacity: played ? 0.65 + (i % 4) * 0.07 : 0.55 }} />
            );
          })}
        </div>
        {/* Playhead */}
        {progress > 0 && (
          <div className="absolute top-[6px] bottom-[6px] w-[2px] rounded-full pointer-events-none"
            style={{ left: `calc(18px + ${progress * 100}% * (100% - 36px) / 100%)`, backgroundColor: "#ef4444", opacity: 0.9, boxShadow: "0 0 4px rgba(239,68,68,0.4)" }} />
        )}
      </div>

      {/* Time labels */}
      <div className="flex items-center justify-between px-[18px] pb-[12px]">
        <span className="text-[10px] text-muted-foreground tabular-nums">{fmtTime(currentSec)}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{fmtTime(elapsed)}</span>
      </div>

      {audioUrl && (
        <audio ref={audioRef} src={audioUrl}
          onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime / (audioRef.current.duration || elapsed || 1)); }}
          onEnded={() => { setIsPlaying(false); setProgress(0); }}
        />
      )}
    </div>
  );
}

function RecordingReviewModal() {
  const { recordingPhase, recordingElapsed, audioUrl, cancelInstantRecording, submitInstantRecording, resumeInstantRecording, userPlan } = useTranscriptionModals();
  const [settings, setSettings] = useState<SharedSettingsState>(DEFAULT_SETTINGS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (recordingPhase === "review") {
      setSettings(DEFAULT_SETTINGS);
      setSelectedFolderId(null);
      setDiscardConfirm(false);
    }
  }, [recordingPhase]);

  if (recordingPhase !== "review") return null;

  function handleCancel() { setDiscardConfirm(true); }
  function handleDiscard() { cancelInstantRecording(); setDiscardConfirm(false); }
  function handleSubmit() {
    submitInstantRecording({
      lang: settings.mode === "mono" ? settings.langPrimary : undefined,
      langBilingual: settings.mode === "bi" ? (settings.langBilingual.length ? settings.langBilingual : ["auto"]) : undefined,
      translationLang: settings.realtimeTranslation ? settings.realtimeTranslationLang : undefined,
      folderId: selectedFolderId ?? undefined,
    });
  }

  return (
    <>
      <ModalShell title="Record audio" subtitle="Review and submit your recording" onClose={handleCancel} onBackdropClick={handleCancel}>
        <div className="px-[22px] py-[20px] flex flex-col gap-[18px]">
          <RecordingCard elapsed={recordingElapsed} audioUrl={audioUrl} onContinue={resumeInstantRecording} />

          <SharedSettings state={settings} onChange={p => setSettings(s => ({ ...s, ...p }))} userPlan={userPlan} onUpgradeClick={() => setUpgradeOpen(true)} />

          <div className="flex items-center justify-between gap-[8px]">
            <div style={{ minWidth: 0, maxWidth: "200px" }}>
              <FolderSelector value={selectedFolderId} onChange={setSelectedFolderId} compact />
            </div>
            <div className="flex items-center gap-[8px] shrink-0">
              <Button variant="pill-outline" onClick={handleCancel} className="h-[36px] px-[18px] transition-colors">
                <span className="font-medium text-[13px] text-foreground">Cancel</span>
              </Button>
<Button onClick={handleSubmit}
                className="h-[36px] px-[18px] rounded-full transition-all bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span className="font-semibold text-[13px]">Start transcription</span>
              </Button>
            </div>
          </div>
        </div>
      </ModalShell>

      {/* Discard confirm */}
      {discardConfirm && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDiscardConfirm(false)} />
          <div className="relative rounded-[18px] w-[340px] p-[22px] flex flex-col gap-[16px] bg-popover"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
            <div>
              <p className="font-bold text-[15px] text-foreground">Discard recording?</p>
              <p className="text-[13px] text-muted-foreground mt-[6px] leading-relaxed">
                Your recording will be permanently discarded and cannot be recovered.
              </p>
            </div>
            <div className="flex gap-[8px]">
              <Button variant="pill-outline" onClick={() => setDiscardConfirm(false)} className="flex-1 h-[38px] transition-colors">
                <span className="font-medium text-[13px] text-foreground">Keep recording</span>
              </Button>
              <Button variant="destructive" onClick={handleDiscard} className="flex-1 h-[38px] rounded-full transition-colors">
                <span className="font-semibold text-[13px]">Discard</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Modal router
// ════════════════════════════════════════════════════════════

function AllModals() {
  const { openModal, setOpenModal } = useTranscriptionModals();
  const close = () => setOpenModal(null);
  return (
    <>
      <InstantSpeechSetupModal open={openModal === "record"} onClose={close} />
      <UploadFileModal open={openModal === "upload"} onClose={close} />
      <TranscribeLinkModal open={openModal === "link"} onClose={close} />
      <MeetingBotModal open={openModal === "meeting"} onClose={close} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Floating Progress Widget
// ════════════════════════════════════════════════════════════

export function FloatingProgressWidget() {
  const { jobs, retryJob } = useTranscriptionModals();
  const [expanded, setExpanded] = useState(false); // false = collapsed pill, true = full widget
  const [dismissed, setDismissed] = useState(false);
  const widgetJobs = useMemo(
    () => jobs.filter((job) => job.source !== "microphone"),
    [jobs]
  );

  const hasJobs = widgetJobs.length > 0;
  const newestJobId = widgetJobs[0]?.id ?? null;
  const allDone = hasJobs && widgetJobs.every(j => j.status === "done" || j.status === "error");
  const activeCount = widgetJobs.filter(j => j.status === "uploading" || j.status === "processing").length;
  const uploadingCount = widgetJobs.filter(j => j.status === "uploading").length;
  const processingCount = widgetJobs.filter(j => j.status === "processing").length;
  const doneCount = widgetJobs.filter(j => j.status === "done" || j.status === "error").length;
  const errorCount = widgetJobs.filter(j => j.status === "error").length;

  // Re-open the floating pill whenever a new upload job is added.
  useEffect(() => {
    if (!newestJobId) return;
    setDismissed(false);
    setExpanded(false);
  }, [newestJobId]);

  if (!hasJobs || dismissed) return null;

  const rowBorder = "1px solid var(--border)";

  // ── Collapsed pill ──
  const pillLabel = allDone
    ? errorCount > 0
      ? `Completed with errors (${doneCount}/${widgetJobs.length})`
      : `Upload complete! (${doneCount}/${widgetJobs.length})`
    : processingCount > 0
      ? uploadingCount > 0
        ? `Uploading ${uploadingCount} • Transcribing ${processingCount}`
        : `Transcribing… (${doneCount}/${widgetJobs.length})`
      : `Uploading… (${doneCount}/${widgetJobs.length})`;

  const pillBg = allDone
    ? errorCount > 0 ? "#f59e0b" : undefined
    : undefined;

  if (!expanded) {
    return createPortal(
      <div className="fixed bottom-[24px] right-[24px] z-[150] flex flex-col items-end gap-[0px]">
        <Button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-[8px] h-[40px] px-[16px] rounded-full shadow-lg transition-all bg-primary text-primary-foreground hover:opacity-90"
          style={{ backgroundColor: pillBg ?? undefined, boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}
        >
          {/* Status icon */}
          {allDone ? (
            <svg className="size-[15px] shrink-0" fill="none" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="size-[14px] shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
              <path d="M12 3a9 9 0 019 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
          <span className="font-semibold text-[13px]">{pillLabel}</span>
          {/* Chevron up */}
          <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16">
            <path d="M4 10l4-4 4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>,
      document.body
    );
  }

  // ── Full expanded widget ──
  return createPortal(
    <div
      className="fixed bottom-[24px] right-[24px] z-[150] flex flex-col rounded-[16px] overflow-hidden bg-popover border border-border"
      style={{ width: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.06)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-[16px] h-[42px] shrink-0 border-b border-border">
        <div className="flex items-center gap-[7px]">
          <span className="font-semibold text-xs text-foreground">Uploaded records</span>
          {activeCount > 0 && (
            <span className="font-semibold text-xs text-foreground">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-[1px]">
          {/* Collapse to pill */}
          <Button variant="ghost" size="icon" onClick={() => setExpanded(false)} title="Collapse"
            className="size-[24px] rounded-full flex items-center justify-center transition-colors hover:bg-accent">
            <svg className="size-[11px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          {/* Dismiss */}
          <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} title="Dismiss"
            className="size-[24px] rounded-full flex items-center justify-center transition-colors hover:bg-accent">
            <svg className="size-[11px] text-muted-foreground" fill="none" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Button>
        </div>
      </div>

      {/* ── Column headers (mini table) ── */}
      <>
          <div className="flex items-center px-[14px] h-[32px] shrink-0"
            style={{ borderBottom: rowBorder }}>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">File</span>
            </div>
            <div className="w-[44px] shrink-0 text-center">
              <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">Lang</span>
            </div>
            <div className="w-[52px] shrink-0 text-center">
              <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">Transl.</span>
            </div>
            <div className="w-[52px] shrink-0 text-right">
              <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">Dur.</span>
            </div>
            <div className="w-[160px] shrink-0 text-right">
              <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">Status</span>
            </div>
          </div>

          {/* ── Job rows ── */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {widgetJobs.map((job, idx) => {
              const isActive = job.status === "uploading" || job.status === "processing";
              const isDone = job.status === "done";
              const isError = job.status === "error";
              const errLabel = job.errorType ? (ERROR_LABELS[job.errorType] ?? "Upload failed") : "Upload failed";
              const uploadPct = Math.max(0, Math.min(100, Math.round(job.uploadProgress ?? (job.status === "uploading" ? job.progress : 100))));
              const transcribePct = Math.max(0, Math.min(100, Math.round(job.transcriptionProgress ?? (job.status === "processing" ? job.progress : (job.status === "done" ? 100 : 0)))));
              const phaseLabel = job.status === "uploading" ? "Uploading" : "Transcribing";
              const phasePct = job.status === "uploading" ? uploadPct : transcribePct;

              return (
                <div key={job.id} className="relative" style={{ borderTop: idx > 0 ? rowBorder : "none" }}>
                  {/* Main row */}
                  <div className={`flex items-center gap-[8px] px-[14px] pt-[9px] pb-[10px] ${isError ? "bg-destructive/5" : ""}`}>
                    {/* File type icon */}
                    <div className={`size-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${job.fileType === "audio" ? "bg-primary/5" : "bg-violet-500/5"}`}>
                      {job.fileType === "audio" ? (
                        <svg className="size-[12px] text-primary" fill="none" viewBox="0 0 24 24">
                          <path d="M9 18V5l12-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zM21 16a3 3 0 11-3-3 3 3 0 013 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="size-[12px]" fill="none" viewBox="0 0 24 24" style={{ color: "#7c3aed" }}>
                          <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`truncate font-medium text-xs ${isError ? "text-destructive" : "text-foreground"}`} title={job.name}>
                        {job.name}
                      </p>
                      {isActive && (
                        <p className="text-[10px] text-muted-foreground mt-[1px]">
                          {phaseLabel} {phasePct}%
                        </p>
                      )}
                      {isError && (
                        <p className="text-[10px] text-destructive mt-[1px]">
                          {errLabel}
                        </p>
                      )}
                    </div>

                    {/* Lang column */}
                    <div className="w-[44px] shrink-0 flex items-center justify-center">
                      {job.langBilingual && job.langBilingual.length > 0 ? (
                        <div className="flex gap-[1px]">
                          {job.langBilingual.slice(0, 2).map(id => {
                            const l = LANGUAGES.find(l => l.id === id);
                            return <span key={id} className="text-[12px]">{l?.flag ?? id.toUpperCase()}</span>;
                          })}
                        </div>
                      ) : job.lang ? (
                        <div className="flex items-center gap-[2px]">
                          <span className="text-[12px]">{LANGUAGES.find(l => l.id === job.lang)?.flag ?? ""}</span>
                          <span className="font-medium text-[10px] text-muted-foreground">{job.lang === "auto" ? "Auto" : job.lang.toUpperCase()}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Translation column */}
                    <div className="w-[52px] shrink-0 flex items-center justify-center">
                      {job.translationLang ? (
                        <div className="flex items-center gap-[2px]">
                          <span className="text-[12px]">{LANGUAGES.find(l => l.id === job.translationLang)?.flag ?? ""}</span>
                          <span className="font-medium text-[10px] text-muted-foreground">{job.translationLang.toUpperCase()}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="w-[52px] shrink-0 text-right">
                      <span className="text-[11px] text-muted-foreground">
                        {job.duration ?? (isDone || isError ? "—" : "")}
                      </span>
                    </div>

                    {/* Status area */}
                    <div className="w-[160px] shrink-0 flex items-center justify-end gap-[5px]">
                      {isActive && (
                        <div className="flex items-center gap-[8px] w-full">
                          <span className="min-w-[56px] text-[10px] text-muted-foreground text-right">{job.status === "uploading" ? "Upload" : "Transcribe"}</span>
                          <div className="h-[6px] flex-1 rounded-full overflow-hidden bg-muted">
                            <div className="h-full transition-all duration-300"
                              style={{
                                width: `${phasePct}%`,
                                background: job.status === "processing"
                                  ? "linear-gradient(90deg,#2563eb,#7c3aed)"
                                  : "var(--primary)",
                              }} />
                          </div>
                          <span className="font-medium text-[11px] text-primary min-w-[30px] text-right">
                            {phasePct}%
                          </span>
                        </div>
                      )}
                      {isDone && (
                        <>
                          <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.4" />
                            <path d="M8 12.5l2.5 2.5 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <Button variant="ghost"
                            onClick={() => {
                              const recordState = mapJobToRecordState(job);
                              try {
                                window.sessionStorage.setItem(`uploaded-record:${job.id}`, JSON.stringify(recordState));
                              } catch {
                                // best-effort cache; navigation should still work without it
                              }
                              window.location.assign(`/transcriptions/${job.id}`);
                            }}
                            className="transition-colors font-semibold text-[11px] text-primary hover:underline p-0 h-auto"
                          >
                            Open
                          </Button>
                        </>
                      )}
                      {isError && (
                        <>
                          <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.4" />
                            <path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                          <Button variant="ghost"
                            onClick={() => retryJob(job.id)}
                            className="transition-colors font-semibold text-[11px] text-destructive hover:underline p-0 h-auto"
                          >
                            Retry
                          </Button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </>
    </div>,
    document.body
  );
}
