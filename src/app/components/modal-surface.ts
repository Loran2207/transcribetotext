/* The house modal surface, in one place.

   Every dialog in the app is the same object at two sizes: a centred card from
   md up, and a sheet docked to the bottom edge below it, where a thumb reaches
   without stretching. Until now that shape was hand-copied into each dialog and
   the copies drifted:

   - the shadcn base switches to a sheet at sm (640), the app's own dialogs at
     md (768), so a window between those two widths got a card in one dialog and
     a sheet in the next;
   - the base pins `sm:max-w-lg`, which silently overrules an unconditional
     `max-w-[380px]` from the caller - the account-deletion confirmation asked
     for 380 and rendered at 512;
   - between 640 and 768 the base's centring (`sm:translate-x-[-50%]`) fought the
     caller's docking, and which one won depended on utility order rather than
     on intent.

   So the positioning here is marked important: it has to beat the base's own
   responsive rules rather than race them. Width constants are literal strings
   because Tailwind reads the source, not runtime values. */

const SHEET = [
  // Below md the dialog is a sheet on the bottom edge.
  "max-md:top-auto!",
  "max-md:bottom-0!",
  "max-md:left-0!",
  "max-md:right-0!",
  "max-md:w-full!",
  "max-md:max-w-none!",
  "max-md:translate-x-0!",
  "max-md:translate-y-0!",
  "max-md:rounded-t-[24px]!",
  "max-md:rounded-b-none!",
  "max-md:border-x-0",
  "max-md:border-b-0",
].join(" ");

/* The surface owns no padding. The base sets its own through media variants
   (sm:p-6, max-sm:p-5), which beat an unconditional p-0 from the caller and left
   the confirmation with 24 of its own plus 24 from its header - a title 49px
   from the edge, against 25 in the dialog beside it. The header, body and footer
   space themselves. */
const NO_PADDING = "p-0!";

/** Content classes for a shadcn Dialog or AlertDialog: card above md, sheet below. */
export const MODAL_SURFACE = `ttt-modal-sheet ${SHEET} ${NO_PADDING} md:rounded-[18px]`;

/** A confirmation: one question, two buttons, nothing to fill in. */
export const MODAL_W_CONFIRM = "md:max-w-[380px]!";

/** A form: fields the user types into. */
export const MODAL_W_FORM = "md:max-w-[480px]!";

/* The header reads from the left at every width. The shadcn base centres it
   below sm, which is a phone convention this product does not use: everywhere
   else the question sits above the buttons, both anchored to the same edges. */
export const MODAL_HEADER = "text-left";

/* Buttons sit in a row on the right at every width. The shadcn footer stacks
   them column-reverse and full width below sm, which reads as a phone pattern
   from a different app - the rest of this product keeps the row. */
export const MODAL_FOOTER = "flex-row justify-end gap-2";
