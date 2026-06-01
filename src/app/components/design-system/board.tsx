import { useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "../ui/utils";

/**
 * Layout primitives for the design-system board. Everything is a plain framed
 * panel on a faint canvas — hairline borders over heavy shadow, generous
 * breathing room — so the page mirrors the system it documents and maps cleanly
 * to Figma frames later.
 */

/** Inline monospace token / value text. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("font-mono text-[11px] tabular-nums text-muted-foreground", className)}
      style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}
    >
      {children}
    </span>
  );
}

/** Small uppercase divider label inside a frame. */
export function SubLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </div>
  );
}

/** A labelled sub-section within a section frame. */
export function SubBlock({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      {label ? <SubLabel>{label}</SubLabel> : null}
      {children}
    </div>
  );
}

/** A titled, anchored panel. Each maps to one Figma frame. */
export function SectionFrame({
  id,
  group,
  title,
  description,
  children,
}: {
  id: string;
  group: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[88px] rounded-[14px] border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <header className="mb-7 flex flex-col gap-1.5">
        <SubLabel>{group}</SubLabel>
        <h2 className="text-[20px] font-semibold leading-tight text-foreground">{title}</h2>
        <p className="max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </header>
      <div className="flex flex-col gap-9">{children}</div>
    </section>
  );
}

/** Click-to-copy color swatch with a token name + value caption. */
export function Swatch({
  css,
  name,
  value,
  usage,
  outline,
}: {
  css: string;
  name: string;
  value: string;
  usage?: string;
  outline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(name.startsWith("--") ? name : value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1100);
      },
      () => {},
    );
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy"
      className="group flex w-[112px] shrink-0 flex-col gap-2 text-left outline-none"
    >
      <span
        className={cn(
          "h-[60px] w-full rounded-[10px] transition-transform duration-200 group-hover:-translate-y-0.5",
          outline ? "border border-border" : "border border-black/[0.04]",
        )}
        style={{ background: css }}
      />
      <span className="flex flex-col gap-0.5">
        <span className="truncate text-[11px] font-semibold text-foreground">{name}</span>
        <Mono>{copied ? "copied" : value}</Mono>
        {usage ? <span className="text-[10.5px] leading-snug text-muted-foreground">{usage}</span> : null}
      </span>
    </button>
  );
}

/** A small spec tag, e.g. a px / weight annotation under a specimen. */
export function Spec({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Mono className="text-[10.5px]" >
      <span style={style}>{children}</span>
    </Mono>
  );
}
