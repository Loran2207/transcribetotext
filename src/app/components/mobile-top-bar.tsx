import { useState } from "react";
import { Menu01Icon, Search } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { SearchModal } from "./search-modal";
import { ProfileDropdown } from "./top-bar";
import { useInnerScreen } from "./inner-screen";

/* Compact top bar for mobile + tablet (hidden at lg, where the desktop TopBar
   takes over). Hamburger opens the existing Sheet sidebar (mobile) or toggles
   the icon rail (tablet); the search pill opens the same SearchModal. */
export function MobileTopBar({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  const inner = useInnerScreen();

  return (
    <>
      {inner && (
        <div className="flex md:hidden items-center h-[56px] pl-[6px] pr-[10px] gap-[4px] bg-sidebar shrink-0">
          <Button variant="ghost" size="icon" onClick={inner.back} className="size-[40px] shrink-0 text-foreground" aria-label="Back">
            <svg className="size-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Button>
          <div className="flex-1 min-w-0 flex items-baseline gap-[6px]">
            {inner.parent && (
              <>
                <span className="shrink-0 text-[13px] text-muted-foreground">{inner.parent}</span>
                <span className="text-[13px] text-muted-foreground/50">/</span>
              </>
            )}
            <span className="truncate text-[15px] font-semibold text-foreground">{inner.title}</span>
          </div>
          {inner.menu}
        </div>
      )}
    <div className={`${inner ? "hidden md:flex" : "flex"} lg:hidden items-center h-[56px] px-[12px] gap-[10px] bg-sidebar shrink-0`}>
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
        className="relative flex items-center flex-1 h-[40px] rounded-full bg-foreground/[0.04]"
        aria-label="Search recordings"
      >
        <Icon icon={Search} className="absolute left-[14px] size-[16px] text-muted-foreground" strokeWidth={1.7} />
        <span className="absolute left-[40px] font-normal text-[13.5px] text-muted-foreground">Search recordings</span>
      </button>

      <ProfileDropdown onNavigate={onNavigate} />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />
    </div>
    </>
  );
}
