import { useState, useRef } from "react";
import { AppSidebar } from "./app-sidebar";
import { CollapsedSidebar } from "./collapsed-sidebar";
import { DashboardPage } from "./dashboard-page";
import { CalendarPage } from "./calendar-page";
import { useTheme } from "./theme-context";
import { useLanguage } from "./language-context";
import { TopBar } from "./top-bar";
import { SettingsPage } from "./settings-modal";
import { UserProfileProvider } from "./user-profile-context";

export function MainApp() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const prevPageRef = useRef("dashboard");

  const isSettings = activePage === "settings";

  function handleNavigate(page: string) {
    if (page === "settings") {
      setActivePage("settings");
    } else {
      prevPageRef.current = page;
      setActivePage(page);
    }
  }

  const { isDark, navStyle } = useTheme();
  const navDk = navStyle === "dark";
  const contentBg = isDark ? "#111115" : "white";

  return (
    <UserProfileProvider>
    <div className="flex h-screen w-full bg-background text-foreground">
      {sidebarCollapsed ? (
        <CollapsedSidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onExpand={() => setSidebarCollapsed(false)}
        />
      ) : (
        <AppSidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          onToggleCollapse={() => setSidebarCollapsed(true)}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: navDk ? "#1a1d2e" : (isDark ? "#111115" : "#fafafa") }}>
        <TopBar onNavigate={handleNavigate} />
        <main
          className="flex flex-1 overflow-hidden"
          style={{ backgroundColor: contentBg, borderTopLeftRadius: "14px" }}
        >
          {isSettings && (
            <SettingsPage onClose={() => handleNavigate(prevPageRef.current || "dashboard")} />
          )}
          {!isSettings && activePage === "dashboard" && <DashboardPage />}
          {!isSettings && activePage === "calendar" && <CalendarPage />}
          {!isSettings && activePage !== "dashboard" && activePage !== "calendar" && (
            <PagePlaceholder activePage={activePage} />
          )}
        </main>
      </div>
    </div>
    </UserProfileProvider>
  );
}

function PagePlaceholder({ activePage }: { activePage: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
        {activePage.charAt(0).toUpperCase() + activePage.slice(1).replace(/-/g, " ")} — {t("common.comingSoon")}
      </p>
    </div>
  );
}
