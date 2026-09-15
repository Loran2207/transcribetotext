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
  { title: "Desktop banner on the web", key: "ttt_demo_banner", kind: "session", options: [{ value: "", label: "Right panel card" }, { value: "home", label: "Wide banner under the cards" }, { value: "sidebar", label: "Block in the navigation" }] },
  { title: "Permissions", key: "ttt_demo_perm", kind: "session", options: [{ value: "", label: "Both allowed" }, { value: "mic", label: "Microphone only" }, { value: "1", label: "Nothing allowed" }] },
  { title: "Closed app (the /desk scene)", key: "ttt_demo_desk", kind: "session", options: [{ value: "widget", label: "Recording widget" }, { value: "hover", label: "Widget, hover: last words" }, { value: "paused", label: "On hold" }, { value: "ended", label: "Call ended" }, { value: "writing", label: "Writing the note" }, { value: "done", label: "Note written" }, { value: "call", label: "Notice: call detected" }, { value: "upcoming", label: "Notice: up next" }, { value: "upcoming-menu", label: "Notice: up next, menu" }, { value: "ready", label: "Notice: notes ready" }, { value: "split", label: "Side by side" }] },
];

/* the three places the prototype can be looked at; everything else is a rarer state, folded away */
const PLACES: { id: "web" | "mac" | "win"; label: string; hint: string }[] = [
  { id: "web", label: "Web", hint: "The web portal in a browser" },
  { id: "mac", label: "Mac", hint: "The desktop app on macOS" },
  { id: "win", label: "Windows", hint: "The desktop app on Windows" },
];

export function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!DEMO_TOOLS) return null;
  const shell = useShell();
  const notice = useDemo("notice"), perm = useDemo("perm"), desk = useDemo("desk"), banner = useDemo("banner");
  const place: "web" | "mac" | "win" = shell.shell === "web" ? "web" : shell.os === "win" ? "win" : "mac";
  const goTo = (id: "web" | "mac" | "win") => {
    if (id === "web") setShellFlag("ttt_shell", "web");
    else { setShellFlag("ttt_shell", "desktop"); setShellFlag("ttt_os", id); }
  };
  const rare = GROUPS.filter((g) => g.kind === "session");
  const current = (g: typeof GROUPS[number]) => g.key === "ttt_demo_notice" ? (notice ?? "") : g.key === "ttt_demo_perm" ? (perm ?? "") : g.key === "ttt_demo_desk" ? (desk ?? "") : (banner ?? "");
  const choose = (g: typeof GROUPS[number], value: string) => {
    setDemo(g.key.replace("ttt_demo_", ""), value || null);
    if (g.key === "ttt_demo_desk" && pathname !== "/desk") navigate("/desk");
  };
  return (
    <div className="fixed bottom-[16px] left-[16px] z-[300] text-[12.5px]">
      {open ? (
        <div className="w-[300px] max-h-[calc(100vh-40px)] overflow-auto rounded-[16px] border border-border bg-popover p-[14px] text-foreground" style={{ boxShadow: "0 16px 40px rgba(15,23,42,0.18)" }}>
          <div className="mb-[10px] flex items-center justify-between">
            <span className="text-[13px] font-semibold">Where to look</span>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Icon icon={Cancel01Icon} className="size-[12px]" strokeWidth={2} /></button>
          </div>
          {/* one segmented control: Web, Mac, Windows */}
          <div className="grid grid-cols-3 gap-[4px] rounded-[12px] bg-muted p-[4px]">
            {PLACES.map((pl) => (
              <button key={pl.id} type="button" title={pl.hint} onClick={() => goTo(pl.id)} className={`h-[34px] rounded-[9px] text-[13px] font-medium transition-colors ${place === pl.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{pl.label}</button>
            ))}
          </div>
          <p className="mt-[8px] text-[11.5px] leading-[15px] text-muted-foreground">{PLACES.find((pl) => pl.id === place)?.hint}. Switches at once, no reload.</p>
          <button type="button" onClick={() => setMore((v) => !v)} className="mt-[12px] flex w-full items-center justify-between rounded-[10px] px-[2px] py-[4px] text-[12px] text-muted-foreground hover:text-foreground">
            <span>More states</span><span aria-hidden>{more ? "\u2212" : "+"}</span>
          </button>
          {more && (
            <div className="mt-[6px] flex flex-col gap-[12px] border-t border-border pt-[10px]">
              {rare.map((g) => (
                <div key={g.key}>
                  <p className="mb-[5px] text-[12px] text-muted-foreground">{g.title}</p>
                  <div className="flex flex-wrap gap-[5px]">
                    {g.options.map((o) => {
                      const active = current(g) === o.value;
                      return <button key={o.value} type="button" onClick={() => choose(g, o.value)} className={`rounded-full border px-[9px] py-[3px] transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted"}`}>{o.label}</button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} title="Web, Mac or Windows" aria-label="Prototype states" className="flex size-[28px] items-center justify-center rounded-full border border-border bg-popover text-muted-foreground opacity-60 transition-opacity hover:opacity-100">
          <Icon icon={Settings01Icon} className="size-[13px]" strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}
