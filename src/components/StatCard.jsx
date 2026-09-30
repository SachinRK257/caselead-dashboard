/**
 * A single headline figure: what it is, the number, then the caveat.
 *
 * Label first, value second. The label is the smaller type, so leading with it
 * costs nothing and means the number is never read before you know what it
 * counts.
 */
export default function StatCard({ title, value, description, className = "" }) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <div className="stat-title">{title}</div>

      <div className="stat-value">{value}</div>

      <div className="stat-description">{description}</div>
    </div>
  );
}
