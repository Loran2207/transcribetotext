import { Fragment, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "../ui/utils";

/**
 * Layout primitives for the design-system board. Plain framed panels on a faint
 * canvas — hairline borders over heavy shadow, generous breathing room — so the
 * page mirrors the system it documents and maps cleanly to Figma frames later.
 */

const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

/** Inline monospace token / value text. */
export function Mono({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={cn("text-[11px] tabular-nums text-muted-foreground", className)}
      style={{ fontFamily: MONO, ...style }}
    >
      {children}
    </span>
  );
}

/** A quiet block label — sentence case, no shouting. */
export function SubLabel({ children }: { children: ReactNode }) {
  return <div className="text-[13px] font-medium text-foreground">{children}</div>;
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

/** A top-level group divider (Foundations, Components). */
export function GroupHeading({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4 px-1 pt-4 first:pt-0">
      <h2 className="text-[14px] font-semibold tracking-tight text-foreground">{label}</h2>
      <span className="h-px flex-1 bg-border" />
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
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
      aria-label={`${group} — ${title}`}
      className="scroll-mt-[88px] rounded-[14px] border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <header className="mb-7 flex flex-col gap-1">
        <h3 className="text-[18px] font-semibold leading-tight text-foreground">{title}</h3>
        <p className="mt-0.5 max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </header>
      <div className="flex flex-col gap-9 [&_code]:rounded-[4px] [&_code]:bg-muted [&_code]:px-1 [&_code]:py-px [&_code]:text-[11px] [&_code]:text-foreground">
        {children}
      </div>
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
        <span className="truncate text-[11px] font-medium text-foreground">{name}</span>
        <Mono>{copied ? "copied" : value}</Mono>
        {usage ? <span className="text-[10.5px] leading-snug text-muted-foreground">{usage}</span> : null}
      </span>
    </button>
  );
}

/**
 * Key → value spec list for a single component (height, padding, text…).
 * Values render monospace so a developer can read exact measurements.
 */
export function SpecList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2">
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-[12px] text-muted-foreground">{k}</dt>
          <dd className="text-[12px] text-foreground" style={{ fontFamily: MONO }}>{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** A compact props/spec matrix — one row per variant or size. */
export function PropTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="px-1 pb-2 text-[11px] font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-1 py-2 align-top text-[12px]",
                    j === 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                  style={{ fontFamily: MONO }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
