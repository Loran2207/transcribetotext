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
    <div className="flex items-center border-b border-border/30 pb-4">
      {days.map((day) => {
        const isToday = day.dateISO === todayISO;
        const isSelected = day.dateISO === selectedDate;

        return (
          <button
            key={day.dateISO}
            onClick={() => onDaySelect(day.dateISO)}
            className="flex items-center justify-center gap-1.5 flex-1 py-1 cursor-pointer transition-colors duration-100"
          >
            {/* Day name */}
            <span
              className={cn(
                "text-[13px] transition-colors",
                isSelected || isToday
                  ? "font-semibold text-foreground"
                  : day.isWeekend
                    ? "font-normal text-muted-foreground/40"
                    : "font-normal text-muted-foreground/60",
              )}
            >
              {day.dayName}
            </span>

            {/* Day number */}
            {isToday || isSelected ? (
              <span
                className={cn(
                  "flex items-center justify-center size-6 rounded-md text-[13px] font-semibold",
                  isSelected && isToday && "bg-primary text-primary-foreground",
                  isSelected && !isToday && "bg-primary text-primary-foreground",
                  !isSelected && isToday && "border-[1.5px] border-primary text-primary bg-transparent",
                )}
              >
                {day.dayNum}
              </span>
            ) : (
              <span
                className={cn(
                  "text-[13px] transition-colors",
                  day.isWeekend
                    ? "font-normal text-muted-foreground/40"
                    : "font-normal text-muted-foreground/60",
                )}
              >
                {day.dayNum}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
