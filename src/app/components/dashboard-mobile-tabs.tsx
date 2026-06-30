import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useLanguage } from "./language-context";
import { RecordsListMobile } from "./records-list-mobile";
import { AnalyticsCard } from "./analytics-card";
import { TodaysEvents } from "./todays-events";

/* Mobile + tablet dashboard view-switcher. A segmented control under the create
   block swaps one panel in place so Recent records, Analytics and today's
   Meetings are each one tap away with little or no scroll. Desktop (>=lg) keeps
   the full records table + right panel and never renders this. */
export function DashboardMobileTabs({ onNavigateToRecords, onNavigateToMeetings }: { onNavigateToRecords?: () => void; onNavigateToMeetings?: () => void }) {
  const { t } = useLanguage();
  return (
    <Tabs defaultValue="recent" className="lg:hidden mt-[22px] gap-[16px]">
      <TabsList className="w-full">
        <TabsTrigger value="recent">{t("table.recent")}</TabsTrigger>
        <TabsTrigger value="analytics">{t("dash.tab.analytics")}</TabsTrigger>
        <TabsTrigger value="meetings">{t("nav.calendar")}</TabsTrigger>
      </TabsList>
      <TabsContent value="recent">
        <RecordsListMobile onNavigateToRecords={onNavigateToRecords} embedded />
      </TabsContent>
      <TabsContent value="analytics">
        <AnalyticsCard />
      </TabsContent>
      <TabsContent value="meetings">
        <TodaysEvents onNavigate={onNavigateToMeetings} />
      </TabsContent>
    </Tabs>
  );
}
