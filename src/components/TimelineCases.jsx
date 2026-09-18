import { useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import { TIMELINE_STATUS_LABELS } from "../utils/cases";
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

  // Overdue first, then the soonest deadline: the order a user acts in.
  const visible = useMemo(() => {
    const pool =
      statusFilter === "ALL"
        ? [...overdue, ...dueSoon]
        : statusFilter === "OVERDUE"
          ? overdue
          : dueSoon;

    return [...pool]
      .sort((a, b) => (a.remainingDays ?? 0) - (b.remainingDays ?? 0))
      .slice(0, MAX_ROWS);
  }, [statusFilter, dueSoon, overdue]);

  return (
    <div className="panel timeline-panel">
      <div className="panel-header">
        <div>
          <h2>Timeline Overview</h2>
          <p>Cases requiring timely action</p>
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          aria-label="Filter by timeline status"
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="DUE_SOON">{TIMELINE_STATUS_LABELS.DUE_SOON}</option>
          <option value="OVERDUE">{TIMELINE_STATUS_LABELS.OVERDUE}</option>
        </select>
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
