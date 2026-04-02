import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { getDayNameShort, toISODate } from "./calendar-mock-data";

interface CalendarWeekStripProps {
  weekStart: Date;
  selectedDate: string;
  todayISO: string;
  meetingCounts: Record<string, number>;
  onDaySelect: (dateISO: string) => void;
}

export function CalendarWeekStrip({
  weekStart,
  selectedDate,
  todayISO,
  meetingCounts,
  onDaySelect,
}: CalendarWeekStripProps) {
  const days: { dateISO: string; dayName: string; dayNum: number; isWeekend: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    days.push({
      dateISO: toISODate(d),
      dayName: getDayNameShort(d),
      dayNum: d.getDate(),
      isWeekend: dow === 0 || dow === 6,
    });
  }

  return (
    <div className="flex items-center gap-0.5 py-2">
      {days.map((day) => {
        const isToday = day.dateISO === todayISO;
        const isSelected = day.dateISO === selectedDate && !isToday;
        const dotCount = Math.min(meetingCounts[day.dateISO] ?? 0, 3);

        return (
          <Button
            key={day.dateISO}
            variant="ghost"
            onClick={() => onDaySelect(day.dateISO)}
            className={cn(
              "flex flex-col items-center flex-1 h-auto py-2.5 rounded-xl gap-0.5 relative",
              isSelected && "bg-accent ring-1 ring-border",
            )}
          >
            <span
              className={cn(
                "text-[12px] font-medium",
                isToday ? "text-primary" : day.isWeekend ? "text-muted-foreground/50" : "text-muted-foreground",
              )}
            >
              {day.dayName}
            </span>
            <span
              className={cn(
                "flex items-center justify-center size-8 rounded-full text-[15px] font-semibold transition-colors",
                isToday && "bg-primary text-primary-foreground ring-2 ring-primary/15",
                !isToday && day.isWeekend && "text-muted-foreground/60",
                !isToday && !day.isWeekend && "text-foreground",
              )}
            >
              {day.dayNum}
            </span>
            {/* Event dots */}
            <div className="flex items-center gap-0.5 h-[6px] mt-0.5">
              {dotCount > 0 && Array.from({ length: dotCount }).map((_, idx) => (
                <div key={idx} className="size-[4px] rounded-full bg-primary/60" />
              ))}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
