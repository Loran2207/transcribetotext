import { useState } from "react";
import { Plus, File01Icon, Mic, Video01Icon, Link01Icon, X } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";
import { FAB_RIGHT, ADD_FAB_SIZE, ADD_FAB_BOTTOM } from "./mobile-fab-layout";
import { useInnerScreen } from "./inner-screen";
import { useFabHidden } from "./fab-visibility";

/* Floating "+" create button for the compact layout (phone + tablet, hidden at
   lg where the desktop chrome takes over). There is no bottom tab bar: every
   destination lives in the hamburger drawer (full nav + folders), exactly like
   the phone. This button opens the create sheet with the four transcription
   paths, matching the dashboard tiles. */
const CREATE_ACTIONS = [
  { key: "upload", modal: "upload" as const, icon: File01Icon, labelKey: "dash.card.audioVideoFiles", tint: "#ECEAFE", fg: "#7C3AED" },
  { key: "record", modal: "record" as const, icon: Mic, labelKey: "dash.card.instantSpeech", tint: "#E3F0FE", fg: "#2563EB" },
  { key: "meeting", modal: "meeting" as const, icon: Video01Icon, labelKey: "dash.card.meetingRecorder", tint: "#FFF1DC", fg: "#D97706" },
  { key: "link", modal: "link" as const, icon: Link01Icon, labelKey: "dash.card.transcribeFromLink", tint: "#FEECEB", fg: "#EF4444" },
];

export function BottomNav() {
  const { t } = useLanguage();
  const { setOpenModal } = useTranscriptionModals();
  const [createOpen, setCreateOpen] = useState(false);
  const inner = useInnerScreen();
  const fabHidden = useFabHidden();

  if (inner?.hideNav) return null;

  return (
    <Drawer open={createOpen} onOpenChange={setCreateOpen}>
      <DrawerTrigger asChild>
        <button
          aria-label="New transcription"
          data-mobile-fab="add"
          className={`md:hidden fixed z-[45] flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 ${fabHidden ? "opacity-0 translate-y-3 pointer-events-none" : "opacity-100"}`}
          style={{ right: FAB_RIGHT, bottom: ADD_FAB_BOTTOM, width: ADD_FAB_SIZE, height: ADD_FAB_SIZE, boxShadow: "0 10px 24px -6px rgba(37,99,235,0.5), 0 3px 8px -3px rgba(37,99,235,0.4)" }}
        >
          <Icon icon={Plus} className="size-[26px]" strokeWidth={2} />
        </button>
      </DrawerTrigger>
      <DrawerContent className="[&>div:first-child]:hidden">
        <div className="flex items-center justify-between px-[18px] pt-[18px] pb-[10px]">
          <DrawerTitle style={{ fontSize: 18, fontWeight: 600 }}>New transcription</DrawerTitle>
          <button onClick={() => setCreateOpen(false)} aria-label="Close" className="-mr-[4px] size-[32px] rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <Icon icon={X} className="size-[18px]" strokeWidth={2} />
          </button>
        </div>
        <div className="px-[16px] pb-[24px] flex flex-col gap-[8px]">
          {CREATE_ACTIONS.map(({ key, modal, icon, labelKey, tint, fg }) => (
            <button
              key={key}
              onClick={() => { setCreateOpen(false); setOpenModal(modal); }}
              className="flex items-center gap-[14px] h-[56px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left"
            >
              <span className="flex items-center justify-center size-[40px] rounded-full shrink-0" style={{ backgroundColor: tint, color: fg }}>
                <Icon icon={icon} className="size-[20px]" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 truncate text-foreground" style={{ fontWeight: 500, fontSize: 14 }}>{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
