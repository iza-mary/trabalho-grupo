// src/components/Sidebar.js
import React from 'react';
import { ListGroup } from 'react-bootstrap';

function Sidebar({ events }) {
  return (
    <div>
      <h5>Eventos</h5>
      <ListGroup>
        {events.map((event) => (
          <ListGroup.Item key={event.id} style={{ borderLeft: `4px solid ${event.color}` }}>
            <strong>{event.title}</strong><br />
            <small>{event.start}</small>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}

export default Sidebar;
