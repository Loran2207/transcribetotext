import type { ReactNode } from "react";
import { Settings } from "@hugeicons/core-free-icons";
import { Button } from "../../ui/button";
import { Icon } from "../../ui/icon";
import { SectionFrame, SubBlock, Mono, PropTable } from "../board";

const SIZE_SPECS = {
  head: ["size", "height", "padding-x", "text", "gap", "radius"],
  rows: [
    ["sm", "32px · h-8", "12px · px-3", "14px / 500", "6px", "full"],
    ["default", "36px · h-9", "16px · px-4", "14px / 500", "8px", "full"],
    ["lg", "40px · h-10", "24px · px-6", "14px / 500", "8px", "full"],
    ["icon", "36×36 · size-9", "—", "—", "—", "full · circle"],
  ],
};

const VARIANT_SPECS = {
  head: ["variant", "surface", "text", "border", "use"],
  rows: [
    ["default", "primary", "primary-foreground", "—", "primary CTA"],
    ["pill-outline", "background", "foreground", "1px border", "secondary"],
    ["pill-dark", "oauth", "oauth-foreground", "—", "OAuth / dark"],
    ["ghost", "transparent", "foreground", "—", "subtle · inline"],
    ["link", "—", "primary", "—", "inline text"],
    ["destructive", "destructive", "white", "—", "delete"],
    ["destructive-outline", "destructive / 10", "destructive", "—", "remove"],
  ],
};

/** Multicolor Google mark for the OAuth button (matches the login screen). */
function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M16.5 8H9v3h4.3c-.2 1-.7 1.5-1.6 2v2h2.6A7.8 7.8 0 0 0 16.5 8z" />
      <path fill="#34A853" d="M9 17c2.2 0 4-.7 5.3-1.9l-2.6-2A4.8 4.8 0 0 1 4.5 10.5H1.8v2.1A8 8 0 0 0 9 17z" />
      <path fill="#FBBC05" d="M4.5 10.5a4.8 4.8 0 0 1 0-3V5.4H1.8a8 8 0 0 0 0 7.2z" />
      <path fill="#EA4335" d="M9 4.2c1.2 0 2.2.4 3 1.2l2.3-2.3A8 8 0 0 0 1.8 5.4l2.7 2.1A4.8 4.8 0 0 1 9 4.2z" />
    </svg>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Mono>{label}</Mono>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function ButtonsSection() {
  return (
    <SectionFrame
      id="buttons"
      group="Components"
      title="Buttons"
      description="Every button is a pill (rounded-full) — no exceptions; icon buttons are circular. Filled blue = primary, white-outline = secondary, slate-dark = OAuth. The gray secondary fill is deliberately unused."
    >
      <SubBlock label="Variants">
        <div className="flex flex-col gap-5">
          <Group label="default · primary">
            <Button>Sign in</Button>
            <Button variant="pill-dark"><GoogleMark />Continue with Google</Button>
          </Group>
          <Group label="pill-outline · the standard secondary">
            <Button variant="pill-outline">Add folder</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Forgot password?</Button>
            <Button variant="ghost" size="icon" aria-label="Settings"><Icon icon={Settings} strokeWidth={1.5} /></Button>
          </Group>
          <Group label="destructive · destructive-outline">
            <Button variant="destructive">Delete</Button>
            <Button variant="destructive-outline">Remove</Button>
          </Group>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          The gray <code>secondary</code> fill and the borderless <code>outline</code> variant exist in the component but are deliberately unused — <code>pill-outline</code> is the standard secondary.
        </p>
      </SubBlock>

      <SubBlock label="Sizes">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
        <PropTable head={SIZE_SPECS.head} rows={SIZE_SPECS.rows} />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Leading icon trims horizontal padding (<code>has-[&gt;svg]:px-3</code>). The icon size auto-fits to 16px (<code>size-4</code>); the gap is 8px.
        </p>
      </SubBlock>

      <SubBlock label="Variant tokens">
        <PropTable head={VARIANT_SPECS.head} rows={VARIANT_SPECS.rows} />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Hover: filled variants drop to 90% (<code>bg-primary/90</code>); ghost and outline take an accent wash. Focus shows a 3px ring at ~20% (<code>ring-ring/50</code>). Disabled is 50% opacity.
        </p>
      </SubBlock>
    </SectionFrame>
  );
}
