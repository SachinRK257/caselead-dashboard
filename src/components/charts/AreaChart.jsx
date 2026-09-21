import { useEffect, useRef, useState } from "react";

import { CHART, MARK, linePath } from "./chartTokens";

const HEIGHT = 190;
const PAD = { top: 16, right: 18, bottom: 28, left: 34 };

/** Measure the host so strokes stay 2px instead of being scaled by a viewBox. */
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    observer.observe(node);
    setWidth(node.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/** Clean axis ticks: 0, 2, 4 rather than 0, 1.67, 3.33. */
function niceTicks(max, count = 3) {
  if (max <= 0) return [0, 1];

  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.max(1, Math.ceil(raw / mag) * mag);
  const top = Math.ceil(max / step) * step;

  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return ticks;
}

/**
 * Trend over time, single series.
 *
 * One series means no legend box: the title already names what is plotted. The
 * crosshair snaps to the nearest month so the reader aims at a period rather
 * than at a 2px line, and the endpoint plus the peak are direct-labelled so the
 * shape is readable without hovering.
 */
export default function AreaChart({ points = [], valueLabel = "cases" }) {
  const [hostRef, width] = useWidth();
  const [active, setActive] = useState(null);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const max = Math.max(...points.map((p) => p.value), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;

  const xAt = (i) =>
    PAD.left +
    (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);

  const yAt = (v) => PAD.top + plotH - (v / top) * plotH;

  // The crosshair snaps to the nearest month, so the reader aims at a period
  // rather than at a 2px line.
  function handleMove(event) {
    if (points.length === 0 || plotW <= 0) return;

    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left - PAD.left) / plotW;
    const index = Math.round(ratio * (points.length - 1));

    setActive(Math.max(0, Math.min(points.length - 1, index)));
  }

  if (points.length === 0) {
    return <p className="chart-empty">No dated cases to plot.</p>;
  }

  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.value) }));
  const line = linePath(coords);
  const area =
    width > 0
      ? `${line}L${coords[coords.length - 1].x},${PAD.top + plotH}L${coords[0].x},${PAD.top + plotH}z`
      : "";

  const peakIndex = points.reduce(
    (best, p, i) => (p.value > points[best].value ? i : best),
    0
  );
  const lastIndex = points.length - 1;
  const labelled = new Set([peakIndex, lastIndex]);

  return (
    <div className="area-chart" ref={hostRef}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Trend of ${valueLabel} across ${points.length} periods`}
          onMouseMove={handleMove}
          onMouseLeave={() => setActive(null)}
        >
          {/* Recessive hairline grid, solid - never dashed. */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={yAt(t)}
                y2={yAt(t)}
                stroke={t === 0 ? CHART.axis : CHART.grid}
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={yAt(t) + 4}
                textAnchor="end"
                className="chart-tick"
              >
                {t}
              </text>
            </g>
          ))}

          <path d={area} fill={CHART.seriesWash} />
          <path
            d={line}
            fill="none"
            stroke={CHART.series}
            strokeWidth={MARK.lineWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {active !== null && (
            <line
              x1={xAt(active)}
              x2={xAt(active)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke={CHART.axis}
              strokeWidth="1"
            />
          )}

          {points.map((p, i) => {
            const isActive = active === i;
            const isLabelled = labelled.has(i);
            if (!isActive && !isLabelled) return null;

            return (
              <circle
                key={p.label}
                cx={xAt(i)}
                cy={yAt(p.value)}
                r={MARK.markerRadius}
                fill={CHART.series}
                stroke={CHART.surface}
                strokeWidth="2"
              />
            );
          })}

          {/* Direct labels, sparingly: the peak and the latest period. */}
          {[...labelled].map((i) => (
            <text
              key={`label-${i}`}
              x={xAt(i)}
              y={yAt(points[i].value) - 12}
              textAnchor={i === lastIndex && i !== 0 ? "end" : "middle"}
              className="chart-point-label"
            >
              {points[i].value}
            </text>
          ))}

          {points.map((p, i) => (
            <text
              key={`x-${p.label}`}
              x={xAt(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="chart-tick"
            >
              {p.label}
            </text>
          ))}
        </svg>
      )}

      {active !== null && (
        <div
          className="chart-tooltip"
          aria-hidden="true"
          style={{ left: `${xAt(active)}px`, top: `${yAt(points[active].value) - 6}px` }}
        >
          <div className="chart-tooltip-row">
            <span className="chart-key" style={{ background: CHART.series }} />
            <strong>{points[active].value}</strong>
            <span>{points[active].label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
