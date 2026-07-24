// Centred hero image with a soft halo, shared by the plan dialogs. One size for
// every screen so the flow does not breathe differently from step to step; the
// large variant is for the single screen that has to sell something.
export function DialogHero({
  src,
  alt,
  size = "md",
  tone = "brand",
}: {
  src: string;
  alt: string;
  size?: "md" | "lg";
  tone?: "brand" | "danger";
}) {
  return (
    <div
      className={`relative mx-auto flex items-center justify-center ${
        size === "lg" ? "size-[140px]" : "size-[120px]"
      }`}
    >
      <div
        className={`absolute inset-4 rounded-full blur-2xl ${
          tone === "danger" ? "bg-destructive/10" : "bg-primary/10"
        }`}
      />
      <img src={src} alt={alt} className="relative size-full object-contain" />
    </div>
  );
}
