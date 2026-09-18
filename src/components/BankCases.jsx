import { ArrowUpRight, Building2 } from "lucide-react";
import { bankData } from "../data/mockData";

export default function BankCases() {
  const total = bankData.reduce((sum, bank) => sum + bank.count, 0);

  // Guard the empty case: Math.max() of nothing is -Infinity.
  const max = bankData.length
    ? Math.max(...bankData.map((bank) => bank.count))
    : 0;

  return (
    <div className="panel bank-panel">
      <div className="panel-header">
        <div>
          <h2>Cases by Bank</h2>
          <p>Distribution of cases across banks</p>
        </div>

        <button type="button" className="text-button">
          View all <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="bank-list">
        {bankData.map((bank) => {
          const share = max ? Math.round((bank.count / max) * 100) : 0;

          return (
            <div className="bank-row" key={bank.name}>
              <div className="bank-name">
                <div className="bank-icon" aria-hidden="true">
                  <Building2 size={17} />
                </div>
                <span>{bank.name}</span>
              </div>

              <div className="bank-progress">
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-valuenow={bank.count}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-label={`${bank.name}: ${bank.count} cases`}
                >
                  <div
                    className="progress-fill"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>

              <strong>{bank.count}</strong>
            </div>
          );
        })}
      </div>

      <div className="bank-total">
        <span>Total Cases</span>
        <strong>{total}</strong>
      </div>
    </div>
  );
}
