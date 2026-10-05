import {
  docIdsFor,
  SARFAESI_STAGE,
  STAGE_DOCS,
  STAGE_ORDER,
} from "../data/sarfaesiDocs";
import { isEmptyValue } from "./format";

/**
 * Where a case stands in the SARFAESI enforcement run.
 *
 * Only cases the bank has allotted are in the module at all - the rest are
 * still being chased and nothing has been filed for them.
 *
 * The stage is read off the case rather than stored, so it cannot drift from
 * the evidence behind it:
 *
 *   SYMBOLIC    allotted on the demand notice; possession not yet taken
 *   SECTION 14  the possession notice has gone out, so the s.14 petition is
 *               the next step
 *   PHYSICAL    the Section 14 checklist is complete, which in practice means
 *               the magistrate's order is in hand and possession can be taken
 *
 * A case therefore moves on by having its documents uploaded, not by anyone
 * setting a status - which is what the module is for.
 */
export const ALLOTTED_STATUS = "ALLOTTED";

export function isInSarfaesi(item) {
  return item.caseStatus === ALLOTTED_STATUS;
}

/** Documents uploaded for a case, as a Set for quick lookup. */
export function uploadedDocs(item) {
  return new Set(item.sarfaesiDocs ?? []);
}

/** How many of a stage's documents a case has, and how many it needs. */
export function stageProgress(item, stage) {
  const ids = docIdsFor(stage);
  const have = uploadedDocs(item);
  const done = ids.filter((id) => have.has(id)).length;

  return { done, total: ids.length, complete: ids.length > 0 && done === ids.length };
}

export function getSarfaesiStage(item) {
  if (stageProgress(item, SARFAESI_STAGE.SECTION_14).complete) {
    return SARFAESI_STAGE.PHYSICAL;
  }
  if (!isEmptyValue(item.possessionNoticeDate)) {
    return SARFAESI_STAGE.SECTION_14;
  }
  return SARFAESI_STAGE.SYMBOLIC;
}

/** Every allotted case, tagged with its stage and that stage's progress. */
export function buildSarfaesiCases(cases) {
  return cases.filter(isInSarfaesi).map((item) => {
    const stage = getSarfaesiStage(item);
    return { ...item, stage, progress: stageProgress(item, stage) };
  });
}

/** Cases at one stage, least complete first - those are the ones to chase. */
export function casesAtStage(sarfaesiCases, stage) {
  return sarfaesiCases
    .filter((item) => item.stage === stage)
    .sort(
      (a, b) =>
        a.progress.done / a.progress.total - b.progress.done / b.progress.total ||
        a.id.localeCompare(b.id)
    );
}

/** Case count per stage, in pipeline order. */
export function countByStage(sarfaesiCases) {
  const counts = Object.fromEntries(STAGE_ORDER.map((stage) => [stage, 0]));
  for (const item of sarfaesiCases) counts[item.stage] += 1;
  return counts;
}

/**
 * Document completion per stage, as a percentage of what that stage asks for.
 *
 * Averaged across the cases sitting at the stage, not across the whole run:
 * Section 14 asks for eighteen documents and Symbolic for seven, so a single
 * figure spanning both would be weighted by checklist length rather than by
 * how far the work has got.
 */
export function progressByStage(sarfaesiCases) {
  const totals = Object.fromEntries(
    STAGE_ORDER.map((stage) => [stage, { done: 0, required: 0 }])
  );

  for (const item of sarfaesiCases) {
    const bucket = totals[item.stage];
    bucket.done += item.progress.done;
    bucket.required += item.progress.total;
  }

  return Object.fromEntries(
    STAGE_ORDER.map((stage) => [
      stage,
      totals[stage].required
        ? Math.round((totals[stage].done / totals[stage].required) * 100)
        : 0,
    ])
  );
}

/**
 * The run as a whole: how much paper is in, how much is done, and what has
 * not been started.
 *
 * A case is `completed` only when it has reached Physical and has every one
 * of that stage's documents - possession taken and the file closed. Reaching
 * the stage is not the same as finishing it, which is why this is not simply
 * the Physical count.
 *
 * `notStarted` is the other end: nothing uploaded at all against the stage
 * the case is sitting at. Both are invisible in an average.
 */
export function summariseSarfaesi(sarfaesiCases) {
  let done = 0;
  let required = 0;
  let notStarted = 0;
  let completed = 0;

  for (const item of sarfaesiCases) {
    done += item.progress.done;
    required += item.progress.total;

    if (item.progress.done === 0) notStarted += 1;
    if (item.stage === SARFAESI_STAGE.PHYSICAL && item.progress.complete) {
      completed += 1;
    }
  }

  return {
    cases: sarfaesiCases.length,
    done,
    required,
    percent: required ? Math.round((done / required) * 100) : 0,
    notStarted,
    completed,
    pending: sarfaesiCases.length - completed,
  };
}

/**
 * Documents still missing at a stage, grouped as the checklist groups them.
 *
 * Groups that are fully uploaded are dropped: what is left is the list of
 * things to go and get.
 */
export function missingByGroup(item, stage) {
  const have = uploadedDocs(item);

  return (STAGE_DOCS[stage] ?? [])
    .map((group) => ({
      title: group.title,
      docs: group.docs.filter((doc) => !have.has(doc.id)),
    }))
    .filter((group) => group.docs.length > 0);
}
