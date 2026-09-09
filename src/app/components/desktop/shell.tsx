import { useEffect, useState, type ReactNode } from "react";

/* One product, two shells. The web portal is the default; `?shell=desktop`
   draws the same portal inside the desktop app's window and turns on what only
   the app can do: recording a call on this machine, with the live transcript
   beside your notes. `?os=win` swaps the window controls. `?installed=1` tells
   the web shell the account already has the desktop app. All three are frame
   switches for Figma captures and stay in localStorage so the dev server keeps
   them across navigations. Nothing else reads the address. */

export type Shell = "web" | "desktop";
export type ShellOs = "mac" | "win";

function readFlag<T extends string>(param: string, key: string, allowed: T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const fromUrl = new URLSearchParams(window.location.search).get(param);
  if (fromUrl && (allowed as string[]).includes(fromUrl)) {
    window.localStorage.setItem(key, fromUrl);
    return fromUrl as T;
  }
  const stored = window.localStorage.getItem(key);
  return stored && (allowed as string[]).includes(stored) ? (stored as T) : fallback;
}

/* States only the real app reaches (the OS saw a call start, the note finished
   in the background, first-run permissions) are drawn from a demo flag on the
   address, kept for the tab only: `?notice=call|ready`, `?perm=1`. */
export function readDemo(param: string): string | null {
  if (typeof window === "undefined") return null;
  const key = "ttt_demo_" + param;
  const fromUrl = new URLSearchParams(window.location.search).get(param);
  if (fromUrl) window.sessionStorage.setItem(key, fromUrl);
  return window.sessionStorage.getItem(key);
}

export function readShell() {
  return {
    shell: readFlag<Shell>("shell", "ttt_shell", ["web", "desktop"], "web"),
    os: readFlag<ShellOs>("os", "ttt_os", ["mac", "win"], "mac"),
    installed: readFlag<"0" | "1">("installed", "ttt_app_installed", ["0", "1"], "0") === "1",
  };
}

/* The desktop app can only be installed from a computer, so the web talks about
   it only at the width where the portal shows its computer layout. */
export function useWideScreen() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function useShell() {
  const [state] = useState(readShell);
  return { ...state, desktop: state.shell === "desktop", machine: state.os === "win" ? "this PC" : "this Mac" };
}

/* The app's window controls, laid over the portal's own top row: the three
   lights take the corner of the sidebar header on macOS, the caption controls
   take the corner of the top bar on Windows. No title bar of its own, so the
   app spends no height on being an app; the CSS in index.css makes room. */
export function DesktopWindowFrame({ children }: { children: ReactNode }) {
  const { desktop, os } = useShell();
  useEffect(() => {
    document.documentElement.dataset.shell = desktop ? "desktop" : "web";
    document.documentElement.dataset.os = os;
  }, [desktop, os]);
  if (!desktop) return <>{children}</>;
  return (
    <>
      {children}
      {os === "mac" ? (
        <div className="pointer-events-none fixed left-[16px] top-[22px] z-[70] flex items-center gap-[8px]" aria-hidden>
          <span className="size-[12px] rounded-full" style={{ backgroundColor: "#FF5F57" }} />
          <span className="size-[12px] rounded-full" style={{ backgroundColor: "#FEBC2E" }} />
          <span className="size-[12px] rounded-full" style={{ backgroundColor: "#28C840" }} />
        </div>
      ) : (
        <div className="pointer-events-none fixed right-0 top-0 z-[70] flex h-[36px] items-stretch" aria-hidden>
          {[
            <svg key="min" width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>,
            <svg key="max" width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" /></svg>,
            <svg key="close" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" /></svg>,
          ].map((glyph, i) => (
            <span key={i} className="flex w-[46px] items-center justify-center text-foreground/80">{glyph}</span>
          ))}
        </div>
      )}
    </>
  );
}

/* read once at load, while the address still carries the flags: the login page
   drops them before any desktop component mounts */
if (typeof window !== "undefined") { readDemo("notice"); readDemo("perm"); readDemo("widget"); readDemo("desk"); }
