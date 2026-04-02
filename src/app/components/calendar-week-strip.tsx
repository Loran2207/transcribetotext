import { ChevronLeft, ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import {
  formatMonthYear,
  getDayNameShort,
  toISODate,
} from "./calendar-mock-data";

interface CalendarWeekStripProps {
  weekStart: Date;
  selectedDate: string; // ISO date "YYYY-MM-DD"
  todayISO: string; // ISO date of today
  onWeekChange: (direction: "prev" | "next") => void;
  onDaySelect: (dateISO: string) => void;
}

export function CalendarWeekStrip({
  weekStart,
  selectedDate,
  todayISO,
  onWeekChange,
  onDaySelect,
}: CalendarWeekStripProps) {
  const { month, year } = formatMonthYear(weekStart);

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
    <div className="flex items-center gap-4">
      {/* Month / Year label */}
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="text-xs font-medium text-muted-foreground">{month}</span>
        <span className="text-sm font-semibold text-foreground">{year}</span>
      </div>

      {/* Prev arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => onWeekChange("prev")}
        aria-label="Previous week"
      >
        <Icon icon={ChevronLeft} size={16} />
      </Button>

      {/* Day cells */}
      <div className="flex items-center gap-1">
        {days.map((day) => {
          const isToday = day.dateISO === todayISO;
          const isSelected = day.dateISO === selectedDate;

          return (
            <Button
              key={day.dateISO}
              variant="ghost"
              onClick={() => onDaySelect(day.dateISO)}
              className={cn(
                "flex flex-col items-center w-[52px] h-auto py-1.5 rounded-lg",
                isSelected && !isToday && "bg-accent",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium uppercase",
                  isToday ? "text-primary" : "text-muted-foreground",
                )}
              >
                {day.dayName}
              </span>
              <span
                className={cn(
                  "mt-0.5 flex items-center justify-center size-7 rounded-full text-sm font-semibold transition-colors",
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

      {/* Next arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => onWeekChange("next")}
        aria-label="Next week"
      >
        <Icon icon={ChevronRight} size={16} />
      </Button>
    </div>
  );
}
