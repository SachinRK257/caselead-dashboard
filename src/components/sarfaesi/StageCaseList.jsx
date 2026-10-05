import { useState } from "react";
import { ChevronDown } from "lucide-react";

import DocChecklist from "./DocChecklist";
import { formatMoneyFull, formatMoneyShort } from "../../utils/format";

/**
 * The cases sitting at one stage, least complete first.
 *
 * A row opens onto its own checklist rather than linking away: the question
 * this list raises - what is this case waiting on - is answered by the
 * documents, so they belong one click from the count, not one page.
 */
export default function StageCaseList({ cases = [], stage }) {
  const [openId, setOpenId] = useState(null);

  if (cases.length === 0) {
    return (
      <p className="table-empty">No cases at this stage for the banks picked.</p>
    );
  }

  return (
    <div className="stage-list">
      {/* The rows carry the case tables' columns, so they are named the same
          way here rather than left to be inferred from the values. */}
      <div className="stage-list-head" aria-hidden="true">
        <span>Case ID</span>
        <span>Borrower</span>
        <span>Bank</span>
        <span>City</span>
        <span className="stage-row-amount">Liability</span>
        <span>Documents</span>
        <span />
      </div>

      {cases.map((item) => {
        const open = openId === item.id;
        const { done, total } = item.progress;
        const pct = total ? Math.round((done / total) * 100) : 0;

        return (
          <article key={item.id} className={`stage-row ${open ? "is-open" : ""}`}>
            <button
              type="button"
              className="stage-row-head"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="stage-row-id">{item.id}</span>

              {/* Borrower, bank and city stand as their own columns rather
                  than as one stacked block, so the row lines up with the case
                  tables instead of leaving the width between a name and its
                  amount empty. */}
              <span className="stage-row-borrower" title={item.borrower}>
                {item.borrower}
              </span>

              <span className="stage-row-bank" title={item.bank}>
                {item.bank}
              </span>

              <span className="stage-row-city">{item.city}</span>

              <span
                className="stage-row-amount"
                title={formatMoneyFull(item.liability)}
              >
                {formatMoneyShort(item.liability)}
              </span>

              <span className="stage-row-progress">
                <span className="stage-meter" aria-hidden="true">
                  <span
                    className={`stage-meter-fill ${pct === 100 ? "is-done" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <small>
                  {done}/{total} documents
                </small>
              </span>

              <ChevronDown
                size={16}
                aria-hidden="true"
                className="stage-row-caret"
              />
            </button>

            {open && <DocChecklist item={item} stage={stage} />}
          </article>
        );
      })}
    </div>
  );
}
