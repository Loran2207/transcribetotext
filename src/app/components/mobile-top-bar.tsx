import { useState } from "react";
import { Menu01Icon, Search } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { SearchModal } from "./search-modal";
import { ProfileDropdown } from "./top-bar";

/* Compact top bar for mobile + tablet (hidden at lg, where the desktop TopBar
   takes over). Hamburger opens the existing Sheet sidebar (mobile) or toggles
   the icon rail (tablet); the search pill opens the same SearchModal. */
export function MobileTopBar({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex lg:hidden items-center h-[56px] px-[12px] gap-[10px] bg-sidebar shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="size-[40px] shrink-0 text-foreground"
        aria-label="Open menu"
      >
        <Icon icon={Menu01Icon} className="size-[22px]" strokeWidth={1.8} />
      </Button>

      <button
        onClick={() => setSearchOpen(true)}
        className="relative flex items-center flex-1 md:max-w-[520px] h-[40px] rounded-full bg-foreground/[0.04]"
        aria-label="Search recordings"
      >
        <Icon icon={Search} className="absolute left-[14px] size-[16px] text-muted-foreground" strokeWidth={1.7} />
        <span className="absolute left-[40px] font-normal text-[13.5px] text-muted-foreground">Search recordings</span>
      </button>

      <ProfileDropdown onNavigate={onNavigate} />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />
    </div>
  );
}
