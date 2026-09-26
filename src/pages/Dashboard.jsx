import { useMemo, useState } from "react";
import { FileText, Gavel } from "lucide-react";

import BankFilter from "../components/BankFilter";
import StatCard from "../components/StatCard";
import BarChart from "../components/charts/BarChart";
import { ChartShell } from "../components/charts/ChartShell";
import {
  buildBankCounts,
  buildNoticeStage,
  buildPanelCounts,
  buildPropertyMix,
} from "../utils/cases";

/** Show-all control for a capped chart. Rendered only when there is a tail. */
function MoreButton({ shown, total, cap, onToggle, noun }) {
  if (total - cap <= 0) return null;

  return (
    <button type="button" className="disclosure chart-more" onClick={onToggle}>
      {shown
        ? `Show top ${cap} only`
        : `Show all ${total} ${noun} (${total - cap} more)`}
    </button>
  );
}

// 32 lenders is too long a chart to scan; the rest are one click away.
const TOP = 5;

export default function Dashboard({ cases = [] }) {
  const [bank, setBank] = useState(null);
  const [showAllBanks, setShowAllBanks] = useState(false);

  const byBank = useMemo(() => buildBankCounts(cases), [cases]);
  const panel = useMemo(() => buildPanelCounts(cases), [cases]);

  // The bank chart shows the whole book so the filter has something to pick
  // from; everything else narrows to the selection.
  const scoped = useMemo(
    () => (bank ? cases.filter((c) => c.bank === bank) : cases),
    [cases, bank]
  );

  const byProperty = useMemo(() => buildPropertyMix(scoped), [scoped]);

  const notices = useMemo(() => buildNoticeStage(scoped), [scoped]);
  const demandTotal = notices.DEMAND;
  const possessionTotal = notices.POSSESSION;

  const bankShown = showAllBanks ? byBank : byBank.slice(0, TOP);

  // Share of the scoped book, so the two cards read as a split of one
  // population rather than two unrelated counts.
  const share = (count) =>
    scoped.length ? Math.round((count / scoped.length) * 100) : 0;

  // Every figure in the strip has to describe the same population, or
  // "Cases 22" sitting beside "Lenders 29" invites reading them together.
  const scopedLenders = bank ? 1 : byBank.length;

  const scopeLabel = bank ?? "all banks";

  return (
    <>
      {/* One filter bar above the charts rather than inside a panel header:
          the panels are half-width now, and a scope that governs the whole
          page should not look like it belongs to the first chart. */}
      <div className="dashboard-toolbar">
        <BankFilter
          banks={panel}
          value={bank}
          onChange={setBank}
          total={cases.length}
        />

        <dl className="scope-summary">
          <div>
            <dt>Cases</dt>
            <dd>{scoped.length}</dd>
          </div>
          <div>
            <dt>Lenders</dt>
            <dd>
              {scopedLenders}
              <small>of {panel.length}</small>
            </dd>
          </div>
        </dl>
      </div>

      {/* The notice split is two numbers, not a distribution, so it reads as
          a pair of cards rather than a chart. Both follow the bank filter. */}
      <section className="stats-grid stats-grid-notices">
        <StatCard
          icon={FileText}
          title="Demand notice"
          value={demandTotal}
          description={`${share(demandTotal)}% of cases for ${scopeLabel} · still inside the 60-day window`}
          className="notice-card notice-demand"
        />

        <StatCard
          icon={Gavel}
          title="Possession notice"
          value={possessionTotal}
          description={`${share(possessionTotal)}% of cases for ${scopeLabel} · moved on to possession`}
          className="notice-card notice-possession"
        />
      </section>

      <section className="dashboard-two-column">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Cases by Bank</h2>
              <p>Click a bar to filter the page</p>
            </div>
            <span className="count-chip">{byBank.length} lenders</span>
          </div>

          <div className="panel-chart">
            <ChartShell
              title="Case count per bank"
              caption={
                showAllBanks
                  ? "Every lender with a live case"
                  : `Top ${TOP} by case count`
              }
              columns={["Bank", "Cases"]}
              rows={bankShown.map((b) => [b.label, String(b.value)])}
            >
              <BarChart
                data={bankShown}
                labelWidth={152}
                selected={bank}
                onSelect={setBank}
              />
            </ChartShell>

            <MoreButton
              shown={showAllBanks}
              total={byBank.length}
              cap={TOP}
              noun="banks"
              onToggle={() => setShowAllBanks((v) => !v)}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Cases by Property Type</h2>
              <p>What secures each case, for {scopeLabel}</p>
            </div>
            <span className="count-chip">{scoped.length} cases</span>
          </div>

          <div className="panel-chart">
            <ChartShell
              title="Case count per property type"
              caption="Longer bar = more cases of that type"
              columns={["Property type", "Cases"]}
              rows={byProperty.map((p) => [p.label, String(p.value)])}
            >
              <BarChart data={byProperty} labelWidth={140} />
            </ChartShell>
          </div>
        </div>
      </section>
    </>
  );
}
