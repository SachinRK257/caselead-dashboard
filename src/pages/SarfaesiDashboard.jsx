import { useMemo, useState } from "react";
import { Building2, Search, X } from "lucide-react";

import ScopeFilter from "../components/ScopeFilter";
import StatCard from "../components/StatCard";
import StageCaseList from "../components/sarfaesi/StageCaseList";
import StageFlow from "../components/sarfaesi/StageFlow";
import {
  SARFAESI_STAGE,
  STAGE_LABELS,
  STAGE_ORDER,
  docCountFor,
} from "../data/sarfaesiDocs";
import { buildPanelCounts, matchesSearch } from "../utils/cases";
import {
  buildSarfaesiCases,
  casesAtStage,
  countByStage,
  progressByStage,
  summariseSarfaesi,
} from "../utils/sarfaesi";

/** What each stage is waiting on, said once above its list. */
const STAGE_BLURB = {
  SYMBOLIC:
    "Allotted on the demand notice. The symbolic file has to be complete before possession can be published.",
  SECTION_14:
    "Possession notice served. These are assembling the petition for the magistrate under section 14.",
  PHYSICAL:
    "Section 14 file complete, so the order is in hand. These are being taken into physical possession.",
};

const isComplete = (item) =>
  item.stage === SARFAESI_STAGE.PHYSICAL && item.progress.complete;

/**
 * What each card counts.
 *
 * The card and the list it opens read the same predicate, so the number on the
 * card and the rows underneath it cannot drift apart - which is the whole
 * point of being able to click a figure.
 */
const FOCUS = {
  ALL: { label: "All cases", match: () => true },
  SYMBOLIC: {
    label: STAGE_LABELS.SYMBOLIC,
    match: (item) => item.stage === SARFAESI_STAGE.SYMBOLIC,
  },
  SECTION_14: {
    label: STAGE_LABELS.SECTION_14,
    match: (item) => item.stage === SARFAESI_STAGE.SECTION_14,
  },
  PHYSICAL: {
    label: STAGE_LABELS.PHYSICAL,
    match: (item) => item.stage === SARFAESI_STAGE.PHYSICAL,
  },
  NOT_STARTED: {
    label: "Not started",
    match: (item) => item.progress.done === 0,
  },
  COMPLETED: { label: "Completed cases", match: isComplete },
  PENDING: { label: "Pending cases", match: (item) => !isComplete(item) },
};

/**
 * Enough rows to be a morning's work at each stage. The rest are one click
 * away rather than three long lists down the page.
 */
const ROWS = 8;

/** One stage's panel: its blurb, its cases, and a way to the rest of them. */
function StageSection({ stage, cases, focusLabel }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? cases : cases.slice(0, ROWS);

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>{STAGE_LABELS[stage]}</h2>
          <p>{focusLabel ? `${focusLabel} only` : STAGE_BLURB[stage]}</p>
        </div>
        <span className="count-chip">
          {cases.length} cases · {docCountFor(stage)} documents each
        </span>
      </div>

      <StageCaseList cases={shown} stage={stage} />

      {cases.length > ROWS && (
        <button
          type="button"
          className="disclosure panel-more"
          onClick={() => setShowAll((open) => !open)}
        >
          {showAll
            ? `Show first ${ROWS} only`
            : `Show all ${cases.length} cases (${cases.length - ROWS} more)`}
        </button>
      )}
    </div>
  );
}

/**
 * SARFAESI, whole.
 *
 * The three stages are one run, so they sit on one page: the counts at the
 * top, then each stage's cases with its own checklist.
 *
 * Every figure is a button for the cases behind it. Picking one narrows the
 * lists below to exactly what that card counted, which is the only way to
 * check a number rather than take it on trust.
 */
export default function SarfaesiDashboard({ cases = [] }) {
  const [bank, setBank] = useState(null);
  const [focus, setFocus] = useState(null);
  const [query, setQuery] = useState("");

  const all = useMemo(() => buildSarfaesiCases(cases), [cases]);

  const scoped = useMemo(
    () =>
      all.filter(
        (item) =>
          (!bank || item.bank === bank) && matchesSearch(item, query)
      ),
    [all, bank, query]
  );

  const totals = useMemo(() => countByStage(scoped), [scoped]);
  const stageProgress = useMemo(() => progressByStage(scoped), [scoped]);
  const summary = useMemo(() => summariseSarfaesi(scoped), [scoped]);

  const focused = useMemo(
    () => (focus ? scoped.filter(FOCUS[focus].match) : scoped),
    [scoped, focus]
  );

  const byStage = useMemo(
    () =>
      Object.fromEntries(
        STAGE_ORDER.map((stage) => [stage, casesAtStage(focused, stage)])
      ),
    [focused]
  );

  const panel = useMemo(
    () => buildPanelCounts(all.map((item) => ({ bank: item.bank }))),
    [all]
  );

  const scopeLabel = bank ?? "all banks";

  // A pick that empties a stage hides it rather than leaving a panel reading
  // nought with no clue why.
  const sections = STAGE_ORDER.filter(
    (stage) => !focus || byStage[stage].length > 0
  );

  const pick = (key) => setFocus((current) => (current === key ? null : key));

  return (
    <>
      <section className="notice-strip" aria-labelledby="sarfaesi-overview">
        <div className="notice-head">
          <div>
            <h2 id="sarfaesi-overview">Enforcement Pipeline</h2>
            <p>
              {summary.cases} allotted cases under SARFAESI, for {scopeLabel}
            </p>
          </div>

          <div className="notice-filters">
            <label className="sarfaesi-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Search case, borrower, branch..."
                aria-label="Search SARFAESI cases"
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="scope-filter-clear"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <ScopeFilter
              options={panel}
              value={bank}
              onChange={setBank}
              total={all.length}
              noun="Bank"
              allLabel="All banks"
              icon={Building2}
            />
          </div>
        </div>

        <StageFlow
          totals={totals}
          progress={stageProgress}
          completed={summary.completed}
          focus={focus}
          onPick={pick}
        />
      </section>

      <section className="notice-strip" aria-labelledby="sarfaesi-paper">
        <div className="notice-head">
          <div>
            <h2 id="sarfaesi-paper">Progress</h2>
            <p>Where the run stands, across every checklist and every stage</p>
          </div>

          {focus && (
            <button
              type="button"
              className="scope-clear filters-clear"
              onClick={() => setFocus(null)}
            >
              <X size={13} aria-hidden="true" />
              Showing {FOCUS[focus].label.toLowerCase()}
            </button>
          )}
        </div>

        <div className="notice-cards">
          <StatCard
            title="Documents uploaded"
            value={`${summary.percent}%`}
            description={`${summary.done} of ${summary.required} required across ${summary.cases} cases`}
            active={focus === "ALL"}
            onClick={() => pick("ALL")}
          />

          <StatCard
            title="Not started"
            value={summary.notStarted}
            description="Nothing uploaded yet at their current stage"
            className="sarfaesi-blocked"
            active={focus === "NOT_STARTED"}
            onClick={() => pick("NOT_STARTED")}
          />

          {/* Completed is a subset of the Physical count, not a fourth stage:
              reaching Physical gets you the order, finishing its checklist is
              what closes the case. */}
          <StatCard
            title="Completed cases"
            value={summary.completed}
            description="Possession taken and every document in"
            className="sarfaesi-ready"
            active={focus === "COMPLETED"}
            onClick={() => pick("COMPLETED")}
          />

          <StatCard
            title="Pending cases"
            value={summary.pending}
            description="Still working through a stage"
            active={focus === "PENDING"}
            onClick={() => pick("PENDING")}
          />
        </div>
      </section>

      {sections.length === 0 ? (
        <div className="panel full-panel">
          <p className="table-empty">
            No cases match {FOCUS[focus].label.toLowerCase()} for {scopeLabel}.
          </p>
        </div>
      ) : (
        sections.map((stage) => (
          <StageSection
            key={stage}
            stage={stage}
            cases={byStage[stage]}
            focusLabel={focus && focus !== stage ? FOCUS[focus].label : null}
          />
        ))
      )}
    </>
  );
}
