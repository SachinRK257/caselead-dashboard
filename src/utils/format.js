const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Mock data uses "-" for values that have not been set yet. */
export function isEmptyValue(value) {
  return value === undefined || value === null || value === "" || value === "-";
}

/** Amount in rupees, grouped the Indian way, without the currency symbol. */
export function formatAmount(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return CURRENCY_FORMATTER.format(value);
}

/** "2026-09-30" -> "30 Sep 2026". Leaves placeholders untouched. */
export function formatDate(value) {
  if (isEmptyValue(value)) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return DATE_FORMATTER.format(date);
}

export function formatLongDate(date) {
  return LONG_DATE_FORMATTER.format(date);
}

/**
 * Whole days from today until `value`. Negative once the date has passed.
 * Both sides are normalised to midnight so the result never drifts with
 * the time of day the dashboard happens to be open.
 */
export function daysUntil(value, today = new Date()) {
  if (isEmptyValue(value)) return null;

  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.round((target - start) / MS_PER_DAY);
}

export const TIMELINE_STATUS = {
  ON_TRACK: "ON_TRACK",
  DUE_SOON: "DUE_SOON",
  OVERDUE: "OVERDUE",
};

/** Anything inside a week needs attention; anything past its date is overdue. */
export const DUE_SOON_THRESHOLD_DAYS = 7;

export function getTimelineStatus(
  remainingDays,
  dueSoonDays = DUE_SOON_THRESHOLD_DAYS
) {
  if (remainingDays === null || remainingDays === undefined) {
    return TIMELINE_STATUS.ON_TRACK;
  }
  if (remainingDays < 0) return TIMELINE_STATUS.OVERDUE;
  if (remainingDays <= dueSoonDays) return TIMELINE_STATUS.DUE_SOON;
  return TIMELINE_STATUS.ON_TRACK;
}

/** Human form of a remaining-days count, e.g. "8 days overdue" / "Due today". */
export function formatRemainingDays(remainingDays) {
  if (remainingDays === null || remainingDays === undefined) return "-";
  if (remainingDays === 0) return "Due today";

  if (remainingDays < 0) {
    const days = Math.abs(remainingDays);
    return `${days} ${days === 1 ? "day" : "days"} overdue`;
  }

  return `${remainingDays} ${remainingDays === 1 ? "day" : "days"}`;
}

/** Title-cases a screaming-snake enum as a fallback label. */
export function humanizeEnum(value) {
  if (isEmptyValue(value)) return "-";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Short rupee amount in the units people actually speak: "2.5 Cr", "95 L".
 *
 * A figure like 10,66,00,000 has to be counted digit by digit before it means
 * anything. The exact amount is never lost - callers pair this with the full
 * figure in a title attribute, and the tables still print it in full.
 */
export function formatMoneyShort(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";

  const CRORE = 10000000;
  const LAKH = 100000;

  if (Math.abs(value) >= CRORE) {
    return `₹${trimZeros(value / CRORE)} Cr`;
  }
  if (Math.abs(value) >= LAKH) {
    return `₹${trimZeros(value / LAKH)} L`;
  }

  return `₹${formatAmount(value)}`;
}

/** 2.50 -> "2.5", 3.00 -> "3", 10.66 -> "10.66" */
function trimZeros(n) {
  return String(Number(n.toFixed(2)));
}

/** The full figure, for tooltips beside a shortened one. */
export function formatMoneyFull(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `₹${formatAmount(value)}`;
}
