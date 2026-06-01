import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../ui/utils";

/**
 * Redline measurement engine, ported from the design bundle's DSAnnotate.
 *
 * An AnnoStage drops a real component onto blueprint paper, measures its
 * actually-rendered box, and draws exact dimension lines (height / width) plus
 * leader callouts (radius, text, gap…). Because everything is measured live and
 * redrawn on resize + font load, the numbers can never drift from the component.
 */

type StageVariant = "lg" | "row" | "mini";

export type Anno =
  | { t: "h"; label?: string }
  | { t: "w"; label?: string }
  | {
      t: "lead";
      /** anchor point on the target, 0–1 of its width/height */
      fx?: number;
      fy?: number;
      /** leader offset from the anchor, px */
      dx?: number;
      dy?: number;
      label: string;
      side?: "l" | "r" | "c";
    };

export const H: Anno = { t: "h" };
export const W: Anno = { t: "w" };
export const lead = (
  fx: number,
  fy: number,
  dx: number,
  dy: number,
  label: string,
  side?: "l" | "r" | "c",
): Anno => ({ t: "lead", fx, fy, dx, dy, label, side });

const DIM = 30; // distance of a dimension line from the target edge
const CAP = 4; // half-length of an end-cap tick

type Line = { x1: number; y1: number; x2: number; y2: number; dash?: boolean };
type Dot = { cx: number; cy: number };
type Label = { x: number; y: number; text: string; ax: "l" | "r" | "c"; ay: "t" | "m" | "b"; dim?: boolean };
type Geo = { sw: number; sh: number; lines: Line[]; dots: Dot[]; labels: Label[] };

const EMPTY: Geo = { sw: 0, sh: 0, lines: [], dots: [], labels: [] };

function translate(ax: Label["ax"], ay: Label["ay"]) {
  const tx = ax === "r" ? "0" : ax === "c" ? "-50%" : "-100%";
  const ty = ay === "b" ? "0" : ay === "m" ? "-50%" : "-100%";
  return `translate(${tx}, ${ty})`;
}

export function AnnoStage({
  annos,
  variant = "lg",
  children,
}: {
  annos: Anno[];
  variant?: StageVariant;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo>(EMPTY);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const target = targetRef.current;
    if (!stage || !target) return;

    const sb = stage.getBoundingClientRect();
    const tb = target.getBoundingClientRect();
    const x = tb.left - sb.left;
    const y = tb.top - sb.top;
    const w = tb.width;
    const h = tb.height;

    const lines: Line[] = [];
    const dots: Dot[] = [];
    const labels: Label[] = [];

    for (const a of annos) {
      if (a.t === "h") {
        const lx = x - DIM;
        lines.push({ x1: lx, y1: y, x2: lx, y2: y + h });
        lines.push({ x1: lx - CAP, y1: y, x2: lx + CAP, y2: y });
        lines.push({ x1: lx - CAP, y1: y + h, x2: lx + CAP, y2: y + h });
        lines.push({ x1: lx, y1: y, x2: x, y2: y, dash: true });
        lines.push({ x1: lx, y1: y + h, x2: x, y2: y + h, dash: true });
        labels.push({ x: lx - 9, y: y + h / 2, text: a.label ?? `${Math.round(h)}px`, ax: "l", ay: "m", dim: true });
      } else if (a.t === "w") {
        const ly = y + h + DIM;
        lines.push({ x1: x, y1: ly, x2: x + w, y2: ly });
        lines.push({ x1: x, y1: ly - CAP, x2: x, y2: ly + CAP });
        lines.push({ x1: x + w, y1: ly - CAP, x2: x + w, y2: ly + CAP });
        lines.push({ x1: x, y1: y + h, x2: x, y2: ly, dash: true });
        lines.push({ x1: x + w, y1: y + h, x2: x + w, y2: ly, dash: true });
        labels.push({ x: x + w / 2, y: ly + 9, text: a.label ?? `${Math.round(w)}px`, ax: "c", ay: "b", dim: true });
      } else {
        const sx = x + (a.fx ?? 0.5) * w;
        const sy = y + (a.fy ?? 0.5) * h;
        const dx = a.dx ?? 0;
        const dy = a.dy ?? 0;
        const ex = sx + dx;
        const ey = sy + dy;
        lines.push({ x1: sx, y1: sy, x2: ex, y2: ey });
        dots.push({ cx: sx, cy: sy });
        const side = a.side ?? (dx > 0 ? "r" : dx < 0 ? "l" : "c");
        const ay: Label["ay"] = dy < 0 ? "t" : dy > 0 ? "b" : "m";
        const lx = ex + (side === "r" ? 4 : side === "l" ? -4 : 0);
        const ly = ey + (ay === "t" ? -3 : ay === "b" ? 3 : 0);
        labels.push({ x: lx, y: ly, text: a.label, ax: side, ay });
      }
    }

    setGeo({ sw: stage.offsetWidth, sh: stage.offsetHeight, lines, dots, labels });
  }, [annos]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (stageRef.current) ro.observe(stageRef.current);
    if (targetRef.current) ro.observe(targetRef.current);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  return (
    <div ref={stageRef} className={cn("af-stage", `af-stage--${variant}`)}>
      <svg className="af-overlay" width={geo.sw} height={geo.sh}>
        {geo.lines.map((l, i) => (
          <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeDasharray={l.dash ? "2 3" : undefined} />
        ))}
        {geo.dots.map((d, i) => (
          <circle key={`d${i}`} cx={d.cx} cy={d.cy} r={2.4} />
        ))}
      </svg>
      <div ref={targetRef} className="af-target">
        {children}
      </div>
      {geo.labels.map((lb, i) => (
        <span
          key={`b${i}`}
          className={cn("af-label", lb.dim && "af-label--dim")}
          style={{ left: lb.x, top: lb.y, transform: translate(lb.ax, lb.ay) }}
        >
          {lb.text}
        </span>
      ))}
    </div>
  );
}

/** A captioned stage — tag above, annotated component below. */
export function Cell({
  tag,
  annos,
  variant,
  children,
}: {
  tag: string;
  annos: Anno[];
  variant?: StageVariant;
  children: ReactNode;
}) {
  return (
    <div className="af-cell">
      <span className="af-tag">{tag}</span>
      <AnnoStage annos={annos} variant={variant}>
        {children}
      </AnnoStage>
    </div>
  );
}

export function StageGrid({ children }: { children: ReactNode }) {
  return <div className="af-grid">{children}</div>;
}

export function StageStack({ children }: { children: ReactNode }) {
  return <div className="af-stack">{children}</div>;
}
