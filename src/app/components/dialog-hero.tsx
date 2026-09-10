import { cn } from "./ui/utils";

// Centred hero image with a soft halo, shared by the plan dialogs and the 75%
// checkout. One size for every screen so the flow does not breathe differently
// from step to step; className is there for the screens that need it larger or
// off the centre line.
export function DialogHero({
  src,
  alt,
  tone = "brand",
  className,
}: {
  src: string;
  alt: string;
  tone?: "brand" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto flex size-[120px] items-center justify-center", className)}>
      <div
        className={cn(
          "absolute inset-4 rounded-full blur-2xl",
          tone === "danger" ? "bg-destructive/10" : "bg-primary/10",
        )}
      />
      <img src={src} alt={alt} className="relative size-full object-contain" />
    </div>
  );
}
