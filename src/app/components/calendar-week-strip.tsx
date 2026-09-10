import { cn } from "@/app/components/ui/utils";
import { getDayNameShort, toISODate } from "./calendar-mock-data";

interface CalendarWeekStripProps {
  weekStart: Date;
  selectedDate: string;
  todayISO: string;
  meetingCounts: Record<string, number>;
  onDaySelect: (dateISO: string) => void;
}

/* Google-Calendar-style week header: each day is a vertical stack - weekday
   letter on top, the date in a tappable circle, and a dot when there are
   meetings. Selected day = filled primary circle; today (unselected) = primary
   ring. Reads well on a phone (equal columns, no cramped inline "Sun 29"). */
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
    <div className="flex items-stretch pb-2">
      {days.map((day) => {
        const isToday = day.dateISO === todayISO;
        const isSelected = day.dateISO === selectedDate;
        const hasMeetings = (meetingCounts[day.dateISO] ?? 0) > 0;
        return (
          <button
            key={day.dateISO}
            onClick={() => onDaySelect(day.dateISO)}
            className="flex flex-col items-center gap-[5px] flex-1 min-w-0 pt-1.5 cursor-pointer"
          >
            <span
              className={cn(
                "text-[11px] font-medium leading-none",
                isSelected || isToday
                  ? "text-foreground"
                  : day.isWeekend
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground/60",
              )}
            >
              {day.dayName}
            </span>
            <span
              className={cn(
                "flex items-center justify-center size-8 lg:size-9 rounded-full text-[14px] tabular-nums transition-colors",
                isSelected && "bg-primary text-primary-foreground font-semibold",
                !isSelected && isToday && "border-[1.5px] border-primary text-primary font-semibold",
                !isSelected && !isToday && (day.isWeekend ? "text-muted-foreground/50" : "text-foreground"),
              )}
            >
              {day.dayNum}
            </span>
            <span
              className={cn(
                "size-1 rounded-full",
                hasMeetings && !isSelected ? "bg-primary" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
