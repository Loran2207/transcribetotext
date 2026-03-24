import { useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppSidebar } from "./app-sidebar";
import { DashboardPage } from "./dashboard-page";
import { CalendarPage } from "./calendar-page";
import { useLanguage } from "./language-context";
import { TopBar } from "./top-bar";
import { SettingsPage } from "./settings-modal";
import { UserProfileProvider } from "./user-profile-context";
import { SidebarProvider, SidebarInset } from "./ui/sidebar";

export function AppLayout() {
  const [activePage, setActivePage] = useState("dashboard");
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

  return (
    <UserProfileProvider>
      <SidebarProvider className="h-screen !min-h-0 overflow-hidden bg-sidebar">
        <AppSidebar activePage={activePage} onNavigate={handleNavigate} />
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
                {!isSettings && activePage === "dashboard" && <DashboardPage />}
                {!isSettings && activePage === "calendar" && <CalendarPage />}
                {!isSettings && activePage !== "dashboard" && activePage !== "calendar" && (
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
  const { t } = useLanguage();
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">
        {activePage.charAt(0).toUpperCase() + activePage.slice(1).replace(/-/g, " ")} — {t("common.comingSoon")}
      </p>
    </div>
  );
}
