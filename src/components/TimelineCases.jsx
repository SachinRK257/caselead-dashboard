import { useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import StackedBar from "./charts/StackedBar";
import { TIMELINE_COLORS } from "./charts/chartTokens";
import { buildTimelineMix, TIMELINE_STATUS_LABELS } from "../utils/cases";
import { formatDate, formatRemainingDays } from "../utils/format";

const MAX_ROWS = 5;

export default function TimelineCases({ cases = [] }) {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const dueSoon = useMemo(
    () => cases.filter((item) => item.timelineStatus === "DUE_SOON"),
    [cases]
  );

  const overdue = useMemo(
    () => cases.filter((item) => item.timelineStatus === "OVERDUE"),
    [cases]
  );

  const mix = useMemo(() => buildTimelineMix(cases), [cases]);

  // Overdue first, then the soonest deadline: the order a user acts in.
  const visible = useMemo(() => {
    const pool =
      statusFilter === "ALL"
        ? [...overdue, ...dueSoon]
        : cases.filter((item) => item.timelineStatus === statusFilter);

    return [...pool]
      .sort((a, b) => (a.remainingDays ?? 0) - (b.remainingDays ?? 0))
      .slice(0, MAX_ROWS);
  }, [cases, statusFilter, dueSoon, overdue]);

  return (
    <div className="panel timeline-panel">
      <div className="panel-header">
        <div>
          <h2>Deadlines</h2>
          <p>Finish these before the date runs out</p>
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          aria-label="Filter by deadline"
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="ON_TRACK">{TIMELINE_STATUS_LABELS.ON_TRACK}</option>
          <option value="DUE_SOON">{TIMELINE_STATUS_LABELS.DUE_SOON}</option>
          <option value="OVERDUE">{TIMELINE_STATUS_LABELS.OVERDUE}</option>
        </select>
      </div>

      <div className="panel-chart">
        <StackedBar
          selected={statusFilter}
          onSelect={setStatusFilter}
          segments={[
            {
              key: "ON_TRACK",
              label: TIMELINE_STATUS_LABELS.ON_TRACK,
              value: mix.ON_TRACK,
              color: TIMELINE_COLORS.ON_TRACK,
            },
            {
              key: "DUE_SOON",
              label: TIMELINE_STATUS_LABELS.DUE_SOON,
              value: mix.DUE_SOON,
              color: TIMELINE_COLORS.DUE_SOON,
            },
            {
              key: "OVERDUE",
              label: TIMELINE_STATUS_LABELS.OVERDUE,
              value: mix.OVERDUE,
              color: TIMELINE_COLORS.OVERDUE,
            },
          ]}
        />
      </div>

      <div className="timeline-summary">
        <div className="timeline-summary-card due">
          <div className="timeline-summary-icon" aria-hidden="true">
            <Clock3 size={18} />
          </div>
          <div>
            <strong>{dueSoon.length}</strong>
            <span>Due Soon</span>
          </div>
        </div>

        <div className="timeline-summary-card overdue">
          <div className="timeline-summary-icon" aria-hidden="true">
            <CalendarDays size={18} />
          </div>
          <div>
            <strong>{overdue.length}</strong>
            <span>Overdue</span>
          </div>
        </div>
      </div>

      <div className="timeline-list">
        {visible.length === 0 ? (
          <EmptyState message="No cases need timeline action right now." />
        ) : (
          visible.map((item) => (
            <div className="timeline-item" key={item.id}>
              <div className="timeline-person">
                <div className="small-avatar" aria-hidden="true">
                  {item.borrower.charAt(0)}
                </div>

                <div>
                  <strong>{item.borrower}</strong>
                  <span>{item.id}</span>
                </div>
              </div>

              <div className="deadline">
                <span>Deadline</span>
                <strong>{formatDate(item.requiredActionDate)}</strong>
              </div>

              <div className="remaining">
                <strong>{formatRemainingDays(item.remainingDays)}</strong>
              </div>

              <StatusBadge status={item.timelineStatus} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
