import type { ReactNode } from "react";
import { X } from "@hugeicons/core-free-icons";

import { Icon } from "@/app/components/ui/icon";
import { Drawer, DrawerContent, DrawerTitle } from "@/app/components/ui/drawer";

/* The one bottom sheet that answers "what can I do with this".
 *
 * A record, a folder and the record page all used to open their own version:
 * one led with a grid of tiles and then a list, one was a list under the word
 * "Actions" with no idea what it was acting on, one named the object properly.
 * They are the same question, so they are now the same sheet - the object at
 * the top with its name and what kind of thing it is, and one plain list of
 * what can be done to it.
 *
 * The left edge is 18 for every part: the mark's own box, and every row's icon
 * box (6 on the wrapper plus 12 on the row).
 */
export function ActionSheet({
  open, onOpenChange, mark, title, kind, children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The object's own glyph, sitting in the header tile. */
  mark: ReactNode;
  title: string;
  /** What kind of thing this is, in the product's own words. */
  kind?: string;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="[&>div:first-child]:hidden">
        <div className="flex items-center gap-[10px] px-[18px] pt-[18px] pb-[10px]">
          <span className="shrink-0 flex items-center justify-center size-[36px] rounded-[10px] bg-muted">
            {mark}
          </span>
          <div className="min-w-0 flex-1">
            <DrawerTitle className="truncate text-left" style={{ fontSize: 15, fontWeight: 600 }}>
              {title}
            </DrawerTitle>
            {kind ? (
              <p className="truncate text-left text-[12px] leading-[16px] text-muted-foreground">{kind}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-mr-[4px] size-[32px] shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <Icon icon={X} className="size-[18px]" strokeWidth={2} />
          </button>
        </div>
        <div
          className="px-[6px] pt-[4px] flex flex-col"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function ActionSheetItem({
  icon, label, onClick, destructive = false, iconClassName, iconFill,
}: {
  icon: React.ComponentProps<typeof Icon>["icon"];
  label: string;
  onClick: () => void;
  destructive?: boolean;
  /** For the one row whose glyph carries its own state - the star. */
  iconClassName?: string;
  iconFill?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center gap-[13px] h-[50px] px-[12px] rounded-[12px] text-left transition-colors " +
        (destructive ? "active:bg-destructive/10" : "active:bg-muted")
      }
    >
      <Icon
        icon={icon}
        className={iconClassName ?? "size-[19px] " + (destructive ? "text-destructive" : "text-muted-foreground")}
        fill={iconFill}
        strokeWidth={1.7}
      />
      <span
        className={"flex-1 " + (destructive ? "text-destructive" : "text-foreground")}
        style={{ fontSize: 14, fontWeight: 500 }}
      >
        {label}
      </span>
    </button>
  );
}
