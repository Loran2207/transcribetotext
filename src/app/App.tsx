import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StarredProvider } from "./components/starred-context";
import { FolderProvider } from "./components/folder-context";
import { LanguageProvider } from "./components/language-context";
import { TranscriptionModalsProvider } from "./components/transcription-modals";

export default function App() {
  return (
    <LanguageProvider>
      <StarredProvider>
        <FolderProvider>
          <TranscriptionModalsProvider userPlan="free">
            <RouterProvider router={router} />
          </TranscriptionModalsProvider>
        </FolderProvider>
      </StarredProvider>
    </LanguageProvider>
  );
}