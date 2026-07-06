import * as React from "react";

/* "Mobile" here means the compact / adaptive layout: phone AND tablet. The app
   shell shows the overlay drawer nav (not the persistent rail), single-column
   lists, and the floating "+" FAB below the desktop breakpoint. Desktop chrome
   (persistent sidebar, right panel, table) starts at lg (1024). */
const MOBILE_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
