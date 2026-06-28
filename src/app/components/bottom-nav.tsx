import { House, FileText, Calendar, Layers } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { useLanguage } from "./language-context";

const TABS = [
  { id: "dashboard", icon: House, labelKey: "nav.home" },
  { id: "records", icon: FileText, labelKey: "nav.myRecords" },
  { id: "calendar", icon: Calendar, labelKey: "nav.calendar" },
  { id: "templates", icon: Layers, labelKey: "nav.templates" },
];

/* Fixed bottom tab bar for mobile only (hidden at md+, where the sidebar is the
   nav). "Shared with me" stays reachable through the hamburger drawer. */
export function BottomNav({ activePage, onNavigate }: { activePage: string; onNavigate: (page: string) => void }) {
  const { t } = useLanguage();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-[64px] flex items-stretch bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ id, icon, labelKey }) => {
        const active = activePage === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon icon={icon} className="size-[22px]" strokeWidth={active ? 2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1 }}>{t(labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
