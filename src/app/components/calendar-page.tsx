import { Hourglass } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";

export function CalendarPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6">
        <div className="size-[72px] rounded-2xl bg-primary/5 flex items-center justify-center">
          <Icon icon={Hourglass} size={32} className="text-primary/60" style={{ animation: "gentle-pulse 3s ease-in-out infinite" }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Coming Soon</h2>
          <p className="text-[14px] text-muted-foreground mt-1.5 max-w-[320px]">
            Calendar view is under development. You'll be able to see all your transcriptions organized by date.
          </p>
        </div>
      </div>
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
