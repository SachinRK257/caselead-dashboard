/**
 * Chart tokens.
 *
 * Every categorical set below was checked with the dataviz palette validator
 * against the panel surface (#ffffff), not picked by eye:
 *
 *   TIMELINE_COLORS  worst adjacent CVD dE 9.1 (protan), normal-vision dE 20.8
 *   VISIT_COLORS     worst adjacent CVD dE 9.6 (tritan), normal-vision dE 24.0
 *
 * The UI badge colours could not be reused as chart fills: badge orange
 * (#c2410c) and badge red (#b91c1c) sit only dE 6.1 apart in normal vision, so
 * "Due Soon" and "Overdue" were indistinguishable as touching segments. Badges
 * keep their darker text colours (governed by text contrast, not this gate);
 * chart marks use the validated fills in the same hue families.
 *
 * Both sets carry a sub-3:1 contrast WARN on the lighter fills, so the relief
 * rule applies: every chart ships visible labelled values plus a table view.
 */

export const CHART = {
  surface: "#ffffff",
  grid: "#eef2f7",
  axis: "#cbd5e1",
  ink: "#0f172a",
  inkSecondary: "#475569",
  inkMuted: "#94a3b8",

  /* Single-series marks: one hue for every bar, never a ramp across nominal
     categories (banks and property types have no natural order). */
  series: "#2563eb",
  seriesWash: "rgba(37, 99, 235, 0.1)",

  /* Meter track: a lighter step of the fill's own ramp. */
  trackSoft: "#dbeafe",
};

export const TIMELINE_COLORS = {
  ON_TRACK: "#1baf7a",
  DUE_SOON: "#eda100",
  OVERDUE: "#e34948",
};

/* Stack order is the validated adjacent-pair order; do not reshuffle without
   re-running the validator. */
export const VISIT_COLORS = {
  VISIT_PENDING: "#eda100",
  VISIT_SCHEDULED: "#2a78d6",
  VISIT_COMPLETED: "#1baf7a",
  VISIT_RESCHEDULED: "#4a3aa7",
  VISIT_CANCELLED: "#e34948",
};

/* Notice stage. Validated against the panel surface:
   adjacent CVD dE 41.0 (protan) / 39.6 (tritan), normal-vision dE 45.9.
   Amber carries a sub-3:1 contrast WARN, so the relief rule applies - the
   stacked legend prints every value and ChartShell ships the table view. */
export const NOTICE_COLORS = {
  DEMAND: "#eda100",
  POSSESSION: "#4a3aa7",
};

export const DOCUMENT_COLORS = {
  DOCUMENTS_COMPLETE: "#2563eb",
  DOCUMENTS_PENDING: "#eda100",
};

/** Mark specs held constant across every chart. */
export const MARK = {
  barMaxThickness: 24,
  radius: 4,
  gap: 2, // surface gap between touching fills
  lineWidth: 2,
  markerRadius: 4,
};

/** Rectangle with only its data-end rounded; square at the baseline. */
export function barPath(x, y, width, height, radius = MARK.radius) {
  const r = Math.max(0, Math.min(radius, width, height / 2));
  if (r === 0 || width <= 0) {
    return `M${x},${y}h${Math.max(0, width)}v${height}h${-Math.max(0, width)}z`;
  }

  return [
    `M${x},${y}`,
    `h${width - r}`,
    `a${r},${r} 0 0 1 ${r},${r}`,
    `v${height - r * 2}`,
    `a${r},${r} 0 0 1 ${-r},${r}`,
    `h${-(width - r)}`,
    "z",
  ].join("");
}

/** Smooth-ish polyline through points; plain segments keep values honest. */
export function linePath(points) {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join("");
}
