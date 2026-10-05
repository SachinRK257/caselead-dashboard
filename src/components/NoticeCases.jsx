import { PossessionCell, StatusCell } from "./caseCells";
import { formatDate, formatMoneyFull, formatMoneyShort } from "../utils/format";

/**
 * The cases behind a notice figure.
 *
 * Both notice dates are shown whichever card opened the list: a demand-stage
 * case is defined by having no possession date, and seeing that column empty
 * is what makes the grouping legible rather than something to take on trust.
 */
export default function NoticeCases({ cases = [] }) {
  if (cases.length === 0) {
    return <p className="table-empty">No cases match this figure.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table notice-table">
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

              <td
                className="liability-amount is-num"
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
