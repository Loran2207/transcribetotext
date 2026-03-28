import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/app-layout";
import { DesignSystemPage } from "./components/design-system-page";
import { TranscriptionDetailPage } from "./components/transcription-detail-page";
import { LoginPage } from "./components/login-page";
import { SignupPage } from "./components/signup-page";
import { EmailConfirmationPage } from "./components/email-confirmation-page";
import { AuthCallbackPage } from "./components/auth-callback-page";
import { ProtectedRoute } from "./components/protected-route";

function ProtectedAppLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ProtectedAppLayout,
    children: [
      { path: "transcriptions/:id", Component: TranscriptionDetailPage },
    ],
  },
  { path: "/login", Component: LoginPage },
  { path: "/signup", Component: SignupPage },
  { path: "/check-email", Component: EmailConfirmationPage },
  { path: "/auth/callback", Component: AuthCallbackPage },
  { path: "/design-system", Component: DesignSystemPage },
]);
