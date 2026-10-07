import { useMemo, useState } from "react";
import { Building2, MapPin, X } from "lucide-react";

import AgeingCases from "../components/AgeingCases";
import LenderPanel from "../components/LenderPanel";
import NoticeCases from "../components/NoticeCases";
import Pagination from "../components/Pagination";
import TopLiabilityCases from "../components/TopLiabilityCases";
import ScopeFilter from "../components/ScopeFilter";
import StatCard from "../components/StatCard";
import BarChart from "../components/charts/BarChart";
import LineChart from "../components/charts/LineChart";
import { ChartShell } from "../components/charts/ChartShell";
import { humanizeEnum } from "../utils/format";
import { NOTICE_SERIES_COLORS } from "../components/charts/chartTokens";
import {
  ACTIVE_CASE_STATUSES,
  buildAgeingCases,
  buildBankCounts,
  buildCityPanel,
  buildNoticeStage,
  getNoticeStage,
  NOTICE_STAGE,
  buildPanelCounts,
  buildPropertyMix,
  buildNoticeSeries,
  NOTICE_BUCKET,
  buildStatusPanel,
  buildTopLiability,
  buildLenderPanel,
  EMPANELMENT,
  EMPANELMENT_STATE,
  getOwnerForCity,
  summariseLenderPanel,
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

/* Enough to be a morning's worth of chasing; a longer list stops being a
   worklist and starts being the case register, which has its own page. */
const AGEING_ROWS = 10;

const LIABILITY_ROWS = 10;

// The table is a lookup, not a reading list; ten rows is enough to recognise
// what a filter caught before deciding to open the rest.
/* The five stages the dashboard reports. Every case carries exactly one, so
   these are counts of one population rather than overlapping tallies. */
/* Ten rows a page, matching the capped tables above it. */
const PER_PAGE = 10;

/* What each notice card opens, read off the same helper that produced the
   count - so the figure on the card and the rows under it cannot disagree. */
const NOTICE_FOCUS = {
  DEMAND: {
    label: "Demand notice",
    note: "served, still inside the 60-day window",
  },
  POSSESSION: {
    label: "Possession notice",
    note: "moved on to possession",
  },
};

const STATUS_CARDS = [
  { key: "ALLOTTED", label: "Allocated" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "NOT_ALLOTTED", label: "Not allotted" },
  { key: "FOLLOWING_UP", label: "Follow-up" },
  { key: "ACCOUNT_UPGRADED", label: "Account upgraded" },
];

/* Weekly by default: this book serves nought to six notices on any given day,
   so the daily line is a row of spikes between zeros - true, but shapeless.
   Daily is still there for the raw grain. */
const BUCKETS = [
  { key: "DAY", label: "Daily", unit: "day", window: "the last 30 days" },
  { key: "WEEK", label: "Weekly", unit: "week", window: "the last 12 weeks" },
  {
    key: "MONTH",
    label: "Monthly",
    unit: "month",
    window: "every month on record",
  },
];

/* Total last, so it draws over the three below it rather than under them - it
   is the sum of the first two and sits highest on every point, and Verified is
   a subset of Demand, so either would otherwise be hidden by the line above. */
const NOTICE_LINES = [
  { key: "DEMAND", label: "Demand notice", color: NOTICE_SERIES_COLORS.DEMAND },
  {
    key: "POSSESSION",
    label: "Possession notice",
    color: NOTICE_SERIES_COLORS.POSSESSION,
  },
  {
    key: "VERIFIED",
    label: "Verified",
    color: NOTICE_SERIES_COLORS.VERIFIED,
  },
  { key: "TOTAL", label: "Total notices", color: NOTICE_SERIES_COLORS.TOTAL },
];

export default function Dashboard({ cases = [], today }) {
  const [bank, setBank] = useState(null);
  const [showAllBanks, setShowAllBanks] = useState(false);

  // One scope for the whole strip, narrowed by lender and by city. The two
  // notice stages are halves of the same book, so letting them drift apart
  // would break the reading that the pair adds up to the cases in scope -
  // allocation and the city caseload count that same population.
  const [noticeBank, setNoticeBank] = useState(null);
  const [noticeCity, setNoticeCity] = useState(null);

  const hasFilters = Boolean(noticeBank || noticeCity);

  function clearFilters() {
    setNoticeBank(null);
    setNoticeCity(null);
  }
  const [noticeFocus, setNoticeFocus] = useState(null);
  const [noticePage, setNoticePage] = useState(1);
  const [empanelment, setEmpanelment] = useState(EMPANELMENT.ALL);
  const [bucket, setBucket] = useState(NOTICE_BUCKET.WEEK);

  const byBank = useMemo(() => buildBankCounts(cases), [cases]);
  const panel = useMemo(() => buildPanelCounts(cases), [cases]);
  const cityPanel = useMemo(() => buildCityPanel(cases), [cases]);

  const noticeSeries = useMemo(
    () => buildNoticeSeries(cases, bucket),
    [cases, bucket]
  );

  const bucketMeta = BUCKETS.find((b) => b.key === bucket) ?? BUCKETS[1];

  const seriesTotals = useMemo(
    () =>
      noticeSeries.reduce(
        (sum, point) => ({
          DEMAND: sum.DEMAND + point.values.DEMAND,
          POSSESSION: sum.POSSESSION + point.values.POSSESSION,
          TOTAL: sum.TOTAL + point.values.TOTAL,
        }),
        { DEMAND: 0, POSSESSION: 0, TOTAL: 0 }
      ),
    [noticeSeries]
  );

  // The lender panel is the whole book, not the filtered scope: it answers who
  // we are cleared to work with, which does not move with a case filter.
  const lenders = useMemo(() => buildLenderPanel(cases), [cases]);
  const lenderSummary = useMemo(() => summariseLenderPanel(lenders), [lenders]);
  const lenderRows = useMemo(() => {
    // "Active" holds the ones expiring soon too - they are still live cover,
    // and hiding them here would make the count disagree with the segment.
    if (empanelment === EMPANELMENT.ACTIVE)
      return lenders.filter(
        (l) =>
          l.state === EMPANELMENT_STATE.ACTIVE ||
          l.state === EMPANELMENT_STATE.EXPIRING
      );
    if (empanelment === EMPANELMENT.EXPIRED)
      return lenders.filter((l) => l.state === EMPANELMENT_STATE.EXPIRED);
    if (empanelment === EMPANELMENT.NO_LETTER)
      return lenders.filter((l) => l.state === EMPANELMENT_STATE.NONE);
    return lenders;
  }, [lenders, empanelment]);

  // The bank chart shows the whole book so the filter has something to pick
  // from; the property chart narrows to the selection.
  const scoped = useMemo(
    () => (bank ? cases.filter((c) => c.bank === bank) : cases),
    [cases, bank]
  );

  const byProperty = useMemo(() => buildPropertyMix(scoped), [scoped]);

  // Lender and city only. The status cards are the breakdown the status
  // filter picks from, so narrowing by status here would leave four of the
  // five reading zero the moment anyone used it.
  const placeScope = useMemo(
    () =>
      cases.filter(
        (c) =>
          (!noticeBank || c.bank === noticeBank) &&
          (!noticeCity || c.city === noticeCity)
      ),
    [cases, noticeBank, noticeCity]
  );

  // Nothing narrows the strip beyond the place filters any more, so the two
  // scopes are the same list - kept named apart because the cards and the
  // status counts are still two different readings of it.
  const noticeScope = placeScope;

  const notices = useMemo(() => buildNoticeStage(noticeScope), [noticeScope]);

  // Same scope the cards count, so the filters above govern the list too.
  const noticeRows = useMemo(
    () =>
      noticeFocus
        ? noticeScope.filter(
            (item) => getNoticeStage(item) === NOTICE_STAGE[noticeFocus]
          )
        : [],
    [noticeScope, noticeFocus]
  );

  const noticePages = Math.max(1, Math.ceil(noticeRows.length / PER_PAGE));

  // Clamped rather than reset: narrowing a filter can shorten the list under
  // the reader, and page 7 of 3 would otherwise show an empty table.
  const safePage = Math.min(noticePage, noticePages);
  const pagedNotices = noticeRows.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  function pickNotice(key) {
    setNoticeFocus((current) => (current === key ? null : key));
    setNoticePage(1);
  }

  const ageing = useMemo(
    () => buildAgeingCases(placeScope, today, AGEING_ROWS),
    [placeScope, today]
  );

  const topLiability = useMemo(
    () => buildTopLiability(placeScope, LIABILITY_ROWS),
    [placeScope]
  );

  // This book has 26 distinct amounts across 188 cases, so the cut-off almost
  // always lands inside a tie. Saying how many equally large cases the list
  // leaves out is cheaper than letting someone assume there were none.
  const tiedBelowCut = useMemo(() => {
    const cutoff = topLiability[topLiability.length - 1]?.liability;
    if (cutoff === undefined || placeScope.length <= LIABILITY_ROWS) return 0;

    const shown = topLiability.filter((c) => c.liability === cutoff).length;
    return placeScope.filter((c) => c.liability === cutoff).length - shown;
  }, [placeScope, topLiability]);

  const statusCounts = useMemo(() => {
    const counts = buildStatusPanel(placeScope);
    return Object.fromEntries(counts.map((row) => [row.key, row.value]));
  }, [placeScope]);

  const bankShown = showAllBanks ? byBank : byBank.slice(0, TOP);

  // Every figure in the strip has to describe the same population, or
  // "Cases 22" sitting beside "Lenders 29" invites reading them together.
  const scopedLenders = bank ? 1 : byBank.length;

  const scopeLabel = bank ?? "all banks";

  // Each salesperson owns one city, so a city pick is also a person pick -
  // and that is the more useful thing to print beside the count.
  const cityOwner = getOwnerForCity(noticeCity);

  // "not contacted, contacted or following up", built from the same list the
  // query uses so the heading cannot drift from what is actually shown.
  const activeStageLabel = ACTIVE_CASE_STATUSES.map((key) =>
    humanizeEnum(key).toLowerCase()
  )
    .join(", ")
    .replace(/, ([^,]*)$/, " or $1");

  const placeLabel =
    [noticeBank, noticeCity].filter(Boolean).join(" · ") ||
    "all banks and cities";

  const noticeLabel = placeLabel;

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

            {hasFilters && (
              <button
                type="button"
                className="scope-clear filters-clear"
                onClick={clearFilters}
              >
                <X size={13} aria-hidden="true" />
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="notice-cards">
          <StatCard
            title={noticeCity ? `Cases in ${noticeCity}` : "Cases in scope"}
            value={noticeScope.length}
            description={
              cityOwner
                ? `${cityOwner.name} covers ${noticeCity} · ${cityOwner.region}`
                : noticeLabel
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
            active={noticeFocus === "DEMAND"}
            onClick={() => pickNotice("DEMAND")}
          />

          <StatCard
            title="Possession notice"
            value={notices.POSSESSION}
            description={`${percent(
              notices.POSSESSION,
              noticeScope.length
            )}% of ${noticeScope.length} cases · moved on to possession`}
            className="notice-card notice-possession"
            active={noticeFocus === "POSSESSION"}
            onClick={() => pickNotice("POSSESSION")}
          />
        </div>
      </section>

      {noticeFocus && (
        <div className="panel full-panel">
          <div className="panel-header">
            <div>
              <h2>{NOTICE_FOCUS[noticeFocus].label} cases</h2>
              <p>
                {noticeRows.length} {NOTICE_FOCUS[noticeFocus].note}, for{" "}
                {placeLabel}
              </p>
            </div>

            <button
              type="button"
              className="scope-clear"
              onClick={() => pickNotice(noticeFocus)}
            >
              <X size={13} aria-hidden="true" />
              Close
            </button>
          </div>

          <NoticeCases cases={pagedNotices} />

          <Pagination
            page={safePage}
            pageCount={noticePages}
            total={noticeRows.length}
            perPage={PER_PAGE}
            onPage={setNoticePage}
          />
        </div>
      )}

      {/* Counts, not cases: the case list itself lives on the Case Lead page,
          and this is the dashboard's summary of it. */}
      <section className="notice-strip" aria-labelledby="status-heading">
        <div className="notice-head">
          <div>
            <h2 id="status-heading">Case Status</h2>
            <p>
              Where the {placeScope.length} cases for {placeLabel} stand
            </p>
          </div>
        </div>

        <div className="status-cards">
          {STATUS_CARDS.map((card) => (
            <StatCard
              key={card.key}
              title={card.label}
              value={statusCounts[card.key] ?? 0}
              description={`${percent(
                statusCounts[card.key] ?? 0,
                placeScope.length
              )}% of ${placeScope.length} cases`}
              className="notice-card"
            />
          ))}
        </div>
      </section>

      <div className="panel full-panel">
        <div className="panel-header">
          <div>
            <h2>Notices Served</h2>
            <p>Counted on the day each notice went out</p>
          </div>

          <div className="segmented" role="group" aria-label="Chart grouping">
            {BUCKETS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`segment ${bucket === option.key ? "is-active" : ""}`}
                aria-pressed={bucket === option.key}
                onClick={() => setBucket(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-chart">
          <ChartShell
            title={`Notices per ${bucketMeta.unit}`}
            caption={`${seriesTotals.DEMAND} demand · ${seriesTotals.POSSESSION} possession · ${seriesTotals.TOTAL} in total across ${bucketMeta.window}`}
            columns={[
              bucketMeta.label === "Monthly" ? "Month" : "Starting",
              "Demand",
              "Possession",
              "Verified",
              "Total",
            ]}
            rows={noticeSeries.map((point) => [
              point.label,
              String(point.values.DEMAND),
              String(point.values.POSSESSION),
              String(point.values.VERIFIED),
              String(point.values.TOTAL),
            ])}
          >
            <LineChart
              points={noticeSeries}
              series={NOTICE_LINES}
              markers={bucket === NOTICE_BUCKET.DAY}
            />
          </ChartShell>
        </div>
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

      <div className="panel full-panel">
        <div className="panel-header">
          <div>
            <h2>Longest Open Cases</h2>
            <p>
              Still {activeStageLabel} — oldest first, counted from the demand
              notice, for {placeLabel}
            </p>
          </div>
          <span className="count-chip">top {AGEING_ROWS}</span>
        </div>

        <AgeingCases cases={ageing} />
      </div>

      <div className="panel full-panel">
        <div className="panel-header">
          <div>
            <h2>Highest Liability Cases</h2>
            <p>
              Largest amounts outstanding and how far each has been taken, for{" "}
              {placeLabel}
              {tiedBelowCut > 0 &&
                ` — ${tiedBelowCut} more case${
                  tiedBelowCut === 1 ? "" : "s"
                } at the same amount not shown`}
            </p>
          </div>
          <span className="count-chip">top {LIABILITY_ROWS}</span>
        </div>

        <TopLiabilityCases cases={topLiability} />
      </div>

      <LenderPanel
        rows={lenderRows}
        summary={lenderSummary}
        filter={empanelment}
        onFilter={setEmpanelment}
      />
    </>
  );
}
