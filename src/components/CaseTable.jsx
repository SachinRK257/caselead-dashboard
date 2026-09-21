import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import {
  describeAssignee,
  DOCUMENT_STATUS_LABELS,
  VISIT_STATUS_LABELS,
} from "../utils/cases";
import {
  formatDate,
  formatMoneyFull,
  formatMoneyShort,
  formatRemainingDays,
  humanizeEnum,
} from "../utils/format";

const COLUMN_COUNT = 9;

/**
 * The full case record as a table.
 *
 * Shared by every list page so the columns mean the same thing wherever a
 * salesperson lands, rather than each page inventing its own shape.
 */
export default function CaseTable({ cases = [], emptyMessage = "No cases." }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Borrower</th>
            <th scope="col">Bank</th>
            <th scope="col">Branch</th>
            <th scope="col">Property</th>
            <th scope="col">Amount Due</th>
            <th scope="col">Deadline</th>
            <th scope="col">Time Left</th>
            <th scope="col">Handled By</th>
            <th scope="col">Papers</th>
          </tr>
        </thead>

        <tbody>
          {cases.length === 0 ? (
            <EmptyState colSpan={COLUMN_COUNT} message={emptyMessage} />
          ) : (
            cases.map((item) => {
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

                  <td>{item.bank}</td>
                  <td>{item.branch}</td>
                  <td>{item.property}</td>

                  <td>
                    <div
                      className="liability-amount"
                      title={formatMoneyFull(item.liability)}
                    >
                      {formatMoneyShort(item.liability)}
                    </div>
                  </td>

                  <td>{formatDate(item.requiredActionDate)}</td>

                  <td>
                    <div className="stacked-cell">
                      <StatusBadge status={item.timelineStatus} />
                      <small>{formatRemainingDays(item.remainingDays)}</small>
                    </div>
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
                    <span
                      className={`document-status ${
                        item.documents === "DOCUMENTS_COMPLETE"
                          ? "is-complete"
                          : "is-pending"
                      }`}
                    >
                      {DOCUMENT_STATUS_LABELS[item.documents] ??
                        humanizeEnum(item.documents)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export { VISIT_STATUS_LABELS };
