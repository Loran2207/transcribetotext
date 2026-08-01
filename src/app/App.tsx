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
                    toast:
                      "rounded-[14px] shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18),0_3px_10px_-4px_rgba(16,24,40,0.10)] data-[front=false]:shadow-none",
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
