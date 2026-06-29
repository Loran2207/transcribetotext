import { File01Icon, Mic, Video01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";

/* Each tile gets its own soft-tinted icon chip, echoing the palette of the
   illustrated desktop cards (purple files, blue speech, amber meeting, rose
   link) so the grid reads as colorful rather than four grey clones. */
const ACTIONS = [
  { key: "upload", modal: "upload" as const, icon: File01Icon, labelKey: "dash.card.audioVideoFiles", tint: "#ECEAFE", fg: "#7C3AED" },
  { key: "record", modal: "record" as const, icon: Mic, labelKey: "dash.card.instantSpeech", tint: "#E3F0FE", fg: "#2563EB" },
  { key: "meeting", modal: "meeting" as const, icon: Video01Icon, labelKey: "dash.card.meetingRecorder", tint: "#FFF1DC", fg: "#D97706" },
  { key: "link", modal: "link" as const, icon: Link01Icon, labelKey: "dash.card.transcribeFromLink", tint: "#FEECEB", fg: "#EF4444" },
];

/* Compact 2x2 create tiles - the phone replacement for the four illustrated
   action cards (which need ~210px height and only animate on hover). */
export function DashboardActionsMobile() {
  const { t } = useLanguage();
  const { setOpenModal } = useTranscriptionModals();

  return (
    <div className="grid grid-cols-2 gap-[10px] mt-[18px] md:hidden">
      {ACTIONS.map(({ key, modal, icon, labelKey, tint, fg }) => (
        <button
          key={key}
          onClick={() => setOpenModal(modal)}
          className="flex items-center gap-[12px] h-[64px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left"
        >
          <span className="flex items-center justify-center size-[36px] rounded-full shrink-0" style={{ backgroundColor: tint, color: fg }}>
            <Icon icon={icon} className="size-[18px]" strokeWidth={1.9} />
          </span>
          <span className="min-w-0 line-clamp-2 text-foreground" style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.25 }}>{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
