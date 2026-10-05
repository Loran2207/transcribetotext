/* Where focus goes back to when a dialog closes (the WAI-ARIA dialog pattern):
   the control that opened it. A menu item is gone once its menu closes, so a
   dialog opened from a menu goes back to the menu's own button, through every
   submenu on the way. Read it at the moment the dialog is asked to open. */
export function focusOrigin(): HTMLElement | null {
  let el: Element | null = document.activeElement;
  let menu = el?.closest("[role=menu]") ?? null;
  while (el && menu) {
    el = document.getElementById(menu.getAttribute("aria-labelledby") ?? "");
    menu = el?.closest("[role=menu]") ?? null;
  }
  return el instanceof HTMLElement && el !== document.body ? el : null;
}
