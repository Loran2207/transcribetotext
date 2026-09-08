import { useEffect, useState, type ReactNode } from "react";

/* One product, two shells. The web portal is the default; `?shell=desktop`
   draws the same portal inside the desktop app's window and turns on what only
   the app can do: recording a call on this machine, the live transcript beside
   your notes, dictation. `?os=win` swaps the window controls. Both are frame
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

export function readShell(): { shell: Shell; os: ShellOs } {
  return {
    shell: readFlag<Shell>("shell", "ttt_shell", ["web", "desktop"], "web"),
    os: readFlag<ShellOs>("os", "ttt_os", ["mac", "win"], "mac"),
  };
}

export function useShell() {
  const [state] = useState(readShell);
  return { ...state, desktop: state.shell === "desktop", machine: state.os === "win" ? "this PC" : "this Mac" };
}

export const TITLE_BAR_H = 38;

/* The app's own window. Only the title bar differs between systems: macOS has
   the three lights on the left, Windows the caption controls on the right. No
   wallpaper and no fake desktop, the frame is the only thing that says "app". */
export function DesktopWindowFrame({ children }: { children: ReactNode }) {
  const { desktop, os } = useShell();
  useEffect(() => {
    document.documentElement.dataset.shell = desktop ? "desktop" : "web";
  }, [desktop]);
  if (!desktop) return <>{children}</>;
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar">
      <div
        className="relative flex shrink-0 items-center bg-sidebar"
        style={{ height: TITLE_BAR_H, WebkitAppRegion: "drag" } as React.CSSProperties}
        aria-hidden
      >
        {os === "mac" ? (
          <div className="flex items-center gap-[8px] pl-[14px]">
            <span className="size-[12px] rounded-full" style={{ backgroundColor: "#FF5F57" }} />
            <span className="size-[12px] rounded-full" style={{ backgroundColor: "#FEBC2E" }} />
            <span className="size-[12px] rounded-full" style={{ backgroundColor: "#28C840" }} />
          </div>
        ) : (
          <div className="ml-auto flex h-full items-stretch">
            {[
              <svg key="min" width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>,
              <svg key="max" width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" /></svg>,
              <svg key="close" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" /></svg>,
            ].map((glyph, i) => (
              <span key={i} className="flex w-[46px] items-center justify-center text-foreground/80">{glyph}</span>
            ))}
          </div>
        )}
        <span className="pointer-events-none absolute inset-x-0 text-center text-[12.5px] font-medium text-muted-foreground">
          TranscribeToText
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
