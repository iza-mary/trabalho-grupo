import { useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import StatCard from '../components/dashboard/StatCard';
import { BoxSeam, CalendarEvent, CashStack, BellFill, PeopleFill, DoorClosed } from 'react-bootstrap-icons';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const stats = useMemo(() => ([
    { title: 'Idosos ativos', value: 42, icon: <PeopleFill />, variant: 'primary' },
    { title: 'Internações em andamento', value: 7, icon: <DoorClosed />, variant: 'purple' },
    { title: 'Eventos este mês', value: 5, icon: <CalendarEvent />, variant: 'success' },
    { title: 'Saldo financeiro', value: 'R$ 12.450', icon: <CashStack />, variant: 'teal' },
    { title: 'Itens em baixa', value: 9, icon: <BoxSeam />, variant: 'orange' },
    { title: 'Notificações não lidas', value: 3, icon: <BellFill />, variant: 'pink' },
  ]), []);

  return (
    <div className="dashboard-container">
      <Navbar />
      <Container fluid className="py-4 px-3 px-md-4">
        <Row className="g-3 justify-content-end">
          <Col xs={12} lg={4}>
            <div className="stats-right-column">
              {stats.map((s) => (
                <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} variant={s.variant} />
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}