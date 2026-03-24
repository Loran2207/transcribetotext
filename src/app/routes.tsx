import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/app-layout";
import { DesignSystemPage } from "./components/design-system-page";
import { TranscriptionDetailPage } from "./components/transcription-detail-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { path: "transcriptions/:id", Component: TranscriptionDetailPage },
    ],
  },
  { path: "/design-system", Component: DesignSystemPage },
]);
