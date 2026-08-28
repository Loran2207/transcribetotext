import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { SVGProps, Ref } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  icon: IconSvgElement;
  size?: string | number;
  strokeWidth?: number;
  ref?: Ref<SVGSVGElement>;
}

/* fill is resolved here and never handed on as undefined.
 *
 * HugeiconsIcon builds its svg props as { ...defaults, ...rest }, so a caller
 * passing fill={undefined} wins over the package's own fill: "none", React
 * drops the attribute, and the svg falls back to SVG's initial fill - black.
 * Every closed path in the glyph then renders as a solid blob. */
export function Icon({ icon, size, strokeWidth, className, fill, ...rest }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      fill={fill ?? "none"}
      {...rest}
    />
  );
}

export type { IconSvgElement };
