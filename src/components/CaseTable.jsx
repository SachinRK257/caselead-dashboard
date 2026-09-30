import { describeAssignee } from "../utils/cases";
import {
  formatDate,
  formatMoneyFull,
  formatMoneyShort,
  humanizeEnum,
  isEmptyValue,
} from "../utils/format";

/**
 * The cases behind the figures above, for the scope currently picked.
 *
 * Liability is printed short ("2.5 Cr") with the exact figure on the cell's
 * title, because a column of nine-digit numbers has to be counted digit by
 * digit before any two rows can be compared.
 */
export default function CaseTable({ cases = [] }) {
  if (cases.length === 0) {
    return (
      <p className="table-empty">
        No case matches all three filters. Widen one of them to see results.
      </p>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">Borrower</th>
            <th scope="col">Bank</th>
            <th scope="col">City</th>
            <th scope="col">Status</th>
            <th scope="col">Liability</th>
            <th scope="col">Demand notice</th>
            <th scope="col">Possession notice</th>
            <th scope="col">Assigned to</th>
          </tr>
        </thead>

        <tbody>
          {cases.map((item) => {
            const assignee = describeAssignee(item);

            return (
              <tr key={item.id}>
                <th scope="row" className="case-id">
                  {item.id}
                </th>
                <td>{item.borrower}</td>
                <td>{item.bank}</td>
                <td>{item.city}</td>
                <td>
                  <span
                    className={`status-badge ${item.caseStatus.toLowerCase()}`}
                  >
                    <span className="status-dot" aria-hidden="true" />
                    {humanizeEnum(item.caseStatus)}
                  </span>
                </td>
                <td
                  className="liability-amount"
                  title={formatMoneyFull(item.liability)}
                >
                  {formatMoneyShort(item.liability)}
                </td>
                <td>{formatDate(item.demandNoticeDate)}</td>
                <td>
                  {isEmptyValue(item.possessionNoticeDate) ? (
                    <span className="cell-muted" title="Still inside the 60-day demand notice window">
                      Not served
                    </span>
                  ) : (
                    formatDate(item.possessionNoticeDate)
                  )}
                </td>
                <td>
                  {assignee.name}
                  {/* A suggestion is the city owner, not a real assignment -
                      saying so stops it being read as settled. */}
                  {assignee.isSuggested && (
                    <span className="assignee-hint"> · suggested</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
