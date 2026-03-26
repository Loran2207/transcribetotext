import { useState, useRef, useCallback } from "react";
import { AppSidebar } from "./app-sidebar";
import { DashboardPage } from "./dashboard-page";
import { CalendarPage } from "./calendar-page";
import { MyRecordsPage } from "./my-records-page";
import { useLanguage } from "./language-context";
import { TopBar } from "./top-bar";
import { SettingsPage } from "./settings-modal";
import { UserProfileProvider } from "./user-profile-context";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";

export function MainApp() {
  const [activePage, setActivePage] = useState("dashboard");
  const prevPageRef = useRef("dashboard");
  const [pendingFolderId, setPendingFolderId] = useState<string | null>(null);

  const isSettings = activePage === "settings";

  function handleNavigate(page: string) {
    if (page === "settings") {
      setActivePage("settings");
    } else {
      prevPageRef.current = page;
      setActivePage(page);
    }
  }

  const handleOpenFolder = useCallback((folderId: string) => {
    setPendingFolderId(folderId);
    handleNavigate("records");
  }, []);

  return (
    <UserProfileProvider>
      <SidebarProvider className="h-screen !min-h-0 overflow-hidden bg-sidebar">
        <AppSidebar activePage={activePage} onNavigate={handleNavigate} />
        <SidebarInset className="overflow-hidden bg-sidebar">
          <TopBar onNavigate={handleNavigate} />
          <main className="flex flex-1 overflow-hidden rounded-tl-[32px] bg-background">
            {isSettings && (
              <SettingsPage onClose={() => handleNavigate(prevPageRef.current || "dashboard")} />
            )}
            {!isSettings && activePage === "dashboard" && (
              <DashboardPage onNavigate={handleNavigate} onOpenFolder={handleOpenFolder} />
            )}
            {!isSettings && activePage === "records" && (
              <MyRecordsPage initialFolderId={pendingFolderId} onFolderConsumed={() => setPendingFolderId(null)} />
            )}
            {!isSettings && activePage === "calendar" && <CalendarPage />}
            {!isSettings && activePage !== "dashboard" && activePage !== "records" && activePage !== "calendar" && (
              <PagePlaceholder activePage={activePage} />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserProfileProvider>
  );
}

function PagePlaceholder({ activePage }: { activePage: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">
        {activePage.charAt(0).toUpperCase() + activePage.slice(1).replace(/-/g, " ")} — {t("common.comingSoon")}
      </p>
    </div>
  );
}
