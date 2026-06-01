import { House, FileText, UserMultiple02Icon, Calendar, Layers } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "../../ui/icon";
import { Icon } from "../../ui/icon";
import { SectionFrame, SubBlock, SpecList } from "../board";

const NAV: { label: string; icon: IconSvgElement; active?: boolean }[] = [
  { label: "Home", icon: House, active: true },
  { label: "My records", icon: FileText },
  { label: "Shared with me", icon: UserMultiple02Icon },
  { label: "Calendar", icon: Calendar },
  { label: "Templates", icon: Layers },
];

export function NavSection() {
  return (
    <SectionFrame
      id="nav"
      group="Components"
      title="Navigation"
      description="The sidebar lives on a faint off-white surface. Items are 8px-radius rows: hover paints an accent wash, active fills a 10% brand-blue tint with a blue label and thin-stroke HugeIcon."
    >
      <SubBlock label="Sidebar nav items">
        <div className="w-[230px] rounded-[12px] border border-sidebar-border bg-sidebar p-2">
          {NAV.map((item) => (
            <div
              key={item.label}
              className={
                "flex h-[34px] cursor-pointer items-center gap-2.5 rounded-[8px] px-3 text-[13px] transition-colors " +
                (item.active
                  ? "font-medium text-sidebar-primary"
                  : "text-foreground hover:bg-accent")
              }
              style={item.active ? { background: "color-mix(in srgb, var(--sidebar-primary) 10%, white)" } : undefined}
            >
              <Icon icon={item.icon} className="size-[17px] opacity-90" strokeWidth={1.4} />
              {item.label}
            </div>
          ))}
        </div>
      </SubBlock>

      <SubBlock label="Specs">
        <SpecList
          rows={[
            ["row height", "34px"],
            ["padding", "0 12px · px-3"],
            ["radius", "8px"],
            ["text", "13px (active 500)"],
            ["icon", "17px · stroke 1.4"],
            ["active", "10% sidebar-primary + blue label"],
            ["hover", "accent wash"],
          ]}
        />
      </SubBlock>
    </SectionFrame>
  );
}
