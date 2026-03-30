/**
 * Shared formatting utilities.
 */

/** Extract initials from an email address (e.g. "john.doe@x.com" → "JD"). */
export function getInitials(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
