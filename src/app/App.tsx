import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StarredProvider } from "./components/starred-context";
import { FolderProvider } from "./components/folder-context";
import { LanguageProvider } from "./components/language-context";
import { TranscriptionModalsProvider } from "./components/transcription-modals";
import { AuthProvider } from "./components/auth-context";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StarredProvider>
          <FolderProvider>
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
                    // One elevation for the whole stack, cast by the card on top.
                    /* Light, and on every card. The cards behind are covered
                       by the one in front, so their shadows only show at the
                       edges that peek out - which is what makes the stack read
                       as one object sitting above the page instead of a lit
                       card with two flat slabs behind it. */
                    toast:
                      "rounded-[14px] shadow-[0_6px_18px_-6px_rgba(16,24,40,0.14),0_2px_6px_-3px_rgba(16,24,40,0.07)]",
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
