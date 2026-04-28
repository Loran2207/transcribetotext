import { useEffect, useRef, useState } from "react";
import { Mail } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";

export interface LegalSectionData {
  id: string;
  num: string;
  title: string;
  body: React.ReactNode;
}

export interface LegalDocumentViewProps {
  effective: string;
  lastReviewed: string;
  pdfHref?: string;
  sections: LegalSectionData[];
}

function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return window;
}

export function LegalDocumentView({
  effective,
  lastReviewed,
  pdfHref = "#",
  sections,
}: LegalDocumentViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scrollParent = findScrollParent(root);
    const observerRoot =
      scrollParent instanceof Window ? null : scrollParent;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: observerRoot,
        rootMargin: "0px 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  function handleTocClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const scrollParent = findScrollParent(rootRef.current);
    if (scrollParent instanceof Window) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 16,
        behavior: "smooth",
      });
    } else {
      const top =
        target.getBoundingClientRect().top -
        scrollParent.getBoundingClientRect().top +
        scrollParent.scrollTop -
        16;
      scrollParent.scrollTo({ top, behavior: "smooth" });
    }
    setActiveId(id);
  }

  return (
    <div ref={rootRef} className="flex flex-col">
      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-6 text-[12.5px] text-muted-foreground">
        <span>Effective {effective}</span>
        <span className="size-[3px] rounded-full bg-current opacity-50" />
        <span>Last reviewed {lastReviewed}</span>
        <span className="size-[3px] rounded-full bg-current opacity-50" />
        <a href={pdfHref} className="text-primary hover:underline">
          Download as PDF
        </a>
      </div>

      {/* Layout: sticky TOC + document */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] md:gap-x-12 gap-y-2 items-start">
        {/* TOC */}
        <nav className="md:sticky md:top-2 flex md:flex-col flex-row flex-wrap md:flex-nowrap md:gap-y-0.5">
          <div className="hidden md:block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2 ml-3">
            On this page
          </div>
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => handleTocClick(e, s.id)}
                className={`px-3 py-1.5 text-[12.5px] leading-[1.45] no-underline transition-colors border-b-2 md:border-b-0 md:border-l-2 ${
                  isActive
                    ? "text-primary border-primary font-medium"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {s.title}
              </a>
            );
          })}
        </nav>

        {/* Document */}
        <article className="min-w-0 max-w-[640px] text-foreground">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              className={`py-7 border-b border-border last:border-b-0 ${
                i === 0 ? "pt-0" : ""
              }`}
            >
              <h3 className="flex items-baseline gap-2.5 text-[17px] font-semibold -tracking-[0.2px] mb-3 m-0">
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted rounded-md px-[7px] py-0.5 leading-[1.4]">
                  {s.num}
                </span>
                {s.title}
              </h3>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

// ── Re-usable typography pieces for legal docs ────────────────

export function LegalP({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="m-0 mb-3 last:mb-0 text-[14px] leading-[1.65] text-foreground/80"
      style={{ textWrap: "pretty" }}
    >
      {children}
    </p>
  );
}

export function LegalH4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[13.5px] font-semibold mt-5 mb-2 text-foreground">
      {children}
    </h4>
  );
}

export function LegalUL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-none p-0 m-0 mt-1.5 mb-3 last:mb-0 flex flex-col gap-2">
      {children}
    </ul>
  );
}

export function LegalLI({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-[18px] text-[14px] leading-[1.55] text-foreground/80 before:content-[''] before:absolute before:left-1 before:top-[9px] before:size-[5px] before:rounded-full before:bg-foreground/35">
      {children}
    </li>
  );
}

export function LegalTaggedUL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-none p-0 m-0 mt-1.5 mb-3 last:mb-0 flex flex-col gap-2">
      {children}
    </ul>
  );
}

export function LegalTaggedLI({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="text-[14px] leading-[1.55] text-foreground/80">
      <strong className="font-semibold text-foreground">{label}</strong>{" "}
      {children}
    </li>
  );
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="text-primary no-underline hover:underline">
      {children}
    </a>
  );
}

export function LegalContactCard({
  company = "Mithrilmobile OÜ",
  address = "J. Vilmsi 47, 10115 Tallinn, Estonia",
  email = "info@transcribetotext.ai",
  label = "Operating entity",
}: {
  company?: string;
  address?: string;
  email?: string;
  label?: string;
}) {
  return (
    <div className="mt-5 rounded-[14px] border border-border bg-card px-5 py-[18px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="text-[14px] font-semibold">{company}</div>
      <div className="text-[13.5px] text-muted-foreground mt-0.5 leading-[1.55]">
        {address}
      </div>
      <div className="flex items-center gap-2 text-[13.5px] mt-2">
        <Icon
          icon={Mail}
          className="size-3.5 text-muted-foreground"
          strokeWidth={1.6}
        />
        <a
          href={`mailto:${email}`}
          className="text-primary no-underline hover:underline"
        >
          {email}
        </a>
      </div>
    </div>
  );
}
