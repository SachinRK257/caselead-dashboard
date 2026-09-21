import { useState } from "react";

/**
 * Shared chart chrome: a positioned wrapper for the hover tooltip and a table
 * twin of the same data.
 *
 * The table is what keeps the charts honest. Several validated fills sit below
 * 3:1 against the panel surface, so values must be reachable without relying on
 * colour or hover; the table view is that route, and it doubles as the
 * screen-reader equivalent.
 */
export function ChartShell({ title, caption, rows, columns, children }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <div>
          <h3>{title}</h3>
          {caption && <p>{caption}</p>}
        </div>

        {rows && rows.length > 0 && (
          <button
            type="button"
            className="chart-toggle"
            aria-pressed={showTable}
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </figcaption>

      {showTable ? (
        <ChartTable rows={rows} columns={columns} />
      ) : (
        <div className="chart-body">{children}</div>
      )}
    </figure>
  );
}

/** Plain data table twin. Rendered visibly when toggled. */
export function ChartTable({ rows = [], columns = [] }) {
  return (
    <div className="chart-table-wrap">
      <table className="chart-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={i}>{cell}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Value leads, series name follows: the reader already knows the series. */
export function Tooltip({ hover, children }) {
  if (!hover) return null;

  return (
    <div
      className="chart-tooltip"
      aria-hidden="true"
      style={{ left: `${hover.x}px`, top: `${hover.y}px` }}
    >
      {children}
    </div>
  );
}

export function TooltipRow({ color, label, value }) {
  return (
    <div className="chart-tooltip-row">
      <span className="chart-key" style={{ background: color }} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
