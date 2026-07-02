import { useState } from "react";
import { House, FileText, Calendar, Layers, Plus, File01Icon, Mic, Video01Icon, Link01Icon, X } from "@hugeicons/core-free-icons";
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

/* Four navigation tabs only. The create "+" moved out of the pill into the
   floating FAB stack at the bottom-right (the add FAB below plus the
   upload-history FAB in processing-mobile.tsx). "Shared with me" stays reachable
   through the sidebar drawer. */
const TABS = [
  { id: "dashboard", icon: House, labelKey: "nav.home" },
  { id: "records", icon: FileText, labelKey: "nav.myRecords" },
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

/* Floating pill tab bar for mobile only (hidden at md+, where the sidebar is the
   nav). A solid white pill with a soft, tight shadow - no real blur, so it
   captures cleanly to Figma. The active tab colors its icon and label primary, with
   no chip behind the active icon. */
export function BottomNav({ activePage, onNavigate }: { activePage: string; onNavigate: (page: string) => void }) {
  const { t } = useLanguage();
  const { setOpenModal } = useTranscriptionModals();
  const [createOpen, setCreateOpen] = useState(false);
  const inner = useInnerScreen();
  const fabHidden = useFabHidden();

  if (inner?.hideNav) return null;

  return (
    <>
      <nav
        className="md:hidden fixed left-[16px] right-[16px] z-40 flex items-center"
        style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}
      >
        <div
          className="flex items-center w-full h-[58px] px-[8px] rounded-full bg-background"
          style={{ boxShadow: "0 6px 24px -6px rgba(16,24,40,0.16), 0 2px 8px -2px rgba(16,24,40,0.08)", border: "1px solid var(--border)" }}
        >
          {TABS.map(({ id, icon, labelKey }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-[3px] flex-1 h-full min-w-0"
              >
                <span className={`flex items-center justify-center size-[34px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                  <Icon icon={icon} className="size-[21px]" strokeWidth={active ? 2 : 1.6} />
                </span>
                <span className={`truncate max-w-full ${active ? "text-primary" : "text-muted-foreground"}`} style={{ fontSize: 10, fontWeight: active ? 600 : 500, lineHeight: 1 }}>{t(labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>

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
    </>
  );
}
