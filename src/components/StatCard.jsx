/**
 * A single headline figure: what it is, the number, then the caveat.
 *
 * Label first, value second. The label is the smaller type, so leading with it
 * costs nothing and means the number is never read before you know what it
 * counts.
 *
 * Given an `onClick` the card becomes a button for the set it counts, so the
 * figure is also the way to the cases behind it.
 */
export default function StatCard({
  title,
  value,
  description,
  className = "",
  onClick,
  active = false,
}) {
  const classes = `stat-card ${active ? "is-picked" : ""} ${className}`
    .replace(/\s+/g, " ")
    .trim();

  const body = (
    <>
      <span className="stat-title">{title}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-description">{description}</span>
    </>
  );

  if (!onClick) {
    return <div className={classes}>{body}</div>;
  }

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={active}
      onClick={onClick}
    >
      {body}
    </button>
  );
}
