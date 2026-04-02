import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { getDayNameShort, toISODate } from "./calendar-mock-data";

interface CalendarWeekStripProps {
  weekStart: Date;
  selectedDate: string; // ISO date "YYYY-MM-DD"
  todayISO: string; // ISO date of today
  onDaySelect: (dateISO: string) => void;
}

export function CalendarWeekStrip({
  weekStart,
  selectedDate,
  todayISO,
  onDaySelect,
}: CalendarWeekStripProps) {
  const days: { dateISO: string; dayName: string; dayNum: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push({
      dateISO: toISODate(d),
      dayName: getDayNameShort(d),
      dayNum: d.getDate(),
    });
  }

  return (
    <div className="flex items-center border-b border-border py-2">
      {days.map((day) => {
        const isToday = day.dateISO === todayISO;
        const isSelected = day.dateISO === selectedDate && !isToday;

        return (
          <Button
            key={day.dateISO}
            variant="ghost"
            onClick={() => onDaySelect(day.dateISO)}
            className={cn(
              "flex flex-col items-center flex-1 h-auto py-2 rounded-lg gap-0.5",
              isSelected && "bg-accent",
            )}
          >
            <span
              className={cn(
                "text-[12px] font-medium",
                isToday ? "text-primary" : "text-muted-foreground",
              )}
            >
              {day.dayName}
            </span>
            <span
              className={cn(
                "flex items-center justify-center size-8 rounded-full text-[15px] font-semibold transition-colors",
                isToday && "bg-primary text-primary-foreground",
                !isToday && "text-foreground",
              )}
            >
              {day.dayNum}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
