import { Fragment, useState, type ReactNode } from "react";
import { cn } from "../ui/utils";

/**
 * Documentation chrome for the technical /design-system board. The look is an
 * engineered spec sheet: a big mono section number, a hairline two-column head,
 * mono block labels. Sentence case throughout - no shouting. The real component
 * looks come from the app's own components placed inside the stages.
 */

/** Inline monospace value text. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("ds-mono text-[11px] text-muted-foreground", className)}>{children}</span>;
}

/** Shared reading width for the main column - keeps content compact on wide screens. */
const SHEET = "mx-auto w-full max-w-[1080px]";

/** Top-level group divider (Foundations / Components). */
export function GroupDivider({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="px-6 pb-3.5 pt-7 sm:px-14">
      <div className={cn(SHEET, "flex items-center gap-3.5")}>
        <h2 className="ds-mono text-[12px] font-semibold text-foreground">{label}</h2>
        <span className="h-px flex-1 bg-border" />
        {hint ? <span className="ds-mono text-[10.5px] text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

/** A numbered, anchored spec-sheet section. */
export function Section({
  id,
  num,
  group,
  title,
  desc,
  spec,
  children,
}: {
  id: string;
  num: string;
  group: string;
  title: string;
  desc: string;
  spec?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 border-b border-border bg-white/70 px-6 py-11 sm:px-14"
    >
      <div className={SHEET}>
        <header className="mb-7 grid grid-cols-1 gap-3 md:grid-cols-[160px_minmax(0,1fr)] md:gap-10">
          <span className="ds-mono text-[34px] font-medium leading-none text-primary md:text-[40px]">
            <span className="opacity-40">/ </span>
            {num}
          </span>
          <div className="flex flex-col gap-2">
            <span className="ds-mono text-[11px] text-muted-foreground">
              {group} · #{id}
            </span>
            <h3 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[26px]">
              {title}
            </h3>
            <p className="mt-0.5 max-w-[70ch] text-[14px] leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        </header>
        <div
          className={cn(
            "flex flex-col gap-9 [&_code]:rounded-[4px] [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-px [&_code]:text-[11px] [&_code]:text-foreground",
            !spec && "md:pl-[200px]",
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

/** A labelled block within a section. */
export function Block({ label, note, children }: { label?: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      {label ? (
        <div className="ds-mono border-b border-border pb-2 text-[11.5px] font-semibold text-foreground">{label}</div>
      ) : null}
      <div className="flex flex-col gap-3.5">{children}</div>
      {note ? <p className="max-w-[70ch] text-[13px] leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
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
    <button type="button" onClick={copy} title="Copy" className="group flex w-[112px] shrink-0 flex-col gap-2 text-left outline-none">
      <span
        className={cn("h-[60px] w-full rounded-[10px] transition-transform duration-200 group-hover:-translate-y-0.5", outline ? "border border-border" : "border border-black/[0.04]")}
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

/** Key → value spec list. Values render monospace. */
export function SpecList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2">
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-[12px] text-muted-foreground">{k}</dt>
          <dd className="ds-mono text-[12px] text-foreground">{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** Several titled spec lists, side by side. */
export function SpecCols({ groups }: { groups: { title: string; rows: [string, ReactNode][] }[] }) {
  return (
    <div className="flex flex-wrap gap-x-16 gap-y-7">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-3">
          <span className="ds-mono text-[11px] text-muted-foreground">{g.title}</span>
          <SpecList rows={g.rows} />
        </div>
      ))}
    </div>
  );
}

/** A compact props/spec matrix - one row per variant or size. */
export function PropTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="ds-mono px-1 pb-2.5 text-[11px] font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={cn("ds-mono px-1 py-2 align-top text-[12px]", j === 0 ? "text-foreground" : "text-muted-foreground")}>
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

/** A small mono caption above a demo row (foundations / non-annotated demos). */
export function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="ds-mono text-[11px] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
