import { ListGroup } from 'react-bootstrap';

export default function RecentList({ items = [] }) {
  return (
    <ListGroup className="recent-list">
      {items.map((it) => (
        <ListGroup.Item key={it.id} className="d-flex flex-column">
          <span className="fw-semibold">{it.title}</span>
          <small className="text-muted">{it.meta}</small>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}