import { PossessionCell, StatusCell } from "./caseCells";
import { formatDate, formatMoneyFull, formatMoneyShort } from "../utils/format";

/**
 * The biggest cases on the book, and how far each has been taken.
 *
 * Amount and progress side by side is the point: a large liability still
 * sitting on a demand notice is a different problem from an equally large one
 * already through to possession, and neither figure says that on its own.
 *
 * Liability is printed short with the exact amount on the cell's title - a
 * column of nine-digit numbers has to be counted digit by digit before any two
 * rows can be compared.
 */
export default function TopLiabilityCases({ cases = [] }) {
  if (cases.length === 0) {
    return (
      <p className="table-empty">
        No cases for the banks and cities picked above.
      </p>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table liability-table">
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">Borrower</th>
            <th scope="col">Bank</th>
            <th scope="col">City</th>
            <th scope="col" className="is-num">Liability</th>
            <th scope="col">Demand notice</th>
            <th scope="col">Possession notice</th>
            <th scope="col">Status</th>
          </tr>
        </thead>

        <tbody>
          {cases.map((item) => (
            <tr key={item.id}>
              <th scope="row" className="case-id">
                {item.id}
              </th>
              <td>{item.borrower}</td>
              <td>{item.bank}</td>
              <td>{item.city}</td>

              {/* The column the table is sorted by, so it carries the emphasis
                  the sort implies. */}
              <td
                className="liability-amount is-lead is-num"
                title={formatMoneyFull(item.liability)}
              >
                {formatMoneyShort(item.liability)}
              </td>

              <td>{formatDate(item.demandNoticeDate)}</td>
              <td>
                <PossessionCell
                  date={item.possessionNoticeDate}
                  format={formatDate}
                />
              </td>

              <td>
                <StatusCell status={item.caseStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
