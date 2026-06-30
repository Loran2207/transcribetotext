import { useState } from "react";
import { Mic, Globe, ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { SourceIcon } from "./source-icons";
import { useLanguage } from "./language-context";

/* Today's meetings for the mobile/tablet dashboard "Meetings" tab. The data and
   the MeetingItem visual mirror the desktop right-panel "Today's Events" list so
   the two stay consistent; kept self-contained so the desktop panel (which must
   stay byte-identical) is never touched. */

export interface Meeting {
  id: string; day: string; dayLabel: string; time: string; title: string;
  platform: "meet" | "zoom" | "teams"; attendees: number; autoJoin: boolean;
}

export const meetings: Meeting[] = [
  { id: "1", day: "03/16", dayLabel: "Monday", time: "14:00 ~ 15:00", title: "Nexora <> QL | Instance Daily Sync", platform: "meet", attendees: 4, autoJoin: false },
  { id: "2", day: "03/17", dayLabel: "Tuesday", time: "15:00 ~ 16:00", title: "Nexora Product Team Sync", platform: "meet", attendees: 6, autoJoin: false },
  { id: "3", day: "03/18", dayLabel: "Wednesday", time: "14:00 ~ 15:00", title: "Nexora <> QL | Instance Daily Sync", platform: "teams", attendees: 3, autoJoin: false },
];

const platformSourceMap = { meet: "google-meet", zoom: "zoom", teams: "teams" } as const;

const TODAY_STR = "03/16";

export function MeetingItem({ meeting }: { meeting: Meeting }) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`relative flex gap-[14px] py-[12px] rounded-[10px] px-[8px] -mx-[8px] transition-colors duration-200 overflow-hidden ${hovered ? "bg-foreground/[0.015]" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-[110px] shrink-0 flex flex-col gap-[5px]">
        <div className="flex items-center gap-[6px]">
          <SourceIcon source={platformSourceMap[meeting.platform]} />
          <span className="text-foreground" style={{ fontWeight: 500, fontSize: "12px" }}>{meeting.time}</span>
        </div>
        <div className="flex items-center gap-[5px] ml-[22px]">
          <div className="w-[26px] h-[14px] rounded-full relative cursor-pointer bg-muted">
            <div className="size-[10px] rounded-full bg-background absolute left-[2px] top-[2px] shadow-sm" />
          </div>
          <span className="text-muted-foreground" style={{ fontWeight: 400, fontSize: "10px" }}>{t("panel.autoJoin")}</span>
        </div>
      </div>
      <div className="w-px shrink-0 self-stretch bg-border" />
      <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
        <p className="truncate text-foreground" style={{ fontWeight: 500, fontSize: "13px" }}>{meeting.title}</p>
        <div className="flex items-center gap-[5px]">
          <svg className="size-[12px] text-muted-foreground shrink-0" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          <span className="truncate text-muted-foreground" style={{ fontWeight: 400, fontSize: "11px" }}>{t("panel.attendees")}: {meeting.attendees}</span>
        </div>
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 flex items-center gap-[6px] pr-[10px] pl-[24px]"
        style={{
          background: hovered ? "linear-gradient(to right, transparent, var(--secondary) 20%)" : "transparent",
          transform: hovered ? "translateX(0)" : "translateX(100%)",
          opacity: hovered ? 1 : 0,
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <Button variant="outline" size="sm" className="h-[28px] px-[10px] rounded-full gap-[5px] text-foreground">
          <Icon icon={Mic} className="size-[12px]" strokeWidth={1.5} />
          <span style={{ fontWeight: 500, fontSize: "11px" }}>Instant record</span>
        </Button>
        <Button variant="outline" size="sm" className="h-[28px] px-[10px] rounded-full gap-[5px] text-primary border-primary/30 hover:bg-primary/[0.05]">
          <Icon icon={Globe} className="size-[12px]" strokeWidth={1.5} />
          <span style={{ fontWeight: 500, fontSize: "11px" }}>Online meeting</span>
        </Button>
      </div>
    </div>
  );
}

/* The mobile/tablet "Meetings" tab body: a small Today header plus today's
   meeting rows (or an empty state). */
export function TodaysEvents({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const todays = meetings.filter((m) => m.day === TODAY_STR);
  return (
    <div>
      <button onClick={onNavigate} className="group flex items-center gap-[4px] mb-[12px]">
        <span className="text-foreground" style={{ fontWeight: 600, fontSize: 17 }}>{t("panel.today")}</span>
        <Icon icon={ChevronRight} className="size-[16px] text-foreground opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
      </button>
      {todays.length === 0 ? (
        <p className="py-[24px] text-center text-muted-foreground" style={{ fontSize: "13px" }}>{t("panel.noMeetings")}</p>
      ) : (
        <div className="flex flex-col">
          {todays.map((m) => <MeetingItem key={m.id} meeting={m} />)}
        </div>
      )}
    </div>
  );
}
