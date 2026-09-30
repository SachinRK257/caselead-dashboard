import { useMemo, useState } from "react";
import { Building2, CircleDot, MapPin, X } from "lucide-react";

import CaseTable from "../components/CaseTable";
import ScopeFilter from "../components/ScopeFilter";
import StatCard from "../components/StatCard";
import BarChart from "../components/charts/BarChart";
import { ChartShell } from "../components/charts/ChartShell";
import {
  buildAllocationMix,
  buildBankCounts,
  buildCityPanel,
  buildNoticeStage,
  buildPanelCounts,
  buildPropertyMix,
  buildStatusPanel,
  getOwnerForCity,
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

/** Whole number percentage; a zero-case scope is 0%, not NaN%. */
function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

// 32 lenders is too long a chart to scan; the rest are one click away.
const TOP = 5;

// The table is a lookup, not a reading list; ten rows is enough to recognise
// what a filter caught before deciding to open the rest.
const CASE_ROWS = 10;

export default function Dashboard({ cases = [] }) {
  const [bank, setBank] = useState(null);
  const [showAllBanks, setShowAllBanks] = useState(false);

  // One scope for the whole strip, narrowed by lender and by city. The two
  // notice stages are halves of the same book, so letting them drift apart
  // would break the reading that the pair adds up to the cases in scope -
  // allocation and the city caseload count that same population.
  const [noticeBank, setNoticeBank] = useState(null);
  const [noticeCity, setNoticeCity] = useState(null);
  const [noticeStatus, setNoticeStatus] = useState(null);
  const [showAllCases, setShowAllCases] = useState(false);

  const byBank = useMemo(() => buildBankCounts(cases), [cases]);
  const panel = useMemo(() => buildPanelCounts(cases), [cases]);
  const cityPanel = useMemo(() => buildCityPanel(cases), [cases]);
  const statusPanel = useMemo(() => buildStatusPanel(cases), [cases]);

  // The bank chart shows the whole book so the filter has something to pick
  // from; the property chart narrows to the selection.
  const scoped = useMemo(
    () => (bank ? cases.filter((c) => c.bank === bank) : cases),
    [cases, bank]
  );

  const byProperty = useMemo(() => buildPropertyMix(scoped), [scoped]);

  const noticeScope = useMemo(
    () =>
      cases.filter(
        (c) =>
          (!noticeBank || c.bank === noticeBank) &&
          (!noticeCity || c.city === noticeCity) &&
          (!noticeStatus || c.caseStatus === noticeStatus)
      ),
    [cases, noticeBank, noticeCity, noticeStatus]
  );
  const notices = useMemo(() => buildNoticeStage(noticeScope), [noticeScope]);
  const allocation = useMemo(() => buildAllocationMix(noticeScope), [noticeScope]);

  const bankShown = showAllBanks ? byBank : byBank.slice(0, TOP);

  // Every figure in the strip has to describe the same population, or
  // "Cases 22" sitting beside "Lenders 29" invites reading them together.
  const scopedLenders = bank ? 1 : byBank.length;

  const scopeLabel = bank ?? "all banks";

  // Each salesperson owns one city, so a city pick is also a person pick -
  // and that is the more useful thing to print beside the count.
  const cityOwner = getOwnerForCity(noticeCity);

  const statusLabel =
    statusPanel.find((option) => option.key === noticeStatus)?.label ?? null;

  const noticeLabel = [
    [noticeBank, noticeCity].filter(Boolean).join(" in ") ||
      "all banks and cities",
    statusLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  // The table is the only place the whole book would be listed, so it opens
  // capped; the count in the header says what is being held back.
  const caseRows = showAllCases
    ? noticeScope
    : noticeScope.slice(0, CASE_ROWS);

  return (
    <>
      {/* Reports the scope the charts are under rather than setting it: the
          charts are scoped by clicking a bar. */}
      <div className="dashboard-toolbar">
        <p className="scope-note">
          Showing <strong>{scopeLabel}</strong>
          {bank && (
            <button
              type="button"
              className="scope-clear"
              onClick={() => setBank(null)}
            >
              <X size={13} aria-hidden="true" />
              Clear
            </button>
          )}
        </p>

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

      {/* Counts, not distributions, so the strip leads the page as cards
          rather than a chart. One filter governs all three. */}
      <section className="notice-strip" aria-labelledby="notices-heading">
        <div className="notice-head">
          <div>
            <h2 id="notices-heading">Notices &amp; Allocation</h2>
            <p>Where each case stands, for {noticeLabel}</p>
          </div>

          <div className="notice-filters">
            <ScopeFilter
              options={panel}
              value={noticeBank}
              onChange={setNoticeBank}
              total={cases.length}
              noun="Bank"
              allLabel="All banks"
              icon={Building2}
            />

            <ScopeFilter
              options={cityPanel}
              value={noticeCity}
              onChange={setNoticeCity}
              total={cases.length}
              noun="City"
              allLabel="All cities"
              icon={MapPin}
            />

            <ScopeFilter
              options={statusPanel}
              value={noticeStatus}
              onChange={setNoticeStatus}
              total={cases.length}
              noun="Status"
              allLabel="All"
              icon={CircleDot}
            />
          </div>
        </div>

        <div className="notice-cards">
          <StatCard
            title={noticeCity ? `Cases in ${noticeCity}` : "Cases in scope"}
            value={noticeScope.length}
            description={
              cityOwner
                ? `${cityOwner.name} covers ${noticeCity} · ${cityOwner.region}`
                : `across all ${cityPanel.length} cities the team covers`
            }
            className="notice-card notice-caseload"
          />

          <StatCard
            title="Demand notice"
            value={notices.DEMAND}
            description={`${percent(notices.DEMAND, noticeScope.length)}% of ${
              noticeScope.length
            } cases · still inside the 60-day window`}
            className="notice-card notice-demand"
          />

          <StatCard
            title="Possession notice"
            value={notices.POSSESSION}
            description={`${percent(
              notices.POSSESSION,
              noticeScope.length
            )}% of ${noticeScope.length} cases · moved on to possession`}
            className="notice-card notice-possession"
          />

          {/* Left in the default ink: the two stages are a matched pair and
              wear the colour, so a third accent here would imply allocation
              belongs to the same sequence. */}
          <StatCard
            title="Allocated cases"
            value={allocation.ALLOCATED}
            description={`${percent(
              allocation.ALLOCATED,
              noticeScope.length
            )}% of ${noticeScope.length} cases · ${
              allocation.NOT_ALLOCATED
            } still waiting on an owner`}
            className="notice-card"
          />
        </div>
      </section>

      <div className="panel full-panel">
        <div className="panel-header">
          <div>
            <h2>Matching Cases</h2>
            <p>Every case in the filters above, for {noticeLabel}</p>
          </div>
          <span className="count-chip">{noticeScope.length} cases</span>
        </div>

        <CaseTable cases={caseRows} />

        <MoreButton
          shown={showAllCases}
          total={noticeScope.length}
          cap={CASE_ROWS}
          noun="cases"
          onToggle={() => setShowAllCases((v) => !v)}
        />
      </div>

      <section className="dashboard-charts">
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
