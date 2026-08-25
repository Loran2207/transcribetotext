import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StarredProvider } from "./components/starred-context";
import { FolderProvider } from "./components/folder-context";
import { LanguageProvider } from "./components/language-context";
import { TranscriptionModalsProvider } from "./components/transcription-modals";
import { AuthProvider } from "./components/auth-context";
import { Toaster } from "./components/ui/sonner";
import { ExportPresetsProvider } from "./components/export-presets-context";

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StarredProvider>
          <FolderProvider>
            <ExportPresetsProvider>
              <TranscriptionModalsProvider userPlan="free">
                <RouterProvider router={router} />
                {/* Top right, clear of the search and profile bar (56px tall).
                    Three at a time: the rest wait behind the stack. */}
                <Toaster
                position="top-right"
                visibleToasts={3}
                gap={10}
                offset={{ top: "72px", right: "20px" }}
                mobileOffset={{ top: "68px", right: "12px", left: "12px" }}
                toastOptions={{
                  classNames: {
                    /* One elevation for the whole stack, cast by the card on
                       top. A shadow on every card draws a hairline under each
                       edge that peeks out, and three lit cards read as three
                       objects; the cards behind carry none, so the stack sits
                       above the page as one. */
                    toast:
                      "rounded-[14px] shadow-none data-[front=true]:shadow-[0_10px_30px_-12px_rgba(16,24,40,0.085),0_3px_10px_-6px_rgba(16,24,40,0.04)]",
                  },
                }}
                />
              </TranscriptionModalsProvider>
            </ExportPresetsProvider>
          </FolderProvider>
        </StarredProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
