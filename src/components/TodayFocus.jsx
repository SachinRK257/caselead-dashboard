import { useMemo } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { formatRemainingDays } from "../utils/format";

/**
 * One plain sentence telling the salesperson where to start.
 *
 * The panels below answer "what is the state of everything"; this answers
 * "what do I do first", which is the question someone actually opens the
 * dashboard with. It names a single case so there is no counting or comparing
 * to be done before acting.
 */
export default function TodayFocus({ cases = [] }) {
  const focus = useMemo(() => {
    const overdue = cases.filter((c) => c.timelineStatus === "OVERDUE");
    const dueSoon = cases.filter((c) => c.timelineStatus === "DUE_SOON");
    const unassigned = cases.filter(
      (c) => c.allocationStatus === "NOT_ALLOCATED"
    );
    const visits = cases.filter((c) => c.bankVisit === "VISIT_PENDING");
    const papers = cases.filter((c) => c.documents === "DOCUMENTS_PENDING");

    // Most days past the deadline first; that is the one to ring today.
    const worst = [...overdue, ...dueSoon].sort(
      (a, b) => (a.remainingDays ?? 0) - (b.remainingDays ?? 0)
    )[0];

    return { overdue, dueSoon, unassigned, visits, papers, worst };
  }, [cases]);

  const { overdue, dueSoon, unassigned, visits, papers, worst } = focus;
  const urgent = overdue.length > 0;

  if (!worst && unassigned.length === 0) {
    return (
      <div className="focus-strip is-clear">
        <div className="focus-icon" aria-hidden="true">
          <CheckCircle2 size={20} />
        </div>
        <div className="focus-text">
          <strong>Nothing is late right now.</strong>
          <p>All your cases have time left. Keep the visits moving.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`focus-strip ${urgent ? "is-urgent" : "is-warning"}`}>
      <div className="focus-icon" aria-hidden="true">
        <TriangleAlert size={20} />
      </div>

      <div className="focus-text">
        <strong>
          {urgent
            ? `${overdue.length} ${overdue.length === 1 ? "case has" : "cases have"} passed the deadline.`
            : `${dueSoon.length} ${dueSoon.length === 1 ? "case is" : "cases are"} due this week.`}
        </strong>

        {worst && (
          <p>
            Start with <strong>{worst.borrower}</strong> ({worst.id}) at{" "}
            {worst.bank} {worst.branch} &mdash;{" "}
            {formatRemainingDays(worst.remainingDays).toLowerCase()}.
          </p>
        )}

        <ul className="focus-list">
          {dueSoon.length > 0 && urgent && (
            <li>{dueSoon.length} more due this week</li>
          )}
          {unassigned.length > 0 && (
            <li>{unassigned.length} not given to anyone yet</li>
          )}
          {visits.length > 0 && <li>{visits.length} bank visits still to do</li>}
          {papers.length > 0 && (
            <li>{papers.length} waiting for documents</li>
          )}
        </ul>
      </div>
    </div>
  );
}
