import { useState } from "react";
import { FileCheck2, FileClock, FileWarning, FileX2 } from "lucide-react";

import { EMPANELMENT, EMPANELMENT_STATE } from "../utils/cases";
import { formatDate } from "../utils/format";

/**
 * Rows shown before the list has to be opened.
 *
 * Every other table on the page opens capped; this one ran to all 32 lenders
 * and was taller than the rest of the dashboard put together. Twelve covers
 * the expiring and lapsed ones, which sort first and are the reason to look.
 */
const ROWS = 12;

/** Badge copy and styling per empanelment state. */
const STATE_BADGE = {
  ACTIVE: { label: "Active", className: "emp-active", icon: FileCheck2 },
  EXPIRING: { label: "Expires soon", className: "emp-expiring", icon: FileClock },
  EXPIRED: { label: "Expired", className: "emp-expired", icon: FileWarning },
  NONE: { label: "No letter", className: "emp-none", icon: FileX2 },
};

/**
 * The lender panel, each lender's empanelment and the window its letter names.
 *
 * The segmented control doubles as the count: "Active 15" answers how many
 * empanelments are live and narrows the table to them in the same click, so
 * the figure and the list can never disagree.
 */
export default function LenderPanel({ rows, summary, filter, onFilter }) {
  const [showAll, setShowAll] = useState(false);

  const shown = showAll ? rows : rows.slice(0, ROWS);

  const segments = [
    { key: EMPANELMENT.ALL, label: "All lenders", count: summary.total },
    { key: EMPANELMENT.ACTIVE, label: "Active", count: summary.active },
    { key: EMPANELMENT.EXPIRED, label: "Expired", count: summary.expired },
    { key: EMPANELMENT.NO_LETTER, label: "No letter", count: summary.noLetter },
  ];

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Lender Panel</h2>
          <p>
            {summary.active} of {summary.total} lenders have a live empanelment
            {summary.expiring > 0 && ` · ${summary.expiring} expiring within 90 days`}
            {summary.casesUncovered > 0 && (
              <>
                {" · "}
                <strong className="panel-warn">
                  {summary.casesUncovered} live cases sit at lenders with no
                  cover
                </strong>
              </>
            )}
          </p>
        </div>

        <div
          className="segmented"
          role="group"
          aria-label="Filter lenders by empanelment"
        >
          {segments.map((segment) => (
            <button
              key={segment.key}
              type="button"
              className={`segment ${filter === segment.key ? "is-active" : ""}`}
              aria-pressed={filter === segment.key}
              onClick={() => onFilter(segment.key)}
            >
              {segment.label}
              <span className="segment-count">{segment.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table lender-table">
          <thead>
            <tr>
              <th scope="col">Lender</th>
              <th scope="col">Empanelment</th>
              <th scope="col">Letter ref</th>
              <th scope="col">Emp. start</th>
              <th scope="col">Emp. end</th>
              <th scope="col" className="is-num">Live cases</th>
            </tr>
          </thead>

          <tbody>
            {shown.map((lender) => {
              const badge = STATE_BADGE[lender.state];
              const Icon = badge.icon;

              return (
                <tr key={lender.name}>
                  <th scope="row" className="lender-name">
                    {lender.name}
                  </th>

                  <td>
                    <span className={`status-badge ${badge.className}`}>
                      <Icon size={12} aria-hidden="true" />
                      {badge.label}
                    </span>
                  </td>

                  <td className="letter-ref">{lender.letterRef}</td>

                  <td>
                    {formatDate(lender.empStart)}
                    {lender.termYears > 0 && (
                      <span className="cell-note"> · {lender.termYears} yrs</span>
                    )}
                  </td>

                  <td
                    className={
                      lender.state === EMPANELMENT_STATE.EXPIRED
                        ? "emp-end-lapsed"
                        : ""
                    }
                  >
                    {formatDate(lender.empEnd)}
                  </td>

                  {/* Cases at a lender with no live cover are the exposure this
                      table exists to surface, so they are marked rather than
                      left as one more number in the column. */}
                  <td
                    className={`is-num ${
                      lender.cases > 0 &&
                      (lender.state === EMPANELMENT_STATE.EXPIRED ||
                        lender.state === EMPANELMENT_STATE.NONE)
                        ? "cases-exposed"
                        : ""
                    }`}
                  >
                    {lender.cases}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > ROWS && (
        <button
          type="button"
          className="disclosure panel-more"
          onClick={() => setShowAll((open) => !open)}
        >
          {showAll
            ? `Show first ${ROWS} only`
            : `Show all ${rows.length} lenders (${rows.length - ROWS} more)`}
        </button>
      )}
    </div>
  );
}
