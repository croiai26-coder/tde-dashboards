// Design tokens for the TDE HQ dashboard. Mirrors the values in the
// design hand-off (README.md → "Design Tokens") exactly.

export const bg = "#f6f4ef";

// Pastel palette (fixed).
export const c2 = "#9fb8e6"; // pastel blue
export const c3 = "#e8b6a0"; // pastel peach
export const c4 = "#c6aee0"; // pastel lilac
export const c5 = "#9fd6c0"; // pastel sage

// Text ramp.
export const ink = {
  primary: "#2a2621",
  body: "#3a352e",
  secondary: "#5f5b54",
  muted: "#8f8a82",
  faint: "#a29d94",
  faintest: "#b8b2a8",
};

// Hairlines / fills.
export const line = "#00000010";
export const divider = "#00000008";
export const fill = "#00000004";

export const cardShadow = "0 1px 2px #0000000a";

/** Accent-soft: ~15% alpha of a hex colour (design uses `color + '26'`). */
export const soft = (hex: string) => `${hex}26`;
/** Accent-border: ~25% alpha of a hex colour (design uses `color + '40'`). */
export const border40 = (hex: string) => `${hex}40`;

/** The five accent options the design supports. */
export const ACCENT_OPTIONS = ["#5b8def", "#9fd6c0", "#c6aee0", "#e8b6a0", "#e88f8f"];
export const DEFAULT_ACCENT = "#5b8def";

// Reference the CSS variables injected by next/font (see app/layout.tsx).
export const fontDisplay = "var(--font-fraunces), Georgia, serif";
export const fontSans =
  "var(--font-instrument), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
