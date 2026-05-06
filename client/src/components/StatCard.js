function StatCard({ title, value, accentClass = "" }) {
  return (
    <div className={`stat-card compact ${accentClass}`}>
      <span className="stat-label">{title}</span>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default StatCard;