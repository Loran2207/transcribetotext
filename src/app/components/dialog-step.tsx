import type { ReactNode } from "react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { DialogTitle } from "./ui/dialog";
import { Icon } from "./ui/icon";

// One shell for the plan dialogs: same width, same padding, same close button
// inset. Only the flow variant pins the height, because there the steps follow
// one another and a window that resizes between them reads as a glitch. A
// standalone dialog has nothing to jump against, so it hugs its content.
const DIALOG_BASE =
  "flex flex-col gap-0 overflow-hidden rounded-2xl p-6 max-h-[92dvh] sm:max-w-[480px] " +
  "[&>button]:right-5 [&>button]:top-6 [&>button]:opacity-60";

// The pinned height starts at the small breakpoint so every viewport wider than a
// phone gets the same window; the max-height stays as a guard, so a short
// viewport crops the body instead of pushing the actions off screen.
export const STEP_DIALOG_SHELL = `${DIALOG_BASE} sm:h-[620px]`;
export const SINGLE_DIALOG_SHELL = DIALOG_BASE;

// Back and Skip share the optical line of the close button: the row is exactly
// as tall as the 16px close icon, the arrow mirrors its inset, and Skip stops
// short of it. The row is always rendered, so the content below every step
// starts at the same height.
export function StepChrome({ onBack, onSkip }: { onBack?: () => void; onSkip?: () => void }) {
  return (
    <div className="flex h-4 shrink-0 items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="-ml-1 flex size-4 items-center justify-center text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
        >
          <Icon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
        </button>
      ) : (
        <span />
      )}
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          className="mr-10 text-[13px] font-medium leading-4 text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
        >
          Skip
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

// Every title is centred and carries the same weight, whether the step asks a
// question or shows a result, so the flow reads as one dialog instead of a pile
// of screens. The symmetric padding keeps it on the optical centre despite the
// close button.
export function StepTitle({ children }: { children: ReactNode }) {
  return (
    <DialogTitle className="text-balance px-8 text-center text-[22px] font-bold leading-[1.2] tracking-[-0.4px]">
      {children}
    </DialogTitle>
  );
}

export function StepLead({ children }: { children: ReactNode }) {
  return (
    <p className="text-balance px-2 text-center text-[13.5px] leading-[1.6] text-muted-foreground">
      {children}
    </p>
  );
}

// The only part of the dialog that can scroll. Steps that show something centre
// their content, so the fixed frame reads as deliberate rather than empty.
export function StepBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4 [&>*]:shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

// Actions run the full width of the dialog and stack primary first, so the block
// keeps its shape and position on every step.
export function StepActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 [&>button]:min-w-0 [&>button]:flex-1">
      {children}
    </div>
  );
}

export const STEP_BUTTON = "h-11 w-full text-[13.5px] font-semibold";
