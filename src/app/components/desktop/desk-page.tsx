import { readDemo, useShell } from "./shell";
import { MiniRecorder } from "./mini-recorder";
import { NoticeCard } from "./desktop-notice";

/* The app with its window closed: only what floats over the desktop remains.
   A wallpaper and the system's own strip (menu bar on macOS, taskbar on
   Windows) give the eye a scale; nothing else on the desk is ours. The dev
   server draws it at /desk with `?desk=widget|paused|call|ready`. */
export function DeskPage() {
  const { os } = useShell();
  const state = readDemo("desk") ?? "widget";
  const mac = os !== "win";
  const wallpaper = mac
    ? "radial-gradient(120% 90% at 20% 10%, #6E7BFF 0%, #2B2F8F 42%, #0B1233 100%)"
    : "radial-gradient(90% 120% at 70% 40%, #7FB3FF 0%, #2E6BE6 45%, #0A2A6B 100%)";
  return (
    <div className="relative h-screen w-screen overflow-hidden text-white" style={{ background: wallpaper }}>
      {mac ? (
        <div className="absolute inset-x-0 top-0 flex h-[28px] items-center justify-between bg-black/25 px-[14px] text-[13px] font-medium backdrop-blur-[12px]">
          <span className="flex items-center gap-[18px]"><span className="size-[13px] rounded-[4px] bg-white/85" /><span className="font-semibold">Zoom</span><span>File</span><span>Edit</span><span>View</span><span>Meeting</span><span>Window</span><span>Help</span></span>
          <span className="flex items-center gap-[14px] text-[12.5px]"><span className="size-[8px] rounded-full bg-[#FF3B30]" /><span>Tue 8 Sep  21:14</span></span>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex h-[48px] items-center justify-between bg-[#EEF1F6]/85 px-[14px] text-[12px] text-[#1B1F27] backdrop-blur-[16px]">
          <span className="flex items-center gap-[10px]"><span className="grid size-[24px] grid-cols-2 gap-[2px] p-[3px]"><span className="rounded-[1px] bg-[#0078D4]" /><span className="rounded-[1px] bg-[#0078D4]" /><span className="rounded-[1px] bg-[#0078D4]" /><span className="rounded-[1px] bg-[#0078D4]" /></span><span className="h-[28px] w-[200px] rounded-full bg-white/80" /></span>
          <span className="flex flex-col items-end leading-[14px]"><span>21:14</span><span>08.09.2026</span></span>
        </div>
      )}
      {(state === "widget" || state === "paused") && (
        <div className={`absolute right-[24px] ${mac ? "top-[52px]" : "bottom-[72px]"}`}><MiniRecorder /></div>
      )}
      {(state === "call" || state === "ready") && (
        <div className={`absolute right-[24px] ${mac ? "top-[44px]" : "bottom-[68px]"}`}><NoticeCard kind={state} onAct={() => {}} onClose={() => {}} /></div>
      )}
    </div>
  );
}
