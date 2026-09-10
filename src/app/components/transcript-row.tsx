import { ReactNode } from "react";

/* One speaker + text transcript row, the canonical read-only block shared by the
   file-details transcript and the template Example excerpt so both read the same:
   avatar and name on top, timecode and text below at full width. */
export function TranscriptRow({
  name,
  initial,
  color,
  time,
  text,
}: {
  name: string;
  initial: string;
  color: string;
  time?: string;
  text: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
      </div>
      <div className="relative min-w-0 pl-5">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-border/80" />
        {time ? <span className="text-xs text-muted-foreground tabular-nums">{time}</span> : null}
        <p className="mt-1 text-sm leading-relaxed text-foreground/85">{text}</p>
      </div>
    </div>
  );
}
