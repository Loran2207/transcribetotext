import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft01Icon, House } from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";
import { DesktopWindowFrame } from "./desktop/shell";
import svgPaths from "../../imports/svg-i3wf63n6gj";

/* The page for an address that leads nowhere. One picture from the product's own
   set (the paper plane that already says "gone" in the plan dialogs), the number
   as the headline, one sentence, one primary way out and one secondary. The same
   composition on a phone, a tablet and the desktop; only the scale changes. */
export function NotFoundPage() {
  const navigate = useNavigate();
  /* two ways to say the number: the plane above a typographic 404 (a), or the
     generated glossy "404" that carries the plane itself (b, ?v=b) */
  const [params] = useSearchParams();
  const heroB = params.get("v") === "b";
  const prefersReducedMotion = useReducedMotion();
  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
        };
  return (
    <DesktopWindowFrame>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-[64px] shrink-0 items-center px-5 md:px-8">
          <Link to="/" aria-label="TranscribeToText home" className="block h-[30px] w-[180px]">
            <svg className="block size-full" fill="none" viewBox="0 0 180 30">
              <path d={svgPaths.p2badec00} fill="var(--primary)" />
              <path d={svgPaths.p1a0b7800} fill="var(--primary)" />
              <path clipRule="evenodd" d={svgPaths.p27195800} fill="var(--primary)" fillRule="evenodd" />
              {[svgPaths.p13614280, svgPaths.p11015500, svgPaths.p1f84c200, svgPaths.p3c365b00, svgPaths.p10e82600, svgPaths.pc3be80, svgPaths.p1b650100, svgPaths.p2868a650, svgPaths.p284dfb60, svgPaths.p1bf24200, svgPaths.p3f098bc0, svgPaths.p27b8300, svgPaths.p2a7a24b0, svgPaths.p13ca3e70, svgPaths.padf6a00, svgPaths.p4d43600, svgPaths.p81b6100].map((d, i) => (
                <path key={i} d={d} fill="var(--foreground)" />
              ))}
            </svg>
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          {heroB ? (
            <motion.div {...animProps(0)} className="relative mb-4 flex w-[300px] items-center justify-center md:w-[400px]">
              <div className="absolute inset-x-10 inset-y-6 rounded-full bg-primary/10 blur-3xl" />
              <img src="/images/404-hero.png" alt="404" className="relative w-full object-contain" />
            </motion.div>
          ) : (<>
          <motion.div {...animProps(0)} className="relative mb-2 flex size-[200px] items-center justify-center md:size-[260px]">
            <div className="absolute inset-6 rounded-full bg-primary/10 blur-3xl" />
            <img src="/images/gone-plane.png" alt="" className="relative size-full object-contain" />
          </motion.div>

          <motion.p {...animProps(0.06)} className="text-[64px] font-semibold leading-none tracking-[-0.04em] text-primary md:text-[88px]">
            404
          </motion.p>
          </>)}
          <motion.h1 {...animProps(0.1)} className="mt-4 text-[22px] font-semibold text-foreground md:text-[26px]">
            This page flew away
          </motion.h1>
          <motion.p {...animProps(0.14)} className="mt-2 max-w-[380px] text-[15px] leading-relaxed text-muted-foreground">
            The link may be old, or the note was moved or deleted. Your recordings are safe on the home page.
          </motion.p>

          <motion.div {...animProps(0.2)} className="mt-8 flex w-full max-w-[360px] flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto sm:px-7">
              <Link to="/"><Icon icon={House} size={16} />Back to home</Link>
            </Button>
            <Button type="button" variant="pill-outline" size="lg" className="w-full gap-2 sm:w-auto sm:px-7" onClick={() => navigate(-1)}>
              <Icon icon={ArrowLeft01Icon} size={16} />Go back
            </Button>
          </motion.div>

          <motion.p {...animProps(0.26)} className="mt-8 text-[13px] text-muted-foreground">
            Still lost? <a href="mailto:support@transcribetotext.ai" className="font-medium text-primary hover:underline">Write to support</a>
          </motion.p>
        </main>
      </div>
    </DesktopWindowFrame>
  );
}
