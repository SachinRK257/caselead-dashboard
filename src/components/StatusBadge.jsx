import { TIMELINE_STATUS_LABELS } from "../utils/cases";
import { humanizeEnum } from "../utils/format";

export default function StatusBadge({ status }) {
  if (!status) return null;

  const label = TIMELINE_STATUS_LABELS[status] ?? humanizeEnum(status);

  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}
