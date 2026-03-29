import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Puzzle } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppSidebar } from "./app-sidebar";
import { DashboardPage } from "./dashboard-page";
import { CalendarPage } from "./calendar-page";
import { MyRecordsPage } from "./my-records-page";
import { TemplatesPage } from "./templates-page";
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
                {!isSettings && activePage === "calendar" && <CalendarPage />}
                {!isSettings && activePage === "templates" && <TemplatesPage />}
                {!isSettings && activePage !== "dashboard" && activePage !== "records" && activePage !== "calendar" && activePage !== "templates" && (
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
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);
  const label = activePage.charAt(0).toUpperCase() + activePage.slice(1).replace(/-/g, " ");
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-[56px] rounded-full border-[3px] border-primary/20" />
            <div className="absolute size-[56px] rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
            <HugeiconsIcon icon={Puzzle} size={22} className="text-primary" />
          </div>
          <span className="text-[15px] text-muted-foreground font-medium">Loading{".".repeat(dots)}</span>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-[14px] text-muted-foreground mt-2 max-w-[360px]">
            {label} is under development. Stay tuned for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
