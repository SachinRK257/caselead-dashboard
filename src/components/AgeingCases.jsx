import { StatusCell } from "./caseCells";
import { formatDate, formatMoneyFull, formatMoneyShort } from "../utils/format";

/**
 * How long is long enough to stand out. Past this the figure is marked, so the
 * eye lands on the cases that have been sitting rather than on the top row.
 */
const STALE_DAYS = 180;

/**
 * The oldest cases still waiting on someone.
 *
 * This is the one place the dashboard names individual cases, and it earns it
 * by being a worklist rather than a listing: ten rows, every one of them a
 * case that has been open longest with nothing settled. The full book lives on
 * the Case Lead page.
 */
export default function AgeingCases({ cases = [] }) {
  if (cases.length === 0) {
    return (
      <p className="table-empty">
        Nothing is waiting in these stages for the banks and cities picked
        above.
      </p>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table ageing-table">
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">Borrower</th>
            <th scope="col">Bank</th>
            <th scope="col">City</th>
            <th scope="col">Status</th>
            <th scope="col" className="is-num">Days open</th>
            <th scope="col">Demand notice</th>
            <th scope="col" className="is-num">Liability</th>
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

                <td>
                  <StatusCell status={item.caseStatus} />
                </td>

                {/* The column the table is sorted by, so it carries the
                    emphasis the sort implies. */}
                <td
                  className={`days-open is-num ${
                    item.daysOpen >= STALE_DAYS ? "is-stale" : ""
                  }`}
                >
                  {item.daysOpen} days
                </td>

                <td>{formatDate(item.demandNoticeDate)}</td>

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
