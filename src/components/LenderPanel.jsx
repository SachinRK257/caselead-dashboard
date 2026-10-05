import { useState } from "react";
import { Eye, FileCheck2, FileClock, FileWarning, FileX2 } from "lucide-react";

import DocViewer from "./sarfaesi/DocViewer";
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

/**
 * The two states in which the empanelment is still in force. The letter can be
 * opened whatever the state - it exists either way - but only these two mean
 * it still covers the cases sitting at that lender.
 */
const LIVE = [EMPANELMENT_STATE.ACTIVE, EMPANELMENT_STATE.EXPIRING];

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
  const [letter, setLetter] = useState(null);

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
          <colgroup>
            <col className="col-lender" />
            <col className="col-state" />
            <col className="col-ref" />
            <col className="col-term" />
            <col className="col-end" />
            <col className="col-live" />
          </colgroup>

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

                  {/* The state and the letter it rests on, together: the
                      badge says whether the empanelment holds, and the button
                      beside it opens the letter that says so. A lender with no
                      letter has nothing to open and gets no button. */}
                  <td>
                    <span className="letter-cell">
                      <span className={`status-badge ${badge.className}`}>
                        <Icon size={12} aria-hidden="true" />
                        {badge.label}
                      </span>

                      {lender.state !== EMPANELMENT_STATE.NONE && (
                        <button
                          type="button"
                          className={`doc-view letter-view ${
                            LIVE.includes(lender.state) ? "is-live" : ""
                          }`}
                          aria-label={`View the empanelment letter for ${lender.name}`}
                          onClick={() => setLetter(lender)}
                        >
                          <Eye size={12} aria-hidden="true" />
                          View
                        </button>
                      )}
                    </span>
                  </td>

                  <td className="letter-ref">
                    {lender.state === EMPANELMENT_STATE.NONE ? (
                      <span className="cell-muted">Not on file</span>
                    ) : (
                      lender.letterRef
                    )}
                  </td>

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

      {letter && (
        <DocViewer
          item={{ id: letter.letterRef, borrower: letter.name, bank: "" }}
          doc={{ id: "empanelment-letter", label: "Empanelment Letter" }}
          title="Empanelment Letter"
          subtitle={`${letter.letterRef} · ${letter.name} · ${formatDate(
            letter.empStart
          )} to ${formatDate(letter.empEnd)}${
            LIVE.includes(letter.state) ? " · in force" : " · lapsed"
          }`}
          onClose={() => setLetter(null)}
        />
      )}

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
