import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { SVGProps, Ref } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  icon: IconSvgElement;
  size?: string | number;
  strokeWidth?: number;
  ref?: Ref<SVGSVGElement>;
}

export function Icon({ icon, size, strokeWidth, className, ...rest }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      {...rest}
    />
  );
}

export type { IconSvgElement };
