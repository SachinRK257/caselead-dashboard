import { useMemo, useState } from "react";
import { Building2, CalendarDays } from "lucide-react";

import EmptyState from "./EmptyState";
import StackedBar from "./charts/StackedBar";
import { VISIT_COLORS } from "./charts/chartTokens";
import {
  buildVisitMix,
  describeAssignee,
  VISIT_STATUS_LABELS,
} from "../utils/cases";
import { formatDate, humanizeEnum } from "../utils/format";

const COLUMN_COUNT = 8;
const MAX_ROWS = 6;

export default function BankVisitCases({ cases = [] }) {
  const [statusFilter, setStatusFilter] = useState("OPEN");

  // The mix is of every case in scope, not of the current selection -
  // otherwise picking a status would collapse the chart to one segment.
  const mix = useMemo(() => buildVisitMix(cases), [cases]);

  const rows = useMemo(() => {
    const filtered =
      statusFilter === "ALL"
        ? cases
        : statusFilter === "OPEN"
          ? cases.filter((item) => item.bankVisit !== "VISIT_COMPLETED")
          : cases.filter((item) => item.bankVisit === statusFilter);

    return filtered.slice(0, MAX_ROWS);
  }, [cases, statusFilter]);

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Bank Visits</h2>
          <p>Who to visit, and when</p>
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          aria-label="Filter by visit status"
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="OPEN">Open Visits</option>
          <option value="ALL">All Status</option>
          {Object.entries(VISIT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="panel-chart">
        <StackedBar
          selected={statusFilter}
          onSelect={setStatusFilter}
          segments={Object.entries(VISIT_STATUS_LABELS).map(
            ([key, label]) => ({
              key,
              label,
              value: mix[key] ?? 0,
              color: VISIT_COLORS[key],
            })
          )}
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Borrower</th>
              <th scope="col">Bank</th>
              <th scope="col">Branch</th>
              <th scope="col">Property</th>
              <th scope="col">Visit</th>
              <th scope="col">Handled By</th>
              <th scope="col">Visit Date</th>
              <th scope="col">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <EmptyState
                colSpan={COLUMN_COUNT}
                message="No bank visits match this filter."
              />
            ) : (
              rows.map((item) => {
                const assignee = describeAssignee(item);

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="borrower">
                        <div className="small-avatar" aria-hidden="true">
                          {item.borrower.charAt(0)}
                        </div>
                        <div>
                          <strong>{item.borrower}</strong>
                          <small>{item.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="bank-cell">
                        <Building2 size={15} aria-hidden="true" />
                        {item.bank}
                      </div>
                    </td>

                    <td>{item.branch}</td>

                    <td>{item.property}</td>

                    <td>
                      <span
                        className={`visit-status ${item.bankVisit.toLowerCase()}`}
                      >
                        {VISIT_STATUS_LABELS[item.bankVisit] ??
                          humanizeEnum(item.bankVisit)}
                      </span>
                    </td>

                    <td>
                      <div className="assignee-cell">
                        <strong>{assignee.name}</strong>
                        {assignee.isSuggested && (
                          <small className="suggested-tag">
                            {item.city} owner
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="date-cell">
                        <CalendarDays size={14} aria-hidden="true" />
                        {formatDate(item.expectedVisit)}
                      </div>
                    </td>

                    <td>{item.remarks}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
