import { Calendar } from "./ui/calendar";
import { useState } from "react";

export function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 py-5">
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827" }}>Calendar</h1>
        <div className="mt-4">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border border-[#E5E7EB]" />
        </div>
      </div>
    </div>
  );
}
