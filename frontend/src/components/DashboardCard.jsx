const DashboardCard = ({ title, value, icon, tone = 'primary' }) => {
  return (
    <div className={`summary-card ${tone}`}>
      <div className="summary-card__head">
        <span className="summary-icon">{icon}</span>
        <span className="summary-label">{title}</span>
      </div>
      <h3>{value}</h3>
    </div>
  );
};

export default DashboardCard;
