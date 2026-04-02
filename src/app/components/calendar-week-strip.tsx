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
    <div className="flex items-center">
      {days.map((day) => {
        const isToday = day.dateISO === todayISO;
        const isSelected = day.dateISO === selectedDate && !isToday;
        const dotCount = Math.min(meetingCounts[day.dateISO] ?? 0, 3);

        return (
          <button
            key={day.dateISO}
            onClick={() => onDaySelect(day.dateISO)}
            className={cn(
              "flex flex-col items-center flex-1 py-3 rounded-xl gap-1 transition-colors duration-100 cursor-pointer",
              isSelected && "bg-accent/60",
              !isSelected && !isToday && "hover:bg-accent/30",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider",
                isToday ? "text-primary" : day.isWeekend ? "text-muted-foreground/40" : "text-muted-foreground/70",
              )}
            >
              {day.dayName}
            </span>
            <span
              className={cn(
                "flex items-center justify-center size-9 rounded-full text-[16px] font-semibold transition-all duration-150",
                isToday && "bg-primary text-primary-foreground",
                isSelected && !isToday && "text-foreground",
                !isSelected && !isToday && day.isWeekend && "text-muted-foreground/50",
                !isSelected && !isToday && !day.isWeekend && "text-foreground",
              )}
            >
              {day.dayNum}
            </span>
            {/* Event dots */}
            <div className="flex items-center gap-[3px] h-[5px]">
              {dotCount > 0 && Array.from({ length: dotCount }).map((_, idx) => (
                <div key={idx} className="size-[3px] rounded-full bg-primary/50" />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
