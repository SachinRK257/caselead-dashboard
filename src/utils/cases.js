import {
  daysUntil,
  getTimelineStatus,
  humanizeEnum,
  isEmptyValue,
} from "./format";
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

/**
 * Where a case has reached in the follow-up pipeline, in pipeline order.
 *
 * The order is the sequence itself, not a ranking by size, so the filter and
 * any breakdown read as a funnel. `humanizeEnum` already renders every key
 * the way it is spoken ("FOLLOWING_UP" -> "Following Up"), so there is no
 * label map to drift out of sync with this list.
 */
export const CASE_STATUS = {
  NOT_CONTACTED: "NOT_CONTACTED",
  CONTACTED: "CONTACTED",
  FOLLOWING_UP: "FOLLOWING_UP",
  ALLOTTED: "ALLOTTED",
  NOT_ALLOTTED: "NOT_ALLOTTED",
  ACCOUNT_UPGRADED: "ACCOUNT_UPGRADED",
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
  const counts = new Map(banks.map((b) => [b.name, 0]));
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

/**
 * Every city the team covers with its case count, zeros included.
 *
 * Seeded from the salespeople rather than from the cases, so a patch can
 * always be looked up - a month with no live case in Mysuru is itself the
 * answer someone is after, and a list built from the cases would hide it.
 */
export function buildCityPanel(cases) {
  const counts = new Map(salespeople.map((person) => [person.city, 0]));
  for (const item of cases) {
    counts.set(item.city, (counts.get(item.city) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/**
 * Every pipeline stage with its case count, zeros included and in pipeline
 * order - unlike the bank and city panels, which sort by size. A stage with
 * no cases is a real answer here, and reordering the funnel by count would
 * destroy the only thing the sequence has to say.
 */
export function buildStatusPanel(cases) {
  const counts = countByKey(cases, "caseStatus", Object.keys(CASE_STATUS));

  return Object.entries(counts).map(([key, value]) => ({
    key,
    label: humanizeEnum(key),
    value,
  }));
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

/* ---------------------------------------------------------- empanelment --- */

export const EMPANELMENT = {
  ALL: "ALL",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  NO_LETTER: "NO_LETTER",
};

/** A letter this close to its end date is worth chasing before it lapses. */
export const EMPANELMENT_NOTICE_DAYS = 90;

export const EMPANELMENT_STATE = {
  ACTIVE: "ACTIVE",
  EXPIRING: "EXPIRING",
  EXPIRED: "EXPIRED",
  NONE: "NONE",
};

/**
 * Where a lender's empanelment stands today.
 *
 * The letter names a term, so holding one is not the same as being cleared to
 * work: a window that has closed leaves the lender no better off than one we
 * never had a letter for, which is why EXPIRED is its own state rather than a
 * footnote on "empanelled".
 */
export function getEmpanelmentState(lender, today = new Date()) {
  if (!lender.empanelled) return EMPANELMENT_STATE.NONE;

  const remaining = daysUntil(lender.empEnd, today);
  if (remaining === null) return EMPANELMENT_STATE.NONE;
  if (remaining < 0) return EMPANELMENT_STATE.EXPIRED;
  if (remaining <= EMPANELMENT_NOTICE_DAYS) return EMPANELMENT_STATE.EXPIRING;

  return EMPANELMENT_STATE.ACTIVE;
}

/**
 * The lender panel with each lender's empanelment and its live caseload.
 *
 * Empanelled lenders come first and, within each group, the busiest first:
 * the panel is read to answer "who are we cleared with, and where is the work"
 * rather than to look a single name up, which the filter above already does.
 */
/* Expiring letters lead: they are the ones still worth saving. Lapsed cover
   comes next, then live cover, then lenders we never had a letter for. */
const STATE_ORDER = {
  EXPIRING: 0,
  EXPIRED: 1,
  ACTIVE: 2,
  NONE: 3,
};

export function buildLenderPanel(cases, today = new Date()) {
  const counts = new Map();
  for (const item of cases) {
    counts.set(item.bank, (counts.get(item.bank) ?? 0) + 1);
  }

  return banks
    .map((lender) => ({
      ...lender,
      cases: counts.get(lender.name) ?? 0,
      state: getEmpanelmentState(lender, today),
    }))
    .sort(
      (a, b) =>
        STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
        b.cases - a.cases ||
        a.name.localeCompare(b.name)
    );
}

/**
 * Headline counts for the panel.
 *
 * `casesUncovered` is the one that earns its place: live cases at a lender
 * whose empanelment has lapsed or never existed are the exposure someone has
 * to act on, and nothing else on the page would show them. A lapsed letter
 * counts here because the term in it has run out.
 */
export function summariseLenderPanel(rows) {
  const of = (state) => rows.filter((r) => r.state === state);

  const expired = of(EMPANELMENT_STATE.EXPIRED);
  const expiring = of(EMPANELMENT_STATE.EXPIRING);
  const none = of(EMPANELMENT_STATE.NONE);

  return {
    total: rows.length,
    active: of(EMPANELMENT_STATE.ACTIVE).length + expiring.length,
    expiring: expiring.length,
    expired: expired.length,
    noLetter: none.length,
    casesUncovered: [...expired, ...none].reduce((sum, r) => sum + r.cases, 0),
  };
}

/* ------------------------------------------------------------- liability --- */

/**
 * The biggest cases by amount outstanding, largest first.
 *
 * Ties break on case id rather than being left to the sort's own order: this
 * book has far more cases than it has distinct amounts, so the cut-off usually
 * lands inside a tie, and an unstable order would reshuffle the list on every
 * render. Callers that care which cases a tie hides should compare the
 * cut-off amount against the scope themselves.
 */
export function buildTopLiability(cases, limit = 10) {
  return [...cases]
    .sort((a, b) => b.liability - a.liability || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/* ---------------------------------------------------------------- ageing --- */

/**
 * The stages where a case is still being worked.
 *
 * Allotted, not allotted and account upgraded are settled outcomes - a case
 * sitting in one of those for months is a record, not a backlog. These three
 * are the ones where nothing has happened yet, so age in them is the thing
 * worth chasing.
 */
export const ACTIVE_CASE_STATUSES = [
  CASE_STATUS.NOT_CONTACTED,
  CASE_STATUS.CONTACTED,
  CASE_STATUS.FOLLOWING_UP,
];

/**
 * The longest-running cases that are still in an active stage, oldest first.
 *
 * Age runs from the demand notice, which is when the case entered the book -
 * not from the last action, which the data does not record. A case with no
 * demand date has no age to measure and is left out rather than counted as
 * nought days old, which would bury it at the bottom of the list.
 */
export function buildAgeingCases(cases, today = new Date(), limit = 10) {
  return cases
    .filter((item) => ACTIVE_CASE_STATUSES.includes(item.caseStatus))
    .map((item) => ({ ...item, daysOpen: daysUntil(item.demandNoticeDate, today) }))
    .filter((item) => item.daysOpen !== null)
    .map((item) => ({ ...item, daysOpen: -item.daysOpen }))
    .sort((a, b) => b.daysOpen - a.daysOpen || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/* -------------------------------------------------------------- insights --- */

export const NOTICE_BUCKET = {
  DAY: "DAY",
  WEEK: "WEEK",
  MONTH: "MONTH",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Counts of each notice type per calendar day, from the whole book. */
function countByDay(cases) {
  const demand = new Map();
  const possession = new Map();

  const add = (map, value) => {
    if (isEmptyValue(value)) return;
    map.set(value, (map.get(value) ?? 0) + 1);
  };

  for (const item of cases) {
    add(demand, item.demandNoticeDate);
    add(possession, item.possessionNoticeDate);
  }

  return { demand, possession };
}

/**
 * Notices served over time, counted on the day each one was served.
 *
 * The bucket matters more than it looks. This book serves nought to six
 * notices on any given day, so a daily line is a row of spikes between zeros
 * - true, but shapeless. A week or a month of the same data has a trend in it
 * you can actually read, which is why WEEK is the default and DAY is there for
 * when someone wants the raw grain.
 *
 * Every bucket in the window gets a point, including empty ones: dropping them
 * would close up the gaps and make a quiet fortnight look like steady work.
 * TOTAL is DEMAND + POSSESSION, so the three lines reconcile on every point.
 */
export function buildNoticeSeries(
  cases,
  bucket = NOTICE_BUCKET.WEEK,
  today = new Date()
) {
  const { demand, possession } = countByDay(cases);
  if (demand.size === 0 && possession.size === 0) return [];

  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const at = (key) => ({
    DEMAND: demand.get(key) ?? 0,
    POSSESSION: possession.get(key) ?? 0,
  });
  const point = (key, label, values) => ({
    key,
    label,
    values: { ...values, TOTAL: values.DEMAND + values.POSSESSION },
  });

  if (bucket === NOTICE_BUCKET.DAY) {
    const points = [];
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date(end.getTime() - i * DAY_MS);
      const key = isoDay(date);
      points.push(
        point(key, `${date.getDate()} ${MONTHS[date.getMonth()]}`, at(key))
      );
    }
    return points;
  }

  if (bucket === NOTICE_BUCKET.WEEK) {
    const points = [];
    for (let w = 11; w >= 0; w -= 1) {
      const first = new Date(end.getTime() - (w * 7 + 6) * DAY_MS);
      const values = { DEMAND: 0, POSSESSION: 0 };

      for (let d = 0; d < 7; d += 1) {
        const day = at(isoDay(new Date(first.getTime() + d * DAY_MS)));
        values.DEMAND += day.DEMAND;
        values.POSSESSION += day.POSSESSION;
      }

      points.push(
        point(
          isoDay(first),
          `${first.getDate()} ${MONTHS[first.getMonth()]}`,
          values
        )
      );
    }
    return points;
  }

  // MONTH: every month from the first notice on record to the current one.
  const stamps = [...demand.keys(), ...possession.keys()].sort();
  const first = new Date(`${stamps[0]}T00:00:00`);
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const spansYears = first.getFullYear() !== end.getFullYear();

  const points = [];
  while (
    cursor.getFullYear() < end.getFullYear() ||
    (cursor.getFullYear() === end.getFullYear() &&
      cursor.getMonth() <= end.getMonth())
  ) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const values = { DEMAND: 0, POSSESSION: 0 };

    for (const [key, count] of demand) {
      if (key.startsWith(prefix)) values.DEMAND += count;
    }
    for (const [key, count] of possession) {
      if (key.startsWith(prefix)) values.POSSESSION += count;
    }

    points.push(
      point(
        prefix,
        spansYears
          ? `${MONTHS[month]} '${String(year).slice(2)}`
          : MONTHS[month],
        values
      )
    );

    cursor.setMonth(month + 1);
  }

  return points;
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
