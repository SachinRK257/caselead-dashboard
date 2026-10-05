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
        <colgroup>
          <col className="col-case" />
          <col className="col-borrower" />
          <col className="col-bank" />
          <col className="col-city" />
          <col className="col-status" />
          <col className="col-date" />
          <col className="col-possession" />
          <col className="col-metric" />
        </colgroup>

        <thead>
          <tr>
            <th scope="col">Case ID</th>
            <th scope="col">Borrower</th>
            <th scope="col">Bank</th>
            <th scope="col">City</th>
            <th scope="col">Status</th>
            <th scope="col">Demand notice</th>
            <th scope="col">Possession notice</th>
            {/* The column the table is sorted by, last and right-aligned, the
                same place Days open and Liability sit in the ageing list. */}
            <th scope="col" className="is-num">Liability</th>
          </tr>
        </thead>

        <tbody>
          {cases.map((item) => (
            <tr key={item.id}>
              <th scope="row" className="case-id">
                {item.id}
              </th>
              <td title={item.borrower}>{item.borrower}</td>
              <td title={item.bank}>{item.bank}</td>
              <td>{item.city}</td>

              <td>
                <StatusCell status={item.caseStatus} />
              </td>

              <td>{formatDate(item.demandNoticeDate)}</td>
              <td>
                <PossessionCell
                  date={item.possessionNoticeDate}
                  format={formatDate}
                />
              </td>

              {/* Carries the emphasis the sort implies, rather than sitting as
                  one more number. */}
              <td
                className="liability-amount is-lead is-num"
                title={formatMoneyFull(item.liability)}
              >
                {formatMoneyShort(item.liability)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
