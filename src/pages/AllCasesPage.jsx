import { useMemo, useState } from "react";

import CaseTable from "../components/CaseTable";
import {
  buildBankCounts,
  TIMELINE_STATUS_LABELS,
  VISIT_STATUS_LABELS,
} from "../utils/cases";

/**
 * Every case, with the filters stacked in one row above the table.
 *
 * Filters sit together rather than being scattered through the page, so the
 * count under them always describes the whole view.
 */
export default function AllCasesPage({ cases = [], allCases = [] }) {
  const [bank, setBank] = useState("ALL");
  const [timeline, setTimeline] = useState("ALL");
  const [visit, setVisit] = useState("ALL");
  const [sort, setSort] = useState("deadline");

  const banks = useMemo(
    () => buildBankCounts(allCases).map((b) => b.label),
    [allCases]
  );

  const rows = useMemo(() => {
    const filtered = cases
      .filter((c) => bank === "ALL" || c.bank === bank)
      .filter((c) => timeline === "ALL" || c.timelineStatus === timeline)
      .filter((c) => visit === "ALL" || c.bankVisit === visit);

    const sorted = [...filtered];
    if (sort === "deadline") {
      sorted.sort((a, b) => (a.remainingDays ?? 0) - (b.remainingDays ?? 0));
    } else if (sort === "amount") {
      sorted.sort((a, b) => b.liability - a.liability);
    } else {
      sorted.sort((a, b) => a.borrower.localeCompare(b.borrower));
    }

    return sorted;
  }, [cases, bank, timeline, visit, sort]);

  const active = bank !== "ALL" || timeline !== "ALL" || visit !== "ALL";

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>All Cases</h2>
          <p>
            Showing {rows.length} of {cases.length} cases
          </p>
        </div>

        <div className="filter-row">
          <select
            className="filter-select"
            value={bank}
            aria-label="Filter by bank"
            onChange={(e) => setBank(e.target.value)}
          >
            <option value="ALL">All banks</option>
            {banks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={timeline}
            aria-label="Filter by deadline"
            onChange={(e) => setTimeline(e.target.value)}
          >
            <option value="ALL">Any deadline</option>
            {Object.entries(TIMELINE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={visit}
            aria-label="Filter by visit status"
            onChange={(e) => setVisit(e.target.value)}
          >
            <option value="ALL">Any visit</option>
            {Object.entries(VISIT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sort}
            aria-label="Sort cases"
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="deadline">Soonest deadline</option>
            <option value="amount">Biggest amount</option>
            <option value="name">Borrower name</option>
          </select>

          {active && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setBank("ALL");
                setTimeline("ALL");
                setVisit("ALL");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <CaseTable
        cases={rows}
        emptyMessage="No cases match these filters."
      />
    </div>
  );
}
