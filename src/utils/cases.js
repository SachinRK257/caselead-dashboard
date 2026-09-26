import { daysUntil, getTimelineStatus, isEmptyValue } from "./format";
import { banks, salespeople } from "../data/mockData";

/** Liability at or above this is treated as a priority case. */
export const HIGH_LIABILITY_THRESHOLD = 18000000;

export const ALLOCATION_STATUS = {
  ALLOCATED: "ALLOCATED",
  NOT_ALLOCATED: "NOT_ALLOCATED",
};

export const VISIT_STATUS = {
  VISIT_PENDING: "VISIT_PENDING",
  VISIT_SCHEDULED: "VISIT_SCHEDULED",
  VISIT_COMPLETED: "VISIT_COMPLETED",
  VISIT_RESCHEDULED: "VISIT_RESCHEDULED",
  VISIT_CANCELLED: "VISIT_CANCELLED",
};

export const VISIT_STATUS_LABELS = {
  VISIT_PENDING: "Visit Pending",
  VISIT_SCHEDULED: "Visit Scheduled",
  VISIT_COMPLETED: "Visit Completed",
  VISIT_RESCHEDULED: "Visit Rescheduled",
  VISIT_CANCELLED: "Visit Cancelled",
};

export const DOCUMENT_STATUS = {
  DOCUMENTS_PENDING: "DOCUMENTS_PENDING",
  DOCUMENTS_COMPLETE: "DOCUMENTS_COMPLETE",
};

export const DOCUMENT_STATUS_LABELS = {
  DOCUMENTS_PENDING: "Documents Pending",
  DOCUMENTS_COMPLETE: "Documents Complete",
};

export const TIMELINE_STATUS_LABELS = {
  ON_TRACK: "On Track",
  DUE_SOON: "Due Soon",
  OVERDUE: "Overdue",
};

/**
 * Recomputes `remainingDays` and `timelineStatus` from `requiredActionDate`
 * so the dashboard stays accurate instead of reporting whatever was frozen
 * into the source data.
 */
export function enrichCase(item, today = new Date(), dueSoonDays) {
  const remainingDays = daysUntil(item.requiredActionDate, today);

  return {
    ...item,
    remainingDays,
    timelineStatus: getTimelineStatus(remainingDays, dueSoonDays),
  };
}

export function enrichCases(list, today = new Date(), dueSoonDays) {
  return list.map((item) => enrichCase(item, today, dueSoonDays));
}

export function isHighLiability(item, threshold = HIGH_LIABILITY_THRESHOLD) {
  return item.liability >= threshold;
}

const SEARCHABLE_FIELDS = [
  "id",
  "borrower",
  "bank",
  "branch",
  "city",
  "property",
  "remarks",
];

/** Case-insensitive match across the fields a user would plausibly type. */
export function matchesSearch(item, query) {
  const term = query.trim().toLowerCase();
  if (!term) return true;

  const fieldMatch = SEARCHABLE_FIELDS.some((field) => {
    const value = item[field];
    return !isEmptyValue(value) && String(value).toLowerCase().includes(term);
  });
  if (fieldMatch) return true;

  // Searching a salesperson's name should surface the cases they handle.
  const assignee = getSalesperson(item.assignedTo);
  return Boolean(assignee && assignee.name.toLowerCase().includes(term));
}

/** Parses a free-text amount box; blank or nonsense means "no bound". */
export function parseAmount(value) {
  const digits = String(value).replace(/[^0-9.]/g, "");
  if (!digits) return null;

  const amount = Number(digits);
  return Number.isFinite(amount) ? amount : null;
}

/* ---------------------------------------------------------------- team --- */

const BY_ID = new Map(salespeople.map((person) => [person.id, person]));
const BY_CITY = new Map(salespeople.map((person) => [person.city, person]));

export function getSalesperson(id) {
  return id ? (BY_ID.get(id) ?? null) : null;
}

/** The salesperson who owns a city, regardless of what a case says. */
export function getOwnerForCity(city) {
  return city ? (BY_CITY.get(city) ?? null) : null;
}

/** Display name for a case's assignee, falling back to the city owner. */
export function describeAssignee(item) {
  const assigned = getSalesperson(item.assignedTo);
  if (assigned) return { name: assigned.name, isSuggested: false };

  const owner = getOwnerForCity(item.city);
  if (owner) return { name: owner.name, isSuggested: true };

  return { name: "Unassigned", isSuggested: false };
}

export function initialsOf(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Per-salesperson workload. `assigned` counts cases actually allocated to
 * them; `unassignedInCity` counts cases sitting in their city with no owner
 * yet, which is what they are expected to pick up next.
 */
export function buildTeamWorkload(cases) {
  const rows = salespeople.map((person) => {
    const owned = cases.filter((item) => item.assignedTo === person.id);
    const unclaimed = cases.filter(
      (item) => !item.assignedTo && item.city === person.city
    );

    return {
      ...person,
      assigned: owned.length,
      unassignedInCity: unclaimed.length,
      dueSoon: owned.filter((item) => item.timelineStatus === "DUE_SOON").length,
      overdue: owned.filter((item) => item.timelineStatus === "OVERDUE").length,
      pendingDocs: owned.filter(
        (item) => item.documents === "DOCUMENTS_PENDING"
      ).length,
      pendingVisits: owned.filter((item) => item.bankVisit === "VISIT_PENDING")
        .length,
      liability: owned.reduce((sum, item) => sum + item.liability, 0),
    };
  });

  return rows.sort((a, b) => b.assigned - a.assigned || b.liability - a.liability);
}

/* ------------------------------------------------------- aggregations --- */

/** Count cases per value of a field, preserving a fixed key order. */
export function countByKey(cases, field, keys) {
  const counts = Object.fromEntries(keys.map((k) => [k, 0]));

  for (const item of cases) {
    if (item[field] in counts) counts[item[field]] += 1;
  }

  return counts;
}

export function buildTimelineMix(cases) {
  return countByKey(cases, "timelineStatus", [
    "ON_TRACK",
    "DUE_SOON",
    "OVERDUE",
  ]);
}

export function buildVisitMix(cases) {
  return countByKey(cases, "bankVisit", Object.keys(VISIT_STATUS));
}

export function buildDocumentMix(cases) {
  return countByKey(cases, "documents", Object.keys(DOCUMENT_STATUS));
}

/** Case count per bank, busiest first. */
export function buildBankCounts(cases) {
  const counts = new Map();
  for (const item of cases) {
    counts.set(item.bank, (counts.get(item.bank) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/**
 * Every lender on the panel with its case count, zeros included.
 *
 * The filter offers the whole panel so a lender can always be looked up, even
 * in a month where it happens to have no live case.
 */
export function buildPanelCounts(cases) {
  const counts = new Map(banks.map((b) => [b, 0]));
  for (const item of cases) {
    counts.set(item.bank, (counts.get(item.bank) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/** Total liability per bank, largest first. */
export function buildLiabilityByBank(cases) {
  const totals = new Map();
  for (const item of cases) {
    totals.set(item.bank, (totals.get(item.bank) ?? 0) + item.liability);
  }

  return [...totals.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Case count per property type, largest first. */
export function buildPropertyMix(cases) {
  const counts = new Map();
  for (const item of cases) {
    counts.set(item.property, (counts.get(item.property) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value);
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Cases per month of their demand notice, as a continuous series.
 *
 * Months with no cases are kept at zero rather than skipped: dropping them
 * would compress the gaps and overstate how steady intake was.
 */
export function buildIntakeByMonth(cases) {
  const stamps = cases
    .map((item) => new Date(item.demandNoticeDate))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (stamps.length === 0) return [];

  const first = new Date(Math.min(...stamps));
  const last = new Date(Math.max(...stamps));

  const series = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);

  while (
    cursor.getFullYear() < last.getFullYear() ||
    (cursor.getFullYear() === last.getFullYear() &&
      cursor.getMonth() <= last.getMonth())
  ) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    series.push({
      key: `${year}-${month}`,
      label: MONTH_LABELS[month],
      value: stamps.filter(
        (d) => d.getFullYear() === year && d.getMonth() === month
      ).length,
    });

    cursor.setMonth(month + 1);
  }

  return series;
}

/** Case count per city, largest first. */
export function buildCityMix(cases) {
  const counts = new Map();
  for (const item of cases) {
    counts.set(item.city, (counts.get(item.city) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value);
}

/* --------------------------------------------------------- notice stage --- */

export const NOTICE_STAGE = {
  DEMAND: "DEMAND",
  POSSESSION: "POSSESSION",
};

export const NOTICE_STAGE_LABELS = {
  DEMAND: "Demand notice",
  POSSESSION: "Possession notice",
};

/**
 * Where a case has reached in the notice sequence.
 *
 * A possession notice under s.13(4) only follows once the 60-day demand notice
 * window under s.13(2) has run, so a case carrying no possession date is still
 * inside that window rather than missing data.
 */
export function getNoticeStage(item) {
  return isEmptyValue(item.possessionNoticeDate)
    ? NOTICE_STAGE.DEMAND
    : NOTICE_STAGE.POSSESSION;
}

/** Case counts per notice stage, for the scope handed in. */
export function buildNoticeStage(cases) {
  const counts = { DEMAND: 0, POSSESSION: 0 };
  for (const item of cases) counts[getNoticeStage(item)] += 1;
  return counts;
}

/** Notice stage split per bank, banks with most cases first. */
export function buildNoticeStageByBank(cases) {
  const map = new Map();

  for (const item of cases) {
    const entry = map.get(item.bank) ?? {
      key: item.bank,
      label: item.bank,
      DEMAND: 0,
      POSSESSION: 0,
    };
    entry[getNoticeStage(item)] += 1;
    map.set(item.bank, entry);
  }

  return [...map.values()]
    .map((e) => ({ ...e, value: e.DEMAND + e.POSSESSION }))
    .sort((a, b) => b.value - a.value);
}
