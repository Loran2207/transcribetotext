/**
 * Shared dark mode color palette for components with inline styles.
 * Usage: const c = usePalette();
 */
export function getDarkPalette(isDark: boolean) {
  return {
    // Backgrounds
    bg: isDark ? "#111115" : "white",
    bgCard: isDark ? "#111115" : "white",
    bgHover: isDark ? "rgba(255,255,255,0.04)" : "#f6f8fa",
    bgMuted: isDark ? "#1e1e26" : "#f3f4f6",
    bgSubtle: isDark ? "#16161c" : "#fafbfc",
    bgSelected: isDark ? "rgba(37,99,235,0.12)" : "#f0f4ff",
    bgInput: isDark ? "#1e1e26" : "white",
    bgOverlay: isDark ? "#1e1e26" : "white",
    bgPopover: isDark ? "#1e1e26" : "white",

    // Borders
    border: isDark ? "rgba(255,255,255,0.08)" : "#ebeef1",
    borderInput: isDark ? "rgba(255,255,255,0.12)" : "#e0e0e0",
    borderMuted: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
    borderBtn: isDark ? "rgba(255,255,255,0.12)" : "#d1d5db",

    // Text
    textPrimary: isDark ? "#e5e7eb" : "#1a1a1a",
    textSecondary: isDark ? "#d1d5db" : "#30313d",
    textMuted: isDark ? "#9ca3af" : "#6a7383",
    textFaint: isDark ? "#6b7280" : "#9ca3af",
    textTable: isDark ? "#c9cdd3" : "#6a7383",
    textHeader: isDark ? "#c9cdd3" : "#1a1f36",

    // Shadows
    shadow: isDark
      ? "0px 8px 24px rgba(0,0,0,0.40), 0px 2px 8px rgba(0,0,0,0.25)"
      : "0px 8px 24px rgba(0,0,0,0.08), 0px 2px 8px rgba(0,0,0,0.04)",

    // Gradients for row hover overlay
    gradientRow: isDark
      ? "linear-gradient(90deg, transparent 0%, #111115 35%)"
      : "linear-gradient(90deg, transparent 0%, #f8f9fb 35%)",
    gradientRowSelected: isDark
      ? "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.1) 35%)"
      : "linear-gradient(90deg, transparent 0%, #f0f4ff 35%)",

    // Checkbox
    checkboxBg: isDark ? "#2a2a35" : "white",
    checkboxBorder: isDark ? "#4b4b5a" : "#c0c8d2",
    checkboxBtnBorder: isDark ? "#4b4b5a" : "#d1d5db",

    // Accent blue (lighter in dark for readability)
    accentBlue: isDark ? "#3b82f6" : "#2563eb",
  };
}