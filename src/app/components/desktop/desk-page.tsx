import { useNavigate } from "react-router";
import { readDemo, useShell } from "./shell";
import { DemoSwitcher } from "./demo-switcher";
import { MiniRecorder } from "./mini-recorder";
import { NoticeCard } from "./desktop-notice";
import { SplitNotetaker } from "./split-notetaker";

/* The app with its window closed: only what floats over the desktop remains.
   A wallpaper and the system's own strip (menu bar on macOS, taskbar on
   Windows) give the eye a scale; nothing else on the desk is ours. The dev
   server draws it at /desk with `?desk=widget|expanded|paused|ended|writing|done|call|ready|upcoming|upcoming-menu|split`. */
export function DeskPage() {
  const { os } = useShell();
  const navigate = useNavigate();
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
      {(state === "widget" || state === "expanded" || state === "paused" || state === "ended" || state === "writing" || state === "done") && (
        <div className={`absolute right-[24px] ${mac ? "top-[104px]" : "bottom-[72px]"}`}><MiniRecorder /></div>
      )}
      {state === "split" && (
        /* the meeting keeps the left half; ours is the right, with its own window controls */
        <>
          <div className={`absolute left-[16px] right-[calc(50%+8px)] ${mac ? "top-[44px]" : "top-[16px]"} ${mac ? "bottom-[16px]" : "bottom-[64px]"} flex flex-col overflow-hidden rounded-[12px] bg-[#1B1B1F]`} style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
            <div className="flex h-[36px] items-center px-[14px] text-[12px] text-white/60">{mac ? <span className="mr-[12px] flex gap-[7px]"><span className="size-[11px] rounded-full bg-[#FF5F57]" /><span className="size-[11px] rounded-full bg-[#FEBC2E]" /><span className="size-[11px] rounded-full bg-[#28C840]" /></span> : null}Zoom Meeting</div>
            <div className="grid flex-1 grid-cols-2 gap-[10px] p-[10px]">
              {[["Maria Garcia", "#3B5BDB"], ["You", "#2B8A3E"]].map(([n, c]) => (
                <div key={n} className="relative flex items-center justify-center rounded-[10px] bg-[#26262B]"><span className="flex size-[72px] items-center justify-center rounded-full text-[26px] font-semibold text-white" style={{ background: c }}>{n[0]}</span><span className="absolute bottom-[10px] left-[10px] rounded-[6px] bg-black/50 px-[8px] py-[3px] text-[12px] text-white">{n}</span></div>
              ))}
            </div>
            <div className="flex h-[56px] items-center justify-center gap-[18px] text-[11px] text-white/70">{["Mute", "Stop Video", "Participants", "Chat", "Share Screen", "Record"].map((t) => <span key={t}>{t}</span>)}<span className="rounded-[6px] bg-[#E0242B] px-[12px] py-[6px] font-medium text-white">Leave</span></div>
          </div>
          <div className={`absolute left-[calc(50%+8px)] right-[16px] ${mac ? "top-[44px]" : "top-[16px]"} ${mac ? "bottom-[16px]" : "bottom-[64px]"} overflow-hidden rounded-[12px]`} style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
            {mac && <div className="pointer-events-none absolute left-[16px] top-[16px] z-[70] flex items-center gap-[8px]"><span className="size-[12px] rounded-full bg-[#FF5F57]" /><span className="size-[12px] rounded-full bg-[#FEBC2E]" /><span className="size-[12px] rounded-full bg-[#28C840]" /></div>}
            <SplitNotetaker />
          </div>
        </>
      )}
      {(state === "call" || state === "ready" || state === "upcoming" || state === "upcoming-menu") && (
        <div className={`absolute right-[24px] ${mac ? "top-[44px]" : "bottom-[68px]"}`}><NoticeCard kind={state === "upcoming-menu" ? "upcoming" : state} menuOpen={state === "upcoming-menu"} onAct={() => {}} onClose={() => {}} /></div>
      )}
      {/* the way back into the window, where the dock would be */}
      <button type="button" onClick={() => navigate("/")} className={`absolute left-1/2 -translate-x-1/2 flex h-[34px] items-center rounded-full bg-white/15 px-[14px] text-[12.5px] font-medium text-white backdrop-blur-[8px] transition-colors hover:bg-white/25 ${mac ? "bottom-[16px]" : "bottom-[60px]"}`}>Open the app window</button>
      <DemoSwitcher />
    </div>
  );
}
