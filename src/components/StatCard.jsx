export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className = "",
}) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <div className="stat-top">
        <div className="stat-icon" aria-hidden="true">
          {Icon ? <Icon size={20} /> : null}
        </div>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-title">{title}</div>

      <div className="stat-description">{description}</div>
    </div>
  );
}
