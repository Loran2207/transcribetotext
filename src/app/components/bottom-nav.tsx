import { useState } from "react";
import { House, FileText, Calendar, Layers, Plus, File01Icon, Mic, Video01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";

/* Two tabs sit on each side of the centered create button. "Shared with me"
   stays reachable through the hamburger drawer. */
const LEFT_TABS = [
  { id: "dashboard", icon: House, labelKey: "nav.home" },
  { id: "records", icon: FileText, labelKey: "nav.myRecords" },
];
const RIGHT_TABS = [
  { id: "calendar", icon: Calendar, labelKey: "nav.calendar" },
  { id: "templates", icon: Layers, labelKey: "nav.templates" },
];

/* Same four create paths as the dashboard tiles, with the matching colored
   chips so the sheet feels of-a-piece with the home grid. */
const CREATE_ACTIONS = [
  { key: "upload", modal: "upload" as const, icon: File01Icon, labelKey: "dash.card.audioVideoFiles", tint: "#ECEAFE", fg: "#7C3AED" },
  { key: "record", modal: "record" as const, icon: Mic, labelKey: "dash.card.instantSpeech", tint: "#E3F0FE", fg: "#2563EB" },
  { key: "meeting", modal: "meeting" as const, icon: Video01Icon, labelKey: "dash.card.meetingRecorder", tint: "#FFF1DC", fg: "#D97706" },
  { key: "link", modal: "link" as const, icon: Link01Icon, labelKey: "dash.card.transcribeFromLink", tint: "#FEECEB", fg: "#EF4444" },
];

/* Floating pill tab bar for mobile only (hidden at md+, where the sidebar is
   the nav). A solid white pill with a soft shadow - no real blur, so it
   captures cleanly to Figma - and the create "+" sits in the middle like a
   social-app compose button. */
export function BottomNav({ activePage, onNavigate }: { activePage: string; onNavigate: (page: string) => void }) {
  const { t } = useLanguage();
  const { setOpenModal } = useTranscriptionModals();
  const [createOpen, setCreateOpen] = useState(false);

  const renderTab = ({ id, icon, labelKey }: { id: string; icon: typeof House; labelKey: string }) => {
    const active = activePage === id;
    return (
      <button
        key={id}
        onClick={() => onNavigate(id)}
        className={`flex flex-col items-center justify-center gap-[3px] w-[58px] h-full ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        <Icon icon={icon} className="size-[21px]" strokeWidth={active ? 2 : 1.6} />
        <span className="truncate max-w-full" style={{ fontSize: 10, fontWeight: 500, lineHeight: 1 }}>{t(labelKey)}</span>
      </button>
    );
  };

  return (
    <nav
      className="md:hidden fixed left-1/2 -translate-x-1/2 z-40 flex items-center"
      style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}
    >
      <div
        className="flex items-center gap-[2px] h-[60px] px-[10px] rounded-full bg-background"
        style={{ boxShadow: "0 10px 30px rgba(16,24,40,0.16), 0 2px 8px rgba(16,24,40,0.08)", border: "1px solid var(--border)" }}
      >
        {LEFT_TABS.map(renderTab)}

        <Drawer open={createOpen} onOpenChange={setCreateOpen}>
          <DrawerTrigger asChild>
            <button
              aria-label="New transcription"
              className="flex items-center justify-center size-[44px] rounded-full bg-primary text-primary-foreground shrink-0 mx-[4px]"
            >
              <Icon icon={Plus} className="size-[24px]" strokeWidth={2} />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>New transcription</DrawerTitle>
            </DrawerHeader>
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

        {RIGHT_TABS.map(renderTab)}
      </div>
    </nav>
  );
}
