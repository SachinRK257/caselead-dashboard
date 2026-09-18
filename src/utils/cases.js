import { daysUntil, getTimelineStatus, isEmptyValue } from "./format";
import { salespeople } from "../data/mockData";

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
export function enrichCase(item, today = new Date()) {
  const remainingDays = daysUntil(item.requiredActionDate, today);

  return {
    ...item,
    remainingDays,
    timelineStatus: getTimelineStatus(remainingDays),
  };
}

export function enrichCases(list, today = new Date()) {
  return list.map((item) => enrichCase(item, today));
}

export function isHighLiability(item) {
  return item.liability >= HIGH_LIABILITY_THRESHOLD;
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
