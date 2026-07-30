// Centred hero image with a soft halo, shared by the plan dialogs. One size for
// every screen so the flow does not breathe differently from step to step; the
// large variant is for the single screen that has to sell something.
export function DialogHero({
  src,
  alt,
  tone = "brand",
}: {
  src: string;
  alt: string;
  tone?: "brand" | "danger";
}) {
  return (
    <div className="relative mx-auto flex size-[120px] items-center justify-center">
      <div
        className={`absolute inset-4 rounded-full blur-2xl ${
          tone === "danger" ? "bg-destructive/10" : "bg-primary/10"
        }`}
      />
      <img src={src} alt={alt} className="relative size-full object-contain" />
    </div>
  );
}
