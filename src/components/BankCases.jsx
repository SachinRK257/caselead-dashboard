import { useMemo } from "react";

import BarChart from "./charts/BarChart";
import { ChartShell } from "./charts/ChartShell";
import { buildPropertyMix } from "../utils/cases";
import { bankData } from "../data/mockData";

/**
 * Two views of how the book splits.
 *
 * The bank chart counts the whole portfolio while the property chart counts
 * only the cases loaded into this view, so each chart states its own scope -
 * side by side, unlabelled, the two totals would look like a contradiction.
 */
export default function BankCases({ cases = [] }) {
  const byBank = useMemo(
    () =>
      [...bankData]
        .map((bank) => ({ key: bank.name, label: bank.name, value: bank.count }))
        .sort((a, b) => b.value - a.value),
    []
  );

  const byProperty = useMemo(() => buildPropertyMix(cases), [cases]);
  const total = byBank.reduce((sum, bank) => sum + bank.value, 0);

  return (
    <div className="panel bank-panel">
      <div className="panel-header">
        <div>
          <h2>Where Your Cases Are</h2>
          <p>Split by bank and by property</p>
        </div>
      </div>

      <div className="panel-charts">
        <ChartShell
          title="By bank"
          caption={`All ${total} cases in the book`}
          columns={["Bank", "Cases"]}
          rows={byBank.map((b) => [b.label, b.value])}
        >
          {/* One hue for every bar. Banks are nominal categories, so shading
              by size would only restate the bar length. */}
          <BarChart data={byBank} labelWidth={116} />
        </ChartShell>

        <ChartShell
          title="By property type"
          caption={`The ${cases.length} cases on your screen`}
          columns={["Property type", "Cases"]}
          rows={byProperty.map((p) => [p.label, p.value])}
        >
          <BarChart data={byProperty} labelWidth={126} />
        </ChartShell>
      </div>

      <div className="bank-total">
        <span>Total Cases</span>
        <strong>{total}</strong>
      </div>
    </div>
  );
}
