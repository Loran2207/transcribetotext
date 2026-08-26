/**
 * Shared formatting utilities.
 */

/** Extract initials from an email address (e.g. "john.doe@x.com" → "JD"). */
export function getInitials(email: string): string {
  const name = email.split("@")[0] ?? "";
  /* Names arrive here too, so a space separates as surely as a dot does:
     without it "Emma Larsen" came out EM instead of EL. */
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
