import { useState } from "react";
import { MapPin, UserPlus } from "lucide-react";

import EmptyState from "../components/EmptyState";
import { getOwnerForCity, initialsOf } from "../utils/cases";
import { salespeople } from "../data/mockData";
import { formatDate, formatMoneyFull, formatMoneyShort } from "../utils/format";

/**
 * Hand an unowned case to a salesperson.
 *
 * The dropdown starts on whoever owns that city, since that is the assignment
 * that gets made nine times out of ten - but it stays a dropdown, because the
 * tenth case is exactly the one a default would get wrong.
 */
function AssignRow({ item, onAssign }) {
  const owner = getOwnerForCity(item.city);
  const [choice, setChoice] = useState(owner?.id ?? salespeople[0].id);

  return (
    <div className="assign-row">
      <div className="assign-main">
        <div className="small-avatar" aria-hidden="true">
          {item.borrower.charAt(0)}
        </div>

        <div>
          <strong>{item.borrower}</strong>
          <small>
            {item.id} · {item.bank} {item.branch}
          </small>
        </div>
      </div>

      <div className="assign-facts">
        <span className="assign-fact">
          <MapPin size={13} aria-hidden="true" />
          {item.city}
        </span>
        <span className="assign-fact" title={formatMoneyFull(item.liability)}>
          {formatMoneyShort(item.liability)}
        </span>
        <span className="assign-fact">
          Due {formatDate(item.requiredActionDate)}
        </span>
      </div>

      <div className="assign-action">
        <select
          className="filter-select"
          value={choice}
          aria-label={`Choose who handles ${item.borrower}`}
          onChange={(e) => setChoice(e.target.value)}
        >
          {salespeople.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} ({person.city})
              {person.id === owner?.id ? " — city owner" : ""}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="filter-button"
          onClick={() => onAssign?.(item.id, choice)}
        >
          Assign
        </button>
      </div>
    </div>
  );
}

export default function AssignCasesPage({ cases = [], onAssign }) {
  const waiting = cases.filter(
    (item) => item.allocationStatus === "NOT_ALLOCATED"
  );

  const justAssigned = cases.filter((item) => item.assignedHere);

  return (
    <>
      <div className="panel full-panel">
        <div className="panel-header">
          <div>
            <h2>
              Waiting for an owner
              <span className="count-chip">{waiting.length}</span>
            </h2>
            <p>Nobody is working on these yet</p>
          </div>
        </div>

        <div className="assign-list">
          {waiting.length === 0 ? (
            <EmptyState message="Every case has someone on it." />
          ) : (
            waiting.map((item) => (
              <AssignRow key={item.id} item={item} onAssign={onAssign} />
            ))
          )}
        </div>
      </div>

      {justAssigned.length > 0 && (
        <div className="panel full-panel">
          <div className="panel-header">
            <div>
              <h2>
                Assigned just now
                <span className="count-chip">{justAssigned.length}</span>
              </h2>
              {/* No backend here, so say plainly how long this lasts. */}
              <p>Kept while this page is open, not saved to a server</p>
            </div>
          </div>

          <div className="assign-list">
            {justAssigned.map((item) => (
              <div className="assign-row is-done" key={item.id}>
                <div className="assign-main">
                  <div className="assign-icon" aria-hidden="true">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <strong>{item.borrower}</strong>
                    <small>
                      {item.id} · now with {item.assignedName}
                    </small>
                  </div>
                </div>

                <div className="small-avatar" aria-hidden="true">
                  {initialsOf(item.assignedName)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
