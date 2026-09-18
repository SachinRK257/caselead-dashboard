import { useMemo, useState } from "react";
import { MapPin, Phone } from "lucide-react";

import EmptyState from "./EmptyState";
import { buildTeamWorkload, initialsOf } from "../utils/cases";
import { formatAmount } from "../utils/format";

const COLUMN_COUNT = 7;

export default function SalesTeam({ cases = [], currentUserId }) {
  const [regionFilter, setRegionFilter] = useState("ALL");

  const team = useMemo(() => buildTeamWorkload(cases), [cases]);

  const regions = useMemo(
    () => [...new Set(team.map((person) => person.region))].sort(),
    [team]
  );

  const rows = useMemo(
    () =>
      regionFilter === "ALL"
        ? team
        : team.filter((person) => person.region === regionFilter),
    [team, regionFilter]
  );

  // Scale the workload bars against the busiest person on screen.
  const maxAssigned = rows.length
    ? Math.max(...rows.map((person) => person.assigned))
    : 0;

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Sales Team by City</h2>
          <p>Case load per salesperson across branches</p>
        </div>

        <select
          className="filter-select"
          value={regionFilter}
          aria-label="Filter by region"
          onChange={(event) => setRegionFilter(event.target.value)}
        >
          <option value="ALL">All Regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Salesperson</th>
              <th scope="col">City</th>
              <th scope="col">Contact</th>
              <th scope="col">Case Load</th>
              <th scope="col">Timeline Risk</th>
              <th scope="col">Pending</th>
              <th scope="col">Liability Handled</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <EmptyState
                colSpan={COLUMN_COUNT}
                message="No salespeople match this region."
              />
            ) : (
              rows.map((person) => {
                const share = maxAssigned
                  ? Math.round((person.assigned / maxAssigned) * 100)
                  : 0;

                return (
                  <tr key={person.id}>
                    <td>
                      <div className="borrower">
                        <div className="small-avatar" aria-hidden="true">
                          {initialsOf(person.name)}
                        </div>
                        <div>
                          <strong>
                            {person.name}
                            {person.id === currentUserId && (
                              <span className="you-tag">You</span>
                            )}
                          </strong>
                          <small>{person.region}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="date-cell">
                        <MapPin size={14} aria-hidden="true" />
                        {person.city}
                      </div>
                    </td>

                    <td>
                      <div className="date-cell">
                        <Phone size={14} aria-hidden="true" />
                        {person.phone}
                      </div>
                    </td>

                    <td>
                      <div className="workload-cell">
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <strong>{person.assigned}</strong>
                      </div>

                      {person.unassignedInCity > 0 && (
                        <small className="workload-note">
                          +{person.unassignedInCity} awaiting allocation
                        </small>
                      )}
                    </td>

                    <td>
                      <div className="risk-cell">
                        {person.overdue > 0 && (
                          <span className="risk-pill is-overdue">
                            {person.overdue} overdue
                          </span>
                        )}
                        {person.dueSoon > 0 && (
                          <span className="risk-pill is-due">
                            {person.dueSoon} due soon
                          </span>
                        )}
                        {person.overdue === 0 && person.dueSoon === 0 && (
                          <span className="risk-pill is-clear">Clear</span>
                        )}
                      </div>
                    </td>

                    <td>
                      {person.pendingDocs} docs · {person.pendingVisits} visits
                    </td>

                    <td>
                      <div className="liability-amount">
                        ₹{formatAmount(person.liability)}
                      </div>
                    </td>
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
