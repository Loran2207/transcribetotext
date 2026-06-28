import { useState } from "react";
import { Plus, File01Icon, Mic, Video01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";

const ACTIONS = [
  { key: "upload", modal: "upload" as const, icon: File01Icon, labelKey: "dash.card.audioVideoFiles" },
  { key: "record", modal: "record" as const, icon: Mic, labelKey: "dash.card.instantSpeech" },
  { key: "meeting", modal: "meeting" as const, icon: Video01Icon, labelKey: "dash.card.meetingRecorder" },
  { key: "link", modal: "link" as const, icon: Link01Icon, labelKey: "dash.card.transcribeFromLink" },
];

/* Floating create button (mobile only). Opens a bottom Drawer with the four
   ways to start a transcription, each routing to the existing modal. */
export function CreateFab() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const { setOpenModal } = useTranscriptionModals();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          className="md:hidden fixed right-[16px] z-40 size-[56px] p-0 bg-primary text-primary-foreground"
          style={{ bottom: "calc(80px + env(safe-area-inset-bottom))", boxShadow: "var(--elevation-md)" }}
          aria-label="New transcription"
        >
          <Icon icon={Plus} className="size-[24px]" strokeWidth={2} />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>New transcription</DrawerTitle>
        </DrawerHeader>
        <div className="px-[16px] pb-[24px] flex flex-col gap-[8px]">
          {ACTIONS.map(({ key, modal, icon, labelKey }) => (
            <button
              key={key}
              onClick={() => { setOpen(false); setOpenModal(modal); }}
              className="flex items-center gap-[14px] h-[56px] px-[14px] rounded-[16px] bg-muted active:bg-muted/70 transition-colors text-left"
            >
              <span className="flex items-center justify-center size-[40px] rounded-full bg-background shrink-0">
                <Icon icon={icon} className="size-[20px] text-primary" strokeWidth={1.8} />
              </span>
              <span className="text-foreground" style={{ fontWeight: 500, fontSize: 14 }}>{t(labelKey)}</span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
