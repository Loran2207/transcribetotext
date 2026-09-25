import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { OnboardingProvider } from "./components/onboarding/onboarding-context";
import { router } from "./routes";
import { StarredProvider } from "./components/starred-context";
import { FolderProvider } from "./components/folder-context";
import { LanguageProvider } from "./components/language-context";
import { TranscriptionModalsProvider } from "./components/transcription-modals";
import { AuthProvider } from "./components/auth-context";
import { Toaster } from "./components/ui/sonner";
import { Icon } from "./components/ui/icon";
import { CheckmarkCircle02Icon, InformationCircleIcon, Alert02Icon } from "@hugeicons/core-free-icons";

/* demo flag for design captures: a toast that stays until dismissed. Re-read when the
   capture script stores a flag (it fires "ttt-banner-hidden" after every store). */
const readStickyToasts = () => { try { return window.localStorage.getItem("ttt_demo_toast_sticky") === "1"; } catch { return false; } };
function useStickyToasts() {
  const [sticky, setSticky] = useState<boolean>(readStickyToasts);
  useEffect(() => { const on = () => setSticky(readStickyToasts()); window.addEventListener("ttt-banner-hidden", on); return () => window.removeEventListener("ttt-banner-hidden", on); }, []);
  return sticky;
}

export default function App() {
  const stickyToasts = useStickyToasts();
  return (
    <AuthProvider>
      <LanguageProvider>
        <StarredProvider>
          <FolderProvider>
            <TranscriptionModalsProvider userPlan="free">
              <OnboardingProvider>
                <RouterProvider router={router} />
              </OnboardingProvider>
              {/* Top right, clear of the search and profile bar (56px tall).
                  Three at a time: the rest wait behind the stack. */}
              <Toaster
                position="top-right"
                duration={stickyToasts ? Infinity : undefined}
                visibleToasts={3}
                gap={10}
                offset={{ top: "72px", right: "20px" }}
                mobileOffset={{ top: "68px", right: "12px", left: "12px" }}
                icons={{
                  success: <Icon icon={CheckmarkCircle02Icon} size={16} className="text-primary" />,
                  info: <Icon icon={InformationCircleIcon} size={16} className="text-primary" />,
                  error: <Icon icon={Alert02Icon} size={16} className="text-destructive" />,
                }}
                toastOptions={{
                  unstyled: true,
                  /* The house card, not sonner's defaults (Kirill 24.09): popover surface,
                     14px radius, Inter at the panel sizes, Undo as the pill-outline button.
                     One elevation for the whole stack, cast by the card on top; the cards
                     behind carry none, so the stack sits above the page as one. */
                  classNames: {
                    toast:
                      "flex w-full items-center gap-3 rounded-[14px] border border-border bg-popover px-4 py-3 font-sans text-popover-foreground shadow-none data-[front=true]:shadow-[0_10px_30px_-12px_rgba(16,24,40,0.085),0_3px_10px_-6px_rgba(16,24,40,0.04)]",
                    icon: "flex size-4 shrink-0 items-center justify-center",
                    content: "min-w-0 flex-1",
                    title: "text-[13px] font-medium leading-[18px] text-foreground",
                    description: "mt-0.5 text-[12px] leading-[16px] text-muted-foreground",
                    cancelButton:
                      "ml-1 inline-flex h-7 shrink-0 items-center rounded-full border border-border bg-background px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted active:bg-muted",
                    actionButton:
                      "ml-1 inline-flex h-7 shrink-0 items-center rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90",
                  },
                }}
              />
            </TranscriptionModalsProvider>
          </FolderProvider>
        </StarredProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
