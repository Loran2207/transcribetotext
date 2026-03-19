import {
  useState, useRef, useEffect,
  createContext, useContext,
} from "react";
import { createPortal } from "react-dom";
import { useTheme } from "./theme-context";
import { getDarkPalette } from "./dark-palette";
import { SourceIcon } from "./source-icons";

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

export type ModalType = "upload" | "record" | "link" | "meeting" | null;
export type UserPlan = "free" | "pro";

export interface TranscriptionJob {
  id: string;
  name: string;
  duration?: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  fileType: "audio" | "video";
  errorType?: "no_audio" | "corrupt" | "too_long" | "network";
  lang?: string;
  langBilingual?: string[];
  translationLang?: string;
}

const ERROR_LABELS: Record<string, string> = {
  no_audio: "No audio track found",
  corrupt: "File appears to be corrupted",
  too_long: "Exceeds 5-hour limit",
  network: "Network error — upload failed",
};

interface CtxValue {
  openModal: ModalType;
  setOpenModal: (m: ModalType) => void;
  jobs: TranscriptionJob[];
  addJob: (name: string, fileType: "audio" | "video", opts?: { lang?: string; langBilingual?: string[]; translationLang?: string }) => void;
  retryJob: (id: string) => void;
  meetingCounterRef: React.MutableRefObject<number>;
  userPlan: UserPlan;
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
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const meetingCounterRef = useRef(1);

  function simulateJob(id: string) {
    let p = 0;
    const tick = () => {
      p += Math.random() * 7 + 1.5;
      if (p >= 100) {
        const rand = Math.random();
        if (rand < 0.18) {
          const errTypes = ["no_audio", "corrupt", "too_long", "network"] as const;
          const errorType = errTypes[Math.floor(Math.random() * errTypes.length)];
          setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: 100, status: "error", errorType } : j));
        } else {
          setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: 100, status: "done", duration: randomDuration() } : j));
        }
      } else {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: Math.round(p), status: p > 55 ? "processing" : "uploading" } : j));
        setTimeout(tick, 350 + Math.random() * 200);
      }
    };
    setTimeout(tick, 500);
  }

  function addJob(name: string, fileType: "audio" | "video", opts?: { lang?: string; langBilingual?: string[]; translationLang?: string }) {
    const id = Math.random().toString(36).slice(2, 10);
    setJobs(prev => [{ id, name, progress: 0, status: "uploading", fileType, ...opts }, ...prev]);
    simulateJob(id);
  }

  function retryJob(id: string) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: 0, status: "uploading", duration: undefined } : j));
    simulateJob(id);
  }

  return (
    <Ctx.Provider value={{ openModal, setOpenModal, jobs, addJob, retryJob, meetingCounterRef, userPlan }}>
      {children}
      <AllModals />
      <FloatingProgressWidget />
    </Ctx.Provider>
  );
}

function randomDuration() {
  return `${Math.floor(Math.random() * 44 + 1)}m ${Math.floor(Math.random() * 59)}s`;
}

// ═════���══════════════════════════════════════════════════════
// Design tokens helper
// ════════════════════════════════════════════════════════════

/** Consistent input/select/textarea base style */
function useInputStyle() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  return {
    base: {
      fontFamily: "'Inter', sans-serif" as const,
      fontSize: "14px",
      color: c.textSecondary,
      backgroundColor: isDark ? "#111115" : "white",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#dde1e9"}`,
    },
    focus(el: HTMLElement, error = false) {
      el.style.borderColor = error ? "#ef4444" : "#2563eb";
      el.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.08)" : "0 0 0 3px rgba(37,99,235,0.08)";
    },
    blur(el: HTMLElement, error = false) {
      el.style.borderColor = error ? "#ef4444" : (isDark ? "rgba(255,255,255,0.1)" : "#dde1e9");
      el.style.boxShadow = "none";
    },
  };
}

// ══════════════════════════════════════════════════════════�����═
// Shared atoms
// ════════════════════════════════════════════════════════════

function ToggleSw({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      role="switch" aria-checked={checked}
      className="relative inline-flex shrink-0 h-[22px] w-[40px] rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? "#2563eb" : "#d1d5db" }}
    >
      <span className="absolute size-[18px] rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)", top: "2px" }} />
    </button>
  );
}

function XBtn({ onClick }: { onClick: () => void }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  return (
    <button onClick={onClick} aria-label="Close"
      className="size-[28px] rounded-full flex items-center justify-center transition-colors flex-shrink-0"
      style={{ backgroundColor: "transparent" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.07)" : "#f0f1f4"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
    >
      <svg className="size-[13px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Clean, non-uppercase section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  return (
    <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textMuted, marginBottom: "7px" }}>
      {children}
    </p>
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const inp = useInputStyle();

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
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-[8px] h-[40px] px-[14px] rounded-full transition-all"
        style={{ ...inp.base }}
      >
        <span className="text-[15px]">{selected.flag}</span>
        <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "14px", color: c.textSecondary }}>{selected.label}</span>
        <svg className={`size-[12px] transition-transform shrink-0 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] rounded-[12px] overflow-hidden"
          style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
          <div className="p-[8px] pb-[4px]">
            <div className="relative">
              <svg className="absolute left-[9px] top-1/2 -translate-y-1/2 size-[13px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
                <path d="M7 12A5 5 0 107 2a5 5 0 000 10zM13 13l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search language…"
                className="w-full h-[32px] pl-[28px] pr-[8px] rounded-[7px] outline-none"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: c.textSecondary, backgroundColor: isDark ? "#0e0e12" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#dde1e9"}` }} />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "180px" }}>
            {filtered.length === 0 && <p className="text-center py-[16px]" style={{ fontSize: "13px", color: c.textMuted }}>No results</p>}
            {filtered.map(lang => (
              <button key={lang.id}
                onClick={() => { onChange(lang.id); setOpen(false); setQuery(""); }}
                className="flex items-center gap-[8px] w-full px-[12px] h-[34px] transition-colors"
                style={{ backgroundColor: lang.id === value ? (isDark ? "rgba(37,99,235,0.1)" : "#eff4ff") : "transparent" }}
                onMouseEnter={e => { if (lang.id !== value) e.currentTarget.style.backgroundColor = c.bgHover; }}
                onMouseLeave={e => { if (lang.id !== value) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <span className="text-[14px] w-[20px] text-center">{lang.flag}</span>
                <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontWeight: lang.id === value ? 500 : 400, fontSize: "13px", color: lang.id === value ? "#2563eb" : c.textSecondary }}>{lang.label}</span>
                {lang.id === value && <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Transcription mode toggle ──────────────────────────────

function TranscriptionModeToggle({ mode, onChange }: {
  mode: "mono" | "bi"; onChange: (m: "mono" | "bi") => void;
}) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  return (
    <div>
      <div className="flex rounded-[10px] p-[3px]" style={{ backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#f0f2f5", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e5ea"}` }}>
        {(["mono", "bi"] as const).map(m => {
          const isActive = mode === m;
          return (
            <button key={m}
              onClick={() => onChange(m)}
              className="flex-1 flex items-center justify-center gap-[6px] h-[32px] rounded-[8px] transition-all"
              style={{ backgroundColor: isActive ? (isDark ? "#2a2a35" : "white") : "transparent", boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: isActive ? 500 : 400, fontSize: "13px", color: isActive ? c.textPrimary : c.textMuted }}>
                {m === "bi" ? "Bilingual" : "Monolingual"}
              </span>
            </button>
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const inp = useInputStyle();
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
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Speaker identification</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textMuted, marginTop: "1px" }}>Identify different speakers</p>
        </div>
        <ToggleSw checked={enabled} onChange={onToggle} />
      </div>
      {enabled && (
        <div className="mt-[10px] relative" ref={ref}>
          <button
            onClick={() => setDropOpen(v => !v)}
            className="w-full flex items-center justify-between h-[40px] px-[14px] rounded-full transition-all"
            style={{ ...inp.base, fontSize: "13px" }}
          >
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>{countLabel}</span>
            <svg className={`size-[12px] transition-transform ${dropOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {dropOpen && (
            <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] rounded-[12px] py-[4px]"
              style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
              {options.map(opt => {
                const lbl = opt === "auto" ? "Auto-detect" : `${opt} speaker${opt > 1 ? "s" : ""}`;
                const active = count === opt;
                return (
                  <button key={String(opt)}
                    onClick={() => { onCountChange(opt); setDropOpen(false); }}
                    className="flex items-center justify-between w-full px-[12px] h-[32px] transition-colors"
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: active ? 500 : 400, fontSize: "13px", color: active ? "#2563eb" : c.textSecondary }}>{lbl}</span>
                    {active && <svg className="size-[13px]" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Real-time translation</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textMuted, marginTop: "1px" }}>Translate speech as it's transcribed</p>
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
    <div className="rounded-[12px] p-[14px]" style={{ backgroundColor: isDark ? "#111115" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e5ea"}` }}>
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const inp = useInputStyle();

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
        className="w-full flex items-center flex-wrap gap-[5px] min-h-[40px] pl-[12px] pr-[36px] py-[6px] rounded-full cursor-pointer transition-all relative"
        style={{ ...inp.base }}
      >
        {selectedLangs.length === 0 ? (
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted }}>
            Select languages…
          </span>
        ) : (
          selectedLangs.map(lang => (
            <span key={lang.id} className="inline-flex items-center gap-[3px] h-[24px] px-[7px] rounded-full"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#eef2f6" }}
            >
              <span className="text-[11px]">{lang.flag}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: isDark ? "#f3f4f6" : "#1f2937" }}>{lang.label}</span>
              <button
                onClick={e => { e.stopPropagation(); toggle(lang.id); }}
                className="ml-[2px] size-[12px] rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.08)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <svg className="size-[7px]" fill="none" viewBox="0 0 10 10">
                  <path d="M2 2l6 6M8 2L2 8" stroke={isDark ? "#e5e7eb" : "#374151"} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))
        )}
        {/* Chevron */}
        <span className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className={`size-[12px] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {/* Dropdown with checkboxes */}
      {open && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] rounded-[12px] overflow-hidden"
          style={{ backgroundColor: c.bgPopover, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
          <div className="p-[8px] pb-[4px]">
            <div className="relative">
              <svg className="absolute left-[9px] top-1/2 -translate-y-1/2 size-[13px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
                <path d="M7 12A5 5 0 107 2a5 5 0 000 10zM13 13l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search language…"
                className="w-full h-[32px] pl-[28px] pr-[8px] rounded-[7px] outline-none"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: c.textSecondary, backgroundColor: isDark ? "#0e0e12" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#dde1e9"}` }} />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "168px" }}>
            {filtered.length === 0 && (
              <p className="text-center py-[14px]" style={{ fontSize: "13px", color: c.textMuted }}>No results</p>
            )}
            {filtered.map(lang => {
              const checked = values.includes(lang.id);
              return (
                <button key={lang.id} onClick={() => toggle(lang.id)}
                  className="flex items-center gap-[8px] w-full px-[12px] h-[34px] transition-colors"
                  style={{
                    backgroundColor: checked ? (isDark ? "rgba(37,99,235,0.07)" : "#f0f5ff") : "transparent",
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.backgroundColor = c.bgHover; }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Checkbox */}
                  <span className="size-[15px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors"
                    style={{ backgroundColor: checked ? "#2563eb" : "transparent", border: checked ? "none" : `1.5px solid ${isDark ? "rgba(255,255,255,0.22)" : "#d1d5db"}` }}>
                    {checked && (
                      <svg className="size-[9px]" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[13px] w-[20px] text-center">{lang.flag}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: checked ? 500 : 400, fontSize: "13px", color: checked ? "#2563eb" : c.textSecondary }}>{lang.label}</span>
                </button>
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  return (
    <div className="flex flex-col gap-[16px]">
      <TranscriptionModeToggle
        mode={state.mode}
        onChange={m => onChange(
          m === "mono"
            ? { mode: m, langPrimary: "auto" }
            : { mode: m, langBilingual: ["auto"] }
        )}
      />
      {state.mode === "mono" ? (
        <LanguageSelector value={state.langPrimary} onChange={v => onChange({ langPrimary: v })} label="Transcription language" />
      ) : (
        <MultiLanguageSelector
          values={state.langBilingual}
          onChange={v => onChange({ langBilingual: v })}
          label="Transcription languages"
        />
      )}
      {/* Speaker section — outlined card */}
      <div className="rounded-[12px] p-[14px]" style={{ backgroundColor: isDark ? "#111115" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e5ea"}` }}>
        <SpeakerSection
          enabled={state.speakerEnabled}
          onToggle={() => onChange({ speakerEnabled: !state.speakerEnabled })}
          count={state.speakerCount}
          onCountChange={v => onChange({ speakerCount: v })}
        />
      </div>
      <RealTimeTranslationControl
        enabled={state.realtimeTranslation}
        onToggle={() => onChange({ realtimeTranslation: !state.realtimeTranslation })}
        lang={state.realtimeTranslationLang}
        onLangChange={v => onChange({ realtimeTranslationLang: v })}
      />
    </div>
  );
}

const DEFAULT_SETTINGS: SharedSettingsState = {
  mode: "mono", langPrimary: "auto", langSecondary: "auto", langBilingual: ["auto"],
  speakerEnabled: false, speakerCount: 2, realtimeTranslation: false, realtimeTranslationLang: "en",
};

// ── Upgrade prompt ─────────────────────────────────────────

function UpgradePrompt({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative rounded-[20px] w-[360px] p-[28px] flex flex-col items-center text-center gap-[16px]"
        style={{ backgroundColor: c.bgPopover, boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
        <div className="absolute top-[14px] right-[14px]"><XBtn onClick={onClose} /></div>
        <div className="size-[52px] rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
          <svg className="size-[26px]" fill="#d97706" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </div>
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "16px", color: c.textPrimary }}>Upgrade to Pro</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted, marginTop: "6px", lineHeight: 1.5 }}>
            This feature is available on the Pro plan. Unlock bilingual transcription, real-time translation, and more.
          </p>
        </div>
        <button onClick={onClose} className="w-full h-[42px] rounded-full transition-colors" style={{ backgroundColor: "#2563eb", color: "white" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1d4ed8"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px" }}>View Pro plans</span>
        </button>
        <button onClick={onClose} style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted }}>Maybe later</button>
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  useEffect(() => {
    function h(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" onClick={onBackdropClick} />
      <div className="relative rounded-[20px] flex flex-col overflow-hidden"
        style={{ width: `min(${width}px, calc(100vw - 32px))`, maxHeight: "calc(100vh - 40px)", backgroundColor: c.bgPopover, boxShadow: "0 32px 72px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-[22px] pt-[18px] pb-[16px] shrink-0">
          <div>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "17px", color: c.textPrimary, lineHeight: 1.2 }}>{title}</h2>
            {subtitle && <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: c.textMuted, marginTop: "2px" }}>{subtitle}</p>}
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

function UploadFileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addJob, userPlan } = useTranscriptionModals();
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [settings, setSettings] = useState<SharedSettingsState>(DEFAULT_SETTINGS);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function resetForm() { setFiles([]); setDragActive(false); setSettings(DEFAULT_SETTINGS); }
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

  function handleSubmit() {
    if (!files.length) return;
    const opts = {
      lang: settings.mode === "mono" ? settings.langPrimary : undefined,
      langBilingual: settings.mode === "bi" ? (settings.langBilingual.length ? settings.langBilingual : ["auto"]) : undefined,
      translationLang: settings.realtimeTranslation ? settings.realtimeTranslationLang : undefined,
    };
    files.forEach(file => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      addJob(file.name, AUDIO_EXTS.includes(ext) ? "audio" : "video", opts);
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
          {/* Drop zone — always visible */}
          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="rounded-[14px] flex flex-col items-center justify-center cursor-pointer transition-all select-none"
            style={{
              height: "116px",
              border: `2px dashed ${dragActive ? "#2563eb" : (isDark ? "rgba(255,255,255,0.1)" : "#dce0e8")}`,
              backgroundColor: dragActive ? (isDark ? "rgba(37,99,235,0.06)" : "#eff6ff") : "transparent",
            }}
          >
            <input ref={fileRef} type="file" multiple accept={ACCEPTED} className="hidden"
              onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) addFiles(f); e.target.value = ""; }} />
            <div className="size-[36px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: dragActive ? (isDark ? "rgba(37,99,235,0.15)" : "#dbeafe") : (isDark ? "#2a2a35" : "#f0f4ff") }}>
              <svg className="size-[17px]" fill="none" viewBox="0 0 24 24" style={{ color: "#2563eb" }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>
              Drop files here or <span style={{ color: "#2563eb" }}>browse</span>
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textFaint, marginTop: "3px" }}>
              MP3, MP4, M4A, MOV, WAV, OGG · Max 1 GB audio / 10 GB video
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="flex flex-col gap-[6px]">
              {files.map((file, i) => {
                const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                const isAudio = AUDIO_EXTS.includes(ext);
                return (
                  <div key={i} className="flex items-center gap-[10px] h-[48px] px-[12px] rounded-full"
                    style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e5ea"}`, backgroundColor: isDark ? "#111115" : "white" }}>
                    <div className="size-[30px] rounded-[8px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isAudio ? (isDark ? "rgba(37,99,235,0.12)" : "#eff4ff") : (isDark ? "rgba(124,58,237,0.12)" : "#f3effff") }}>
                      {isAudio ? (
                        <svg className="size-[14px]" fill="none" viewBox="0 0 24 24" style={{ color: "#2563eb" }}>
                          <path d="M9 18V5l12-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zM21 16a3 3 0 11-3-3 3 3 0 013 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="size-[14px]" fill="none" viewBox="0 0 24 24" style={{ color: "#7c3aed" }}>
                          <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>{file.name}</p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textMuted }}>{formatBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                      className="size-[26px] rounded-full flex items-center justify-center transition-colors shrink-0"
                      style={{ backgroundColor: "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <svg className="size-[11px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <SharedSettings state={settings} onChange={p => setSettings(s => ({ ...s, ...p }))} userPlan={userPlan} onUpgradeClick={() => setUpgradeOpen(true)} />

          <div className="flex items-center justify-end gap-[8px]">
            <button onClick={handleClose} className="h-[36px] px-[18px] rounded-full border transition-colors"
              style={{ borderColor: c.borderBtn, backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Cancel</span>
            </button>
            <button onClick={handleSubmit} disabled={!files.length}
              className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#2563eb", color: "white" }}
              onMouseEnter={e => { if (files.length) e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
              onMouseLeave={e => { if (files.length) e.currentTarget.style.backgroundColor = "#2563eb"; }}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>
                {files.length > 1 ? `Start transcription · ${files.length} files` : "Start transcription"}
              </span>
            </button>
          </div>
        </div>
      </ModalShell>
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Modal 2 — Record audio
// ════════════════════════════════════════════════════════════

const BAR_COUNT = 32;

function Waveform({ active }: { active: boolean }) {
  const [heights, setHeights] = useState<number[]>(() => Array(BAR_COUNT).fill(5));
  const { isDark } = useTheme();

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
          style={{ width: "3px", height: `${h}px`, backgroundColor: active ? "#2563eb" : (isDark ? "#3a3a48" : "#d1d5db"), opacity: active ? 0.5 + (i % 5) * 0.1 : 0.4, transition: active ? "height 0.09s ease" : "height 0.3s ease" }} />
      ))}
    </div>
  );
}

function StopConfirmDialog({ open, onCancel, onStop }: { open: boolean; onCancel: () => void; onStop: () => void }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative rounded-[18px] w-[340px] p-[22px] flex flex-col gap-[16px]"
        style={{ backgroundColor: c.bgPopover, boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "15px", color: c.textPrimary }}>Recording in progress</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted, marginTop: "6px", lineHeight: 1.5 }}>
            Recording is still in progress. Are you sure you want to close this window?
          </p>
        </div>
        <div className="flex gap-[8px]">
          <button onClick={onCancel} className="flex-1 h-[38px] rounded-full transition-colors"
            style={{ backgroundColor: isDark ? "#2a2a35" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#dde1e9"}` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#333340" : "#f3f4f6"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#2a2a35" : "white"}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: isDark ? "#d1d5db" : "#374151" }}>Cancel</span>
          </button>
          <button onClick={onStop} className="flex-1 h-[38px] rounded-full transition-colors"
            style={{ backgroundColor: "#ef4444", color: "white" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#dc2626"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ef4444"}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>Stop & close</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function RecordAudioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addJob, userPlan } = useTranscriptionModals();
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  type MicStatus = "idle" | "requesting" | "granted" | "denied";
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [settings, setSettings] = useState<SharedSettingsState>(DEFAULT_SETTINGS);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      setMicStatus("idle"); setIsRecording(false); setIsPaused(false); setElapsed(0);
      setSettings(DEFAULT_SETTINGS);
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
    }
  }, [open]);

  function handleStartRecording() {
    setMicStatus("requesting");
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => { streamRef.current = stream; setMicStatus("granted"); setIsRecording(true); })
      .catch(() => setMicStatus("denied"));
  }

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording, isPaused]);

  function fmt(s: number) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }

  function handleClose() { if (isRecording) { setStopConfirm(true); return; } doClose(); }
  function doClose() { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setStopConfirm(false); onClose(); }
  function handleTranscribe() {
    addJob(`Recording ${fmt(elapsed)}.wav`, "audio", {
      lang: settings.mode === "mono" ? settings.langPrimary : undefined,
      langBilingual: settings.mode === "bi" ? (settings.langBilingual.length ? settings.langBilingual : ["auto"]) : undefined,
      translationLang: settings.realtimeTranslation ? settings.realtimeTranslationLang : undefined,
    });
    doClose();
  }

  if (!open) return null;

  return (
    <>
      <ModalShell title="Record audio" subtitle="Transcribe speech from your microphone" onClose={handleClose} onBackdropClick={handleClose}>
        <div className="px-[22px] py-[20px] flex flex-col gap-[18px]">
          {/* Idle — start recording prompt */}
          {micStatus === "idle" && (
            <div className="rounded-[14px] p-[20px] flex flex-col items-center gap-[12px]"
              style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e5ea"}`, backgroundColor: isDark ? "#111115" : "white" }}>
              <div className="size-[48px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: isDark ? "rgba(37,99,235,0.1)" : "#eff4ff", border: `1.5px solid ${isDark ? "rgba(37,99,235,0.3)" : "#bfdbfe"}` }}>
                <svg className="size-[22px]" fill="none" viewBox="0 0 24 24" style={{ color: "#2563eb" }}>
                  <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center">
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Ready to record</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textMuted, marginTop: "2px" }}>Press the button below to start recording from your microphone</p>
              </div>
              <button onClick={handleStartRecording}
                className="h-[34px] px-[18px] rounded-full flex items-center gap-[6px] transition-colors"
                style={{ backgroundColor: "#2563eb", color: "white" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1d4ed8"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}
              >
                <span className="size-[7px] rounded-full bg-white shrink-0" />
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>Start recording</span>
              </button>
            </div>
          )}
          {/* Mic requesting */}
          {micStatus === "requesting" && (
            <div className="rounded-[14px] p-[20px] flex flex-col items-center gap-[10px]"
              style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e5ea"}`, backgroundColor: isDark ? "#111115" : "white" }}>
              <svg className="size-[32px] animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: "#2563eb" }}>
                <circle cx="12" cy="12" r="9" stroke={isDark ? "#2a2a35" : "#e5e7eb"} strokeWidth="2.5" />
                <path d="M12 3a9 9 0 019 9" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Requesting microphone access…</p>
            </div>
          )}
          {/* Mic denied */}
          {micStatus === "denied" && (
            <div className="rounded-[14px] p-[16px] flex items-start gap-[12px]"
              style={{ border: "1px solid #fecaca", backgroundColor: isDark ? "rgba(239,68,68,0.06)" : "#fff8f8" }}>
              <svg className="size-[18px] shrink-0 mt-[1px]" fill="none" viewBox="0 0 24 24" style={{ color: "#ef4444" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" /><path d="M12 7v5M12 16v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ef4444" }}>Microphone access denied</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: isDark ? "#f87171" : "#b91c1c", marginTop: "3px", lineHeight: 1.4 }}>
                  Please allow microphone access in your browser settings and try again.
                </p>
              </div>
            </div>
          )}
          {/* Recording UI */}
          {micStatus === "granted" && isRecording && (
            <div className="rounded-[14px] p-[16px] flex flex-col items-center gap-[12px]"
              style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e5ea"}`, backgroundColor: isDark ? "#111115" : "white" }}>
              {/* Status + timer */}
              <div className="flex items-center gap-[10px]">
                <span className="relative flex size-[8px]">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${!isPaused ? "animate-ping bg-red-400" : "bg-gray-400"}`} />
                  <span className={`relative inline-flex size-[8px] rounded-full ${!isPaused ? "bg-red-500" : "bg-gray-400"}`} />
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "12px", color: isPaused ? c.textMuted : "#ef4444" }}>
                  {isPaused ? "Paused" : "Recording"}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "18px", color: c.textPrimary, letterSpacing: "0.5px", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(elapsed)}
                </span>
              </div>
              <Waveform active={isRecording && !isPaused} />
              <button
                onClick={() => setIsPaused(v => !v)}
                className="h-[34px] px-[16px] rounded-full flex items-center gap-[6px] transition-colors"
                style={{ backgroundColor: isDark ? "#2a2a35" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#dde1e9"}` }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#333340" : "#f3f4f6"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#2a2a35" : "white"}
              >
                {isPaused
                  ? <svg className="size-[13px]" fill="currentColor" viewBox="0 0 24 24" style={{ color: c.textSecondary }}><polygon points="5,3 19,12 5,21" /></svg>
                  : <svg className="size-[13px]" fill="currentColor" viewBox="0 0 24 24" style={{ color: c.textSecondary }}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                }
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: c.textSecondary }}>
                  {isPaused ? "Resume" : "Pause recording"}
                </span>
              </button>
            </div>
          )}

          <SharedSettings state={settings} onChange={p => setSettings(s => ({ ...s, ...p }))} userPlan={userPlan} onUpgradeClick={() => setUpgradeOpen(true)} />

          <div className="flex items-center justify-end gap-[8px]">
            <button onClick={handleClose} className="h-[36px] px-[18px] rounded-full border transition-colors"
              style={{ borderColor: c.borderBtn, backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Cancel</span>
            </button>
            <button onClick={handleTranscribe} disabled={micStatus !== "granted"}
              className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#2563eb", color: "white" }}
              onMouseEnter={e => { if (micStatus === "granted") e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>Start transcription</span>
            </button>
          </div>
        </div>
      </ModalShell>
      <StopConfirmDialog open={stopConfirm} onCancel={() => setStopConfirm(false)} onStop={doClose} />
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// Modal 3 — Transcribe from link
// ════════════════════════════════════════════════════════════

function isValidUrl(s: string) { try { new URL(s); return true; } catch { return false; } }

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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const inp = useInputStyle();

  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [settings, setSettings] = useState<SharedSettingsState>(DEFAULT_SETTINGS);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function resetForm() { setUrl(""); setUrlError(""); setSettings(DEFAULT_SETTINGS); }
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
              <svg className="absolute left-[12px] top-1/2 -translate-y-1/2 size-[15px] pointer-events-none" fill="none" viewBox="0 0 24 24" style={{ color: c.textMuted }}>
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input type="url" placeholder="Paste the link here" value={url}
                onChange={e => { setUrl(e.target.value); if (urlError) validateUrl(e.target.value); }}
                onBlur={() => validateUrl(url)}
                className="w-full h-[42px] pl-[36px] pr-[108px] rounded-[10px] outline-none transition-all"
                style={{ ...inp.base, borderColor: urlError ? "#ef4444" : (isDark ? "rgba(255,255,255,0.1)" : "#dde1e9") }}
                onFocus={e => inp.focus(e.currentTarget, !!urlError)}
                onBlurCapture={e => inp.blur(e.currentTarget, !!urlError)}
              />
              <LinkInputIcons />
            </div>
            {urlError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#ef4444", marginTop: "5px" }}>{urlError}</p>}
          </div>

          <SharedSettings state={settings} onChange={p => setSettings(s => ({ ...s, ...p }))} userPlan={userPlan} onUpgradeClick={() => setUpgradeOpen(true)} />

          <div className="flex items-center justify-end gap-[8px]">
            <button onClick={handleClose} className="h-[36px] px-[18px] rounded-full border transition-colors"
              style={{ borderColor: c.borderBtn, backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Cancel</span>
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#2563eb", color: "white" }}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>Start transcription</span>
            </button>
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
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const inp = useInputStyle();

  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingUrlError, setMeetingUrlError] = useState("");
  const [meetingName, setMeetingName] = useState(`Meeting ${meetingCounterRef.current}`);
  const [langId, setLangId] = useState("auto");
  const [mode, setMode] = useState<"mono" | "bi">("mono");
  const [langBilingual, setLangBilingual] = useState<string[]>(["auto"]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [botName, setBotName] = useState("TranscribeToText Bot");
  const [realTimeTranslation, setRealTimeTranslation] = useState(false);
  const [realTimeTranslationLang, setRealTimeTranslationLang] = useState("en");
  const [notifyParticipants, setNotifyParticipants] = useState(true);
  const [notifyMessage, setNotifyMessage] = useState("I'm recording this meeting with TranscribeToText for note-taking purposes.");

  function resetForm() {
    setMeetingUrl(""); setMeetingUrlError(""); meetingCounterRef.current += 1;
    setMeetingName(`Meeting ${meetingCounterRef.current}`); setLangId("auto"); setMode("mono"); setLangBilingual(["auto"]);
    setAdvancedOpen(false); setBotName("TranscribeToText Bot"); setRealTimeTranslation(false); setRealTimeTranslationLang("en");
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
          <div className="rounded-[12px] p-[14px] flex gap-[11px]"
            style={{ backgroundColor: isDark ? "rgba(37,99,235,0.06)" : "#f0f5ff", border: `1px solid ${isDark ? "rgba(37,99,235,0.15)" : "#c7d9ff"}` }}>
            <svg className="size-[16px] shrink-0 mt-[2px]" fill="none" viewBox="0 0 24 24" style={{ color: "#2563eb" }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" /><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: isDark ? "#93b4ff" : "#1d4ed8", lineHeight: 1.55 }}>
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
              <input type="url" placeholder="Paste the meeting invite link here" value={meetingUrl}
                onChange={e => { setMeetingUrl(e.target.value); if (meetingUrlError) validateMeetingUrl(e.target.value); }}
                onBlur={() => validateMeetingUrl(meetingUrl)}
                className="w-full h-[42px] pl-[14px] pr-[98px] rounded-[10px] outline-none transition-all"
                style={{ ...inp.base, borderColor: meetingUrlError ? "#ef4444" : (isDark ? "rgba(255,255,255,0.1)" : "#dde1e9") }}
                onFocus={e => inp.focus(e.currentTarget, !!meetingUrlError)}
                onBlurCapture={e => inp.blur(e.currentTarget, !!meetingUrlError)}
              />
              <div className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 flex items-center gap-[8px]">
                <SourceIcon source="zoom" />
                <SourceIcon source="google-meet" />
                <SourceIcon source="teams" />
              </div>
            </div>
            {meetingUrlError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#ef4444", marginTop: "5px" }}>{meetingUrlError}</p>}
          </div>

          {/* Meeting name */}
          <div>
            <SectionLabel>Meeting name <span style={{ color: "#9ca3af" }}>(optional)</span></SectionLabel>
            <input type="text" value={meetingName} onChange={e => setMeetingName(e.target.value)}
              className="w-full h-[42px] px-[14px] rounded-full outline-none transition-all"
              style={{ ...inp.base }}
              onFocus={e => inp.focus(e.currentTarget)}
              onBlurCapture={e => inp.blur(e.currentTarget)}
            />
          </div>

          {/* Mode + language */}
          <TranscriptionModeToggle
            mode={mode}
            onChange={m => {
              setMode(m);
              if (m === "mono") {
                setLangId("auto");
              } else {
                setLangBilingual(["auto"]);
              }
            }}
          />
          {mode === "mono" ? (
            <LanguageSelector value={langId} onChange={setLangId} label="Transcription language" />
          ) : (
            <MultiLanguageSelector
              values={langBilingual}
              onChange={setLangBilingual}
              label="Transcription languages"
            />
          )}

          {/* Advanced options */}
          <div>
            <button onClick={() => setAdvancedOpen(v => !v)}
              className="w-full flex items-center gap-[8px] h-[30px] transition-colors"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <svg className={`size-[14px] transition-transform ${advancedOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Advanced options</span>
            </button>

            {advancedOpen && (
              <div className="mt-[10px]">
                {/* Bot name */}
                <div className="pb-[12px]" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e8ecf2"}` }}>
                  <SectionLabel>Bot display name</SectionLabel>
                  <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
                    className="w-full h-[40px] px-[14px] rounded-full outline-none transition-all"
                    style={{ ...inp.base, fontSize: "13px" }}
                    onFocus={e => inp.focus(e.currentTarget)}
                    onBlurCapture={e => inp.blur(e.currentTarget)}
                  />
                </div>

                {/* Real-time translation */}
                <div className="py-[12px]" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e8ecf2"}` }}>
                  <RealTimeTranslationControl
                    enabled={realTimeTranslation}
                    onToggle={() => setRealTimeTranslation(v => !v)}
                    lang={realTimeTranslationLang}
                    onLangChange={setRealTimeTranslationLang}
                    withCard={false}
                  />
                </div>

                {/* Notify participants */}
                <div className="pt-[12px]">
                  <div className="flex items-center justify-between mb-[10px]">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textSecondary }}>Notify participants</span>
                    <ToggleSw checked={notifyParticipants} onChange={() => setNotifyParticipants(v => !v)} />
                  </div>
                  {notifyParticipants && (
                    <textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={3}
                      className="w-full px-[12px] py-[10px] rounded-[9px] outline-none resize-none transition-all"
                      style={{ ...inp.base, fontSize: "13px", lineHeight: "1.5" }}
                      onFocus={e => inp.focus(e.currentTarget)}
                      onBlurCapture={e => inp.blur(e.currentTarget)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-[8px]">
            <button onClick={handleClose} className="h-[36px] px-[18px] rounded-full border transition-colors"
              style={{ borderColor: c.borderBtn, backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}>Cancel</span>
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="h-[36px] px-[18px] rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#2563eb", color: "white" }}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#1d4ed8"; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>Transcribe now</span>
            </button>
          </div>
        </div>
      </ModalShell>
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
      <UploadFileModal open={openModal === "upload"} onClose={close} />
      <RecordAudioModal open={openModal === "record"} onClose={close} />
      <TranscribeLinkModal open={openModal === "link"} onClose={close} />
      <MeetingBotModal open={openModal === "meeting"} onClose={close} />
    </>
  );
}

// ══════════════════════════════════���═════════════════════════
// Floating Progress Widget
// ════════��═══════════════════════════════════════════════════

export function FloatingProgressWidget() {
  const { jobs, retryJob } = useTranscriptionModals();
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);
  const [expanded, setExpanded] = useState(false); // false = collapsed pill, true = full widget
  const [dismissed, setDismissed] = useState(false);

  const hasJobs = jobs.length > 0;
  const allDone = hasJobs && jobs.every(j => j.status === "done" || j.status === "error");
  const activeCount = jobs.filter(j => j.status === "uploading" || j.status === "processing").length;
  const doneCount = jobs.filter(j => j.status === "done" || j.status === "error").length;
  const errorCount = jobs.filter(j => j.status === "error").length;

  useEffect(() => { if (hasJobs) { setDismissed(false); setExpanded(false); } }, [hasJobs]);

  if (!hasJobs || dismissed) return null;

  const rowBorder = `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f0f1f4"}`;

  // ── Collapsed pill ──
  const pillLabel = allDone
    ? errorCount > 0
      ? `Completed with errors (${doneCount}/${jobs.length})`
      : `Upload complete! (${doneCount}/${jobs.length})`
    : `Uploading… (${doneCount}/${jobs.length})`;

  const pillBg = allDone
    ? errorCount > 0 ? "#f59e0b" : "#2563eb"
    : "#2563eb";

  if (!expanded) {
    return createPortal(
      <div className="fixed bottom-[24px] right-[24px] z-[150] flex flex-col items-end gap-[0px]">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-[8px] h-[40px] px-[16px] rounded-full shadow-lg transition-all"
          style={{ backgroundColor: pillBg, color: "white", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.92"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
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
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>{pillLabel}</span>
          {/* Chevron up */}
          <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 16 16">
            <path d="M4 10l4-4 4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>,
      document.body
    );
  }

  // ── Full expanded widget ──
  return createPortal(
    <div
      className="fixed bottom-[24px] right-[24px] z-[150] flex flex-col rounded-[16px] overflow-hidden"
      style={{ width: "480px", backgroundColor: c.bgPopover, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e5ea"}`, boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.06)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-[16px] h-[42px] shrink-0"
        style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#ebedf0"}` }}>
        <div className="flex items-center gap-[7px]">
          <svg className="size-[13px]" fill="none" viewBox="0 0 24 24" style={{ color: "#2563eb" }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "12px", color: c.textPrimary }}>Uploaded records</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center px-[5px] h-[15px] rounded-full text-white min-w-[15px]"
              style={{ backgroundColor: "#2563eb", fontSize: "9px", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-[1px]">
          {/* Collapse to pill */}
          <button onClick={() => setExpanded(false)} title="Collapse"
            className="size-[24px] rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="size-[11px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Dismiss */}
          <button onClick={() => setDismissed(true)} title="Dismiss"
            className="size-[24px] rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="size-[11px]" fill="none" viewBox="0 0 16 16" style={{ color: c.textMuted }}>
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Column headers (mini table) ── */}
      <>
          <div className="flex items-center px-[14px] h-[32px] shrink-0"
            style={{ borderBottom: rowBorder }}>
            <div className="flex-1 min-w-0">
              <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textHeader, textTransform: "uppercase", letterSpacing: "0.34px" }}>File</span>
            </div>
            <div className="w-[44px] shrink-0 text-center">
              <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textHeader, textTransform: "uppercase", letterSpacing: "0.34px" }}>Lang</span>
            </div>
            <div className="w-[52px] shrink-0 text-center">
              <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textHeader, textTransform: "uppercase", letterSpacing: "0.34px" }}>Transl.</span>
            </div>
            <div className="w-[52px] shrink-0 text-right">
              <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textHeader, textTransform: "uppercase", letterSpacing: "0.34px" }}>Dur.</span>
            </div>
            <div className="w-[86px] shrink-0 text-right">
              <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: c.textHeader, textTransform: "uppercase", letterSpacing: "0.34px" }}>Status</span>
            </div>
          </div>

          {/* ── Job rows ── */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {jobs.map((job, idx) => {
              const isActive = job.status === "uploading" || job.status === "processing";
              const isDone = job.status === "done";
              const isError = job.status === "error";
              const errLabel = job.errorType ? (ERROR_LABELS[job.errorType] ?? "Upload failed") : "Upload failed";

              return (
                <div key={job.id} className="relative" style={{ borderTop: idx > 0 ? rowBorder : "none" }}>
                  {/* Main row */}
                  <div className="flex items-center gap-[8px] px-[14px] pt-[9px] pb-[10px]"
                    style={{ backgroundColor: isError ? (isDark ? "rgba(239,68,68,0.04)" : "#fff8f8") : "transparent" }}>
                    {/* File type icon */}
                    <div className="size-[26px] rounded-[7px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isDark ? "#2a2a35" : (job.fileType === "audio" ? "#eff4ff" : "#f5f3ff") }}>
                      {job.fileType === "audio" ? (
                        <svg className="size-[12px]" fill="none" viewBox="0 0 24 24" style={{ color: "#2563eb" }}>
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
                      <p className="truncate" title={job.name}
                        style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: isError ? "#ef4444" : c.textSecondary }}>
                        {job.name}
                      </p>
                      {isActive && (
                        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: c.textFaint, marginTop: "1px" }}>
                          {job.status === "uploading" ? "Uploading…" : "Processing…"}
                        </p>
                      )}
                      {isError && (
                        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: "#ef4444", marginTop: "1px" }}>
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
                          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: c.textMuted }}>{job.lang === "auto" ? "Auto" : job.lang.toUpperCase()}</span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: c.textFaint }}>—</span>
                      )}
                    </div>

                    {/* Translation column */}
                    <div className="w-[52px] shrink-0 flex items-center justify-center">
                      {job.translationLang ? (
                        <div className="flex items-center gap-[2px]">
                          <span className="text-[12px]">{LANGUAGES.find(l => l.id === job.translationLang)?.flag ?? ""}</span>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: c.textMuted }}>{job.translationLang.toUpperCase()}</span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: c.textFaint }}>—</span>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="w-[52px] shrink-0 text-right">
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: c.textMuted }}>
                        {job.duration ?? (isDone || isError ? "—" : "")}
                      </span>
                    </div>

                    {/* Status area */}
                    <div className="w-[86px] shrink-0 flex items-center justify-end gap-[5px]">
                      {isActive && (
                        <>
                          <svg className="size-[12px] animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke={isDark ? "#3a3a48" : "#e5e7eb"} strokeWidth="2.5" />
                            <path d="M12 3a9 9 0 019 9" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#2563eb" }}>
                            {job.progress}%
                          </span>
                        </>
                      )}
                      {isDone && (
                        <>
                          <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.4" />
                            <path d="M8 12.5l2.5 2.5 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <button
                            onClick={() => {}}
                            className="transition-colors"
                            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11px", color: "#2563eb" }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                          >
                            Open
                          </button>
                        </>
                      )}
                      {isError && (
                        <>
                          <svg className="size-[13px] shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.4" />
                            <path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                          <button
                            onClick={() => retryJob(job.id)}
                            className="transition-colors"
                            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11px", color: "#ef4444" }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                          >
                            Retry
                          </button>
                        </>
                      )}
                    </div>

                    {/* Progress bar — absolute at bottom of the row cell */}
                    {(isActive || isDone || isError) && (
                      <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: "2px", backgroundColor: isDark ? "#2a2a35" : "#ebedf0" }}>
                        <div className="h-full transition-all duration-300"
                          style={{
                            width: isActive ? `${job.progress}%` : "100%",
                            background: isDone ? "#22c55e" : isError ? "rgba(239,68,68,0.35)" : job.status === "processing" ? "linear-gradient(90deg,#2563eb,#7c3aed)" : "#2563eb"
                          }} />
                      </div>
                    )}
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
