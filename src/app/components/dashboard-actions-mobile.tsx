import { File01Icon, Mic, Video01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";

const ACTIONS = [
  { key: "upload", modal: "upload" as const, icon: File01Icon, labelKey: "dash.card.audioVideoFiles" },
  { key: "record", modal: "record" as const, icon: Mic, labelKey: "dash.card.instantSpeech" },
  { key: "meeting", modal: "meeting" as const, icon: Video01Icon, labelKey: "dash.card.meetingRecorder" },
  { key: "link", modal: "link" as const, icon: Link01Icon, labelKey: "dash.card.transcribeFromLink" },
];

/* Compact 2x2 create tiles - the phone replacement for the four illustrated
   action cards (which need ~210px height and only animate on hover). */
export function DashboardActionsMobile() {
  const { t } = useLanguage();
  const { setOpenModal } = useTranscriptionModals();

  return (
    <div className="grid grid-cols-2 gap-[10px] mt-[18px] md:hidden">
      {ACTIONS.map(({ key, modal, icon, labelKey }) => (
        <button
          key={key}
          onClick={() => setOpenModal(modal)}
          className="flex items-center gap-[12px] h-[64px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left"
        >
          <span className="flex items-center justify-center size-[36px] rounded-full bg-background shrink-0">
            <Icon icon={icon} className="size-[18px] text-primary" strokeWidth={1.8} />
          </span>
          <span className="text-foreground" style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.25 }}>{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
