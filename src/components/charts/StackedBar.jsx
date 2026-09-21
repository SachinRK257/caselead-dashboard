import { Tooltip, TooltipRow } from "./ChartShell";
import { useHover } from "./useHover";

/**
 * Part-to-whole across a handful of classes.
 *
 * Built from flex children rather than a stretched SVG viewBox: the 2px surface
 * gap between touching fills has to be exactly 2px on screen, and a
 * `preserveAspectRatio="none"` viewBox distorts any width expressed in user
 * units. The rounded outer ends come from the track clipping its children, so
 * interior joins stay square.
 *
 * Every segment's value is printed in the legend, so no value is gated behind
 * the tooltip.
 */
export default function StackedBar({ segments = [], onSelect, selected }) {
  const { hover, show, hide } = useHover();

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);

  // A selection only counts if it names one of these segments; panel filters
  // like "Open Visits" span several statuses and must not dim everything.
  const hasSelection = segments.some((s) => s.key === selected);

  if (total === 0) {
    return <p className="chart-empty">No cases to plot.</p>;
  }

  return (
    <div className="stacked-bar">
      <div
        className="stacked-track"
        role="img"
        aria-label={`Distribution across ${visible.length} categories, ${total} cases total`}
      >
        {visible.map((segment, i) => {
          // Dim only when something else is selected, so the selection reads
          // as the subject and the rest as context.
          const dimmed =
            (hover && hover.index !== i) ||
            (hasSelection && selected !== segment.key);

          return (
            <button
              type="button"
              key={segment.key}
              className="stacked-segment"
              style={{
                flexGrow: segment.value,
                background: segment.color,
                opacity: dimmed ? 0.4 : 1,
                cursor: onSelect ? "pointer" : "default",
              }}
              aria-label={`${segment.label}: ${segment.value} of ${total} cases${
                onSelect ? ". Select to filter" : ""
              }`}
              aria-pressed={onSelect ? selected === segment.key : undefined}
              onClick={
                onSelect
                  ? () =>
                      onSelect(selected === segment.key ? "ALL" : segment.key)
                  : undefined
              }
              onMouseEnter={(e) => show(i, e)}
              onMouseLeave={hide}
              onFocus={(e) => show(i, e)}
              onBlur={hide}
            />
          );
        })}
      </div>

      <Tooltip hover={hover}>
        {hover && visible[hover.index] && (
          <TooltipRow
            color={visible[hover.index].color}
            label={visible[hover.index].label}
            value={`${visible[hover.index].value} of ${total}`}
          />
        )}
      </Tooltip>

      {/* The legend is the direct-label channel: identity plus the value. */}
      <ul className="chart-legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span
              className="chart-swatch"
              style={{ background: segment.color }}
            />
            <span className="chart-legend-label">{segment.label}</span>
            <strong>{segment.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
