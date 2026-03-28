import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
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

const FEATURE_PILLS = ["Record", "Upload", "Link"];

export function AuthLayout({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-row w-full min-h-screen">
      {/* Left panel — dark branded side, hidden on mobile */}
      <div
        className="hidden lg:flex w-[55%] flex-col relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 30%, oklch(0.22 0.07 264) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, oklch(0.16 0.05 280) 0%, transparent 50%), oklch(0.08 0.01 264)",
        }}
      >
        {/* Top: Logo */}
        <div className="p-8 relative z-10">
          <AuthLogo />
        </div>

        {/* Center: Illustration */}
        <div className="flex-1 flex items-center justify-center px-10 relative z-10">
          <motion.div
            className="w-full flex justify-center"
            initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          >
            <AuthIllustration />
          </motion.div>
        </div>

        {/* Bottom: Tagline + Feature pills */}
        <div className="p-8 pb-10 relative z-10">
          <p
            className="text-xl font-semibold mb-4"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Turn audio into text instantly
          </p>
          <div className="flex gap-2 flex-wrap">
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.65)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
