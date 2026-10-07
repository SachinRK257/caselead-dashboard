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
     categories (banks and property types have no natural order).

     4.68:1 against the panel surface, so it clears the 3:1 mark gate on its
     own, and white sits on it at the same 4.68:1 - which is what lets the bar
     carry its value inside the fill rather than out past the tip. */
  series: "#6b63e0",
  seriesWash: "rgba(107, 99, 224, 0.1)",

  /* Meter track: a lighter step of the fill's own ramp. */
  trackSoft: "#e0def9",
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

/* The insight lines: the two notice stages in their own colours plus the
   total. Teal for the total because it has to stay apart from both the amber
   and the indigo it is the sum of - it sits above them on every day, so a
   near-miss on hue would read as a fourth stage rather than a running total. */
export const NOTICE_SERIES_COLORS = {
  DEMAND: NOTICE_COLORS.DEMAND,
  POSSESSION: NOTICE_COLORS.POSSESSION,
  TOTAL: "#0f766e",
  /* Rose for verified, picked by measurement rather than by meaning: it sits
     in the one wide gap left between the amber, the violet and the teal. The
     green this started as was only 35 deltaE from the teal total beside it,
     where every other pair on this chart clears 82; rose clears 75 against all
     three and holds 6.3:1 on the white plot ground. */
  VERIFIED: "#be123c",
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

/** Straight segments through points; plain joins keep values honest. */
export function linePath(points) {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join("");
}

/**
 * Curved line through points, monotone cubic (Fritsch-Carlson).
 *
 * The curve passes through every point and, unlike a plain cardinal spline,
 * cannot overshoot between them: a run of 3, 0, 3 bows toward zero but never
 * dips below it, so the chart can never draw a value the data does not have.
 * That is the whole reason this interpolation and not a prettier one - a
 * smoothed line that invents a trough reads as a quiet week that never
 * happened.
 */
export function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length < 3) return linePath(points);

  const n = points.length;

  // Secant slope of each segment.
  const slopes = [];
  for (let i = 0; i < n - 1; i += 1) {
    const dx = points[i + 1].x - points[i].x;
    slopes.push(dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx);
  }

  // Tangents: the average of the neighbouring secants, ends kept flat-ish.
  const tangents = [slopes[0]];
  for (let i = 1; i < n - 1; i += 1) {
    tangents.push(
      slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2
    );
  }
  tangents.push(slopes[n - 2]);

  // Clamp the tangents back into the monotone region; this is what rules out
  // overshoot rather than merely making it unlikely.
  for (let i = 0; i < n - 1; i += 1) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }

    const alpha = tangents[i] / slopes[i];
    const beta = tangents[i + 1] / slopes[i];
    const magnitude = alpha * alpha + beta * beta;

    if (magnitude > 9) {
      const tau = 3 / Math.sqrt(magnitude);
      tangents[i] = tau * alpha * slopes[i];
      tangents[i + 1] = tau * beta * slopes[i];
    }
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const dx = (points[i + 1].x - points[i].x) / 3;
    d +=
      `C${points[i].x + dx},${points[i].y + tangents[i] * dx}` +
      ` ${points[i + 1].x - dx},${points[i + 1].y - tangents[i + 1] * dx}` +
      ` ${points[i + 1].x},${points[i + 1].y}`;
  }

  return d;
}
