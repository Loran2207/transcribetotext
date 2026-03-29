import { useState, useEffect } from "react";
import { Calendar } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";

function AnimatedTimer() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-[56px] rounded-full border-[3px] border-primary/20" />
        <div
          className="absolute size-[56px] rounded-full border-[3px] border-primary border-t-transparent"
          style={{ animation: "spin 1.2s linear infinite" }}
        />
        <Icon icon={Calendar} size={22} className="text-primary" />
      </div>
      <span className="text-[15px] text-muted-foreground font-medium">
        Loading{".".repeat(dots)}
      </span>
    </div>
  );
}

export function CalendarPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <AnimatedTimer />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-[14px] text-muted-foreground mt-2 max-w-[360px]">
            Calendar view is under development. You'll be able to see all your transcriptions organized by date.
          </p>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
