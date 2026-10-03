import { humanizeEnum, isEmptyValue } from "../utils/format";

/**
 * Table cells shared by the case lists.
 *
 * Only the ones with a rule attached live here - a status whose class has to
 * match its badge colour, a notice date that is sometimes a stage rather than
 * a gap. Plain text cells stay in their own tables, where they are easier to
 * read than an indirection would be.
 */

export function StatusCell({ status }) {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      <span className="status-dot" aria-hidden="true" />
      {humanizeEnum(status)}
    </span>
  );
}

/**
 * A blank possession date is not missing data - the case is still inside the
 * 60-day s.13(2) window - so the cell says that rather than printing a dash
 * the reader has to interpret.
 */
export function PossessionCell({ date, format }) {
  if (isEmptyValue(date)) {
    return (
      <span
        className="cell-muted"
        title="Still inside the 60-day demand notice window"
      >
        Not served
      </span>
    );
  }

  return format(date);
}
