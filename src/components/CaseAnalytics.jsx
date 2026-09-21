import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import AreaChart from "./charts/AreaChart";
import BarChart from "./charts/BarChart";
import { ChartShell } from "./charts/ChartShell";
import {
  buildCityMix,
  buildIntakeByMonth,
  buildLiabilityByBank,
} from "../utils/cases";
import { formatMoneyFull, formatMoneyShort } from "../utils/format";

/**
 * Cross-cutting views of the loaded cases.
 *
 * Closed by default. A salesperson opening the dashboard needs the deadline and
 * visit panels, not three analysis charts; leaving these expanded pushed the
 * working panels further down the page for everybody.
 *
 *
 * Everything here is scoped to the cases currently in view, which is a sample
 * of the wider book - the panel says so, because the bank panel above reports
 * portfolio totals and the two sets of numbers must not look like they
 * disagree.
 */
export default function CaseAnalytics({ cases = [] }) {
  const [open, setOpen] = useState(false);

  const intake = useMemo(() => buildIntakeByMonth(cases), [cases]);
  const liability = useMemo(() => buildLiabilityByBank(cases), [cases]);
  const city = useMemo(() => buildCityMix(cases), [cases]);

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Extra Charts</h2>
          <p>Trends and totals for the {cases.length} cases on your screen</p>
        </div>

        <button
          type="button"
          className="disclosure"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"} charts
          <ChevronDown
            size={15}
            aria-hidden="true"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
        </button>
      </div>

      {open && (
      <div className="chart-grid">
        <div className="chart-cell is-wide">
          <ChartShell
            title="New cases each month"
            caption="Counted by demand notice date"
            columns={["Month", "Cases"]}
            rows={intake.map((p) => [p.label, p.value])}
          >
            <AreaChart points={intake} valueLabel="cases" />
          </ChartShell>
        </div>

        <div className="chart-cell">
          <ChartShell
            title="Amount due by bank"
            caption="Longer bar = more money at stake"
            columns={["Bank", "Liability"]}
            rows={liability.map((b) => [b.label, formatMoneyFull(b.value)])}
          >
            <BarChart
              data={liability}
              formatValue={formatMoneyShort}
              labelWidth={104}
            />
          </ChartShell>
        </div>

        <div className="chart-cell">
          <ChartShell
            title="Cases by city"
            caption="Longer bar = more cases"
            columns={["City", "Cases"]}
            rows={city.map((c) => [c.label, c.value])}
          >
            {/* Bars, not a stacked bar: several singleton classes would be
                unreadable slivers in a single track. */}
            <BarChart data={city} labelWidth={104} />
          </ChartShell>
        </div>
      </div>
      )}
    </div>
  );
}
