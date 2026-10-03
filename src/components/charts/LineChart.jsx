import { useCallback, useEffect, useRef, useState } from "react";

import { CHART, MARK, smoothPath } from "./chartTokens";

const HEIGHT = 270;
const PAD = { top: 20, right: 12, bottom: 30, left: 8 };

/** The y axis sits outside the scroller, so it needs its own gutter. */
const AXIS_W = 40;

/**
 * Least horizontal room a bucket may have.
 *
 * Below this the labels collide and the curve turns into a scribble, so the
 * plot grows past its container instead of compressing, and the overflow is
 * scrolled. Twelve buckets still fit a normal panel; thirty do not, which is
 * exactly when the scrolling starts.
 */
const MIN_STEP = 56;

/** Measure the scroll viewport so strokes stay 2px rather than being scaled. */
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

/** Clean axis ticks: 0, 5, 10 rather than 0, 4.13, 8.26. */
function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1];

  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.max(1, Math.ceil(raw / mag) * mag);
  const ceiling = Math.ceil(max / step) * step;

  const ticks = [];
  for (let v = 0; v <= ceiling; v += step) ticks.push(v);
  return ticks;
}

/**
 * Axis labels. Once every bucket has MIN_STEP of room they all get a label -
 * the plot widens rather than crowding them - so this only thins them out on
 * the rare axis wide enough to fit the points but not their text.
 */
function labelIndices(count, step) {
  if (step >= 48 || count <= 14) return [...Array(count).keys()];

  const every = Math.ceil(48 / Math.max(step, 1));
  const indices = [];
  for (let i = 0; i < count; i += every) indices.push(i);
  if (indices[indices.length - 1] !== count - 1) indices.push(count - 1);

  return indices;
}

/**
 * Several series over one time axis, as lines.
 *
 * The lines are drawn in the order given and the last one lands on top, so a
 * derived series - a total, say - goes last and is never hidden under the
 * parts it is made of.
 *
 * When the buckets outgrow the panel the plot scrolls sideways and can be
 * dragged, but the y axis is a separate layer that stays put: a chart you can
 * pan is no use if the scale slides off with it.
 */
export default function LineChart({ points = [], series = [] }) {
  const [scrollRef, viewport] = useWidth();
  const [active, setActive] = useState(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Held in a ref, not state: it changes on every mousemove and nothing about
  // the render depends on it until the drag actually moves something.
  const drag = useRef(null);

  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const max = points.reduce(
    (best, p) => Math.max(best, ...series.map((s) => p.values[s.key] ?? 0)),
    0
  );
  const ticks = niceTicks(max);
  const ceiling = ticks[ticks.length - 1] || 1;

  // Grow past the viewport rather than squeezing the buckets together.
  const contentW = Math.max(viewport, points.length * MIN_STEP);
  const plotW = Math.max(0, contentW - PAD.left - PAD.right);
  const step = points.length > 1 ? plotW / (points.length - 1) : plotW;

  const xAt = (i) =>
    PAD.left + (points.length <= 1 ? plotW / 2 : i * step);

  const yAt = (v) => PAD.top + plotH - (v / ceiling) * plotH;

  const stopDrag = useCallback(() => {
    drag.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;

    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [dragging, stopDrag]);

  // Touch and trackpad already pan the scroller natively; this is the mouse
  // equivalent, and grabbing it should not also leave text selected.
  function handlePointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    drag.current = {
      x: event.clientX,
      from: scrollRef.current.scrollLeft,
      moved: false,
    };
    setDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event) {
    const state = drag.current;

    if (state) {
      const dx = event.clientX - state.x;
      if (Math.abs(dx) > 3) state.moved = true;
      scrollRef.current.scrollLeft = state.from - dx;
      return;
    }

    if (points.length === 0 || plotW <= 0) return;

    // Snap the crosshair to the nearest bucket.
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.round(
      (event.clientX - box.left + scrollRef.current.scrollLeft - PAD.left) /
        (step || 1)
    );

    setActive(Math.max(0, Math.min(points.length - 1, index)));
  }

  function handleLeave() {
    if (!drag.current) setActive(null);
  }

  if (points.length === 0) {
    return <p className="chart-empty">No dated notices to plot.</p>;
  }

  const xLabels = labelIndices(points.length, step);
  const scrollable = contentW > viewport + 1;

  // Where the crosshair sits once the plot has been panned. Off the left or
  // right edge means the tooltip would point at nothing, so it is dropped.
  const tipX = active === null ? 0 : AXIS_W + xAt(active) - scrollLeft;
  const tipVisible =
    active !== null && tipX >= AXIS_W - 1 && tipX <= AXIS_W + viewport + 1;

  return (
    <div className="line-chart">
      <ul className="chart-legend">
        {series.map((s) => (
          <li key={s.key}>
            <span
              className="chart-key chart-key-dot"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            {s.label}
          </li>
        ))}

        {scrollable && (
          <li className="chart-legend-note">drag to pan</li>
        )}
      </ul>

      <div className="chart-plot" style={{ height: `${HEIGHT}px` }}>
        {/* Fixed gutter. Only the tick values live here; the rules themselves
            belong to the plot and scroll with it. */}
        <svg
          className="chart-axis"
          width={AXIS_W}
          height={HEIGHT}
          aria-hidden="true"
        >
          {ticks.map((t) => (
            <text
              key={t}
              x={AXIS_W - 8}
              y={yAt(t) + 4}
              textAnchor="end"
              className="chart-tick"
            >
              {t}
            </text>
          ))}
        </svg>

        <div
          className={`chart-scroll ${dragging ? "is-dragging" : ""}`}
          ref={scrollRef}
          onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handleLeave}
        >
          {viewport > 0 && (
            <svg
              width={contentW}
              height={HEIGHT}
              role="img"
              aria-label={`${series
                .map((s) => s.label)
                .join(", ")} across ${points.length} periods`}
            >
              {/* Dashed rules: three lines cross each other here, and a dashed
                  grid stays behind them instead of reading as a fourth flat
                  series. */}
              {ticks.map((t) => (
                <line
                  key={t}
                  x1="0"
                  x2={contentW}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke={t === 0 ? CHART.axis : CHART.grid}
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
              ))}


              {series.map((s) => (
                <path
                  key={s.key}
                  d={smoothPath(
                    points.map((p, i) => ({
                      x: xAt(i),
                      y: yAt(p.values[s.key] ?? 0),
                    }))
                  )}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={MARK.lineWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {active !== null && (
                <g
                  className="chart-crosshair"
                  style={{ transform: `translateX(${xAt(active)}px)` }}
                >
                  <line
                    x1="0"
                    x2="0"
                    y1={PAD.top}
                    y2={PAD.top + plotH}
                    stroke={CHART.axis}
                    strokeWidth="1"
                  />

                  {series.map((s) => (
                    <g
                      key={`dot-${s.key}`}
                      className="chart-marker"
                      style={{
                        transform: `translateY(${yAt(
                          points[active].values[s.key] ?? 0
                        )}px)`,
                      }}
                    >
                      <circle
                        r={MARK.markerRadius}
                        fill={s.color}
                        stroke={CHART.surface}
                        strokeWidth="2"
                      />
                    </g>
                  ))}
                </g>
              )}

              {xLabels.map((i) => (
                <text
                  key={`x-${points[i].key}`}
                  x={xAt(i)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="chart-tick"
                >
                  {points[i].label}
                </text>
              ))}
            </svg>
          )}
        </div>

        {tipVisible && (
          <div
            className="chart-tooltip"
            aria-hidden="true"
            style={{
              left: `${tipX}px`,
              top: `${yAt(
                Math.max(
                  ...series.map((s) => points[active].values[s.key] ?? 0)
                )
              ) - 6}px`,
            }}
          >
            <strong className="chart-tooltip-date">
              {points[active].label}
            </strong>

            {series.map((s) => (
              <div key={s.key} className="chart-tooltip-row">
                <span className="chart-key" style={{ background: s.color }} />
                <strong>{points[active].values[s.key] ?? 0}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
