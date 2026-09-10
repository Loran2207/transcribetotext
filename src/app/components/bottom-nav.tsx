import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Plus, File01Icon, Mic, Video01Icon, Link01Icon, X } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";
import { FAB_RIGHT, ADD_FAB_SIZE, ADD_FAB_BOTTOM } from "./mobile-fab-layout";
import { useInnerScreen } from "./inner-screen";
import { useFabHidden } from "./fab-visibility";

/* Global floating "+" create button. Shows on every in-shell screen at all
   breakpoints (phone, tablet, desktop). Hidden on detail views: the result page
   (/transcriptions/:id) and any inner screen that sets hideNav (template detail,
   folder drill-in). Sits at z-[45] so any open dialog/drawer scrim (z-50) covers
   it. Opens the create sheet with the four transcription paths, like the tiles. */
const CREATE_ACTIONS = [
  { key: "upload", modal: "upload" as const, icon: File01Icon, labelKey: "dash.card.audioVideoFiles", tint: "#ECEAFE", fg: "#7C3AED" },
  { key: "record", modal: "record" as const, icon: Mic, labelKey: "dash.card.instantSpeech", tint: "#E3F0FE", fg: "#2563EB" },
  { key: "meeting", modal: "meeting" as const, icon: Video01Icon, labelKey: "dash.card.meetingRecorder", tint: "#FFF1DC", fg: "#D97706" },
  { key: "link", modal: "link" as const, icon: Link01Icon, labelKey: "dash.card.transcribeFromLink", tint: "#FEECEB", fg: "#EF4444" },
];

/* The sheet is a phone pattern. useIsMobile() in this project is 1024, which
   would leave a tablet with a full-width band for four rows, so the switch is
   made here at md - the width where the rest of the product stops behaving
   like a phone. */
function useCompactViewport() {
  const [compact, setCompact] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setCompact(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return compact;
}

export function BottomNav() {
  const { t } = useLanguage();
  const { setOpenModal, recordingPhase } = useTranscriptionModals();
  const [createOpen, setCreateOpen] = useState(false);
  const inner = useInnerScreen();
  const fabHidden = useFabHidden();
  const compact = useCompactViewport();

  const { pathname } = useLocation();
  const onDetailPage = pathname.startsWith("/transcriptions/");

  /* while a recording runs, the recording pill owns that corner */
  if (inner?.hideNav || onDetailPage || recordingPhase !== "idle") return null;

  const fab = (
    <button
      aria-label="New transcription"
      data-mobile-fab="add"
      className={`fixed z-[45] flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 ${fabHidden ? "opacity-0 translate-y-3 pointer-events-none" : "opacity-100"}`}
      style={{ right: FAB_RIGHT, bottom: ADD_FAB_BOTTOM, width: ADD_FAB_SIZE, height: ADD_FAB_SIZE, boxShadow: "0 10px 24px -6px rgba(37,99,235,0.5), 0 3px 8px -3px rgba(37,99,235,0.4)" }}
    >
      <Icon icon={Plus} className="size-[26px]" strokeWidth={2} />
    </button>
  );

  /* From md up the four paths hang off the button, right-aligned to it and
     opening upwards, so the choice appears where the finger already is. */
  if (!compact) {
    return (
      <DropdownMenu open={createOpen} onOpenChange={setCreateOpen}>
        <DropdownMenuTrigger asChild>{fab}</DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-[272px] rounded-[18px] p-1.5 shadow-[var(--elevation-md)]"
        >
          <DropdownMenuLabel className="px-2.5 pt-1 pb-2 text-[12px] font-medium text-muted-foreground">
            New transcription
          </DropdownMenuLabel>
          {CREATE_ACTIONS.map(({ key, modal, icon, labelKey, tint, fg }) => (
            <DropdownMenuItem
              key={key}
              onSelect={() => setOpenModal(modal)}
              className="gap-3 rounded-[12px] px-2.5 py-2 focus:bg-muted"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: tint, color: fg }}
              >
                {/* The item repaints any icon that does not name a colour of its
                    own, so the class is what keeps the tint. */}
                <Icon icon={icon} className="size-[18px] text-current" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 truncate text-[14px] font-medium text-foreground">
                {t(labelKey)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={createOpen} onOpenChange={setCreateOpen}>
      <DrawerTrigger asChild>{fab}</DrawerTrigger>
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
