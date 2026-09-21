import { CHART } from "./chartTokens";
import { Tooltip, TooltipRow } from "./ChartShell";
import { useHover } from "./useHover";

/**
 * Horizontal bars for comparing magnitude across nominal categories.
 *
 * One hue for every bar. Colouring each bar darker-where-bigger would
 * double-encode length as lightness and spend the only free channel restating
 * what the bar already says, so banks and property types all wear slot 1.
 *
 * Each bar carries its value at the tip, which keeps the chart readable without
 * hover and satisfies the relief rule for the lighter fills.
 */
export default function BarChart({
  data = [],
  color = CHART.series,
  formatValue = (v) => String(v),
  labelWidth = 116,
}) {
  const { hover, show, hide } = useHover();

  if (data.length === 0) {
    return <p className="chart-empty">Nothing to plot.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 0);

  return (
    <div className="bar-chart">
      {data.map((item, i) => {
        const share = max > 0 ? (item.value / max) * 100 : 0;

        return (
          <button
            type="button"
            key={item.key ?? item.label}
            className="bar-row"
            style={{ gridTemplateColumns: `${labelWidth}px 1fr auto` }}
            aria-label={`${item.label}: ${formatValue(item.value)}`}
            onMouseEnter={(e) => show(i, e)}
            onMouseLeave={hide}
            onFocus={(e) => show(i, e)}
            onBlur={hide}
          >
            <span className="bar-label">{item.label}</span>

            <span className="bar-track">
              <span
                className="bar-fill"
                style={{
                  width: `${share}%`,
                  background: color,
                  opacity: hover && hover.index !== i ? 0.55 : 1,
                }}
              />
            </span>

            <strong className="bar-value">{formatValue(item.value)}</strong>
          </button>
        );
      })}

      <Tooltip hover={hover}>
        {hover && data[hover.index] && (
          <TooltipRow
            color={color}
            label={data[hover.index].label}
            value={formatValue(data[hover.index].value)}
          />
        )}
      </Tooltip>
    </div>
  );
}
