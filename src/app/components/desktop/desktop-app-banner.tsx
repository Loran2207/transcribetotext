import { ComputerIcon, ChevronRight } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { useShell } from "./shell";

/* Told once, on the web portal's home: the same account records calls on the
   computer, no bot in the meeting, with the transcript live beside your notes.
   The desktop shell never shows it, it is the thing being advertised. */
export function DesktopAppBanner({ onGet }: { onGet: () => void }) {
  const { desktop } = useShell();
  if (desktop) return null;
  return (
    <button
      type="button"
      onClick={onGet}
      className="group relative mt-[12px] flex w-full items-center gap-[12px] overflow-hidden rounded-[16px] px-[16px] py-[13px] text-left transition-transform active:scale-[0.99]"
      style={{
        background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 78%, var(--foreground)) 100%)",
        boxShadow: "0 4px 12px color-mix(in oklch, var(--primary) 32%, transparent), 0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <span className="hidden size-[40px] shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 md:flex">
        <Icon icon={ComputerIcon} className="size-[20px] text-primary-foreground" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="flex items-center gap-[8px] text-primary-foreground" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>
          <span className="rounded-full bg-primary-foreground px-[7px] py-[1px] text-[10.5px] font-bold uppercase tracking-[0.04em] text-primary">New</span>
          <span className="truncate">Record calls on your computer</span>
        </span>
        <span className="truncate text-primary-foreground/80" style={{ fontWeight: 400, fontSize: "12px", lineHeight: "16px" }}>
          No bot in the meeting. The transcript runs live beside your notes.
        </span>
      </span>
      <span className="flex h-[34px] shrink-0 items-center gap-[3px] rounded-full bg-primary-foreground pl-[15px] pr-[11px]">
        <span className="text-primary" style={{ fontWeight: 600, fontSize: "13px" }}>Get the app</span>
        <Icon icon={ChevronRight} className="size-[14px] text-primary" strokeWidth={2.5} />
      </span>
    </button>
  );
}
