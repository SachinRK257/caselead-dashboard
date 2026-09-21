import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import {
  HIGH_LIABILITY_THRESHOLD,
  isHighLiability,
  parseAmount,
} from "../utils/cases";
import { formatMoneyFull, formatMoneyShort } from "../utils/format";

const COLUMN_COUNT = 7;

export default function HighLiabilityCases({ cases = [] }) {
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [range, setRange] = useState({ min: null, max: null });

  const rows = useMemo(() => {
    return cases
      .filter(isHighLiability)
      .filter((item) => range.min === null || item.liability >= range.min)
      .filter((item) => range.max === null || item.liability <= range.max)
      .sort((a, b) => b.liability - a.liability);
  }, [cases, range]);

  function handleSubmit(event) {
    event.preventDefault();

    const min = parseAmount(minInput);
    const max = parseAmount(maxInput);

    // A reversed range is almost certainly a typo, so read it in order.
    setRange(
      min !== null && max !== null && min > max
        ? { min: max, max: min }
        : { min, max }
    );
  }

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Biggest Cases</h2>
          <p>
            {formatMoneyShort(HIGH_LIABILITY_THRESHOLD)} and above &mdash;
            work on these first
          </p>
        </div>

        <form className="liability-filter" onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Min ₹"
            aria-label="Minimum liability amount"
            value={minInput}
            onChange={(event) => setMinInput(event.target.value)}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Max ₹"
            aria-label="Maximum liability amount"
            value={maxInput}
            onChange={(event) => setMaxInput(event.target.value)}
          />

          <button type="submit" className="filter-button">
            Filter
          </button>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Borrower</th>
              <th scope="col">Case ID</th>
              <th scope="col">Bank</th>
              <th scope="col">Amount Due</th>
              <th scope="col">Property</th>
              <th scope="col">Deadline</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <EmptyState
                colSpan={COLUMN_COUNT}
                message="No high liability cases match this range."
              />
            ) : (
              rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="borrower">
                      <div className="small-avatar" aria-hidden="true">
                        {item.borrower.charAt(0)}
                      </div>
                      <strong>{item.borrower}</strong>
                    </div>
                  </td>

                  <td>
                    <span className="case-id">{item.id}</span>
                  </td>

                  <td>{item.bank}</td>

                  <td>
                    <div
                      className="liability-amount"
                      title={formatMoneyFull(item.liability)}
                    >
                      {formatMoneyShort(item.liability)}
                    </div>
                  </td>

                  <td>{item.property}</td>

                  <td>
                    <StatusBadge status={item.timelineStatus} />
                  </td>

                  <td>
                    <button
                      type="button"
                      className="icon-action"
                      aria-label={`Open case ${item.id}`}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
