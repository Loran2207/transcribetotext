import type { ReactNode } from "react";
import svgPaths from "../../imports/svg-i3wf63n6gj";
import { AuthIllustration } from "./auth-illustration";

function AuthLogo() {
  return (
    <div className="h-[30px] overflow-clip relative shrink-0 w-[180px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 180 30">
        <path d={svgPaths.p2badec00} fill="var(--primary)" />
        <path d={svgPaths.p1a0b7800} fill="var(--primary)" />
        <path clipRule="evenodd" d={svgPaths.p27195800} fill="var(--primary)" fillRule="evenodd" />
        <path d={svgPaths.p13614280} fill="white" />
        <path d={svgPaths.p11015500} fill="white" />
        <path d={svgPaths.p1f84c200} fill="white" />
        <path d={svgPaths.p3c365b00} fill="white" />
        <path d={svgPaths.p10e82600} fill="white" />
        <path d={svgPaths.pc3be80} fill="white" />
        <path d={svgPaths.p1b650100} fill="white" />
        <path d={svgPaths.p2868a650} fill="white" />
        <path d={svgPaths.p284dfb60} fill="white" />
        <path d={svgPaths.p1bf24200} fill="white" />
        <path d={svgPaths.p3f098bc0} fill="white" />
        <path d={svgPaths.p27b8300} fill="white" />
        <path d={svgPaths.p2a7a24b0} fill="white" />
        <path d={svgPaths.p13ca3e70} fill="white" />
        <path d={svgPaths.padf6a00} fill="white" />
        <path d={svgPaths.p4d43600} fill="white" />
        <path d={svgPaths.p81b6100} fill="white" />
      </svg>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-row w-full min-h-screen">
      {/* Left panel — immersive dark branded side, hidden on mobile */}
      <div
        className="hidden lg:flex w-[55%] flex-col relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 30%, rgba(59,130,246,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 80% 70%, rgba(139,92,246,0.12) 0%, transparent 55%), radial-gradient(ellipse 40% 30% at 50% 10%, rgba(16,185,129,0.06) 0%, transparent 50%), #050508",
        }}
      >
        {/* Top-left: Logo */}
        <div className="absolute top-8 left-10 z-10">
          <AuthLogo />
        </div>

        {/* Full-panel illustration */}
        <AuthIllustration />
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
