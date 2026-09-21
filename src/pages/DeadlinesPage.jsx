import { useMemo } from "react";

import CaseTable from "../components/CaseTable";
import StackedBar from "../components/charts/StackedBar";
import { TIMELINE_COLORS } from "../components/charts/chartTokens";
import { buildTimelineMix, TIMELINE_STATUS_LABELS } from "../utils/cases";

const GROUPS = [
  {
    key: "OVERDUE",
    heading: "Past the deadline",
    note: "The date has gone. Deal with these today.",
  },
  {
    key: "DUE_SOON",
    heading: "Due very soon",
    note: "Still time, but not much.",
  },
  {
    key: "ON_TRACK",
    heading: "Plenty of time",
    note: "Nothing to do here yet.",
  },
];

/** Every case grouped by how much time is left, worst first. */
export default function DeadlinesPage({ cases = [] }) {
  const mix = useMemo(() => buildTimelineMix(cases), [cases]);

  const grouped = useMemo(() => {
    const out = { OVERDUE: [], DUE_SOON: [], ON_TRACK: [] };
    for (const item of cases) out[item.timelineStatus]?.push(item);
    for (const list of Object.values(out)) {
      list.sort((a, b) => (a.remainingDays ?? 0) - (b.remainingDays ?? 0));
    }
    return out;
  }, [cases]);

  return (
    <>
      <div className="panel full-panel">
        <div className="panel-header">
          <div>
            <h2>Deadline Summary</h2>
            <p>Where all {cases.length} cases stand right now</p>
          </div>
        </div>

        <div className="panel-chart">
          <StackedBar
            segments={GROUPS.map((g) => ({
              key: g.key,
              label: TIMELINE_STATUS_LABELS[g.key],
              value: mix[g.key],
              color: TIMELINE_COLORS[g.key],
            }))}
          />
        </div>
      </div>

      {GROUPS.map((group) => (
        <div className="panel full-panel" key={group.key}>
          <div className="panel-header">
            <div>
              <h2>
                {group.heading}
                <span className="count-chip">{grouped[group.key].length}</span>
              </h2>
              <p>{group.note}</p>
            </div>
          </div>

          <CaseTable
            cases={grouped[group.key]}
            emptyMessage="Nothing in this group."
          />
        </div>
      ))}
    </>
  );
}
