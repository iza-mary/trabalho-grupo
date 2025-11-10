import { Card } from 'react-bootstrap';

export default function StatCard({ title, value, icon, variant = 'primary' }) {
  return (
    <Card className={`stat-card variant-${variant}`}> 
      <Card.Body className="d-flex align-items-center justify-content-between">
        <div>
          <div className="stat-label">{title}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className="stat-icon" aria-hidden="true">{icon}</div>
      </Card.Body>
    </Card>
  );
}