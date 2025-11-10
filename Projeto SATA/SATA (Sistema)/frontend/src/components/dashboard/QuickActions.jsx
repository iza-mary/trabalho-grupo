import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PeopleFill, BoxSeam, CalendarEvent, DoorClosed, BellFill, CashStack } from 'react-bootstrap-icons';

const actions = [
  { to: '/idosos', label: 'Gerenciar Idosos', icon: <PeopleFill /> },
  { to: '/internacoes', label: 'Internações', icon: <DoorClosed /> },
  { to: '/quartos', label: 'Quartos', icon: <DoorClosed /> },
  { to: '/eventos', label: 'Eventos', icon: <CalendarEvent /> },
  { to: '/produtos', label: 'Estoque', icon: <BoxSeam /> },
  { to: '/financeiro', label: 'Financeiro', icon: <CashStack /> },
  { to: '/notificacoes', label: 'Notificações', icon: <BellFill /> },
];

export default function QuickActions() {
  return (
    <Card className="quick-actions">
      <Card.Body>
        <Card.Title>Ações rápidas</Card.Title>
        <div className="d-grid gap-2 mt-3">
          {actions.map((a) => (
            <Button as={Link} to={a.to} key={a.label} variant="outline-primary" className="d-flex align-items-center justify-content-between">
              <span>{a.label}</span>
              <span aria-hidden="true" className="fs-5">{a.icon}</span>
            </Button>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}