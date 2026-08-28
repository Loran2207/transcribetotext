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

/* A phone, and only a phone. The two breakpoints answer different questions and
   must not be swapped: 1024 decides the SHELL (rail vs drawer nav, table vs
   cards), 768 decides the SURFACE a transient thing opens on. The product
   already settled the second one - a record card's kebab opens a bottom sheet
   below 768 and a dropdown on a tablet - so anything choosing between a sheet
   and a centred dialog asks this hook, not the layout one. */
const PHONE_BREAKPOINT = 768;

export function useIsPhone() {
  const [isPhone, setIsPhone] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${PHONE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsPhone(window.innerWidth < PHONE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsPhone(window.innerWidth < PHONE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isPhone;
}
