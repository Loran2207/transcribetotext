import { useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Puzzle } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppSidebar } from "./app-sidebar";
import { DashboardPage } from "./dashboard-page";
import { CalendarPage } from "./calendar-page";
import { MyRecordsPage } from "./my-records-page";
import { TemplatesPage } from "./templates-page";
import { SharedWithMePage } from "./shared-with-me-page";
import { useLanguage } from "./language-context";
import { TopBar } from "./top-bar";
import { SettingsPage } from "./settings-modal";
import { UserProfileProvider } from "./user-profile-context";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";

export function AppLayout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [initialFolderId, setInitialFolderId] = useState<string | null>(null);
  const prevPageRef = useRef("dashboard");
  const location = useLocation();
  const routerNavigate = useNavigate();

  const isSettings = activePage === "settings";
  const isSubRoute = location.pathname !== "/";

  function handleNavigate(page: string) {
    // If on a sub-route, navigate back to root first
    if (isSubRoute) {
      routerNavigate("/");
    }
    if (page === "settings") {
      setActivePage("settings");
    } else {
      prevPageRef.current = page;
      setActivePage(page);
    }
  }

  function handleOpenFolder(folderId: string) {
    setInitialFolderId(folderId);
    handleNavigate("records");
  }

  return (
    <UserProfileProvider>
      <SidebarProvider className="h-screen !min-h-0 overflow-hidden bg-sidebar">
        <AppSidebar activePage={activePage} onNavigate={handleNavigate} onOpenFolder={handleOpenFolder} />
        <SidebarInset className="overflow-hidden bg-sidebar">
          <TopBar onNavigate={handleNavigate} />
          <main className="flex flex-1 overflow-hidden rounded-tl-[32px] bg-background">
            {isSubRoute ? (
              <Outlet />
            ) : (
              <>
                {isSettings && (
                  <SettingsPage onClose={() => handleNavigate(prevPageRef.current || "dashboard")} />
                )}
                {!isSettings && activePage === "dashboard" && <DashboardPage onNavigate={handleNavigate} onOpenFolder={handleOpenFolder} />}
                {!isSettings && activePage === "records" && <MyRecordsPage initialFolderId={initialFolderId} onFolderConsumed={() => setInitialFolderId(null)} />}
                {!isSettings && activePage === "shared" && <SharedWithMePage />}
                {!isSettings && activePage === "calendar" && <CalendarPage />}
                {!isSettings && activePage === "templates" && <TemplatesPage />}
                {!isSettings && activePage !== "dashboard" && activePage !== "records" && activePage !== "shared" && activePage !== "calendar" && activePage !== "templates" && (
                  <PagePlaceholder activePage={activePage} />
                )}
              </>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserProfileProvider>
  );
}

function PagePlaceholder({ activePage }: { activePage: string }) {
  const label = activePage.charAt(0).toUpperCase() + activePage.slice(1).replace(/-/g, " ");
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6">
        <div className="size-[72px] rounded-2xl bg-primary/5 flex items-center justify-center">
          <HugeiconsIcon icon={Puzzle} size={32} className="text-primary/60" style={{ animation: "gentle-pulse 3s ease-in-out infinite" }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Coming Soon</h2>
          <p className="text-[14px] text-muted-foreground mt-1.5 max-w-[320px]">
            {label} is under development. Stay tuned for updates.
          </p>
        </div>
      </div>
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
