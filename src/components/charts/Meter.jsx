import { CHART } from "./chartTokens";

/**
 * A single ratio against its whole.
 *
 * Two classes are a meter, not a two-slice pie. The unfilled track is a lighter
 * step of the fill's own ramp so the state reads across the whole bar, and both
 * sides are labelled with their counts.
 */
export default function Meter({
  value = 0,
  total = 0,
  fillLabel,
  restLabel,
  fill = CHART.series,
  track = CHART.trackSoft,
}) {
  if (total === 0) {
    return <p className="chart-empty">No cases to plot.</p>;
  }

  const pct = Math.round((value / total) * 100);
  const rest = total - value;

  return (
    <div className="meter">
      <div className="meter-figure">
        <strong>{pct}%</strong>
        <span>{fillLabel}</span>
      </div>

      <div
        className="meter-track"
        style={{ background: track }}
        role="img"
        aria-label={`${value} of ${total} ${fillLabel} (${pct} percent)`}
      >
        <div
          className="meter-fill"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>

      <div className="meter-legend">
        <span>
          <span className="chart-swatch" style={{ background: fill }} />
          {fillLabel} <strong>{value}</strong>
        </span>
        <span>
          <span className="chart-swatch" style={{ background: track }} />
          {restLabel} <strong>{rest}</strong>
        </span>
      </div>
    </div>
  );
}
