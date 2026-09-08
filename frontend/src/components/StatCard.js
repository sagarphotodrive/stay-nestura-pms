const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: color }}>
      <Icon size={20} />
    </div>
    <div className="stat-content">
      <span className="stat-title">{title}</span>
      <span className="stat-value">{value}</span>
      {change && <span className="stat-change">{change}</span>}
    </div>
  </div>
);

export default StatCard;
