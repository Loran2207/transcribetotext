/* A drawn flag, not the emoji: regional-indicator pairs fall back to the two
   letters on any machine without a colour flag font, and a captured frame
   then shows "US" where a flag was meant. Small, flat, recognisable. */

const BY_LABEL: Record<string, string> = {
  English: "en",
  Russian: "ru",
  Spanish: "es",
  German: "de",
  French: "fr",
  Japanese: "ja",
};

export function LanguageFlag({ lang, size = 14 }: { lang?: string; size?: number }) {
  if (!lang) return null;
  const code = (BY_LABEL[lang] ?? lang).toLowerCase();
  const h = Math.round((size * 3) / 4);
  const box = { width: size, height: h };
  const shell = "inline-block shrink-0 rounded-[2px] ring-1 ring-black/10 align-[-2px]";

  if (code === "ru") {
    return (
      <svg className={shell} style={box} viewBox="0 0 12 9" aria-hidden="true">
        <rect width="12" height="3" fill="#FFFFFF" />
        <rect y="3" width="12" height="3" fill="#0039A6" />
        <rect y="6" width="12" height="3" fill="#D52B1E" />
      </svg>
    );
  }
  if (code === "es") {
    return (
      <svg className={shell} style={box} viewBox="0 0 12 9" aria-hidden="true">
        <rect width="12" height="9" fill="#AA151B" />
        <rect y="2.25" width="12" height="4.5" fill="#F1BF00" />
      </svg>
    );
  }
  if (code === "de") {
    return (
      <svg className={shell} style={box} viewBox="0 0 12 9" aria-hidden="true">
        <rect width="12" height="3" fill="#000000" />
        <rect y="3" width="12" height="3" fill="#DD0000" />
        <rect y="6" width="12" height="3" fill="#FFCE00" />
      </svg>
    );
  }
  if (code === "fr") {
    return (
      <svg className={shell} style={box} viewBox="0 0 12 9" aria-hidden="true">
        <rect width="4" height="9" fill="#002395" />
        <rect x="4" width="4" height="9" fill="#FFFFFF" />
        <rect x="8" width="4" height="9" fill="#ED2939" />
      </svg>
    );
  }
  if (code === "ja") {
    return (
      <svg className={shell} style={box} viewBox="0 0 12 9" aria-hidden="true">
        <rect width="12" height="9" fill="#FFFFFF" />
        <circle cx="6" cy="4.5" r="2.4" fill="#BC002D" />
      </svg>
    );
  }
  // English, and anything unmapped, flies the stars and stripes.
  return (
    <svg className={shell} style={box} viewBox="0 0 12 9" aria-hidden="true">
      <rect width="12" height="9" fill="#FFFFFF" />
      <rect width="12" height="1" y="0" fill="#B22234" />
      <rect width="12" height="1" y="2" fill="#B22234" />
      <rect width="12" height="1" y="4" fill="#B22234" />
      <rect width="12" height="1" y="6" fill="#B22234" />
      <rect width="12" height="1" y="8" fill="#B22234" />
      <rect width="5" height="5" fill="#3C3B6E" />
    </svg>
  );
}
