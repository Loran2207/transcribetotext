import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Settings01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { DEMO_TOOLS, useDemo, useShell, setDemo, setShellFlag } from "./shell";

/* The prototype's hidden states, as a panel a designer can reach without the
   address bar. Lives only in builds with VITE_DEMO_TOOLS=1 (the preview
   branch); production never renders it. Every choice reloads the page, because
   the flags are read once at start, exactly as the address flags are. */
const GROUPS: { title: string; key: string; kind: "local" | "session"; options: { value: string; label: string }[] }[] = [
  { title: "Shell", key: "ttt_shell", kind: "local", options: [{ value: "desktop", label: "Desktop app" }, { value: "web", label: "Web portal" }] },
  { title: "System", key: "ttt_os", kind: "local", options: [{ value: "mac", label: "macOS" }, { value: "win", label: "Windows" }] },
  { title: "Notice in the corner", key: "ttt_demo_notice", kind: "session", options: [{ value: "", label: "None" }, { value: "call", label: "Zoom call detected" }, { value: "upcoming", label: "Up next" }, { value: "upcoming-menu", label: "Up next, menu open" }, { value: "ready", label: "Notes are ready" }] },
  { title: "Permissions", key: "ttt_demo_perm", kind: "session", options: [{ value: "", label: "Both allowed" }, { value: "mic", label: "Microphone only" }, { value: "1", label: "Nothing allowed" }] },
  { title: "Closed app (the /desk scene)", key: "ttt_demo_desk", kind: "session", options: [{ value: "widget", label: "Recording widget" }, { value: "hover", label: "Widget, hover: last words" }, { value: "paused", label: "On hold" }, { value: "ended", label: "Call ended" }, { value: "writing", label: "Writing the note" }, { value: "done", label: "Note written" }, { value: "call", label: "Notice: call detected" }, { value: "upcoming", label: "Notice: up next" }, { value: "upcoming-menu", label: "Notice: up next, menu" }, { value: "ready", label: "Notice: notes ready" }, { value: "split", label: "Side by side" }] },
];

export function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!DEMO_TOOLS) return null;
  const shell = useShell();
  const notice = useDemo("notice"), perm = useDemo("perm"), desk = useDemo("desk");
  const current = (g: typeof GROUPS[number]) => g.key === "ttt_shell" ? shell.shell : g.key === "ttt_os" ? shell.os : g.key === "ttt_demo_notice" ? (notice ?? "") : g.key === "ttt_demo_perm" ? (perm ?? "") : (desk ?? "widget");
  const choose = (g: typeof GROUPS[number], value: string) => {
    if (g.kind === "local") setShellFlag(g.key as "ttt_shell" | "ttt_os", value);
    else setDemo(g.key.replace("ttt_demo_", ""), value || null);
    if (g.key === "ttt_demo_desk" && pathname !== "/desk") navigate("/desk");
  };
  return (
    <div className="fixed bottom-[16px] left-[16px] z-[300] text-[12.5px]">
      {open ? (
        <div className="w-[300px] max-h-[calc(100vh-40px)] overflow-auto rounded-[16px] border border-border bg-popover p-[14px] text-foreground" style={{ boxShadow: "0 16px 40px rgba(15,23,42,0.18)" }}>
          <div className="mb-[10px] flex items-center justify-between">
            <span className="text-[13px] font-semibold">Prototype states</span>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Icon icon={Cancel01Icon} className="size-[12px]" strokeWidth={2.2} /></button>
          </div>
          <div className="flex flex-col gap-[12px]">
            {GROUPS.map((g) => (
              <div key={g.key}>
                <p className="mb-[5px] text-[12px] text-muted-foreground">{g.title}</p>
                <div className="flex flex-wrap gap-[5px]">
                  {g.options.map((o) => {
                    const active = current(g) === o.value;
                    return <button key={o.value} type="button" onClick={() => choose(g, o.value)} className={`rounded-full border px-[9px] py-[3px] transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{o.label}</button>;
                  })}
                </div>
              </div>
            ))}
            <p className="text-[11.5px] leading-[15px] text-muted-foreground">Changes apply at once, no reload. The same switches work as address flags: ?shell=desktop&os=mac, ?notice=upcoming, ?perm=mic, /desk?desk=paused. The red and yellow lights hide the window and show the desk.</p>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} title="Prototype states" aria-label="Prototype states" className="flex size-[28px] items-center justify-center rounded-full border border-border bg-popover text-muted-foreground opacity-50 transition-opacity hover:opacity-100" style={{ boxShadow: "0 6px 18px rgba(15,23,42,0.12)" }}>
          <Icon icon={Settings01Icon} className="size-[13px]" strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}
